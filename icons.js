// GymRat icons: small UI icons (24px grid) and device pictograms (64px grid).
// Pictograms are simple drawings so a device is recognizable, not a photo.
(function () {
  const ui = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z" fill="currentColor"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    body: '<circle cx="12" cy="5" r="2.5"/><path d="M5 9.5h14M12 9.5V15M12 15l-3.5 6M12 15l3.5 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    flame: '<path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .5 2 1.5 3 2.5 3-1-3 0-6 0-8z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8.5 20h7M10 17h4v3h-4z"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M9.5 2.5h5"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    back: '<path d="M15 6l-6 6 6 6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
    note: '<path d="M5 4h14v16H5zM8.5 9h7M8.5 13h7M8.5 17h4"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15"/>',
    upload: '<path d="M12 20V9M7 13.5l5-5 5 5M4.5 4h15"/>',
    calendar: '<path d="M4 6h16v14H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5"/>',
    list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12M4 6h.5M4 12h.5M4 18h.5"/>'
  };

  // Device pictograms, stroke drawings on a 64x64 grid.
  const S = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  const pic = {
    bench: { label: "Bankdrücken / Brustpresse", svg:
      `<path ${S} d="M8 46h48M14 46v8M50 46v8M18 40h30"/><path ${S} d="M12 22h40M18 14v16M46 14v16M32 22v18"/>` },
    fly: { label: "Butterfly", svg:
      `<path ${S} d="M32 12v40M24 52h16"/><circle ${S} cx="32" cy="22" r="5"/><path ${S} d="M27 30c-8 2-14 0-18-6M37 30c8 2 14 0 18-6M9 24v-8M55 24v-8"/>` },
    pulldown: { label: "Latzug / Rudern", svg:
      `<path ${S} d="M12 10h40M32 10v12M20 22h24"/><circle ${S} cx="32" cy="32" r="4.5"/><path ${S} d="M32 37v9M20 22l9 12M44 22l-9 12M22 46h20M26 54h12"/>` },
    row: { label: "Rudergerät (Kraft)", svg:
      `<path ${S} d="M6 50h52M10 50v-6h14v6M44 22v28M44 30H28"/><circle ${S} cx="20" cy="26" r="4.5"/><path ${S} d="M20 31v13M20 36l8-6"/>` },
    shoulder: { label: "Schulterdrücken", svg:
      `<circle ${S} cx="32" cy="24" r="5"/><path ${S} d="M32 30v14M24 50h16M18 34V14M46 34V14M14 14h8M42 14h8M18 34h8M46 34h-8"/>` },
    curl: { label: "Bizeps", svg:
      `<path ${S} d="M16 48c0-12 6-20 16-22 6-1 10-6 10-12"/><path ${S} d="M36 10h12M38 6v8M46 6v8"/><path ${S} d="M16 48h18"/>` },
    triceps: { label: "Trizeps / Kabelzug", svg:
      `<path ${S} d="M20 8h24M32 8v26M24 34h16"/><path ${S} d="M26 34l-2 8M38 34l2 8"/><path ${S} d="M14 54h36"/>` },
    legpress: { label: "Beinpresse", svg:
      `<path ${S} d="M8 54l14-10h10M22 44l-6-14M40 14l12 12-12 12-12-12z"/><path ${S} d="M32 44l8-10"/>` },
    legext: { label: "Beinstrecker / Beinbeuger", svg:
      `<path ${S} d="M12 22v26M12 34h20M12 48h28M32 34l14-8M46 26l4 6M40 48v6M16 48v6"/>` },
    calf: { label: "Waden", svg:
      `<path ${S} d="M22 10v26l-6 12h10l4-6M40 10v26M18 52h28M36 46l6 2"/><path ${S} d="M14 10h36"/>` },
    abs: { label: "Bauch", svg:
      `<path ${S} d="M22 14h20v36H22z"/><path ${S} d="M32 14v36M22 26h20M22 38h20"/>` },
    dumbbell: { label: "Kurzhantel", svg:
      `<path ${S} d="M14 22v20M20 18v28M44 18v28M50 22v20M20 32h24"/>` },
    barbell: { label: "Langhantel", svg:
      `<path ${S} d="M4 32h56M12 22v20M17 18v28M47 18v28M52 22v20"/>` },
    cable: { label: "Kabelzug", svg:
      `<path ${S} d="M14 8v48M50 8v48M14 8h36M14 20l10 18M50 20l-10 18M20 56h24"/><circle ${S} cx="24" cy="40" r="3"/><circle ${S} cx="40" cy="40" r="3"/>` },
    bike: { label: "Fahrrad", svg:
      `<circle ${S} cx="18" cy="44" r="9"/><circle ${S} cx="46" cy="44" r="9"/><path ${S} d="M18 44l10-18h14l4 18M28 26l4 18h-14M24 18h10M42 26l-2-8h6"/>` },
    treadmill: { label: "Laufband", svg:
      `<path ${S} d="M6 50l50-6M10 56h44M46 44V18h8"/><circle ${S} cx="28" cy="14" r="4"/><path ${S} d="M28 19l-2 12 6 6-2 8M26 31l-8 6M28 22l8 6"/>` },
    crosstrainer: { label: "Crosstrainer", svg:
      `<ellipse ${S} cx="30" cy="46" rx="16" ry="6"/><path ${S} d="M46 46V14M40 14h12M22 44l10-26M38 46l-8-28"/>` },
    rower: { label: "Rudergerät (Cardio)", svg:
      `<path ${S} d="M6 48h52M52 48V32"/><circle ${S} cx="52" cy="28" r="6"/><circle ${S} cx="22" cy="26" r="4"/><path ${S} d="M22 31l2 11h-8M24 34l20-6"/>` },
    stepper: { label: "Stepper", svg:
      `<path ${S} d="M10 54h44M16 54V40h12V28h12V16h12"/><circle ${S} cx="22" cy="20" r="4"/>` },
    generic: { label: "Allgemein", svg:
      `<rect ${S} x="14" y="14" width="36" height="36" rx="6"/><path ${S} d="M24 32h16M32 24v16"/>` }
  };

  window.ICONS = {
    ui(name, cls) {
      return `<svg class="ico ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ui[name] || ""}</svg>`;
    },
    pic(name) {
      const p = pic[name] || pic.generic;
      return `<svg class="pic" viewBox="0 0 64 64" aria-hidden="true">${p.svg}</svg>`;
    },
    picList: Object.keys(pic).map((k) => ({ key: k, label: pic[k].label }))
  };
})();
