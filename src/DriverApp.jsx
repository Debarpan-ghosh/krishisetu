import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  QrCode,
  Wallet,
  User,
  Power,
  Navigation,
  CheckCircle2,
  Clock,
  Star,
  ChevronRight,
  Snowflake,
  Package,
} from "lucide-react";

// ---------------------------------------------------------------
// KrishiSetu — Driver / Delivery Partner App
// A working front-end prototype of the third interface in the
// three-sided marketplace (Farmer <-> Buyer <-> Driver). This is a
// standalone demo screen — it uses local mock data (MOCK_JOB, the
// earnings list, the profile) rather than the real backend, since
// there's no driver/job-assignment API yet. Wiring it to real orders
// is a follow-up, not something this prototype does today.
// ---------------------------------------------------------------

const MOCK_JOB = {
  id: "JOB-4821",
  farmer: "Rakesh Mandal",
  farmerLocation: "Hooghly, West Bengal",
  farmerCoords: { lat: 22.9100, lng: 88.3900 },
  buyer: "Kolkata Fresh Mart",
  buyerLocation: "Park Street, Kolkata",
  buyerCoords: { lat: 22.5535, lng: 88.3526 },
  produce: "Tomatoes",
  quantity: "200 kg",
  distance: "18.4 km",
  eta: "42 min",
  payout: 340,
  coldChain: true,
};

const TABS = [
  { id: "home", label: "Jobs", icon: Truck },
  { id: "earnings", label: "Earnings", icon: Wallet },
  { id: "profile", label: "Profile", icon: User },
];

export default function DriverApp() {
  const [online, setOnline] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [jobStage, setJobStage] = useState("idle"); // idle | incoming | accepted | pickup | transit | delivered
  const [toast, setToast] = useState(null);

  // Simulate an incoming job request once the driver goes online
  useEffect(() => {
    if (online && jobStage === "idle") {
      const t = setTimeout(() => setJobStage("incoming"), 1800);
      return () => clearTimeout(t);
    }
  }, [online, jobStage]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const acceptJob = () => {
    setJobStage("accepted");
    showToast("Job accepted");
  };

  const rejectJob = () => {
    setJobStage("idle");
    showToast("Job passed to next nearby driver");
  };

  const scanPickup = () => {
    setJobStage("transit");
    showToast("Pickup verified — produce logged");
  };

  const scanDelivery = () => {
    setJobStage("delivered");
    showToast("Delivery confirmed");
  };

  const finishTrip = () => {
    setJobStage("idle");
    setActiveTab("earnings");
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-6 font-sans">
      {/* Phone frame */}
      <div className="relative w-[380px] h-[780px] bg-neutral-950 rounded-[2.5rem] shadow-2xl p-3">
        <div className="relative w-full h-full bg-neutral-50 rounded-[2rem] overflow-hidden flex flex-col">
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] text-neutral-500 font-medium">
            <span>9:41</span>
            <span className="tracking-wider">KRISHISETU DRIVER</span>
            <span>4G ●●●</span>
          </div>

          {/* Toast */}
          {toast && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-neutral-900 text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap">
              <CheckCircle2 size={14} className="text-emerald-400" />
              {toast}
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "home" && (
              <HomeTab
                online={online}
                setOnline={setOnline}
                jobStage={jobStage}
                acceptJob={acceptJob}
                rejectJob={rejectJob}
                scanPickup={scanPickup}
                scanDelivery={scanDelivery}
                finishTrip={finishTrip}
              />
            )}
            {activeTab === "earnings" && <EarningsTab />}
            {activeTab === "profile" && <ProfileTab />}
          </div>

          {/* Bottom nav */}
          <div className="flex border-t border-neutral-200 bg-white">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
                    active ? "text-orange-600" : "text-neutral-400"
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeTab({
  online,
  setOnline,
  jobStage,
  acceptJob,
  rejectJob,
  scanPickup,
  scanDelivery,
  finishTrip,
}) {
  return (
    <div className="px-4 pt-2 pb-4">
      {/* Online/offline control */}
      <div
        className={`rounded-2xl p-4 mb-4 flex items-center justify-between transition-colors ${
          online ? "bg-emerald-600" : "bg-neutral-800"
        }`}
      >
        <div className="text-white">
          <p className="text-sm font-semibold">
            {online ? "You're online" : "You're offline"}
          </p>
          <p className="text-[11px] opacity-80">
            {online
              ? "Receiving nearby pickup requests"
              : "Go online to start receiving jobs"}
          </p>
        </div>
        <button
          onClick={() => {
            setOnline((o) => !o);
          }}
          className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${
            online ? "bg-emerald-800 justify-end" : "bg-neutral-600 justify-start"
          }`}
        >
          <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
            <Power size={13} className={online ? "text-emerald-700" : "text-neutral-500"} />
          </span>
        </button>
      </div>

      {jobStage === "idle" && online && (
        <div className="flex flex-col items-center justify-center text-center py-16 text-neutral-400">
          <Navigation size={28} className="mb-3 animate-pulse" />
          <p className="text-sm font-medium text-neutral-500">Searching for nearby jobs…</p>
          <p className="text-xs mt-1">Stay online near active pickup zones</p>
        </div>
      )}

      {jobStage === "idle" && !online && (
        <div className="flex flex-col items-center justify-center text-center py-20 text-neutral-300">
          <Truck size={32} className="mb-3" />
          <p className="text-sm font-medium text-neutral-400">No active jobs</p>
        </div>
      )}

      {jobStage === "incoming" && <IncomingJobCard onAccept={acceptJob} onReject={rejectJob} />}

      {(jobStage === "accepted" || jobStage === "transit") && (
        <TripCard
          stage={jobStage}
          onScanPickup={scanPickup}
          onScanDelivery={scanDelivery}
        />
      )}

      {jobStage === "delivered" && <DeliveredCard onFinish={finishTrip} />}
    </div>
  );
}

function IncomingJobCard({ onAccept, onReject }) {
  const [seconds, setSeconds] = useState(15);
  useEffect(() => {
    if (seconds === 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <div className="bg-white border-2 border-orange-500 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide">
          New pickup request
        </span>
        <span className="text-xs font-mono text-neutral-400">{seconds}s</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Package size={16} className="text-neutral-500" />
        <p className="text-sm font-medium text-neutral-800">
          {MOCK_JOB.quantity} {MOCK_JOB.produce}
        </p>
        {MOCK_JOB.coldChain && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
            <Snowflake size={11} /> Cold-chain
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <RouteRow icon={MapPin} color="text-emerald-600" label="Pickup" value={MOCK_JOB.farmerLocation} />
        <RouteRow icon={MapPin} color="text-orange-600" label="Drop" value={MOCK_JOB.buyerLocation} />
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 mb-4 border-t border-neutral-100 pt-3">
        <span>{MOCK_JOB.distance} · {MOCK_JOB.eta}</span>
        <span className="text-base font-semibold text-neutral-900">₹{MOCK_JOB.payout}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onReject}
          className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-500 text-sm font-medium"
        >
          Pass
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-semibold"
        >
          Accept
        </button>
      </div>
    </div>
  );
}

function RouteRow({ icon: Icon, color, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className={`${color} mt-0.5`} />
      <div>
        <p className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</p>
        <p className="text-xs font-medium text-neutral-700">{value}</p>
      </div>
    </div>
  );
}

// Distance between two lat/lng points, in km (Haversine formula) —
// the JS equivalent of Android's Location.distanceBetween() used in
// the native version of this feature.
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------
// Real live GPS via the browser's Geolocation API — no native app
// needed. watchPosition keeps updating as the driver moves; the
// watch is cleared on unmount (i.e. when the trip card stops
// rendering) to stop draining battery/location once it's not needed.
// Also captures speed (m/s, same unit Android's Location.speed uses)
// where the device provides it.
// ---------------------------------------------------------------
function useLiveLocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("requesting"); // requesting | active | denied | unsupported | error

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("active");
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed, // m/s, or null if the device can't provide it
        });
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { coords, status };
}

function TripCard({ stage, onScanPickup, onScanDelivery }) {
  const atPickup = stage === "accepted";
  const { coords, status } = useLiveLocation();
  const destination = atPickup ? MOCK_JOB.farmerCoords : MOCK_JOB.buyerCoords;

  const locationLabel = {
    requesting: "Requesting GPS access…",
    active: coords
      ? `Live: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
      : "Live GPS tracking active",
    denied: "Location permission denied",
    unsupported: "GPS not supported on this device",
    error: "GPS signal unavailable",
  }[status];

  // Real telemetry computed from the device's actual position, the
  // same distance/speed/ETA math as the native version — just run in
  // the browser against navigator.geolocation instead of FusedLocationProviderClient.
  const liveDistanceKm =
    status === "active" && coords ? distanceKm(coords.lat, coords.lng, destination.lat, destination.lng) : null;
  const liveSpeedKmh = coords?.speed != null ? coords.speed * 3.6 : null;
  const liveEtaMin =
    liveDistanceKm != null && liveSpeedKmh != null && liveSpeedKmh > 1
      ? Math.round((liveDistanceKm / liveSpeedKmh) * 60)
      : null;
  const hasArrived = liveDistanceKm != null && liveDistanceKm < 0.1;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      {/* Map placeholder — the pin/road graphic is still a mock, but
          the label below it now reflects a real device GPS reading. */}
      <div className="h-36 bg-neutral-200 relative flex items-center justify-center">
        <Navigation size={26} className={`text-neutral-500 ${status === "active" ? "" : "opacity-50"}`} />
        <span className="absolute bottom-2 left-2 text-[10px] bg-white/90 px-2 py-0.5 rounded-full font-medium text-neutral-600 flex items-center gap-1">
          {status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          {locationLabel}
        </span>
        {hasArrived && (
          <span className="absolute top-2 right-2 text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
            Arrived
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-xs font-semibold text-neutral-800">
            {atPickup ? "Heading to farm-gate pickup" : "En route to drop-off"}
          </p>
        </div>
        <p className="text-xs text-neutral-500 mb-4 pl-4">
          {atPickup ? MOCK_JOB.farmerLocation : MOCK_JOB.buyerLocation}
        </p>

        {/* Live telemetry — falls back to the static estimate until a
            real GPS fix (and, for speed/ETA, actual movement) is available. */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <TelemetryStat
            label="Distance"
            value={liveDistanceKm != null ? `${liveDistanceKm.toFixed(2)} km` : MOCK_JOB.distance}
          />
          <TelemetryStat label="Speed" value={liveSpeedKmh != null ? `${liveSpeedKmh.toFixed(1)} km/h` : "—"} />
          <TelemetryStat label="ETA" value={liveEtaMin != null ? `${liveEtaMin} min` : MOCK_JOB.eta} />
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock size={13} /> {MOCK_JOB.quantity} {MOCK_JOB.produce}
          </span>
        </div>

        <button
          onClick={atPickup ? onScanPickup : onScanDelivery}
          className="w-full py-3 rounded-xl bg-neutral-900 text-white text-sm font-semibold flex items-center justify-center gap-2"
        >
          <QrCode size={17} />
          {atPickup ? "Scan QR to confirm pickup" : "Scan QR to confirm delivery"}
        </button>
      </div>
    </div>
  );
}

function TelemetryStat({ label, value }) {
  return (
    <div className="bg-neutral-50 rounded-lg py-2 px-1 text-center">
      <p className="text-[9px] uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="text-xs font-semibold text-neutral-800 mt-0.5">{value}</p>
    </div>
  );
}

function DeliveredCard({ onFinish }) {
  return (
    <div className="bg-white rounded-2xl border border-emerald-200 p-6 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
        <CheckCircle2 size={28} className="text-emerald-600" />
      </div>
      <p className="text-sm font-semibold text-neutral-800">Delivery confirmed</p>
      <p className="text-xs text-neutral-500 mt-1 mb-4">
        QR verified on arrival — {MOCK_JOB.farmer}&apos;s order is complete.
      </p>
      <div className="w-full bg-neutral-50 rounded-xl p-3 mb-4 flex items-center justify-between">
        <span className="text-xs text-neutral-500">Trip earning</span>
        <span className="text-lg font-semibold text-neutral-900">₹{MOCK_JOB.payout}</span>
      </div>
      <button
        onClick={onFinish}
        className="w-full py-3 rounded-xl bg-orange-600 text-white text-sm font-semibold"
      >
        Done
      </button>
    </div>
  );
}

function EarningsTab() {
  const trips = [
    { id: "JOB-4821", route: "Hooghly → Park Street", amount: 340, time: "Today, 2:14 PM" },
    { id: "JOB-4790", route: "Nadia → Sealdah", amount: 280, time: "Today, 11:02 AM" },
    { id: "JOB-4761", route: "Barrackpore → Salt Lake", amount: 410, time: "Yesterday, 6:40 PM" },
  ];
  return (
    <div className="px-4 pt-2 pb-4">
      <div className="bg-neutral-900 rounded-2xl p-5 mb-4 text-white">
        <p className="text-xs text-neutral-400 mb-1">Today&apos;s earnings</p>
        <p className="text-3xl font-semibold">₹1,030</p>
        <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400">
          <ChevronRight size={12} className="rotate-[-90deg]" />
          3 trips completed
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatBox label="This week" value="₹6,240" />
        <StatBox label="Return-trip bonus" value="₹180" />
      </div>

      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
        Recent trips
      </p>
      <div className="space-y-2">
        {trips.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl px-3 py-2.5"
          >
            <div>
              <p className="text-xs font-medium text-neutral-800">{t.route}</p>
              <p className="text-[10px] text-neutral-400">{t.time}</p>
            </div>
            <span className="text-sm font-semibold text-neutral-900">₹{t.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-xl p-3">
      <p className="text-[10px] text-neutral-400 mb-1">{label}</p>
      <p className="text-base font-semibold text-neutral-800">{value}</p>
    </div>
  );
}

function ProfileTab() {
  return (
    <div className="px-4 pt-2 pb-4">
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-lg font-semibold mb-2">
          BM
        </div>
        <p className="text-sm font-semibold text-neutral-800">Biswajit Mondal</p>
        <p className="text-xs text-neutral-400">Mini-truck · Cold-chain certified</p>
        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600 font-medium">
          <Star size={13} fill="currentColor" /> 4.9 rating · 312 trips
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: "Vehicle & documents", detail: "RC, license, insurance verified" },
          { label: "Bank / UPI payout", detail: "UPI • biswajit@upi" },
          { label: "Preferred routes", detail: "Hooghly, Nadia, Kolkata North" },
          { label: "Support", detail: "Get help with a trip" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl px-4 py-3"
          >
            <div>
              <p className="text-xs font-medium text-neutral-800">{item.label}</p>
              <p className="text-[10px] text-neutral-400">{item.detail}</p>
            </div>
            <ChevronRight size={16} className="text-neutral-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
