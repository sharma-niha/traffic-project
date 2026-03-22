import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area
} from "recharts";
import { intersections, simulateTick, generateVolume } from "./utils/trafficSim";

const API = "http://127.0.0.1:8000";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0e1a; color: #e2e8f0; font-family: 'Inter', sans-serif; }
  .dashboard { min-height: 100vh; background: #0a0e1a; }
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
  .nav-tabs { display: flex; gap: 4px; padding: 12px 28px; border-bottom: 1px solid #1e3a5f; background: #0d1b2a; }
  .nav-tab { padding: 7px 18px; border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid transparent; color: #64748b; transition: all 0.2s; }
  .nav-tab:hover { color: #94a3b8; background: #1a2744; }
  .nav-tab.active { color: #00d4ff; background: rgba(0,212,255,0.1); border-color: rgba(0,212,255,0.3); }
  .content { padding: 24px 28px; }
  .metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .metric-card { background: linear-gradient(135deg, #0d1b2a, #1a2744); border: 1px solid #1e3a5f; border-radius: 14px; padding: 18px 20px; position: relative; overflow: hidden; }
  .metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .metric-card.blue::before   { background: linear-gradient(90deg, #0066ff, #00d4ff); }
  .metric-card.green::before  { background: linear-gradient(90deg, #00b894, #00ff80); }
  .metric-card.purple::before { background: linear-gradient(90deg, #6c3fff, #c084fc); }
  .metric-card.orange::before { background: linear-gradient(90deg, #ff6b35, #ffd93d); }
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
  .card-title { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
  .card-title-left { display: flex; align-items: center; gap: 8px; }
  .card-title-dot { width: 6px; height: 6px; border-radius: 50%; }
  .intersect-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .intersect-box { background: #0a0e1a; border: 1px solid #1e3a5f; border-radius: 10px; padding: 12px; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
  .intersect-box:hover { border-color: #00d4ff; background: #0d1b2a; }
  .intersect-box.active { border-color: #00ff80; }
  .intersect-name { font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 8px; }
  .signal-lights { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
  .sig-light { width: 13px; height: 13px; border-radius: 50%; opacity: 0.2; transition: opacity 0.3s, box-shadow 0.3s; }
  .sig-light.on { opacity: 1; }
  .sig-light.red-l { background: #ef4444; } .sig-light.red-l.on { box-shadow: 0 0 8px #ef4444; }
  .sig-light.yel-l { background: #eab308; } .sig-light.yel-l.on { box-shadow: 0 0 8px #eab308; }
  .sig-light.grn-l { background: #22c55e; } .sig-light.grn-l.on { box-shadow: 0 0 8px #22c55e; }
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
  .heatmap-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .heat-cell { border-radius: 8px; padding: 10px 8px; text-align: center; cursor: pointer; transition: transform 0.2s; }
  .heat-cell:hover { transform: scale(1.04); }
  .heat-name { font-size: 10px; font-weight: 600; margin-bottom: 4px; }
  .heat-val  { font-family: 'Orbitron', monospace; font-size: 16px; font-weight: 700; }
  .heat-sub  { font-size: 9px; margin-top: 3px; opacity: 0.8; }
  .optimizer-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 10px; background: #0a0e1a; border-radius: 8px; }
  .opt-name { font-size: 11px; color: #94a3b8; width: 120px; flex-shrink: 0; }
  .opt-bar-wrap { flex: 1; display: flex; gap: 3px; }
  .opt-seg { height: 18px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; transition: width 0.5s; }
  .opt-green  { background: rgba(34,197,94,0.3);  color: #22c55e; }
  .opt-yellow { background: rgba(234,179,8,0.3);  color: #eab308; }
  .opt-red    { background: rgba(239,68,68,0.3);  color: #ef4444; }
  .export-btn { padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid rgba(0,212,255,0.4); background: rgba(0,212,255,0.08); color: #00d4ff; transition: all 0.2s; }
  .export-btn:hover { background: rgba(0,212,255,0.18); }
  .prediction-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .pred-card { background: #0a0e1a; border-radius: 10px; padding: 12px; text-align: center; }
  .pred-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .pred-value { font-family: 'Orbitron', monospace; font-size: 20px; font-weight: 700; color: #c084fc; }
  .pred-sub   { font-size: 10px; color: #64748b; margin-top: 4px; }
  .tab-content { display: none; }
  .tab-content.active { display: block; }
`;

function getCongestionColor(volume) {
  if (volume > 170) return { bg: "rgba(239,68,68,0.15)",   text: "#ef4444", label: "Critical" };
  if (volume > 140) return { bg: "rgba(234,179,8,0.15)",   text: "#eab308", label: "High" };
  if (volume > 100) return { bg: "rgba(251,146,60,0.15)",  text: "#fb923c", label: "Medium" };
  return               { bg: "rgba(34,197,94,0.15)",    text: "#22c55e", label: "Low" };
}

function exportCSV(data) {
  const headers = ["Intersection","State","Wait(s)","Queue","Volume"];
  const rows = data.map(x => [x.name, x.state, x.wait, x.queue, Math.round(80 + Math.random() * 120)]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "traffic_data.csv"; a.click();
}

export default function App() {
  const [data, setData]           = useState(intersections);
  const [density, setDensity]     = useState(5);
  const [stats, setStats]         = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [prediction, setPrediction] = useState({ volume: 142, trend: "+8%", confidence: "87%" });
  const [volHistory, setVolHistory] = useState(
    Array.from({ length: 14 }, (_, i) => ({ t: i + 1, v: 130 }))
  );
  const [predHistory, setPredHistory] = useState(
    Array.from({ length: 14 }, (_, i) => ({ t: i + 1, actual: 130, predicted: 133 }))
  );
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => simulateTick(prev, density));
      const newVol = generateVolume(density);
      setVolHistory(prev => [...prev.slice(1), { t: prev[prev.length-1].t + 1, v: newVol }]);
      setPredHistory(prev => [...prev.slice(1), {
        t: prev[prev.length-1].t + 1,
        actual: newVol,
        predicted: Math.round(newVol + (Math.random() - 0.5) * 12)
      }]);
      setPrediction({
        volume: Math.round(newVol + density * 2),
        trend:  newVol > 140 ? "+8%" : "-4%",
        confidence: `${Math.round(85 + Math.random() * 10)}%`
      });
      setTime(new Date().toLocaleTimeString());
    }, 2000);
    return () => clearInterval(timer);
  }, [density]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/api/stats`);
        const d   = await res.json();
        setStats(d);
      } catch { console.log("API offline, using simulation"); }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const avgWait  = Math.round(data.reduce((a, x) => a + x.wait, 0) / data.length);
  const totalVpm = Math.round(100 + density * 8);
  const sliderPct = ((density - 1) / 9 * 100).toFixed(0);

  const tabs = ["overview", "heatmap", "optimizer", "prediction"];

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard">

        {/* Topbar */}
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
            <div className="live-badge"><div className="live-dot" />Live</div>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="nav-tabs">
          {tabs.map(tab => (
            <div key={tab} className={`nav-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          ))}
        </div>

        <div className="content">
          {/* Metric Cards — always visible */}
          <div className="metrics-row">
            {[
              { label: "Avg wait time",      value: stats ? stats.avg_wait : avgWait,            unit: "s",  sub: "▼ 18% vs baseline",     subClass: "up",   color: "blue"   },
              { label: "Vehicles / min",     value: stats ? stats.vehicles_per_min : totalVpm,               sub: "across 4 intersections",                  color: "green"  },
              { label: "Signal efficiency",  value: stats ? stats.efficiency : 87,               unit: "%",  sub: "▲ 12% optimized",       subClass: "up",   color: "purple" },
              { label: "Incidents detected", value: stats ? stats.incidents : 2,                             sub: "1 active · 1 resolved", subClass: "warn", color: "orange" },
            ].map((m, i) => (
              <div key={i} className={`metric-card ${m.color}`}>
                <div className="metric-label">{m.label}</div>
                <div className={`metric-value ${m.color}`}>
                  {m.value}{m.unit && <span className="metric-unit">{m.unit}</span>}
                </div>
                <div className={`metric-sub ${m.subClass || ""}`}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="main-grid">
              <div>
                <div className="card">
                  <div className="card-title">
                    <div className="card-title-left">
                      <div className="card-title-dot" style={{ background: "#00d4ff" }} />
                      Intersection signal states
                    </div>
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
                    <div className="card-title-left">
                      <div className="card-title-dot" style={{ background: "#00ff80" }} />
                      Traffic volume — live simulation
                    </div>
                    <button className="export-btn" onClick={() => exportCSV(data)}>Export CSV</button>
                  </div>
                  <ResponsiveContainer width="100%" height={130}>
                    <AreaChart data={volHistory}>
                      <defs>
                        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="t" hide />
                      <YAxis domain={[80, 200]} hide />
                      <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }} formatter={v => [`${v} v/min`]} />
                      <Area type="monotone" dataKey="v" stroke="#00d4ff" strokeWidth={2} fill="url(#volGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <div className="card-title">
                    <div className="card-title-left">
                      <div className="card-title-dot" style={{ background: "#c084fc" }} />
                      ML model prediction accuracy
                    </div>
                  </div>
                  {[["5 min ahead", 94], ["15 min ahead", 89], ["30 min ahead", 83], ["60 min ahead", 76]].map(([label, val]) => (
                    <div key={label} className="accuracy-row">
                      <span className="acc-label">{label}</span>
                      <div className="acc-bar-bg"><div className="acc-bar" style={{ width: `${val}%` }} /></div>
                      <span className="acc-val">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar">
                <div className="card">
                  <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#fbbf24" }} />Alerts</div></div>
                  {[
                    { msg: "High congestion — NH-8 / Ring Rd", time: "2 min ago",  type: "warn" },
                    { msg: "Model retrained on new data",       time: "11 min ago", type: "info" },
                    { msg: "Sector-5 incident resolved",        time: "24 min ago", type: "ok"   },
                  ].map((a, i) => (
                    <div key={i} className={`alert-item alert-${a.type}`}>
                      {a.msg}<div className="alert-time">{a.time}</div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#00d4ff" }} />Queue lengths</div></div>
                  <ResponsiveContainer width="100%" height={110}>
                    <BarChart data={data.map(x => ({ name: x.name.split(" ")[0], q: x.queue }))}>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="q" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#00ff80" }} />Traffic density control</div></div>
                  <input type="range" min="1" max="10" value={density} step="1"
                    style={{ "--val": `${sliderPct}%`, width: "100%", marginBottom: 4 }}
                    onChange={e => setDensity(Number(e.target.value))} />
                  <div className="slider-val">{density} / 10</div>
                  <div className="slider-labels"><span>Low</span><span>High</span></div>
                </div>
              </div>
            </div>
          )}

          {/* HEATMAP TAB */}
          {activeTab === "heatmap" && (
            <div>
              <div className="card">
                <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#ef4444" }} />Congestion heatmap — all intersections</div></div>
                <div className="heatmap-grid">
                  {data.map(x => {
                    const vol = Math.round(80 + x.queue * 6 + density * 8);
                    const c   = getCongestionColor(vol);
                    return (
                      <div key={x.id} className="heat-cell" style={{ background: c.bg }}>
                        <div className="heat-name" style={{ color: c.text }}>{x.name}</div>
                        <div className="heat-val"  style={{ color: c.text }}>{vol}</div>
                        <div className="heat-sub"  style={{ color: c.text }}>v/min · {c.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#00d4ff" }} />Volume comparison — all intersections</div></div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.map(x => ({
                    name: x.name.split(" ")[0],
                    volume: Math.round(80 + x.queue * 6 + density * 8),
                    queue: x.queue,
                    wait: x.wait
                  }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="volume" name="Volume"     fill="#00d4ff" radius={[4,4,0,0]} />
                    <Bar dataKey="wait"   name="Wait (s)"  fill="#c084fc" radius={[4,4,0,0]} />
                    <Bar dataKey="queue"  name="Queue"     fill="#00ff80" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* OPTIMIZER TAB */}
          {activeTab === "optimizer" && (
            <div>
              <div className="card">
                <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#00ff80" }} />AI-optimized signal timing</div></div>
                {data.map(x => {
                  const greenTime  = Math.round(20 + (10 - density) * 2 + (x.queue > 15 ? 5 : 0));
                  const yellowTime = 5;
                  const redTime    = Math.round(60 - greenTime - yellowTime);
                  const total      = greenTime + yellowTime + redTime;
                  return (
                    <div key={x.id} className="optimizer-row">
                      <div className="opt-name">{x.name}</div>
                      <div className="opt-bar-wrap">
                        <div className="opt-seg opt-green"  style={{ width: `${greenTime/total*100}%` }}>{greenTime}s</div>
                        <div className="opt-seg opt-yellow" style={{ width: `${yellowTime/total*100}%` }}>{yellowTime}s</div>
                        <div className="opt-seg opt-red"    style={{ width: `${redTime/total*100}%` }}>{redTime}s</div>
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 11, color: "#64748b" }}>
                  <span style={{ color: "#22c55e" }}>■ Green phase</span>
                  <span style={{ color: "#eab308" }}>■ Yellow phase</span>
                  <span style={{ color: "#ef4444" }}>■ Red phase</span>
                </div>
              </div>

              <div className="card">
                <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#ffd93d" }} />Optimization impact</div></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                  {[
                    { label: "Wait time reduced",   value: "18%",  color: "#00ff80" },
                    { label: "Throughput increased", value: "24%",  color: "#00d4ff" },
                    { label: "Idle time cut",        value: "31%",  color: "#c084fc" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "#0a0e1a", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                      <div style={{ fontFamily: "Orbitron, monospace", fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PREDICTION TAB */}
          {activeTab === "prediction" && (
            <div>
              <div className="card">
                <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#c084fc" }} />AI traffic forecast — next 60 minutes</div></div>
                <div className="prediction-grid">
                  {[
                    { label: "Predicted volume",  value: prediction.volume,     unit: "v/min" },
                    { label: "Traffic trend",      value: prediction.trend,      unit: ""      },
                    { label: "Model confidence",   value: prediction.confidence, unit: ""      },
                    { label: "Model accuracy",     value: "95.57%",              unit: ""      },
                  ].map((p, i) => (
                    <div key={i} className="pred-card">
                      <div className="pred-label">{p.label}</div>
                      <div className="pred-value">{p.value}<span style={{ fontSize: 12 }}>{p.unit}</span></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#00d4ff" }} />Actual vs predicted volume</div></div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={predHistory}>
                    <XAxis dataKey="t" hide />
                    <YAxis domain={[80, 200]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="actual"    stroke="#00d4ff" strokeWidth={2} dot={false} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#c084fc" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Predicted" />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#64748b", marginTop: 10 }}>
                  <span style={{ color: "#00d4ff" }}>— Actual</span>
                  <span style={{ color: "#c084fc" }}>– – Predicted</span>
                </div>
              </div>

              <div className="card">
                <div className="card-title"><div className="card-title-left"><div className="card-title-dot" style={{ background: "#fbbf24" }} />Per-intersection forecast</div></div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={data.map(x => ({
                    name: x.name.split(" ")[0],
                    current:   Math.round(80 + x.queue * 5),
                    predicted: Math.round(80 + x.queue * 5 + density * 3),
                  }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="current"   name="Current"   fill="#00d4ff" radius={[4,4,0,0]} />
                    <Bar dataKey="predicted" name="Predicted" fill="#c084fc" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}