"use strict";

// ══════════════════════════════════════
// ROSE DESIGNS — For Rose
// ══════════════════════════════════════

function uid(){return Date.now().toString(36)+Math.random().toString(36).substr(2,8)}

// ── STUB: findEgg removed — no longer part of the product ──
function findEgg() {}
async function loadEggs() {}

// ── FURNITURE LABEL RESOLVER ──
// Normalizes labels so "Queen Bed", "king bed", "My Bed" all resolve to 'bed'
function resolveLabel(raw) {
  const s = (raw || '').toLowerCase().trim();
  const map = [
    {keys: ['sofa','couch','loveseat','settee','sectional','divan'], type: 'sofa'},
    {keys: ['bed','king bed','queen bed','twin bed','daybed','crib'], type: 'bed'},
    {keys: ['table','coffee table','end table','side table','dining table','console'], type: 'table'},
    {keys: ['desk','writing desk','office desk','work desk'], type: 'desk'},
    {keys: ['chair','armchair','accent chair','dining chair','rocking chair','stool','ottoman'], type: 'chair'},
    {keys: ['lamp','floor lamp','table lamp','standing lamp','light','sconce'], type: 'lamp'},
    {keys: ['plant','tree','fern','succulent','fiddle','pothos','monstera'], type: 'plant'},
    {keys: ['rug','carpet','mat','runner'], type: 'rug'},
    {keys: ['bookshelf','shelf','shelves','bookcase','cabinet','dresser','wardrobe','armoire','tv console','console','nightstand'], type: 'storage'},
    {keys: ['mirror'], type: 'mirror'},
    {keys: ['curtain','drape','blinds'], type: 'curtain'},
    {keys: ['base cabinet','upper cabinet','kitchen cabinet'], type: 'cabinet'},
    {keys: ['refrigerator','fridge'], type: 'fridge'},
    {keys: ['gas range','stove','range hood'], type: 'stove'},
    {keys: ['kitchen sink','sink'], type: 'sink'},
    {keys: ['kitchen island','island'], type: 'island'},
    {keys: ['single vanity','double vanity','vanity'], type: 'vanity'},
    {keys: ['toilet'], type: 'toilet'},
    {keys: ['bathtub','tub'], type: 'tub'},
    {keys: ['shower'], type: 'shower'},
  ];
  for (const entry of map) {
    for (const k of entry.keys) {
      if (s === k || s.includes(k)) return entry.type;
    }
  }
  return 'generic';
}
function inferAssetKey(label,mountType){
  const s=(label||'').toLowerCase();
  if(s.includes('small sofa'))return 'sofa_small';
  if(s.includes('large sofa'))return 'sofa_large';
  if(s.includes('modern sofa'))return 'sofa_modern';
  if(s.includes('compact sofa'))return 'sofa_compact';
  if(s.includes('grand sofa'))return 'sofa_grand';
  if(s.includes('sofa medium'))return 'sofa_medium';
  if(s.includes('sectional'))return 'sofa_l';
  if(s.includes('king bed'))return 'bed_king';
  if(s.includes('twin bed'))return 'bed_twin';
  if(s.includes('bunk bed'))return 'bunk_bed';
  if(s.includes('round dining table'))return 'table_round_large';
  if(s.includes('round side table'))return 'table_round_small';
  if(s.includes('runner rug'))return 'runner_rug';
  if(s.includes('round rug'))return 'rug_round';
  if(s.includes('ceiling light'))return 'lamp_ceiling';
  if(s.includes('chandelier'))return 'lamp_chandelier';
  if(s.includes('table lamp'))return 'lamp_table';
  if(s.includes('stand lamp'))return 'lamp_stand';
  if(s.includes('office chair'))return 'chair_office';
  if(s.includes('bookcase with books'))return 'bookcase_books';
  if(s.includes('alt nightstand'))return 'nightstand_alt';
  if(s.includes('tall dresser'))return 'dresser_tall';
  if(s.includes('low console'))return 'console_low';
  if(s.includes('cube light'))return 'lamp_cube';
  if(s.includes('pendant light'))return 'lamp_pendant';
  if(s.includes('leafy plant'))return 'plant_leafy';
  if(s.includes('palm plant'))return 'plant_palm';
  if(s.includes('round plant'))return 'plant_round';
  if(s.includes('small shelf'))return 'shelf_small';
  if(s.includes('fireplace'))return 'fireplace';
  if(s.includes('cactus'))return 'plant_cactus';
  if(s.includes('wall art'))return ['wall_art_01','wall_art_04','wall_art_06'][Math.abs(hashCode(label))%3];
  if(s.includes('curtain'))return 'curtains';
  if(s.includes('blind'))return 'blinds';
  if(s.includes('lamp')&&mountType==='wall')return 'lamp_wall';
  if(s.includes('lamp'))return 'lamp_floor';
  if(s.includes('plant')&&s.includes('shelf'))return 'plant_small';
  if(s.includes('plant'))return 'plant_floor';
  if(s.includes('nightstand'))return 'nightstand';
  if(s.includes('dresser'))return 'dresser';
  if(s.includes('tv console'))return 'tv_console';
  if(s.includes('bookshelf'))return 'bookshelf';
  if(s.includes('dining table'))return 'dining_table';
  if(s.includes('bench'))return 'bench';
  if(s.includes('shelf'))return 'shelving';
  if(s.includes('mirror'))return 'mirror';
  if(s.includes('rug'))return 'rug';
  const type=resolveLabel(label);
  return {
    sofa:'sofa',
    bed:'bed',
    table:'table_coffee',
    desk:'desk',
    chair:'chair',
    mirror:'mirror',
    rug:'rug',
    storage:'cabinet',
  }[type]||null;
}
function defaultElevation(mountType, assetKey, type){
  if(assetKey==='wall_art_01'||assetKey==='wall_art_04'||assetKey==='wall_art_06')return 5.2;
  if(assetKey==='mirror')return 5;
  if(assetKey==='lamp_wall')return 5.8;
  if(assetKey==='lamp_table')return 2.8;
  if(assetKey==='lamp_chandelier')return curRoom?.height?Math.max(7.2,curRoom.height-.6):8.4;
  if(assetKey==='curtains')return 7.2;
  if(assetKey==='shelving')return 5.5;
  if(assetKey==='plant_small')return 2.9;
  if(mountType==='wall')return 5;
  if(type==='lamp')return 0;
  return 0;
}
function axisYawOffset(axis){
  return ({'+z':0,'-z':Math.PI,'+x':Math.PI/2,'-x':-Math.PI/2}[axis||'+z'])||0;
}
function hashCode(str){
  let h=0;
  for(let i=0;i<str.length;i++)h=((h<<5)-h)+str.charCodeAt(i)|0;
  return h;
}

// ── WALK COLLISION SYSTEM ──
// Tests if a point is inside the room polygon (2D, using ray casting)
function pointInPolygon(px, pz, polygon) {
  // px = world x, pz = world z (negated y in 3D coords)
  const py = -pz; // convert back to 2D y
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Check if position collides with any closet
function collidesWithStructure(px, pz, room) {
  const py = -pz;
  for (const st of room.structures) {
    if (st.type === 'closet' && st.rect) {
      const margin = 0.5;
      if (px >= st.rect.x - margin && px <= st.rect.x + st.rect.w + margin &&
          py >= st.rect.y - margin && py <= st.rect.y + st.rect.h + margin) {
        return true;
      }
    }
  }
  return false;
}

// Check if position is near a door opening (allows walking through doors between rooms)
function nearDoorOpening(px, pz, room, radius=1.8) {
  const py = -pz;
  for (const op of room.openings) {
    if (op.type !== 'door') continue;
    const wall = room.walls.find(w => w.id === op.wallId);
    if (!wall) continue;
    const a = wS(room, wall), b = wE(room, wall);
    const wl = wL(room, wall), t = op.offset / wl;
    const dx = a.x + (b.x - a.x) * t, dy = a.y + (b.y - a.y) * t;
    if (Math.hypot(px - dx, py - dy) < radius + (op.width || 3) / 2) return true;
  }
  return false;
}

// Clamp walk position: must be inside polygon or near a door opening, and not inside structures
function clampWalkPos(newX, newZ, room) {
  const inside = pointInPolygon(newX, newZ, room.polygon);
  if (!inside) {
    // Allow walking slightly outside polygon near door openings (hallway transitions)
    if (!nearDoorOpening(newX, newZ, room, 2.5)) return false;
  }
  if (collidesWithStructure(newX, newZ, room)) return false;
  return true;
}
function findWalkStart(room){
  const focus=getRoomFocus(room);
  const candidates=[
    {x:focus.x,z:-focus.y},
    {x:focus.x,z:-focus.y+1.4},
    {x:focus.x,z:-focus.y-1.4},
    {x:focus.x+1.4,z:-focus.y},
    {x:focus.x-1.4,z:-focus.y},
    {x:focus.x+2.4,z:-focus.y+1.6},
    {x:focus.x-2.4,z:-focus.y-1.6}
  ];
  for(const pt of candidates)if(clampWalkPos(pt.x,pt.z,room))return pt;
  const b=getRoomBounds2D(room);
  for(let i=0;i<18;i++){
    const x=b.x0+.9+((b.width-1.8)*(i%6)/5);
    const y=b.y0+.9+((b.height-1.8)*(Math.floor(i/6))/2);
    if(clampWalkPos(x,-y,room))return{x,z:-y};
  }
  return{x:focus.x,z:-focus.y};
}
function applyWalkInputStep(){
  if(camMode!=='walk'||!curRoom)return;
  if(activeTurnDir)cYaw+=activeTurnDir*.07;
  if(activeWalkDir){
    const sp=.34,vx=Math.sin(cYaw)*sp*activeWalkDir,vz=-Math.cos(cYaw)*sp*activeWalkDir,nx=fpPos.x+vx,nz=fpPos.z+vz;
    if(clampWalkPos(nx,nz,curRoom)){fpPos.x=nx;fpPos.z=nz}
  }
}
function bindWalkKeys(){
  if(window.__roseWalkKeysBound)return;
  const keyDir=key=>{
    if(key==='arrowup'||key==='w')return{walk:1,turn:0};
    if(key==='arrowdown'||key==='s')return{walk:-1,turn:0};
    if(key==='arrowleft'||key==='a')return{walk:0,turn:-1};
    if(key==='arrowright'||key==='d')return{walk:0,turn:1};
    return null;
  };
  window.addEventListener('keydown',e=>{
    const d=keyDir((e.key||'').toLowerCase());
    if(!d||camMode!=='walk'||!is3D)return;
    e.preventDefault();
    if(d.walk)activeWalkDir=d.walk;
    if(d.turn)activeTurnDir=d.turn;
  });
  window.addEventListener('keyup',e=>{
    const d=keyDir((e.key||'').toLowerCase());
    if(!d)return;
    if(d.walk&&activeWalkDir===d.walk)activeWalkDir=0;
    if(d.turn&&activeTurnDir===d.turn)activeTurnDir=0;
  });
  window.addEventListener('blur',()=>{activeWalkDir=0;activeTurnDir=0});
  window.__roseWalkKeysBound=true;
}
function bindEditorKeys(){
  if(window.__roseEditorKeysBound)return;
  window.addEventListener('keydown',e=>{
    if(isEditableTarget(e.target))return;
    const key=(e.key||'').toLowerCase();
    const mod=e.metaKey||e.ctrlKey;
    if(mod&&key==='c'&&curRoom&&selectedFurnitureIndices().length){
      e.preventDefault();
      copySelectedFurniture();
      return;
    }
    if(mod&&key==='v'&&curRoom&&furnitureClipboard?.items?.length){
      e.preventDefault();
      pasteFurniture();
      return;
    }
    if(mod&&key==='z'){
      e.preventDefault();
      if(e.shiftKey)doRedo();
      else doUndo();
      return;
    }
    if(mod&&key==='s'&&!e.shiftKey){
      e.preventDefault();
      if(curRoom)savePrj();
      return;
    }
    if(mod&&e.shiftKey&&key==='s'){
      e.preventDefault();
      if(curRoom)exportSVG();
      return;
    }
    if(mod&&key==='p'){
      e.preventDefault();
      if(curRoom)exportPDF();
      return;
    }
    if(mod&&e.shiftKey&&key==='q'){
      e.preventDefault();
      if(curRoom)autoSquareCurrentRoom();
      return;
    }
    if(key==='tab'&&curRoom){
      e.preventDefault();
      toggle3D();
      return;
    }
    if((key==='?'||(key==='/'&&e.shiftKey))&&!mod){
      e.preventDefault();
      if(typeof toggleShortcutSheet==='function')toggleShortcutSheet();
      return;
    }
    if(key==='escape'){
      const sheet=document.getElementById('shortcutSheet');
      if(sheet&&sheet.classList.contains('on')){sheet.classList.remove('on');e.preventDefault();return}
    }
    if(key==='v'&&!mod&&curRoom){
      e.preventDefault();
      setTool('select');
      return;
    }
    if(key==='w'&&!mod&&curRoom){
      e.preventDefault();
      setTool('wall');
      return;
    }
    if(key==='d'&&!mod&&curRoom){
      e.preventDefault();
      setTool(e.shiftKey?'dim':'door');
      return;
    }
    if(key==='t'&&!mod&&curRoom){
      e.preventDefault();
      setTool('annotation');
      return;
    }
    if((key==='+'||key==='='||key==='-')&&!mod&&canvas){
      e.preventDefault();
      const factor=(key==='-'?0.9:1.1);
      const cx=canvas.width/2,cy=canvas.height/2;
      const before=tW(cx,cy);
      vScale=Math.max(8,Math.min(140,vScale*factor));
      vOff.x=cx-before.x*vScale;
      vOff.y=cy-before.y*vScale;
      draw();
      return;
    }
    if(mod&&key==='y'&&!e.shiftKey){
      e.preventDefault();
      doRedo();
      return;
    }
    if((key==='delete'||key==='backspace')&&curRoom&&sel.type==='furniture'){
      e.preventDefault();
      deleteSelectedFurniture();
      return;
    }
    if(key==='escape'&&curRoom){
      e.preventDefault();
      clearFurnitureSelection();
      sel={type:null,idx:-1};
      panelHidden=false;
      draw();
      showP();
    }
  });
  window.__roseEditorKeysBound=true;
}
// ── MEASUREMENT HELPERS ──
let showMeasurements=true;
function toggleMeasurements(){showMeasurements=!showMeasurements;document.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',b.dataset.t==='measure'&&showMeasurements));draw()}
function polygonArea(polygon){
  let area=0;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++)area+=(polygon[j].x+polygon[i].x)*(polygon[j].y-polygon[i].y);
  return Math.abs(area/2);
}
function fmtFt(v){const ft=Math.floor(v),inch=Math.round((v-ft)*12);return inch>=12?`${ft+1}'`:(inch>0?`${ft}' ${inch}"`:`${ft}'`)}
function distanceLabel(){return unitSystem==='metric'?'m':'ft'}
function areaLabel(){return unitSystem==='metric'?'sq m':'sq ft'}
function toDisplayDistance(feet){return unitSystem==='metric'?feet*FEET_TO_METERS:feet}
function fromDisplayDistance(value){return unitSystem==='metric'?value/FEET_TO_METERS:value}
function formatDistance(feet,mode='friendly'){
  if(unitSystem==='metric'){
    const meters=toDisplayDistance(feet);
    const digits=mode==='compact'?1:2;
    return `${meters.toFixed(digits)} m`;
  }
  if(mode==='compact')return `${feet.toFixed(1)}'`;
  return fmtFt(feet);
}
function formatArea(areaSqFt){
  return unitSystem==='metric'
    ? `${(areaSqFt*SQFT_TO_SQM).toFixed(1)} sq m`
    : `${areaSqFt.toFixed(0)} sq ft`;
}
function distanceInputValue(feet,digits=2){
  const value=toDisplayDistance(feet);
  return Number(value.toFixed(digits)).toString();
}
function distanceInputStep(baseFeet=.5){
  return unitSystem==='metric'
    ? Math.max(.05,Number((baseFeet*FEET_TO_METERS).toFixed(2)))
    : baseFeet;
}
function parseDistanceInput(value,fallback=0){
  const parsed=parseFloat(value);
  if(!Number.isFinite(parsed))return fallback;
  return fromDisplayDistance(parsed);
}
function snapFurnitureValue(value){return Math.round(value/FURNITURE_GRID)*FURNITURE_GRID}
let lastPlanSnapState=null;
let lastFurnitureSnapState=null;
function distancePoint(a,b){return Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0))}
function closestPointOnSegment(point,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  if(!len)return{x:a.x,y:a.y,t:0,distance:distancePoint(point,a)};
  const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/len));
  const x=a.x+dx*t,y=a.y+dy*t;
  return {x,y,t,distance:Math.hypot(point.x-x,point.y-y)};
}
function lineIntersection(a1,a2,b1,b2){
  const dax=a2.x-a1.x,day=a2.y-a1.y,dbx=b2.x-b1.x,dby=b2.y-b1.y;
  const den=dax*dby-day*dbx;
  if(Math.abs(den)<1e-6)return null;
  const u=((b1.x-a1.x)*day-(b1.y-a1.y)*dax)/den;
  const t=((b1.x-a1.x)*dby-(b1.y-a1.y)*dbx)/den;
  if(t<0||t>1||u<0||u>1)return null;
  return {x:a1.x+t*dax,y:a1.y+t*day};
}
function collectPlanSnapTargets(room=curRoom){
  if(!room)return {points:[],lines:[]};
  const points=[...(room.polygon||[])];
  const lines=(room.walls||[]).map(w=>({a:wS(room,w),b:wE(room,w),kind:'wall'}));
  (room.structures||[]).forEach(st=>{
    if(st?.line){
      lines.push({a:st.line.a,b:st.line.b,kind:'partition'});
      points.push(st.line.a,st.line.b);
    }else if(st?.rect){
      const pts=[
        {x:st.rect.x,y:st.rect.y},
        {x:st.rect.x+st.rect.w,y:st.rect.y},
        {x:st.rect.x+st.rect.w,y:st.rect.y+st.rect.h},
        {x:st.rect.x,y:st.rect.y+st.rect.h}
      ];
      points.push(...pts);
      lines.push(
        {a:pts[0],b:pts[1],kind:'structure'},
        {a:pts[1],b:pts[2],kind:'structure'},
        {a:pts[2],b:pts[3],kind:'structure'},
        {a:pts[3],b:pts[0],kind:'structure'}
      );
    }
  });
  return {points,lines};
}
function resolvePlanSnap(point,room=curRoom,opts={}){
  const snapGrid=opts.snapGrid!==false;
  const pointTol=opts.pointTolerance??0.6;
  const lineTol=opts.lineTolerance??0.45;
  const gridTol=opts.gridTolerance??0.22;
  const axisTol=opts.axisTolerance??0.4;
  let best={type:'free',point:{x:point.x,y:point.y},distance:Infinity};
  const guides=[];
  const {points,lines}=collectPlanSnapTargets(room);
  points.forEach(target=>{
    const d=distancePoint(point,target);
    if(d<best.distance&&d<=pointTol)best={type:'point',point:{x:target.x,y:target.y},distance:d,target};
  });
  const intersections=[];
  for(let i=0;i<lines.length;i++){
    for(let j=i+1;j<lines.length;j++){
      const hit=lineIntersection(lines[i].a,lines[i].b,lines[j].a,lines[j].b);
      if(hit)intersections.push(hit);
    }
  }
  intersections.forEach(target=>{
    const d=distancePoint(point,target);
    if(d<best.distance&&d<=pointTol*1.15)best={type:'intersection',point:{x:target.x,y:target.y},distance:d,target};
  });
  if(best.type==='free'){
    lines.forEach(line=>{
      const proj=closestPointOnSegment(point,line.a,line.b);
      if(proj.distance<best.distance&&proj.distance<=lineTol)best={type:'line',point:{x:proj.x,y:proj.y},distance:proj.distance,line};
    });
  }
  let snapped={x:point.x,y:point.y};
  if(best.type!=='free')snapped={...best.point};
  if(snapGrid){
    const gx=snapFurnitureValue(snapped.x),gy=snapFurnitureValue(snapped.y);
    if(Math.abs(gx-snapped.x)<=gridTol)snapped.x=gx;
    if(Math.abs(gy-snapped.y)<=gridTol)snapped.y=gy;
  }
  points.forEach(target=>{
    if(Math.abs(target.x-snapped.x)<=axisTol){
      guides.push({type:'axis-x',x:target.x});
      snapped.x=target.x;
    }
    if(Math.abs(target.y-snapped.y)<=axisTol){
      guides.push({type:'axis-y',y:target.y});
      snapped.y=target.y;
    }
  });
  if(best.type==='line'&&best.line)guides.push({type:'segment',a:best.line.a,b:best.line.b});
  if(best.type==='point'||best.type==='intersection')guides.push({type:'point',x:snapped.x,y:snapped.y});
  lastPlanSnapState={source:best.type,guides,point:snapped};
  return {x:Math.round(snapped.x*2)/2,y:Math.round(snapped.y*2)/2,state:lastPlanSnapState};
}
// Phase ✨ — Snap pulses: when furniture snaps to another piece's edge/center, record a
// short-lived pulse coord for draw() to render as a fading highlight ring.
if(typeof window!=='undefined'&&!window._snapPulses)window._snapPulses=[];
function _recordSnapPulse(x,z){
  if(typeof window==='undefined')return;
  window._snapPulses.push({x,z,t:performance.now()});
  if(window._snapPulses.length>6)window._snapPulses.shift();
}
function snapFurniturePoint(x,z){
  if(!furnitureSnap){lastFurnitureSnapState=null;return{x,z};}
  const ALIGN_TOL=0.35;
  let sx=x,sz=z,bestX=ALIGN_TOL,bestZ=ALIGN_TOL;
  let alignedX=false,alignedZ=false;
  const guides=[];
  try{
    const list=(typeof curRoom!=='undefined'&&curRoom&&curRoom.furniture)||[];
    const sel=typeof window!=='undefined'?window.sel:null;
    const skipIdx=(sel&&sel.type==='furniture')?sel.idx:-1;
    list.forEach((f,i)=>{
      if(i===skipIdx||!f||f.locked)return;
      const hw=(f.w||0)/2,hd=(f.d||0)/2;
      [f.x,f.x-hw,f.x+hw].forEach(tx=>{const d=Math.abs(tx-x);if(d<bestX){bestX=d;sx=tx;alignedX=true}});
      [f.z,f.z-hd,f.z+hd].forEach(tz=>{const d=Math.abs(tz-z);if(d<bestZ){bestZ=d;sz=tz;alignedZ=true}});
    });
    (curRoom?.polygon||[]).forEach(pt=>{
      const dx=Math.abs(pt.x-x),dz=Math.abs(pt.y-z);
      if(dx<bestX){bestX=dx;sx=pt.x;alignedX=true}
      if(dz<bestZ){bestZ=dz;sz=pt.y;alignedZ=true}
    });
  }catch(_){}
  if(bestX>=ALIGN_TOL)sx=snapFurnitureValue(x);
  if(bestZ>=ALIGN_TOL)sz=snapFurnitureValue(z);
  if(alignedX)guides.push({type:'axis-x',x:sx});
  if(alignedZ)guides.push({type:'axis-y',y:sz});
  lastFurnitureSnapState=guides.length?{x:sx,z:sz,guides}:null;
  if(alignedX||alignedZ)_recordSnapPulse(sx,sz);
  return{x:sx,z:sz};
}
function editorPrefs(){
  return{
    furnitureSnap,
    multiSelectMode,
    unitSystem
  };
}
const PROFILE_LOCAL_KEY='rose_active_profile';
const PROFILE_LABELS={rose:"Rose's Space",marco:"Marco's Space"};
let activeProfile='rose';
function storageKey(key,{global=false}={}){
  return global?`rose_global::${key}`:`rose_profile::${activeProfile}::${key}`;
}
function getLocal(key,{global=false}={}){
  try{return localStorage.getItem(storageKey(key,{global}));}catch(e){return null}
}
function setLocal(key,val,{global=false}={}){
  try{localStorage.setItem(storageKey(key,{global}),val)}catch(e){}
}
function saveEditorPrefs(){
  try{setLocal('editor_prefs',JSON.stringify(editorPrefs()))}catch(e){}
}
function loadEditorPrefs(){
  try{
    const raw=getLocal('editor_prefs');
    if(!raw)return;
    const prefs=JSON.parse(raw);
    furnitureSnap=prefs?.furnitureSnap!==false;
    multiSelectMode=!!prefs?.multiSelectMode;
    unitSystem=prefs?.unitSystem==='metric'?'metric':'imperial';
  }catch(e){}
}
function historyKey(roomId){return `${ROOM_HISTORY_PREFIX}${roomId}`}
function roomSnapshot(room=curRoom){
  if(!room)return null;
  return JSON.stringify({
    polygon:room.polygon,
    walls:room.walls,
    openings:room.openings,
    structures:room.structures,
    furniture:room.furniture,
    dimensionAnnotations:room.dimensionAnnotations,
    textAnnotations:room.textAnnotations,
    materials:room.materials,
    height:room.height,
    wallThickness:room.wallThickness,
    roomType:room.roomType,
    designPreset:room.designPreset,
    mood:room.mood,
    existingRoomMode:room.existingRoomMode,
    hideRemovedExisting:room.hideRemovedExisting,
    ghostExisting:room.ghostExisting,
    planViewMode:room.planViewMode,
    showPlanLegend:room.showPlanLegend,
    layerVisibility:room.layerVisibility,
    baseRoomId:room.baseRoomId,
    optionName:room.optionName,
    optionNotes:room.optionNotes,
    referenceOverlay:room.referenceOverlay,
    previewThumb:room.previewThumb
  });
}
function collectRoomPlanStats(room){
  const stats={existing:0,newItems:0,keep:0,move:0,replace:0,remove:0,paired:0};
  (room?.furniture||[]).forEach(item=>{
    if(item.source==='existing'){
      stats.existing++;
      if(stats[item.redesignAction]!==undefined)stats[item.redesignAction]++;
      if(item.replacementId)stats.paired++;
    }else stats.newItems++;
  });
  return stats;
}
function updateRoomPreviewThumb(room=curRoom){
  if(!room||!room.polygon?.length)return;
  try{
    room.previewThumb=renderRoomModeToDataURL(room,'combined',280,180,{legend:false,measurements:false})||room.previewThumb||'';
  }catch(_){}
}
function syncCurrentRoomRecord(announce=false){
  if(!curRoom)return;
  updateRoomPreviewThumb(curRoom);
  curRoom.updatedAt=Date.now();
  const i=projects.findIndex(p=>p.id===curRoom.id);
  if(i>=0)projects[i]=curRoom;
  saveAll();
  if(announce)toast('Saved');
}
function persistRoomHistory(){
  if(!curRoom)return;
  ds(historyKey(curRoom.id),{undo:[...undoSt],redo:[...redoSt]});
  syncCurrentRoomRecord(false);
}
async function restoreRoomHistory(room){
  const current=roomSnapshot(room);
  const saved=await dg(historyKey(room.id));
  if(saved&&Array.isArray(saved.undo)&&saved.undo.length&&saved.undo[saved.undo.length-1]===current){
    undoSt=saved.undo.slice(-50);
    redoSt=Array.isArray(saved.redo)?saved.redo.slice(-50):[];
    return;
  }
  undoSt=current?[current]:[];
  redoSt=[];
  persistRoomHistory();
}
function isEditableTarget(target){
  if(!target)return false;
  const tag=(target.tagName||'').toLowerCase();
  return target.isContentEditable||tag==='input'||tag==='textarea'||tag==='select';
}
function drawDimLine(ctx,ax,ay,bx,by,offset,label){
  const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);if(len<2)return;
  const nx=-dy/len,ny=dx/len,ox=nx*offset,oy=ny*offset;
  ctx.save();ctx.strokeStyle='rgba(142,110,107,.55)';ctx.lineWidth=1;ctx.setLineDash([]);
  // extension lines
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax+ox,ay+oy);ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+ox,by+oy);ctx.stroke();
  // dimension line
  const mx=ax+ox,my=ay+oy,ex=bx+ox,ey=by+oy;
  ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(ex,ey);ctx.stroke();
  // tick marks
  const tk=4;
  ctx.beginPath();ctx.moveTo(mx-nx*tk,my-ny*tk);ctx.lineTo(mx+nx*tk,my+ny*tk);ctx.stroke();
  ctx.beginPath();ctx.moveTo(ex-nx*tk,ey-ny*tk);ctx.lineTo(ex+nx*tk,ey+ny*tk);ctx.stroke();
  // label
  const cmx=(mx+ex)/2,cmy=(my+ey)/2;
  ctx.fillStyle='rgba(142,110,107,.85)';ctx.font='600 10px Outfit,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  let ang=Math.atan2(dy,dx);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;
  ctx.save();ctx.translate(cmx,cmy);ctx.rotate(ang);
  ctx.fillStyle='rgba(250,247,242,.85)';ctx.fillRect(-label.length*3.4-4,-8,label.length*6.8+8,16);
  ctx.fillStyle='rgba(142,110,107,.85)';ctx.fillText(label,0,0);
  ctx.restore();ctx.restore();
}
function drawArrowTick(ctx,x,y,nx,ny,size=6){
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x+nx*size-ny*size*.6,y+ny*size+nx*size*.6);
  ctx.moveTo(x,y);
  ctx.lineTo(x+nx*size+ny*size*.6,y+ny*size-nx*size*.6);
  ctx.stroke();
}

function getRoomBounds2D(room){
  const pts=[...(room?.polygon||[])].map(p=>({x:p.x,y:p.y}));
  (room?.furniture||[]).forEach(f=>{
    const hw=(f.w||2)/2,hd=(f.d||1.5)/2,an=(f.rotation||0)*Math.PI/180;
    [[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].forEach(([dx,dz])=>{
      pts.push({x:f.x+dx*Math.cos(an)-dz*Math.sin(an),y:f.z+dx*Math.sin(an)+dz*Math.cos(an)});
    });
  });
  (room?.structures||[]).forEach(st=>{
    if(st.rect){
      pts.push({x:st.rect.x,y:st.rect.y},{x:st.rect.x+st.rect.w,y:st.rect.y},{x:st.rect.x+st.rect.w,y:st.rect.y+st.rect.h},{x:st.rect.x,y:st.rect.y+st.rect.h});
    }
  });
  if(!pts.length)return {x0:0,y0:0,x1:12,y1:10,width:12,height:10,cx:6,cy:5,maxD:6};
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  pts.forEach(p=>{x0=Math.min(x0,p.x);y0=Math.min(y0,p.y);x1=Math.max(x1,p.x);y1=Math.max(y1,p.y)});
  const cx=(x0+x1)/2,cy=(y0+y1)/2;
  return {x0,y0,x1,y1,width:x1-x0,height:y1-y0,cx,cy,maxD:Math.max((x1-x0)/2,(y1-y0)/2)};
}
function getRoomFocus(room){
  const b=getRoomBounds2D(room);
  return {x:b.cx,y:b.cy,maxD:Math.max(b.maxD,4.5),width:b.width,height:b.height};
}

// ── DOMAIN MODEL ──
function genWalls(room){
  const prev=Array.isArray(room?.walls)?room.walls:[];
  const p=room.polygon,w=[];
  const keyFor=(a,b)=>`${a.x},${a.y}|${b.x},${b.y}`;
  const prevMap=new Map(prev.map(wall=>{
    const a=room.polygon?.[wall.startIdx],b=room.polygon?.[wall.endIdx];
    return a&&b?[keyFor(a,b),wall]:null;
  }).filter(Boolean));
  for(let i=0;i<p.length;i++){
    const n=(i+1)%p.length,a=p[i],b=p[n],match=prevMap.get(keyFor(a,b));
    w.push({id:match?.id||uid(),startIdx:i,endIdx:n,thickness:room.wallThickness||.5});
  }
  return w;
}
// Phase 5A — Polygon auto-cleanup / auto-square (spiritual equivalent of room auto-detect,
// adapted to Rose Designs' polygon-based room model). Call on demand from UI.
function autoSquareRoom(room,opts={}){
  if(!room||!Array.isArray(room.polygon)||room.polygon.length<3)return{changed:false,reason:'no polygon'};
  const angleTol=opts.angleTol||8*Math.PI/180; // 8 degrees
  const mergeTol=opts.mergeTol||0.15;           // feet
  const gapTol  =opts.gapTol  ||0.4;            // feet
  const poly=room.polygon.map(p=>({x:p.x,y:p.y}));
  let changed=false;
  // 1. Close small gap between first and last point
  if(poly.length>=3){
    const a=poly[0],b=poly[poly.length-1];
    if(Math.hypot(a.x-b.x,a.y-b.y)<gapTol&&(a.x!==b.x||a.y!==b.y)){poly[poly.length-1]={x:a.x,y:a.y};changed=true}
  }
  // 2. Snap each wall direction to nearest 0/90/180/270 if within angleTol
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length];
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
    if(len<0.01)continue;
    const ang=Math.atan2(dy,dx);
    const quads=[0,Math.PI/2,Math.PI,-Math.PI/2,-Math.PI];
    let best=ang,bd=angleTol;
    quads.forEach(q=>{const d=Math.abs(((ang-q)+Math.PI*3)%(Math.PI*2)-Math.PI);if(d<bd){bd=d;best=q}});
    if(best!==ang){
      const nx=a.x+Math.cos(best)*len,ny=a.y+Math.sin(best)*len;
      const rx=Math.round(nx*4)/4,ry=Math.round(ny*4)/4;
      if(Math.abs(b.x-rx)>0.001||Math.abs(b.y-ry)>0.001){b.x=rx;b.y=ry;changed=true}
    }
  }
  // 3. Merge near-collinear / near-duplicate vertices
  for(let i=poly.length-1;i>=0&&poly.length>3;i--){
    const prev=poly[(i-1+poly.length)%poly.length],cur=poly[i],next=poly[(i+1)%poly.length];
    if(Math.hypot(cur.x-prev.x,cur.y-prev.y)<mergeTol){poly.splice(i,1);changed=true;continue}
    // collinearity: cross product of (cur-prev) and (next-cur) near zero and same direction
    const ax=cur.x-prev.x,ay=cur.y-prev.y,bx=next.x-cur.x,by=next.y-cur.y;
    const cross=ax*by-ay*bx,dot=ax*bx+ay*by;
    if(Math.abs(cross)<0.02&&dot>0){poly.splice(i,1);changed=true}
  }
  if(!changed)return{changed:false,reason:'already clean'};
  room.polygon=poly;
  room.walls=genWalls(room);
  return{changed:true,vertices:poly.length};
}
function autoSquareCurrentRoom(){
  if(typeof curRoom==='undefined'||!curRoom){if(typeof toast==='function')toast('Open a room first');return}
  const res=autoSquareRoom(curRoom);
  if(typeof pushU==='function')pushU();
  if(typeof saveAll==='function')saveAll();
  if(typeof draw==='function')draw();
  if(typeof scheduleRebuild3D==='function')scheduleRebuild3D();
  if(typeof toast==='function')toast(res.changed?`Auto-squared room (${res.vertices} vertices)`:'Room already clean');
}
// Phase 5A (full) — Port of blueprint3d findRooms() graph algorithm.
// Takes an arbitrary set of wall segments [{x1,y1,x2,y2}, ...] and returns
// an array of room polygons (each an array of {x,y}) by walking the tightest
// counter-clockwise cycles in the shared-endpoint graph. CW cycles (outer
// boundary) and duplicates are discarded.
function findRoomsFromSegments(segments,opts={}){
  const snap=opts.snap||0.05; // feet — merge endpoints closer than this
  // 0. Split segments at any T-junction (endpoint of another segment lying on
  //    this segment's interior). Without this, an interior wall that meets an
  //    outer wall mid-span wouldn't share a graph vertex with it.
  const TOL=snap*2;
  function onSeg(px,py,s){
    const dx=s.x2-s.x1,dy=s.y2-s.y1,len2=dx*dx+dy*dy; if(len2<1e-9)return false;
    const t=((px-s.x1)*dx+(py-s.y1)*dy)/len2; if(t<=TOL/Math.sqrt(len2)||t>=1-TOL/Math.sqrt(len2))return false;
    const cx=s.x1+t*dx,cy=s.y1+t*dy;
    return Math.hypot(cx-px,cy-py)<TOL;
  }
  const allEndpoints=[];
  segments.forEach(s=>{allEndpoints.push([s.x1,s.y1],[s.x2,s.y2])});
  let work=segments.slice();
  let safety=0;
  let didSplit=true;
  while(didSplit&&safety++<50){
    didSplit=false;
    const out=[];
    for(const s of work){
      let splitAt=null;
      for(const [px,py] of allEndpoints){
        if(onSeg(px,py,s)){splitAt=[px,py];break}
      }
      if(splitAt){
        out.push({x1:s.x1,y1:s.y1,x2:splitAt[0],y2:splitAt[1]});
        out.push({x1:splitAt[0],y1:splitAt[1],x2:s.x2,y2:s.y2});
        didSplit=true;
      }else out.push(s);
    }
    work=out;
  }
  segments=work;
  // 1. Quantise + dedupe vertices
  const verts=[]; const vKey=new Map();
  function vId(x,y){
    const kx=Math.round(x/snap),ky=Math.round(y/snap);
    const k=kx+','+ky;
    if(vKey.has(k))return vKey.get(k);
    const id=verts.length; verts.push({x:kx*snap,y:ky*snap,adj:[]});
    vKey.set(k,id); return id;
  }
  // 2. Build undirected graph
  const edgeSet=new Set();
  for(const s of segments){
    const a=vId(s.x1,s.y1),b=vId(s.x2,s.y2);
    if(a===b)continue;
    const ek=a<b?a+'_'+b:b+'_'+a;
    if(edgeSet.has(ek))continue; edgeSet.add(ek);
    verts[a].adj.push(b); verts[b].adj.push(a);
  }
  // 3. Sort each vertex's neighbors by angle (CCW)
  for(const v of verts){
    v.adj.sort((i,j)=>{
      const ai=Math.atan2(verts[i].y-v.y,verts[i].x-v.x);
      const aj=Math.atan2(verts[j].y-v.y,verts[j].x-v.x);
      return ai-aj;
    });
  }
  // 4. For each directed edge (u->v), walk always picking the next edge that
  //    is the tightest CCW turn (i.e. the previous neighbor in v's sorted list).
  const loops=[]; const seenLoop=new Set();
  function nextEdge(prev,cur){
    const list=verts[cur].adj; const i=list.indexOf(prev);
    if(i<0)return -1;
    // Tightest CCW = one step before prev in the sorted (ascending-angle) list
    return list[(i-1+list.length)%list.length];
  }
  for(let u=0;u<verts.length;u++){
    for(const v0 of verts[u].adj){
      const loop=[u]; let prev=u,cur=v0,guard=0;
      while(cur!==u&&guard++<verts.length*4){
        loop.push(cur);
        const nx=nextEdge(prev,cur);
        if(nx<0){loop.length=0;break}
        prev=cur; cur=nx;
      }
      if(loop.length<3||cur!==u)continue;
      // Canonical key: rotate so smallest idx first, pick direction to break ties
      const min=Math.min(...loop),rot=loop.indexOf(min);
      const rotated=loop.slice(rot).concat(loop.slice(0,rot));
      const key=rotated.join(',');
      if(seenLoop.has(key))continue; seenLoop.add(key);
      loops.push(rotated);
    }
  }
  // 5. Keep only CCW loops (room interiors). Shoelace > 0 means CCW in y-up; in
  //    screen coords (y-down) CCW means signed area < 0. Rose Designs uses +y
  //    as "down" on the canvas; keep polygons whose signed area is negative
  //    (matches existing manual rooms).
  const rooms=[];
  for(const loop of loops){
    const poly=loop.map(i=>({x:verts[i].x,y:verts[i].y}));
    let area=0;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      area+=(poly[j].x+poly[i].x)*(poly[j].y-poly[i].y);
    }
    if(area>=0)continue; // CW / degenerate -> skip
    rooms.push(poly);
  }
  // 6. Discard the one room that contains all others (outer hull, if present).
  if(rooms.length>1){
    rooms.sort((a,b)=>Math.abs(polygonArea(b))-Math.abs(polygonArea(a)));
    const biggest=rooms[0];
    const rest=rooms.slice(1);
    const containsAll=rest.every(r=>pointInPolygon(r[0].x,r[0].y,biggest));
    if(containsAll&&rest.length>0)return rest;
  }
  return rooms;
}
// UI helper — Split current room along user-drawn interior walls. Requires
// room.interiorWalls = [{x1,y1,x2,y2}] populated via a future draw tool or
// imported drawing. For now, it's wired up so power users / tests can call:
//   curRoom.interiorWalls=[{x1:5,y1:0,x2:5,y2:10}]; splitRoomByInteriorWalls()
function splitRoomByInteriorWalls(room){
  room=room||(typeof curRoom!=='undefined'?curRoom:null);
  if(!room||!Array.isArray(room.polygon)||room.polygon.length<3){
    if(typeof toast==='function')toast('Open a room first');return{ok:false}
  }
  const interior=Array.isArray(room.interiorWalls)?room.interiorWalls:[];
  if(!interior.length){
    if(typeof toast==='function')toast('No interior walls to split on');return{ok:false}
  }
  const segments=[];
  const p=room.polygon;
  for(let i=0;i<p.length;i++){
    const a=p[i],b=p[(i+1)%p.length];
    segments.push({x1:a.x,y1:a.y,x2:b.x,y2:b.y});
  }
  interior.forEach(w=>segments.push({x1:w.x1,y1:w.y1,x2:w.x2,y2:w.y2}));
  const sub=findRoomsFromSegments(segments);
  if(sub.length<2){
    if(typeof toast==='function')toast('No additional rooms detected');return{ok:false,count:sub.length}
  }
  // Replace current room with first sub-polygon, create new rooms for the rest.
  if(typeof pushU==='function')pushU();
  room.polygon=sub[0];
  room.walls=genWalls(room);
  room.interiorWalls=[];
  const created=[];
  for(let k=1;k<sub.length;k++){
    const base=JSON.parse(JSON.stringify(room));
    base.id=uid(); base.name=(room.name||'Room')+' '+(k+1);
    base.polygon=sub[k]; base.walls=genWalls(base);
    base.furniture=[]; base.openings=[]; base.annotations=[]; base.textAnnotations=[]; base.dimensionAnnotations=[];
    base.interiorWalls=[];
    if(typeof projects!=='undefined'&&projects&&Array.isArray(projects.rooms))projects.rooms.push(base);
    created.push(base);
  }
  if(typeof saveAll==='function')saveAll();
  if(typeof draw==='function')draw();
  if(typeof scheduleRebuild3D==='function')scheduleRebuild3D();
  if(typeof renderRoomList==='function')renderRoomList();
  if(typeof toast==='function')toast(`Split into ${sub.length} rooms`);
  return{ok:true,count:sub.length,created};
}
if(typeof window!=='undefined'){
  window.findRoomsFromSegments=findRoomsFromSegments;
  window.splitRoomByInteriorWalls=splitRoomByInteriorWalls;
}
function wS(r,w){return r.polygon[w.startIdx]}
function wE(r,w){return r.polygon[w.endIdx]}
function wL(r,w){const a=wS(r,w),b=wE(r,w);return Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2)}
function wA(r,w){const a=wS(r,w),b=wE(r,w);return Math.atan2(b.y-a.y,b.x-a.x)}
let adjRoomCfg={width:10,depth:10};
