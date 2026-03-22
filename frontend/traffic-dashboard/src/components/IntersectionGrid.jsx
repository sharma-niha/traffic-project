const colorMap = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };

export default function IntersectionGrid({ data }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {data.map(x => (
        <div key={x.id} style={{
          border: "0.5px solid #e5e5e5", borderRadius: 8, padding: 10
        }}>
          <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{x.name}</p>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["red","yellow","green"].map(c => (
              <div key={c} style={{
                width: 12, height: 12, borderRadius: "50%",
                background: colorMap[c],
                opacity: x.state === c ? 1 : 0.2
              }} />
            ))}
            <span style={{ fontSize: 11, color: "#888" }}>{x.state}</span>
          </div>
          <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            Wait: {x.wait}s | Queue: {x.queue} vehicles
          </p>
        </div>
      ))}
    </div>
  );
}