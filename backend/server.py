"""Plump backend stubs — ThoughtSnap Labs.

Render / FastAPI / MongoDB-ready. The mobile app does NOT depend on this being
live; every endpoint degrades gracefully and never crashes if Mongo is absent.
"""

from fastapi import FastAPI, APIRouter, Request, Depends, Header, HTTPException
from fastapi.responses import HTMLResponse
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
from collections import Counter
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("plump")

# --- Mongo (optional) ---------------------------------------------------------
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME", "plump")
device_auth_secret = os.environ.get("PLUMP_DEVICE_AUTH_SECRET")
live_ops_admin_token = os.environ.get("LIVE_OPS_ADMIN_TOKEN")
apple_commission_rate = float(os.environ.get("APPLE_COMMISSION_RATE", "0.15"))
price_table = {
    "plump.monthly": float(os.environ.get("PLUMP_MONTHLY_PRICE", "6.99")),
    "plump.annual": float(os.environ.get("PLUMP_ANNUAL_PRICE", "29.99")),
    "plump.lifetime": float(os.environ.get("PLUMP_LIFETIME_PRICE", "49.99")),
}
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


async def safe_replace(collection: str, filter_doc: dict[str, Any], doc: dict[str, Any]) -> None:
    if db is None:
        return
    try:
        await db[collection].replace_one(filter_doc, doc, upsert=True)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("replace into %s failed: %s", collection, exc)



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
    await safe_insert("events", {"events": batch.events, "device_id": _auth.get("device_id"), "received_at": now_iso()})
    return {"accepted": len(batch.events)}


# --- Minimal Live Ops ---------------------------------------------------------
LIVE_OPS_EVENT_ALLOWLIST = {
    "app_open",
    "onboarding_start",
    "card_generated",
    "paywall_shown",
    "trial_started",
    "purchase_completed",
    "lifetime_purchase_completed",
    "restore_completed",
}


def require_live_ops_admin(token: Optional[str] = None, x_live_ops_token: Optional[str] = None) -> None:
    supplied = x_live_ops_token or token
    if not live_ops_admin_token:
        raise HTTPException(status_code=503, detail="live ops admin token not configured")
    if not supplied or not hmac.compare_digest(str(supplied), str(live_ops_admin_token)):
        raise HTTPException(status_code=401, detail="unauthorized")


def live_ops_plan_for_product_id(product_id: str) -> str:
    if product_id == "plump.monthly":
        return "monthly"
    if product_id == "plump.annual":
        return "annual"
    if product_id == "plump.lifetime":
        return "lifetime"
    return "unknown"


def live_ops_product_id_for_event(event: dict[str, Any]) -> str:
    props = event.get("props") if isinstance(event.get("props"), dict) else {}
    product_id = str(props.get("productId") or "")
    if product_id in price_table:
        return product_id
    name = str(event.get("name") or "")
    if name == "lifetime_purchase_completed":
        return "plump.lifetime"
    if name == "trial_started":
        return "plump.annual"
    if name == "purchase_completed":
        return "plump.monthly"
    return ""


def parse_event_time(value: Any, fallback: str) -> datetime:
    raw = str(value or fallback or now_iso()).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(raw)
    except ValueError:
        parsed = datetime.now(timezone.utc)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def flatten_event_batches(docs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    flattened: list[dict[str, Any]] = []
    for doc in docs:
        device_id = doc.get("device_id") or "unknown"
        received_at = doc.get("received_at") or now_iso()
        for event in doc.get("events", []):
            if not isinstance(event, dict):
                continue
            name = str(event.get("name") or "")
            if name not in LIVE_OPS_EVENT_ALLOWLIST:
                continue
            props = event.get("props") if isinstance(event.get("props"), dict) else {}
            flattened.append({"name": name, "props": props, "device_id": device_id, "ts": event.get("ts") or received_at, "received_at": received_at})
    return flattened


def summarize_live_ops_events(events: list[dict[str, Any]]) -> dict[str, Any]:
    current = datetime.now(timezone.utc)
    today_start = current.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    installs: set[str] = set()
    onboarding_started: set[str] = set()
    onboarding_completed: set[str] = set()
    paywall_seen: set[str] = set()
    converted: dict[str, dict[str, Any]] = {}
    install_sources: Counter[str] = Counter()
    conversions_by_plan: Counter[str] = Counter({"monthly": 0, "annual": 0, "lifetime": 0, "unknown": 0})
    revenue = {"todayGross": 0.0, "weekGross": 0.0, "monthGross": 0.0, "todayNet": 0.0, "weekNet": 0.0, "monthNet": 0.0}
    recent_conversions: list[dict[str, Any]] = []

    for event in events:
        name = str(event.get("name") or "")
        device_id = str(event.get("device_id") or "unknown")
        props = event.get("props") if isinstance(event.get("props"), dict) else {}
        ts = parse_event_time(event.get("ts"), str(event.get("received_at") or ""))

        if name == "app_open":
            installs.add(device_id)
            source = str(props.get("installSource") or props.get("source") or "unknown")
            install_sources[source] += 1
        elif name == "onboarding_start":
            onboarding_started.add(device_id)
        elif name == "card_generated":
            onboarding_completed.add(device_id)
        elif name == "paywall_shown":
            paywall_seen.add(device_id)

        if name not in {"purchase_completed", "lifetime_purchase_completed", "trial_started"}:
            continue

        product_id = live_ops_product_id_for_event(event)
        plan = live_ops_plan_for_product_id(product_id)
        converted[device_id] = {"plan": plan, "productId": product_id, "ts": ts.isoformat()}
        conversions_by_plan[plan] += 1

        gross = float(price_table.get(product_id, 0.0))
        net = gross * (1 - apple_commission_rate)

        if ts >= today_start:
            revenue["todayGross"] += gross
            revenue["todayNet"] += net
        if ts >= week_start:
            revenue["weekGross"] += gross
            revenue["weekNet"] += net
        if ts >= month_start:
            revenue["monthGross"] += gross
            revenue["monthNet"] += net

        recent_conversions.append({"ts": ts.isoformat(), "deviceId": device_id, "plan": plan, "productId": product_id, "gross": round(gross, 2), "net": round(net, 2)})

    converted_devices = set(converted.keys())
    completed_not_converted = [device_id for device_id in onboarding_completed if device_id not in converted_devices]

    return {
        "generatedAt": now_iso(),
        "refreshSeconds": 30,
        "appleCommissionRate": apple_commission_rate,
        "funnel": {
            "installs": len(installs),
            "onboardingStarted": len(onboarding_started),
            "onboardingCompleted": len(onboarding_completed),
            "paywallSeen": len(paywall_seen),
            "converted": len(converted_devices),
            "onboardingCompletedNotConverted": len(completed_not_converted),
        },
        "conversionsByPlan": dict(conversions_by_plan),
        "installSources": dict(install_sources),
        "revenue": {key: round(value, 2) for key, value in revenue.items()},
        "recentConversions": sorted(recent_conversions, key=lambda row: row["ts"], reverse=True)[:25],
    }


async def read_live_ops_event_docs(limit: int = 10000) -> list[dict[str, Any]]:
    if db is None:
        return []
    try:
        cursor = db["events"].find({}, {"_id": 0}).sort("received_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("live ops summary read failed: %s", exc)
        return []


def live_ops_dashboard_html(token: str) -> str:
    safe_token = str(token or "").replace('"', "&quot;")
    return f"""<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Plump Live Ops</title>
<style>:root{{--cream:#FBF4E9;--brown:#5A4632;--muted:#9C8B76;--green:#3F8C32;--border:#E6DACB;--white:#FFFFFF;--rose:#F2A6A0}}*{{box-sizing:border-box}}body{{margin:0;background:var(--cream);color:var(--brown);font-family:ui-rounded,"Nunito",system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}}.wrap{{max-width:1180px;margin:0 auto;padding:28px}}.hero{{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px;border:1px solid var(--border);border-radius:28px;background:linear-gradient(135deg,#fffaf2,#f8ead7);box-shadow:0 14px 32px rgba(90,70,50,.10)}}h1{{margin:0;font-size:34px;letter-spacing:-.03em}}.muted{{color:var(--muted)}}.pill{{background:var(--green);color:white;border-radius:999px;padding:10px 14px;font-weight:800}}.grid{{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-top:18px}}.card{{background:var(--white);border:1px solid var(--border);border-radius:22px;padding:18px;box-shadow:0 8px 22px rgba(90,70,50,.07)}}.metric{{font-size:34px;font-weight:900;margin-top:6px;letter-spacing:-.03em}}.label{{color:var(--muted);font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}}.wide{{grid-column:span 3}}.half{{grid-column:span 3}}.third{{grid-column:span 2}}table{{width:100%;border-collapse:collapse;margin-top:8px}}td,th{{padding:10px 8px;border-bottom:1px solid var(--border);text-align:left;font-size:14px}}th{{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em}}.money{{color:var(--green)}}.error{{background:#fff0ef;border-color:var(--rose);color:#8a2d25}}@media (max-width:900px){{.grid{{grid-template-columns:repeat(2,1fr)}}.wide,.half,.third{{grid-column:span 2}}.hero{{align-items:flex-start;flex-direction:column}}}}</style>
</head><body><div class="wrap"><section class="hero"><div><h1>🐻 Plump Live Ops</h1><div class="muted">Minimal funnel + revenue view. Auto-refreshes every 30 seconds.</div></div><div class="pill" id="status">Loading…</div></section><section class="grid">
<div class="card third"><div class="label">Installs / Opens</div><div class="metric" id="installs">—</div></div><div class="card third"><div class="label">Onboarding Started</div><div class="metric" id="started">—</div></div><div class="card third"><div class="label">Onboarding Complete</div><div class="metric" id="completed">—</div></div><div class="card third"><div class="label">Paywall Seen</div><div class="metric" id="paywall">—</div></div><div class="card third"><div class="label">Converted</div><div class="metric" id="converted">—</div></div><div class="card third"><div class="label">Completed Not Converted</div><div class="metric" id="notConverted">—</div></div><div class="card third"><div class="label">Revenue Today Net</div><div class="metric money" id="todayNet">—</div></div><div class="card third"><div class="label">Revenue Week Net</div><div class="metric money" id="weekNet">—</div></div><div class="card third"><div class="label">Revenue Month Net</div><div class="metric money" id="monthNet">—</div></div><div class="card half"><div class="label">Conversions by Plan</div><table><tbody id="plans"></tbody></table></div><div class="card half"><div class="label">Install Source</div><table><tbody id="sources"></tbody></table></div><div class="card wide"><div class="label">Recent Conversions</div><table><thead><tr><th>Time</th><th>Plan</th><th>Product</th><th>Net</th></tr></thead><tbody id="recent"></tbody></table></div></section></div>
<script>const token="{safe_token}";const money=value=>"£"+Number(value||0).toFixed(2);function rowsFromObject(obj){{const entries=Object.entries(obj||{{}});if(!entries.length)return '<tr><td class="muted">No data yet</td><td></td></tr>';return entries.map(([k,v])=>'<tr><td>'+k+'</td><td><strong>'+v+'</strong></td></tr>').join('')}}async function refresh(){{const status=document.getElementById('status');try{{const res=await fetch('/api/live-ops/summary?token='+encodeURIComponent(token),{{cache:'no-store'}});if(!res.ok)throw new Error('HTTP '+res.status);const data=await res.json();document.getElementById('installs').textContent=data.funnel.installs;document.getElementById('started').textContent=data.funnel.onboardingStarted;document.getElementById('completed').textContent=data.funnel.onboardingCompleted;document.getElementById('paywall').textContent=data.funnel.paywallSeen;document.getElementById('converted').textContent=data.funnel.converted;document.getElementById('notConverted').textContent=data.funnel.onboardingCompletedNotConverted;document.getElementById('todayNet').textContent=money(data.revenue.todayNet);document.getElementById('weekNet').textContent=money(data.revenue.weekNet);document.getElementById('monthNet').textContent=money(data.revenue.monthNet);document.getElementById('plans').innerHTML=rowsFromObject(data.conversionsByPlan);document.getElementById('sources').innerHTML=rowsFromObject(data.installSources);const recent=data.recentConversions||[];document.getElementById('recent').innerHTML=recent.length?recent.map(row=>'<tr><td>'+new Date(row.ts).toLocaleString()+'</td><td>'+row.plan+'</td><td>'+row.productId+'</td><td class="money">'+money(row.net)+'</td></tr>').join(''):'<tr><td class="muted">No conversions yet</td><td></td><td></td><td></td></tr>';status.textContent='Live · '+new Date(data.generatedAt).toLocaleTimeString();status.className='pill'}}catch(error){{status.textContent='Offline / auth failed';status.className='pill error'}}}}refresh();setInterval(refresh,30000);</script></body></html>"""


@api_router.get("/live-ops/summary")
async def live_ops_summary(token: Optional[str] = None, x_live_ops_token: Optional[str] = Header(default=None)) -> dict[str, Any]:
    require_live_ops_admin(token=token, x_live_ops_token=x_live_ops_token)
    docs = await read_live_ops_event_docs()
    return summarize_live_ops_events(flatten_event_batches(docs))


@api_router.post("/live-ops/reset-events")
async def live_ops_reset_events(
    confirm: str,
    token: Optional[str] = None,
    x_live_ops_token: Optional[str] = Header(default=None),
) -> dict[str, Any]:
    """Admin-only reset for pre-launch Live Ops event batches.

    This deletes from the exact Mongo collection used by the dashboard:
    db["events"].
    """
    require_live_ops_admin(token=token, x_live_ops_token=x_live_ops_token)

    if confirm != "RESET_EVENTS":
        raise HTTPException(status_code=400, detail="confirm must be RESET_EVENTS")

    if db is None:
        raise HTTPException(status_code=503, detail="mongo not configured")

    before = await db["events"].count_documents({})
    result = await db["events"].delete_many({})
    after = await db["events"].count_documents({})

    return {
        "status": "ok",
        "collection": "events",
        "before": before,
        "deleted": result.deleted_count,
        "after": after,
        "time": now_iso(),
    }


@app.get("/ops", response_class=HTMLResponse)
async def live_ops_dashboard(token: Optional[str] = None, x_live_ops_token: Optional[str] = Header(default=None)) -> HTMLResponse:
    require_live_ops_admin(token=token, x_live_ops_token=x_live_ops_token)
    return HTMLResponse(live_ops_dashboard_html(token or ""))



# --- Sync ---------------------------------------------------------------------
@api_router.post("/v1/sync")
async def sync(payload: SyncPayload, _auth: dict[str, str] = Depends(require_signed_device_write)) -> dict[str, Any]:
    received_at = now_iso()
    payload_doc = payload.model_dump()
    reason = payload_doc.get("reason")

    await safe_insert(
        "sync",
        {
            **payload_doc,
            "received_at": received_at,
        },
    )

    for goal in payload.goals:
        goal_id = goal.get("id")
        if goal_id:
            await safe_replace(
                "goal_mirrors",
                {"device_id": payload.device_id, "goal_id": goal_id},
                {
                    "device_id": payload.device_id,
                    "goal_id": goal_id,
                    "goal": goal,
                    "reason": reason,
                    "received_at": received_at,
                },
            )

    for deposit in payload.deposits:
        deposit_id = deposit.get("id")
        if deposit_id:
            await safe_replace(
                "deposit_mirrors",
                {"device_id": payload.device_id, "deposit_id": deposit_id},
                {
                    "device_id": payload.device_id,
                    "deposit_id": deposit_id,
                    "deposit": deposit,
                    "reason": reason,
                    "received_at": received_at,
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
