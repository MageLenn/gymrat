// GymRat — offline gym tracker. All data stays on the device (IndexedDB).
"use strict";
(() => {
  const I = window.ICONS;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const nf = (v, d = 2) => Number(v || 0).toLocaleString("de-DE", { maximumFractionDigits: d });
  const r2 = (v) => Math.round(v * 100) / 100;
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const keyToDate = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const mondayOf = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
  const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const fmtDate = (t) => new Date(t).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
  const fmtDur = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
  const mmss = (s) => `${Math.floor(s / 60)}:${pad(s % 60)}`;
  const opts = (list, cur) => list.map((o) => {
    const v = typeof o === "object" ? o.v : o, l = typeof o === "object" ? o.l : o;
    return `<option value="${esc(v)}"${String(v) === String(cur) ? " selected" : ""}>${esc(l)}</option>`;
  }).join("");
  const range = (a, b, s = 1) => { const out = []; for (let v = a; v <= b + 1e-9; v += s) out.push(r2(v)); return out; };

  // ---------- constants ----------
  // Muscle groups and the finer muscles inside each group (names are unique across groups).
  const PARTS = {
    Brust: ["Obere Brust", "Mittlere Brust", "Untere Brust"],
    "Rücken": ["Latissimus", "Trapez", "Mittlerer Rücken", "Unterer Rücken"],
    Schultern: ["Vordere Schulter", "Seitliche Schulter", "Hintere Schulter", "Rotatorenmanschette"],
    Bizeps: ["Bizeps", "Brachialis"],
    Trizeps: ["Langer Trizepskopf", "Seitlicher Trizepskopf", "Innerer Trizepskopf"],
    Unterarme: ["Brachioradialis", "Unterarmbeuger", "Unterarmstrecker"],
    Bauch: ["Gerader Bauch", "Seitlicher Bauch", "Unterer Bauch", "Hüftbeuger"],
    Quadrizeps: ["Gerader Schenkelmuskel", "Äußerer Schenkelmuskel", "Innerer Schenkelmuskel"],
    Beinbeuger: ["Äußerer Beinbeuger", "Innerer Beinbeuger"],
    "Gesäß": ["Großer Gesäßmuskel", "Mittlerer Gesäßmuskel"],
    Waden: ["Zwillingswadenmuskel", "Schollenmuskel"],
    "Adduktoren / Abduktoren": ["Adduktoren", "Abduktoren"],
    "Ganzkörper": [],
    Ausdauer: []
  };
  const MUSCLES = Object.keys(PARTS);
  const PART_GROUP = Object.fromEntries(Object.entries(PARTS).flatMap(([g, ps]) => ps.map((p) => [p, g])));
  // Turns an old free-text "trains" description into groups and fine muscles.
  const TEXT_MAP = [
    ["obere brust", ["Obere Brust"]], ["untere brust", ["Untere Brust"]], ["brust", ["Mittlere Brust"]],
    ["vordere & seitliche schulter", ["Vordere Schulter", "Seitliche Schulter"]], ["vordere schulter", ["Vordere Schulter"]],
    ["seitliche schulter", ["Seitliche Schulter"]], ["hintere schulter", ["Hintere Schulter"]], ["rotatoren", ["Rotatorenmanschette"]], ["schulter", ["@Schultern"]],
    ["langer kopf", ["Langer Trizepskopf"]], ["trizeps", PARTS.Trizeps],
    ["brachialis", ["Brachialis"]], ["bizeps", ["Bizeps"]], ["unterarm", ["Brachioradialis"]],
    ["latissimus", ["Latissimus"]], ["oberer rücken", ["Trapez"]], ["trapez", ["Trapez"]], ["mittlerer rücken", ["Mittlerer Rücken"]], ["unterer rücken", ["Unterer Rücken"]],
    ["gerader bauch", ["Gerader Bauch"]], ["seitliche bauch", ["Seitlicher Bauch"]], ["unterer bauch", ["Unterer Bauch"]], ["hüftbeuger", ["Hüftbeuger"]], ["rumpf", ["Gerader Bauch", "Seitlicher Bauch"]],
    ["quadrizeps", PARTS.Quadrizeps], ["beinbeuger", PARTS.Beinbeuger], ["gesäß", ["Großer Gesäßmuskel"]], ["waden", PARTS.Waden], ["adduktoren", ["Adduktoren"]],
    ["beine", ["@Quadrizeps", "@Beinbeuger", "@Waden"]], ["arme", ["@Bizeps", "@Trizeps"]], ["ganzkörper", ["@Ganzkörper"]], ["ausdauer", ["@Ausdauer"]]
  ];
  function partsFromText(text) {
    const parts = [], groups = [];
    for (const item of String(text || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)) {
      const hit = TEXT_MAP.find(([k]) => item.includes(k)); if (!hit) continue;
      for (const v of hit[1]) {
        const g = v[0] === "@" ? v.slice(1) : PART_GROUP[v];
        if (v[0] !== "@" && !parts.includes(v)) parts.push(v);
        if (g && !groups.includes(g)) groups.push(g);
      }
    }
    return { parts, groups };
  }
  const MUSCLE_PIC = { Brust: "bench", "Rücken": "pulldown", Schultern: "shoulder", Bizeps: "curl", Trizeps: "triceps", Unterarme: "curl", Bauch: "abs", Quadrizeps: "legpress", Beinbeuger: "legext", "Gesäß": "legpress", Waden: "calf", "Adduktoren / Abduktoren": "legext", "Ganzkörper": "generic" };
  const CARDIO = {
    bike: { l: "Fahrrad", mode: "level", pic: "bike" },
    treadmill: { l: "Laufband", mode: "speed", pic: "treadmill" },
    crosstrainer: { l: "Crosstrainer", mode: "level", pic: "crosstrainer" },
    rower: { l: "Rudergerät", mode: "level", pic: "rower" },
    stepper: { l: "Stepper", mode: "level", pic: "stepper" },
    other: { l: "Sonstiges", mode: "level", pic: "generic" }
  };
  const TYPE_L = { frei: "Freies Training", cardio: "Cardio", push: "Push", pull: "Pull", legs: "Legs" };
  const planById = (id) => S.plans.find((p) => p.id === id);
  // A workout keeps its plan's name at the time it was trained, so renaming a plan never rewrites history.
  const wName = (w) => w.name || (planById(w.type) || {}).name || TYPE_L[w.type] || "Training";

  // ---------- storage ----------
  const idb = {
    db: null,
    open() {
      return new Promise((res, rej) => {
        const r = indexedDB.open("gymrat", 1);
        r.onupgradeneeded = () => { r.result.createObjectStore("kv"); r.result.createObjectStore("photos"); };
        r.onsuccess = () => { this.db = r.result; res(); };
        r.onerror = () => rej(r.error);
      });
    },
    req(store, mode, fn) {
      return new Promise((res, rej) => {
        const t = this.db.transaction(store, mode); const q = fn(t.objectStore(store));
        t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error);
      });
    },
    get(s, k) { return this.req(s, "readonly", (o) => o.get(k)); },
    put(s, k, v) { return this.req(s, "readwrite", (o) => o.put(v, k)); },
    del(s, k) { return this.req(s, "readwrite", (o) => o.delete(k)); },
    all(s) {
      return new Promise((res, rej) => {
        const t = this.db.transaction(s); const o = t.objectStore(s); const ks = o.getAllKeys(), vs = o.getAll();
        t.oncomplete = () => { const out = {}; ks.result.forEach((k, i) => (out[k] = vs.result[i])); res(out); };
        t.onerror = () => rej(t.error);
      });
    }
  };

  const fresh = () => ({
    v: 2, seed: 0, devices: [], plans: [], workouts: [], body: [],
    settings: { rest: 90, weeklyGoal: 3, sets: 3 }, active: null
  });
  let S = fresh();
  let photos = {};
  let saveTimer = null;
  function save(now) {
    clearTimeout(saveTimer);
    const run = () => idb.db && idb.put("kv", "state", JSON.parse(JSON.stringify(S))).catch(() => toast("Speichern fehlgeschlagen"));
    if (now) run(); else saveTimer = setTimeout(run, 150);
  }

  // ---------- ui state (not saved) ----------
  const ui = {
    tab: "start", volFilter: "all", devSeg: "list", devCat: "kraft", devMuscle: "", plan: "",
    trainSeg: "kraft", cal: mondayOf(Date.now()), progDev: "", rating: 0, draft: null, pick: null,
    cardioForm: { deviceId: "", min: 20, level: 8, speed: 8, incline: 0 }
  };
  ui.cal = new Date(); ui.cal.setDate(1);

  // ---------- domain ----------
  const devById = (id) => S.devices.find((d) => d.id === id);
  const devMuscles = (d) => (d && Array.isArray(d.muscles) && d.muscles.length ? d.muscles : d && d.muscle ? [d.muscle] : []);
  const hasMuscle = (d, m) => !m || devMuscles(d).includes(m);
  const devPic = (d) => d.pic || (d.category === "cardio" ? (CARDIO[d.cardioType] || CARDIO.other).pic : MUSCLE_PIC[devMuscles(d)[0]] || "generic");
  const thumb = (d, cls = "") => `<div class="thumb ${cls}">${d && photos[d.id] ? `<img src="${photos[d.id]}" alt="">` : I.pic(d ? devPic(d) : "generic")}</div>`;
  const devParts = (d) => (d && Array.isArray(d.parts) ? d.parts : []);
  function trains(d) {
    if (!d) return "";
    const ps = devParts(d);
    const out = devMuscles(d).flatMap((g) => { const all = PARTS[g] || []; const sel = all.filter((p) => ps.includes(p));
      return sel.length && sel.length < all.length ? sel : [g]; });
    return esc(out.join(", ") || d.targets || "");
  }
  const muscleList = () => [...new Set([...MUSCLES, ...S.devices.flatMap(devMuscles)])];
  const kraftDevices = () => S.devices.filter((d) => d.category !== "cardio").sort((a, b) => a.name.localeCompare(b.name, "de"));
  const cardioDevices = () => S.devices.filter((d) => d.category === "cardio").sort((a, b) => a.name.localeCompare(b.name, "de"));
  const doneSets = (e) => (e.sets || []).filter((s) => s.done);
  const volOf = (w) => (w.entries || []).reduce((a, e) => a + doneSets(e).reduce((b, s) => b + s.w * s.r, 0), 0);

  function sessionsFor(id, before = Infinity) {
    const out = [];
    for (const w of S.workouts) {
      if (w.start >= before) continue;
      for (const e of w.entries || []) if (e.deviceId === id) { const sets = doneSets(e); if (sets.length) out.push({ w, sets, note: e.note }); }
    }
    return out.sort((a, b) => b.w.start - a.w.start);
  }
  function bestOf(id, before = Infinity) {
    let best = null;
    for (const s of sessionsFor(id, before)) for (const x of s.sets) if (!best || x.w > best.w || (x.w === best.w && x.r > best.r)) best = { w: x.w, r: x.r, t: s.w.start };
    return best;
  }
  const isPR = (set, best) => set.done && best && (set.w > best.w || (set.w === best.w && set.r > best.r));
  // 8–12 rule: all top sets at the upper rep limit -> one weight step more.
  function suggest(d, before = Infinity) {
    const ss = sessionsFor(d.id, before); if (!ss.length) return null;
    const last = ss[0]; const top = Math.max(...last.sets.map((s) => s.w)); const atTop = last.sets.filter((s) => s.w === top);
    const lo = d.repMin || 8, hi = d.repMax || 12;
    if (atTop.every((s) => s.r >= hi)) {
      return top > 0 ? { w: r2(top + PROG_STEP), r: lo, up: true, last, top } : { w: 0, r: hi + 1, up: true, last, top };
    }
    return { w: top, r: Math.min(hi, Math.min(...atTop.map((s) => s.r)) + 1), up: false, last, top };
  }
  // One weight list for every device: 0–250 kg in 0.5 kg steps. Built once; only the selected value changes.
  const PROG_STEP = 2.5;
  const WEIGHTS = range(0, 250, 0.5);
  const WEIGHT_OPTS = WEIGHTS.map((v) => `<option value="${v}">${v === 0 ? "0 kg (Körpergew.)" : `${nf(v)} kg`}</option>`).join("");
  function weightSelect(cur, attrs) {
    const v = WEIGHTS.includes(cur) ? cur : null;
    const extra = cur != null && v === null ? `<option value="${cur}" selected>${nf(cur)} kg</option>` : "";
    const html = v === null ? WEIGHT_OPTS : WEIGHT_OPTS.replace(`value="${v}">`, `value="${v}" selected>`);
    return `<select ${attrs}>${extra}${html}</select>`;
  }

  function trainedDays() { const m = new Map(); for (const w of S.workouts) { const k = dayKey(w.start); m.set(k, [...(m.get(k) || []), w]); } return m; }
  function streakInfo() {
    const goal = S.settings.weeklyGoal || 3; const days = trainedDays(); const weeks = new Map();
    for (const k of days.keys()) { const mk = dayKey(mondayOf(keyToDate(k))); weeks.set(mk, (weeks.get(mk) || 0) + 1); }
    const thisMon = mondayOf(Date.now()); const cur = weeks.get(dayKey(thisMon)) || 0;
    let n = cur >= goal ? 1 : 0; const d = new Date(thisMon);
    for (;;) { d.setDate(d.getDate() - 7); if ((weeks.get(dayKey(d)) || 0) >= goal) n++; else break; }
    let best = 0, run = 0;
    if (weeks.size) {
      const first = mondayOf(keyToDate([...weeks.keys()].sort()[0])); const w = new Date(first);
      while (w <= thisMon) { if ((weeks.get(dayKey(w)) || 0) >= goal) { run++; best = Math.max(best, run); } else if (dayKey(w) !== dayKey(thisMon)) run = 0; w.setDate(w.getDate() + 7); }
    }
    return { n, cur, goal, best: Math.max(best, n), days };
  }
  function dailyVolume(n, filter) {
    const out = []; const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = n - 1; i >= 0; i--) { const d = new Date(today); d.setDate(d.getDate() - i); out.push({ key: dayKey(d), d, value: 0 }); }
    const idx = new Map(out.map((o, i) => [o.key, i]));
    for (const w of S.workouts) {
      if (filter !== "all" && w.type !== filter) continue;
      const i = idx.get(dayKey(w.start)); if (i != null) out[i].value += volOf(w);
    }
    return out;
  }

  // ---------- charts (hand-drawn SVG) ----------
  const niceMax = (v) => { const p = 10 ** Math.floor(Math.log10(v)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; };
  const shortN = (v) => (v >= 1000 ? `${nf(v / 1000, 1)}k` : nf(v, 0));
  function barChart(items) {
    const W = 340, H = 160, pl = 32, pr = 4, pt = 16, pb = 22, iw = W - pl - pr, ih = H - pt - pb;
    const max = niceMax(Math.max(1, ...items.map((i) => i.value))); const bw = iw / items.length;
    let g = "";
    for (const f of [0, 0.5, 1]) { const y = pt + ih - ih * f; g += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/><text x="${pl - 5}" y="${y + 3}" text-anchor="end">${shortN(max * f)}</text>`; }
    items.forEach((it, i) => {
      const h = it.value > 0 ? Math.max(3, (it.value / max) * ih) : 2; const x = pl + i * bw + bw * 0.17, y = pt + ih - h;
      g += `<rect class="bar${it.value > 0 ? "" : " zero"}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * 0.66).toFixed(1)}" height="${h.toFixed(1)}" rx="3"><title>${esc(it.title || "")}</title></rect>`;
      g += `<text x="${(pl + i * bw + bw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(it.label)}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
  }
  function lineChart(pts, unit) {
    const W = 340, H = 170, pl = 36, pr = 14, pt = 18, pb = 22, iw = W - pl - pr, ih = H - pt - pb;
    const ys = pts.map((p) => p.y); let lo = Math.min(...ys), hi = Math.max(...ys);
    if (hi - lo < 1) { lo -= 1; hi += 1; } const padv = (hi - lo) * 0.15; lo = Math.max(0, lo - padv); hi += padv;
    const X = (i) => pl + (pts.length === 1 ? iw / 2 : (i / (pts.length - 1)) * iw);
    const Y = (v) => pt + ih - ((v - lo) / (hi - lo)) * ih;
    let g = "";
    for (const f of [0, 0.5, 1]) { const v = lo + (hi - lo) * f, y = Y(v); g += `<line class="grid" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/><text x="${pl - 5}" y="${y + 3}" text-anchor="end">${nf(v, 1)}</text>`; }
    const path = pts.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join("");
    if (pts.length > 1) g += `<path class="area" d="${path}L${X(pts.length - 1).toFixed(1)},${pt + ih}L${X(0).toFixed(1)},${pt + ih}Z"/><path class="line" d="${path}"/>`;
    pts.forEach((p, i) => { g += `<circle class="dotp" cx="${X(i).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3}"/>`; });
    const li = pts.length - 1;
    g += `<text class="val" x="${Math.min(X(li), W - pr - 2).toFixed(1)}" y="${(Y(pts[li].y) - 9).toFixed(1)}" text-anchor="end">${nf(pts[li].y, 1)} ${unit}</text>`;
    const lab = pts.length > 2 ? [0, Math.floor(li / 2), li] : pts.map((_, i) => i);
    [...new Set(lab)].forEach((i) => { g += `<text x="${X(i).toFixed(1)}" y="${H - 6}" text-anchor="${i === 0 && pts.length > 1 ? "start" : i === li && pts.length > 1 ? "end" : "middle"}">${esc(pts[i].label)}</text>`; });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
  }
  function volumeCard() {
    const data = dailyVolume(14, ui.volFilter); const total = data.reduce((a, b) => a + b.value, 0);
    const items = data.map((d) => ({ value: d.value, label: String(d.d.getDate()), title: `${fmtDate(d.d)}: ${nf(d.value, 0)} kg` }));
    const f = [["all", "Gesamt"], ...S.plans.map((p) => [p.id, p.name])];
    const filter = f.length <= 4
      ? `<div class="seg">${f.map(([k, l]) => `<button data-act="volFilter" data-v="${k}" class="${ui.volFilter === k ? "on" : ""}">${esc(l)}</button>`).join("")}</div>`
      : `<select id="volFilter" data-change="volFilter" aria-label="Plan">${opts(f.map(([v, l]) => ({ v, l })), ui.volFilter)}</select>`;
    return `<section class="card"><div class="card-h"><h2>Volumen · letzte 14 Tage</h2><span class="chip num">${nf(total, 0)} kg</span></div>
      ${filter}
      ${barChart(items)}<div class="muted small">Volumen = Gewicht × Wiederholungen aller erledigten Sätze pro Tag.</div></section>`;
  }

  // ---------- shell ----------
  const view = $("#view");
  function setTop(title, action = "") { $("#viewTitle").textContent = title; $("#topAction").innerHTML = action; }
  function render() {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === ui.tab));
    ({ start: vStart, training: vTraining, geraete: vDevices, statistik: vStats })[ui.tab]();
  }
  function go(tab) { ui.tab = tab; render(); window.scrollTo(0, 0); }

  function openSheet(html) {
    const wasClosed = $("#sheet").hidden; ui.sheetKind = null;
    $("#sheetBody").innerHTML = html; $("#sheet").hidden = false; document.body.style.overflow = "hidden";
    if (wasClosed) $(".sheet-panel").scrollTop = 0;
  }
  function closeSheet() { $("#sheet").hidden = true; $("#sheetBody").innerHTML = ""; document.body.style.overflow = ""; ui.pick = null; ui.draft = null; ui.sheetKind = null; }
  // Closing an edit sheet (swipe down or tap outside) saves it; other sheets just close.
  function dismissSheet() {
    if (ui.sheetKind === "device") return A.saveDevice(null, { dismiss: true });
    if (ui.sheetKind === "plan") return A.savePlan(null, { dismiss: true });
    closeSheet();
  }
  // Swipe the sheet down to dismiss it (only when its content is scrolled to the top).
  (() => {
    const panel = $(".sheet-panel"); let y0 = null, dy = 0;
    panel.addEventListener("touchstart", (e) => {
      if (panel.scrollTop > 0 || e.target.closest("select, input, textarea")) { y0 = null; return; }
      y0 = e.touches[0].clientY; dy = 0;
    }, { passive: true });
    panel.addEventListener("touchmove", (e) => {
      if (y0 == null) return; dy = e.touches[0].clientY - y0;
      if (dy > 0) { e.preventDefault(); panel.style.transition = "none"; panel.style.transform = `translateY(${dy}px)`; }
    }, { passive: false });
    const end = () => {
      if (y0 == null) return; y0 = null;
      panel.style.transition = "transform .2s ease-out"; panel.style.transform = "";
      if (dy > 100) dismissSheet();
      dy = 0;
    };
    panel.addEventListener("touchend", end); panel.addEventListener("touchcancel", end);
  })();
  let toastT = null;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2200); }
  // Two-tap confirm for destructive buttons (the viewer has no confirm dialogs).
  function armed(el, label) {
    if (el.dataset.armed) return true;
    el.dataset.armed = "1"; const old = el.innerHTML; el.innerHTML = label || "Nochmal tippen zum Bestätigen";
    setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.innerHTML = old; } }, 3500);
    return false;
  }

  // ---------- START ----------
  function startButtons() {
    const b = S.plans.map((p, i) => `<button class="start-btn ${i === 0 ? "push" : ""}" data-act="start" data-type="${esc(p.id)}"><b class="ellipsis" style="max-width:100%">${esc(p.name)}</b><span>${p.devices.length} Geräte</span></button>`).join("");
    return `<div class="start-grid">${b}
      <button class="start-btn wide" data-act="start" data-type="frei"><div><b>Freies Training</b><br><span>Geräte selbst wählen</span></div>${I.ui("chevron")}</button>
      <button class="start-btn wide" data-act="start" data-type="cardio"><div><b>Cardio</b><br><span>Fahrrad, Laufband & Co.</span></div>${I.ui("chevron")}</button></div>`;
  }
  // Opened in a Safari tab instead of from the home screen: explain how to get the app view without browser bars.
  const isStandalone = () => navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
  function installHint() {
    if (isStandalone() || !/iPhone|iPad|iPod/.test(navigator.userAgent)) return "";
    try { if (localStorage.getItem("gymrat-hide-install")) return ""; } catch {}
    return `<section class="card" style="border-color:var(--accent)"><div class="card-h"><h2>Als App ohne Browser-Leiste</h2>
      <button class="icon-btn" data-act="hideInstall" aria-label="Hinweis ausblenden">${I.ui("close")}</button></div>
      <div class="small">Du hast GymRat gerade in Safari offen, deshalb siehst du unten die Browser-Leiste. So wird daraus eine App im Vollbild:</div>
      <ol class="small" style="margin:0;padding-left:20px;display:grid;gap:4px">
        <li>Unten auf <b>Teilen</b> tippen (Quadrat mit Pfeil).</li>
        <li><b>Zum Home-Bildschirm</b> wählen.</li>
        <li><b>Als Web-App öffnen</b> einschalten, falls angezeigt, dann <b>Hinzufügen</b>.</li>
        <li>GymRat ab jetzt nur noch über das Raketen-Icon starten.</li></ol>
      <div class="muted small">Safari und die App speichern getrennt. Hast du hier schon trainiert: vorher über das Zahnrad ein Backup sichern und in der App wiederherstellen.</div></section>`;
  }
  function vStart() {
    setTop("GymRat", `<button class="icon-btn" data-act="settings" aria-label="Einstellungen">${I.ui("gear")}</button>`);
    const st = streakInfo(); const mon = mondayOf(Date.now()); const todayK = dayKey(Date.now());
    const dots = WD.map((l, i) => { const d = new Date(mon); d.setDate(d.getDate() + i); const k = dayKey(d);
      return `<div><i class="${st.days.has(k) ? "done" : ""} ${k === todayK ? "today" : ""}">${st.days.has(k) ? I.ui("check", "") : d.getDate()}</i>${l}</div>`; }).join("");
    const a = S.active;
    const last = [...S.workouts].sort((x, y) => y.start - x.start)[0];
    view.innerHTML = `
      ${installHint()}
      ${a ? `<section class="card" style="border-color:var(--accent)"><div class="card-h"><h2>Training läuft</h2><span class="chip num" data-live="elapsed">${fmtDur(Date.now() - a.start)}</span></div>
        <div class="row"><b class="grow" style="font-size:18px">${esc(wName(a))}</b><button class="btn primary" data-act="tab" data-tab="training">Fortsetzen</button></div></section>` : ""}
      <section class="card">
        <div class="hero-streak"><div class="streak-num">${st.n}</div><div class="grow"><b>${st.n === 1 ? "Woche" : "Wochen"} Streak</b><div class="muted small">Diese Woche ${st.cur} von ${st.goal} Trainingstagen · Rekord ${st.best}</div></div><span style="color:var(--accent-hi)">${I.ui("flame")}</span></div>
        <div class="week-dots">${dots}</div>
      </section>
      ${a ? "" : `<section class="card"><div class="card-h"><h2>Training starten</h2></div>${startButtons()}</section>`}
      ${volumeCard()}
      ${last ? `<section class="card"><div class="card-h"><h2>Letztes Training</h2><span class="chip gold">${I.ui("star")} ${last.rating || "–"}/10</span></div>
        <button class="row" data-act="openWorkout" data-id="${last.id}" style="background:none;border:0;padding:0;text-align:left">
        <div class="grow"><b>${esc(wName(last))}</b><div class="muted small">${fmtDate(last.start)} · ${fmtDur(last.end - last.start)} · ${nf(volOf(last), 0)} kg</div></div>${I.ui("chevron")}</button></section>` : ""}`;
  }

  // ---------- TRAINING ----------
  function newEntry(d) {
    const sug = suggest(d); const r = sug ? sug.r : d.repMin || 8;
    // Standard weights per set win; otherwise every set starts at the suggested weight.
    const weights = d.defaultSets && d.defaultSets.length ? d.defaultSets : Array(S.settings.sets || 3).fill(sug ? sug.w : 0);
    return { deviceId: d.id, name: d.name, note: "", sets: weights.map((w) => ({ w, r, done: false })) };
  }
  function startWorkout(type) {
    const plan = planById(type);
    const entries = (plan ? plan.devices : []).map(devById).filter(Boolean).map(newEntry);
    S.active = { id: uid(), type, name: plan ? plan.name : TYPE_L[type], start: Date.now(), entries, cardio: [], restEnd: null, restTotal: S.settings.rest };
    ui.trainSeg = type === "cardio" ? "cardio" : "kraft";
    save(true); go("training");
  }
  function timerHtml() {
    const a = S.active; if (!a || !a.restEnd) return "";
    const left = Math.max(0, Math.ceil((a.restEnd - Date.now()) / 1000)); const pct = a.restTotal ? (1 - left / a.restTotal) * 100 : 100;
    return `<div class="timerbar ${left ? "" : "done"}" data-live="timer">${I.ui("timer")}<span class="t">${left ? mmss(left) : "Los!"}</span>
      <div class="bar"><i style="width:${Math.min(100, pct).toFixed(1)}%"></i></div>
      <button class="btn small" data-act="rest" data-d="-15">−15</button><button class="btn small" data-act="rest" data-d="15">+15</button>
      <button class="icon-btn" style="width:36px;height:36px" data-act="timerOff" aria-label="Timer ausblenden">${I.ui("close")}</button></div>`;
  }
  function entryHtml(e, ei) {
    const d = devById(e.deviceId) || { id: e.deviceId, name: e.name, repMin: 8, repMax: 12 };
    const best = bestOf(d.id, S.active.start); const sug = suggest(d, S.active.start);
    let hint = `<div class="hint">Erstes Mal an diesem Gerät. Wähle ein Gewicht für ${d.repMin || 8}–${d.repMax || 12} Wdh.</div>`;
    if (sug) {
      const reps = sug.last.sets.map((s) => `${nf(s.w)}×${s.r}`).join(" · ");
      hint = `<div class="hint">Letztes Mal ${fmtDate(sug.last.w.start)}: ${reps}<br>${sug.up
        ? `Alle Sätze bei ${d.repMax || 12} Wdh. geschafft → heute <b>${sug.w > 0 ? nf(sug.w) + " kg" : sug.r + " Wdh."}</b>`
        : `Heute <b>${nf(sug.w)} kg</b>, Ziel <b>${sug.r} Wdh.</b>`}</div>`;
    }
    if (d.defaultSets && d.defaultSets.length) hint = hint.replace("</div>", `<br>Standard: ${d.defaultSets.map((w) => nf(w)).join(" · ")} kg</div>`);
    const sets = e.sets.map((s, si) => {
      const pr = isPR(s, best);
      return `<div class="set ${s.done ? "saved" : ""}">
        <span class="n">${pr ? `<span class="chip gold" style="padding:2px 4px">PR</span>` : si + 1}</span>
        ${weightSelect(s.w, `aria-label="Gewicht Satz ${si + 1}" data-change="setW" data-e="${ei}" data-s="${si}"`)}
        <select aria-label="Wiederholungen Satz ${si + 1}" data-change="setR" data-e="${ei}" data-s="${si}">${opts(range(1, 50).map((v) => ({ v, l: `${v} Wdh.` })), s.r)}</select>
        <button class="done-btn ${s.done ? "on" : ""}" data-act="toggleSet" data-e="${ei}" data-s="${si}" aria-label="Satz erledigt">${I.ui("check")}</button></div>`;
    }).join("");
    return `<section class="card ex">
      <div class="ex-h">${thumb(d)}<div class="grow"><b style="display:block;line-height:1.25;overflow-wrap:anywhere">${esc(d.name)}</b><span class="muted small">${trains(d)}${best ? ` · Bestwert ${nf(best.w)} kg × ${best.r}` : ""}</span></div>
        <button class="icon-btn" data-act="infoToggle" data-e="${ei}" aria-label="Erklärung" ${d.info ? "" : "hidden"}>?</button>
        <button class="icon-btn" data-act="rmEntry" data-e="${ei}" aria-label="Gerät entfernen">${I.ui("trash")}</button></div>
      ${e.showInfo && d.info ? `<div class="hint">${esc(d.info)}</div>` : ""}
      ${hint}
      <div class="set-labels"><span></span><span>Gewicht</span><span>Wdh.</span><span></span></div>
      <div class="sets">${sets}</div>
      <div class="row"><button class="btn small" data-act="addSet" data-e="${ei}">${I.ui("plus")} Satz</button>
        <button class="btn small ghost" data-act="rmSet" data-e="${ei}" ${e.sets.length ? "" : "disabled"}>− Satz</button><span class="grow"></span>
        <button class="btn small ghost" data-act="noteToggle" data-e="${ei}">${I.ui("note")} Notiz</button></div>
      ${e.note || e.showNote ? `<textarea placeholder="Notiz, z. B. Sitzhöhe 4, Griff eng" data-input="entryNote" data-e="${ei}">${esc(e.note)}</textarea>` : ""}
    </section>`;
  }
  function cardioHtml() {
    const a = S.active; const devs = cardioDevices(); const f = ui.cardioForm;
    if (!devs.find((d) => d.id === f.deviceId)) f.deviceId = devs[0] ? devs[0].id : "";
    const d = devById(f.deviceId); const mode = d ? (CARDIO[d.cardioType] || CARDIO.other).mode : "level";
    const list = a.cardio.map((c, i) => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)">
      ${thumb(devById(c.deviceId) || { name: c.name, category: "cardio", cardioType: c.type })}
      <div class="grow"><b>${esc(c.name)}</b><div class="muted small">${c.min} min · ${c.speed != null ? `${nf(c.speed, 1)} km/h${c.incline ? ` · ${c.incline} % Steigung` : ""}` : `Stufe ${c.level}`}</div></div>
      <button class="icon-btn" data-act="rmCardio" data-i="${i}" aria-label="Eintrag löschen">${I.ui("trash")}</button></div>`).join("");
    const form = devs.length ? `
      <label class="field"><span>Gerät</span><select id="cfDev" data-change="cf" data-k="deviceId">${opts(devs.map((x) => ({ v: x.id, l: x.name })), f.deviceId)}</select></label>
      <div class="grid2"><label class="field"><span>Zeit</span><select id="cfMin" data-change="cf" data-k="min">${opts(range(1, 120).map((v) => ({ v, l: `${v} min` })), f.min)}</select></label>
      ${mode === "speed"
        ? `<label class="field"><span>Geschwindigkeit</span><select id="cfSpeed" data-change="cf" data-k="speed">${opts(range(1, 20, 0.5).map((v) => ({ v, l: `${nf(v, 1)} km/h` })), f.speed)}</select></label>`
        : `<label class="field"><span>Stufe</span><select id="cfLevel" data-change="cf" data-k="level">${opts(range(1, 20).map((v) => ({ v, l: `Stufe ${v}` })), f.level)}</select></label>`}</div>
      ${mode === "speed" ? `<label class="field"><span>Steigung</span><select id="cfIncline" data-change="cf" data-k="incline">${opts(range(0, 15).map((v) => ({ v, l: `${v} %` })), f.incline)}</select></label>` : ""}
      <button class="btn primary block" data-act="addCardio">${I.ui("plus")} Eintragen</button>`
      : `<div class="empty"><b>Noch keine Cardiogeräte</b>Lege Fahrrad, Laufband & Co. unter Geräte → Cardio an.<button class="btn" data-act="newDevice" data-cat="cardio">Cardiogerät anlegen</button></div>`;
    return `<section class="card"><div class="card-h"><h2>Cardio eintragen</h2></div>${form}</section>
      ${a.cardio.length ? `<section class="card"><div class="card-h"><h2>Heute</h2><span class="chip">${a.cardio.reduce((x, c) => x + c.min, 0)} min</span></div><div>${list}</div></section>` : ""}`;
  }
  function vTraining() {
    const a = S.active;
    if (!a) {
      setTop("Training");
      view.innerHTML = `<div class="empty"><b>Kein Training aktiv</b>Wähle, was du heute trainierst. Die Geräte aus deinem Standard-Workout werden geladen.</div>
        <section class="card">${startButtons()}</section>`;
      return;
    }
    setTop(wName(a), `<button class="btn primary small" data-act="finish">Beenden</button>`);
    const vol = volOf(a); const nDone = a.entries.reduce((x, e) => x + doneSets(e).length, 0);
    view.innerHTML = `
      <section class="card"><div class="grid3">
        <div><span class="muted small">Dauer</span><br><b class="num" data-live="elapsed">${fmtDur(Date.now() - a.start)}</b></div>
        <div><span class="muted small">Sätze</span><br><b class="num">${nDone}</b></div>
        <div><span class="muted small">Volumen</span><br><b class="num">${nf(vol, 0)} kg</b></div></div>
        <div class="seg"><button data-act="trainSeg" data-v="kraft" class="${ui.trainSeg === "kraft" ? "on" : ""}">Krafttraining</button><button data-act="trainSeg" data-v="cardio" class="${ui.trainSeg === "cardio" ? "on" : ""}">Cardio</button></div>
      </section>
      ${timerHtml()}
      ${ui.trainSeg === "kraft"
        ? `${a.entries.length ? a.entries.map(entryHtml).join("") : `<div class="empty"><b>Noch keine Geräte</b>Füge Geräte hinzu oder speichere ein Standard-Workout unter Geräte.</div>`}
           <button class="btn block" data-act="addEntry">${I.ui("plus")} Gerät hinzufügen</button>`
        : cardioHtml()}`;
  }
  function finishSheet() {
    const a = S.active; const nDone = a.entries.reduce((x, e) => x + doneSets(e).length, 0);
    let prs = 0; for (const e of a.entries) { const b = bestOf(e.deviceId, a.start); prs += doneSets(e).filter((s) => isPR(s, b)).length; }
    const stars = range(1, 10).map((v) => `<button data-act="rate" data-v="${v}" class="${v <= ui.rating ? "on" : ""}" aria-label="${v} Sterne">${I.ui("star")}</button>`).join("");
    openSheet(`<h3>Training beenden</h3>
      <div class="kpis"><div class="kpi"><b>${fmtDur(Date.now() - a.start)}</b><span>Dauer</span></div><div class="kpi"><b>${nDone}</b><span>Sätze</span></div><div class="kpi"><b>${nf(volOf(a), 0)}</b><span>kg Volumen</span></div></div>
      ${prs ? `<div class="chip gold" style="align-self:flex-start">${I.ui("trophy")} ${prs} neue${prs === 1 ? "r" : ""} PR</div>` : ""}
      ${a.cardio.length ? `<div class="muted">Cardio: ${a.cardio.reduce((x, c) => x + c.min, 0)} min</div>` : ""}
      <div class="field"><span>Wie war das Training?</span><div class="stars">${stars}</div><div class="rating-num">${ui.rating ? `${ui.rating}/10` : "–"}</div></div>
      <label class="field"><span>Notiz zum Training</span><textarea id="finNote" placeholder="Wie hast du dich gefühlt?">${esc(a.note || "")}</textarea></label>
      <button class="btn primary block" data-act="saveWorkout" ${ui.rating ? "" : "disabled"}>${ui.rating ? "Training speichern" : "Erst Sterne vergeben"}</button>
      <button class="btn block ghost" data-close>Weiter trainieren</button>
      <button class="btn block ghost danger" data-act="discardWorkout">Training verwerfen</button>`);
  }

  // ---------- picker sheet (choose devices) ----------
  function pickerSheet() {
    const p = ui.pick; const list = kraftDevices().filter((d) => hasMuscle(d, p.muscle));
    const rows = list.map((d) => `<button class="dev" data-act="pickToggle" data-id="${d.id}">${thumb(d)}<div class="grow"><b class="ellipsis">${esc(d.name)}</b><small>${trains(d)}</small></div><span class="check ${p.sel.includes(d.id) ? "on" : ""}">${p.sel.includes(d.id) ? I.ui("check") : ""}</span></button>`).join("");
    openSheet(`<h3>${esc(p.title)}</h3>
      <label class="field"><span>Muskelgruppe</span><select id="pickMuscle" data-change="pickMuscle"><option value="">Alle Muskelgruppen</option>${opts(muscleList(), p.muscle)}</select></label>
      <div class="dev-list">${rows || `<div class="empty"><b>Keine Geräte</b>Lege zuerst Geräte an.</div>`}</div>
      ${p.saveToTpl != null ? `<button class="dev" data-act="pickTpl"><div class="grow"><b>Auch im Plan „${esc(wName(S.active))}“ speichern</b><small>Beim nächsten Mal automatisch dabei</small></div><span class="check ${p.saveToTpl ? "on" : ""}">${p.saveToTpl ? I.ui("check") : ""}</span></button>` : ""}
      <button class="btn primary block" data-act="pickDone">${esc(p.doneLabel)} (${p.sel.length})</button>`);
  }

  // ---------- DEVICES ----------
  function vDevices() {
    setTop("Geräte", `<button class="icon-btn" data-act="newDevice" aria-label="Gerät anlegen">${I.ui("plus")}</button>`);
    const seg = `<div class="seg"><button data-act="devSeg" data-v="list" class="${ui.devSeg === "list" ? "on" : ""}">Alle Geräte</button><button data-act="devSeg" data-v="tpl" class="${ui.devSeg === "tpl" ? "on" : ""}">Trainingspläne</button></div>`;
    if (ui.devSeg === "tpl") {
      if (!planById(ui.plan)) ui.plan = S.plans[0] ? S.plans[0].id : "";
      const plan = planById(ui.plan);
      if (!plan) {
        view.innerHTML = `${seg}<div class="empty"><b>Keine Trainingspläne</b>Lege einen Plan an, z. B. Push, Pull oder Legs.<button class="btn primary" data-act="newPlan">${I.ui("plus")} Neuer Plan</button></div>`;
        return;
      }
      const ids = plan.devices;
      const rows = ids.map(devById).filter(Boolean).map((d, i) => `<div class="dev"><button class="dev-open" data-act="openDevice" data-id="${d.id}">${thumb(d)}<div class="grow"><b class="ellipsis">${esc(d.name)}</b><small>${trains(d)}${d.defaultSets && d.defaultSets.length ? ` · ${d.defaultSets.map((w) => nf(w)).join("/")} kg` : ""}</small></div></button>
        <button class="icon-btn" data-act="tplUp" data-i="${i}" aria-label="Nach oben" ${i ? "" : "disabled"} style="transform:rotate(-90deg)">${I.ui("chevron")}</button>
        <button class="icon-btn" data-act="tplRm" data-i="${i}" aria-label="Entfernen">${I.ui("close")}</button></div>`).join("");
      view.innerHTML = `${seg}
        <div class="row"><select id="planSel" class="grow" data-change="planSel" aria-label="Trainingsplan">${opts(S.plans.map((p) => ({ v: p.id, l: p.name })), plan.id)}</select>
          <button class="btn" data-act="newPlan">${I.ui("plus")} Neu</button></div>
        <section class="card"><div class="card-h"><div class="grow" style="min-width:0"><b class="ellipsis" style="display:block;font-size:18px">${esc(plan.name)}</b><span class="muted small">${esc(plan.sub || "")}</span></div>
          <button class="btn small" data-act="editPlan">${I.ui("edit")} Bearbeiten</button></div>
          <div class="muted small">Diese Geräte werden geladen, wenn du „${esc(plan.name)}“ startest. Die Reihenfolge ist die Trainingsreihenfolge.</div>
          <div class="dev-list">${rows || `<div class="empty"><b>Noch leer</b>Wähle die Geräte, die du in diesem Plan normalerweise benutzt.</div>`}</div>
          <button class="btn primary block" data-act="tplEdit">${I.ui("list")} Geräte auswählen (${ids.length})</button></section>`;
      return;
    }
    const isCardio = ui.devCat === "cardio";
    const list = (isCardio ? cardioDevices() : kraftDevices()).filter((d) => isCardio || hasMuscle(d, ui.devMuscle));
    const rows = list.map((d) => {
      const b = !isCardio && bestOf(d.id);
      const sub = isCardio ? `${(CARDIO[d.cardioType] || CARDIO.other).l}${devMuscles(d).length ? ` · ${trains(d)}` : ""}` : `${trains(d)}${d.defaultSets && d.defaultSets.length ? ` · Standard ${d.defaultSets.map((w) => nf(w)).join("/")} kg` : ""}`;
      return `<button class="dev" data-act="openDevice" data-id="${d.id}">${thumb(d)}<div class="grow"><b class="ellipsis">${esc(d.name)}</b><small>${sub}</small></div>${b ? `<span class="chip gold num">${nf(b.w)} kg</span>` : ""}${I.ui("chevron")}</button>`;
    }).join("");
    view.innerHTML = `${seg}
      <div class="seg"><button data-act="devCat" data-v="kraft" class="${!isCardio ? "on" : ""}">Krafttraining</button><button data-act="devCat" data-v="cardio" class="${isCardio ? "on" : ""}">Cardio</button></div>
      ${isCardio ? "" : `<label class="field"><span>Muskelgruppe</span><select id="devMuscle" data-change="devMuscle"><option value="">Alle Muskelgruppen</option>${opts(muscleList(), ui.devMuscle)}</select></label>`}
      ${S.devices.length ? `<div class="dev-list">${rows || `<div class="empty"><b>Keine Treffer</b>In dieser Auswahl gibt es noch keine Geräte.</div>`}</div>`
        : `<div class="empty"><b>Noch keine Geräte</b>Deine Geräteliste vom Studio kannst du gleich importieren, sobald sie fertig ist. Neue Geräte legst du jederzeit selbst an.
          <div class="row wrap" style="justify-content:center"><button class="btn primary" data-act="newDevice">${I.ui("plus")} Gerät anlegen</button><button class="btn" data-act="settings">${I.ui("upload")} Liste importieren</button></div></div>`}
      <button class="btn block" data-act="newDevice" data-cat="${ui.devCat}">${I.ui("plus")} Neues ${isCardio ? "Cardiogerät" : "Gerät"}</button>`;
  }
  function deviceSheet() {
    const d = ui.draft; const isCardio = d.category === "cardio"; const existing = !!devById(d.id);
    const photo = d.photo === undefined ? photos[d.id] : d.photo;
    const b = existing && !isCardio && bestOf(d.id); const ss = existing && !isCardio ? sessionsFor(d.id) : [];
    const chart = ss.length > 1 ? lineChart(ss.slice(0, 12).reverse().map((s) => ({ y: Math.max(...s.sets.map((x) => x.w)), label: new Date(s.w.start).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) })), "kg") : "";
    const ds = d.defaultSets || [];
    const dsRows = ds.map((w, i) => `<div class="row"><span class="muted small" style="width:52px;flex:none">Satz ${i + 1}</span>
      ${weightSelect(w, `class="grow" aria-label="Standardgewicht Satz ${i + 1}" data-change="dsW" data-i="${i}"`)}
      <button class="icon-btn" data-act="dsRm" data-i="${i}" aria-label="Satz ${i + 1} entfernen">${I.ui("close")}</button></div>`).join("");
    ui.sheetKind = "device";
    openSheet(`<h3>${existing ? "Gerät bearbeiten" : "Neues Gerät"}</h3>
      <div class="muted small">Zum Speichern und Schließen nach unten ziehen.</div>
      <div class="thumb big">${photo ? `<img src="${photo}" alt="">` : I.pic(devPic(d))}</div>
      <div class="row"><label class="btn small grow" for="dPhoto">${I.ui("camera")} ${photo ? "Foto ersetzen" : "Eigenes Foto"}</label>
        ${photo ? `<button class="btn small ghost" data-act="dropPhoto">Zeichnung nutzen</button>` : ""}
        <input type="file" id="dPhoto" accept="image/*" capture="environment" data-change="photo" hidden></div>
      <label class="field"><span>Name</span><input type="text" id="dName" data-input="draft" data-k="name" value="${esc(d.name)}" placeholder="${isCardio ? "z. B. Fahrrad 1" : "z. B. Brustpresse oder Kurzhantel: Seitheben"}" autocomplete="off"></label>
      <label class="field"><span>Bereich</span><select id="dCat" data-change="draft" data-k="category" data-redraw="1">${opts([{ v: "kraft", l: "Krafttraining" }, { v: "cardio", l: "Cardio" }], d.category)}</select></label>
      ${muscleField(d)}
      ${isCardio
        ? `<label class="field"><span>Art</span><select id="dType" data-change="draft" data-k="cardioType" data-redraw="1">${opts(Object.entries(CARDIO).map(([v, c]) => ({ v, l: `${c.l} (${c.mode === "speed" ? "Geschwindigkeit" : "Stufe 1–20"})` })), d.cardioType)}</select></label>`
        : `
           <div class="field"><span>Standardgewicht pro Satz</span>
             <div class="stack">${dsRows || `<div class="muted small">Kein Standard: Jeder Satz startet mit dem Gewicht vom letzten Mal.</div>`}</div>
             <button class="btn small" data-act="dsAdd">${I.ui("plus")} Satz</button></div>
           <div class="grid2"><label class="field"><span>Wdh. von</span><select id="dRepMin" data-change="draft" data-k="repMin" data-num="1">${opts(range(1, 30), d.repMin)}</select></label>
           <label class="field"><span>Wdh. bis</span><select id="dRepMax" data-change="draft" data-k="repMax" data-num="1">${opts(range(1, 30), d.repMax)}</select></label></div>
           <div class="muted small">Schaffst du in allen Sätzen „Wdh. bis“, schlägt GymRat beim nächsten Mal 2,5 kg mehr vor.</div>`}
      <label class="field"><span>Erklärung</span><textarea id="dInfo" data-input="draft" data-k="info" placeholder="Kurz: Wie wird das Gerät benutzt?">${esc(d.info || "")}</textarea></label>
      <label class="field"><span>Zeichnung</span><select id="dPic" data-change="draft" data-k="pic" data-redraw="1"><option value="">Automatisch</option>${opts(I.picList.map((p) => ({ v: p.key, l: p.label })), d.pic || "")}</select></label>
      ${b ? `<div class="card"><div class="card-h"><h2>Fortschritt</h2><span class="chip gold">${I.ui("trophy")} ${nf(b.w)} kg × ${b.r}</span></div>${chart || `<div class="muted small">${ss.length} Training bisher.</div>`}</div>` : ""}
      <button class="btn primary block" data-act="saveDevice">Speichern</button>
      ${existing ? `<button class="btn block ghost danger" data-act="delDevice">${I.ui("trash")} Gerät löschen</button>` : ""}`);
    ui.sheetKind = "device";
  }
  function muscleField(d) {
    const ms = devMuscles(d), ps = devParts(d);
    const groups = muscleList().map((m) => { const i = ms.indexOf(m);
      return `<button type="button" class="mchip ${i >= 0 ? "on" : ""}" data-act="toggleMuscle" data-m="${esc(m)}" aria-pressed="${i >= 0}">${i === 0 ? "★ " : ""}${esc(m)}</button>`; }).join("");
    const fine = ms.filter((g) => (PARTS[g] || []).length).map((g) => `<div class="mparts"><span class="muted small">${esc(g)}</span><div class="mchips">${PARTS[g].map((p) =>
      `<button type="button" class="mchip sm ${ps.includes(p) ? "on" : ""}" data-act="togglePart" data-p="${esc(p)}" aria-pressed="${ps.includes(p)}">${esc(p)}</button>`).join("")}</div></div>`).join("");
    return `<div class="field"><span>Muskelgruppe (mehrere möglich, ★ = Hauptgruppe)</span><div class="mchips">${groups}</div>${fine}</div>`;
  }
  function openDeviceDraft(d) { ui.draft = { ...d, defaultSets: [...(d.defaultSets || [])], muscles: [...devMuscles(d)], parts: [...devParts(d)] }; deviceSheet(); }
  // Re-render the open device sheet, keeping typed text and scroll position.
  function redrawDevice() {
    ui.draft.name = $("#dName").value; if ($("#dInfo")) ui.draft.info = $("#dInfo").value;
    const y = $(".sheet-panel").scrollTop; deviceSheet(); $(".sheet-panel").scrollTop = y;
  }

  // ---------- STATS ----------
  function vStats() {
    setTop("Statistik");
    const st = streakInfo(); const ws = [...S.workouts].sort((a, b) => b.start - a.start);
    const mon = mondayOf(Date.now()).getTime(); const thisWeek = ws.filter((w) => w.start >= mon).length;
    const rated = ws.filter((w) => w.rating); const avg = rated.length ? rated.reduce((a, w) => a + w.rating, 0) / rated.length : 0;
    // calendar
    const m = ui.cal; const first = new Date(m.getFullYear(), m.getMonth(), 1); const lead = (first.getDay() + 6) % 7;
    const dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(); const todayK = dayKey(Date.now());
    let cells = WD.map((d) => `<div class="wd">${d}</div>`).join("") + `<div class="d out"></div>`.repeat(lead);
    for (let i = 1; i <= dim; i++) {
      const k = dayKey(new Date(m.getFullYear(), m.getMonth(), i)); const w = st.days.get(k);
      cells += `<button class="d ${w ? "trained" : ""} ${k === todayK ? "today" : ""}" ${w ? `data-act="openDay" data-k="${k}"` : "disabled"}>${i}${w ? `<small>${w.map((x) => esc(wName(x).slice(0, 4))).join("+")}</small>` : ""}</button>`;
    }
    // progress per device
    const withHist = kraftDevices().filter((d) => sessionsFor(d.id).length);
    if (!withHist.find((d) => d.id === ui.progDev)) ui.progDev = withHist[0] ? withHist[0].id : "";
    const pd = devById(ui.progDev); const pss = pd ? sessionsFor(pd.id).slice(0, 15).reverse() : [];
    const prog = pd ? lineChart(pss.map((s) => ({ y: Math.max(...s.sets.map((x) => x.w)), label: new Date(s.w.start).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) })), "kg") : "";
    const pdBest = pd && bestOf(pd.id);
    // PR list
    const prs = withHist.map((d) => ({ d, b: bestOf(d.id) })).sort((a, b) => b.b.t - a.b.t);
    // cardio
    const cardio = ws.flatMap((w) => (w.cardio || []).map((c) => ({ ...c, t: w.start })));
    const cWeek = cardio.filter((c) => c.t >= mon).reduce((a, c) => a + c.min, 0);
    const c30 = cardio.filter((c) => c.t >= Date.now() - 30 * 864e5).reduce((a, c) => a + c.min, 0);
    view.innerHTML = `
      <div class="kpis"><div class="kpi"><b>${ws.length}</b><span>Trainings</span></div><div class="kpi"><b>${thisWeek}</b><span>Diese Woche</span></div><div class="kpi"><b>${avg ? nf(avg, 1) : "–"}</b><span>Ø Bewertung</span></div></div>
      <section class="card"><div class="cal-h"><button class="icon-btn" data-act="calNav" data-d="-1" aria-label="Voriger Monat">${I.ui("back")}</button>
        <b>${MONTHS[m.getMonth()]} ${m.getFullYear()}</b><button class="icon-btn" data-act="calNav" data-d="1" aria-label="Nächster Monat">${I.ui("chevron")}</button></div>
        <div class="cal">${cells}</div>
        <div class="row wrap"><span class="chip">${I.ui("flame")} ${st.n} ${st.n === 1 ? "Woche" : "Wochen"} in Folge</span><span class="chip">Rekord ${st.best}</span><span class="chip">Ziel ${st.goal} Tage/Woche</span></div></section>
      ${volumeCard()}
      <section class="card"><div class="card-h"><h2>Fortschritt pro Gerät</h2>${pdBest ? `<span class="chip gold">${I.ui("trophy")} ${nf(pdBest.w)} kg × ${pdBest.r}</span>` : ""}</div>
        ${pd ? `<select id="progDev" data-change="progDev" aria-label="Gerät">${opts(withHist.map((d) => ({ v: d.id, l: d.name })), ui.progDev)}</select>${prog}<div class="muted small">Höchstes Gewicht pro Training.</div>`
          : `<div class="empty"><b>Noch keine Daten</b>Nach deinem ersten Training siehst du hier deinen Gewichtsverlauf.</div>`}</section>
      <section class="card"><div class="card-h"><h2>Persönliche Rekorde</h2></div>
        ${prs.length ? `<div class="pr-list">${prs.map(({ d, b }) => `<div class="row">${thumb(d)}<div class="grow"><b class="ellipsis" style="display:block">${esc(d.name)}</b><span class="muted small">${fmtDate(b.t)}</span></div><b class="num">${nf(b.w)} kg × ${b.r}</b></div>`).join("")}</div>`
          : `<div class="muted small">Noch keine Rekorde.</div>`}</section>
      <section class="card"><div class="card-h"><h2>Cardio</h2></div>
        <div class="grid2"><div class="kpi"><b>${cWeek} min</b><span>Diese Woche</span></div><div class="kpi"><b>${c30} min</b><span>Letzte 30 Tage</span></div></div></section>
      <section class="card"><div class="card-h"><h2>Verlauf</h2></div>
        ${ws.length ? `<div class="hist">${ws.slice(0, 30).map((w) => `<button class="row" data-act="openWorkout" data-id="${w.id}"><div class="grow"><b>${esc(wName(w))}</b><div class="muted small">${fmtDate(w.start)} · ${fmtDur(w.end - w.start)} · ${nf(volOf(w), 0)} kg</div></div><span class="chip gold">${I.ui("star")} ${w.rating || "–"}</span>${I.ui("chevron")}</button>`).join("")}</div>`
          : `<div class="muted small">Noch keine Trainings gespeichert.</div>`}</section>`;
  }
  function workoutSheet(w) {
    const ent = (w.entries || []).filter((e) => doneSets(e).length).map((e) => {
      const b = bestOf(e.deviceId, w.start);
      return `<div class="row" style="align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line)">${thumb(devById(e.deviceId) || { name: e.name })}
        <div class="grow"><b>${esc(e.name)}</b><div class="muted small num">${doneSets(e).map((s) => `${nf(s.w)}×${s.r}${isPR(s, b) ? " (PR)" : ""}`).join(" · ")}</div>${e.note ? `<div class="small">${esc(e.note)}</div>` : ""}</div></div>`;
    }).join("");
    const car = (w.cardio || []).map((c) => `<div class="muted small">${esc(c.name)}: ${c.min} min · ${c.speed != null ? `${nf(c.speed, 1)} km/h` : `Stufe ${c.level}`}</div>`).join("");
    openSheet(`<h3>${esc(wName(w))} · ${fmtDate(w.start)}</h3>
      <div class="kpis"><div class="kpi"><b>${fmtDur(w.end - w.start)}</b><span>Dauer</span></div><div class="kpi"><b>${nf(volOf(w), 0)}</b><span>kg Volumen</span></div><div class="kpi"><b>${w.rating || "–"}/10</b><span>Bewertung</span></div></div>
      ${w.note ? `<div class="hint">${esc(w.note)}</div>` : ""}
      <div>${ent || ""}${car}</div>
      <button class="btn block ghost danger" data-act="delWorkout" data-id="${w.id}">${I.ui("trash")} Training löschen</button>`);
  }

  // ---------- settings / backup ----------
  function settingsSheet() {
    openSheet(`<h3>Einstellungen</h3>
      <label class="field"><span>Standard-Pause zwischen Sätzen</span><select id="setRest" data-change="setting" data-k="rest">${opts(range(30, 300, 15).map((v) => ({ v, l: mmss(v) + " min" })), S.settings.rest)}</select></label>
      <label class="field"><span>Sätze pro Gerät beim Start</span><select id="setSets" data-change="setting" data-k="sets">${opts(range(1, 8).map((v) => ({ v, l: `${v} Sätze` })), S.settings.sets)}</select></label>
      <label class="field"><span>Wochenziel für den Streak</span><select id="setGoal" data-change="setting" data-k="weeklyGoal">${opts(range(1, 7).map((v) => ({ v, l: `${v} Trainingstag${v > 1 ? "e" : ""} pro Woche` })), S.settings.weeklyGoal)}</select></label>
      <div class="card"><div class="card-h"><h2>Daten</h2></div>
        <div class="muted small">Alles bleibt nur auf diesem iPhone. Sichere regelmäßig ein Backup, z. B. in iCloud Drive. Ohne Backup sind die Daten weg, wenn du GymRat vom Home-Bildschirm löschst.</div>
        <button class="btn block" data-act="exportData">${I.ui("download")} Backup sichern</button>
        <label class="btn block" for="impBackup">${I.ui("upload")} Backup wiederherstellen</label><input type="file" id="impBackup" accept=".json,application/json" data-change="importBackup" hidden>
        <label class="btn block" for="impDevices">${I.ui("upload")} Geräteliste importieren</label><input type="file" id="impDevices" accept=".json,application/json" data-change="importDevices" hidden>
        <div class="muted small">${S.devices.length} Geräte · ${S.workouts.length} Trainings</div></div>`);
  }
  function toDevice(x) {
    const cat = /cardio/i.test(x.category || x.bereich || "") ? "cardio" : "kraft";
    const ct = x.cardioType || x.art || ""; const ctKey = CARDIO[ct] ? ct : (Object.entries(CARDIO).find(([, c]) => c.l.toLowerCase() === String(ct).toLowerCase()) || ["other"])[0];
    return { id: uid(), name: String(x.name || "").trim(), category: cat, muscle: x.muscle || x.muskelgruppe || (cat === "kraft" ? "Ganzkörper" : ""),
      muscles: Array.isArray(x.muscles) && x.muscles.length ? x.muscles.map(String) : [x.muscle || x.muskelgruppe || "Ganzkörper"],
      repMin: Number(x.repMin) || 8, repMax: Number(x.repMax) || 12, cardioType: cat === "cardio" ? ctKey : undefined, pic: x.pic || "",
      info: String(x.info || x.erklaerung || "").trim(), targets: String(x.targets || x.trainiert || "").trim(), parts: Array.isArray(x.parts) ? x.parts.filter((q) => PART_GROUP[q]) : undefined, defaultSets: Array.isArray(x.defaultSets) ? x.defaultSets.map(Number).filter((v) => !isNaN(v)) : [] };
  }
  function importDevices(json) {
    const arr = Array.isArray(json) ? json : json.devices || json.geraete || [];
    let added = 0; const byName = new Map(S.devices.map((d) => [d.name.toLowerCase(), d]));
    for (const x of arr) { const d = toDevice(x); if (!d.name || byName.has(d.name.toLowerCase())) continue; S.devices.push(d); byName.set(d.name.toLowerCase(), d); added++; }
    const tpl = json.templates || json.standardworkouts || json.plans;
    if (tpl) {
      const list = Array.isArray(tpl) ? tpl : Object.entries(tpl).map(([k, v]) => ({ id: k, name: k[0].toUpperCase() + k.slice(1), devices: v }));
      for (const p of list) mergePlan(p, byName);
    }
    save(true); return added;
  }
  // Adds a plan, or fills an existing one (same id or name) that has no devices yet.
  function mergePlan(p, byName) {
    const ids = (p.devices || []).map((n) => byName.get(String(n).toLowerCase())).filter(Boolean).map((d) => d.id);
    let plan = S.plans.find((x) => x.id === p.id || x.name.toLowerCase() === String(p.name || "").toLowerCase());
    if (!plan) { plan = { id: p.id && !planById(p.id) ? p.id : uid(), name: p.name || "Plan", sub: p.sub || "", devices: [] }; S.plans.push(plan); }
    if (!plan.devices.length) plan.devices = ids;
  }
  function applySeed() {
    const seed = window.GYM_SEED; if (!seed || (S.seed || 0) >= seed.version) return;
    const byName = new Map(S.devices.map((d) => [d.name.toLowerCase(), d]));
    for (const x of seed.devices) {
      const have = byName.get(x.name.toLowerCase());
      if (have) { if (!have.info && x.info) have.info = x.info; if (!have.targets && x.targets) have.targets = x.targets;
        if (x.muscles && devMuscles(have).length <= 1 && devMuscles(have)[0] === x.muscle) have.muscles = [...x.muscles];
        continue; }
      const d = toDevice(x); S.devices.push(d); byName.set(d.name.toLowerCase(), d);
    }
    for (const p of seed.plans) mergePlan(p, byName);
    S.seed = seed.version; save(true);
  }
  // Devices from before fine muscles existed: derive them from the old "trains" text once.
  function migrateParts() {
    let changed = false;
    for (const d of S.devices) {
      if (Array.isArray(d.parts)) { if (d.targets !== undefined) { delete d.targets; changed = true; } continue; }
      const { parts, groups } = partsFromText(d.targets);
      d.parts = parts; d.muscles = [...devMuscles(d), ...groups.filter((g) => !devMuscles(d).includes(g))];
      d.muscle = d.muscles[0] || ""; delete d.targets; changed = true;
    }
    if (changed) save(true);
  }
  function planSheet() {
    const p = ui.draft; const existing = !!planById(p.id);
    openSheet(`<h3>${existing ? "Plan bearbeiten" : "Neuer Plan"}</h3>
      <label class="field"><span>Name</span><input type="text" id="pName" data-input="draft" data-k="name" value="${esc(p.name)}" placeholder="z. B. Push, Oberkörper, Arme" autocomplete="off" maxlength="40"></label>
      <label class="field"><span>Beschreibung</span><input type="text" id="pSub" data-input="draft" data-k="sub" value="${esc(p.sub || "")}" placeholder="z. B. Brust · Schultern · Trizeps" autocomplete="off" maxlength="60"></label>
      <button class="btn primary block" data-act="savePlan">Speichern</button>
      ${existing ? `<button class="btn block ghost danger" data-act="delPlan">${I.ui("trash")} Plan löschen</button>` : ""}`);
    ui.sheetKind = "plan";
  }
  async function exportData() {
    const data = JSON.stringify({ app: "GymRat", exported: new Date().toISOString(), state: S, photos });
    const name = `GymRat-Backup-${dayKey(Date.now())}.json`; const file = new File([data], name, { type: "application/json" });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  const readFile = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f); });
  function shrinkImage(file) {
    return new Promise((res, rej) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => { const max = 520; const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.8)); };
      img.onerror = rej; img.src = url;
    });
  }

  // ---------- actions ----------
  const A = {
    tab: (el) => go(el.dataset.tab),
    settings: () => settingsSheet(),
    volFilter: (el) => { ui.volFilter = el.dataset.v; render(); },
    start: (el) => startWorkout(el.dataset.type),
    trainSeg: (el) => { ui.trainSeg = el.dataset.v; render(); },
    toggleSet: (el) => {
      const a = S.active; const s = a.entries[+el.dataset.e].sets[+el.dataset.s]; s.done = !s.done;
      if (s.done) { a.restTotal = S.settings.rest; a.restEnd = Date.now() + a.restTotal * 1000; }
      save(); render();
    },
    addSet: (el) => { const e = S.active.entries[+el.dataset.e]; const p = e.sets[e.sets.length - 1]; e.sets.push({ w: p ? p.w : 0, r: p ? p.r : 10, done: false }); save(); render(); },
    rmSet: (el) => { S.active.entries[+el.dataset.e].sets.pop(); save(); render(); },
    noteToggle: (el) => { const e = S.active.entries[+el.dataset.e]; e.showNote = !e.showNote; render(); },
    rmEntry: (el) => { if (!armed(el, "?")) return; S.active.entries.splice(+el.dataset.e, 1); save(); render(); },
    rest: (el) => { const a = S.active; a.restEnd = Math.max(Date.now(), a.restEnd + +el.dataset.d * 1000); a.restTotal = Math.max(15, a.restTotal + +el.dataset.d); save(); tick(); },
    timerOff: () => { S.active.restEnd = null; save(); render(); },
    addEntry: () => {
      const a = S.active; const plan = planById(a.type); const inTpl = !!plan;
      ui.pick = { title: "Geräte hinzufügen", sel: [], muscle: "", doneLabel: "Hinzufügen", saveToTpl: inTpl ? false : null,
        onDone: (ids, toTpl) => { ids.map(devById).filter(Boolean).forEach((d) => a.entries.push(newEntry(d)));
          if (toTpl && plan) ids.forEach((id) => { if (!plan.devices.includes(id)) plan.devices.push(id); }); save(); render(); } };
      pickerSheet();
    },
    pickToggle: (el) => { const p = ui.pick; const id = el.dataset.id; p.sel = p.sel.includes(id) ? p.sel.filter((x) => x !== id) : [...p.sel, id]; const y = $(".sheet-panel").scrollTop; pickerSheet(); $(".sheet-panel").scrollTop = y; },
    pickTpl: () => { ui.pick.saveToTpl = !ui.pick.saveToTpl; const y = $(".sheet-panel").scrollTop; pickerSheet(); $(".sheet-panel").scrollTop = y; },
    pickDone: () => { const p = ui.pick; closeSheet(); p.onDone(p.sel, p.saveToTpl); },
    addCardio: () => {
      const f = ui.cardioForm; const d = devById(f.deviceId); if (!d) return;
      const mode = (CARDIO[d.cardioType] || CARDIO.other).mode;
      S.active.cardio.push({ id: uid(), deviceId: d.id, name: d.name, type: d.cardioType, min: +f.min, ...(mode === "speed" ? { speed: +f.speed, incline: +f.incline } : { level: +f.level }) });
      save(); render(); toast(`${d.name}: ${f.min} min eingetragen`);
    },
    rmCardio: (el) => { S.active.cardio.splice(+el.dataset.i, 1); save(); render(); },
    finish: () => { ui.rating = 0; finishSheet(); },
    rate: (el) => { ui.rating = +el.dataset.v; const n = $("#finNote"); if (n) S.active.note = n.value; finishSheet(); },
    saveWorkout: () => {
      const a = S.active; const note = $("#finNote") ? $("#finNote").value.trim() : "";
      const entries = a.entries.map((e) => ({ deviceId: e.deviceId, name: e.name, note: e.note || "", sets: doneSets(e).map(({ w, r }) => ({ w, r, done: true })) })).filter((e) => e.sets.length);
      if (!entries.length && !a.cardio.length) { toast("Noch nichts erledigt – hake mindestens einen Satz ab oder trag Cardio ein."); return; }
      S.workouts.push({ id: a.id, type: a.type, name: wName(a), start: a.start, end: Date.now(), entries, cardio: a.cardio, rating: ui.rating, note });
      S.active = null; save(true); closeSheet(); go("start"); toast("Training gespeichert");
    },
    discardWorkout: (el) => { if (!armed(el, "Nochmal tippen: Training wirklich verwerfen")) return; S.active = null; save(true); closeSheet(); go("start"); toast("Training verworfen"); },
    // devices
    devSeg: (el) => { ui.devSeg = el.dataset.v; render(); },
    devCat: (el) => { ui.devCat = el.dataset.v; render(); },
    newDevice: (el) => { const cat = (el && el.dataset.cat) || ui.devCat || "kraft";
      openDeviceDraft({ id: uid(), name: "", category: cat, muscle: ui.devMuscle || "Brust", muscles: [ui.devMuscle || "Brust"], repMin: 8, repMax: 12, cardioType: "bike", pic: "", info: "", defaultSets: [] }); },
    openDevice: (el) => openDeviceDraft(devById(el.dataset.id)),
    dropPhoto: () => { ui.draft.photo = null; deviceSheet(); },
    dsAdd: () => { const ds = ui.draft.defaultSets = [...(ui.draft.defaultSets || [])]; ds.push(ds.length ? ds[ds.length - 1] : 20); redrawDevice(); },
    dsRm: (el) => { ui.draft.defaultSets = (ui.draft.defaultSets || []).filter((_, i) => i !== +el.dataset.i); redrawDevice(); },
    toggleMuscle: (el) => {
      const m = el.dataset.m; const cur = devMuscles(ui.draft);
      ui.draft.muscles = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
      if (!ui.draft.muscles.includes(m)) ui.draft.parts = devParts(ui.draft).filter((p) => PART_GROUP[p] !== m);
      ui.draft.muscle = ui.draft.muscles[0] || ""; redrawDevice();
    },
    togglePart: (el) => {
      const p = el.dataset.p; const ps = devParts(ui.draft);
      ui.draft.parts = ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p];
      redrawDevice();
    },
    hideInstall: () => { try { localStorage.setItem("gymrat-hide-install", "1"); } catch {} render(); },
    infoToggle: (el) => { const e = S.active.entries[+el.dataset.e]; e.showInfo = !e.showInfo; render(); },
    saveDevice: async (_, opt = {}) => {
      const d = ui.draft; d.name = ($("#dName").value || "").trim(); d.info = ($("#dInfo") ? $("#dInfo").value : d.info || "").trim();
      if (!d.name && opt.dismiss && !devById(d.id)) { closeSheet(); return; }
      if (!d.name) { toast("Gib dem Gerät einen Namen"); $("#dName").focus(); return; }
      if (d.category === "kraft") d.muscles = devMuscles(d);
      if (d.category === "kraft" && !d.muscles.length) { toast("Wähle mindestens eine Muskelgruppe"); return; }
      if (d.category === "kraft" && d.repMax < d.repMin) { toast("„Wdh. von“ muss kleiner sein als „Wdh. bis“"); return; }
      if (S.devices.some((x) => x.id !== d.id && x.name.toLowerCase() === d.name.toLowerCase())) { toast("Es gibt schon ein Gerät mit diesem Namen"); return; }
      const { photo, ...rec } = d; delete rec.step; delete rec.targets; rec.muscles = devMuscles(rec); rec.muscle = rec.muscles[0] || "";
      if (rec.category === "cardio") delete rec.defaultSets; else delete rec.cardioType;
      const i = S.devices.findIndex((x) => x.id === d.id); if (i >= 0) S.devices[i] = rec; else S.devices.push(rec);
      if (photo) { photos[d.id] = photo; idb.put("photos", d.id, photo); } else if (photo === null) { delete photos[d.id]; idb.del("photos", d.id); }
      save(true); closeSheet(); render(); toast(i >= 0 ? "Gerät gespeichert" : "Gerät angelegt");
    },
    delDevice: (el) => {
      if (!armed(el, "Nochmal tippen: Gerät löschen (Trainings bleiben)")) return;
      const id = ui.draft.id; S.devices = S.devices.filter((d) => d.id !== id);
      for (const p of S.plans) p.devices = p.devices.filter((x) => x !== id);
      delete photos[id]; idb.del("photos", id); save(true); closeSheet(); render(); toast("Gerät gelöscht");
    },
    tplRm: (el) => { planById(ui.plan).devices.splice(+el.dataset.i, 1); save(); render(); },
    tplUp: (el) => { const t = planById(ui.plan).devices; const i = +el.dataset.i; if (i > 0) [t[i - 1], t[i]] = [t[i], t[i - 1]]; save(); render(); },
    newPlan: () => { ui.draft = { id: uid(), name: "", sub: "", devices: [] }; planSheet(); },
    editPlan: () => { ui.draft = { ...planById(ui.plan) }; planSheet(); },
    savePlan: (_, opt = {}) => {
      const p = ui.draft; p.name = ($("#pName").value || "").trim(); p.sub = ($("#pSub").value || "").trim();
      if (!p.name && opt.dismiss && !planById(p.id)) { closeSheet(); return; }
      if (!p.name) { toast("Gib dem Plan einen Namen"); $("#pName").focus(); return; }
      if (S.plans.some((x) => x.id !== p.id && x.name.toLowerCase() === p.name.toLowerCase())) { toast("Es gibt schon einen Plan mit diesem Namen"); return; }
      const i = S.plans.findIndex((x) => x.id === p.id); if (i >= 0) S.plans[i] = p; else S.plans.push(p);
      ui.plan = p.id; ui.devSeg = "tpl"; save(true); closeSheet(); render(); toast(i >= 0 ? "Plan gespeichert" : "Plan angelegt");
    },
    delPlan: (el) => {
      if (!armed(el, "Nochmal tippen: Plan löschen (Trainings bleiben)")) return;
      const id = ui.draft.id; S.plans = S.plans.filter((p) => p.id !== id); if (ui.volFilter === id) ui.volFilter = "all";
      ui.plan = ""; save(true); closeSheet(); render(); toast("Plan gelöscht");
    },
    tplEdit: () => {
      const plan = planById(ui.plan);
      ui.pick = { title: `${plan.name}: Geräte auswählen`, sel: [...plan.devices], muscle: "", doneLabel: "Übernehmen", saveToTpl: null,
        onDone: (ids) => { plan.devices = ids; save(); render(); toast(`Plan „${plan.name}“ gespeichert`); } };
      pickerSheet();
    },
    // stats
    calNav: (el) => { ui.cal = new Date(ui.cal.getFullYear(), ui.cal.getMonth() + +el.dataset.d, 1); render(); },
    openDay: (el) => {
      const ws = S.workouts.filter((w) => dayKey(w.start) === el.dataset.k);
      if (ws.length === 1) return workoutSheet(ws[0]);
      openSheet(`<h3>${fmtDate(keyToDate(el.dataset.k))}</h3><div class="hist">${ws.map((w) => `<button class="row" data-act="openWorkout" data-id="${w.id}"><div class="grow"><b>${esc(wName(w))}</b><div class="muted small">${fmtDur(w.end - w.start)} · ${nf(volOf(w), 0)} kg</div></div>${I.ui("chevron")}</button>`).join("")}</div>`);
    },
    openWorkout: (el) => { const w = S.workouts.find((x) => x.id === el.dataset.id); if (w) workoutSheet(w); },
    delWorkout: (el) => { if (!armed(el, "Nochmal tippen: Training löschen")) return; S.workouts = S.workouts.filter((w) => w.id !== el.dataset.id); save(true); closeSheet(); render(); toast("Training gelöscht"); },
    exportData: () => exportData()
  };
  const C = {
    setW: (el) => { S.active.entries[+el.dataset.e].sets[+el.dataset.s].w = +el.value; save(); render(); },
    setR: (el) => { S.active.entries[+el.dataset.e].sets[+el.dataset.s].r = +el.value; save(); render(); },
    cf: (el) => { ui.cardioForm[el.dataset.k] = el.dataset.k === "deviceId" ? el.value : +el.value; if (el.dataset.k === "deviceId") render(); },
    pickMuscle: (el) => { ui.pick.muscle = el.value; pickerSheet(); },
    devMuscle: (el) => { ui.devMuscle = el.value; render(); },
    planSel: (el) => { ui.plan = el.value; render(); },
    volFilter: (el) => { ui.volFilter = el.value; render(); },
    progDev: (el) => { ui.progDev = el.value; render(); },
    draft: (el) => {
      ui.draft[el.dataset.k] = el.dataset.num ? +el.value : el.value;
      if (el.dataset.redraw) redrawDevice();
    },
    dsW: (el) => { ui.draft.defaultSets[+el.dataset.i] = +el.value; },
    photo: async (el) => {
      const f = el.files && el.files[0]; if (!f) return;
      try { ui.draft.name = $("#dName").value; ui.draft.photo = await shrinkImage(f); deviceSheet(); } catch { toast("Das Bild konnte nicht gelesen werden"); }
    },
    setting: (el) => { S.settings[el.dataset.k] = +el.value; save(); render(); },
    importDevices: async (el) => {
      const f = el.files && el.files[0]; if (!f) return;
      try { const n = importDevices(JSON.parse(await readFile(f))); closeSheet(); go("geraete"); toast(`${n} Geräte importiert`); }
      catch { toast("Die Datei ist keine gültige Geräteliste (JSON)"); }
    },
    importBackup: async (el) => {
      const f = el.files && el.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await readFile(f)); if (!j.state || !Array.isArray(j.state.devices)) throw new Error();
        loadState(j.state); photos = j.photos || {};
        for (const [k, v] of Object.entries(photos)) await idb.put("photos", k, v);
        save(true); closeSheet(); go("start"); toast("Backup wiederhergestellt");
      } catch { toast("Die Datei ist kein GymRat-Backup"); }
    }
  };
  const IN = {
    entryNote: (el) => { S.active.entries[+el.dataset.e].note = el.value; save(); },
    draft: (el) => { ui.draft[el.dataset.k] = el.value; }
  };

  document.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab"); if (tab) { go(tab.dataset.tab); return; }
    if (e.target.closest(".sheet-backdrop")) { dismissSheet(); return; }
    if (e.target.closest("[data-close]")) { closeSheet(); return; }
    const t = e.target.closest("[data-act]"); if (!t || t.disabled) return;
    const fn = A[t.dataset.act]; if (fn) { e.preventDefault(); fn(t, e); }
  });
  document.addEventListener("change", (e) => { const t = e.target.closest("[data-change]"); if (t && C[t.dataset.change]) C[t.dataset.change](t, e); });
  document.addEventListener("input", (e) => { const t = e.target.closest("[data-input]"); if (t && IN[t.dataset.input]) IN[t.dataset.input](t, e); });

  // ---------- live clock: elapsed time + rest timer (timestamps survive app suspension) ----------
  function tick() {
    const a = S.active; if (!a) return;
    document.querySelectorAll('[data-live="elapsed"]').forEach((el) => (el.textContent = fmtDur(Date.now() - a.start)));
    const tb = document.querySelector('[data-live="timer"]');
    if (tb) { const html = timerHtml(); if (html) tb.outerHTML = html; else tb.remove(); }
    else if (a.restEnd && ui.tab === "training" && ui.trainSeg === "kraft") render();
  }
  setInterval(tick, 1000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) save(true); else render(); });
  window.addEventListener("pagehide", () => save(true));

  function loadState(st) {
    S = { ...fresh(), ...st, settings: { ...fresh().settings, ...(st.settings || {}) } };
    // v1 stored fixed push/pull/legs templates; turn them into editable plans.
    if (!Array.isArray(st.plans)) {
      const t = st.templates || {};
      S.plans = [["push", "Push", "Brust · Schultern · Trizeps"], ["pull", "Pull", "Rücken · Bizeps"], ["legs", "Legs", "Beine · Gesäß · Bauch"]]
        .map(([id, name, sub]) => ({ id, name, sub, devices: t[id] || [] }));
    }
    delete S.templates; S.v = 2;
  }

  // ---------- boot ----------
  async function boot() {
    document.querySelectorAll("[data-icon]").forEach((el) => (el.outerHTML = I.ui(el.dataset.icon)));
    try {
      await idb.open();
      const st = await idb.get("kv", "state");
      if (st) loadState(st);
      photos = await idb.all("photos");
    } catch { toast("Speicher nicht verfügbar – Daten werden nicht gesichert"); }
    applySeed(); migrateParts();
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if (S.active) ui.tab = "training";
    render();
  }
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  boot();
})();
