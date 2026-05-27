"""
Twilio SMS Channel for Aero-Agent Notification Service.
"""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger("notification.sms")


class TwilioSMSChannel:
    """Send SMS messages via Twilio REST API."""

    MAX_RETRIES = 3
    RETRY_DELAY = 1.0  # seconds

    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number
        self._client = None

    @property
    def client(self):
        """Lazy-initialize the Twilio client."""
        if self._client is None:
            from twilio.rest import Client
            self._client = Client(self.account_sid, self.auth_token)
        return self._client

    async def send(self, to_number: str, message: str) -> Optional[str]:
        """
        Send an SMS message with retry logic.

        Args:
            to_number: Recipient phone number (E.164 format, e.g. +905551234567)
            message: SMS body text

        Returns:
            Twilio message SID on success

        Raises:
            RuntimeError: After all retries are exhausted
        """
        last_error = None

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                logger.info(
                    "Sending SMS to %s (attempt %d/%d)",
                    to_number, attempt, self.MAX_RETRIES,
                )

                # Run Twilio API call in executor to avoid blocking
                loop = asyncio.get_event_loop()
                twilio_message = await loop.run_in_executor(
                    None,
                    lambda: self.client.messages.create(
                        body=message,
                        from_=self.from_number,
                        to=to_number,
                    ),
                )

                logger.info(
                    "SMS sent successfully: sid=%s to=%s status=%s",
                    twilio_message.sid, to_number, twilio_message.status,
                )
                return twilio_message.sid

            except Exception as e:
                last_error = e
                logger.warning(
                    "SMS send failed (attempt %d/%d): %s",
                    attempt, self.MAX_RETRIES, str(e),
                )
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAY * attempt)

        raise RuntimeError(
            f"Failed to send SMS to {to_number} after {self.MAX_RETRIES} attempts: {last_error}"
        )
