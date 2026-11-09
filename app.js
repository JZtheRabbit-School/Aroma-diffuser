(() => {
  const model = window.DiffuserModel;
  let state = model.createState();
  let holding = false;
  let lastTime = performance.now();
  const el = id => document.getElementById(id);
  const say = message => { el('notice').textContent = message; };
  const oilButtons = [...el('oil-options').querySelectorAll('button')];
  const plume = el('scent-plume');
  let plumeKey = '';
  let toastTimer;

  function warn(message) {
    const toast = el('warning-toast');
    toast.hidden = false;
    toast.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
  }

  function renderScent(output) {
    const total = model.dropCount(state);
    const strength = total ? state.scentRemaining / (total * 50) : 0;
    el('drop-total').textContent = `${total} / ${model.MAX_DROPS} drops`;
    el('oil-options').classList.toggle('blend-full', total >= model.MAX_DROPS);
    el('scent-status').textContent = total
      ? `Scent remaining for ${Math.ceil(state.scentRemaining)} mL of mist`
      : 'No oil added.';

    const motifs = [];
    for (const button of oilButtons) {
      const count = state.drops[button.dataset.oil] || 0;
      button.querySelector('.oil-count').textContent = count;
      if (output === 'OFF' || count === 0) continue;
      const perDrop = output === 'HIGH' ? 4 : 2;
      const quantity = count * Math.ceil(perDrop * strength);
      for (let i = 0; i < quantity; i++) motifs.push(button);
    }
    plume.style.setProperty('--scent-strength', Math.min(1, strength * 2));
    const key = motifs.map(button => button.dataset.oil).join(',');
    if (key === plumeKey) return;
    plumeKey = key;
    plume.replaceChildren(...motifs.map((button, index) => {
      const motif = button.querySelector('.oil-icon').cloneNode(true);
      motif.dataset.oil = button.dataset.oil;
      // Give each motif a lane, then vary its position, pace, and sway.
      const lane = (index + 0.25 + Math.random() * 0.5) / motifs.length;
      const duration = 3.5 + Math.random() * 2;
      const phase = (0.27 + index * 0.618) % 1;
      motif.style.setProperty('--x', `${16 + lane * 68}%`);
      motif.style.setProperty('--duration', `${duration}s`);
      motif.style.setProperty('--delay', `${-phase * duration}s`);
      motif.style.setProperty('--sway-mid', `${Math.random() * 18 - 9}px`);
      motif.style.setProperty('--sway-end', `${Math.random() * 18 - 9}px`);
      motif.style.setProperty('--rest-y', `${15 + phase * 90}px`);
      return motif;
    }));
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function render() {
    const output = model.output(state);
    const light = state.light;
    const rgb = model.RGB[light.color];
    const lightOn = light.mode !== 'off';
    const stage = el('stage');
    stage.dataset.output = output;
    stage.style.setProperty('--lamp', rgb);
    stage.style.setProperty('--lamp-strength', lightOn ? '1' : '0');
    stage.style.setProperty('--lamp-fill', lightOn ? '.94' : '0');
    // Interpolate the current cycling color into the next for a gentle fade.
    if (light.mode === 'cycling' && !reducedMotion.matches) {
      const from = model.RGB[light.color].split(',').map(Number);
      const to = model.RGB[(light.color + 1) % 8].split(',').map(Number);
      stage.style.setProperty('--lamp', from.map((v, i) => Math.round(v + (to[i] - v) * light.phase / 3)).join(','));
    }
    const label = light.mode === 'off' ? 'Off' : light.mode === 'cycling' ? 'Color cycle' : `${model.COLORS[light.color]} · ${light.count}/8`;
    el('mist-state').textContent = output === 'OFF' ? 'Off' : output === 'HIGH' ? 'High' : 'Low';
    el('light-state').textContent = label;
    el('sleep-state').textContent = state.sleep ? 'On' : 'Off';
    const remaining = Math.ceil(state.timer || 0);
    el('timer-state').textContent = state.timer === null ? 'Not set' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
    el('water-value').textContent = state.water.toFixed(1);
    el('water-bar').value = state.water;
    el('water-bar').textContent = `${state.water.toFixed(1)} mL`;
    el('refill').classList.toggle('holding', holding);
    el('refill-hint').textContent = output !== 'OFF' ? 'Turn mist off before refilling.' : state.water >= 150 ? 'Tank full. Refill when the mist is off.' : holding ? 'Refilling… release to stop.' : 'Hold to add water. Release to stop.';
    el('sleep').setAttribute('aria-pressed', String(state.sleep));
    el('mist').setAttribute('aria-pressed', String(state.regular));
    el('timer').setAttribute('aria-pressed', String(state.timer !== null));
    el('light').setAttribute('aria-pressed', String(lightOn));
    el('regular-state').textContent = state.regular ? 'ON' : 'OFF';
    el('memory-sleep').textContent = state.sleep ? 'ON' : 'OFF';
    el('explanation').textContent = state.water <= 0 ? 'The tank is empty. Refill, then press Mist or Sleep to restart.' : state.sleep ? `Sleep overrides regular mist (${state.regular ? 'ON' : 'OFF'}) with LOW output. Press Sleep again to return to ${state.regular ? 'HIGH' : 'OFF'}.` : `Sleep is off. Regular mist is ${state.regular ? 'ON, so output is HIGH' : 'OFF, so there is no mist'}.`;
    el('output-caption').textContent = state.water <= 0 ? 'A little water, then we can begin again' : output === 'OFF' ? 'Ready when you are' : output === 'HIGH' ? 'High mist · a fuller atmosphere' : 'Low mist · a gentler pace';
    el('status-dot').classList.toggle('active', output !== 'OFF');
    el('diffuser').setAttribute('aria-label', `Frosted aroma diffuser. Light: ${label}. Mist: ${output.toLowerCase()}.`);
    renderScent(output);
  }
  function update(now) {
    const seconds = Math.max(0, (now - lastTime) / 1000);
    lastTime = now;
    // A held refill ends if focus is lost; elapsed time still advances the model.
    if (holding) {
      model.refill(state, seconds);
      if (state.water >= 150 || model.output(state) !== 'OFF') release();
    }
    const event = model.tick(state, seconds);
    if (event) say(event);
  }
  function release() { holding = false; el('refill').classList.remove('holding'); }
  ['light', 'sleep', 'timer', 'mist'].forEach(button => {
    el(button).addEventListener('click', () => {
      update(performance.now());
      const warning = model.press(state, button);
      if (model.output(state) !== 'OFF') release();
      say(warning || (button === 'light' ? 'Light setting updated.' : button === 'timer' ? state.timer === null ? 'Timer cancelled.' : 'One-minute timer started.' : `${button === 'sleep' ? 'Sleep' : 'Mist'} pressed. Output: ${model.output(state).toLowerCase()}.`));
      render();
    });
  });
  const refill = el('refill');
  function beginRefill() {
    update(performance.now());
    const warning = model.refill(state, 0);
    if (warning) { warn(warning); return false; }
    if (state.water >= 150) { say('Tank is full.'); return false; }
    holding = true;
    say('Adding water. Release the button to stop.');
    render();
    return true;
  }
  refill.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !e.isPrimary) return;
    e.preventDefault();
    if (beginRefill()) refill.setPointerCapture(e.pointerId);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => refill.addEventListener(name, () => { update(performance.now()); release(); render(); }));
  refill.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (!e.repeat) beginRefill();
    }
  });
  refill.addEventListener('keyup', e => {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); update(performance.now()); release(); render(); }
  });
  refill.addEventListener('blur', release);
  refill.addEventListener('click', e => {
    if (e.detail !== 0) return;
    update(performance.now());
    const warning = model.refill(state, 0);
    if (warning) warn(warning);
    else say('Hold the refill button to add water.');
  });
  el('pour').addEventListener('click', () => {
    update(performance.now());
    const warning = model.pour(state);
    if (warning) warn(warning);
    else {
      release();
      say('Tank emptied and blend cleared.');
      render();
    }
  });
  for (const button of oilButtons) {
    button.addEventListener('click', () => {
      update(performance.now());
      const warning = model.addOil(state, button.dataset.oil);
      if (warning) warn(warning);
      else {
        say(`Added one drop of ${button.children[1].textContent.toLowerCase()}.`);
        render();
      }
    });
  }
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
  el('reset').addEventListener('click', () => { release(); state = model.createState(); lastTime = performance.now(); say('Reset: full tank, all settings off.'); render(); });
  function frame(now) { update(now); render(); requestAnimationFrame(frame); }
  render(); requestAnimationFrame(frame);
})();
