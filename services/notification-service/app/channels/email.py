"""
Email Channel for Aero-Agent Notification Service (SMTP).
"""

import asyncio
import logging
import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger("notification.email")


class EmailChannel:
    """Send email notifications via SMTP."""

    MAX_RETRIES = 3
    RETRY_DELAY = 2.0  # seconds

    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_user: str,
        smtp_password: str,
        from_email: str,
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_password = smtp_password
        self.from_email = from_email

    def _build_message(self, to_email: str, subject: str, body: str) -> MIMEMultipart:
        """Build a MIME email message."""
        msg = MIMEMultipart("alternative")
        msg["From"] = self.from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg["X-Mailer"] = "Aero-Agent Notification Service v1.0"

        # Plain text part
        text_part = MIMEText(body, "plain", "utf-8")
        msg.attach(text_part)

        # HTML part (wrap plain text in basic HTML)
        html_body = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1a237e; color: white; padding: 15px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f5f5f5; }}
                .footer {{ padding: 10px; text-align: center; font-size: 12px; color: #999; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h2>Aero-Agent</h2></div>
                <div class="content"><p>{body.replace(chr(10), '<br>')}</p></div>
                <div class="footer">Aero-Agent Airline Crisis Management System</div>
            </div>
        </body>
        </html>
        """
        html_part = MIMEText(html_body, "html", "utf-8")
        msg.attach(html_part)

        return msg

    def _send_smtp(self, to_email: str, subject: str, body: str) -> str:
        """Send an email via SMTP (blocking)."""
        msg = self._build_message(to_email, subject, body)
        message_id = str(uuid.uuid4())

        if not self.smtp_user or not self.smtp_password:
            # Dry-run mode when credentials are not configured
            logger.info("DRY RUN – Email to %s: subject='%s'", to_email, subject)
            return f"dry-run-{message_id}"

        with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(self.smtp_user, self.smtp_password)
            server.send_message(msg)

        return message_id

    async def send(self, to_email: str, subject: str, body: str) -> Optional[str]:
        """
        Send an email with retry logic.

        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body (plain text)

        Returns:
            Message ID on success

        Raises:
            RuntimeError: After all retries exhausted
        """
        last_error = None

        for attempt in range(1, self.MAX_RETRIES + 1):
            try:
                logger.info(
                    "Sending email to %s (attempt %d/%d)",
                    to_email, attempt, self.MAX_RETRIES,
                )

                loop = asyncio.get_event_loop()
                msg_id = await loop.run_in_executor(
                    None, self._send_smtp, to_email, subject, body
                )

                logger.info("Email sent: id=%s to=%s", msg_id, to_email)
                return msg_id

            except Exception as e:
                last_error = e
                logger.warning(
                    "Email send failed (attempt %d/%d): %s",
                    attempt, self.MAX_RETRIES, str(e),
                )
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAY * attempt)

        raise RuntimeError(
            f"Failed to send email to {to_email} after {self.MAX_RETRIES} attempts: {last_error}"
        )
