"""JWT Authentication — login, token refresh, user management."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_role
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.db.models import UserDB

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    avatar: str
    is_active: bool
    created_at: str
    last_login: str | None


class CreateUserRequest(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "operator"
    avatar: str = "OP"


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email + password, return JWT access token."""
    result = await db.execute(select(UserDB).where(UserDB.email == req.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz e-posta veya şifre",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hesap devre dışı")

    user.last_login = datetime.utcnow()
    await db.commit()

    token = create_access_token(subject=user.email, role=user.role)
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.full_name,
            "role": user.role,
            "avatar": user.avatar,
        },
    )


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return the currently authenticated user's profile."""
    result = await db.execute(select(UserDB).where(UserDB.email == current_user["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "avatar": user.avatar,
        "last_login": user.last_login.isoformat() if user.last_login else None,
    }


@router.get("/users", response_model=list[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_role("admin")),
):
    """List all users — admin only."""
    result = await db.execute(select(UserDB).order_by(UserDB.created_at))
    users = result.scalars().all()
    return [
        UserOut(
            id=u.id, email=u.email, full_name=u.full_name, role=u.role,
            avatar=u.avatar, is_active=u.is_active,
            created_at=u.created_at.isoformat(),
            last_login=u.last_login.isoformat() if u.last_login else None,
        )
        for u in users
    ]


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    req: CreateUserRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_role("admin")),
):
    """Create a new user — admin only."""
    existing = await db.execute(select(UserDB).where(UserDB.email == req.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")

    user = UserDB(
        email=req.email.lower(),
        full_name=req.full_name,
        hashed_password=hash_password(req.password),
        role=req.role,
        avatar=req.avatar,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserOut(
        id=user.id, email=user.email, full_name=user.full_name, role=user.role,
        avatar=user.avatar, is_active=user.is_active,
        created_at=user.created_at.isoformat(), last_login=None,
    )
