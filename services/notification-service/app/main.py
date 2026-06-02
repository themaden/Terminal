from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import List
import os
from twilio.rest import Client
import logging

app = FastAPI(
    title="Aero-Agent Notification Service",
    version="0.1.0",
    description="Twilio SMS & WhatsApp Business Messaging Microservice"
)

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NotificationSvc")

# Load Twilio configuration from environment
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "mock_token")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "+15551234567")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

# Init Twilio Client safely (will not throw on initialization with mock SID)
twilio_client = None
if "mock" not in TWILIO_AUTH_TOKEN and TWILIO_ACCOUNT_SID != "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx":
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Twilio client: {e}", exc_info=True)
        twilio_client = None
else:
    logger.warning("Using placeholder Twilio credentials - notifications will not be sent")

class NotificationPayload(BaseModel):
    passenger_name: str
    phone_number: str
    channel: str = Field("SMS", description="SMS or WHATSAPP")
    message_tr: str
    message_en: str

class BulkNotificationPayload(BaseModel):
    notifications: List[NotificationPayload]

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "twilio_configured": twilio_client is not None,
        "microservice": "Aero-Agent Notification Service (Python)"
    }

@app.post("/api/v1/notify", status_code=status.HTTP_202_ACCEPTED)
async def send_notification(payload: NotificationPayload):
    msg = payload.message_tr # Default Turkish
    if not payload.phone_number.startswith("+90"):
        msg = payload.message_en

    logger.info(f"Dispatching notification via {payload.channel} to {payload.phone_number}: {msg[:50]}...")

    if twilio_client:
        try:
            if payload.channel.upper() == "WHATSAPP":
                # Ensure whatsapp prefix is present for Twilio
                to_num = payload.phone_number
                if not to_num.startswith("whatsapp:"):
                    to_num = f"whatsapp:{to_num}"
                
                message = twilio_client.messages.create(
                    body=msg,
                    from_=TWILIO_WHATSAPP_FROM,
                    to=to_num
                )
            else:
                message = twilio_client.messages.create(
                    body=msg,
                    from_=TWILIO_FROM_NUMBER,
                    to=payload.phone_number
                )
            return {"status": "sent", "sid": message.sid}
        except Exception as e:
            logger.error(f"Twilio messaging failure: {e}")
            raise HTTPException(status_code=500, detail=f"Twilio Service failure: {str(e)}")
    else:
        logger.warning("Twilio is not configured. Running in Mock/Console Log mode.")
        return {
            "status": "mock_sent_to_console",
            "message_sent": msg,
            "recipient": payload.phone_number,
            "channel": payload.channel
        }

@app.post("/api/v1/notify/bulk", status_code=status.HTTP_202_ACCEPTED)
async def send_bulk_notifications(payload: BulkNotificationPayload):
    results = []
    for notif in payload.notifications:
        try:
            res = await send_notification(notif)
            results.append({"phone": notif.phone_number, "status": "success", "detail": res})
        except Exception as e:
            results.append({"phone": notif.phone_number, "status": "failed", "error": str(e)})
    return {"processed_count": len(payload.notifications), "results": results}
