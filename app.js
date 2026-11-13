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
  const MUSCLES = ["Brust", "Rücken", "Schultern", "Bizeps", "Trizeps", "Unterarme", "Bauch", "Quadrizeps", "Beinbeuger", "Gesäß", "Waden", "Adduktoren / Abduktoren", "Ganzkörper"];
  const MUSCLE_PIC = { Brust: "bench", "Rücken": "pulldown", Schultern: "shoulder", Bizeps: "curl", Trizeps: "triceps", Unterarme: "curl", Bauch: "abs", Quadrizeps: "legpress", Beinbeuger: "legext", "Gesäß": "legpress", Waden: "calf", "Adduktoren / Abduktoren": "legext", "Ganzkörper": "generic" };
  const CARDIO = {
    bike: { l: "Fahrrad", mode: "level", pic: "bike" },
    treadmill: { l: "Laufband", mode: "speed", pic: "treadmill" },
    crosstrainer: { l: "Crosstrainer", mode: "level", pic: "crosstrainer" },
    rower: { l: "Rudergerät", mode: "level", pic: "rower" },
    stepper: { l: "Stepper", mode: "level", pic: "stepper" },
    other: { l: "Sonstiges", mode: "level", pic: "generic" }
  };
  const STEPS = [0.5, 1, 1.25, 2, 2.5, 5, 10];
  const DAYS = { push: { l: "Push", sub: "Brust · Schultern · Trizeps" }, pull: { l: "Pull", sub: "Rücken · Bizeps" }, legs: { l: "Legs", sub: "Beine · Waden" } };
  const TYPE_L = { push: "Push", pull: "Pull", legs: "Legs", frei: "Freies Training", cardio: "Cardio" };
  const BODY_FIELDS = [["fat", "Körperfett", "%"], ["chest", "Brust", "cm"], ["waist", "Taille", "cm"], ["hip", "Hüfte", "cm"], ["arm", "Oberarm", "cm"], ["thigh", "Oberschenkel", "cm"]];

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
    v: 1, devices: [], templates: { push: [], pull: [], legs: [] }, workouts: [], body: [],
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
    tab: "start", volFilter: "all", devSeg: "list", devCat: "kraft", devMuscle: "", tplDay: "push",
    trainSeg: "kraft", cal: mondayOf(Date.now()), progDev: "", rating: 0, draft: null, pick: null,
    cardioForm: { deviceId: "", min: 20, level: 8, speed: 8, incline: 0 }
  };
  ui.cal = new Date(); ui.cal.setDate(1);

  // ---------- domain ----------
  const devById = (id) => S.devices.find((d) => d.id === id);
  const devPic = (d) => d.pic || (d.category === "cardio" ? (CARDIO[d.cardioType] || CARDIO.other).pic : MUSCLE_PIC[d.muscle] || "generic");
  const thumb = (d, cls = "") => `<div class="thumb ${cls}">${d && photos[d.id] ? `<img src="${photos[d.id]}" alt="">` : I.pic(d ? devPic(d) : "generic")}</div>`;
  const muscleList = () => [...new Set([...MUSCLES, ...S.devices.map((d) => d.muscle).filter(Boolean)])];
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
      return top > 0 ? { w: r2(top + (d.step || 2.5)), r: lo, up: true, last, top } : { w: 0, r: hi + 1, up: true, last, top };
    }
    return { w: top, r: Math.min(hi, Math.min(...atTop.map((s) => s.r)) + 1), up: false, last, top };
  }
  function weightOptions(step, cur) {
    const max = step <= 1 ? 150 : step <= 2.5 ? 300 : 500;
    const list = range(0, max, step || 2.5);
    if (cur != null && !list.includes(cur)) { list.push(cur); list.sort((a, b) => a - b); }
    return list.map((v) => ({ v, l: v === 0 ? "0 kg (Körpergew.)" : `${nf(v)} kg` }));
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
    const f = [["all", "Gesamt"], ["push", "Push"], ["pull", "Pull"], ["legs", "Legs"]];
    return `<section class="card"><div class="card-h"><h2>Volumen · letzte 14 Tage</h2><span class="chip num">${nf(total, 0)} kg</span></div>
      <div class="seg">${f.map(([k, l]) => `<button data-act="volFilter" data-v="${k}" class="${ui.volFilter === k ? "on" : ""}">${l}</button>`).join("")}</div>
      ${barChart(items)}<div class="muted small">Volumen = Gewicht × Wiederholungen aller erledigten Sätze pro Tag.</div></section>`;
  }

  // ---------- shell ----------
  const view = $("#view");
  function setTop(title, action = "") { $("#viewTitle").textContent = title; $("#topAction").innerHTML = action; }
  function render() {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === ui.tab));
    ({ start: vStart, training: vTraining, geraete: vDevices, statistik: vStats, koerper: vBody })[ui.tab]();
  }
  function go(tab) { ui.tab = tab; render(); window.scrollTo(0, 0); }

  function openSheet(html) {
    const wasClosed = $("#sheet").hidden;
    $("#sheetBody").innerHTML = html; $("#sheet").hidden = false; document.body.style.overflow = "hidden";
    if (wasClosed) $(".sheet-panel").scrollTop = 0;
  }
  function closeSheet() { $("#sheet").hidden = true; $("#sheetBody").innerHTML = ""; document.body.style.overflow = ""; ui.pick = null; ui.draft = null; }
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
    const b = Object.entries(DAYS).map(([k, d]) => `<button class="start-btn ${k === "push" ? "push" : ""}" data-act="start" data-type="${k}"><b>${d.l}</b><span>${S.templates[k].length} Geräte</span></button>`).join("");
    return `<div class="start-grid">${b}
      <button class="start-btn wide" data-act="start" data-type="frei"><div><b>Freies Training</b><br><span>Geräte selbst wählen</span></div>${I.ui("chevron")}</button>
      <button class="start-btn wide" data-act="start" data-type="cardio"><div><b>Cardio</b><br><span>Fahrrad, Laufband & Co.</span></div>${I.ui("chevron")}</button></div>`;
  }
  function vStart() {
    setTop("GymRat", `<button class="icon-btn" data-act="settings" aria-label="Einstellungen">${I.ui("gear")}</button>`);
    const st = streakInfo(); const mon = mondayOf(Date.now()); const todayK = dayKey(Date.now());
    const dots = WD.map((l, i) => { const d = new Date(mon); d.setDate(d.getDate() + i); const k = dayKey(d);
      return `<div><i class="${st.days.has(k) ? "done" : ""} ${k === todayK ? "today" : ""}">${st.days.has(k) ? I.ui("check", "") : d.getDate()}</i>${l}</div>`; }).join("");
    const a = S.active;
    const last = [...S.workouts].sort((x, y) => y.start - x.start)[0];
    view.innerHTML = `
      ${a ? `<section class="card" style="border-color:var(--accent)"><div class="card-h"><h2>Training läuft</h2><span class="chip num" data-live="elapsed">${fmtDur(Date.now() - a.start)}</span></div>
        <div class="row"><b class="grow" style="font-size:18px">${TYPE_L[a.type]}</b><button class="btn primary" data-act="tab" data-tab="training">Fortsetzen</button></div></section>` : ""}
      <section class="card">
        <div class="hero-streak"><div class="streak-num">${st.n}</div><div class="grow"><b>${st.n === 1 ? "Woche" : "Wochen"} Streak</b><div class="muted small">Diese Woche ${st.cur} von ${st.goal} Trainingstagen · Rekord ${st.best}</div></div><span style="color:var(--accent-hi)">${I.ui("flame")}</span></div>
        <div class="week-dots">${dots}</div>
      </section>
      ${a ? "" : `<section class="card"><div class="card-h"><h2>Training starten</h2></div>${startButtons()}</section>`}
      ${volumeCard()}
      ${last ? `<section class="card"><div class="card-h"><h2>Letztes Training</h2><span class="chip gold">${I.ui("star")} ${last.rating || "–"}/10</span></div>
        <button class="row" data-act="openWorkout" data-id="${last.id}" style="background:none;border:0;padding:0;text-align:left">
        <div class="grow"><b>${TYPE_L[last.type]}</b><div class="muted small">${fmtDate(last.start)} · ${fmtDur(last.end - last.start)} · ${nf(volOf(last), 0)} kg</div></div>${I.ui("chevron")}</button></section>` : ""}`;
  }

  // ---------- TRAINING ----------
  function newEntry(d) {
    const sug = suggest(d); const n = S.settings.sets || 3;
    const w = sug ? sug.w : 0, r = sug ? sug.r : d.repMin || 8;
    return { deviceId: d.id, name: d.name, note: "", sets: Array.from({ length: n }, () => ({ w, r, done: false })) };
  }
  function startWorkout(type) {
    const entries = (S.templates[type] || []).map(devById).filter(Boolean).map(newEntry);
    S.active = { id: uid(), type, start: Date.now(), entries, cardio: [], restEnd: null, restTotal: S.settings.rest };
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
    const d = devById(e.deviceId) || { id: e.deviceId, name: e.name, step: 2.5, repMin: 8, repMax: 12 };
    const best = bestOf(d.id, S.active.start); const sug = suggest(d, S.active.start);
    let hint = `<div class="hint">Erstes Mal an diesem Gerät. Wähle ein Gewicht für ${d.repMin || 8}–${d.repMax || 12} Wdh.</div>`;
    if (sug) {
      const reps = sug.last.sets.map((s) => `${nf(s.w)}×${s.r}`).join(" · ");
      hint = `<div class="hint">Letztes Mal ${fmtDate(sug.last.w.start)}: ${reps}<br>${sug.up
        ? `Alle Sätze bei ${d.repMax || 12} Wdh. geschafft → heute <b>${sug.w > 0 ? nf(sug.w) + " kg" : sug.r + " Wdh."}</b>`
        : `Heute <b>${nf(sug.w)} kg</b>, Ziel <b>${sug.r} Wdh.</b>`}</div>`;
    }
    const wo = weightOptions(d.step || 2.5);
    const sets = e.sets.map((s, si) => {
      const pr = isPR(s, best);
      const wl = wo.some((o) => o.v === s.w) ? wo : weightOptions(d.step || 2.5, s.w);
      return `<div class="set ${s.done ? "saved" : ""}">
        <span class="n">${pr ? `<span class="chip gold" style="padding:2px 4px">PR</span>` : si + 1}</span>
        <select aria-label="Gewicht Satz ${si + 1}" data-change="setW" data-e="${ei}" data-s="${si}">${opts(wl, s.w)}</select>
        <select aria-label="Wiederholungen Satz ${si + 1}" data-change="setR" data-e="${ei}" data-s="${si}">${opts(range(1, 50).map((v) => ({ v, l: `${v} Wdh.` })), s.r)}</select>
        <button class="done-btn ${s.done ? "on" : ""}" data-act="toggleSet" data-e="${ei}" data-s="${si}" aria-label="Satz erledigt">${I.ui("check")}</button></div>`;
    }).join("");
    return `<section class="card ex">
      <div class="ex-h">${thumb(d)}<div class="grow"><b class="ellipsis" style="display:block">${esc(d.name)}</b><span class="muted small">${esc(d.muscle || "")}${best ? ` · Bestwert ${nf(best.w)} kg × ${best.r}` : ""}</span></div>
        <button class="icon-btn" data-act="rmEntry" data-e="${ei}" aria-label="Gerät entfernen">${I.ui("trash")}</button></div>
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
    setTop(TYPE_L[a.type], `<button class="btn primary small" data-act="finish">Beenden</button>`);
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
    const p = ui.pick; const list = kraftDevices().filter((d) => !p.muscle || d.muscle === p.muscle);
    const rows = list.map((d) => `<button class="dev" data-act="pickToggle" data-id="${d.id}">${thumb(d)}<div class="grow"><b class="ellipsis">${esc(d.name)}</b><small>${esc(d.muscle || "")}</small></div><span class="check ${p.sel.includes(d.id) ? "on" : ""}">${p.sel.includes(d.id) ? I.ui("check") : ""}</span></button>`).join("");
    openSheet(`<h3>${esc(p.title)}</h3>
      <label class="field"><span>Muskelgruppe</span><select id="pickMuscle" data-change="pickMuscle"><option value="">Alle Muskelgruppen</option>${opts(muscleList(), p.muscle)}</select></label>
      <div class="dev-list">${rows || `<div class="empty"><b>Keine Geräte</b>Lege zuerst Geräte an.</div>`}</div>
      ${p.saveToTpl != null ? `<button class="dev" data-act="pickTpl"><div class="grow"><b>Auch im ${TYPE_L[S.active.type]}-Standard speichern</b><small>Beim nächsten ${TYPE_L[S.active.type]} automatisch dabei</small></div><span class="check ${p.saveToTpl ? "on" : ""}">${p.saveToTpl ? I.ui("check") : ""}</span></button>` : ""}
      <button class="btn primary block" data-act="pickDone">${esc(p.doneLabel)} (${p.sel.length})</button>`);
  }

  // ---------- DEVICES ----------
  function vDevices() {
    setTop("Geräte", `<button class="icon-btn" data-act="newDevice" aria-label="Gerät anlegen">${I.ui("plus")}</button>`);
    const seg = `<div class="seg"><button data-act="devSeg" data-v="list" class="${ui.devSeg === "list" ? "on" : ""}">Alle Geräte</button><button data-act="devSeg" data-v="tpl" class="${ui.devSeg === "tpl" ? "on" : ""}">Standard-Workouts</button></div>`;
    if (ui.devSeg === "tpl") {
      const ids = S.templates[ui.tplDay]; const day = DAYS[ui.tplDay];
      const rows = ids.map(devById).filter(Boolean).map((d, i) => `<div class="dev">${thumb(d)}<div class="grow"><b class="ellipsis">${esc(d.name)}</b><small>${esc(d.muscle || "")}</small></div>
        <button class="icon-btn" data-act="tplUp" data-i="${i}" aria-label="Nach oben" ${i ? "" : "disabled"} style="transform:rotate(-90deg)">${I.ui("chevron")}</button>
        <button class="icon-btn" data-act="tplRm" data-i="${i}" aria-label="Entfernen">${I.ui("close")}</button></div>`).join("");
      view.innerHTML = `${seg}
        <div class="seg">${Object.entries(DAYS).map(([k, d]) => `<button data-act="tplDay" data-v="${k}" class="${ui.tplDay === k ? "on" : ""}">${d.l}</button>`).join("")}</div>
        <section class="card"><div class="card-h"><h2>${day.l} · ${day.sub}</h2><span class="chip">${ids.length} Geräte</span></div>
          <div class="muted small">Diese Geräte werden geladen, wenn du ${day.l} startest. Die Reihenfolge ist die Trainingsreihenfolge.</div>
          <div class="dev-list">${rows || `<div class="empty"><b>Noch leer</b>Wähle die Geräte, die du an ${day.l}-Tagen normalerweise benutzt.</div>`}</div>
          <button class="btn primary block" data-act="tplEdit">${I.ui("list")} Geräte auswählen</button></section>`;
      return;
    }
    const isCardio = ui.devCat === "cardio";
    const list = (isCardio ? cardioDevices() : kraftDevices()).filter((d) => isCardio || !ui.devMuscle || d.muscle === ui.devMuscle);
    const rows = list.map((d) => {
      const b = !isCardio && bestOf(d.id);
      const sub = isCardio ? (CARDIO[d.cardioType] || CARDIO.other).l : `${esc(d.muscle || "")} · ${nf(d.step || 2.5)} kg Schritte`;
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
    openSheet(`<h3>${existing ? "Gerät bearbeiten" : "Neues Gerät"}</h3>
      <div class="thumb big">${photo ? `<img src="${photo}" alt="">` : I.pic(devPic(d))}</div>
      <div class="row"><label class="btn small grow" for="dPhoto">${I.ui("camera")} ${photo ? "Foto ersetzen" : "Eigenes Foto"}</label>
        ${photo ? `<button class="btn small ghost" data-act="dropPhoto">Zeichnung nutzen</button>` : ""}
        <input type="file" id="dPhoto" accept="image/*" capture="environment" data-change="photo" hidden></div>
      <label class="field"><span>Name</span><input type="text" id="dName" data-input="draft" data-k="name" value="${esc(d.name)}" placeholder="${isCardio ? "z. B. Fahrrad 1" : "z. B. Brustpresse oder Kurzhantel: Seitheben"}" autocomplete="off"></label>
      <label class="field"><span>Bereich</span><select id="dCat" data-change="draft" data-k="category" data-redraw="1">${opts([{ v: "kraft", l: "Krafttraining" }, { v: "cardio", l: "Cardio" }], d.category)}</select></label>
      ${isCardio
        ? `<label class="field"><span>Art</span><select id="dType" data-change="draft" data-k="cardioType" data-redraw="1">${opts(Object.entries(CARDIO).map(([v, c]) => ({ v, l: `${c.l} (${c.mode === "speed" ? "Geschwindigkeit" : "Stufe 1–20"})` })), d.cardioType)}</select></label>`
        : `<label class="field"><span>Muskelgruppe</span><select id="dMuscle" data-change="draft" data-k="muscle" data-redraw="1">${opts(muscleList(), d.muscle)}</select></label>
           <label class="field"><span>Gewichtsschritte</span><select id="dStep" data-change="draft" data-k="step" data-num="1">${opts(STEPS.map((v) => ({ v, l: `${nf(v)} kg` })), d.step)}</select></label>
           <div class="grid2"><label class="field"><span>Wdh. von</span><select id="dRepMin" data-change="draft" data-k="repMin" data-num="1">${opts(range(1, 30), d.repMin)}</select></label>
           <label class="field"><span>Wdh. bis</span><select id="dRepMax" data-change="draft" data-k="repMax" data-num="1">${opts(range(1, 30), d.repMax)}</select></label></div>
           <div class="muted small">Schaffst du in allen Sätzen „Wdh. bis“, schlägt GymRat beim nächsten Mal einen Gewichtsschritt mehr vor.</div>`}
      <label class="field"><span>Zeichnung</span><select id="dPic" data-change="draft" data-k="pic" data-redraw="1"><option value="">Automatisch</option>${opts(I.picList.map((p) => ({ v: p.key, l: p.label })), d.pic || "")}</select></label>
      ${b ? `<div class="card"><div class="card-h"><h2>Fortschritt</h2><span class="chip gold">${I.ui("trophy")} ${nf(b.w)} kg × ${b.r}</span></div>${chart || `<div class="muted small">${ss.length} Training bisher.</div>`}</div>` : ""}
      <button class="btn primary block" data-act="saveDevice">Speichern</button>
      ${existing ? `<button class="btn block ghost danger" data-act="delDevice">${I.ui("trash")} Gerät löschen</button>` : ""}`);
  }
  function openDeviceDraft(d) { ui.draft = { ...d }; deviceSheet(); }

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
      cells += `<button class="d ${w ? "trained" : ""} ${k === todayK ? "today" : ""}" ${w ? `data-act="openDay" data-k="${k}"` : "disabled"}>${i}${w ? `<small>${w.map((x) => (TYPE_L[x.type] || "").slice(0, 4)).join("+")}</small>` : ""}</button>`;
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
        ${ws.length ? `<div class="hist">${ws.slice(0, 30).map((w) => `<button class="row" data-act="openWorkout" data-id="${w.id}"><div class="grow"><b>${TYPE_L[w.type]}</b><div class="muted small">${fmtDate(w.start)} · ${fmtDur(w.end - w.start)} · ${nf(volOf(w), 0)} kg</div></div><span class="chip gold">${I.ui("star")} ${w.rating || "–"}</span>${I.ui("chevron")}</button>`).join("")}</div>`
          : `<div class="muted small">Noch keine Trainings gespeichert.</div>`}</section>`;
  }
  function workoutSheet(w) {
    const ent = (w.entries || []).filter((e) => doneSets(e).length).map((e) => {
      const b = bestOf(e.deviceId, w.start);
      return `<div class="row" style="align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line)">${thumb(devById(e.deviceId) || { name: e.name })}
        <div class="grow"><b>${esc(e.name)}</b><div class="muted small num">${doneSets(e).map((s) => `${nf(s.w)}×${s.r}${isPR(s, b) ? " (PR)" : ""}`).join(" · ")}</div>${e.note ? `<div class="small">${esc(e.note)}</div>` : ""}</div></div>`;
    }).join("");
    const car = (w.cardio || []).map((c) => `<div class="muted small">${esc(c.name)}: ${c.min} min · ${c.speed != null ? `${nf(c.speed, 1)} km/h` : `Stufe ${c.level}`}</div>`).join("");
    openSheet(`<h3>${TYPE_L[w.type]} · ${fmtDate(w.start)}</h3>
      <div class="kpis"><div class="kpi"><b>${fmtDur(w.end - w.start)}</b><span>Dauer</span></div><div class="kpi"><b>${nf(volOf(w), 0)}</b><span>kg Volumen</span></div><div class="kpi"><b>${w.rating || "–"}/10</b><span>Bewertung</span></div></div>
      ${w.note ? `<div class="hint">${esc(w.note)}</div>` : ""}
      <div>${ent || ""}${car}</div>
      <button class="btn block ghost danger" data-act="delWorkout" data-id="${w.id}">${I.ui("trash")} Training löschen</button>`);
  }

  // ---------- BODY ----------
  function vBody() {
    setTop("Körper");
    const list = [...S.body].sort((a, b) => b.date.localeCompare(a.date)); const last = list[0];
    const bw = ui.bodyW ?? (last ? last.weight : 80);
    const kg = Math.floor(bw), dec = Math.round((bw - kg) * 10);
    const pts = [...list].reverse().slice(-20).filter((e) => e.weight).map((e) => ({ y: e.weight, label: keyToDate(e.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) }));
    const diff = list.length > 1 ? list[0].weight - list[list.length - 1].weight : 0;
    view.innerHTML = `
      <section class="card"><div class="card-h"><h2>Neuer Eintrag</h2></div>
        <label class="field"><span>Datum</span><input type="date" id="bDate" value="${dayKey(Date.now())}"></label>
        <div class="field"><span>Körpergewicht</span><div class="grid2">
          <select id="bKg" aria-label="Kilogramm">${opts(range(30, 200).map((v) => ({ v, l: `${v} kg` })), kg)}</select>
          <select id="bDec" aria-label="Nachkommastelle">${opts(range(0, 9).map((v) => ({ v, l: `,${v}` })), dec)}</select></div></div>
        <div class="grid2">${BODY_FIELDS.map(([k, l, u]) => `<label class="field"><span>${l} (${u})</span><input type="number" inputmode="decimal" step="0.1" id="b_${k}" placeholder="optional" value="${last && last[k] != null ? last[k] : ""}"></label>`).join("")}</div>
        <button class="btn primary block" data-act="saveBody">Eintrag speichern</button></section>
      <section class="card"><div class="card-h"><h2>Körpergewicht</h2>${list.length > 1 ? `<span class="chip ${diff <= 0 ? "good" : ""}">${diff > 0 ? "+" : ""}${nf(diff, 1)} kg seit Beginn</span>` : ""}</div>
        ${pts.length ? lineChart(pts, "kg") : `<div class="empty"><b>Noch keine Einträge</b>Trag oben dein Gewicht ein, dann entsteht hier dein Verlauf.</div>`}</section>
      ${list.length ? `<section class="card"><div class="card-h"><h2>Einträge</h2></div><div class="hist">${list.map((e) => `<div class="row"><div class="grow"><b class="num">${nf(e.weight, 1)} kg</b>
        <div class="muted small">${keyToDate(e.date).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}${BODY_FIELDS.filter(([k]) => e[k] != null).map(([k, l, u]) => ` · ${l} ${nf(e[k], 1)} ${u}`).join("")}</div></div>
        <button class="icon-btn" data-act="delBody" data-id="${e.id}" aria-label="Eintrag löschen">${I.ui("trash")}</button></div>`).join("")}</div></section>` : ""}`;
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
        <div class="muted small">${S.devices.length} Geräte · ${S.workouts.length} Trainings · ${S.body.length} Körpereinträge</div></div>`);
  }
  function toDevice(x) {
    const cat = /cardio/i.test(x.category || x.bereich || "") ? "cardio" : "kraft";
    const ct = x.cardioType || x.art || ""; const ctKey = CARDIO[ct] ? ct : (Object.entries(CARDIO).find(([, c]) => c.l.toLowerCase() === String(ct).toLowerCase()) || ["other"])[0];
    return { id: uid(), name: String(x.name || "").trim(), category: cat, muscle: x.muscle || x.muskelgruppe || (cat === "kraft" ? "Ganzkörper" : ""),
      step: Number(x.step || x.schritte) || 2.5, repMin: Number(x.repMin) || 8, repMax: Number(x.repMax) || 12, cardioType: cat === "cardio" ? ctKey : undefined, pic: x.pic || "" };
  }
  function importDevices(json) {
    const arr = Array.isArray(json) ? json : json.devices || json.geraete || [];
    let added = 0; const byName = new Map(S.devices.map((d) => [d.name.toLowerCase(), d]));
    for (const x of arr) { const d = toDevice(x); if (!d.name || byName.has(d.name.toLowerCase())) continue; S.devices.push(d); byName.set(d.name.toLowerCase(), d); added++; }
    const tpl = json.templates || json.standardworkouts;
    if (tpl) for (const k of Object.keys(DAYS)) for (const n of tpl[k] || []) { const d = byName.get(String(n).toLowerCase()); if (d && !S.templates[k].includes(d.id)) S.templates[k].push(d.id); }
    save(true); return added;
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
      const a = S.active; const inTpl = !!DAYS[a.type];
      ui.pick = { title: "Geräte hinzufügen", sel: [], muscle: "", doneLabel: "Hinzufügen", saveToTpl: inTpl ? false : null,
        onDone: (ids, toTpl) => { ids.map(devById).filter(Boolean).forEach((d) => a.entries.push(newEntry(d)));
          if (toTpl) ids.forEach((id) => { if (!S.templates[a.type].includes(id)) S.templates[a.type].push(id); }); save(); render(); } };
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
      S.workouts.push({ id: a.id, type: a.type, start: a.start, end: Date.now(), entries, cardio: a.cardio, rating: ui.rating, note });
      S.active = null; save(true); closeSheet(); go("start"); toast("Training gespeichert");
    },
    discardWorkout: (el) => { if (!armed(el, "Nochmal tippen: Training wirklich verwerfen")) return; S.active = null; save(true); closeSheet(); go("start"); toast("Training verworfen"); },
    // devices
    devSeg: (el) => { ui.devSeg = el.dataset.v; render(); },
    devCat: (el) => { ui.devCat = el.dataset.v; render(); },
    newDevice: (el) => { const cat = (el && el.dataset.cat) || ui.devCat || "kraft";
      openDeviceDraft({ id: uid(), name: "", category: cat, muscle: ui.devMuscle || "Brust", step: 2.5, repMin: 8, repMax: 12, cardioType: "bike", pic: "" }); },
    openDevice: (el) => openDeviceDraft(devById(el.dataset.id)),
    dropPhoto: () => { ui.draft.photo = null; deviceSheet(); },
    saveDevice: async () => {
      const d = ui.draft; d.name = ($("#dName").value || "").trim();
      if (!d.name) { toast("Gib dem Gerät einen Namen"); $("#dName").focus(); return; }
      if (d.category === "kraft" && d.repMin > d.repMax) { toast("„Wdh. von“ muss kleiner sein als „Wdh. bis“"); return; }
      if (S.devices.some((x) => x.id !== d.id && x.name.toLowerCase() === d.name.toLowerCase())) { toast("Es gibt schon ein Gerät mit diesem Namen"); return; }
      const { photo, ...rec } = d; if (rec.category === "cardio") { delete rec.muscle; } else delete rec.cardioType;
      const i = S.devices.findIndex((x) => x.id === d.id); if (i >= 0) S.devices[i] = rec; else S.devices.push(rec);
      if (photo) { photos[d.id] = photo; idb.put("photos", d.id, photo); } else if (photo === null) { delete photos[d.id]; idb.del("photos", d.id); }
      save(true); closeSheet(); render(); toast(i >= 0 ? "Gerät gespeichert" : "Gerät angelegt");
    },
    delDevice: (el) => {
      if (!armed(el, "Nochmal tippen: Gerät löschen (Trainings bleiben)")) return;
      const id = ui.draft.id; S.devices = S.devices.filter((d) => d.id !== id);
      for (const k of Object.keys(S.templates)) S.templates[k] = S.templates[k].filter((x) => x !== id);
      delete photos[id]; idb.del("photos", id); save(true); closeSheet(); render(); toast("Gerät gelöscht");
    },
    tplDay: (el) => { ui.tplDay = el.dataset.v; render(); },
    tplRm: (el) => { S.templates[ui.tplDay].splice(+el.dataset.i, 1); save(); render(); },
    tplUp: (el) => { const t = S.templates[ui.tplDay]; const i = +el.dataset.i; if (i > 0) [t[i - 1], t[i]] = [t[i], t[i - 1]]; save(); render(); },
    tplEdit: () => {
      const day = ui.tplDay;
      ui.pick = { title: `${DAYS[day].l}: Geräte auswählen`, sel: [...S.templates[day]], muscle: "", doneLabel: "Übernehmen", saveToTpl: null,
        onDone: (ids) => { S.templates[day] = ids; save(); render(); toast(`${DAYS[day].l}-Standard gespeichert`); } };
      pickerSheet();
    },
    // stats
    calNav: (el) => { ui.cal = new Date(ui.cal.getFullYear(), ui.cal.getMonth() + +el.dataset.d, 1); render(); },
    openDay: (el) => {
      const ws = S.workouts.filter((w) => dayKey(w.start) === el.dataset.k);
      if (ws.length === 1) return workoutSheet(ws[0]);
      openSheet(`<h3>${fmtDate(keyToDate(el.dataset.k))}</h3><div class="hist">${ws.map((w) => `<button class="row" data-act="openWorkout" data-id="${w.id}"><div class="grow"><b>${TYPE_L[w.type]}</b><div class="muted small">${fmtDur(w.end - w.start)} · ${nf(volOf(w), 0)} kg</div></div>${I.ui("chevron")}</button>`).join("")}</div>`);
    },
    openWorkout: (el) => { const w = S.workouts.find((x) => x.id === el.dataset.id); if (w) workoutSheet(w); },
    delWorkout: (el) => { if (!armed(el, "Nochmal tippen: Training löschen")) return; S.workouts = S.workouts.filter((w) => w.id !== el.dataset.id); save(true); closeSheet(); render(); toast("Training gelöscht"); },
    // body
    saveBody: () => {
      const date = $("#bDate").value || dayKey(Date.now()); const weight = r2(+$("#bKg").value + +$("#bDec").value / 10);
      const e = { id: uid(), date, weight };
      for (const [k] of BODY_FIELDS) { const v = parseFloat(String($("#b_" + k).value).replace(",", ".")); if (!isNaN(v)) e[k] = v; }
      S.body = S.body.filter((x) => x.date !== date); S.body.push(e); ui.bodyW = null; save(true); render(); toast("Eintrag gespeichert");
    },
    delBody: (el) => { if (!armed(el, "?")) return; S.body = S.body.filter((x) => x.id !== el.dataset.id); save(true); render(); },
    exportData: () => exportData()
  };
  const C = {
    setW: (el) => { S.active.entries[+el.dataset.e].sets[+el.dataset.s].w = +el.value; save(); render(); },
    setR: (el) => { S.active.entries[+el.dataset.e].sets[+el.dataset.s].r = +el.value; save(); render(); },
    cf: (el) => { ui.cardioForm[el.dataset.k] = el.dataset.k === "deviceId" ? el.value : +el.value; if (el.dataset.k === "deviceId") render(); },
    pickMuscle: (el) => { ui.pick.muscle = el.value; pickerSheet(); },
    devMuscle: (el) => { ui.devMuscle = el.value; render(); },
    progDev: (el) => { ui.progDev = el.value; render(); },
    draft: (el) => {
      ui.draft[el.dataset.k] = el.dataset.num ? +el.value : el.value;
      if (el.dataset.redraw) { ui.draft.name = $("#dName").value; const y = $(".sheet-panel").scrollTop; deviceSheet(); $(".sheet-panel").scrollTop = y; }
    },
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
        S = { ...fresh(), ...j.state }; photos = j.photos || {};
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

  // ---------- boot ----------
  async function boot() {
    document.querySelectorAll("[data-icon]").forEach((el) => (el.outerHTML = I.ui(el.dataset.icon)));
    try {
      await idb.open();
      const st = await idb.get("kv", "state");
      if (st) S = { ...fresh(), ...st, settings: { ...fresh().settings, ...(st.settings || {}) }, templates: { ...fresh().templates, ...(st.templates || {}) } };
      photos = await idb.all("photos");
    } catch { toast("Speicher nicht verfügbar – Daten werden nicht gesichert"); }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if (S.active) ui.tab = "training";
    render();
  }
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  boot();
})();
