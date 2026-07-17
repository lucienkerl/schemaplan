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
const KINDCOL={ac:'#e5ab45',dc:'#4aa8ec',sig:'#6fdc8c'};

/* ---------------- state ---------------- */
let state={nodes:[],wires:[],seq:1};
let view={x:120,y:80,k:1};
let sel=null;        // {type:'node'|'wire', id}
let history=[], future=[];

/* ---------------- dom refs ---------------- */
const SVG=el('svg'), VP=el('viewport'), gNodes=el('nodes'), gWires=el('wires'), gTemp=el('tempwire');
const hint=el('hint'), toast=el('toast');

/* ---------------- history ---------------- */
function snapshot(){return JSON.stringify({nodes:state.nodes,wires:state.wires,seq:state.seq});}
function pushHistory(){history.push(snapshot());if(history.length>100)history.shift();future=[];updateUndo();}
function restore(s){const o=JSON.parse(s);state.nodes=o.nodes;state.wires=o.wires;state.seq=o.seq;sel=null;render();inspector();}
function undo(){if(!history.length)return;future.push(snapshot());restore(history.pop());updateUndo();showToast('Rückgängig');}
function redo(){if(!future.length)return;history.push(snapshot());restore(future.pop());updateUndo();showToast('Wiederholt');}
function updateUndo(){el('undo').disabled=!history.length;el('redo').disabled=!future.length;}
el('undo').onclick=undo;
el('redo').onclick=redo;

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
      d.innerHTML=`<span class="dot" style="background:${c.color}"></span>${c.name}`;
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
function addNode(key,wx,wy){
  pushHistory();
  const c=LIB[key];
  if(wx==null){const r=SVG.getBoundingClientRect();const p=toWorld(r.left+r.width/2,r.top+r.height/2);wx=p.x-c.w/2;wy=p.y-c.h/2;}
  const fields={};c.fields.forEach(f=>fields[f[0]]=f[2]);
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
    const g=mk('g',{transform:`translate(${n.x},${n.y})`,class:'node'});
    g.dataset.id=n.id;
    if(sel&&sel.type==='node'&&sel.id===n.id)g.classList.add('sel');
    const strokeW=(sel&&sel.type==='node'&&sel.id===n.id)?2.4:1.4;

    g.appendChild(mk('rect',{class:'node-body',width:c.w,height:c.h,rx:7,fill:'#141922',
      stroke:c.color,'stroke-width':strokeW}));
    g.appendChild(mk('rect',{width:c.w,height:3,rx:1.5,fill:c.color,opacity:.9}));

    const t1=mk('text',{class:'node-label',x:c.w/2,y:19,'text-anchor':'middle'});
    t1.textContent=n.fields.name||c.name;g.appendChild(t1);
    const subs=c.fields.filter(f=>f[0]!=='name').map(f=>n.fields[f[0]]).filter(v=>v&&v.trim());
    subs.slice(0,2).forEach((s,i)=>{
      const t=mk('text',{class:'node-sub',x:c.w/2,y:34+i*11,'text-anchor':'middle'});
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
    html+=`<div class="field"><label>${f[1]}</label><input data-k="${f[0]}" value="${(n.fields[f[0]]||'').replace(/"/g,'&quot;')}"></div>`;
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
function selectItem(s){sel=s;render();inspector();}

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
let drag=null,wiring=null,panning=null,space=false,moved=false;

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
  if((e.key==='Delete'||e.key==='Backspace')&&sel&&!typing){e.preventDefault();
    sel.type==='wire'?removeWire(sel.id):removeNode(sel.id);}
  if(e.key==='Escape'){closeCtx();selectItem(null);}
});
window.addEventListener('keyup',e=>{if(e.code==='Space'){space=false;SVG.classList.remove('panready');}});

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
  if(confirm('Alle Bausteine und Verbindungen löschen?')){pushHistory();
    state.nodes=[];state.wires=[];sel=null;render();inspector();showToast('Zeichenfläche geleert');}
};

/* ---------------- save / load ---------------- */
el('save').onclick=()=>{dl(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'schaltplan.json');showToast('JSON gespeichert');};
el('load').onclick=()=>{
  const inp=document.createElement('input');inp.type='file';inp.accept='.json';
  inp.onchange=()=>{const f=inp.files[0];const rd=new FileReader();
    rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!o.nodes)throw 0;pushHistory();
      state=o;sel=null;render();inspector();fit();showToast('Geladen');}catch(_){alert('Ungültige Datei.');}};
    rd.readAsText(f);};inp.click();
};

/* ---------------- export ---------------- */
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
  const add=(k,x,y)=>{const c=LIB[k];const fields={};c.fields.forEach(f=>fields[f[0]]=f[2]);
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
inspector();
updateUndo();
seed();
