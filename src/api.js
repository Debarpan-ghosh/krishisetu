const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function extractErrorMessage(data, status) {
  const detail = data?.detail;
  if (!detail) return `Request failed with status ${status}`;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    // FastAPI validation errors: [{ loc, msg, type }, ...]
    return detail
      .map((d) => (typeof d === "string" ? d : d.msg || JSON.stringify(d)))
      .join("; ");
  }
  return JSON.stringify(detail);
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(extractErrorMessage(data, res.status));
  }
  return data;
}

export const api = {
  getListings: () => request("/api/listings"),

  createListing: (listing) =>
    request("/api/listings", {
      method: "POST",
      body: JSON.stringify(listing),
    }),

  createOrder: (order) =>
    request("/api/orders", {
      method: "POST",
      body: JSON.stringify(order),
    }),

  updateOrderStatus: (orderId, statusUpdate) =>
    request(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusUpdate),
    }),

  getNearestColdStorage: (lat, lng) =>
    request(`/api/logistics/nearest-cold-storage?lat=${lat}&lng=${lng}`),

  voiceToListing: (payload) =>
    request("/api/ai/voice-to-listing", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
