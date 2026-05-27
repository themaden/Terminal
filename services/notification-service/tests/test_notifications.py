"""
Tests for Aero-Agent Notification Channels.
"""

import asyncio
import time
import unittest
from unittest.mock import patch, MagicMock, AsyncMock

from app.rate_limiter import TokenBucketRateLimiter


class TestTokenBucketRateLimiter(unittest.TestCase):
    """Tests for the token bucket rate limiter."""

    def test_initial_tokens(self):
        limiter = TokenBucketRateLimiter(rate=10, capacity=20)
        self.assertEqual(limiter.available_tokens(), 20.0)

    def test_acquire_decrements_tokens(self):
        limiter = TokenBucketRateLimiter(rate=10, capacity=10)
        self.assertTrue(limiter.acquire())
        tokens = limiter.available_tokens()
        self.assertLess(tokens, 10.0)

    def test_acquire_fails_when_empty(self):
        limiter = TokenBucketRateLimiter(rate=1, capacity=1)
        self.assertTrue(limiter.acquire())  # Use the single token
        self.assertFalse(limiter.acquire())  # Should fail

    def test_tokens_refill_over_time(self):
        limiter = TokenBucketRateLimiter(rate=100, capacity=100)
        # Drain all tokens
        for _ in range(100):
            limiter.acquire()
        self.assertFalse(limiter.acquire())
        # Wait for refill
        time.sleep(0.05)  # 50ms = ~5 tokens at rate=100
        self.assertTrue(limiter.acquire())

    def test_capacity_limit(self):
        limiter = TokenBucketRateLimiter(rate=1000, capacity=5)
        time.sleep(0.1)  # Should not exceed capacity
        tokens = limiter.available_tokens()
        self.assertLessEqual(tokens, 5.0)

    def test_wait_and_acquire(self):
        limiter = TokenBucketRateLimiter(rate=100, capacity=1)
        self.assertTrue(limiter.acquire())
        # Token is empty now, but wait_and_acquire should wait for refill
        result = limiter.wait_and_acquire(timeout=1.0)
        self.assertTrue(result)

    def test_wait_and_acquire_timeout(self):
        limiter = TokenBucketRateLimiter(rate=1, capacity=1)
        self.assertTrue(limiter.acquire())
        # Very short timeout - should fail
        result = limiter.wait_and_acquire(timeout=0.01)
        self.assertFalse(result)


class TestSMSChannel(unittest.TestCase):
    """Tests for SMS channel."""

    @patch("app.channels.sms.TwilioSMSChannel.client", new_callable=lambda: property(lambda self: MagicMock()))
    def test_sms_send_creates_message(self, mock_client_prop):
        from app.channels.sms import TwilioSMSChannel

        channel = TwilioSMSChannel(
            account_sid="test_sid",
            auth_token="test_token",
            from_number="+1234567890",
        )

        mock_message = MagicMock()
        mock_message.sid = "SM_test_123"
        mock_message.status = "queued"

        channel._client = MagicMock()
        channel._client.messages.create.return_value = mock_message

        result = asyncio.get_event_loop().run_until_complete(
            channel.send("+905551234567", "Test message")
        )

        self.assertEqual(result, "SM_test_123")
        channel._client.messages.create.assert_called_once()


class TestWhatsAppChannel(unittest.TestCase):
    """Tests for WhatsApp channel."""

    def test_whatsapp_prefix_added(self):
        from app.channels.whatsapp import TwilioWhatsAppChannel

        channel = TwilioWhatsAppChannel(
            account_sid="test_sid",
            auth_token="test_token",
            from_number="+1234567890",
        )
        self.assertTrue(channel.from_number.startswith("whatsapp:"))

    def test_whatsapp_prefix_not_duplicated(self):
        from app.channels.whatsapp import TwilioWhatsAppChannel

        channel = TwilioWhatsAppChannel(
            account_sid="test_sid",
            auth_token="test_token",
            from_number="whatsapp:+1234567890",
        )
        self.assertEqual(channel.from_number, "whatsapp:+1234567890")


class TestEmailChannel(unittest.TestCase):
    """Tests for email channel."""

    def test_dry_run_mode(self):
        from app.channels.email import EmailChannel

        channel = EmailChannel(
            smtp_host="smtp.test.com",
            smtp_port=587,
            smtp_user="",  # Empty = dry run
            smtp_password="",
            from_email="test@test.com",
        )

        result = asyncio.get_event_loop().run_until_complete(
            channel.send("user@test.com", "Test Subject", "Test body")
        )

        self.assertTrue(result.startswith("dry-run-"))

    def test_build_message_structure(self):
        from app.channels.email import EmailChannel

        channel = EmailChannel(
            smtp_host="smtp.test.com",
            smtp_port=587,
            smtp_user="user",
            smtp_password="pass",
            from_email="test@test.com",
        )

        msg = channel._build_message("to@test.com", "Subject", "Body")
        self.assertEqual(msg["From"], "test@test.com")
        self.assertEqual(msg["To"], "to@test.com")
        self.assertEqual(msg["Subject"], "Subject")


class TestTemplateLoading(unittest.TestCase):
    """Tests for template loading."""

    def test_load_cancellation_en(self):
        import os
        template_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "app", "templates"
        )
        filepath = os.path.join(template_dir, "cancellation_en.txt")
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            self.assertIn("{{passenger_name}}", content)
            self.assertIn("{{flight_number}}", content)


if __name__ == "__main__":
    unittest.main()
