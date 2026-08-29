from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

app = FastAPI(
    title="KrishiSetu Core Backend API",
    description="Engine behind Agri-Setu: P2P Marketplace, Vernacular AI, and Escrow Logistics",
    version="1.2.0",
)

# ---------------------------------------------------------
# CORS Setup
# NOTE: "*" cannot be combined with allow_credentials=True per the
# CORS spec (browsers will reject it). Use an explicit origin list.
# allow_origin_regex additionally covers Vercel's per-deployment
# preview URLs (e.g. krishisetu-git-branch-username.vercel.app),
# which change on every branch/PR and can't be listed individually.
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://krishisetu-chi.vercel.app",
    ],
    allow_origin_regex=r"https://krishisetu.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Data Store (In-Memory for Prototype/SIH Demo)
# NOTE: Not thread-safe and not persistent. Fine for a demo;
# replace with a real DB (Postgres/Mongo per your stack slide)
# and add row-level locking around qty decrements before
# handling concurrent real traffic.
# ---------------------------------------------------------
listings = [
    {
        "id": 1,
        "crop": "Tomato",
        "emoji": "🍅",
        "farmer": "Abir Mondal",
        "village": "Hooghly, WB",
        "lat": 22.9032,
        "lng": 88.3968,
        "qty": 180.0,
        "price": 17.0,
        "distance": "6 km",
        "freshness": "Harvested today",
    },
    {
        "id": 2,
        "crop": "Potato",
        "emoji": "🥔",
        "farmer": "Sunita Devi",
        "village": "Nadia, WB",
        "lat": 23.4710,
        "lng": 88.5565,
        "qty": 320.0,
        "price": 14.0,
        "distance": "11 km",
        "freshness": "Harvested yesterday",
    },
]

orders = {}
cold_nodes = [
    {"id": "node_01", "name": "Hooghly Agro Cold Storage", "lat": 22.9100, "lng": 88.4000, "available_capacity_kg": 5000},
    {"id": "node_02", "name": "Kolkata Port Refrigerated Hub", "lat": 22.5400, "lng": 88.3100, "available_capacity_kg": 12000}
]

# ---------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------
ALLOWED_PAYMENT_METHODS = {"Escrow_UPI", "upi", "card", "netbanking", "cod"}

class ListingCreate(BaseModel):
    crop: str
    qty: float = Field(..., gt=0)
    suggestedPrice: float = Field(..., gt=0)
    village: str
    farmer_name: Optional[str] = "Abir Mondal"
    emoji: Optional[str] = "🌱"
    lat: Optional[float] = 22.9032
    lng: Optional[float] = 88.3968

class OrderCreate(BaseModel):
    listing_id: int
    quantity: float = Field(..., gt=0)
    buyer_name: str
    payment_method: str = "Escrow_UPI"

class PaymentProcessRequest(BaseModel):
    listing_id: int
    quantity: float = Field(..., gt=0)
    method: str
    buyer_name: str = "Demo Buyer"

class OrderStatusUpdate(BaseModel):
    status: str
    qr_verification_code: Optional[str] = None

class VoiceListingRequest(BaseModel):
    audio_base64: Optional[str] = None
    transcript: Optional[str] = None
    language: str = "Bengali"  # Bengali, Hindi, Marathi

# ---------------------------------------------------------
# Order state machine
# Forward-only transitions: prevents skipping straight to
# funds_released, and prevents resurrecting a cancelled order.
# ---------------------------------------------------------
ALLOWED_TRANSITIONS = {
    "escrow_locked": {"in_transit", "cancelled"},
    "in_transit": {"qr_verified", "cancelled"},
    "qr_verified": {"funds_released"},
    "funds_released": set(),
    "cancelled": set(),
}

# ---------------------------------------------------------
# Marketplace & Listings APIs
# ---------------------------------------------------------
@app.get("/api/listings")
def get_listings():
    return {"success": True, "count": len(listings), "listings": listings}

@app.get("/api/listings/{listing_id}")
def get_listing(listing_id: int):
    listing = next((item for item in listings if item["id"] == listing_id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"success": True, "listing": listing}

@app.post("/api/listings", status_code=201)
def create_listing(data: ListingCreate):
    new_id = max([item["id"] for item in listings], default=0) + 1
    new_listing = {
        "id": new_id,
        "crop": data.crop.capitalize(),
        "emoji": data.emoji,
        "farmer": data.farmer_name,
        "village": data.village,
        "lat": data.lat,
        "lng": data.lng,
        "qty": data.qty,
        "price": data.suggestedPrice,
        "distance": "0 km (Farm gate)",
        "freshness": "Harvested today",
    }
    listings.append(new_listing)
    return {"success": True, "message": "Listing published to P2P marketplace", "listing": new_listing}

@app.delete("/api/listings/{listing_id}")
def delete_listing(listing_id: int):
    global listings
    listing = next((item for item in listings if item["id"] == listing_id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listings = [item for item in listings if item["id"] != listing_id]
    return {"success": True, "message": "Listing removed"}

# ---------------------------------------------------------
# Order Processing & Smart Escrow Payouts
# ---------------------------------------------------------
@app.get("/api/orders")
def list_orders():
    return {"success": True, "count": len(orders), "orders": list(orders.values())}

@app.get("/api/orders/{order_id}")
def get_order(order_id: str):
    order = orders.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True, "order": order}

def _place_order(listing_id: int, quantity: float, buyer_name: str, payment_method: str) -> dict:
    """
    Shared order-placement logic: validates payment method and stock,
    decrements inventory, and locks the order in escrow. Used by both
    POST /api/orders and POST /api/payments/process so there's one
    source of truth for how an order gets created — the total is always
    computed server-side from the listing's real price, never trusted
    from the caller.
    """
    if payment_method not in ALLOWED_PAYMENT_METHODS:
        raise HTTPException(status_code=400, detail=f"Unsupported payment method. Allowed: {sorted(ALLOWED_PAYMENT_METHODS)}")

    listing = next((item for item in listings if item["id"] == listing_id), None)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if quantity > listing["qty"]:
        raise HTTPException(status_code=400, detail="Insufficient stock available")

    listing["qty"] -= quantity

    order_id = f"ORD-{uuid.uuid4().hex[:6].upper()}"
    total_amount = round(quantity * listing["price"], 2)
    qr_code = f"QR-VERIFY-{order_id}"

    order = {
        "id": order_id,
        "listing_id": listing["id"],
        "crop": listing["crop"],
        "quantity": quantity,
        "price_per_kg": listing["price"],
        "total_amount": total_amount,
        "buyer_name": buyer_name,
        "farmer": listing["farmer"],
        "payment_method": payment_method,
        "status": "escrow_locked",
        "escrow_guarantee": True,
        "qr_code": qr_code,
        "created_at": datetime.now().isoformat(),
    }
    orders[order_id] = order
    return order

@app.post("/api/orders", status_code=201)
def create_order(data: OrderCreate):
    order = _place_order(data.listing_id, data.quantity, data.buyer_name, data.payment_method)
    return {
        "success": True,
        "message": "Funds held in Smart Escrow. Dispatch pending.",
        "order": order
    }

# ---------------------------------------------------------
# Payment Processing (Checkout page)
# NOTE: This is a DEMO simulation only — no real payment gateway is
# called. Cash on Delivery skips "payment" entirely; every other method
# is treated as an instant success for the demo. Swap the body of this
# handler for a real Razorpay/Stripe/Cashfree call post-hackathon — the
# request/response shape can stay the same so the frontend doesn't need
# to change. Unlike a bare Order-model version of this endpoint, this
# reuses _place_order() so a "payment" here still goes through the same
# real stock check and escrow lock as the rest of the marketplace,
# rather than creating a disconnected record.
# ---------------------------------------------------------
@app.post("/api/payments/process", status_code=201)
def process_payment(data: PaymentProcessRequest):
    order = _place_order(data.listing_id, data.quantity, data.buyer_name, data.method)
    return {
        "success": True,
        "message": "Payment successful.",
        "orderId": order["id"],
        "order": order,
    }

@app.patch("/api/orders/{order_id}/status")
def update_order_status(order_id: str, data: OrderStatusUpdate):
    if order_id not in orders:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders[order_id]
    current_status = order["status"]

    allowed_next = ALLOWED_TRANSITIONS.get(current_status, set())
    if data.status not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid transition: cannot move from '{current_status}' to '{data.status}'. "
                   f"Allowed next states: {sorted(allowed_next) or 'none (terminal state)'}"
        )

    if data.status == "funds_released":
        if data.qr_verification_code != order["qr_code"]:
            raise HTTPException(status_code=403, detail="QR Code verification failed. Cannot release escrow.")
        order["status"] = "funds_released"
        return {"success": True, "message": "Escrow released directly to farmer account.", "order": order}

    if data.status == "cancelled":
        # Restore stock back to the originating listing, if it still exists.
        listing = next((item for item in listings if item["id"] == order["listing_id"]), None)
        if listing:
            listing["qty"] += order["quantity"]

    order["status"] = data.status
    return {"success": True, "message": f"Status updated to {data.status}", "order": order}

# ---------------------------------------------------------
# Vernacular Voice AI Assistant Mock Handler
# NOTE: This is a placeholder — it does not run real speech-to-text
# or NLP yet. It always returns the same sample extraction. Wire this
# up to Whisper/Gemini per the tech-stack slide before treating results
# as real parsed listings.
# ---------------------------------------------------------
@app.post("/api/ai/voice-to-listing")
def process_voice_intent(payload: VoiceListingRequest):
    sample_transcript = payload.transcript or "আজকে ২০০ কেজি টমেটো ১৮ টাকায় বেচব"

    parsed_intent = {
        "detected_language": payload.language,
        "raw_transcript": sample_transcript,
        "extracted_data": {
            "crop": "Tomato",
            "qty": 200.0,
            "suggestedPrice": 18.0,
            "village": "Hooghly, WB",
            "emoji": "🍅"
        },
        "confidence_score": 0.96,
        "mocked": True,
    }

    return {"success": True, "parsed": parsed_intent}

# ---------------------------------------------------------
# Logistics & Cold-Chain Routing Engine
# ---------------------------------------------------------
@app.get("/api/logistics/nearest-cold-storage")
def get_nearest_cold_storage(lat: float, lng: float):
    sorted_nodes = sorted(
        cold_nodes,
        key=lambda n: ((n["lat"] - lat) ** 2 + (n["lng"] - lng) ** 2)
    )
    return {"success": True, "recommended_node": sorted_nodes[0]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
