export default function MetricCard({ label, value, unit, sub, subColor }) {
  return (
    <div style={{
      background: "#f5f5f4", borderRadius: 8,
      padding: "12px 16px", flex: 1
    }}>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 500 }}>
        {value}<span style={{ fontSize: 14, fontWeight: 400 }}>{unit}</span>
      </p>
      <p style={{ fontSize: 11, color: subColor || "#888", marginTop: 2 }}>{sub}</p>
    </div>
  );
}