"""
Twilio WhatsApp Channel for Aero-Agent Notification Service.
"""

import asyncio
import logging
from typing import Optional

logger = logging.getLogger("notification.whatsapp")


class TwilioWhatsAppChannel:
    """Send WhatsApp messages via Twilio WhatsApp Business API."""

    MAX_RETRIES = 3
    RETRY_DELAY = 1.0  # seconds

    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        # WhatsApp numbers must be prefixed with "whatsapp:"
        self.from_number = (
            from_number if from_number.startswith("whatsapp:") else f"whatsapp:{from_number}"
        )
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
        Send a WhatsApp message with retry logic.

        Args:
            to_number: Recipient phone number (E.164 format, e.g. +905551234567)
            message: WhatsApp message body

        Returns:
            Twilio message SID on success

        Raises:
            RuntimeError: After all retries are exhausted
        """
        # Ensure WhatsApp prefix
        whatsapp_to = (
            to_number if to_number.startswith("whatsapp:") else f"whatsapp:{to_number}"
        )

        last_error = None

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                logger.info(
                    "Sending WhatsApp message to %s (attempt %d/%d)",
                    to_number, attempt, self.MAX_RETRIES,
                )

                loop = asyncio.get_event_loop()
                twilio_message = await loop.run_in_executor(
                    None,
                    lambda: self.client.messages.create(
                        body=message,
                        from_=self.from_number,
                        to=whatsapp_to,
                    ),
                )

                logger.info(
                    "WhatsApp message sent: sid=%s to=%s status=%s",
                    twilio_message.sid, to_number, twilio_message.status,
                )
                return twilio_message.sid

            except Exception as e:
                last_error = e
                logger.warning(
                    "WhatsApp send failed (attempt %d/%d): %s",
                    attempt, self.MAX_RETRIES, str(e),
                )
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAY * attempt)

        raise RuntimeError(
            f"Failed to send WhatsApp to {to_number} after {self.MAX_RETRIES} attempts: {last_error}"
        )
