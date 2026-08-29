import React, { useState } from "react";
import { api } from "./api.js";

/**
 * KrishiSetu — Checkout / Payment page
 *
 * Flow: Marketplace "Buy now" -> App sets pendingCheckout -> renders
 *       <Checkout product={...} quantity={...} onSuccess={...} onCancel={...} />
 *       -> user picks a payment method -> "Pay now" -> creates a real order
 *       via api.createOrder() -> onSuccess(order) is called -> App navigates
 *       to Order Tracking.
 *
 * This is a DEMO payment flow (no real money moves, no real payment gateway
 * call). It simulates a gateway so judges see a believable UPI/Card/Wallet
 * interface, then creates a REAL order on the FastAPI backend (the same
 * escrow-locking POST /api/orders your marketplace already uses). Swap the
 * simulated method selection for Razorpay/Stripe/Cashfree post-hackathon —
 * the order-creation call underneath stays the same.
 */

const METHODS = [
  { id: "upi", label: "UPI", hint: "Google Pay, PhonePe, Paytm" },
  { id: "card", label: "Credit / Debit Card", hint: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking", hint: "All major banks" },
  { id: "cod", label: "Cash on Delivery", hint: "Pay when it arrives" },
];

export default function Checkout({ product, quantity = 1, onSuccess, onCancel }) {
  // Fallback demo data so this page still renders if opened directly, e.g. while wiring it up.
  const resolvedProduct = product || { name: "Tomato", pricePerKg: 17, seller: "Abir Mondal" };
  const total = resolvedProduct.pricePerKg * quantity;

  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  function updateCard(field) {
    return (e) => setCard((c) => ({ ...c, [field]: e.target.value }));
  }

  async function handlePay(e) {
    e.preventDefault();
    setError("");

    if (method === "upi" && !upiId.trim()) {
      return setError("Enter a UPI ID to continue.");
    }
    if (method === "card" && (!card.number || !card.expiry || !card.cvv)) {
      return setError("Fill in all card details to continue.");
    }

    setPaying(true);
    try {
      // The payment-method selection above is a demo simulation (no real
      // gateway call) — but this hits a real FastAPI endpoint that locks
      // the order in escrow exactly like the rest of the marketplace.
      const res = await api.processPayment({
        listing_id: resolvedProduct.id,
        quantity,
        method,
        buyer_name: "Demo Buyer",
      });

      onSuccess?.(res.order);
    } catch (err) {
      setError(err.message || "Payment could not be processed. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.nav}>
        <div style={styles.brand}>
          <span style={styles.logoDot}>⇄</span>
          <span style={styles.brandName}>KrishiSetu</span>
        </div>
        {onCancel && (
          <button onClick={onCancel} style={styles.backLink} type="button">
            ← Back to marketplace
          </button>
        )}
      </header>

      <main style={styles.main}>
        <div style={styles.eyebrowRow}>
          <span style={styles.eyebrowLine} />
          <span style={styles.eyebrow}>CHECKOUT · CHOOSE HOW TO PAY</span>
        </div>
        <h1 style={styles.headline}>Complete your order</h1>

        <div style={styles.layout}>
          {/* Order summary */}
          <div style={styles.summaryCard}>
            <h3 style={styles.summaryTitle}>{resolvedProduct.name}</h3>
            <p style={styles.summaryMeta}>Seller: {resolvedProduct.seller}</p>
            <div style={styles.summaryRow}>
              <span>₹{resolvedProduct.pricePerKg} / kg × {quantity} kg</span>
              <span>₹{total}</span>
            </div>
            <div style={styles.summaryDivider} />
            <div style={styles.summaryRowBold}>
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>

          {/* Payment method */}
          <form onSubmit={handlePay} style={styles.card}>
            <span style={styles.fieldLabel}>Payment method</span>
            <div style={styles.methodList}>
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  style={method === m.id ? styles.methodOptionActive : styles.methodOption}
                >
                  <input
                    type="radio"
                    name="method"
                    value={m.id}
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                    style={{ marginRight: 10 }}
                  />
                  <div>
                    <div style={styles.methodLabel}>{m.label}</div>
                    <div style={styles.methodHint}>{m.hint}</div>
                  </div>
                </label>
              ))}
            </div>

            {method === "upi" && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>UPI ID</span>
                <input
                  style={styles.input}
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            )}

            {method === "card" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Card number</span>
                  <input
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={card.number}
                    onChange={updateCard("number")}
                  />
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ ...styles.field, flex: 1 }}>
                    <span style={styles.fieldLabel}>Expiry</span>
                    <input
                      style={styles.input}
                      placeholder="MM/YY"
                      maxLength={5}
                      value={card.expiry}
                      onChange={updateCard("expiry")}
                    />
                  </div>
                  <div style={{ ...styles.field, flex: 1 }}>
                    <span style={styles.fieldLabel}>CVV</span>
                    <input
                      style={styles.input}
                      placeholder="123"
                      maxLength={3}
                      value={card.cvv}
                      onChange={updateCard("cvv")}
                    />
                  </div>
                </div>
              </div>
            )}

            {method === "netbanking" && (
              <div style={styles.field}>
                <span style={styles.fieldLabel}>Bank</span>
                <select style={styles.input} defaultValue="">
                  <option value="" disabled>Select your bank</option>
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                </select>
              </div>
            )}

            {method === "cod" && (
              <p style={styles.codNote}>
                Pay ₹{total} in cash when {resolvedProduct.seller.split(" ")[0]}&apos;s produce is delivered.
              </p>
            )}

            {error && <div style={styles.errorBanner}>{error}</div>}

            <button type="submit" disabled={paying} style={styles.payBtn}>
              {paying ? "Processing…" : `Pay ₹${total}`}
            </button>
          </form>
        </div>
      </main>

      <footer style={styles.footer}>
        <span>KrishiSetu — Team INFOSIX · Smart India Hackathon 2026 · SIH26033</span>
        <span style={{ opacity: 0.6 }}>Frontend demo build</span>
      </footer>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "#F5F1E8", fontFamily: "Georgia, 'Times New Roman', serif" },
  nav: { background: "#1a1a1a", padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  brand: { display: "flex", alignItems: "center", gap: 10 },
  logoDot: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: "50%", background: "#3c9a5f", color: "#fff", fontSize: 14 },
  brandName: { color: "#fff", fontWeight: 700, fontSize: 20 },
  backLink: { background: "transparent", border: "none", color: "#ccc", fontSize: 13, cursor: "pointer", fontFamily: "system-ui, sans-serif" },
  main: { flex: 1, padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center" },
  eyebrowRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  eyebrowLine: { width: 28, height: 1, background: "#999" },
  eyebrow: { fontFamily: "'Courier New', monospace", letterSpacing: 2, fontSize: 12, color: "#777", textTransform: "uppercase" },
  headline: { fontSize: 36, margin: "0 0 32px", color: "#2a2320" },
  layout: { display: "flex", gap: 24, width: "100%", maxWidth: 820, flexWrap: "wrap" },
  summaryCard: { background: "#EFE9DC", border: "1px solid #ddd3bd", borderRadius: 10, padding: 24, flex: "1 1 240px", height: "fit-content", fontFamily: "system-ui, sans-serif" },
  summaryTitle: { margin: "0 0 4px", fontFamily: "Georgia, serif", fontSize: 22 },
  summaryMeta: { margin: "0 0 16px", color: "#777", fontSize: 14 },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: 14, color: "#555", marginBottom: 8 },
  summaryDivider: { height: 1, background: "#ddd3bd", margin: "12px 0" },
  summaryRowBold: { display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, color: "#c0392b" },
  card: { background: "#EFE9DC", border: "1px solid #ddd3bd", borderRadius: 10, padding: 24, flex: "2 1 380px", display: "flex", flexDirection: "column", gap: 16, fontFamily: "system-ui, sans-serif" },
  methodList: { display: "flex", flexDirection: "column", gap: 10 },
  methodOption: { display: "flex", alignItems: "center", border: "1px solid #ccc0a3", borderRadius: 8, padding: "12px 14px", cursor: "pointer", background: "#fff" },
  methodOptionActive: { display: "flex", alignItems: "center", border: "2px solid #1a1a1a", borderRadius: 8, padding: "11px 13px", cursor: "pointer", background: "#fff" },
  methodLabel: { fontWeight: 600, fontSize: 15 },
  methodHint: { fontSize: 12, color: "#888" },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: "#777" },
  input: { padding: "10px 12px", borderRadius: 6, border: "1px solid #ccc0a3", fontSize: 15, background: "#fff" },
  codNote: { fontSize: 14, color: "#555", background: "#fff", border: "1px solid #ccc0a3", borderRadius: 8, padding: 12 },
  errorBanner: { background: "#c0392b", color: "#fff", padding: "10px 12px", borderRadius: 6, fontSize: 13 },
  payBtn: { marginTop: 4, padding: "14px 0", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer" },
  footer: { display: "flex", justifyContent: "space-between", background: "#1a1a1a", color: "#bbb", padding: "16px 40px", fontFamily: "'Courier New', monospace", fontSize: 12 },
};
