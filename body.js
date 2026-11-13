// GymRat muscle chart: a simple front and back figure built from muscle shapes.
// Shapes are drawn for the viewer's left half (x < 100) and mirrored to the right.
// Each shape is keyed by the fine muscle name used in app.js (PARTS).
(function () {
  const F = {
    // front view
    "Trapez": [[[88, 60], [99, 62], [99, 66], [70, 76], [78, 66]]],
    "Seitliche Schulter": [[[52, 82], [60, 74], [58, 98], [50, 104], [47, 92]]],
    "Vordere Schulter": [[[61, 74], [76, 75], [74, 92], [64, 106], [59, 98]]],
    "Obere Brust": [[[78, 77], [99, 79], [99, 92], [75, 95]]],
    "Mittlere Brust": [[[75, 96], [99, 93], [99, 108], [77, 111], [72, 104]]],
    "Untere Brust": [[[77, 112], [99, 109], [99, 118], [85, 123], [77, 117]]],
    "Bizeps": [[[55, 106], [64, 109], [66, 138], [61, 152], [54, 146], [52, 124]]],
    "Brachialis": [[[48, 116], [53, 112], [51, 128], [53, 146], [57, 156], [50, 158], [46, 140]]],
    "Brachioradialis": [[[46, 161], [55, 159], [53, 180], [44, 198], [40, 186]]],
    "Unterarmbeuger": [[[57, 160], [64, 158], [61, 196], [52, 226], [46, 222], [53, 188]]],
    "Seitlicher Bauch": [[[76, 125], [85, 127], [86, 188], [75, 196], [71, 160]]],
    "Gerader Bauch": [[[87, 125], [99, 125], [99, 141], [87, 141]], [[87, 144], [99, 144], [99, 160], [87, 160]], [[87, 163], [99, 163], [99, 180], [88, 180]]],
    "Unterer Bauch": [[[88, 184], [99, 184], [99, 214], [92, 209]]],
    "Hüftbeuger": [[[76, 199], [87, 201], [91, 214], [82, 226], [74, 212]]],
    "Abduktoren": [[[63, 206], [73, 204], [71, 226], [64, 236], [60, 222]]],
    "Äußerer Schenkelmuskel": [[[67, 238], [77, 232], [78, 300], [77, 322], [70, 318], [64, 282], [63, 252]]],
    "Gerader Schenkelmuskel": [[[80, 230], [91, 232], [93, 298], [86, 316], [80, 300], [78, 262]]],
    "Innerer Schenkelmuskel": [[[90, 298], [95, 294], [96, 318], [88, 328], [84, 318]]],
    "Adduktoren": [[[92, 228], [98, 228], [98, 288], [94, 292], [90, 262]]],
    "Schollenmuskel": [[[71, 350], [76, 346], [77, 392], [72, 390], [69, 370]]]
  };
  const B = {
    // back view
    "Trapez": [[[99, 58], [88, 62], [64, 74], [82, 84], [99, 100]], [[99, 102], [86, 90], [93, 120], [99, 140]]],
    "Seitliche Schulter": [[[50, 82], [56, 78], [55, 97], [48, 103], [46, 90]]],
    "Hintere Schulter": [[[57, 77], [68, 76], [72, 92], [62, 104], [56, 97]]],
    "Rotatorenmanschette": [[[71, 90], [83, 87], [88, 104], [76, 112], [69, 104]]],
    "Mittlerer Rücken": [[[84, 86], [91, 92], [92, 118], [81, 116], [78, 100]]],
    "Latissimus": [[[67, 110], [79, 118], [93, 124], [96, 160], [86, 184], [74, 170], [66, 140]]],
    "Unterer Rücken": [[[90, 164], [99, 164], [99, 204], [88, 204], [86, 186]]],
    "Langer Trizepskopf": [[[59, 106], [66, 110], [64, 142], [58, 150], [55, 128]]],
    "Seitlicher Trizepskopf": [[[50, 106], [57, 105], [55, 130], [51, 140], [46, 128]]],
    "Innerer Trizepskopf": [[[52, 142], [62, 144], [60, 156], [52, 158]]],
    "Unterarmstrecker": [[[44, 162], [60, 160], [56, 196], [48, 226], [40, 220], [40, 190]]],
    "Mittlerer Gesäßmuskel": [[[71, 206], [88, 206], [86, 221], [68, 225]]],
    "Großer Gesäßmuskel": [[[68, 227], [86, 223], [98, 227], [98, 258], [80, 266], [66, 252]]],
    "Abduktoren": [[[62, 212], [69, 207], [67, 240], [61, 236]]],
    "Äußerer Beinbeuger": [[[68, 262], [80, 268], [80, 320], [72, 330], [66, 300]]],
    "Innerer Beinbeuger": [[[82, 268], [96, 262], [96, 316], [86, 330], [82, 310]]],
    "Zwillingswadenmuskel": [[[72, 344], [84, 340], [94, 344], [94, 372], [84, 384], [72, 372], [70, 356]]],
    "Schollenmuskel": [[[72, 376], [84, 387], [94, 376], [92, 398], [84, 404], [74, 398]]]
  };
  // Neutral parts (head, hands, joints) that only give the figure its outline.
  const NEUTRAL = {
    front: '<circle cx="100" cy="32" r="18"/><rect x="91" y="48" width="18" height="12" rx="4"/>' +
      '<ellipse cx="46" cy="240" rx="8" ry="12"/><ellipse cx="154" cy="240" rx="8" ry="12"/>' +
      '<ellipse cx="83" cy="334" rx="10" ry="8"/><ellipse cx="117" cy="334" rx="10" ry="8"/>' +
      '<path d="M79 344L94 344L92 402L80 404Z"/><path d="M121 344L106 344L108 402L120 404Z"/>' +
      '<ellipse cx="85" cy="414" rx="10" ry="6"/><ellipse cx="115" cy="414" rx="10" ry="6"/>',
    back: '<circle cx="100" cy="32" r="18"/><rect x="91" y="48" width="18" height="12" rx="4"/>' +
      '<ellipse cx="46" cy="240" rx="8" ry="12"/><ellipse cx="154" cy="240" rx="8" ry="12"/>' +
      '<ellipse cx="83" cy="335" rx="10" ry="6"/><ellipse cx="117" cy="335" rx="10" ry="6"/>' +
      '<ellipse cx="85" cy="414" rx="10" ry="6"/><ellipse cx="115" cy="414" rx="10" ry="6"/>'
  };
  const path = (pts) => "M" + pts.map(([x, y]) => `${x} ${y}`).join("L") + "Z";
  const mirror = (pts) => pts.map(([x, y]) => [200 - x, y]);
  // Shapes that already span the middle (x reaches 99) are mirrored too; the halves meet at the center line.
  function figure(view, on) {
    const shapes = view === "front" ? F : B;
    let g = `<g class="bn">${NEUTRAL[view]}</g>`;
    for (const [name, polys] of Object.entries(shapes)) {
      const cls = on.has(name) ? "bm on" : "bm";
      for (const p of polys) g += `<path class="${cls}" d="${path(p)}"/><path class="${cls}" d="${path(mirror(p))}"/>`;
    }
    return `<svg class="body-fig" viewBox="20 6 160 418" role="img" aria-label="${view === "front" ? "Vorderansicht" : "Rückansicht"}">${g}</svg>`;
  }
  window.BODY = {
    figure,
    // true when the muscle appears in this view
    has: (view, name) => !!(view === "front" ? F : B)[name]
  };
})();
