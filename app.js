const C = window.CONFIG;
const $ = id => document.getElementById(id);
let usbMode = false;

// ---------- charts ----------
function makeChart(canvas, label, color, min, max) {
  return new Chart(canvas, {
    type: "line",
    data: { labels: [], datasets: [
      { label, data: [], borderColor: color, backgroundColor: color, tension: .3, pointRadius: 2 },
      { label: "Min " + min, data: [], borderColor: "#c2575b", borderDash: [6, 4], pointRadius: 0 },
      { label: "Max " + max, data: [], borderColor: "#c2575b", borderDash: [6, 4], pointRadius: 0 }
    ]},
    options: { animation: false, plugins: { legend: { labels: { boxWidth: 14 } } }, scales: { x: { ticks: { maxTicksLimit: 6 } } } }
  });
}
const moistChart = makeChart($("cMoist"), "Moisture %", "#4f7f4a", C.MOIST_MIN, C.MOIST_MAX);
const tempChart  = makeChart($("cTemp"),  "Temperature °C", "#d9992b", C.TEMP_MIN, C.TEMP_MAX);

function fillChart(chart, labels, values, min, max) {
  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.data.datasets[1].data = labels.map(() => min);
  chart.data.datasets[2].data = labels.map(() => max);
  chart.update();
}

// ---------- rendering ----------
function setTile(id, state) {
  const el = $(id);
  el.classList.remove("low", "high");
  if (state) el.classList.add(state);
}

function render(r) {           // r = {temp, moist, hum, ph, bed, time}
  const alerts = [];
  const fmt = (v, d = 1) => (v == null || isNaN(v)) ? "--" : Number(v).toFixed(d);

  $("vMoist").textContent = fmt(r.moist);
  $("vTemp").textContent  = fmt(r.temp);
  $("vHum").textContent   = fmt(r.hum, 0);
  $("vPh").textContent    = fmt(r.ph, 2);
  if (r.bed) $("bedLine").textContent = "Bed " + r.bed;

  let ms = null, ts = null;
  if (r.moist != null && r.moist < C.MOIST_MIN) { ms = "low";  alerts.push(`Moisture is too low (${fmt(r.moist)}%). Water the bed.`); }
  if (r.moist != null && r.moist > C.MOIST_MAX) { ms = "high"; alerts.push(`Moisture is too high (${fmt(r.moist)}%). Let the bed drain or add dry bedding.`); }
  if (r.temp != null && r.temp < C.TEMP_MIN)    { ts = "low";  alerts.push(`Temperature is too low (${fmt(r.temp)}°C). Worms slow down in the cold.`); }
  if (r.temp != null && r.temp > C.TEMP_MAX)    { ts = "high"; alerts.push(`Temperature is too high (${fmt(r.temp)}°C). Shade or cool the bed.`); }
  setTile("tMoist", ms); setTile("tTemp", ts);

  $("tPh").classList.toggle("off", !C.SHOW_PH);
  if (C.SHOW_PH && r.ph != null) {
    let ps = r.ph < 6.5 ? "low" : r.ph > 7.5 ? "high" : null;
    setTile("tPh", ps);
    if (ps) alerts.push(`pH is out of range (${fmt(r.ph, 2)}).`);
  }

  $("alerts").innerHTML = alerts.map(a => `<div class="alert" role="alert">${a}</div>`).join("");
  $("updated").textContent = "Last reading: " + r.time.toLocaleString();

  const ageMin = (Date.now() - r.time.getTime()) / 60000;
  const st = $("status");
  if (usbMode) { st.textContent = "Live from USB"; st.className = "pill ok"; }
  else if (ageMin > C.STALE_MINUTES) { st.textContent = "No new data"; st.className = "pill bad"; }
  else { st.textContent = "Live"; st.className = "pill ok"; }
}

// ---------- ThingSpeak ----------
async function loadThingSpeak() {
  if (usbMode) return;
  if (!C.CHANNEL_ID) { $("status").textContent = "Set CHANNEL_ID in config.js"; $("status").className = "pill bad"; return; }
  const key = C.READ_API_KEY ? `&api_key=${C.READ_API_KEY}` : "";
  const url = `https://api.thingspeak.com/channels/${C.CHANNEL_ID}/feeds.json?results=${C.HISTORY_POINTS}${key}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const feeds = (await res.json()).feeds || [];
    if (!feeds.length) { $("updated").textContent = "Channel has no data yet."; return; }
    const num = v => (v === null || v === undefined || v === "") ? null : Number(v);
    const rows = feeds.map(f => ({
      time: new Date(f.created_at), temp: num(f.field1), moist: num(f.field2), ph: num(f.field3),
      bed: f.field4, hum: num(f.field5)
    }));
    const labels = rows.map(r => r.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    fillChart(moistChart, labels, rows.map(r => r.moist), C.MOIST_MIN, C.MOIST_MAX);
    fillChart(tempChart,  labels, rows.map(r => r.temp),  C.TEMP_MIN,  C.TEMP_MAX);
    render(rows[rows.length - 1]);
  } catch (e) {
    $("status").textContent = "Can't reach ThingSpeak"; $("status").className = "pill bad";
    $("updated").textContent = "Check CHANNEL_ID, READ_API_KEY and your internet. (" + e.message + ")";
  }
}
loadThingSpeak();
setInterval(loadThingSpeak, C.REFRESH_SECONDS * 1000);

// ---------- USB mode (Web Serial: Chrome or Edge only) ----------
// Reads the lines your sketch prints, e.g.
// "Air: 24.3 C, 61 %RH | Moisture: 52.4 % (raw 2100) | pH: 7.00 (raw 2048)"
const LINE = /Air:\s*(-?[\d.]+)\s*C,\s*(\d+)\s*%RH\s*\|\s*Moisture:\s*(-?[\d.]+)\s*%/;

$("usbBtn").addEventListener("click", async () => {
  if (!("serial" in navigator)) { alert("USB mode needs Chrome or Edge on a computer."); return; }
  try {
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    usbMode = true;
    $("usbBtn").disabled = true; $("usbBtn").textContent = "USB connected";
    moistChart.data.labels = []; moistChart.data.datasets.forEach(d => d.data = []);
    tempChart.data.labels = [];  tempChart.data.datasets.forEach(d => d.data = []);

    const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader();
    let buf = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      const lines = buf.split("\n"); buf = lines.pop();
      for (const line of lines) {
        const m = line.match(LINE);
        if (!m) continue;
        const r = { time: new Date(), temp: +m[1], hum: +m[2], moist: +m[3], ph: null, bed: 1 };
        const lbl = r.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        for (const [chart, v, lo, hi] of [[moistChart, r.moist, C.MOIST_MIN, C.MOIST_MAX], [tempChart, r.temp, C.TEMP_MIN, C.TEMP_MAX]]) {
          chart.data.labels.push(lbl);
          chart.data.datasets[0].data.push(v);
          chart.data.datasets[1].data.push(lo);
          chart.data.datasets[2].data.push(hi);
          if (chart.data.labels.length > C.HISTORY_POINTS) chart.data.datasets.forEach(d => d.data.shift()), chart.data.labels.shift();
          chart.update();
        }
        render(r);
      }
    }
  } catch (e) {
    usbMode = false; $("usbBtn").disabled = false; $("usbBtn").textContent = "Connect by USB";
    alert("USB connection failed: " + e.message + "\nClose the Arduino Serial Monitor first, then try again.");
  }
});
