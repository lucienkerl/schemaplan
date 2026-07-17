# Canvas-UX-Verbesserungen, Autosave, Icons & Netze-BW-Export Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the drag/text-selection bug, add browser-local autosave, give every component type an icon, and extend the SVG/PNG export with a Netze-BW-style title block — plus a handful of UI/UX polish fixes found during review.

**Architecture:** All changes live in the existing two files (`index.html` for markup/CSS, `app.js` for logic) — no new files, no build step, no dependencies, consistent with the project's current zero-tooling static-site architecture. Chunks are ordered so each leaves the app in a working, manually-verifiable state; **Chunk 5 depends on Chunk 2** (it extends the `loadAutosave()`/JSON-load functions Chunk 2 creates) — do not reorder.

**Tech Stack:** Vanilla JS, inline SVG, plain CSS custom properties. No test framework exists in this repo (confirmed: no `package.json`, no test files) — verification throughout this plan is manual, via a local static server and browser interaction, matching how the rest of the project is verified.

**Spec:** `docs/superpowers/specs/2026-07-16-canvas-ux-design.md`

**A note on line numbers:** Every `Files:` header and step below cites line numbers against the *original, unmodified* `app.js`/`index.html` (the state before this plan's Chunk 1 runs). Since chunks are applied in order and earlier chunks insert code, these absolute numbers drift as later chunks execute — e.g. by the time Chunk 4 runs, `render()` no longer starts at line 171. **Do not trust the numbers alone.** Every insertion/edit point is also anchored by a quoted snippet of the actual surrounding code (a "before" block to find-and-replace, or an explicit "right after `X`, right before `Y`" description) — locate the edit by that quoted content, and treat the line number as a hint for roughly where to look, not a precise address.

## Setup (do this once, keep running for the whole plan)

- [ ] **Start a local static server from the repo root**

Run: `cd /Users/lucienkerl/Development/schemaplan && python3 -m http.server 8765`

Leave this running in the background for all manual verification steps below. Every "verify in browser" step in this plan assumes the app is reachable at `http://localhost:8765/`.

---

## Chunk 1: Bugfix — Textmarkierung beim Ziehen + Drag&Drop-Untersuchung

**Files:**
- Modify: `index.html:26` (`#app` rule), `index.html:52-68` (palette rules), `index.html:111-113` (`.field input,.field select` rule)
- Modify: `app.js:332-356` (`SVG.addEventListener('pointerdown', ...)`)

### Task 1: Prevent native text-selection during drag

- [ ] **Step 1: Make the app shell non-selectable, with explicit exceptions for editable fields**

In `index.html`, change the `#app` rule (line 26):

```css
  #app{display:grid;grid-template-columns:224px 1fr 288px;grid-template-rows:52px 1fr 26px;height:100vh;
    user-select:none;-webkit-user-select:none;-moz-user-select:none}
```

Then add explicit selectable exceptions right after the `.field input:focus,.field select:focus` rule (line 113):

```css
  .field input:focus,.field select:focus{outline:none;border-color:var(--accent)}
  .field input,.field select{user-select:text;-webkit-user-select:text}
```

And after the `.search input:focus` rule (line 56), add the same exception for the palette search box:

```css
  .search input:focus{outline:none;border-color:var(--accent)}
  .search input{user-select:text;-webkit-user-select:text}
```

- [ ] **Step 2: Guard palette drag against the WebKit `user-select` interaction**

`.pitem` (line 62-66) is `draggable=true` and is now a descendant of a `user-select:none` ancestor. Add `-webkit-user-drag:element` so WebKit browsers don't suppress the native drag gesture. Change the `.pitem` rule:

```css
  .pitem{display:flex;align-items:center;gap:9px;padding:8px 9px;margin-bottom:4px;border-radius:7px;
    background:var(--panel2);border:1px solid transparent;cursor:grab;font-size:12.5px;user-select:none;
    transition:border-color .12s,transform .06s;-webkit-user-drag:element}
```

(This only adds `-webkit-user-drag:element` at the end — everything else stays the same.)

- [ ] **Step 3: Verify no text selection on drag**

Open `http://localhost:8765/` in the browser (via `mcp__Claude_Browser__navigate`). Use `mcp__Claude_Browser__computer` with `left_click_drag` to drag an existing node (e.g. "Batteriespeicher") across the canvas by ~100px. Take a screenshot. Expected: no blue text-selection highlight anywhere on the page (toolbar labels, inspector text, legend). Repeat starting the drag from a palette item (e.g. "Wallbox") and dragging onto the canvas. Expected: still no text-selection highlight, regardless of whether a node is actually created (that's Task 2).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "fix: prevent native text selection during canvas/palette drag"
```

### Task 2: Add pointerdown preventDefault as a second guard

- [ ] **Step 1: Add `e.preventDefault()` to the SVG pointerdown handler**

In `app.js`, modify the start of the `SVG.addEventListener('pointerdown', ...)` handler (line 332-334):

```js
SVG.addEventListener('pointerdown',e=>{
  closeCtx();
  if(e.button===2)return; // context handled separately
  e.preventDefault();
  const portEl=e.target.closest('.port');
```

(Single line added: `e.preventDefault();` right after the `e.button===2` early return.)

- [ ] **Step 2: Verify existing interactions still work**

In the browser: drag a node (moves correctly), draw a wire by dragging from a port to another port (wire is created), pan by holding Space and dragging (view pans), click empty canvas (deselects). All four must still work exactly as before — this step only adds a safety net, it must not change existing behavior.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "fix: preventDefault on canvas pointerdown as a second text-selection guard"
```

### Task 3: Investigate and, if reproduced, fix the palette drag&drop bug

A prior live review reported that dragging a palette item onto the canvas creates no node (only click works), but the code already calls `preventDefault()` in both `dragover` (`app.js:415`) and `drop` (`app.js:417`), so the root cause is not the obvious one. Reproduce with a **real** mouse drag before writing any fix — do not fix a bug you haven't confirmed.

- [ ] **Step 1: Reproduce with a real drag gesture**

In the browser (after Task 1/2 are committed, so the text-selection fix doesn't mask the result): use `mcp__Claude_Browser__computer` with `left_click_drag` from a palette item's coordinates to a point over the canvas (`#svg`). Check the status bar node count (`#stat-nodes`) before and after. Expected-if-bug-present: count unchanged. Expected-if-already-fixed: count increases by one and a toast appears.

- [ ] **Step 2a: If NOT reproduced — stop here, no code change**

If the drag correctly creates a node, the bug does not exist (or was already fixed by Task 1/2's `user-select`/`preventDefault` changes). Do not add speculative code. Commit a note and move on:

```bash
git commit --allow-empty -m "chore: palette drag&drop verified working, no fix needed (see spec section 5a)"
```

- [ ] **Step 2b: If reproduced — apply the drop-target fix**

Check `document.elementFromPoint` resolution at drop time isn't hitting an overlay element instead of `#stage`/`#svg`. In `app.js`, the drop handler (line 416-419) is:

```js
stage.addEventListener('drop',e=>{
  e.preventDefault();const key=e.dataTransfer.getData('key');if(!key||!LIB[key])return;
  const p=toWorld(e.clientX,e.clientY);addNode(key,p.x-LIB[key].w/2,p.y-LIB[key].h/2);
});
```

Add a `text/plain` fallback alongside the custom `key` MIME type (some browsers restrict custom-type `dataTransfer` reads across elements unless a standard type is also present). In `buildPalette()`, the `dragstart` listener (line 112) becomes:

```js
      d.addEventListener('dragstart',e=>{e.dataTransfer.setData('key',key);e.dataTransfer.setData('text/plain',key);});
```

And the drop handler reads `key` with a fallback:

```js
stage.addEventListener('drop',e=>{
  e.preventDefault();
  const key=e.dataTransfer.getData('key')||e.dataTransfer.getData('text/plain');
  if(!key||!LIB[key])return;
  const p=toWorld(e.clientX,e.clientY);addNode(key,p.x-LIB[key].w/2,p.y-LIB[key].h/2);
});
```

- [ ] **Step 3 (only if 2b applied): Re-verify with a real drag gesture**

Repeat Step 1's drag test. Expected: node count now increases by one and a toast appears.

- [ ] **Step 4 (only if 2b applied): Commit**

```bash
git add app.js
git commit -m "fix: add text/plain dataTransfer fallback for palette drag&drop"
```

---

## Chunk 2: Autosave & Wiederherstellung

**Files:**
- Insert: `app.js` after line 90 (new `scheduleAutosave()`/`loadAutosave()` functions)
- Modify: `app.js:171-217` (`render()`), `app.js:492-497` (init block)

### Task 1: Add the autosave scheduler and loader

- [ ] **Step 1: Add the autosave functions**

In `app.js`, add a new section right after the `/* ---------------- history ---------------- */` block (after line 90, before `/* ---------------- toast ---------------- */`):

```js
/* ---------------- autosave ---------------- */
const AUTOSAVE_KEY='schemaplan.autosave.v1';
let autosaveT;
function scheduleAutosave(){
  clearTimeout(autosaveT);
  autosaveT=setTimeout(()=>{
    try{localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(state));}catch(_){}
  },500);
}
function loadAutosave(){
  let raw;
  try{raw=localStorage.getItem(AUTOSAVE_KEY);}catch(_){return false;}
  if(!raw)return false;
  try{
    const o=JSON.parse(raw);
    if(!o||!Array.isArray(o.nodes)||!Array.isArray(o.wires)||typeof o.seq!=='number')return false;
    state=o;
    return true;
  }catch(_){return false;}
}
```

- [ ] **Step 2: Hook autosave into `render()`, the single choke point for state changes**

`render()` (line 171) is called after every state-mutating action in the app (add/remove node or wire, drag, wiring, undo/redo, field edits, clear, load). Add one line at the top of `render()`:

```js
function render(){
  scheduleAutosave();
  // wires first (under nodes)
  renderWires();
```

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: add debounced localStorage autosave hooked into render()"
```

### Task 2: Restore autosave on load instead of the seed example

- [ ] **Step 1: Make init conditional on autosave presence**

In `app.js`, change the init block (lines 492-497) from:

```js
/* ---------------- init ---------------- */
buildPalette();
applyView();
inspector();
updateUndo();
seed();
```

to:

```js
/* ---------------- init ---------------- */
buildPalette();
applyView();
if(loadAutosave()){render();}else{seed();}
inspector();
updateUndo();
```

- [ ] **Step 2: Verify first-visit behavior (no autosave yet)**

In the browser: open dev tools console (via `mcp__Claude_Browser__javascript_tool`) and run `localStorage.removeItem('schemaplan.autosave.v1')`, then reload the page. Expected: the built-in 10-node example plan appears (unchanged from current behavior).

- [ ] **Step 3: Verify autosave + restore**

In the browser: add a new node from the palette (e.g. click "Wallbox"), wait ~1 second for the debounce, then reload the page (`mcp__Claude_Browser__navigate` to the same URL). Expected: the plan — including the new Wallbox node — is restored exactly, the seed example does NOT reappear.

- [ ] **Step 4: Verify corrupt-data fallback**

In the browser console, run `localStorage.setItem('schemaplan.autosave.v1', 'not valid json')`, then reload. Expected: no error dialog/crash, the app falls back to the seed example plan.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: restore last autosaved plan on load, seed example only on first visit"
```

---

## Chunk 3: Platzhalter-Werte nur als `placeholder`, nicht als echter Feldwert

**Files:**
- Modify: `app.js:128-136` (`addNode()`), `app.js:480-490` (`seed()`), `app.js:256-289` (`inspector()`)
- Modify: `index.html:111-113` (`.field input,.field select` rule)

### Task 1: Stop pre-filling `__`-prefixed placeholder values

- [ ] **Step 1: Add a shared `fillFields()` helper**

In `app.js`, add this function right before `addNode()` (before line 128):

```js
function fillFields(c){
  const fields={};
  c.fields.forEach(f=>{fields[f[0]]=f[2].startsWith('__')?'':f[2];});
  return fields;
}
```

- [ ] **Step 2: Use it in `addNode()`**

Change line 132 in `addNode()` from:

```js
  const fields={};c.fields.forEach(f=>fields[f[0]]=f[2]);
```

to:

```js
  const fields=fillFields(c);
```

- [ ] **Step 3: Use it in `seed()`**

`seed()` (line 480-490) has the identical prefill line inside its local `add` helper:

```js
  const add=(k,x,y)=>{const c=LIB[k];const fields={};c.fields.forEach(f=>fields[f[0]]=f[2]);
    const n={id:'n'+(state.seq++),key:k,x,y,fields};state.nodes.push(n);ids[k]=n.id;};
```

Change it to:

```js
  const add=(k,x,y)=>{const c=LIB[k];const fields=fillFields(c);
    const n={id:'n'+(state.seq++),key:k,x,y,fields};state.nodes.push(n);ids[k]=n.id;};
```

- [ ] **Step 4: Add HTML `placeholder` attributes in the inspector**

In `app.js`, `inspector()` (line 278-280) currently is:

```js
  for(const f of c.fields){
    html+=`<div class="field"><label>${f[1]}</label><input data-k="${f[0]}" value="${(n.fields[f[0]]||'').replace(/"/g,'&quot;')}"></div>`;
  }
```

Change to:

```js
  for(const f of c.fields){
    const ph=f[2].startsWith('__')?f[2].replace(/"/g,'&quot;'):'';
    html+=`<div class="field"><label>${f[1]}</label><input data-k="${f[0]}" placeholder="${ph}" value="${(n.fields[f[0]]||'').replace(/"/g,'&quot;')}"></div>`;
  }
```

- [ ] **Step 5: Style the placeholder for readability on the dark theme**

In `index.html`, add a placeholder color rule right after the `.field input,.field select` rule (the one from Chunk 1 Step 1, now at line ~113-114):

```css
  .field input::placeholder{color:var(--faint);opacity:1}
```

- [ ] **Step 6: Verify real defaults are unaffected, `__`-placeholders are not**

In the browser: add a "HAK" node (has a real default `Sicherung = "NH 63 A"`). Click it, open the inspector. Expected: the "Sicherung" field shows `NH 63 A` as a real (non-greyed) value, exactly as before.

Add a "PV-Wechselrichter" node (has `AC-Leistung` default `__ kVA`). Click it, open the inspector. Expected: the "AC-Leistung" field is empty with greyed placeholder text `__ kVA` — not a real value. Confirm on the canvas itself that no `__ kVA` text renders under the node title (the existing `subs.filter(v=>v&&v.trim())` logic in `render()` already excludes empty fields, so nothing further needs to change there).

- [ ] **Step 7: Commit**

```bash
git add app.js index.html
git commit -m "fix: keep only real field defaults, render __-prefixed placeholders as HTML placeholder text"
```

---

## Chunk 4: Icons pro Bauteiltyp

**Files:**
- Modify: `app.js:9-70` (add `ICONS` after `LIB`), `app.js:98-117` (`buildPalette()`), `app.js:171-217` (`render()`)
- Modify: `index.html:62-67` (`.pitem`/`.dot` rules)

### Task 1: Define the icon set

- [ ] **Step 1: Add the `ICONS` object**

In `app.js`, add this right after the `LIB` object and its closing `};` (after line 69, before `const KINDCOL=...` on line 70). Every key matches a `LIB` key exactly (18 entries). Markup is bare SVG shapes with no `stroke`/`fill` attributes — those are applied by whichever consumer renders them (palette or canvas node), so the same strings work in both places:

```js
const ICONS={
  netz:'<path d="M12 2l7 6-2 3H7L5 8z"/><path d="M12 11v11M8 22h8M9 16h6"/>',
  hak:'<rect x="8" y="4" width="8" height="13" rx="1.5"/><path d="M12 17v3M9 22h6"/>',
  sls:'<path d="M12 3v7"/><path d="M7.5 8a6 6 0 1 0 9 0"/>',
  zaehler:'<circle cx="12" cy="13" r="8"/><path d="M12 13l3.5-3.5M8 6h8"/>',
  gridmeter:'<circle cx="12" cy="13" r="8"/><path d="M9 13h6M12 10l-3 3 3 3"/>',
  uv:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 16h16M10 4v16"/>',
  pvwr:'<rect x="4" y="7" width="16" height="11" rx="2"/><path d="M7 13c1-2.5 2-2.5 3 0s2 2.5 3 0 2-2.5 3 0"/>',
  pvgen:'<rect x="4" y="6" width="16" height="12" rx="1"/><path d="M4 10.5h16M4 15h16M10.5 6v12M15.5 6v12"/>',
  mppt:'<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M12 8v6"/><path d="M9 11l3 3 3-3"/>',
  multi:'<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M9 10l-2.5 2 2.5 2"/><path d="M15 10l2.5 2-2.5 2"/>',
  battwr:'<rect x="4" y="8" width="13" height="9" rx="1.5"/><path d="M17 11v3"/><path d="M8 8v-2M12 8v-2"/>',
  battery:'<rect x="3" y="8" width="16" height="9" rx="1.5"/><path d="M19 11v3"/><path d="M7 8v9M11 8v9M15 8v9"/>',
  dcbus:'<path d="M3 12h18"/><path d="M7 8v8M12 8v8M17 8v8"/>',
  cerbo:'<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  wallbox:'<rect x="3" y="9" width="13" height="8" rx="2"/><circle cx="7" cy="19" r="1.6"/><circle cx="15" cy="19" r="1.6"/><path d="M16 12h3l2 3v2h-2"/>',
  load:'<circle cx="12" cy="12" r="8"/><path d="M9 10v4M15 10v4"/><path d="M9 15a3 3 0 0 0 6 0"/>',
  backup:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M13 7l-4.5 6.5H12L11 20l5.5-7.5H13z"/>',
  steuerbox:'<circle cx="12" cy="12" r="8"/><path d="M12 12l3.5-2.5"/><circle cx="12" cy="12" r="1.6"/>',
};
```

- [ ] **Step 2: Guard against a missing icon at the source (fail loud, not silent)**

Right after the `ICONS` object, add a one-time consistency check so a future new `LIB` entry without a matching icon is caught immediately during development rather than silently rendering blank:

```js
Object.keys(LIB).forEach(k=>{if(!ICONS[k])console.warn('Kein Icon für Bauteiltyp:',k);});
```

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: add ICONS lookup with one icon per LIB component type"
```

### Task 2: Show icons in the palette

- [ ] **Step 1: Replace the colored dot with an icon badge**

In `app.js`, `buildPalette()` (line 108-114) currently builds each item as:

```js
    for(const [key,c] of items){
      const d=document.createElement('div');d.className='pitem';d.draggable=true;d.dataset.key=key;
      d.innerHTML=`<span class="dot" style="background:${c.color}"></span>${c.name}`;
      d.addEventListener('click',()=>addNode(key));
      d.addEventListener('dragstart',e=>e.dataTransfer.setData('key',key));
      list.appendChild(d);
    }
```

Change the `innerHTML` line to use `ICONS[key]` inside a colored badge, keep everything else the same (including the `dragstart` fix from Chunk 1 Task 3 if that was applied):

```js
      d.innerHTML=`<span class="picon" style="background:${c.color}22;color:${c.color}"><svg viewBox="0 0 24 24">${ICONS[key]}</svg></span>${c.name}`;
```

- [ ] **Step 2: Add `.picon` CSS**

In `index.html`, add this right after the `.dot` rule (line 67), leaving `.dot` itself untouched since it's still used by the inspector header and legend:

```css
  .dot{width:8px;height:8px;border-radius:50%;flex:none;box-shadow:0 0 0 3px rgba(255,255,255,.04)}
  .picon{width:22px;height:22px;border-radius:6px;flex:none;display:grid;place-items:center}
  .picon svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.8;
    stroke-linecap:round;stroke-linejoin:round}
```

- [ ] **Step 3: Verify palette icons render and are distinguishable**

In the browser, load the page and look at the palette. Expected: every row shows a small colored icon badge instead of a plain dot, and rows within the same color group (e.g. the four "Batterie / Victron" items, all red) are visually distinguishable from each other by icon shape, not just color.

- [ ] **Step 4: Commit**

```bash
git add app.js index.html
git commit -m "feat: show per-component icons in the palette"
```

### Task 3: Show icons on canvas nodes

- [ ] **Step 1: Add an icon badge to each rendered node**

In `app.js`, inside `render()`, find this exact sequence (the node body rect, the color accent bar, then the label text creation):

```js
    g.appendChild(mk('rect',{width:c.w,height:3,rx:1.5,fill:c.color,opacity:.9}));

    const t1=mk('text',{class:'node-label',x:c.w/2,y:19,'text-anchor':'middle'});
```

Insert the icon badge between the accent-bar line and the label-text line, so it reads:

```js
    g.appendChild(mk('rect',{width:c.w,height:3,rx:1.5,fill:c.color,opacity:.9}));

    const ic=mk('g',{transform:'translate(6,6) scale(0.5)',stroke:c.color,fill:'none','stroke-width':1.8,
      'stroke-linecap':'round','stroke-linejoin':'round'});
    ic.style.pointerEvents='none';
    ic.innerHTML=ICONS[n.key];
    g.appendChild(ic);

    const t1=mk('text',{class:'node-label',x:c.w/2,y:19,'text-anchor':'middle'});
```

- [ ] **Step 2: Verify node icons render without crowding the title**

In the browser, load the page (10-node seed example). Expected: every node shows a small icon badge in its top-left corner. Zoom in (via the `+` zoom button or scroll) on the smallest nodes — `DC-Bus` (100×42), `Cerbo GX` (114×50) — and confirm the icon badge doesn't overlap the centered title text. If it does, reduce the `scale(0.5)` to `scale(0.42)` and re-check.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: show per-component icon badge on canvas nodes"
```

---

## Chunk 5: Netze-BW-konformer Export (Projektdaten + Schriftfeld)

**Depends on Chunk 2** (extends the `loadAutosave()` function Chunk 2 creates).

**Files:**
- Modify: `app.js:73` (`state` init), `app.js:83-87` (`snapshot()`/`restore()`), `app.js` (`loadAutosave()`, added by Chunk 2), `app.js:440-446` (`el('load')` handler, untouched by Chunk 2 — first modified here), `app.js:449-466` (`serializeSVG()`)
- Insert: `app.js` (new `projectModalEl`/`syncProjectModal()`, `openProjectModal()`, `legendSVG()`, `schriftfeldSVG()`)
- Modify: `index.html:166-172` (header buttons), insert new modal CSS block

### Task 1: Add `state.project` with a shared default and backward-compat fallback

- [ ] **Step 1: Add a `defaultProject()` helper and wire it into `state`**

In `app.js`, change the state section (line 73) from:

```js
let state={nodes:[],wires:[],seq:1};
```

to:

```js
function defaultProject(){return {betreiberName:'',betreiberAdresse:'',standortAdresse:'',
  erstellerFirma:'',erstellerOrt:'',datum:''};}
let state={nodes:[],wires:[],seq:1,project:defaultProject()};
```

- [ ] **Step 2: Include `project` in undo/redo snapshots**

In `app.js`, change `snapshot()`/`restore()` (lines 83/85) from:

```js
function snapshot(){return JSON.stringify({nodes:state.nodes,wires:state.wires,seq:state.seq});}
function pushHistory(){history.push(snapshot());if(history.length>100)history.shift();future=[];updateUndo();}
function restore(s){const o=JSON.parse(s);state.nodes=o.nodes;state.wires=o.wires;state.seq=o.seq;sel=null;render();inspector();}
```

to:

```js
function snapshot(){return JSON.stringify({nodes:state.nodes,wires:state.wires,seq:state.seq,project:state.project});}
function pushHistory(){history.push(snapshot());if(history.length>100)history.shift();future=[];updateUndo();}
let projectModalEl=null;
function syncProjectModal(){
  if(!projectModalEl)return;
  projectModalEl.querySelectorAll('input').forEach(inp=>{
    inp.value=state.project[inp.dataset.k]||'';
    inp._touched=false;
  });
}
function restore(s){const o=JSON.parse(s);state.nodes=o.nodes;state.wires=o.wires;state.seq=o.seq;
  state.project=o.project||defaultProject();sel=null;render();inspector();syncProjectModal();}
```

`projectModalEl` tracks the currently-open Projekt panel (`null` when closed). `syncProjectModal()` re-reads every field from `state.project` and resets each input's `_touched` flag whenever undo/redo runs, mirroring how `inspector()` already handles this for node fields (there, rebuilding `body.innerHTML` on every call has the same effect implicitly). Resetting `_touched` matters here specifically: without it, a user who presses Strg+Z and then keeps typing in the same still-open field would have their next keystroke skip `pushHistory()` (since `_touched` would still be `true` from before the undo) and silently overwrite the just-restored value — this reset is what prevents that. Task 2 below creates and destroys `projectModalEl`; this stays a no-op (`if(!projectModalEl)return;`) until the panel is opened for the first time.

- [ ] **Step 3: Backfill `project` when loading old autosave data**

In `app.js`, `loadAutosave()` (added in Chunk 2) parses `o` and assigns `state=o`. Add a backfill line right after that assignment:

```js
function loadAutosave(){
  let raw;
  try{raw=localStorage.getItem(AUTOSAVE_KEY);}catch(_){return false;}
  if(!raw)return false;
  try{
    const o=JSON.parse(raw);
    if(!o||!Array.isArray(o.nodes)||!Array.isArray(o.wires)||typeof o.seq!=='number')return false;
    state=o;
    state.project=state.project||defaultProject();
    return true;
  }catch(_){return false;}
}
```

- [ ] **Step 4: Backfill `project` when loading a JSON file**

In `app.js`, the `el('load')` handler's `rd.onload` callback (lines 443-444) is:

```js
    rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!o.nodes)throw 0;pushHistory();
      state=o;sel=null;render();inspector();fit();showToast('Geladen');}catch(_){alert('Ungültige Datei.');}};
```

Change to:

```js
    rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!o.nodes)throw 0;pushHistory();
      state=o;state.project=state.project||defaultProject();
      sel=null;render();inspector();fit();showToast('Geladen');}catch(_){alert('Ungültige Datei.');}};
```

- [ ] **Step 5: Verify backward compatibility**

In the browser console (`mcp__Claude_Browser__javascript_tool`), simulate an old-format save by running:

```js
localStorage.setItem('schemaplan.autosave.v1', JSON.stringify({nodes:[],wires:[],seq:1}))
```

(no `project` key). Reload the page. Expected: no console error, app loads normally with an empty plan. This step's project-modal check happens in Task 2 below once the modal exists.

- [ ] **Step 6: Commit**

```bash
git add app.js
git commit -m "feat: add state.project with backward-compatible defaults for old saves"
```

### Task 2: Add the "Projekt" panel

- [ ] **Step 1: Add the header button**

In `index.html`, insert a new button right after the `<div class="spacer"></div>` line (line 166) and before the `el('save')` button:

```html
    <div class="spacer"></div>
    <button class="tool ghost" id="project"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h4"/></svg>Projekt</button>
    <div class="sep"></div>
    <button class="tool ghost" id="save"><svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>Speichern</button>
```

- [ ] **Step 2: Add modal CSS**

In `index.html`, add this new rule block right after the `.ctx hr` rule (line 100), before the `/* ---- inspector ---- */` comment:

```css
  /* modal */
  .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:60;
    display:flex;align-items:center;justify-content:center}
  .modal{background:var(--panel2);border:1px solid var(--line2);border-radius:10px;box-shadow:var(--shadow);
    padding:18px;width:360px;max-width:90vw}
  .modal h2{font-size:13px;font-weight:600;margin:0 0 14px;color:var(--ink)}
  .modal .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
  .modal .actions button{padding:8px 14px;border-radius:7px;border:1px solid var(--line2);
    background:transparent;color:var(--ink);cursor:pointer;font-size:12.5px}
```

(No `.primary` button variant — per Step 3 below, the panel has no "Speichern" action to highlight; fields save live, and the only action button is "Schließen".)

- [ ] **Step 3: Add the modal open logic with live per-field updates**

Per the spec (section 4, "UI"), project fields behave exactly like the inspector's fields: each keystroke updates `state.project` immediately, with `pushHistory()` fired once per field on its first edit (coalescing every further keystroke in that field into the same undo step), mirroring the existing `inp._touched` pattern in `inspector()` (`app.js:283-287`). There is no separate "Speichern" action — closing the panel just dismisses it.

In `app.js`, add a new section right before `/* ---------------- export ---------------- */` (before line 448):

```js
/* ---------------- project modal ---------------- */
function openProjectModal(){
  const bd=document.createElement('div');bd.className='modal-backdrop';
  const p=state.project;
  const esc=(s)=>(s||'').replace(/"/g,'&quot;');
  const fields=[
    ['betreiberName','Betreiber – Name'],
    ['betreiberAdresse','Betreiber – Adresse'],
    ['standortAdresse','Anlagenstandort – Adresse'],
    ['erstellerFirma','Anlagenerrichter – Firma'],
    ['erstellerOrt','Anlagenerrichter – Ort'],
    ['datum','Datum'],
  ];
  bd.innerHTML=`<div class="modal">
    <h2>Projektdaten</h2>
    ${fields.map(([k,label])=>
      `<div class="field"><label>${label}</label><input data-k="${k}" value="${esc(p[k])}"></div>`
    ).join('')}
    <div class="actions"><button id="pf-close">Schließen</button></div>
  </div>`;
  document.body.appendChild(bd);
  projectModalEl=bd;
  const closeModal=()=>{bd.remove();projectModalEl=null;};
  bd.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{
    if(!inp._touched){pushHistory();inp._touched=true;}
    state.project[inp.dataset.k]=inp.value;render();
  }));
  const dEl=bd.querySelector('input[data-k="datum"]');
  if(!dEl.value){
    pushHistory();
    dEl.value=new Date().toISOString().slice(0,10);
    state.project.datum=dEl.value;
    render();
  }
  bd.addEventListener('pointerdown',e=>{if(e.target===bd)closeModal();});
  bd.querySelector('#pf-close').onclick=closeModal;
}
el('project').onclick=openProjectModal;
```

The date auto-fill writes straight to `state.project.datum` (via its own `pushHistory()`) rather than only pre-filling the input's displayed value, so a user who opens the panel and closes it again without touching any field still gets today's date captured in the export — not a blank Schriftfeld date. `projectModalEl` (declared in Task 1 Step 2 above, alongside `syncProjectModal()`) is set here on open and cleared on close, so undo/redo while the panel is open correctly refreshes its visible fields instead of leaving them stale.

- [ ] **Step 4: Verify live updates, persistence, and undo**

In the browser: click "Projekt". Expected: "Datum" is already pre-filled with today's date. Type `Max Mustermann` into "Betreiber – Name" character by character — do not click anything else. Reload the page (`mcp__Claude_Browser__navigate`) without closing the panel first. Expected: after reload, click "Projekt" again — `Max Mustermann` is still there (autosave picked up the live edits).

Reopen the panel if closed, type into "Betreiber – Adresse" (keep the panel open, don't click away), then press `Strg+Z`. Expected: two things happen together — (1) toast "Rückgängig", and (2) the "Betreiber – Adresse" **input field itself visually reverts** to its pre-edit value while the panel is still open (this is the `syncProjectModal()` behavior from Task 1 Step 2 — without it the field would keep showing the just-typed text even though the underlying state reverted). Type one more character into that same field afterward, then press `Strg+Z` again. Expected: only that single extra character reverts (the field goes back to its state right before you typed it, not further) — confirming `_touched` was reset by the previous undo and this edit started its own fresh `pushHistory()` step rather than silently skipping it.

- [ ] **Step 5: Commit**

```bash
git add app.js index.html
git commit -m "feat: add Projektdaten panel for Netze-BW submission metadata"
```

### Task 3: Extend the SVG/PNG export with title, legend, and Schriftfeld

- [ ] **Step 1: Add legend and Schriftfeld renderers**

In `app.js`, add these two functions right before `serializeSVG()` (before line 449):

```js
function legendSVG(){
  const rows=[['AC-Leitung',KINDCOL.ac],['DC-Leitung',KINDCOL.dc],['Signal / Steuerung',KINDCOL.sig]];
  let out='<g font-family="ui-monospace,monospace" font-size="11" fill="#8896a6">';
  rows.forEach((r,i)=>{
    const ry=i*20;
    out+=`<line x1="0" y1="${ry}" x2="22" y2="${ry}" stroke="${r[1]}" stroke-width="3" stroke-linecap="round"/>`;
    out+=`<text x="30" y="${ry+4}">${r[0]}</text>`;
  });
  return out+'</g>';
}
function schriftfeldSVG(w,h){
  const p=state.project;
  const esc=(s)=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const row=(label,val,ry)=>
    `<text x="10" y="${ry}" font-family="ui-monospace,monospace" font-size="9.5" fill="#5b6674">${label}</text>`+
    `<text x="10" y="${ry+15}" font-family="Inter,sans-serif" font-size="12" fill="#e8eef5">${esc(val)||'—'}</text>`;
  const third=h/3;
  let out='<g>';
  out+=`<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#2a3441"/>`;
  out+=`<line x1="0" y1="${third}" x2="${w}" y2="${third}" stroke="#2a3441"/>`;
  out+=`<line x1="0" y1="${2*third}" x2="${w}" y2="${2*third}" stroke="#2a3441"/>`;
  out+=`<line x1="${w*0.6}" y1="${2*third}" x2="${w*0.6}" y2="${h}" stroke="#2a3441"/>`;
  out+=`<line x1="${w*0.8}" y1="${2*third}" x2="${w*0.8}" y2="${h}" stroke="#2a3441"/>`;
  out+=row('Betreiber',[p.betreiberName,p.betreiberAdresse].filter(Boolean).join(' · '),18);
  out+=row('Anlagenstandort',p.standortAdresse,third+18);
  out+=row('Anlagenerrichter',[p.erstellerFirma,p.erstellerOrt].filter(Boolean).join(', '),2*third+18);
  out+=`<text x="${w*0.6+10}" y="${2*third+18}" font-family="ui-monospace,monospace" font-size="9.5" fill="#5b6674">Datum</text>`;
  out+=`<text x="${w*0.6+10}" y="${2*third+33}" font-family="Inter,sans-serif" font-size="12" fill="#e8eef5">${esc(p.datum)||'—'}</text>`;
  out+=`<text x="${w*0.8+10}" y="${2*third+18}" font-family="ui-monospace,monospace" font-size="9.5" fill="#5b6674">Unterschrift Anlagenerrichter</text>`;
  out+=`<line x1="${w*0.8+10}" y1="${h-14}" x2="${w-10}" y2="${h-14}" stroke="#5b6674"/>`;
  return out+'</g>';
}
```

- [ ] **Step 2: Extend `serializeSVG()` to include title, legend, and Schriftfeld**

Change `serializeSVG()` (lines 449-465) from:

```js
function serializeSVG(){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const n of state.nodes){const c=LIB[n.key];x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+c.w);y1=Math.max(y1,n.y+c.h);}
  if(!isFinite(x0)){x0=0;y0=0;x1=400;y1=300;}
  const pad=48;x0-=pad;y0-=pad;x1+=pad;y1+=pad;const w=x1-x0,h=y1-y0;
  const clone=VP.cloneNode(true);
  const tw=clone.querySelector('#tempwire');if(tw)clone.removeChild(tw);
  // strip invisible hit paths/circles from clone
  clone.querySelectorAll('.wirehit,.port').forEach(e=>e.remove());
  clone.setAttribute('transform',`translate(${-x0},${-y0})`);
  const css=document.querySelector('style').textContent;
  const svg=`<svg xmlns="${SVGNS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    +`<style>${css}</style>`
    +`<rect width="${w}" height="${h}" fill="#0d1017"/>`
    +clone.outerHTML+`</svg>`;
  return {svg,w,h};
}
```

to:

```js
function serializeSVG(){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const n of state.nodes){const c=LIB[n.key];x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+c.w);y1=Math.max(y1,n.y+c.h);}
  if(!isFinite(x0)){x0=0;y0=0;x1=400;y1=300;}
  const pad=48;x0-=pad;y0-=pad;x1+=pad;y1+=pad;const dw=x1-x0,dh=y1-y0;
  const TITLE_H=40,LEGEND_H=76,SCHRIFT_H=100;
  const w=dw,h=TITLE_H+dh+LEGEND_H+SCHRIFT_H;
  const clone=VP.cloneNode(true);
  const tw=clone.querySelector('#tempwire');if(tw)clone.removeChild(tw);
  // strip invisible hit paths/circles from clone
  clone.querySelectorAll('.wirehit,.port').forEach(e=>e.remove());
  clone.setAttribute('transform',`translate(${-x0},${-y0+TITLE_H})`);
  const css=document.querySelector('style').textContent;
  const title=`<text x="${w/2}" y="26" text-anchor="middle" font-family="Inter,sans-serif" font-size="15" font-weight="600" fill="#e8eef5">Übersichtsschaltplan nach VDE-AR-N 4105</text>`;
  const legend=`<g transform="translate(16,${TITLE_H+dh+16})">${legendSVG()}</g>`;
  const schrift=`<g transform="translate(0,${TITLE_H+dh+LEGEND_H})">${schriftfeldSVG(w,SCHRIFT_H)}</g>`;
  const svg=`<svg xmlns="${SVGNS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
    +`<style>${css}</style>`
    +`<rect width="${w}" height="${h}" fill="#0d1017"/>`
    +title+clone.outerHTML+legend+schrift+`</svg>`;
  return {svg,w,h};
}
```

- [ ] **Step 3: Verify SVG export**

In the browser: fill in the Projekt panel (Task 2) with sample data — use at least one value with a descender letter (e.g. Betreiber-Name `Jürgen Gruber`) to check the Schriftfeld row height has enough headroom — click "SVG". Read the downloaded `schaltplan.svg` file (e.g. via `Read` tool or `cat`). Expected: the file contains the text `Übersichtsschaltplan nach VDE-AR-N 4105`, the three legend rows (`AC-Leitung`, `DC-Leitung`, `Signal / Steuerung`), and the Schriftfeld values you entered (`Betreiber`, `Anlagenstandort`, `Anlagenerrichter`, `Datum`), with no visible clipping of descenders at the bottom of the Schriftfeld rows.

- [ ] **Step 4: Verify PNG export**

Click "PNG". Expected: `schaltplan.png` downloads without a JS error (check via `mcp__Claude_Browser__read_console_messages`), and its dimensions are taller than before this chunk (title+legend+Schriftfeld add ~216px). Open the PNG (e.g. via the `Read` tool, which can display images) and visually confirm the title and Schriftfeld are visible and legible.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: add VDE-AR-N-4105 title, legend, and Schriftfeld to SVG/PNG export"
```

---

## Chunk 6: Polish-Fixes aus dem UI/UX-Review

**Files:**
- Modify: `app.js:128-136` (`addNode()`), `app.js:171-217` (`render()`), `app.js:330,402-411` (interaction state + keydown), `app.js:432-436` (`el('clear')`)
- Modify: `index.html:139` (`.port-label`)

### Task 1: Verify zoom-button centering (fix only if actually broken)

- [ ] **Step 1: Reproduce or rule out**

`zoomBy()` (`app.js:396-398`) already computes its origin from `r.width/2`/`r.height/2` (viewport center), which should already center correctly. In the browser: load the seed example, click the `+` zoom button 6 times in a row rapidly. Take a screenshot after each click via `mcp__Claude_Browser__computer` `zoom`. Expected: the diagram stays roughly centered and visible the whole time.

- [ ] **Step 2a: If NOT reproduced — no code change**

```bash
git commit --allow-empty -m "chore: zoom-button centering verified correct, no fix needed (see spec section 6)"
```

- [ ] **Step 2b: If reproduced — fix and re-verify**

If the diagram visibly drifts off-screen, the likely cause is `view.k`'s min/max clamp (`Math.min(3,Math.max(.25,...))`) interacting with the recomputed `view.x`/`view.y` when already at a clamp boundary. Add a guard so `view.x`/`view.y` are only recomputed when `k` actually changed:

```js
function zoomBy(f){const r=SVG.getBoundingClientRect();const mx=r.width/2,my=r.height/2;
  const wx=(mx-view.x)/view.k,wy=(my-view.y)/view.k;
  const k=Math.min(3,Math.max(.25,view.k*f));
  if(k===view.k)return;
  view.x=mx-wx*k;view.y=my-wy*k;view.k=k;applyView();}
```

Re-run Step 1's test. Expected: no more drift. Commit:

```bash
git add app.js
git commit -m "fix: skip zoom recentering when already at zoom clamp"
```

### Task 2: Cascade newly-added nodes instead of stacking them

- [ ] **Step 1: Add a cascading offset for click-added nodes**

In `app.js`, declare a new state variable near the other interaction state (line 330, `let drag=null,wiring=null,panning=null,space=false,moved=false;`):

```js
let drag=null,wiring=null,panning=null,space=false,moved=false,addOffset=0;
```

Change `addNode()` (lines 128-131) from:

```js
function addNode(key,wx,wy){
  pushHistory();
  const c=LIB[key];
  if(wx==null){const r=SVG.getBoundingClientRect();const p=toWorld(r.left+r.width/2,r.top+r.height/2);wx=p.x-c.w/2;wy=p.y-c.h/2;}
```

to:

```js
function addNode(key,wx,wy){
  pushHistory();
  const c=LIB[key];
  if(wx==null){
    const r=SVG.getBoundingClientRect();const p=toWorld(r.left+r.width/2,r.top+r.height/2);
    wx=p.x-c.w/2+addOffset;wy=p.y-c.h/2+addOffset;
    addOffset=(addOffset+18)%108;
  }
```

- [ ] **Step 2: Verify**

In the browser: click "Wallbox" in the palette three times in a row (three separate clicks, not drag). Expected: three Wallbox nodes appear cascading diagonally, not stacked exactly on top of each other.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "fix: cascade click-added nodes instead of stacking them at viewport center"
```

### Task 3: Add keyboard node movement

- [ ] **Step 1: Make node groups focusable**

In `app.js`, `render()` (lines 178-180), change:

```js
    const g=mk('g',{transform:`translate(${n.x},${n.y})`,class:'node'});
    g.dataset.id=n.id;
    if(sel&&sel.type==='node'&&sel.id===n.id)g.classList.add('sel');
```

to:

```js
    const g=mk('g',{transform:`translate(${n.x},${n.y})`,class:'node',tabindex:'0',role:'group',
      'aria-label':(n.fields.name||c.name)});
    g.dataset.id=n.id;
    if(sel&&sel.type==='node'&&sel.id===n.id)g.classList.add('sel');
```

- [ ] **Step 2: Add arrow-key movement with undo-coalescing and focus restore**

In `app.js`, declare a new flag alongside `drag`/`wiring`/etc. (same line touched in Task 2):

```js
let drag=null,wiring=null,panning=null,space=false,moved=false,addOffset=0,arrowMoveStarted=false;
```

In the `window.addEventListener('keydown', ...)` handler (lines 402-410), add a new branch right before the existing `Delete`/`Backspace` branch:

```js
  if(e.key.startsWith('Arrow')&&sel&&sel.type==='node'&&!typing){
    e.preventDefault();
    const n=state.nodes.find(x=>x.id===sel.id);if(!n)return;
    if(!arrowMoveStarted){pushHistory();arrowMoveStarted=true;}
    const step=12;
    if(e.key==='ArrowUp')n.y-=step;
    if(e.key==='ArrowDown')n.y+=step;
    if(e.key==='ArrowLeft')n.x-=step;
    if(e.key==='ArrowRight')n.x+=step;
    render();
    const gEl=gNodes.querySelector(`g[data-id="${n.id}"]`);
    if(gEl)gEl.focus();
    return;
  }
```

In `window.addEventListener('keyup', ...)` (line 411), add coalescing reset:

```js
window.addEventListener('keyup',e=>{
  if(e.code==='Space'){space=false;SVG.classList.remove('panready');}
  if(e.key.startsWith('Arrow'))arrowMoveStarted=false;
});
```

- [ ] **Step 3: Verify**

In the browser: click a node to select it (this also focuses it, since it's now `tabindex="0"` and receives the click). Press `ArrowRight` four times. Expected: the node moves right by 48px total (4×12px), and the browser DevTools "focused element" (checkable via `mcp__Claude_Browser__javascript_tool` running `document.activeElement.dataset.id`) still points at the same node's `<g>` after each press — not `null`/`body`. Press `Strg+Z` once. Expected: all four arrow-key moves undo in a single step (node returns to its original position with one undo, not four).

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: keyboard-move selected node with arrow keys, coalesced into one undo step"
```

### Task 4: Fix port-label contrast

- [ ] **Step 1: Give `.port-label` its own color, leave `--faint` untouched**

In `index.html`, change line 139 from:

```css
  .port-label{font-family:var(--mono);font-size:7.5px;fill:var(--faint)}
```

to:

```css
  .port-label{font-family:var(--mono);font-size:7.5px;fill:#93a0b0}
```

Do not modify the `--faint` custom property itself (`index.html:13`) — it's reused by 7 other, intentionally low-contrast elements (search icon, `.pgroup` labels, `.zoomval`, `.inspector h2`, `.empty .ico svg`, `.legend h3`, `.statusbar .privacy`) that should stay as they are.

- [ ] **Step 2: Verify**

In the browser: zoom into a node's ports (e.g. the "Multi-WR" node's `AC-Out1`/`AC-Out2` labels). Expected: labels are visibly lighter/more legible against the dark background than before, while the search icon, palette group headers, and other `--faint`-colored UI elements look unchanged.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix: increase port-label contrast without touching the shared --faint variable"
```

### Task 5: Make delete confirmation consistent (remove the `confirm()` on Clear)

- [ ] **Step 1: Remove the confirm dialog, rely on Undo like single-item delete**

In `app.js`, change `el('clear').onclick` (lines 432-436) from:

```js
el('clear').onclick=()=>{
  if(!state.nodes.length)return;
  if(confirm('Alle Bausteine und Verbindungen löschen?')){pushHistory();
    state.nodes=[];state.wires=[];sel=null;render();inspector();showToast('Zeichenfläche geleert');}
};
```

to:

```js
el('clear').onclick=()=>{
  if(!state.nodes.length)return;
  pushHistory();
  state.nodes=[];state.wires=[];sel=null;render();inspector();
  showToast('Zeichenfläche geleert · Strg+Z zum Rückgängigmachen');
};
```

- [ ] **Step 2: Verify**

In the browser: with nodes present, click "Leeren". Expected: no native confirm dialog appears, the canvas clears immediately, toast reads "Zeichenfläche geleert · Strg+Z zum Rückgängigmachen". Press `Strg+Z`. Expected: all nodes and wires are restored.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "fix: remove confirm() on Leeren, rely on Undo like single-item delete does"
```

---

## Abschluss

- [ ] **Push and verify on GitHub Pages**

After all chunks are committed and locally verified, push to `main` (ask the user for explicit confirmation first, per this project's usual git workflow) and re-verify the deployed site at `https://lucienkerl.github.io/schemaplan/` once GitHub Pages has redeployed (~1 minute), repeating the Chunk 2 autosave and Chunk 5 export checks against the live URL.
