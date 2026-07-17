/* ============================================================
   Schemaplan – Übersichtsschaltplan-Editor
   Läuft komplett clientseitig. Keine externen Abhängigkeiten.
   ============================================================ */

const SVGNS='http://www.w3.org/2000/svg';
const el=(id)=>document.getElementById(id);

/* ---------------- component library ---------------- */
const LIB={
  netz:{group:'Netz & Messung',name:'Netz / NVP',color:'#e5ab45',w:124,h:56,
    fields:[['name','Bezeichnung','Niederspannungsnetz'],['u','Spannung','400/230 V']],
    ports:[{id:'out',label:'L1L2L3N',side:'r',kind:'ac'}]},
  hak:{group:'Netz & Messung',name:'HAK (NH)',color:'#e5ab45',w:98,h:56,
    fields:[['name','Bezeichnung','HAK'],['fuse','Sicherung','NH 63 A']],
    ports:[{id:'in',label:'',side:'l',kind:'ac'},{id:'out',label:'',side:'r',kind:'ac'}]},
  sls:{group:'Netz & Messung',name:'SH-Schalter (SLS)',color:'#e5ab45',w:98,h:56,
    fields:[['name','Bezeichnung','SH-Schalter'],['rating','Nennstrom','35 A']],
    ports:[{id:'in',label:'',side:'l',kind:'ac'},{id:'out',label:'',side:'r',kind:'ac'}]},
  zaehler:{group:'Netz & Messung',name:'Zähler',color:'#e5ab45',w:116,h:66,
    fields:[['name','Bezeichnung','Z1 Zweirichtungszähler'],['obis','OBIS','1.8.0 / 2.8.0'],['nr','Zähler-Nr.','']],
    ports:[{id:'in',label:'',side:'l',kind:'ac'},{id:'out',label:'',side:'r',kind:'ac'}]},
  gridmeter:{group:'Netz & Messung',name:'Grid-Meter (ET340/EM24)',color:'#e5ab45',w:122,h:58,
    fields:[['name','Bezeichnung','Grid-Meter'],['typ','Typ','ET340']],
    ports:[{id:'net',label:'Netz',side:'l',kind:'ac'},{id:'sys',label:'System',side:'r',kind:'ac'},{id:'sig',label:'VE.Bus',side:'b',kind:'sig'}]},
  uv:{group:'Netz & Messung',name:'Unterverteilung',color:'#94a3b4',w:114,h:74,
    fields:[['name','Bezeichnung','Unterverteilung (UV)']],
    ports:[{id:'in',label:'',side:'l',kind:'ac'},{id:'a',label:'',side:'r',kind:'ac'},{id:'b',label:'',side:'b',kind:'ac'},{id:'c',label:'',side:'t',kind:'ac'}]},

  pvwr:{group:'Erzeugung',name:'PV-Wechselrichter',color:'#4aa8ec',w:124,h:62,
    fields:[['name','Bezeichnung','PV-Wechselrichter'],['p','AC-Leistung','__ kVA'],['na','NA-Schutz','integriert']],
    ports:[{id:'ac',label:'AC',side:'t',kind:'ac'},{id:'dc',label:'DC',side:'b',kind:'dc'}]},
  pvgen:{group:'Erzeugung',name:'PV-Generator',color:'#4aa8ec',w:122,h:58,
    fields:[['name','Bezeichnung','PV-Generator'],['kwp','Leistung','__ kWp'],['mod','Module / Strings','__ / __']],
    ports:[{id:'dc',label:'DC+/−',side:'t',kind:'dc'}]},
  mppt:{group:'Erzeugung',name:'MPPT DC-DC Laderegler',color:'#4aa8ec',w:130,h:62,
    fields:[['name','Bezeichnung','SmartSolar MPPT'],['typ','Typ','250/100'],['p','PV-Leistung','__ kWp']],
    ports:[{id:'pv',label:'PV',side:'t',kind:'dc'},{id:'bat',label:'BAT',side:'b',kind:'dc'}]},

  multi:{group:'Batterie / Victron',name:'Batterie-/Multi-WR',color:'#ec6a6a',w:154,h:100,
    fields:[['name','Bezeichnung','MultiPlus / Quattro'],['p','Leistung','__ kVA'],['na','NA-Schutz','integriert']],
    ports:[{id:'acin',label:'AC-In',side:'l',kind:'ac'},{id:'acout1',label:'AC-Out1',side:'r',kind:'ac'},
      {id:'acout2',label:'AC-Out2',side:'r',kind:'ac'},{id:'dc',label:'DC',side:'b',kind:'dc'},{id:'ve',label:'VE.Bus',side:'t',kind:'sig'}]},
  battwr:{group:'Batterie / Victron',name:'Batterie-WR (AC-gek.)',color:'#ec6a6a',w:130,h:62,
    fields:[['name','Bezeichnung','Batterie-Wechselrichter'],['p','Leistung','__ kVA']],
    ports:[{id:'ac',label:'AC',side:'t',kind:'ac'},{id:'dc',label:'DC',side:'b',kind:'dc'}]},
  battery:{group:'Batterie / Victron',name:'Batteriespeicher',color:'#ec6a6a',w:122,h:58,
    fields:[['name','Bezeichnung','Batteriespeicher'],['kwh','Kapazität','__ kWh'],['typ','Typ','LiFePO4']],
    ports:[{id:'dc',label:'DC+/−',side:'t',kind:'dc'}]},
  dcbus:{group:'Batterie / Victron',name:'DC-Sammelschiene',color:'#ec6a6a',w:100,h:42,
    fields:[['name','Bezeichnung','DC-Bus']],
    ports:[{id:'a',label:'',side:'t',kind:'dc'},{id:'b',label:'',side:'b',kind:'dc'},{id:'l',label:'',side:'l',kind:'dc'},{id:'r',label:'',side:'r',kind:'dc'}]},
  cerbo:{group:'Batterie / Victron',name:'Cerbo GX / EMS',color:'#6fdc8c',w:114,h:50,
    fields:[['name','Bezeichnung','Cerbo GX']],
    ports:[{id:'ve',label:'VE.Bus',side:'l',kind:'sig'},{id:'net',label:'Netz',side:'r',kind:'sig'}]},

  wallbox:{group:'Verbraucher',name:'Wallbox',color:'#94a3b4',w:108,h:54,
    fields:[['name','Bezeichnung','Wallbox'],['p','Leistung','11 kW'],['s14a','§14a EnWG','steuerbar']],
    ports:[{id:'ac',label:'AC',side:'t',kind:'ac'},{id:'sig',label:'Steuer',side:'r',kind:'sig'}]},
  load:{group:'Verbraucher',name:'Verbraucher',color:'#94a3b4',w:108,h:50,
    fields:[['name','Bezeichnung','Verbraucher'],['note','Hinweis','Eigenverbrauch']],
    ports:[{id:'ac',label:'AC',side:'t',kind:'ac'}]},
  backup:{group:'Verbraucher',name:'Backup-Verteilung',color:'#94a3b4',w:122,h:54,
    fields:[['name','Bezeichnung','Ersatzstrom-Verteilung'],['note','Hinweis','AC-Out 1']],
    ports:[{id:'ac',label:'AC',side:'t',kind:'ac'}]},
  steuerbox:{group:'Verbraucher',name:'Steuerbox §14a',color:'#6fdc8c',w:108,h:50,
    fields:[['name','Bezeichnung','Steuerbox'],['note','FRE / Node','']],
    ports:[{id:'sig',label:'Steuer',side:'l',kind:'sig'},{id:'net',label:'FNN',side:'t',kind:'sig'}]},
};
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
Object.keys(LIB).forEach(k=>{if(!ICONS[k])console.warn('Kein Icon für Bauteiltyp:',k);});

/* ---------- schematic symbols: SYMS[key](w,h) draws in box coordinates ----------
   Stroke/colour come from the parent <g>; markup uses currentColor for small fills.
   Components without an entry fall back to the (smaller) ICONS glyph.            */
const SYMS={
  // grid: L1 L2 L3 N — four short parallel conductors
  netz:(w,h)=>{const cx=w/2,cy=h/2;let s='';for(let i=0;i<4;i++){const y=cy-12+i*8;s+=`<line x1="${cx-17}" y1="${y}" x2="${cx+17}" y2="${y}"/>`;}return s;},
  // NH fuse: body rectangle with a conductor through it
  hak:(w,h)=>{const cx=w/2,cy=h/2;return `<line x1="${cx}" y1="${cy-19}" x2="${cx}" y2="${cy+19}"/><rect x="${cx-8}" y="${cy-13}" width="16" height="26" rx="1.5" fill="none"/>`;},
  // isolating switch (SLS): terminals + hinged blade
  sls:(w,h)=>{const cx=w/2,cy=h/2;return `<line x1="${cx-19}" y1="${cy}" x2="${cx-7}" y2="${cy}"/><circle cx="${cx-7}" cy="${cy}" r="2" fill="currentColor"/><line x1="${cx-7}" y1="${cy}" x2="${cx+9}" y2="${cy-13}"/><circle cx="${cx+7}" cy="${cy}" r="2" fill="currentColor"/><line x1="${cx+7}" y1="${cy}" x2="${cx+19}" y2="${cy}"/>`;},
  // energy meter: circle + bidirectional arrows (import/export)
  zaehler:(w,h)=>{const cx=w/2,cy=h/2,r=Math.min(w,h)*0.34;return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"/><line x1="${cx-5}" y1="${cy-r+4}" x2="${cx-5}" y2="${cy+r-4}"/><path d="M${cx-8},${cy-r+8} L${cx-5},${cy-r+4} L${cx-2},${cy-r+8}"/><line x1="${cx+5}" y1="${cy-r+4}" x2="${cx+5}" y2="${cy+r-4}"/><path d="M${cx+2},${cy+r-8} L${cx+5},${cy+r-4} L${cx+8},${cy+r-8}"/>`;},
  gridmeter:(w,h)=>SYMS.zaehler(w,h),
  // sub-distribution board: framed with busbar rows
  uv:(w,h)=>{const x=w*0.28,ww=w*0.44,y=h*0.2,hh=h*0.6;return `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="none"/><line x1="${x}" y1="${y+hh/3}" x2="${x+ww}" y2="${y+hh/3}"/><line x1="${x}" y1="${y+2*hh/3}" x2="${x+ww}" y2="${y+2*hh/3}"/>`;},
  // inverter: box split by diagonal, = (DC) over ~ (AC)
  pvwr:(w,h)=>invSym(w,h),
  battwr:(w,h)=>invSym(w,h,true),
  multi:(w,h)=>invSym(w,h,true),
  mppt:(w,h)=>{const cx=w/2,cy=h/2;return `<line x1="${cx-16}" y1="${cy-11}" x2="${cx+16}" y2="${cy-11}"/><line x1="${cx-16}" y1="${cy-6}" x2="${cx+16}" y2="${cy-6}"/><line x1="${cx-16}" y1="${cy-3}" x2="${cx+16}" y2="${cy-3}" stroke-dasharray="3 2"/><path d="M${cx-14},${cy+8} h28 M${cx-14},${cy+13} h28"/>`;},
  // PV module: framed grid + incident-light arrow
  pvgen:(w,h)=>{const x=w*0.3,ww=w*0.4,y=h*0.28,hh=h*0.44;let s=`<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="none"/>`;s+=`<line x1="${x+ww/3}" y1="${y}" x2="${x+ww/3}" y2="${y+hh}"/><line x1="${x+2*ww/3}" y1="${y}" x2="${x+2*ww/3}" y2="${y+hh}"/><line x1="${x}" y1="${y+hh/2}" x2="${x+ww}" y2="${y+hh/2}"/>`;s+=`<path d="M${x-9},${y-7} l7,7 M${x-3},${y-2} l1,-5 M${x-2},${y-1} l-5,1"/>`;return s;},
  // battery: stacked cells (alternating long/short plates)
  battery:(w,h)=>{const cx=w/2,cy=h/2;let s='';for(let i=0;i<2;i++){const y=cy-8+i*11;s+=`<line x1="${cx-13}" y1="${y}" x2="${cx+13}" y2="${y}"/><line x1="${cx-7}" y1="${y+5}" x2="${cx+7}" y2="${y+5}"/>`;}return s;},
  // DC busbar
  dcbus:(w,h)=>{const cy=h/2;return `<line x1="${w*0.15}" y1="${cy}" x2="${w*0.85}" y2="${cy}" stroke-width="2.6"/>`;},
  // consumer: resistor rectangle
  load:(w,h)=>{const cx=w/2,cy=h/2;return `<rect x="${cx-15}" y="${cy-7}" width="30" height="14" rx="1" fill="none"/>`;},
};
// shared inverter symbol (box diagonal + DC "=" and AC "~")
function invSym(w,h,acFirst){const p=Math.min(w,h)*0.22,x0=w/2-Math.min(w,h)*0.3,y0=h/2-Math.min(w,h)*0.3,x1=w/2+Math.min(w,h)*0.3,y1=h/2+Math.min(w,h)*0.3;
  const dc=`<line x1="${w/2-16}" y1="${h*0.36}" x2="${w/2-6}" y2="${h*0.36}"/><line x1="${w/2-16}" y1="${h*0.36+4}" x2="${w/2-6}" y2="${h*0.36+4}"/>`;
  const ac=`<path d="M${w/2+3},${h*0.64} q3,-5 6,0 t6,0" fill="none"/>`;
  return `<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y0}"/>`+dc+ac;}
const KINDCOL={ac:'#e5ab45',dc:'#4aa8ec',sig:'#6fdc8c'};

/* ---------------- state ---------------- */
function defaultProject(){return {betreiber:'',anschrift:'',ersteller:'',datum:'',
  zaehlerNr:'',mastrNr:''};}
let state={nodes:[],wires:[],seq:1,project:defaultProject()};
let view={x:120,y:80,k:1};
let sel=null;        // {type:'node'|'wire', id}
let history=[], future=[];

/* ---------------- dom refs ---------------- */
const SVG=el('svg'), VP=el('viewport'), gNodes=el('nodes'), gWires=el('wires'), gTemp=el('tempwire');
const hint=el('hint'), toast=el('toast');

/* ---------------- history ---------------- */
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
function undo(){if(!history.length)return;future.push(snapshot());restore(history.pop());updateUndo();showToast('Rückgängig');}
function redo(){if(!future.length)return;history.push(snapshot());restore(future.pop());updateUndo();showToast('Wiederholt');}
function updateUndo(){el('undo').disabled=!history.length;el('redo').disabled=!future.length;}
el('undo').onclick=undo;
el('redo').onclick=redo;

/* ---------------- autosave ---------------- */
const AUTOSAVE_KEY='schemaplan.autosave.v1';
let autosaveT=null;
function writeAutosave(){
  try{localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(state));}catch(_){}
}
function scheduleAutosave(){
  clearTimeout(autosaveT);
  autosaveT=setTimeout(()=>{autosaveT=null;writeAutosave();},500);
}
// Flush a still-pending debounced write immediately, so edits made within the
// last 500ms aren't lost if the tab is closed/reloaded/backgrounded before the
// timer fires. No-op when nothing is pending.
function flushAutosave(){
  if(!autosaveT)return;
  clearTimeout(autosaveT);autosaveT=null;
  writeAutosave();
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushAutosave();});
window.addEventListener('pagehide',flushAutosave);
function loadAutosave(){
  let raw;
  try{raw=localStorage.getItem(AUTOSAVE_KEY);}catch(_){return false;}
  if(!raw)return false;
  try{
    const o=JSON.parse(raw);
    if(!o||!Array.isArray(o.nodes)||!Array.isArray(o.wires)||typeof o.seq!=='number')return false;
    if(!o.nodes.every(n=>Object.hasOwn(LIB,n.key)&&n.fields&&typeof n.fields==='object'&&Object.values(n.fields).every(v=>v==null||typeof v==='string')))return false;
    state=o;
    state.project=state.project||defaultProject();
    return true;
  }catch(_){return false;}
}

/* ---------------- toast ---------------- */
let toastT;
function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastT);
  toastT=setTimeout(()=>toast.classList.remove('show'),1600);el('stat-msg').textContent=msg;}

/* ---------------- palette ---------------- */
function buildPalette(filter=''){
  const list=el('pallist');list.innerHTML='';
  const groups={};const f=filter.trim().toLowerCase();
  for(const [key,c] of Object.entries(LIB)){
    if(f && !c.name.toLowerCase().includes(f) && !c.group.toLowerCase().includes(f))continue;
    (groups[c.group]=groups[c.group]||[]).push([key,c]);
  }
  if(!Object.keys(groups).length){list.innerHTML='<div style="color:var(--faint);font-size:12px;padding:8px 6px">Kein Treffer.</div>';return;}
  for(const [g,items] of Object.entries(groups)){
    const h=document.createElement('div');h.className='pgroup';h.textContent=g;list.appendChild(h);
    for(const [key,c] of items){
      const d=document.createElement('div');d.className='pitem';d.draggable=true;d.dataset.key=key;
      d.innerHTML=`<span class="picon" style="background:${c.color}22;color:${c.color}"><svg viewBox="0 0 24 24">${ICONS[key]}</svg></span>${c.name}`;
      d.addEventListener('click',()=>addNode(key));
      d.addEventListener('dragstart',e=>e.dataTransfer.setData('key',key));
      list.appendChild(d);
    }
  }
}
el('palsearch').addEventListener('input',e=>buildPalette(e.target.value));

/* ---------------- coordinate helpers ---------------- */
function toWorld(cx,cy){const r=SVG.getBoundingClientRect();return{x:(cx-r.left-view.x)/view.k,y:(cy-r.top-view.y)/view.k};}
function applyView(){VP.setAttribute('transform',`translate(${view.x},${view.y}) scale(${view.k})`);
  el('bg').setAttribute('transform',VP.getAttribute('transform'));
  el('bgbig').setAttribute('transform',VP.getAttribute('transform'));
  el('zval').textContent=Math.round(view.k*100)+'%';}
const snap=(v)=>Math.round(v/12)*12;

/* ---------------- add / remove ---------------- */
function fillFields(c){
  const fields={};
  c.fields.forEach(f=>{fields[f[0]]=f[2].startsWith('__')?'':f[2];});
  return fields;
}
function addNode(key,wx,wy){
  pushHistory();
  const c=LIB[key];
  if(wx==null){
    const r=SVG.getBoundingClientRect();const p=toWorld(r.left+r.width/2,r.top+r.height/2);
    wx=p.x-c.w/2+addOffset;wy=p.y-c.h/2+addOffset;
    addOffset=(addOffset+18)%108;
  }
  const fields=fillFields(c);
  const n={id:'n'+(state.seq++),key,x:snap(wx),y:snap(wy),fields};
  state.nodes.push(n);sel={type:'node',id:n.id};render();inspector();
  hint.style.display='none';showToast(c.name+' hinzugefügt');
}
function removeNode(id){
  pushHistory();
  state.nodes=state.nodes.filter(n=>n.id!==id);
  state.wires=state.wires.filter(w=>w.from.node!==id&&w.to.node!==id);
  sel=null;render();inspector();showToast('Baustein gelöscht');
}
function removeWire(id){
  pushHistory();
  state.wires=state.wires.filter(w=>w.id!==id);
  if(sel&&sel.type==='wire'&&sel.id===id)sel=null;
  render();inspector();showToast('Verbindung gelöscht');
}

/* ---------------- port geometry ---------------- */
function portPos(n){
  const c=LIB[n.key];const out={};const sides={l:[],r:[],t:[],b:[]};
  c.ports.forEach(p=>sides[p.side].push(p));
  for(const s of ['l','r','t','b']){
    sides[s].forEach((p,i)=>{
      const cnt=sides[s].length;const frac=(i+1)/(cnt+1);let x,y;
      if(s==='l'){x=n.x;y=n.y+c.h*frac;}
      else if(s==='r'){x=n.x+c.w;y=n.y+c.h*frac;}
      else if(s==='t'){x=n.x+c.w*frac;y=n.y;}
      else{x=n.x+c.w*frac;y=n.y+c.h;}
      out[p.id]={x,y,side:s,kind:p.kind,label:p.label};
    });
  }
  return out;
}
function portUsed(nodeId,portId){return state.wires.some(w=>(w.from.node===nodeId&&w.from.port===portId)||(w.to.node===nodeId&&w.to.port===portId));}

/* ---------------- render ---------------- */
function mk(tag,attrs){const e=document.createElementNS(SVGNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}

function render(){
  scheduleAutosave();
  // wires first (under nodes)
  renderWires();
  // nodes
  gNodes.innerHTML='';
  for(const n of state.nodes){
    const c=LIB[n.key];
    const g=mk('g',{transform:`translate(${n.x},${n.y})`,class:'node',tabindex:'0',role:'group',
      'aria-label':(n.fields.name||c.name)});
    g.dataset.id=n.id;
    if(sel&&sel.type==='node'&&sel.id===n.id)g.classList.add('sel');
    const strokeW=(sel&&sel.type==='node'&&sel.id===n.id)?2.4:1.4;

    g.appendChild(mk('rect',{class:'node-body',width:c.w,height:c.h,rx:7,fill:'#141922',
      stroke:c.color,'stroke-width':strokeW}));

    // schematic symbol: a proper SYMS drawing filling the box, or an ICONS fallback
    const sym=mk('g',{class:'node-sym',stroke:c.color,color:c.color,fill:'none','stroke-width':1.5,
      'stroke-linecap':'round','stroke-linejoin':'round'});
    sym.style.pointerEvents='none';
    if(SYMS[n.key]){
      sym.innerHTML=SYMS[n.key](c.w,c.h);
    }else{
      const isc=(Math.min(c.w,c.h)*0.5)/24, iw=24*isc;
      sym.setAttribute('transform',`translate(${c.w/2-iw/2},${c.h/2-iw/2}) scale(${isc})`);
      sym.setAttribute('stroke-width',1.7/isc);
      sym.innerHTML=ICONS[n.key];
    }
    g.appendChild(sym);

    // name label ABOVE the box, value lines BELOW it (keeps text out of the symbol)
    const t1=mk('text',{class:'node-name',x:c.w/2,y:-7,'text-anchor':'middle'});
    t1.textContent=n.fields.name||c.name;g.appendChild(t1);
    const subs=c.fields.filter(f=>f[0]!=='name').map(f=>n.fields[f[0]]).filter(v=>v&&v.trim());
    subs.slice(0,2).forEach((s,i)=>{
      const t=mk('text',{class:'node-val',x:c.w/2,y:c.h+13+i*11,'text-anchor':'middle'});
      t.textContent=s;g.appendChild(t);
    });

    const pp=portPos(n);
    for(const [pid,p] of Object.entries(pp)){
      const lx=p.x-n.x, ly=p.y-n.y;
      // larger invisible hit area for easy grabbing
      const hit=mk('circle',{cx:lx,cy:ly,r:10,fill:'transparent'});
      hit.style.cursor='crosshair';hit.dataset.node=n.id;hit.dataset.port=pid;hit.classList.add('port');
      g.appendChild(hit);
      const circ=mk('circle',{cx:lx,cy:ly,r:5,
        fill:portUsed(n.id,pid)?KINDCOL[p.kind]:'#0d1017',stroke:KINDCOL[p.kind],'stroke-width':1.8});
      circ.style.pointerEvents='none';g.appendChild(circ);
      if(p.label){
        let tx=lx,ty=ly,anc='middle';
        if(p.side==='l'){tx=lx+9;anc='start';ty=ly+2.5;}
        else if(p.side==='r'){tx=lx-9;anc='end';ty=ly+2.5;}
        else if(p.side==='t'){ty=ly+12;}else{ty=ly-7;}
        const tl=mk('text',{class:'port-label',x:tx,y:ty,'text-anchor':anc});
        tl.textContent=p.label;tl.style.pointerEvents='none';g.appendChild(tl);
      }
    }
    gNodes.appendChild(g);
  }
  updateStats();
}
function wirePath(a,b){
  const off=Math.max(30,Math.abs(a.x-b.x)/2,Math.abs(a.y-b.y)/2);
  const c1x=a.side==='l'?a.x-off:a.side==='r'?a.x+off:a.x;
  const c1y=a.side==='t'?a.y-off:a.side==='b'?a.y+off:a.y;
  const c2x=b.side==='l'?b.x-off:b.side==='r'?b.x+off:b.x;
  const c2y=b.side==='t'?b.y-off:b.side==='b'?b.y+off:b.y;
  return `M${a.x},${a.y} C${c1x},${c1y} ${c2x},${c2y} ${b.x},${b.y}`;
}
function renderWires(){
  gWires.innerHTML='';
  for(const w of state.wires){
    const A=state.nodes.find(n=>n.id===w.from.node),B=state.nodes.find(n=>n.id===w.to.node);
    if(!A||!B)continue;
    const pa=portPos(A)[w.from.port],pb=portPos(B)[w.to.port];
    if(!pa||!pb)continue;
    const d=wirePath(pa,pb);
    const col=KINDCOL[pa.kind]||'#94a3b4';
    const selw=(sel&&sel.type==='wire'&&sel.id===w.id);
    // fat invisible hit path
    const hit=mk('path',{d,fill:'none',stroke:'transparent','stroke-width':16});
    hit.style.cursor='pointer';hit.dataset.wire=w.id;hit.classList.add('wirehit');
    gWires.appendChild(hit);
    // visible path
    const path=mk('path',{d,fill:'none',stroke:col,'stroke-width':selw?3.2:2,
      'stroke-linecap':'round'});
    if(selw)path.setAttribute('stroke-dasharray','1 0');
    path.style.pointerEvents='none';
    if(selw){path.setAttribute('filter','drop-shadow(0 0 4px '+col+')');}
    gWires.appendChild(path);
  }
}
function updateStats(){
  el('stat-nodes').textContent=state.nodes.length+(state.nodes.length===1?' Baustein':' Bausteine');
  el('stat-wires').textContent=state.wires.length+(state.wires.length===1?' Verbindung':' Verbindungen');
  hint.style.display=state.nodes.length?'none':'block';
}

/* ---------------- inspector ---------------- */
function inspector(){
  const body=el('insp-body');
  if(!sel){
    body.innerHTML=`<div class="empty"><div class="ico"><svg viewBox="0 0 24 24"><path d="M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z"/></svg></div>
      Nichts ausgewählt.<br><br>Wähle einen Baustein oder eine Verbindung auf der Zeichenfläche, um sie zu bearbeiten.</div>`;
    return;
  }
  if(sel.type==='wire'){
    const w=state.wires.find(x=>x.id===sel.id);
    if(!w){sel=null;return inspector();}
    const A=state.nodes.find(n=>n.id===w.from.node),B=state.nodes.find(n=>n.id===w.to.node);
    const pa=portPos(A)[w.from.port];
    body.innerHTML=`<div class="insp-head"><span class="dot" style="background:${KINDCOL[pa.kind]}"></span><span>Verbindung</span></div>
      <div class="field"><label>Von</label><input readonly value="${(A.fields.name||LIB[A.key].name)} · ${w.from.port}"></div>
      <div class="field"><label>Nach</label><input readonly value="${(B.fields.name||LIB[B.key].name)} · ${w.to.port}"></div>
      <button class="del" id="delwire"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>Verbindung löschen</button>`;
    el('delwire').onclick=()=>removeWire(w.id);
    return;
  }
  const n=state.nodes.find(x=>x.id===sel.id);if(!n){sel=null;return inspector();}
  const c=LIB[n.key];
  let html=`<div class="insp-head"><span class="dot" style="background:${c.color}"></span><span>${c.name}</span></div>`;
  for(const f of c.fields){
    const ph=f[2].startsWith('__')?f[2].replace(/"/g,'&quot;'):'';
    html+=`<div class="field"><label>${f[1]}</label><input data-k="${f[0]}" placeholder="${ph}" value="${(n.fields[f[0]]||'').replace(/"/g,'&quot;')}"></div>`;
  }
  html+=`<button class="del" id="delnode"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>Baustein löschen</button>`;
  body.innerHTML=html;
  body.querySelectorAll('input').forEach(inp=>inp.addEventListener('input',()=>{
    // coalesce edits into one history step on first change
    if(!inp._touched){pushHistory();inp._touched=true;}
    n.fields[inp.dataset.k]=inp.value;render();
  }));
  el('delnode').onclick=()=>removeNode(n.id);
}
function selectItem(s){sel=s;arrowMoveStarted=false;render();inspector();}

/* ---------------- context menu ---------------- */
let ctxEl=null;
function closeCtx(){if(ctxEl){ctxEl.remove();ctxEl=null;}}
function openCtx(clientX,clientY,items){
  closeCtx();
  const stageRect=el('stage').getBoundingClientRect();
  ctxEl=document.createElement('div');ctxEl.className='ctx';
  ctxEl.style.left=(clientX-stageRect.left)+'px';ctxEl.style.top=(clientY-stageRect.top)+'px';
  items.forEach(it=>{
    if(it.sep){ctxEl.appendChild(document.createElement('hr'));return;}
    const b=document.createElement('button');if(it.danger)b.className='danger';
    b.innerHTML=(it.icon||'')+`<span>${it.label}</span>`;
    b.onclick=()=>{closeCtx();it.action();};
    ctxEl.appendChild(b);
  });
  el('stage').appendChild(ctxEl);
}
const ICO={trash:'<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  copy:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'};

SVG.addEventListener('contextmenu',e=>{
  const wireEl=e.target.closest('.wirehit');
  const nodeEl=e.target.closest('#nodes g');
  if(wireEl){e.preventDefault();const id=wireEl.dataset.wire;selectItem({type:'wire',id});
    openCtx(e.clientX,e.clientY,[{label:'Verbindung löschen',icon:ICO.trash,danger:true,action:()=>removeWire(id)}]);
  }else if(nodeEl){e.preventDefault();const id=nodeEl.dataset.id;selectItem({type:'node',id});
    openCtx(e.clientX,e.clientY,[
      {label:'Duplizieren',icon:ICO.copy,action:()=>dupNode(id)},
      {sep:true},
      {label:'Baustein löschen',icon:ICO.trash,danger:true,action:()=>removeNode(id)}]);
  }
});
function dupNode(id){const n=state.nodes.find(x=>x.id===id);if(!n)return;pushHistory();
  const copy={id:'n'+(state.seq++),key:n.key,x:n.x+24,y:n.y+24,fields:{...n.fields}};
  state.nodes.push(copy);sel={type:'node',id:copy.id};render();inspector();showToast('Dupliziert');}
document.addEventListener('pointerdown',e=>{if(ctxEl&&!ctxEl.contains(e.target))closeCtx();},true);

/* ---------------- interaction ---------------- */
let drag=null,wiring=null,panning=null,space=false,moved=false,addOffset=0,arrowMoveStarted=false,arrowMoveTimer=null;

SVG.addEventListener('pointerdown',e=>{
  closeCtx();
  if(e.button===2)return; // context handled separately
  e.preventDefault();
  const portEl=e.target.closest('.port');
  const wireEl=e.target.closest('.wirehit');
  const nodeEl=e.target.closest('#nodes g');
  if(portEl){
    const p=toWorld(e.clientX,e.clientY);
    wiring={node:portEl.dataset.node,port:portEl.dataset.port,x:p.x,y:p.y};
    try{SVG.setPointerCapture(e.pointerId);}catch(_){}return;
  }
  if((e.button===1)||(space&&e.button===0)){
    panning={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};SVG.classList.add('panning');
    try{SVG.setPointerCapture(e.pointerId);}catch(_){}return;
  }
  if(wireEl){selectItem({type:'wire',id:wireEl.dataset.wire});return;}
  if(nodeEl){
    const n=state.nodes.find(x=>x.id===nodeEl.dataset.id);
    selectItem({type:'node',id:n.id});
    const p=toWorld(e.clientX,e.clientY);
    drag={id:n.id,dx:p.x-n.x,dy:p.y-n.y,started:false};moved=false;
    try{SVG.setPointerCapture(e.pointerId);}catch(_){}return;
  }
  selectItem(null);
});
SVG.addEventListener('pointermove',e=>{
  if(drag){
    const p=toWorld(e.clientX,e.clientY);
    const n=state.nodes.find(x=>x.id===drag.id);
    if(!drag.started){pushHistory();drag.started=true;}
    n.x=snap(p.x-drag.dx);n.y=snap(p.y-drag.dy);moved=true;render();
  }else if(wiring){
    const p=toWorld(e.clientX,e.clientY);
    const A=state.nodes.find(n=>n.id===wiring.node);const pa=portPos(A)[wiring.port];
    gTemp.innerHTML='';
    gTemp.appendChild(mk('path',{d:wirePath(pa,{x:p.x,y:p.y,side:'l'}),fill:'none',
      stroke:KINDCOL[pa.kind]||'#8896a6','stroke-width':2,'stroke-dasharray':'5 4','stroke-linecap':'round'}));
  }else if(panning){
    view.x=panning.vx+(e.clientX-panning.x);view.y=panning.vy+(e.clientY-panning.y);applyView();
  }
});
SVG.addEventListener('pointerup',e=>{
  if(wiring){
    const target=document.elementFromPoint(e.clientX,e.clientY);
    const tp=target&&target.closest?target.closest('.port'):null;
    if(tp&&!(tp.dataset.node===wiring.node&&tp.dataset.port===wiring.port)){
      pushHistory();
      state.wires.push({id:'w'+(state.seq++),from:{node:wiring.node,port:wiring.port},
        to:{node:tp.dataset.node,port:tp.dataset.port}});
      showToast('Verbindung erstellt');
    }
    gTemp.innerHTML='';wiring=null;render();
  }
  drag=null;panning=null;SVG.classList.remove('panning');
  try{SVG.releasePointerCapture(e.pointerId);}catch(_){}
});
SVG.addEventListener('wheel',e=>{
  e.preventDefault();
  const r=SVG.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
  const wx=(mx-view.x)/view.k,wy=(my-view.y)/view.k;
  const k=Math.min(3,Math.max(.25,view.k*(e.deltaY<0?1.12:0.893)));
  view.x=mx-wx*k;view.y=my-wy*k;view.k=k;applyView();
},{passive:false});

function zoomBy(f){const r=SVG.getBoundingClientRect();const mx=r.width/2,my=r.height/2;
  const wx=(mx-view.x)/view.k,wy=(my-view.y)/view.k;
  const k=Math.min(3,Math.max(.25,view.k*f));view.x=mx-wx*k;view.y=my-wy*k;view.k=k;applyView();}
el('zin').onclick=()=>zoomBy(1.2);el('zout').onclick=()=>zoomBy(1/1.2);

/* keyboard */
window.addEventListener('keydown',e=>{
  const typing=document.activeElement&&document.activeElement.tagName==='INPUT';
  if(e.code==='Space'&&!typing){space=true;SVG.classList.add('panready');}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return;}
  if(e.key.startsWith('Arrow')&&sel&&sel.type==='node'&&!typing){
    e.preventDefault();
    const n=state.nodes.find(x=>x.id===sel.id);if(!n)return;
    if(!arrowMoveStarted){pushHistory();arrowMoveStarted=true;}
    clearTimeout(arrowMoveTimer);
    arrowMoveTimer=setTimeout(()=>{arrowMoveStarted=false;},500);
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
  if((e.key==='Delete'||e.key==='Backspace')&&sel&&!typing){e.preventDefault();
    sel.type==='wire'?removeWire(sel.id):removeNode(sel.id);}
  if(e.key==='Escape'){if(projectModalEl){projectModalEl.remove();projectModalEl=null;return;}closeCtx();selectItem(null);}
});
window.addEventListener('keyup',e=>{
  if(e.code==='Space'){space=false;SVG.classList.remove('panready');}
});

/* drop from palette */
const stage=el('stage');
stage.addEventListener('dragover',e=>e.preventDefault());
stage.addEventListener('drop',e=>{
  e.preventDefault();const key=e.dataTransfer.getData('key');if(!key||!LIB[key])return;
  const p=toWorld(e.clientX,e.clientY);addNode(key,p.x-LIB[key].w/2,p.y-LIB[key].h/2);
});

/* ---------------- view controls ---------------- */
el('fit').onclick=fit;
function fit(){
  if(!state.nodes.length){view={x:120,y:80,k:1};applyView();return;}
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const n of state.nodes){const c=LIB[n.key];x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+c.w);y1=Math.max(y1,n.y+c.h);}
  const r=SVG.getBoundingClientRect();const pad=70;
  const k=Math.min(1.7,(r.width-2*pad)/(x1-x0),(r.height-2*pad)/(y1-y0));
  view.k=Math.max(.25,k);view.x=pad-x0*view.k+(r.width-2*pad-(x1-x0)*view.k)/2;
  view.y=pad-y0*view.k+(r.height-2*pad-(y1-y0)*view.k)/2;applyView();
}
el('clear').onclick=()=>{
  if(!state.nodes.length)return;
  pushHistory();
  state.nodes=[];state.wires=[];sel=null;render();inspector();
  showToast('Zeichenfläche geleert · Strg+Z zum Rückgängigmachen');
};

/* ---------------- save / load ---------------- */
el('save').onclick=()=>{dl(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'schaltplan.json');showToast('JSON gespeichert');};
el('load').onclick=()=>{
  const inp=document.createElement('input');inp.type='file';inp.accept='.json';
  inp.onchange=()=>{const f=inp.files[0];const rd=new FileReader();
    rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!o.nodes)throw 0;pushHistory();
      state=o;state.project=state.project||defaultProject();
      sel=null;render();inspector();fit();showToast('Geladen');}catch(_){alert('Ungültige Datei.');}};
    rd.readAsText(f);};inp.click();
};

/* ---------------- project modal ---------------- */
function openProjectModal(){
  const bd=document.createElement('div');bd.className='modal-backdrop';
  const p=state.project;
  const esc=(s)=>(s||'').replace(/"/g,'&quot;');
  const fields=[
    ['betreiber','Anlagenbetreiber'],
    ['anschrift','Anschrift'],
    ['ersteller','Ersteller'],
    ['datum','Datum'],
    ['zaehlerNr','Zähler-Nr.'],
    ['mastrNr','MaStR-Nr.'],
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
    // Auto-fill today's date as a silent default. Deliberately NOT via
    // pushHistory()/render(): merely opening the panel must not create an
    // undo step or clear the user's redo stack. scheduleAutosave() persists it.
    const now=new Date();
    const localDate=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    dEl.value=localDate;
    state.project.datum=localDate;
    scheduleAutosave();
  }
  bd.addEventListener('pointerdown',e=>{if(e.target===bd)closeModal();});
  bd.querySelector('#pf-close').onclick=closeModal;
}
el('project').onclick=openProjectModal;

/* ---------------- export (light DIN-style sheet) ---------------- */
const XESC=(s)=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
// "Hinweise / auszufüllen" box (bottom-left), like the reference sheet
function notesSVG(w,h){
  const notes=[
    'Z1 = Zweirichtungszähler am Netzverknüpfungspunkt (Bezug + Überschusslieferung).',
    'NA-Schutz nach VDE-AR-N 4105 in den Wechselrichtern integriert (>30 kVA: externer NA-Schutz).',
    'Kennwerte ergänzen: kWp, kVA, kWh, Fabrikat/Typ, Zählernummer, Zählpfeilrichtung.',
    'Ggf. Steuerung nach §14a EnWG / NSGM ergänzen (Steuerbox / EMS).',
  ];
  let out=`<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#c7ccd3"/>`;
  out+=`<text x="12" y="22" font-family="Inter,sans-serif" font-size="11" font-weight="600" fill="#1f2937">Hinweise / auszufüllen:</text>`;
  notes.forEach((t,i)=>{
    out+=`<text x="14" y="${44+i*20}" font-family="Inter,sans-serif" font-size="9.5" fill="#374151">· ${XESC(t)}</text>`;
  });
  return out;
}
// title block (bottom-right)
function schriftfeldSVG(w,h){
  const p=state.project;
  const midX=w*0.52, r1=44, r2=76, div=92;
  // full-width field: label + value/underline
  const wide=(label,val,y)=>{
    let s=`<text x="12" y="${y}" font-family="Inter,sans-serif" font-size="9.5" fill="#6b7280">${label}</text>`;
    const vx=110;
    if(val&&val.trim()) s+=`<text x="${vx}" y="${y}" font-family="Inter,sans-serif" font-size="11" fill="#111827">${XESC(val)}</text>`;
    s+=`<line x1="${vx}" y1="${y+4}" x2="${w-12}" y2="${y+4}" stroke="#c7ccd3"/>`;
    return s;
  };
  // cell field in a 2-column grid: label above, value/underline below
  const cell=(label,val,x,y,cw)=>{
    let s=`<text x="${x}" y="${y}" font-family="Inter,sans-serif" font-size="9.5" fill="#6b7280">${label}</text>`;
    if(val&&val.trim()) s+=`<text x="${x}" y="${y+15}" font-family="Inter,sans-serif" font-size="11" fill="#111827">${XESC(val)}</text>`;
    s+=`<line x1="${x}" y1="${y+19}" x2="${x+cw}" y2="${y+19}" stroke="#c7ccd3"/>`;
    return s;
  };
  let out=`<rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#9ca3af"/>`;
  out+=wide('Anlagenbetreiber',p.betreiber,r1);
  out+=wide('Anschrift',p.anschrift,r2);
  out+=`<line x1="0" y1="${div}" x2="${w}" y2="${div}" stroke="#c7ccd3"/>`;
  out+=`<line x1="${midX}" y1="${div}" x2="${midX}" y2="${h}" stroke="#c7ccd3"/>`;
  out+=cell('Ersteller',p.ersteller,12,div+20,midX-24);
  out+=cell('Zähler-Nr.',p.zaehlerNr,midX+12,div+20,w-midX-24);
  out+=cell('Datum',p.datum,12,div+46,midX-24);
  out+=cell('MaStR-Nr.',p.mastrNr,midX+12,div+46,w-midX-24);
  return out;
}
function serializeSVG(){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const n of state.nodes){const c=LIB[n.key];x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x+c.w);y1=Math.max(y1,n.y+c.h);}
  if(!state.nodes.length){x0=0;y0=0;x1=400;y1=300;}
  const pad=56;x0-=pad;y0-=pad;x1+=pad;y1+=pad;const dw=x1-x0,dh=y1-y0;
  // sheet layout (light, DIN-style): frame + title + diagram + notes/Schriftfeld row
  const M=22, TITLE_H=52, GAP=18, BOTTOM_H=158, SCHRIFT_W=328, NGAP=22;
  const contentW=Math.max(dw, 820);
  const W=contentW+2*M;
  const H=M+TITLE_H+dh+GAP+BOTTOM_H+M;
  const diagX=M+(contentW-dw)/2;               // centre diagram in the content area
  const diagY=M+TITLE_H;
  const rowY=M+TITLE_H+dh+GAP;
  const schriftX=W-M-SCHRIFT_W;
  const notesW=schriftX-M-NGAP;

  // diagram clone, recoloured for a light background
  const clone=VP.cloneNode(true);
  const tw=clone.querySelector('#tempwire');if(tw)clone.removeChild(tw);
  clone.querySelectorAll('.wirehit,.port').forEach(e=>e.remove());
  clone.setAttribute('transform',`translate(${diagX-x0},${diagY-y0})`);

  // reference-style export colours: mostly black, colour only for inverters/PV/battery
  const INK='#1f2937';
  const expCol=(key)=>key==='pvwr'?'#2563eb':key==='pvgen'?'#16a34a'
    :(key==='battery'||key==='battwr'||key==='multi')?'#dc2626':INK;
  clone.querySelectorAll('#nodes g.node').forEach(g=>{
    const n=state.nodes.find(x=>x.id===g.dataset.id);if(!n)return;
    const col=expCol(n.key);
    g.querySelectorAll('.node-body').forEach(e=>e.setAttribute('stroke',col));
    g.querySelectorAll('.node-sym').forEach(e=>{e.setAttribute('stroke',col);e.setAttribute('color',col);});
  });
  // wires + junction dots → near-black; hollow (unused) port dots → white
  clone.querySelectorAll('#wires path').forEach(p=>{const s=p.getAttribute('stroke');if(s&&s!=='transparent')p.setAttribute('stroke',INK);});
  clone.querySelectorAll('circle').forEach(c=>{
    const f=c.getAttribute('fill');
    if(c.getAttribute('stroke'))c.setAttribute('stroke',INK);
    if(f==='#0d1017')c.setAttribute('fill','#ffffff');       // unused port: hollow
    else if(f&&f!=='none'&&f!=='#ffffff')c.setAttribute('fill',INK); // used port: filled dot
  });

  const css=document.querySelector('style').textContent;
  // light-theme overrides (win over the embedded dark stylesheet + node-body fill attr)
  const lightCss=`.node-body{fill:#ffffff}.node-name{fill:#111827}.node-val{fill:#4b5563}.port-label{fill:#6b7280}`;

  const title=`<text x="${M+14}" y="${M+26}" font-family="Inter,sans-serif" font-size="16" font-weight="700" fill="#111827">Übersichtsschaltplan – PV-Anlage mit Batteriespeicher</text>`
    +`<text x="${M+14}" y="${M+44}" font-family="Inter,sans-serif" font-size="10.5" fill="#6b7280">Anschluss gem. VDE-AR-N 4105 / 4100 · erstellt mit Schemaplan</text>`;
  const frame=`<rect x="${M}" y="${M}" width="${W-2*M}" height="${H-2*M}" fill="none" stroke="#111827" stroke-width="1.2"/>`;
  const notes=`<g transform="translate(${M},${rowY})">${notesSVG(notesW,BOTTOM_H)}</g>`;
  const schrift=`<g transform="translate(${schriftX},${rowY})">${schriftfeldSVG(SCHRIFT_W,BOTTOM_H)}</g>`;

  const svg=`<svg xmlns="${SVGNS}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
    +`<style>${css}${lightCss}</style>`
    +`<rect width="${W}" height="${H}" fill="#ffffff"/>`
    +frame+title+clone.outerHTML+notes+schrift+`</svg>`;
  return {svg,w:W,h:H};
}
el('exportSvg').onclick=()=>{const {svg}=serializeSVG();dl(new Blob([svg],{type:'image/svg+xml'}),'schaltplan.svg');showToast('SVG exportiert');};
el('png').onclick=()=>{
  const {svg,w,h}=serializeSVG();const scale=2;
  const img=new Image();const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  img.onload=()=>{const cv=document.createElement('canvas');cv.width=w*scale;cv.height=h*scale;
    const ctx=cv.getContext('2d');ctx.scale(scale,scale);ctx.drawImage(img,0,0);
    cv.toBlob(b=>{dl(b,'schaltplan.png');showToast('PNG exportiert');URL.revokeObjectURL(url);});};
  img.onerror=()=>{URL.revokeObjectURL(url);alert('PNG-Export fehlgeschlagen.');};
  img.src=url;
};
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}

/* ---------------- seed example ---------------- */
function seed(){
  const ids={};
  const add=(k,x,y)=>{const c=LIB[k];const fields=fillFields(c);
    const n={id:'n'+(state.seq++),key:k,x,y,fields};state.nodes.push(n);ids[k]=n.id;};
  add('netz',0,150);add('hak',168,150);add('sls',312,150);add('zaehler',456,145);add('uv',624,144);
  add('load',468,300);add('pvwr',612,312);add('pvgen',613,432);add('multi',792,290);add('battery',960,438);
  const w=(fn,fp,tn,tp)=>state.wires.push({id:'w'+(state.seq++),from:{node:ids[fn],port:fp},to:{node:ids[tn],port:tp}});
  w('netz','out','hak','in');w('hak','out','sls','in');w('sls','out','zaehler','in');w('zaehler','out','uv','in');
  w('uv','b','load','ac');
  render();fit();
}

/* ---------------- init ---------------- */
buildPalette();
applyView();
if(loadAutosave()){render();}else{seed();}
inspector();
updateUndo();
