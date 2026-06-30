"""Plump backend stubs — ThoughtSnap Labs.

Render / FastAPI / MongoDB-ready. The mobile app does NOT depend on this being
live; every endpoint degrades gracefully and never crashes if Mongo is absent.
"""

from fastapi import FastAPI, APIRouter, Request, Depends, Header, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import hashlib
import hmac
import time
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Any, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("plump")

# --- Mongo (optional) ---------------------------------------------------------
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "plump")
device_auth_secret = os.environ.get("PLUMP_DEVICE_AUTH_SECRET")
MAX_SIGNATURE_AGE_SECONDS = 300
client: Optional[AsyncIOMotorClient] = None
db = None
if mongo_url:
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
        db = client[db_name]
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("Mongo unavailable, running stateless: %s", exc)

app = FastAPI(title="Plump API", version="1.0.0")
api_router = APIRouter(prefix="/api")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def safe_insert(collection: str, doc: dict[str, Any]) -> None:
    if db is None:
        return
    try:
        await db[collection].insert_one(doc)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("insert into %s failed: %s", collection, exc)



# --- Device write auth --------------------------------------------------------
def compute_device_signature(secret: str, timestamp: str, device_id: str, raw_body: bytes) -> str:
    message = timestamp.encode("utf-8") + b"." + device_id.encode("utf-8") + b"." + raw_body
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


async def require_signed_device_write(
    request: Request,
    x_plump_device_id: Optional[str] = Header(default=None),
    x_plump_timestamp: Optional[str] = Header(default=None),
    x_plump_signature: Optional[str] = Header(default=None),
) -> dict[str, str]:
    if not device_auth_secret:
        logger.error("PLUMP_DEVICE_AUTH_SECRET is not configured")
        raise HTTPException(status_code=503, detail="device auth not configured")

    if not x_plump_device_id or not x_plump_timestamp or not x_plump_signature:
        raise HTTPException(status_code=401, detail="missing device signature headers")

    try:
        timestamp_int = int(x_plump_timestamp)
    except ValueError:
        raise HTTPException(status_code=401, detail="invalid device timestamp") from None

    now = int(time.time())
    if abs(now - timestamp_int) > MAX_SIGNATURE_AGE_SECONDS:
        raise HTTPException(status_code=401, detail="device signature timestamp expired")

    raw_body = await request.body()
    expected = compute_device_signature(device_auth_secret, x_plump_timestamp, x_plump_device_id, raw_body)

    if not hmac.compare_digest(expected, x_plump_signature):
        raise HTTPException(status_code=403, detail="invalid device signature")

    return {"device_id": x_plump_device_id, "timestamp": x_plump_timestamp}


# --- Models -------------------------------------------------------------------
class EventBatch(BaseModel):
    events: list[dict[str, Any]] = Field(default_factory=list)


class SyncPayload(BaseModel):
    goals: list[dict[str, Any]] = Field(default_factory=list)
    deposits: list[dict[str, Any]] = Field(default_factory=list)
    device_id: Optional[str] = None


class TransactionPayload(BaseModel):
    receipt: Optional[str] = None
    productId: Optional[str] = None
    originalTransactionId: Optional[str] = None


# --- Health -------------------------------------------------------------------
@api_router.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "service": "plump", "mongo": db is not None, "time": now_iso()}


@api_router.get("/")
async def root() -> dict[str, str]:
    return {"message": "Plump API by ThoughtSnap Labs"}


# --- Remote config ------------------------------------------------------------
@api_router.get("/v1/config")
async def config() -> dict[str, Any]:
    return {
        "paywallVariant": "annual_hero_lifetime_alt",
        "products": {"monthly": "plump.monthly", "annual": "plump.annual", "lifetime": "plump.lifetime"},
        "prices": {"monthly": "£6.99/month", "annual": "£29.99/year", "lifetime": "£49.99 once"},
        "annualTrialDays": 3,
        "reviewPromptEnabled": True,
        "cardWatermark": "plump.app",
    }


# --- Telemetry ----------------------------------------------------------------
@api_router.post("/v1/events")
async def events(batch: EventBatch, _auth: dict[str, str] = Depends(require_signed_device_write)) -> dict[str, Any]:
    await safe_insert("events", {"events": batch.events, "received_at": now_iso()})
    return {"accepted": len(batch.events)}


# --- Sync ---------------------------------------------------------------------
@api_router.post("/v1/sync")
async def sync(payload: SyncPayload, _auth: dict[str, str] = Depends(require_signed_device_write)) -> dict[str, Any]:
    await safe_insert(
        "sync",
        {
            "device_id": payload.device_id,
            "goals": payload.goals,
            "deposits": payload.deposits,
            "received_at": now_iso(),
        },
    )
    return {"status": "ok", "goals": len(payload.goals), "deposits": len(payload.deposits)}


# --- Transaction validation (stub) -------------------------------------------
@api_router.post("/v1/validate-transaction")
async def validate_transaction(payload: TransactionPayload) -> dict[str, Any]:
    # V1 stub: device-cached entitlement is the source of truth. A future
    # implementation verifies the JWS / receipt against App Store Server API.
    await safe_insert("transactions", {**payload.model_dump(), "received_at": now_iso()})
    return {
        "valid": True,
        "productId": payload.productId,
        "status": "active",
        "environment": "sandbox",
    }


# --- App Store Server Notifications (stub) ------------------------------------
@api_router.post("/v1/app-store-notifications")
async def app_store_notifications(request: Request) -> dict[str, Any]:
    try:
        body = await request.json()
    except Exception:
        body = {}
    await safe_insert("appstore_notifications", {"payload": body, "received_at": now_iso()})
    return {"received": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    if client is not None:
        client.close()
