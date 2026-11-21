// scene.js — draws the Dusk Cove scene from a feature state, entirely in code.
//
// One scene, one art identity: a lighthouse cove at dusk. Deep indigo sky
// melting to amber at the horizon, a teal sea, warm lamplight, flat shapes
// edged in dark indigo. The same function draws both panels; the only thing
// that differs is the feature state it is handed, so any visible difference
// between the panels is exactly one of the level's changes (differences.js).
//
// Scene coordinates are 560 x 400. Everything is deterministic: no randomness,
// no clock, so the two panels can never drift apart on their own.

export const VIEW_W = 560;
export const VIEW_H = 400;

const INK = '#232038'; // the scene's one outline colour

/** The base feature state: what the left (original) panel always shows. */
export function baseFeatures() {
  return {
    lampOn: true, // lighthouse lamp lit, beam sweeping the water
    flagDir: 1, // flag flies to the right
    flagColor: '#e2483d',
    doorLit: false, // lighthouse door shut and dark
    towerWindowLit: true,
    stripeColor: '#e2483d', // the tower's middle band
    moonShown: false,
    extraStar: false,
    cloudC: true, // the small cloud at upper right
    gullB: true, // the middle gull
    sailColor: '#f7f3e8',
    oarShown: true, // the rowboat's oar
    buoyShown: true,
    buoyColor: '#e2483d',
    house1Lit: true, // harbour house window
    house2Lit: false, // cottage window
    smokeShown: true, // cottage chimney smoke
    starfishColor: '#f08a24',
    crabShown: true,
    anchorShown: false, // an old anchor on the sand
    reflectionShown: true, // the sun's glitter path on the water
    pennantFlip: -1, // index of the bunting pennant that changed colour (-1: none)
  };
}

const PENNANTS = ['#e2483d', '#f2b134', '#2a9d8f', '#f7f3e8', '#e2483d', '#2a9d8f', '#f2b134'];

function path(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function drawSky(ctx, f) {
  const sky = ctx.createLinearGradient(0, 0, 0, 252);
  sky.addColorStop(0, '#2b2a55');
  sky.addColorStop(0.55, '#7a4a7e');
  sky.addColorStop(0.85, '#e2703a');
  sky.addColorStop(1, '#f7b267');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, 252);

  // Stars: a fixed scatter in the upper sky, plus one more when extraStar.
  ctx.fillStyle = 'rgba(255,244,214,0.9)';
  const stars = [[40, 30], [90, 70], [150, 26], [262, 36], [318, 64], [368, 22], [430, 44], [520, 30], [66, 118], [352, 110]];
  for (const [x, y] of stars) { ctx.fillRect(x, y, 2, 2); }
  if (f.extraStar) { // the level-3 star, at the difference's click point
    ctx.save();
    ctx.translate(205, 48);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(-1, -5, 2, 10); ctx.fillRect(-5, -1, 10, 2);
    ctx.restore();
  }

  if (f.moonShown) { // crescent moon, upper right
    ctx.save();
    ctx.fillStyle = '#f7ead1';
    ellipse(ctx, 490, 58, 17, 17); ctx.fill();
    ctx.fillStyle = '#3a3566';
    ellipse(ctx, 499, 52, 14, 14); ctx.fill();
    ctx.restore();
  }

  // The low sun, resting on the horizon over the water.
  const sun = ctx.createRadialGradient(300, 196, 4, 300, 196, 60);
  sun.addColorStop(0, 'rgba(255,214,140,0.95)');
  sun.addColorStop(0.45, 'rgba(255,166,88,0.55)');
  sun.addColorStop(1, 'rgba(255,166,88,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(228, 124, 144, 128);
  ctx.fillStyle = '#ffd98c';
  ellipse(ctx, 300, 198, 30, 30); ctx.fill();
  ctx.fillStyle = '#ffb35c';
  ellipse(ctx, 300, 202, 30, 26); ctx.fill();
}

function drawCloud(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(58,48,92,0.85)';
  ellipse(ctx, x, y, 34 * s, 11 * s); ctx.fill();
  ellipse(ctx, x - 18 * s, y + 3 * s, 20 * s, 8 * s); ctx.fill();
  ellipse(ctx, x + 20 * s, y + 3 * s, 22 * s, 8 * s); ctx.fill();
  ellipse(ctx, x + 2 * s, y - 7 * s, 20 * s, 9 * s); ctx.fill();
}

function drawGull(ctx, x, y, s) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 11 * s, y);
  ctx.quadraticCurveTo(x - 4 * s, y - 7 * s, x, y);
  ctx.quadraticCurveTo(x + 4 * s, y - 7 * s, x + 11 * s, y);
  ctx.stroke();
}

function drawLighthouse(ctx, f) {
  // Rocky point the tower stands on.
  ctx.fillStyle = '#3c3654';
  path(ctx, [[28, 322], [52, 282], [92, 268], [140, 276], [172, 300], [182, 322]]);
  ctx.fill();
  ctx.fillStyle = '#4a4266';
  path(ctx, [[52, 322], [76, 292], [112, 288], [132, 322]]);
  ctx.fill();

  // Light beam first, so the tower draws over its root.
  if (f.lampOn) {
    const beam = ctx.createLinearGradient(118, 128, 330, 168);
    beam.addColorStop(0, 'rgba(255,226,150,0.50)');
    beam.addColorStop(1, 'rgba(255,226,150,0)');
    ctx.fillStyle = beam;
    path(ctx, [[118, 120], [336, 148], [336, 196], [118, 138]]);
    ctx.fill();
  }

  // Tower: three bands, the middle one in stripeColor.
  const bands = [
    { y: 146, h: 44, w: 40, colour: '#f4efe4' },
    { y: 190, h: 44, w: 45, colour: f.stripeColor },
    { y: 234, h: 50, w: 50, colour: '#f4efe4' },
  ];
  for (const b of bands) {
    ctx.fillStyle = b.colour;
    ctx.fillRect(110 - b.w / 2, b.y, b.w, b.h);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.strokeRect(110 - b.w / 2, b.y, b.w, b.h);
  }

  // Tower window, in the top band.
  ctx.fillStyle = f.towerWindowLit ? '#ffd76e' : '#4a4266';
  ctx.fillRect(103, 190, 14, 16);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(103, 190, 14, 16);

  // Door at the base: shut and dark, or open and lamplit.
  ctx.fillStyle = f.doorLit ? '#ffca6a' : '#2e2a47';
  path(ctx, [[99, 284], [99, 254], [110, 246], [121, 254], [121, 284]]);
  ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();

  // Gallery and lamp room.
  ctx.fillStyle = '#2e2a47';
  ctx.fillRect(84, 138, 52, 8);
  ctx.fillRect(94, 112, 32, 26);
  ctx.fillStyle = f.lampOn ? '#ffe89a' : '#57517a';
  ellipse(ctx, 110, 125, 8, 10); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.strokeRect(94, 112, 32, 26);
  path(ctx, [[90, 112], [110, 96], [130, 112]]); // roof
  ctx.fillStyle = '#e2483d'; ctx.fill();

  // Flag pole and flag; flagDir flips it, flagColor paints it.
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(110, 96); ctx.lineTo(110, 70); ctx.stroke();
  ctx.fillStyle = f.flagColor;
  const fx = 110, fy = 70, len = 24 * f.flagDir;
  path(ctx, [[fx, fy], [fx + len, fy + 6], [fx, fy + 13]]);
  ctx.fill();
}

function drawSea(ctx, f) {
  const sea = ctx.createLinearGradient(0, 250, 0, 338);
  sea.addColorStop(0, '#e2703a');
  sea.addColorStop(0.25, '#9c5a78');
  sea.addColorStop(1, '#1f5f6e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 250, VIEW_W, 88);

  // The sun's glitter path: broken dashes down the middle of the water.
  if (f.reflectionShown) {
    ctx.fillStyle = 'rgba(255,205,120,0.75)';
    const dashes = [[284, 258, 32], [290, 270, 22], [280, 282, 40], [292, 296, 20], [284, 308, 30], [294, 322, 16]];
    for (const [x, y, w] of dashes) ctx.fillRect(x, y, w, 3);
  }

  // Wave strokes, two fixed rows.
  ctx.strokeStyle = 'rgba(240,248,255,0.35)';
  ctx.lineWidth = 1.6;
  for (const [x, y] of [[36, 268], [150, 292], [238, 264], [392, 276], [470, 300], [96, 314], [350, 318], [520, 262]]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 9, y - 4, x + 18, y);
    ctx.stroke();
  }
}

function drawSailboat(ctx, f) {
  // Sailboat, mid-water.
  ctx.fillStyle = 'rgba(31,95,110,0.55)'; // its reflection
  path(ctx, [[272, 306], [330, 306], [322, 314], [280, 314]]);
  ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(300, 288); ctx.lineTo(300, 214); ctx.stroke(); // mast
  ctx.fillStyle = f.sailColor; // the big sail: a level-1 difference paints it red
  path(ctx, [[304, 218], [304, 282], [330, 282]]);
  ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = '#f7f3e8';
  path(ctx, [[296, 226], [296, 282], [276, 282]]);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8a5a3b'; // hull
  path(ctx, [[268, 288], [334, 288], [324, 304], [278, 304]]);
  ctx.fill(); ctx.strokeStyle = INK; ctx.stroke();
}

function drawRowboat(ctx, f) {
  // Rowboat pulled up at the harbour shore — drawn after the houses, so the
  // shore never covers it — with or without its oar.
  ctx.fillStyle = '#5b7f4f';
  path(ctx, [[428, 302], [486, 302], [476, 314], [438, 314]]);
  ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
  if (f.oarShown) {
    ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(452, 300); ctx.lineTo(478, 288); ctx.stroke();
    ctx.fillStyle = '#8a5a3b';
    ellipse(ctx, 481, 286, 5, 3); ctx.fill();
  }
}

function drawBuoy(ctx, f) {
  if (!f.buoyShown) return;
  ctx.fillStyle = f.buoyColor;
  path(ctx, [[196, 306], [214, 306], [210, 292], [200, 292]]);
  ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = '#f7f3e8';
  ctx.fillRect(198, 298, 14, 3);
  ctx.fillStyle = f.buoyColor;
  ellipse(ctx, 205, 289, 3.5, 3.5); ctx.fill();
}

function drawHouses(ctx, f) {
  // Shore the houses stand on.
  ctx.fillStyle = '#4a4266';
  path(ctx, [[368, 338], [382, 288], [430, 272], [560, 272], [560, 338]]);
  ctx.fill();

  // Bunting strung from a pole over the harbour front: seven pennants, and in
  // one level a single pennant of the repeated pattern changes colour.
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(376, 252); ctx.lineTo(376, 292); ctx.stroke(); // the pole
  ctx.beginPath(); ctx.moveTo(372, 254); ctx.quadraticCurveTo(462, 282, 548, 250); ctx.stroke(); // the string
  for (let i = 0; i < PENNANTS.length; i++) {
    const t = (i + 0.5) / PENNANTS.length;
    const u = 1 - t; // point on the same quadratic curve the string follows
    const x = u * u * 372 + 2 * u * t * 462 + t * t * 548;
    const y = u * u * 254 + 2 * u * t * 282 + t * t * 250;
    ctx.fillStyle = i === f.pennantFlip ? '#8b5cf6' : PENNANTS[i];
    path(ctx, [[x - 8, y], [x + 8, y], [x, y + 13]]);
    ctx.fill();
  }

  // Harbour house (left): warm window, or dark in level 1.
  ctx.fillStyle = '#d9c9a8';
  ctx.fillRect(392, 282, 46, 40);
  path(ctx, [[388, 282], [415, 262], [442, 282]]);
  ctx.fillStyle = '#7a3b3b'; ctx.fill();
  ctx.fillStyle = f.house1Lit ? '#ffd76e' : '#4a4266';
  ctx.fillRect(408, 292, 14, 14);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(408, 292, 14, 14);
  ctx.fillStyle = '#2e2a47';
  ctx.fillRect(424, 300, 10, 22);

  // Cottage (right): chimney smoke, and a window that lights in level 2.
  if (f.smokeShown) {
    ctx.fillStyle = 'rgba(230,228,240,0.55)';
    ellipse(ctx, 520, 226, 7, 5); ctx.fill();
    ellipse(ctx, 526, 214, 9, 6); ctx.fill();
    ellipse(ctx, 534, 200, 12, 7); ctx.fill();
  }
  ctx.fillStyle = '#b8c4ce';
  ctx.fillRect(472, 278, 52, 44);
  ctx.fillStyle = '#2e2a47';
  ctx.fillRect(512, 254, 9, 16); // chimney
  path(ctx, [[466, 278], [498, 256], [530, 278]]);
  ctx.fillStyle = '#3f6d8e'; ctx.fill();
  ctx.fillStyle = f.house2Lit ? '#ffd76e' : '#4a4266';
  ctx.fillRect(498, 288, 14, 14);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.strokeRect(498, 288, 14, 14);
  ctx.fillStyle = '#2e2a47';
  ctx.fillRect(478, 298, 11, 24);
}

function drawBeach(ctx, f) {
  const sand = ctx.createLinearGradient(0, 336, 0, 400);
  sand.addColorStop(0, '#c98d5f');
  sand.addColorStop(1, '#a9713f');
  ctx.fillStyle = sand;
  ctx.fillRect(0, 336, VIEW_W, 64);
  ctx.strokeStyle = 'rgba(35,32,56,0.25)';
  ctx.lineWidth = 1.2;
  for (const [x, y] of [[40, 352], [210, 360], [330, 350], [430, 358], [520, 348]]) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y); ctx.stroke();
  }

  // Starfish: five arms around a centre, in starfishColor.
  ctx.save();
  ctx.translate(150, 365);
  ctx.fillStyle = f.starfishColor;
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5);
    path(ctx, [[-3.4, 0], [0, -13], [3.4, 0]]);
    ctx.fill();
  }
  ellipse(ctx, 0, 0, 4.4, 4.4); ctx.fill();
  ctx.restore();

  // A shell, always there.
  ctx.fillStyle = '#f2d5c4';
  ellipse(ctx, 330, 378, 9, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(35,32,56,0.4)';
  ctx.beginPath(); ctx.moveTo(324, 374); ctx.lineTo(330, 382); ctx.moveTo(336, 374); ctx.lineTo(330, 382); ctx.stroke();

  if (f.crabShown) { // the crab, right side of the beach
    ctx.fillStyle = '#d94f3d';
    ellipse(ctx, 480, 370, 11, 7); ctx.fill();
    ellipse(ctx, 466, 362, 5, 4); ctx.fill();
    ellipse(ctx, 494, 362, 5, 4); ctx.fill();
    ctx.fillStyle = INK;
    ellipse(ctx, 476, 366, 1.7, 1.7); ctx.fill();
    ellipse(ctx, 484, 366, 1.7, 1.7); ctx.fill();
    ctx.strokeStyle = '#d94f3d'; ctx.lineWidth = 2;
    for (const [x, y] of [[472, 376], [480, 378], [488, 376]]) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 5); ctx.stroke();
    }
  }

  if (f.anchorShown) { // the washed-up anchor, left side of the beach
    ctx.strokeStyle = '#3a3f4a'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(60, 356); ctx.lineTo(60, 384); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(48, 362); ctx.lineTo(72, 362); ctx.stroke();
    ctx.beginPath(); ctx.arc(60, 378, 11, 0.25 * Math.PI, 0.75 * Math.PI, false); ctx.stroke();
    ellipse(ctx, 60, 352, 4, 4); ctx.stroke();
  }
}

/** Draw the whole cove for one feature state. */
export function drawScene(ctx, f) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawSky(ctx, f);
  drawCloud(ctx, 120, 58, 1);
  drawCloud(ctx, 330, 38, 0.8);
  if (f.cloudC) drawCloud(ctx, 470, 110, 0.7);
  drawGull(ctx, 180, 122, 1);
  if (f.gullB) drawGull(ctx, 250, 90, 0.85);
  drawGull(ctx, 392, 142, 0.9);
  drawSea(ctx, f);
  drawLighthouse(ctx, f);
  drawSailboat(ctx, f);
  drawBuoy(ctx, f);
  drawHouses(ctx, f);
  drawRowboat(ctx, f);
  drawBeach(ctx, f);
}
