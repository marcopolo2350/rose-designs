"use strict";

// ══════════════════════════════════════
// ROSE DESIGNS — For Rose
// ══════════════════════════════════════

function uid(){return Date.now().toString(36)+Math.random().toString(36).substr(2,8)}

// ── EASTER EGGS (persistent via IndexedDB) ──
let eggsFound = 0;
const EGGS_TOTAL = 7;
const eggNames = ['First Bloom','Soft Petal','Rose Morning','Hidden Garden','Quiet Corner','Warm Light','Full Bloom'];
let foundEggs = new Set();

async function loadEggs() {
  try {
    const saved = await dg('eggs');
    if (saved && Array.isArray(saved)) {
      saved.forEach(id => foundEggs.add(id));
      eggsFound = foundEggs.size;
    }
  } catch(e) {}
}

async function saveEggs() {
  try { await ds('eggs', Array.from(foundEggs)); } catch(e) {}
}

function findEgg(id) {
  if (foundEggs.has(id)) return;
  foundEggs.add(id);
  eggsFound = foundEggs.size;
  saveEggs();
  const el = document.getElementById('eggCounter');
  el.textContent = '\u{1F339} ' + eggsFound + ' / ' + EGGS_TOTAL + ' petals found';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
  toast('\u{1F339} Petal found: ' + eggNames[id] + '!');
  if (eggsFound === EGGS_TOTAL) {
    setTimeout(() => toast('\u{1F339} You found all the petals! This garden is yours.'), 1500);
  }
}

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
function snapFurniturePoint(x,z){
  if(!furnitureSnap)return{x,z};
  return{x:snapFurnitureValue(x),z:snapFurnitureValue(z)};
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
function wS(r,w){return r.polygon[w.startIdx]}
function wE(r,w){return r.polygon[w.endIdx]}
function wL(r,w){const a=wS(r,w),b=wE(r,w);return Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2)}
function wA(r,w){const a=wS(r,w),b=wE(r,w);return Math.atan2(b.y-a.y,b.x-a.x)}
let adjRoomCfg={width:10,depth:10};
