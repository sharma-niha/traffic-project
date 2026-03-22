import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";
import { intersections, simulateTick, generateVolume } from "./utils/trafficSim";

const API = "http://127.0.0.1:8000";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0e1a; color: #e2e8f0; font-family: 'Inter', sans-serif; }
  .dashboard { min-height: 100vh; background: #0a0e1a; padding: 0; }
  .topbar { background: linear-gradient(135deg, #0d1b2a 0%, #1a1f3a 100%); border-bottom: 1px solid #1e3a5f; padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .logo-dot { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #00d4ff, #0066ff); display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .topbar-title { font-family: 'Orbitron', monospace; font-size: 15px; font-weight: 700; color: #00d4ff; letter-spacing: 1px; }
  .topbar-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
  .live-badge { display: flex; align-items: center; gap: 6px; background: rgba(0,255,128,0.1); border: 1px solid rgba(0,255,128,0.3); color: #00ff80; padding: 6px 14px; border-radius: 20px; font-size: 12px; }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #00ff80; animation: pulse 1.5s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }
  .topbar-right { display: flex; align-items: center; gap: 16px; }
  .time-display { font-family: 'Orbitron', monospace; font-size: 13px; color: #94a3b8; }
  .content { padding: 24px 28px; }
  .metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .metric-card { background: linear-gradient(135deg, #0d1b2a, #1a2744); border: 1px solid #1e3a5f; border-radius: 14px; padding: 18px 20px; position: relative; overflow: hidden; }
  .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .metric-card.blue::before  { background: linear-gradient(90deg, #0066ff, #00d4ff); }
  .metric-card.green::before { background: linear-gradient(90deg, #00b894, #00ff80); }
  .metric-card.purple::before{ background: linear-gradient(90deg, #6c3fff, #c084fc); }
  .metric-card.orange::before{ background: linear-gradient(90deg, #ff6b35, #ffd93d); }
  .metric-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .metric-value { font-family: 'Orbitron', monospace; font-size: 28px; font-weight: 700; }
  .metric-value.blue   { color: #00d4ff; }
  .metric-value.green  { color: #00ff80; }
  .metric-value.purple { color: #c084fc; }
  .metric-value.orange { color: #ffd93d; }
  .metric-unit { font-size: 14px; font-weight: 400; opacity: 0.7; }
  .metric-sub { font-size: 11px; margin-top: 8px; color: #64748b; }
  .metric-sub.up   { color: #00ff80; }
  .metric-sub.warn { color: #ffd93d; }
  .main-grid { display: grid; grid-template-columns: 1fr 280px; gap: 20px; }
  .card { background: linear-gradient(135deg, #0d1b2a, #1a2744); border: 1px solid #1e3a5f; border-radius: 14px; padding: 18px 20px; margin-bottom: 18px; }
  .card-title { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .card-title-dot { width: 6px; height: 6px; border-radius: 50%; }
  .intersect-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .intersect-box { background: #0a0e1a; border: 1px solid #1e3a5f; border-radius: 10px; padding: 12px; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
  .intersect-box:hover { border-color: #00d4ff; background: #0d1b2a; }
  .intersect-box.active { border-color: #00ff80; }
  .intersect-name { font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 8px; }
  .signal-lights { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
  .sig-light { width: 13px; height: 13px; border-radius: 50%; opacity: 0.2; transition: opacity 0.3s, box-shadow 0.3s; }
  .sig-light.on { opacity: 1; }
  .sig-light.red-l { background: #ef4444; }
  .sig-light.red-l.on { box-shadow: 0 0 8px #ef4444; }
  .sig-light.yel-l { background: #eab308; }
  .sig-light.yel-l.on { box-shadow: 0 0 8px #eab308; }
  .sig-light.grn-l { background: #22c55e; }
  .sig-light.grn-l.on { box-shadow: 0 0 8px #22c55e; }
  .sig-label { font-size: 11px; color: #64748b; margin-left: 4px; text-transform: capitalize; }
  .intersect-stat { font-size: 11px; color: #475569; }
  .intersect-stat span { color: #94a3b8; }
  .sidebar { display: flex; flex-direction: column; gap: 18px; }
  .alert-item { padding: 10px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 8px; border-left: 3px solid; }
  .alert-warn { background: rgba(251,191,36,0.08); border-color: #fbbf24; color: #fcd34d; }
  .alert-info { background: rgba(99,179,237,0.08); border-color: #63b3ed; color: #90cdf4; }
  .alert-ok   { background: rgba(52,211,153,0.08); border-color: #34d399; color: #6ee7b7; }
  .alert-time { font-size: 10px; opacity: 0.6; margin-top: 3px; }
  input[type=range] { width: 100%; height: 4px; border-radius: 2px; outline: none; background: linear-gradient(90deg, #00d4ff var(--val, 50%), #1e3a5f var(--val, 50%)); -webkit-appearance: none; cursor: pointer; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #00d4ff; border: 2px solid #0a0e1a; }
  .slider-labels { display: flex; justify-content: space-between; font-size: 10px; color: #475569; margin-top: 6px; }
  .slider-val { font-family: 'Orbitron', monospace; font-size: 13px; color: #00d4ff; text-align: center; margin-top: 4px; }
  .accuracy-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .acc-label { font-size: 11px; color: #64748b; }
  .acc-bar-bg { flex: 1; height: 5px; background: #1e3a5f; border-radius: 3px; margin: 0 10px; }
  .acc-bar { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #00d4ff, #00ff80); transition: width 0.5s; }
  .acc-val { font-size: 11px; font-family: 'Orbitron', monospace; color: #00d4ff; min-width: 32px; text-align: right; }
`;

export default function App() {
  const [data, setData] = useState(intersections);
  const [density, setDensity] = useState(5);
  const [stats, setStats] = useState(null);
  const [volHistory, setVolHistory] = useState(
    Array.from({ length: 14 }, (_, i) => ({ t: i + 1, v: 130 }))
  );
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => simulateTick(prev, density));
      setVolHistory(prev => {
        const next = [...prev.slice(1), {
          t: prev[prev.length - 1].t + 1,
          v: generateVolume(density)
        }];
        return next;
      });
      setTime(new Date().toLocaleTimeString());
    }, 2000);
    return () => clearInterval(timer);
  }, [density]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/api/stats`);
        const d = await res.json();
        setStats(d);
      } catch (e) {
        console.log("API offline, using simulation");
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const avgWait = Math.round(data.reduce((a, x) => a + x.wait, 0) / data.length);
  const totalVpm = Math.round(100 + density * 8);
  const sliderPct = ((density - 1) / 9 * 100).toFixed(0);

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard">
        <div className="topbar">
          <div className="topbar-left">
            <div className="logo-dot">🚦</div>
            <div>
              <div className="topbar-title">TrafficAI Control</div>
              <div className="topbar-sub">Cloud-based signal optimization system</div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="time-display">{time}</div>
            <div className="live-badge">
              <div className="live-dot" />
              Live
            </div>
          </div>
        </div>

        <div className="content">
          <div className="metrics-row">
            {[
              { label: "Avg wait time",      value: stats ? stats.avg_wait : avgWait,               unit: "s",  sub: "▼ 18% vs baseline",     subClass: "up",   color: "blue"   },
              { label: "Vehicles / min",     value: stats ? stats.vehicles_per_min : totalVpm,                  sub: "across 4 intersections",                  color: "green"  },
              { label: "Signal efficiency",  value: stats ? stats.efficiency : 87,                  unit: "%",  sub: "▲ 12% optimized",       subClass: "up",   color: "purple" },
              { label: "Incidents detected", value: stats ? stats.incidents : 2,                                sub: "1 active · 1 resolved", subClass: "warn", color: "orange" },
            ].map((m, i) => (
              <div key={i} className={`metric-card ${m.color}`}>
                <div className="metric-label">{m.label}</div>
                <div className={`metric-value ${m.color}`}>
                  {m.value}
                  {m.unit && <span className="metric-unit">{m.unit}</span>}
                </div>
                <div className={`metric-sub ${m.subClass || ""}`}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="main-grid">
            <div>
              <div className="card">
                <div className="card-title">
                  <div className="card-title-dot" style={{ background: "#00d4ff" }} />
                  Intersection signal states
                </div>
                <div className="intersect-grid">
                  {data.map(x => (
                    <div key={x.id} className={`intersect-box ${x.state === "green" ? "active" : ""}`}>
                      <div className="intersect-name">{x.name}</div>
                      <div className="signal-lights">
                        <div className={`sig-light red-l ${x.state === "red" ? "on" : ""}`} />
                        <div className={`sig-light yel-l ${x.state === "yellow" ? "on" : ""}`} />
                        <div className={`sig-light grn-l ${x.state === "green" ? "on" : ""}`} />
                        <span className="sig-label">{x.state}</span>
                      </div>
                      <div className="intersect-stat">
                        Wait: <span>{x.wait}s</span> &nbsp;|&nbsp; Queue: <span>{x.queue} vehicles</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  <div className="card-title-dot" style={{ background: "#00ff80" }} />
                  Traffic volume — live simulation
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={volHistory}>
                    <XAxis dataKey="t" hide />
                    <YAxis domain={[80, 200]} hide />
                    <Tooltip
                      contentStyle={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }}
                      formatter={v => [`${v} v/min`, "Volume"]}
                    />
                    <Line type="monotone" dataKey="v" stroke="#00d4ff" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-title">
                  <div className="card-title-dot" style={{ background: "#c084fc" }} />
                  ML model prediction accuracy
                </div>
                {[["5 min ahead", 94], ["15 min ahead", 89], ["30 min ahead", 83], ["60 min ahead", 76]].map(([label, val]) => (
                  <div key={label} className="accuracy-row">
                    <span className="acc-label">{label}</span>
                    <div className="acc-bar-bg">
                      <div className="acc-bar" style={{ width: `${val}%` }} />
                    </div>
                    <span className="acc-val">{val}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="sidebar">
              <div className="card">
                <div className="card-title">
                  <div className="card-title-dot" style={{ background: "#fbbf24" }} />
                  Alerts
                </div>
                {[
                  { msg: "High congestion — NH-8 / Ring Rd", time: "2 min ago",  type: "warn" },
                  { msg: "Model retrained on new data",       time: "11 min ago", type: "info" },
                  { msg: "Sector-5 incident resolved",        time: "24 min ago", type: "ok"   },
                ].map((a, i) => (
                  <div key={i} className={`alert-item alert-${a.type}`}>
                    {a.msg}
                    <div className="alert-time">{a.time}</div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-title">
                  <div className="card-title-dot" style={{ background: "#00d4ff" }} />
                  Queue lengths
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={data.map(x => ({ name: x.name.split(" ")[0], q: x.queue }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="q" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-title">
                  <div className="card-title-dot" style={{ background: "#00ff80" }} />
                  Traffic density control
                </div>
                <input
                  type="range" min="1" max="10" value={density} step="1"
                  style={{ "--val": `${sliderPct}%`, width: "100%", marginBottom: 4 }}
                  onChange={e => setDensity(Number(e.target.value))}
                />
                <div className="slider-val">{density} / 10</div>
                <div className="slider-labels"><span>Low traffic</span><span>High traffic</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}