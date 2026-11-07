/* The state rules are independent of the illustration so they can be tested. */
(function (root) {
  const COLORS = ['Red', 'Orange', 'Yellow', 'White', 'Cyan', 'Green', 'Blue', 'Purple'];
  const RGB = ['255,105,105', '255,166,103', '255,221,126', '239,244,228', '118,226,225', '137,219,151', '122,162,255', '193,141,247'];
  const OILS = ['lavender', 'rosemary', 'orange', 'peppermint'];
  const MAX_DROPS = 5;
  const CLOSE_MIST = 'Close the mist first';
  function createState() {
    return {
      regular: false, sleep: false, water: 150,
      light: { mode: 'off', color: 0, count: 0, phase: 0 },
      saved: null, lightChanged: false, timer: null,
      drops: {}, scentRemaining: 0
    };
  }
  function output(s) { return s.water <= 0 ? 'OFF' : s.sleep ? 'LOW' : s.regular ? 'HIGH' : 'OFF'; }
  function stopMist(s) { s.regular = false; s.sleep = false; s.saved = null; s.lightChanged = false; }
  function dropCount(s) {
    return Object.values(s.drops).reduce((total, count) => total + count, 0);
  }
  function clearBlend(s) {
    s.drops = {};
    s.scentRemaining = 0;
  }
  function addOil(s, oil) {
    if (output(s) !== 'OFF') return CLOSE_MIST;
    if (s.water <= 0) return 'Add water before adding essential oil';
    if (dropCount(s) >= MAX_DROPS) return 'That’s enough essential oil';
    if (!OILS.includes(oil)) return 'Choose an essential oil';
    s.drops[oil] = (s.drops[oil] || 0) + 1;
    s.scentRemaining += 50;
    return null;
  }
  function pour(s) {
    if (output(s) !== 'OFF') return CLOSE_MIST;
    s.water = 0;
    clearBlend(s);
    return null;
  }
  function press(s, button) {
    if (button === 'light') {
      if (s.sleep) s.lightChanged = true;
      if (s.light.mode === 'off') s.light = { mode: 'cycling', color: 0, count: 0, phase: 0 };
      else if (s.light.mode === 'cycling') { s.light.mode = 'fixed'; s.light.count = 1; }
      else if (s.light.count < 8) { s.light.color = (s.light.color + 1) % 8; s.light.count++; }
      else s.light.mode = 'off';
    }
    if (button === 'mist') {
      if (s.water <= 0) return 'Tank empty. Hold refill before starting mist.';
      s.regular = !s.regular;
      if (s.sleep) { s.sleep = false; s.saved = null; s.lightChanged = false; }
    }
    if (button === 'sleep') {
      if (s.water <= 0) return 'Tank empty. Hold refill before starting Sleep.';
      if (!s.sleep) {
        s.saved = { ...s.light }; s.lightChanged = false; s.light.mode = 'off'; s.sleep = true;
      } else {
        s.sleep = false;
        if (!s.lightChanged && s.saved) s.light = { ...s.saved };
        s.saved = null; s.lightChanged = false;
      }
    }
    if (button === 'timer') s.timer = s.timer === null ? 60 : null;
    return null;
  }
  function tick(s, seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    // If the timer ends within this interval, consume only until its expiry.
    const activeSeconds = s.timer === null ? seconds : Math.min(seconds, s.timer);
    const mode = output(s);
    let event = null;
    if (mode !== 'OFF') {
      const used = Math.min(s.water, activeSeconds * (mode === 'HIGH' ? 50 / 60 : 25 / 60));
      s.water -= used;
      if (s.scentRemaining > 0) {
        s.scentRemaining = Math.max(0, s.scentRemaining - used);
        if (s.scentRemaining < 1e-8) {
          clearBlend(s);
          event = 'Blend spent. Plain mist continues.';
        }
      }
      if (s.water === 0) {
        stopMist(s);
        clearBlend(s);
        event = 'Water is empty. Mist stopped; the light stays unchanged.';
      }
    }
    if (s.light.mode === 'cycling') {
      s.light.phase += seconds;
      const steps = Math.floor(s.light.phase / 3);
      s.light.phase %= 3;
      s.light.color = (s.light.color + steps) % 8;
    }
    if (s.timer !== null) {
      s.timer = Math.max(0, s.timer - seconds);
      if (s.timer === 0) { stopMist(s); s.light.mode = 'off'; s.timer = null; event = 'Timer complete. Light and mist are now off.'; }
    }
    return event;
  }
  function refill(s, seconds) {
    if (output(s) !== 'OFF') return CLOSE_MIST;
    if (Number.isFinite(seconds) && seconds > 0) s.water = Math.min(150, s.water + seconds * 30);
    return null;
  }
  const api = { COLORS, RGB, OILS, MAX_DROPS, createState, output, press, tick, refill, addOil, pour, dropCount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DiffuserModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
