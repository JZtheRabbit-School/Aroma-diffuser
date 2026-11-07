const assert = require('node:assert/strict');
const m = require('./model.js');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log(`PASS ${name}`); }
const sequences = {
  SMSM: ['LOW','HIGH','LOW','OFF'], MSM: ['HIGH','LOW','OFF'],
  MSSS: ['HIGH','LOW','HIGH','LOW'], MSSM: ['HIGH','LOW','HIGH','OFF'],
  SSM: ['LOW','OFF','HIGH'], SMM: ['LOW','HIGH','OFF'],
  MSMSS: ['HIGH','LOW','OFF','LOW','OFF'], SMSSM: ['LOW','HIGH','LOW','HIGH','OFF']
};
for (const [sequence, expected] of Object.entries(sequences)) test(sequence, () => {
  const s = m.createState();
  assert.deepEqual([...sequence].map(b => { m.press(s, b === 'M' ? 'mist' : 'sleep'); return m.output(s); }), expected);
});
function red(s) { m.press(s,'light'); m.press(s,'light'); }
test('Freeze white, visit all eight fixed colors, then off', () => {
  const s = m.createState(); m.press(s,'light'); m.tick(s,9); m.press(s,'light');
  const result = [m.COLORS[s.light.color]];
  for(let i=0;i<7;i++){m.press(s,'light');result.push(m.COLORS[s.light.color]);}
  assert.deepEqual(result,['White','Cyan','Green','Blue','Purple','Red','Orange','Yellow']);
  m.press(s,'light'); assert.equal(s.light.mode,'off');
});
test('M-S-S restores fixed red and count', () => {
  const s=m.createState(); red(s);m.press(s,'mist');m.press(s,'sleep');assert.equal(s.light.mode,'off');m.press(s,'sleep');
  assert.equal(s.light.mode,'fixed');assert.equal(s.light.color,0);assert.equal(s.light.count,1);
});
test('S-M-S-S discards saved red',()=>{
  const s=m.createState();red(s);for(const b of ['sleep','mist','sleep','sleep']){m.press(s,b);assert.equal(s.light.mode,'off');}
  m.press(s,'light');assert.equal(s.light.mode,'cycling');
});
test('Light changed in Sleep is preserved without changing LOW',()=>{
  const s=m.createState();red(s);m.press(s,'sleep');m.press(s,'light');m.tick(s,3);m.press(s,'light');
  assert.equal(m.output(s),'LOW');m.press(s,'sleep');assert.equal(s.light.color,1);assert.equal(s.light.mode,'fixed');
});
test('Mixed mist consumption uses remaining water',()=>{
  const s=m.createState();m.press(s,'mist');m.tick(s,60);assert.equal(s.water,100);m.press(s,'sleep');m.tick(s,60);assert.equal(s.water,75);
});
test('High empties in 180 seconds; low in 360',()=>{
  for(const [button,time] of [['mist',180],['sleep',360]]){const s=m.createState();m.press(s,button);m.tick(s,time);assert.equal(s.water,0);assert.equal(m.output(s),'OFF');}
});
test('Empty water keeps light, refill does not restart, empty start blocked',()=>{
  const s=m.createState();red(s);m.press(s,'mist');m.tick(s,180);assert.equal(s.light.mode,'fixed');
  m.press(s,'mist');assert.equal(m.output(s),'OFF');m.press(s,'sleep');assert.equal(s.sleep,false);
  m.refill(s,2);assert.equal(s.water,60);assert.equal(m.output(s),'OFF');m.press(s,'mist');assert.equal(m.output(s),'HIGH');
});
test('Refill prohibited during mist and capped at 150',()=>{
  const s=m.createState();m.press(s,'mist');m.tick(s,60);m.refill(s,5);assert.equal(s.water,100);
  m.press(s,'mist');m.refill(s,10);assert.equal(s.water,150);
});
test('Timer can cancel, expires at 60 seconds, stops light and mist',()=>{
  const s=m.createState();m.press(s,'timer');m.tick(s,10);assert.equal(s.timer,50);m.press(s,'timer');assert.equal(s.timer,null);
  red(s);m.press(s,'mist');m.press(s,'timer');m.tick(s,70);
  assert.equal(s.water,100);assert.equal(s.light.mode,'off');assert.equal(m.output(s),'OFF');assert.equal(s.timer,null);
});
test('The five-drop cap stays locked after partial use and refill', () => {
  const s = m.createState();
  for (let i = 0; i < 3; i++) assert.equal(m.addOil(s, 'lavender'), null);
  for (let i = 0; i < 2; i++) assert.equal(m.addOil(s, 'rosemary'), null);
  m.press(s, 'mist');
  m.tick(s, 120);
  m.press(s, 'mist');
  m.refill(s, 5);
  assert.equal(s.water, 150);
  assert.equal(s.scentRemaining, 150);
  assert.deepEqual(s.drops, { lavender: 3, rosemary: 2 });
  assert.equal(m.addOil(s, 'orange'), 'That’s enough essential oil');
});
test('Scent can expire while plain mist continues', () => {
  const s = m.createState();
  m.addOil(s, 'peppermint');
  m.press(s, 'sleep');
  m.tick(s, 120);
  assert.equal(s.water, 100);
  assert.equal(m.output(s), 'LOW');
  assert.equal(m.dropCount(s), 0);
  m.press(s, 'sleep');
  assert.equal(m.addOil(s, 'orange'), null);
});
test('Tank actions are blocked on both HIGH and LOW', () => {
  for (const button of ['mist', 'sleep']) {
    const s = m.createState();
    m.addOil(s, 'lavender');
    m.press(s, button);
    m.tick(s, 10);
    const before = JSON.stringify(s);
    for (const result of [m.refill(s, 1), m.addOil(s, 'orange'), m.pour(s)]) {
      assert.equal(result, 'Close the mist first');
    }
    assert.equal(JSON.stringify(s), before);
  }
});
test('Pouring and running dry both clear the blend', () => {
  for (const drain of [
    s => m.pour(s),
    s => { m.press(s, 'mist'); m.tick(s, 180); }
  ]) {
    const s = m.createState();
    red(s);
    for (let i = 0; i < 5; i++) m.addOil(s, 'lavender');
    drain(s);
    assert.equal(s.water, 0);
    assert.equal(s.scentRemaining, 0);
    assert.equal(m.dropCount(s), 0);
    assert.equal(s.light.mode, 'fixed');
    assert.equal(m.addOil(s, 'orange'), 'Add water before adding essential oil');
    m.refill(s, 5);
    assert.equal(m.output(s), 'OFF');
    assert.equal(m.dropCount(s), 0);
  }
});
test('A new drop tops up a blend under the cap, and timer expiry preserves the rest', () => {
  const s = m.createState();
  m.addOil(s, 'lavender');
  m.press(s, 'mist');
  m.tick(s, 30);
  m.press(s, 'mist');
  m.addOil(s, 'orange');
  assert.equal(s.scentRemaining, 75);
  m.press(s, 'mist');
  m.press(s, 'timer');
  m.tick(s, 90);
  assert.equal(s.scentRemaining, 25);
  assert.equal(m.dropCount(s), 2);
  assert.equal(m.output(s), 'OFF');
});
console.log(`${checks} checks passed.`);
