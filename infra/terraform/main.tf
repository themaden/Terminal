# ─────────────────────────────────────────────────────────────────────────────
# JetNexus AI — Terraform Main Configuration
# Provider: AWS (extend for GCP/Azure as needed)
# ─────────────────────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state backend (configure S3 bucket before running)
  backend "s3" {
    bucket = "jetnexus-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "eu-central-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# ─── VPC ──────────────────────────────────────────────────────────────────────

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.0"

  name = "jetnexus-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = local.common_tags
}

# ─── EKS Cluster ──────────────────────────────────────────────────────────────

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.0.0"

  cluster_name    = "jetnexus-cluster"
  cluster_version = "1.29"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    general = {
      min_size       = 2
      max_size       = 6
      desired_size   = 2
      instance_types = ["t3.medium"]
    }
  }

  tags = local.common_tags
}

# ─── RDS PostgreSQL ───────────────────────────────────────────────────────────

resource "aws_db_instance" "jetnexus_postgres" {
  identifier        = "jetnexus-postgres"
  engine            = "postgres"
  engine_version    = "16.2"
  instance_class    = "db.t3.medium"
  allocated_storage = 20
  storage_encrypted = true

  db_name  = "jetnexus"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.jetnexus.name

  backup_retention_period = 7
  deletion_protection     = true
  skip_final_snapshot     = false

  tags = local.common_tags
}

resource "aws_db_subnet_group" "jetnexus" {
  name       = "jetnexus-db-subnet-group"
  subnet_ids = module.vpc.private_subnets
  tags       = local.common_tags
}

# ─── ElastiCache Redis ────────────────────────────────────────────────────────

resource "aws_elasticache_cluster" "jetnexus_redis" {
  cluster_id           = "jetnexus-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.jetnexus.name
  security_group_ids   = [aws_security_group.redis.id]

  tags = local.common_tags
}

resource "aws_elasticache_subnet_group" "jetnexus" {
  name       = "jetnexus-redis-subnet"
  subnet_ids = module.vpc.private_subnets
}

# ─── Security Groups ──────────────────────────────────────────────────────────

resource "aws_security_group" "rds" {
  name   = "jetnexus-rds-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  tags = local.common_tags
}

resource "aws_security_group" "redis" {
  name   = "jetnexus-redis-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [module.vpc.vpc_cidr_block]
  }

  tags = local.common_tags
}

# ─── Locals ───────────────────────────────────────────────────────────────────

locals {
  common_tags = {
    Project     = "jetnexus-ai"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
