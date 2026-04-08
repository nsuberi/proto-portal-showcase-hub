import { useState, useEffect, useCallback } from "react";
import { tokens } from "@/design-system/tokens";
import { useAppLogger } from "@/components/AppLogger";

type Range = "1W" | "1M" | "3M";

interface RateData {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  color: string;
  series: number[];
}

const rateData: Record<Range, RateData[]> = {
  "1W": [
    { label: "30-yr Fixed", value: "6.87%", delta: "0.03", up: false, color: tokens.color.primary, series: [6.92, 6.95, 6.9, 6.88, 6.91, 6.89, 6.87] },
    { label: "15-yr Fixed", value: "6.12%", delta: "0.01", up: true, color: tokens.color.tertiary, series: [6.08, 6.1, 6.14, 6.11, 6.09, 6.13, 6.12] },
    { label: "5/1 ARM", value: "5.94%", delta: "0.05", up: false, color: tokens.color.secondary, series: [6.01, 5.98, 5.95, 5.99, 5.96, 5.97, 5.94] },
  ],
  "1M": [
    { label: "30-yr Fixed", value: "6.87%", delta: "0.12", up: false, color: tokens.color.primary, series: [6.99, 7.02, 6.98, 6.95, 6.94, 6.92, 6.87] },
    { label: "15-yr Fixed", value: "6.12%", delta: "0.08", up: false, color: tokens.color.tertiary, series: [6.2, 6.22, 6.18, 6.15, 6.14, 6.13, 6.12] },
    { label: "5/1 ARM", value: "5.94%", delta: "0.15", up: false, color: tokens.color.secondary, series: [6.09, 6.05, 6.02, 5.99, 5.98, 5.96, 5.94] },
  ],
  "3M": [
    { label: "30-yr Fixed", value: "6.87%", delta: "0.38", up: false, color: tokens.color.primary, series: [7.25, 7.18, 7.1, 7.02, 6.95, 6.91, 6.87] },
    { label: "15-yr Fixed", value: "6.12%", delta: "0.22", up: false, color: tokens.color.tertiary, series: [6.34, 6.28, 6.24, 6.2, 6.18, 6.15, 6.12] },
    { label: "5/1 ARM", value: "5.94%", delta: "0.31", up: false, color: tokens.color.secondary, series: [6.25, 6.18, 6.12, 6.05, 6.0, 5.97, 5.94] },
  ],
};

const lockQueue = [
  { borrower: "J. Rivera", amount: "$425,000", rate: "6.75%", status: "Pending", days: 2 },
  { borrower: "P. Kumar", amount: "$680,000", rate: "6.50%", status: "Locked", days: 14 },
  { borrower: "M. Thompson", amount: "$310,000", rate: "5.88%", status: "Expiring", days: 1 },
  { borrower: "S. Lee", amount: "$525,000", rate: "6.62%", status: "Locked", days: 21 },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: tokens.color.primaryContainer, text: tokens.color.primary },
  Locked: { bg: "#0f2e1a", text: "#27C93F" },
  Expiring: { bg: tokens.color.errorContainer, text: tokens.color.error },
};

function MiniChart({ series, color, width = 180, height = 60 }: { series: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...series) - 0.05;
  const max = Math.max(...series) + 0.05;
  const pad = 4;

  const points = series.map((v, i) => {
    const x = pad + (i / (series.length - 1)) * (width - pad * 2);
    const y = pad + ((max - v) / (max - min)) * (height - pad * 2);
    return `${x},${y}`;
  });

  const pathD = "M" + points.join(" L");
  const areaD = pathD + ` L${width - pad},${height - pad} L${pad},${height - pad} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
      <path d={areaD} fill={color} opacity={0.08} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {series.map((v, i) => {
        const x = pad + (i / (series.length - 1)) * (width - pad * 2);
        const y = pad + ((max - v) / (max - min)) * (height - pad * 2);
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
      })}
    </svg>
  );
}

export default function RateDashboardApp() {
  const { log } = useAppLogger();
  const [range, setRange] = useState<Range>("1W");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const rates = rateData[range];

  useEffect(() => {
    log("Rate Lock Dashboard initialized", "info");
    log("Connected to rate feed (simulated)", "info");
    log("Loading 1W rate data...", "action");
  }, [log]);

  const handleRangeChange = useCallback(
    (r: Range) => {
      setRange(r);
      log(`Range changed to ${r}`, "action");
      log(`Fetching ${r} rate history...`, "info");
      setTimeout(() => log(`${r} data loaded: ${rates.length} series`, "success"), 300);
    },
    [log, rates.length],
  );

  const handleCardClick = (idx: number) => {
    setSelectedCard(selectedCard === idx ? null : idx);
    const rate = rates[idx];
    log(`Selected: ${rate.label} at ${rate.value}`, "action");
  };

  const handleLockAction = (borrower: string, status: string) => {
    if (status === "Expiring") {
      log(`\u26A0 Rate lock expiring for ${borrower} — action required`, "warn");
    } else if (status === "Pending") {
      log(`Reviewing lock request for ${borrower}`, "action");
    } else {
      log(`Viewing lock details for ${borrower}`, "info");
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2
            style={{
              fontFamily: tokens.font.headline,
              fontSize: 20,
              fontWeight: 600,
              color: tokens.color.onSurface,
              marginBottom: 4,
            }}
          >
            Rate Lock Dashboard
          </h2>
          <p style={{ fontFamily: tokens.font.body, fontSize: 13, color: tokens.color.outline }}>
            Monitor and manage mortgage rate locks
          </p>
        </div>
        {/* Range pills */}
        <div style={{ display: "flex", gap: 4, background: tokens.color.surfaceContainer, borderRadius: 8, padding: 3 }}>
          {(["1W", "1M", "3M"] as const).map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "none",
                fontSize: 11,
                fontFamily: tokens.font.label,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: range === r ? tokens.color.primaryContainer : "transparent",
                color: range === r ? tokens.color.primary : tokens.color.outline,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Rate cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {rates.map((rate, i) => (
          <div
            key={rate.label}
            onClick={() => handleCardClick(i)}
            style={{
              background: selectedCard === i ? tokens.color.surfaceContainer : tokens.color.surfaceContainerLow,
              borderRadius: 10,
              padding: 14,
              cursor: "pointer",
              transition: "all 0.2s",
              border: `1px solid ${selectedCard === i ? tokens.color.primary : "transparent"}`,
            }}
          >
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: tokens.color.outline,
                marginBottom: 6,
                fontFamily: tokens.font.label,
              }}
            >
              {rate.label}
            </div>
            <div
              style={{
                fontFamily: tokens.font.headline,
                fontSize: 22,
                fontWeight: 700,
                color: rate.color,
                marginBottom: 4,
              }}
            >
              {rate.value}
            </div>
            <div style={{ fontSize: 11, color: rate.up ? "#27C93F" : tokens.color.error }}>
              {rate.up ? "\u25B2" : "\u25BC"} {rate.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        style={{
          background: tokens.color.surfaceContainerLow,
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: tokens.color.onSurface,
            marginBottom: 12,
            fontFamily: tokens.font.label,
          }}
        >
          Rate Trends ({range})
        </div>
        <MiniChart
          series={selectedCard !== null ? rates[selectedCard].series : rates[0].series}
          color={selectedCard !== null ? rates[selectedCard].color : rates[0].color}
          height={100}
        />
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 10 }}>
          {rates.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: tokens.color.outline }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
              {r.label.split(" ")[0]}
            </div>
          ))}
        </div>
      </div>

      {/* Lock queue */}
      <div
        style={{
          background: tokens.color.surfaceContainerLow,
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: tokens.color.onSurface,
            marginBottom: 12,
            fontFamily: tokens.font.label,
          }}
        >
          Active Lock Queue
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lockQueue.map((lock) => (
            <div
              key={lock.borrower}
              onClick={() => handleLockAction(lock.borrower, lock.status)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: tokens.color.surfaceContainerLowest,
                borderRadius: 8,
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = tokens.color.surfaceContainer)}
              onMouseLeave={(e) => (e.currentTarget.style.background = tokens.color.surfaceContainerLowest)}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: tokens.color.onSurface }}>
                  {lock.borrower}
                </div>
                <div style={{ fontSize: 11, color: tokens.color.outline, marginTop: 2 }}>
                  {lock.amount} at {lock.rate} &middot; {lock.days}d remaining
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 20,
                  background: statusColors[lock.status]?.bg ?? tokens.color.surfaceContainer,
                  color: statusColors[lock.status]?.text ?? tokens.color.outline,
                }}
              >
                {lock.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
