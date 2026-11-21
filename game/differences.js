// differences.js — the levels of Dusk Cove, and the feature each difference changes.
//
// The scene is drawn from a feature state (see scene.js: baseFeatures). The left
// panel always shows the base state; the right panel shows the base state with
// every change of the current level applied. A difference is one feature change
// plus the place to click: x, y in scene coordinates (560 x 400) and r, the
// radius a click may land within and still count as a find.
//
// Levels rise in difficulty: more differences, smaller radii, subtler changes
// (a lit window going dark is level 1; a missing sun-glint on the water is 3).

export const LEVELS = [
  {
    name: 'Level 1 · First Light Cove',
    seconds: 120,
    differences: [
      { id: 'lamp-off', label: 'the lighthouse lamp has gone out', x: 110, y: 128, r: 30, change: { lampOn: false } },
      { id: 'sail-red', label: 'the sailboat’s sail turned red', x: 298, y: 248, r: 34, change: { sailColor: '#e2483d' } },
      { id: 'buoy-gone', label: 'the red buoy is missing', x: 205, y: 300, r: 20, change: { buoyShown: false } },
      { id: 'gull-gone', label: 'one gull has flown away', x: 250, y: 90, r: 20, change: { gullB: false } },
      { id: 'house1-dark', label: 'the harbour house window went dark', x: 415, y: 285, r: 16, change: { house1Lit: false } },
    ],
  },
  {
    name: 'Level 2 · Harbour Dusk',
    seconds: 150,
    differences: [
      { id: 'flag-flip', label: 'the lighthouse flag flies the other way', x: 122, y: 82, r: 22, change: { flagDir: -1 } },
      { id: 'moon-shown', label: 'a crescent moon has risen', x: 490, y: 58, r: 24, change: { moonShown: true } },
      { id: 'cloud-gone', label: 'one cloud has drifted off', x: 470, y: 110, r: 34, change: { cloudC: false } },
      { id: 'house2-lit', label: 'the cottage window lit up', x: 505, y: 282, r: 16, change: { house2Lit: true } },
      { id: 'crab-gone', label: 'the crab has scuttled away', x: 480, y: 368, r: 20, change: { crabShown: false } },
      { id: 'starfish-purple', label: 'the starfish turned purple', x: 150, y: 365, r: 18, change: { starfishColor: '#8b5cf6' } },
      { id: 'door-lit', label: 'the lighthouse door stands open, lamplit', x: 110, y: 262, r: 18, change: { doorLit: true } },
      { id: 'pennant-flip', label: 'one pennant in the bunting changed colour', x: 460, y: 282, r: 18, change: { pennantFlip: 3 } },
    ],
  },
  {
    name: 'Level 3 · Moonrise Cove',
    seconds: 180,
    differences: [
      { id: 'extra-star', label: 'a new star has appeared', x: 205, y: 48, r: 14, change: { extraStar: true } },
      { id: 'stripe-blue', label: 'one lighthouse stripe turned blue', x: 110, y: 215, r: 24, change: { stripeColor: '#3d6de2' } },
      { id: 'oar-gone', label: 'the rowboat lost its oar', x: 470, y: 300, r: 18, change: { oarShown: false } },
      { id: 'smoke-gone', label: 'the chimney smoke has stopped', x: 520, y: 222, r: 22, change: { smokeShown: false } },
      { id: 'flag-teal', label: 'the lighthouse flag turned teal', x: 122, y: 82, r: 20, change: { flagColor: '#2a9d8f' } },
      { id: 'anchor-shown', label: 'an old anchor washed up on the sand', x: 60, y: 372, r: 20, change: { anchorShown: true } },
      { id: 'buoy-green', label: 'the buoy turned green', x: 205, y: 300, r: 18, change: { buoyColor: '#2f9e5f' } },
      { id: 'tower-window-dark', label: 'the tower window went dark', x: 110, y: 198, r: 14, change: { towerWindowLit: false } },
      { id: 'reflection-gone', label: 'the sun’s path on the water has vanished', x: 300, y: 300, r: 26, change: { reflectionShown: false } },
    ],
  },
];

/** The right panel's feature state for a level: the base plus every change. */
export function variantFeatures(base, level) {
  const state = { ...base };
  for (const diff of level.differences) Object.assign(state, diff.change);
  return state;
}
