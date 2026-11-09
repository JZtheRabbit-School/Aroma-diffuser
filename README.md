# Aroma Diffuser — Interactive Appliance Model

## Project status

First local version implemented using regular HTML/CSS/JavaScript, without a framework, installation, or external assets. Not published.

## Open and try it

Open index.html in a modern browser by double-clicking it. The linked CSS and JavaScript must remain alongside it in this folder. No server is required.

1. Press Mist: HIGH. Press Sleep: LOW. Press Sleep again: HIGH. Press Mist: OFF.
2. Press Light to cycle colors, then freeze and step through them. Try Sleep twice to check light restoration.
3. Run mist briefly, switch it OFF, then hold the refill button with a mouse or touch. Release to stop. Keyboard users can focus it and hold Space or Enter.
4. Press Timer and watch the one-minute countdown. Both light and mist stop at expiry. Pressing Timer again before expiry cancels it.
5. Expand How it works for instructions or Behind the states for the remembered settings and Reset simulation.

The initial state is a full tank with all functions OFF. Refilling takes five seconds from empty. These proposed defaults are implemented for this first version and can be adjusted after learner feedback. There is no fast-forward control in this version.

## Assignment

Create a simplified model of a real-world appliance. Demonstrate states, steps, transitions, and control, and use clear descriptions to translate design ideas into code with AI assistance.

## Planned interface

- A refined two-dimensional illustration using the manual diagram's tall, symmetrical tapered silhouette, centered top detail, straight base seam, and centered branding. The frosted material, darker base, and soft illumination retain the photographed lighting reference. Updated after learner feedback that the first body was too short.
- A dark webpage background so the eight light colors are visible.
- Four appliance buttons: Light, Sleep, Timer, and Mist.
- A water-level progress bar and numeric volume, with a maximum of 150 mL.
- A separate hold-to-refill button. Refilling is allowed only while actual mist output is OFF. Release stops refilling; reaching capacity also stops it.
- Timer uses one minute in this simulation instead of the real appliance's three hours.

## Open in CodePen

Create a new Pen using CodePen's default template. Replace the contents of its three editor files with the matching files in the `codepen/` folder:

| CodePen editor | Copy from |
| --- | --- |
| HTML (`index.html`) | [codepen/index.html](codepen/index.html) |
| CSS (`style.css`) | [codepen/style.css](codepen/style.css) |
| JavaScript (`script.js`) | [codepen/script.js](codepen/script.js) |

Use the default template with a full `index.html` document. The export links its own CSS and combined JavaScript. No libraries or preprocessors are required. Try Light, add a drop of Lavender, then press Mist to check the glow and scent motifs.

These files are a snapshot for sharing. When editing the main prototype, refresh the export before copying it to CodePen.

## Mist and Sleep rules

Turn actual mist output OFF before refilling, adding oil, or pouring out water. Pressing any of these controls on LOW or HIGH shows “Close the mist first.”

Store regular mist (ON/OFF) separately from Sleep (ON/OFF).

| Regular mist | Sleep | Actual output, with water available |
| --- | --- | --- |
| OFF | OFF | OFF |
| ON | OFF | HIGH |
| OFF | ON | LOW |
| ON | ON | LOW |

- Mist toggles regular mist and exits Sleep if active. When exiting Sleep using Mist, discard the saved pre-Sleep light setting and keep the current light appearance.
- Sleep toggles Sleep without changing regular mist. Leaving Sleep therefore restores HIGH or OFF according to the remembered regular mist setting.
- Entering Sleep saves the current light setting and turns the light off.
- Leaving Sleep using Sleep restores that saved setting unless Light was pressed during Sleep. If Light was pressed, preserve the new light setting.
- Light can be operated during Sleep without changing LOW mist output.

## Light rules

Color order: RED → ORANGE → YELLOW → WHITE → CYAN → GREEN → BLUE → PURPLE → RED.

1. From OFF, press Light to start slowly cycling through colors.
2. Press again to freeze the current color. This counts as fixed color 1.
3. Each subsequent press shows the next fixed color, wrapping around the list.
4. After eight fixed colors have been shown, the next press turns the light OFF.

Example: freeze WHITE → CYAN → GREEN → BLUE → PURPLE → RED → ORANGE → YELLOW → OFF.

If the light was turned off by Sleep, pressing Light starts cycling; it does not retrieve the saved fixed color. Save the fixed-color count along with a saved fixed-light setting.

## Timer

- Press Timer to start a 60-second countdown; press again to cancel.
- At expiry, turn light and mist OFF, exit Sleep, and clear the countdown and saved light setting.
- Label the simulated duration clearly as 1 MIN.
- Timer expiry preserves any water and scent remaining.

## Essential oils

- With water in the tank and mist off, tap lavender, rosemary, sweet orange, or peppermint to add one drop. Tap the same oil again to add another drop, or mix oils.
- The limit is five drops for the whole blend. At the limit the icons turn gray. Clicking again displays “That’s enough essential oil.” The limit stays in effect until the blend is fully spent or cleared.
- Each drop adds scent capacity for 50 mL of diffused water. Actual water consumption reduces scent capacity by the same amount. Refilling adds water while preserving the remaining scent capacity.
- The mist carries motifs in proportion to the drop counts. More drops produce more motifs, HIGH produces more than LOW, and the motifs thin as the scent runs out.
- When scent runs out, the drop counts reset and plain mist continues if water remains. When the tank runs dry, the blend clears even if scent capacity remains.
- Use **Pour out water** while mist is off to empty the tank and clear the blend. The light keeps its current setting.

## Water simulation

Water decreases continuously according to actual output, including after mode changes.

| Output | Planned consumption | Full 150 mL tank |
| --- | --- | --- |
| HIGH | 50 mL/minute | 3 minutes |
| LOW | 25 mL/minute | 6 minutes |
| OFF | 0 | No consumption |

The consumption values are simulation choices, not measured appliance specifications. The learner proposed 3/6 minutes as an alternative to 5/10; the assistant recommended 3/6. Confirm this default before implementation if necessary.

- At zero water, stop mist automatically. There is no low-water warning. Keep the current light unchanged.
- Refilling does not automatically restart mist; another button press is required.
- Proposed simplified empty-tank reset: regular mist OFF and Sleep OFF; discard saved light memory. This internal reset has not been verified on the physical appliance.
- Proposed refill rate: 30 mL/second (five seconds from empty to full). This is an assistant proposal awaiting confirmation.
- Proposed initial state: full tank, light OFF, regular mist OFF, Sleep OFF, timer OFF. Awaiting confirmation.

## Evidence and checks

The learner tested button sequences on the real diffuser. The two-variable mist model matches those reported observations; it is not a claim about the device's internal electronics.

S = Sleep, M = Mist; each sequence starts with regular mist and Sleep OFF.

| Sequence | Reported output after each press |
| --- | --- |
| S-M-S-M | LOW-HIGH-LOW-OFF |
| M-S-M | HIGH-LOW-OFF |
| M-S-S-S | HIGH-LOW-HIGH-LOW |
| M-S-S-M | HIGH-LOW-HIGH-OFF |
| S-S-M | LOW-OFF-HIGH |
| S-M-M | LOW-HIGH-OFF |
| M-S-M-S-S | HIGH-LOW-OFF-LOW-OFF |
| S-M-S-S-M | LOW-HIGH-LOW-HIGH-OFF |

Additional reported light tests, starting at fixed RED:

- M-S-S: RED → OFF → RED.
- S-M-S-S: OFF → OFF → OFF → OFF; pressing Light afterward starts cycling.
- Changing the light during Sleep preserves the new setting on leaving Sleep.

Run `node model.test.js` from this folder to check the state model. All 17 checks passed on 2026-11-03: the eight reported button sequences, color counting/wrapping, light restoration and override, mixed-mode consumption, full-tank duration, empty-water behavior, refill restrictions/capacity, and timer cancellation/expiry. JavaScript syntax checks also passed.

Browser preview was attempted but could not reach the local server; a local HTTP request was blocked by socket access permissions. Visual layout, responsiveness, rendered animation, and real pointer/keyboard refill interactions have not been browser-verified. The model tests do not establish those interface behaviors.

## Project files and workflow

- AGENT.md: learner's collaboration instructions.
- README.md: agreed behavior, planned usage, and explicit assumptions.
- JOURNAL.md: dated process and decision history.
- index.html: page structure and controls.
- styles.css: responsive illustration, lighting, mist animation, and layout.
- model.js: independent state transitions and simulated time/water rules.
- app.js: button events, hold-to-refill interaction, and screen updates.
- model.test.js: automated behavior checks using Node's built-in assertions.

Future webpage files belong here. Work in small inspectable steps. The local main branch tracks [JZtheRabbit-School/Aroma-diffuser](https://github.com/JZtheRabbit-School/Aroma-diffuser). Review the changes before committing and pushing them to this public repository.
