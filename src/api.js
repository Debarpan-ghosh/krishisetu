const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.detail || `Request failed with status ${res.status}`;
    throw new Error(message);
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
