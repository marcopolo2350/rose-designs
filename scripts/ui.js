// ── WELCOME ──
async function checkWelcome(){
  const w=document.getElementById('welcome');
  if(!w)return;
  const greet=document.querySelector('.w-greeting');
  const personal=document.querySelector('.w-personal');
  if(greet)greet.textContent=activeProfile==='rose'?'Hi Rose':'Welcome back';
  if(personal)personal.textContent=activeProfile==='rose'?'I made this for you':'Your own design space';
  w.classList.remove('fade','gone');
}
function dismissWelcome(){
  const w=document.getElementById('welcome');
  w.classList.add('fade');
  setTimeout(()=>w.classList.add('gone'),800);
  ds('welcomed',true);
  findEgg(0);
}

// ── TUTORIAL ──
async function chooseProfile(profileId,{skipReload=false}={}){
  activeProfile=PROFILE_LABELS[profileId]?profileId:'rose';
  try{localStorage.setItem(PROFILE_LOCAL_KEY,activeProfile)}catch(e){}
  updateProfileChip();
  closeProfileSwitcher();
  loadEditorPrefs();
  await migrateLegacyProjectsIntoProfile();
  if(skipReload)return;
  projects=[];
  curRoom=null;
  await loadAll();
  await checkWelcome();
  await loadEggs();
  await loadDS();
  renderHome();
  if(!getLocal(profileSeenKey()))setTimeout(()=>startTut(true),450);
}
let tutS=-1;
const TUTS=[
  {t:'Start with one room',d:'Begin with a simple room card. You can reshape it later or grow the footprint with North, East, South, and West room buttons.'},
  {t:'Shape the shell first',d:'Use Draw or Vertex to reshape the footprint. Doors and windows snap to walls, so build the shell before styling.'},
  {t:'Keep the panel collapsed while placing',d:'On phone, reopen the panel only when you need details. The floating panel chip lets you place or move pieces without the sheet covering the room.'},
  {t:'Furnish with tap, then place',d:'Choose Furnish, pick an item, then tap the exact spot where it belongs. This is the fastest way to work on iPhone.'},
  {t:'Use Existing Room mode for redesigns',d:'Mark real pieces as Existing, then tag them Keep, Move, Replace, or Remove so the redesign stays organized.'},
  {t:'Walk in 3D with the touch controls',d:'Switch to Walk, use the new move and turn controls, and drag to look around. Landscape is the easiest way to explore.'},
  {t:'Save options instead of overwriting',d:'Use room Options to make Option A, B, and C. Each one keeps its own notes, compare views, and exports.'},
  {t:'This profile keeps its own rooms',d:'This device remembers who is using it. Rose and Marco each get their own rooms, notes, and welcome flow.'},
];
function startTut(force=false){if(!force&&getLocal(profileSeenKey()))return;tutS=0;showTut()}
function showTut(){
  if(tutS<0||tutS>=TUTS.length){endTut();return}
  const s=TUTS[tutS];
  document.getElementById('tutOv').classList.add('on');
  document.getElementById('tutCard').innerHTML=`<h4>${s.t}</h4><p>${s.d}</p><button onclick="${tutS>=TUTS.length-1?'endTut()':'nextTut()'}">
    ${tutS>=TUTS.length-1?'Let\u2019s go!':'Next'}</button>
    <div class="tut-dots">${TUTS.map((_,i)=>`<div class="tut-d${i===tutS?' on':''}"></div>`).join('')}</div>`;
}
function nextTut(){tutS++;showTut()}
function endTut(){tutS=-1;document.getElementById('tutOv').classList.remove('on');setLocal(profileSeenKey(),'1');findEgg(1)} // Easter egg: Soft Petal

function compareProjectRooms(a,b){
  return (a.floorOrder-b.floorOrder)||(a.roomOrder-b.roomOrder)||String(a.name||'').localeCompare(String(b.name||''))||String(a.optionName||'').localeCompare(String(b.optionName||''));
}
function projectRooms(projectOrRoom=curRoom){
  const projectId=typeof projectOrRoom==='string'?projectOrRoom:(projectOrRoom?.projectId||projectOrRoom?.id);
  return projects.filter(room=>(room.projectId||room.id)===projectId).sort(compareProjectRooms);
}
function projectMainRooms(projectOrRoom=curRoom){
  const grouped=new Map();
  projectRooms(projectOrRoom).forEach(room=>{
    const key=room.baseRoomId||room.id;
    const current=grouped.get(key);
    const currentBase=curRoom?(curRoom.baseRoomId||curRoom.id):'';
    if(!current||room.optionName==='Main'||currentBase===key)grouped.set(key,room);
  });
  return [...grouped.values()].sort(compareProjectRooms);
}
function projectFloors(projectOrRoom=curRoom){
  const floors=new Map();
  projectMainRooms(projectOrRoom).forEach(room=>{
    const key=room.floorId||'floor_1';
    if(!floors.has(key))floors.set(key,{id:key,label:room.floorLabel||'Floor 1',order:Number.isFinite(room.floorOrder)?room.floorOrder:0,rooms:[]});
    floors.get(key).rooms.push(room);
  });
  return [...floors.values()].sort((a,b)=>(a.order-b.order)||a.label.localeCompare(b.label));
}
function projectPrimaryRoom(projectOrRoom=curRoom){
  const rooms=projectMainRooms(projectOrRoom);
  return rooms.find(room=>room.optionName==='Main')||rooms[0]||null;
}
function currentProjectId(){return curRoom?.projectId||null}
function currentProjectName(){return curRoom?.projectName||curRoom?.name||'Home Project'}
function currentFloorRooms(projectOrRoom=curRoom,floorId=activeProjectFloorId||curRoom?.floorId){
  return projectMainRooms(projectOrRoom).filter(room=>(room.floorId||'floor_1')===floorId);
}
function nextProjectFloorMeta(projectOrRoom=curRoom){
  const floors=projectFloors(projectOrRoom);
  const nextIndex=floors.length+1;
  return {id:`floor_${nextIndex}`,label:`Floor ${nextIndex}`,order:floors.length};
}
let createRoomContext={mode:'new_project',projectId:null,projectName:'',floorId:'floor_1',floorLabel:'Floor 1',floorOrder:0};
function setCreateRoomContext(ctx={}){
  createRoomContext={mode:'new_project',projectId:null,projectName:'',floorId:'floor_1',floorLabel:'Floor 1',floorOrder:0,...ctx};
}

// ── HOME ──
function renderHome(){
  // Time-aware greeting
  const heroEl = document.getElementById('heroGreeting');
  const subEl = document.getElementById('heroSub');
  if (heroEl) {
    const tod = getTimeOfDay();
    const greetings = {
      morning: {h:'Good morning,<br>Rose',s:'A fresh canvas for a new day.'},
      afternoon: {h:'Your Space,<br>Your Story',s:'The afternoon light is perfect for creating.'},
      evening: {h:'Good evening,<br>Rose',s:'A soft place to land tonight.'},
      night: {h:'Still creating,<br>Rose?',s:'Late night ideas are the best ones.'},
    };
    const g = greetings[tod];
    if(activeProfile!=='rose'){
      g.h='Your Space,<br>Your Story';
      g.s='Your rooms, your options, your saved design world.';
    }
    heroEl.innerHTML = g.h;
    subEl.textContent = g.s;
  }
  updateProfileChip();
  const l=document.getElementById('prjList');
  if(!projects.length){l.innerHTML='<div class="emp"><div class="ei">\u{1F339}</div><h3>No rooms yet</h3><p>Create your first room to start designing.</p></div>';return}
  const grouped=[...new Map(projects.map(room=>[(room.projectId||room.id),projectPrimaryRoom(room)])).values()].filter(Boolean).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  l.innerHTML=grouped.map(p=>{
    const n=p.polygon?p.polygon.length:0;
    const sh=n===4?'Rectangle':n===6?'L-Shape':n>0?n+'-gon':'Drawing...';
    const type=(ROOM_TYPES.find(t=>t.id===(p.roomType||'living_room'))||ROOM_TYPES[0]).name;
    const moodLabel=p.mood&&MOOD_CONFIG[p.mood]?(p.mood.charAt(0).toUpperCase()+p.mood.slice(1)):null;
    const presetLabel=p.designPreset?(DESIGN_PRESETS.find(d=>d.id===p.designPreset)?.name||'Styled'):null;
    const primaryChip=moodLabel||presetLabel||'In Progress';
    const edited=new Date(p.updatedAt||p.createdAt||Date.now()).toLocaleDateString(undefined,{month:'short',day:'numeric'});
    const roomCount=projectMainRooms(p).length;
    const floorCount=projectFloors(p).length;
    if(!p.previewThumb&&p.polygon?.length)updateRoomPreviewThumb(p);
    const optionChip=(p.optionName&&p.optionName!=='Main')?`<span class="chip">${esc(p.optionName)}</span>`:'';
    const optionCount=optionSiblings(p).length>1?`<span class="chip">${optionSiblings(p).length} options</span>`:'';
    const thumb=p.previewThumb?`<div style="width:92px;height:72px;border-radius:14px;overflow:hidden;flex-shrink:0;box-shadow:var(--sh)"><img src="${p.previewThumb}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div>`:'';
    return `<div class="pc" onclick="openPrj('${p.projectId||p.id}')">${thumb}<div class="pci">${p.favorite?'\u2728':'\u{1F3E0}'}</div><div class="pcf"><h3>${esc(p.projectName||p.name)}</h3><p>${roomCount} room${roomCount===1?'':'s'} &middot; ${floorCount} floor${floorCount===1?'':'s'} &middot; edited ${edited}</p><div class="pcmeta"><span class="chip">${esc(primaryChip)}</span>${presetLabel&&moodLabel?`<span class="chip">${esc(presetLabel)}</span>`:''}<span class="chip">${esc(type)}</span>${roomCount>1?`<span class="chip">${roomCount} rooms</span>`:''}${floorCount>1?`<span class="chip">${floorCount} floors</span>`:''}${optionChip}${optionCount}</div></div><div class="pca"><button class="pab" onpointerdown="favPrjClick(event,'${p.projectId||p.id}')" title="Favorite"><svg viewBox="0 0 24 24"><path d="M12 17.3 5.8 21l1.7-7-5.5-4.8 7.2-.6L12 2l2.8 6.6 7.2.6-5.5 4.8 1.7 7z"/></svg></button><button class="pab" onpointerdown="dupPrjClick(event,'${p.projectId||p.id}')" title="Duplicate"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button><button class="pab" onpointerdown="delPrjClick(event,'${p.projectId||p.id}')" title="Delete"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></div>`}).join('')}
function openPrj(id){const p=projectPrimaryRoom(id)||projects.find(r=>r.id===id);if(p)openEd(p)}
function dupPrj(id){
  const sourceRooms=projectRooms(id);
  if(!sourceRooms.length)return;
  const roomIdMap=new Map();
  const baseIdMap=new Map();
  const nextProjectId=uid();
  sourceRooms.forEach(room=>{
    roomIdMap.set(room.id,uid());
    if(!baseIdMap.has(room.baseRoomId||room.id))baseIdMap.set(room.baseRoomId||room.id,uid());
  });
  const clones=sourceRooms.map((room,index)=>{
    const d=JSON.parse(JSON.stringify(room));
    d.id=roomIdMap.get(room.id);
    d.projectId=nextProjectId;
    d.projectName=`${room.projectName||room.name} (Copy)`;
    d.baseRoomId=baseIdMap.get(room.baseRoomId||room.id)||d.id;
    d.createdAt=Date.now();
    d.updatedAt=Date.now()+index;
    d.connections=(room.connections||[]).map(link=>roomIdMap.has(link.roomId)?({...link,roomId:roomIdMap.get(link.roomId)}):null).filter(Boolean);
    d.furniture=(room.furniture||[]).map(item=>({...item,id:uid(),linkedExistingId:'',replacementId:''}));
    return normalizeRoom(d);
  });
  projects.push(...clones);
  saveAll();
  renderHome();
  toast('Project duplicated');
}
function delPrj(id){projects=projects.filter(r=>(r.projectId||r.id)!==id);saveAll();renderHome();toast('Deleted')}
function toggleFavoriteProject(id){
  const rooms=projectRooms(id);
  if(!rooms.length)return;
  const next=!rooms.some(r=>r.favorite);
  rooms.forEach(room=>room.favorite=next);
  saveAll();renderHome();toast(next?'Saved to favorites':'Removed from favorites')
}
function dupPrjClick(e,id){e.stopPropagation();e.preventDefault();dupPrj(id)}
function delPrjClick(e,id){e.stopPropagation();e.preventDefault();showDeleteConfirm(id)}
function favPrjClick(e,id){e.stopPropagation();e.preventDefault();toggleFavoriteProject(id)}
// Custom delete confirmation modal (replaces browser confirm)
let pendingDeleteId=null;
function showDeleteConfirm(id){
  if(document.getElementById('delConfirm'))return;
  pendingDeleteId=id;
  const room=projectPrimaryRoom(id)||projects.find(r=>r.id===id);
  const name=room?(room.projectName||room.name):'this project';
  document.body.insertAdjacentHTML('beforeend',
    `<div id="delConfirm" style="position:fixed;inset:0;z-index:4000;display:flex;align-items:center;justify-content:center;background:rgba(51,41,34,.3);backdrop-filter:blur(3px)">
      <div style="background:var(--bg);border-radius:var(--rl);padding:20px 24px;max-width:280px;text-align:center;box-shadow:var(--shl);animation:su .2s ease">
        <div style="font-family:var(--fd);font-size:16px;font-weight:700;margin-bottom:6px">Delete project?</div>
        <div style="font-size:12px;color:var(--taupe);margin-bottom:16px">${esc(name)}</div>
        <div style="display:flex;gap:8px">
          <button style="flex:1;padding:10px;border-radius:50px;background:var(--bg2);font-size:12px;font-weight:600" onclick="closeDeleteConfirm()">Cancel</button>
          <button style="flex:1;padding:10px;border-radius:50px;background:#C55;color:#fff;font-size:12px;font-weight:600" onclick="confirmDelete()">Delete</button>
        </div>
      </div>
    </div>`)}
function closeDeleteConfirm(){const el=document.getElementById('delConfirm');if(el)el.remove();pendingDeleteId=null}
function confirmDelete(){if(pendingDeleteId){delPrj(pendingDeleteId)}closeDeleteConfirm()}

// ── CREATE ──
const PRESET_SVGS={
  rect:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect x="4" y="4" width="52" height="32" fill="none" stroke="#8B7E74" stroke-width="1.5" rx="1"/></svg>',
  lshape:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><path d="M4 4h32v16h20v16H4z" fill="none" stroke="#8B7E74" stroke-width="1.5"/></svg>',
  ushape:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><path d="M4 4h52v32H40V18H20v18H4z" fill="none" stroke="#8B7E74" stroke-width="1.5"/></svg>',
  free:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><path d="M8 30L15 8L35 4L52 15L48 34L25 36Z" fill="none" stroke="#B8918E" stroke-width="1.5" stroke-dasharray="3 2"/></svg>'
};
function popPresets(){document.getElementById('preG').innerHTML=ROOM_STARTERS.map(p=>`<div class="pi${p.id===selPreset?' sel':''}" onclick="selPre('${p.id}',this)"><span class="starter-tag">${p.tag}</span>${PRESET_SVGS[p.shape]||PRESET_SVGS.rect}<span>${p.name}</span><small>${p.hint}</small></div>`).join('')}
function defaultPersonalRoomName(){return activeProfile==='rose'?"Rose's Room":"Marco's Room"}
function selPre(id,el){
  selPreset=id;
  const starter=ROOM_STARTERS.find(s=>s.id===id);
  if(starter){
    document.getElementById('crW').value=starter.width;
    document.getElementById('crL').value=starter.depth;
    document.getElementById('crH').value=starter.height;
  }
  document.querySelectorAll('.pi').forEach(e=>e.classList.remove('sel'));
  el.classList.add('sel')
}
function openCrModal(starterId='living_room',ctx=null){
  const starter=ROOM_STARTERS.find(s=>s.id===starterId)||ROOM_STARTERS[0];
  if(ctx)setCreateRoomContext(ctx);else setCreateRoomContext({mode:'new_project'});
  selPreset=starter.id;
  document.getElementById('crN').value=createRoomContext.mode==='project_room'
    ? starter.name
    : (starter.name==="Bedroom"?defaultPersonalRoomName():starter.name);
  document.getElementById('crW').value=starter.width;document.getElementById('crL').value=starter.depth;document.getElementById('crH').value=starter.height;popPresets();document.getElementById('crMod').classList.add('on')
}
function closeCr(){document.getElementById('crMod').classList.remove('on')}
document.getElementById('crMod').onclick=function(e){if(e.target===this)closeCr()};
function buildStarterFurniture(starter,w,l){
  const midX=w/2,midY=l/2;
  const sets={
    living_room:[{label:'Modern Sofa',assetKey:'sofa_modern',x:midX,y:Math.max(2.4,l-2.4),w:5.2,d:2.55,rotation:180},{label:'Coffee Table',assetKey:'table_coffee',x:midX,y:midY+.8,w:3.2,d:1.8,rotation:0},{label:'Area Rug',assetKey:'rug',x:midX,y:midY+.8,w:7,d:5,rotation:0},{label:'Floor Lamp',assetKey:'lamp_floor',x:w-1.8,y:2,w:1,d:1,rotation:0}],
    bedroom:[{label:'King Bed',assetKey:'bed_king',x:midX,y:l-3.7,w:6.4,d:7.4,rotation:180},{label:'Nightstand',assetKey:'nightstand',x:midX-3,y:l-2.6,w:1.7,d:1.5,rotation:180},{label:'Alt Nightstand',assetKey:'nightstand_alt',x:midX+3,y:l-2.6,w:1.8,d:1.55,rotation:180},{label:'Round Rug',assetKey:'rug_round',x:midX,y:midY+.3,w:4.2,d:4.2,rotation:0}],
    dining_room:[{label:'Dining Table',assetKey:'dining_table',x:midX,y:midY,w:5,d:3,rotation:0},{label:'Bench',assetKey:'bench',x:midX,y:midY+2.4,w:3.5,d:1.4,rotation:0},{label:'Pendant Light',assetKey:'lamp_pendant',x:midX,y:midY,w:1.7,d:1.7,rotation:0}],
    office:[{label:'Desk',assetKey:'desk',x:midX,y:l-2.2,w:4,d:2,rotation:180},{label:'Office Chair',assetKey:'chair_office',x:midX,y:l-4.3,w:2,d:2,rotation:180},{label:'Bookcase With Books',assetKey:'bookcase_books',x:w-1.2,y:midY,w:3.2,d:1.1,rotation:270}],
    nursery:[{label:'Twin Bed',assetKey:'bed_twin',x:midX,y:l-3.3,w:3.6,d:6.6,rotation:180},{label:'Tall Dresser',assetKey:'dresser_tall',x:w-1.5,y:2.4,w:3.4,d:1.7,rotation:270},{label:'Round Rug',assetKey:'rug_round',x:midX,y:midY,w:4.2,d:4.2,rotation:0}],
    reading_nook:[{label:'Chair',assetKey:'chair',x:midX-1,y:midY+1,w:1.6,d:1.6,rotation:200},{label:'Round Side Table',assetKey:'table_round_small',x:midX+1.2,y:midY+.8,w:2.4,d:2.4,rotation:0},{label:'Floor Lamp',assetKey:'lamp_floor',x:midX+2.2,y:midY-1,w:1,d:1,rotation:0},{label:'Round Rug',assetKey:'rug_round',x:midX,y:midY,w:4.2,d:4.2,rotation:0}],
    studio:[{label:'Sectional Sofa',assetKey:'sofa_l',x:5.5,y:5,w:6,d:3.6,rotation:180},{label:'Desk',assetKey:'desk',x:w-4,y:l-2.5,w:4,d:2,rotation:180},{label:'Dining Table',assetKey:'dining_table',x:w-5.5,y:4,w:5,d:3,rotation:0},{label:'Runner Rug',assetKey:'runner_rug',x:midX,y:midY,w:6.5,d:2,rotation:0}],
    closet_room:[{label:'Mirror',assetKey:'mirror',x:w-0.15,y:midY,w:2,d:.3,rotation:90,mountType:'wall',elevation:5},{label:'Dresser',assetKey:'dresser',x:2.5,y:midY,w:4,d:1.8,rotation:90},{label:'Bench',assetKey:'bench',x:midX,y:l-2,w:3.5,d:1.4,rotation:180}],
  };
  return (sets[starter.id]||[]).map(item=>({
    id:uid(),
    label:item.label,
    x:item.x,
    z:item.y,
    w:item.w,
    d:item.d,
    rotation:item.rotation||0,
    mountType:item.mountType||((MODEL_REGISTRY[item.assetKey]||{}).mountType||'floor'),
    elevation:Number.isFinite(item.elevation)?item.elevation:defaultElevation(item.mountType||((MODEL_REGISTRY[item.assetKey]||{}).mountType||'floor'),item.assetKey,resolveLabel(item.label)),
    assetKey:item.assetKey,
    yOffset:(MODEL_REGISTRY[item.assetKey]||{}).yOffset||0
  }));
}

function createFromPreset(){
  const starter=ROOM_STARTERS.find(s=>s.id===selPreset)||ROOM_STARTERS[0];
  if(starter.shape==='free'){startFreeDraw();return}
  const w=parseFloat(document.getElementById('crW').value)||14;
  const l=parseFloat(document.getElementById('crL').value)||12;
  const h=parseFloat(document.getElementById('crH').value)||9;
  const nm=document.getElementById('crN').value||defaultPersonalRoomName();
  const ctx=createRoomContext||{mode:'new_project'};
  const projectId=ctx.mode==='project_room'?(ctx.projectId||curRoom?.projectId||uid()):uid();
  const projectName=ctx.mode==='project_room'?(ctx.projectName||curRoom?.projectName||'Home Project'):nm;
  const floorId=ctx.floorId||'floor_1';
  const floorLabel=ctx.floorLabel||'Floor 1';
  const floorOrder=Number.isFinite(ctx.floorOrder)?ctx.floorOrder:0;
  let poly;
  if(starter.shape==='lshape')poly=[{x:0,y:0},{x:w,y:0},{x:w,y:l*.5},{x:w*.5,y:l*.5},{x:w*.5,y:l},{x:0,y:l}];
  else if(starter.shape==='ushape'){const n=w*.3;poly=[{x:0,y:0},{x:w,y:0},{x:w,y:l},{x:w-n,y:l},{x:w-n,y:l*.4},{x:n,y:l*.4},{x:n,y:l},{x:0,y:l}]}
  else poly=[{x:0,y:0},{x:w,y:0},{x:w,y:l},{x:0,y:l}];
  const room=normalizeRoom({id:uid(),name:nm,height:h,wallThickness:.5,polygon:poly,openings:[],structures:[],furniture:[],
    projectId,projectName,floorId,floorLabel,floorOrder,roomOrder:projectMainRooms(projectId).length,
    roomType:starter.roomType||'living_room',designPreset:starter.designPreset||'',materials:{wall:WALL_PALETTES[0].color,wallFinish:'warm_white',floor:FLOOR_TYPES[0].color,floorType:FLOOR_TYPES[0].id,ceiling:'#FAF7F2',trim:TRIM_COLORS[0],ceilingBrightness:1,lightingPreset:'daylight'},createdAt:Date.now(),updatedAt:Date.now(),favorite:false});
  room.furniture=buildStarterFurniture(starter,w,l);
  if(starter.designPreset)applyDesignPresetToRoom(room,starter.designPreset);
  projects.push(room);saveAll();closeCr();openEd(room);
  // Easter egg: first room creation
  if(projects.length===1)findEgg(2); // Rose Morning
}

function startFreeDraw(){
  closeCr();const nm=document.getElementById('crN').value||defaultPersonalRoomName();const h=parseFloat(document.getElementById('crH').value)||9;
  const ctx=createRoomContext||{mode:'new_project'};
  const projectId=ctx.mode==='project_room'?(ctx.projectId||curRoom?.projectId||uid()):uid();
  const projectName=ctx.mode==='project_room'?(ctx.projectName||curRoom?.projectName||'Home Project'):nm;
  const floorId=ctx.floorId||'floor_1';
  const floorLabel=ctx.floorLabel||'Floor 1';
  const floorOrder=Number.isFinite(ctx.floorOrder)?ctx.floorOrder:0;
  const room=normalizeRoom({id:uid(),name:nm,height:h,wallThickness:.5,polygon:[],walls:[],openings:[],structures:[],furniture:[],
    projectId,projectName,floorId,floorLabel,floorOrder,roomOrder:projectMainRooms(projectId).length,
    roomType:'living_room',designPreset:'',materials:{wall:WALL_PALETTES[0].color,wallFinish:'warm_white',floor:FLOOR_TYPES[0].color,floorType:FLOOR_TYPES[0].id,ceiling:'#FAF7F2',trim:TRIM_COLORS[0],ceilingBrightness:1,lightingPreset:'daylight'},createdAt:Date.now(),updatedAt:Date.now()});
  projects.push(room);saveAll();curRoom=room;drawMode=true;drawPts=[];drawCur=null;
  document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));document.getElementById('scrEd').classList.add('on');
  document.getElementById('edT').textContent=room.name;document.getElementById('dBar').classList.add('on');document.getElementById('mTbar').style.display='none';
  initCan();vScale=20;vOff.x=canvas.width/2;vOff.y=canvas.height/2;draw()}
function togSnap(){angSnap=!angSnap;const b=document.getElementById('snapB');b.classList.toggle('on',angSnap);b.textContent=angSnap?'Snap 90\u00B0':'Snap Off'}
function snapAng(from,to){if(!angSnap||!from)return to;const dx=to.x-from.x,dy=to.y-from.y,d=Math.sqrt(dx*dx+dy*dy);if(d<.5)return to;const a=Math.atan2(dy,dx),s=Math.round(a/(Math.PI/4))*(Math.PI/4);return{x:from.x+Math.cos(s)*d,y:from.y+Math.sin(s)*d}}
function closeRoom(){
  if(drawPts.length<3){toast('Need at least 3 points');return}
  curRoom.polygon=drawPts.map(p=>({...p}));curRoom.walls=genWalls(curRoom);
  drawMode=false;drawPts=[];drawCur=null;
  document.getElementById('dBar').classList.remove('on');document.getElementById('mTbar').style.display='';
  saveAll();autoFit();pushU();draw();toast('Room created!');
  if(projects.length<=1)setTimeout(startTut,500)}

function clearFurnitureSelection(){
  multiSelFurnitureIds=[];
  if(sel.type==='furniture')sel={type:null,idx:-1};
}
function optionSiblings(room=curRoom){
  if(!room)return[];
  const baseId=room.baseRoomId||room.id;
  return projects.filter(p=>(p.projectId||p.id)===(room.projectId||room.id)&&(p.baseRoomId||p.id)===baseId);
}
function nextOptionName(room=curRoom){
  const siblings=optionSiblings(room);
  let idx=2;
  const taken=new Set(siblings.map(p=>(p.optionName||'').toLowerCase()));
  while(taken.has(`option ${idx}`.toLowerCase()))idx++;
  return `Option ${idx}`;
}
function setCurrentOptionNotes(text){
  if(!curRoom)return;
  curRoom.optionNotes=(text||'').trim();
  pushU();
  showP();
}
function renameCurrentOption(name){
  if(!curRoom)return;
  const trimmed=(name||'').trim();
  if(!trimmed)return;
  curRoom.optionName=trimmed;
  pushU();
  renderHome();
  showP();
}
function createRoomOptionFromCurrent(){
  if(!curRoom)return;
  const clone=JSON.parse(JSON.stringify(curRoom));
  clone.id=uid();
  clone.baseRoomId=curRoom.baseRoomId||curRoom.id;
  clone.optionName=nextOptionName(curRoom);
  clone.name=curRoom.name;
  clone.createdAt=Date.now();
  clone.updatedAt=Date.now();
  projects.push(normalizeRoom(clone));
  saveAll();
  renderHome();
  openEd(projects.find(p=>p.id===clone.id));
  toast(`${clone.optionName} created`);
}
function switchToOption(id){
  const room=projects.find(p=>p.id===id);
  if(!room)return;
  openEd(room);
}
function renameCurrentProject(name){
  if(!curRoom)return;
  const trimmed=(name||'').trim();
  if(!trimmed)return;
  projectRooms(curRoom).forEach(room=>room.projectName=trimmed);
  saveAll();
  renderHome();
  showP();
}
function renameCurrentRoom(name){
  if(!curRoom)return;
  const trimmed=(name||'').trim();
  if(!trimmed)return;
  optionSiblings(curRoom).forEach(room=>room.name=trimmed);
  saveAll();
  renderHome();
  showP();
}
function setActiveFloor(floorId){
  activeProjectFloorId=floorId;
  showP();
}
function openProjectRoom(baseRoomId){
  const baseRoom=projectRooms(curRoom).find(room=>(room.baseRoomId||room.id)===baseRoomId);
  const target=(baseRoom?optionSiblings(baseRoom).find(room=>room.id===curRoom.id||room.optionName==='Main'):null)
    || baseRoom;
  if(target)openEd(target);
}
function openAddRoomModalForProject(floorId=activeProjectFloorId||curRoom?.floorId){
  if(!curRoom)return;
  const floor=projectFloors(curRoom).find(item=>item.id===floorId)||{id:curRoom.floorId||'floor_1',label:curRoom.floorLabel||'Floor 1',order:curRoom.floorOrder||0};
  setCreateRoomContext({mode:'project_room',projectId:curRoom.projectId,projectName:currentProjectName(),floorId:floor.id,floorLabel:floor.label,floorOrder:floor.order});
  openCrModal('living_room',createRoomContext);
}
function createNextFloor(){
  if(!curRoom)return;
  const floor=nextProjectFloorMeta(curRoom);
  setCreateRoomContext({mode:'project_room',projectId:curRoom.projectId,projectName:currentProjectName(),floorId:floor.id,floorLabel:floor.label,floorOrder:floor.order});
  activeProjectFloorId=floor.id;
  openCrModal('living_room',createRoomContext);
}
function duplicateCurrentRoom(){
  if(!curRoom)return;
  const clone=JSON.parse(JSON.stringify(curRoom));
  clone.id=uid();
  clone.baseRoomId=clone.id;
  clone.optionName='Main';
  clone.roomOrder=projectMainRooms(curRoom).length;
  clone.connections=[];
  clone.createdAt=Date.now();
  clone.updatedAt=Date.now();
  clone.furniture=(clone.furniture||[]).map(item=>({...item,id:uid(),linkedExistingId:'',replacementId:''}));
  projects.push(normalizeRoom(clone));
  saveAll();
  renderHome();
  openEd(projects.find(room=>room.id===clone.id));
  toast('Room duplicated');
}
function deleteCurrentRoom(){
  if(!curRoom)return;
  const siblings=projectMainRooms(curRoom);
  if(siblings.length<=1){
    toast('Keep at least one room in the project');
    return;
  }
  const removeBase=curRoom.baseRoomId||curRoom.id;
  const nextRoom=siblings.find(room=>(room.baseRoomId||room.id)!==removeBase);
  projects=projects.filter(room=>!((room.projectId||room.id)===(curRoom.projectId||curRoom.id)&&(room.baseRoomId||room.id)===removeBase));
  projects.forEach(room=>{
    if((room.projectId||room.id)===(curRoom.projectId||curRoom.id)){
      room.connections=(room.connections||[]).filter(link=>link.roomId!==curRoom.id&&link.roomId!==removeBase);
    }
  });
  saveAll();
  renderHome();
  if(nextRoom)openEd(nextRoom); else exitEd();
  toast('Room removed from project');
}
function moveCurrentRoomOrder(direction){
  if(!curRoom)return;
  const rooms=currentFloorRooms(curRoom);
  const currentBase=curRoom.baseRoomId||curRoom.id;
  const idx=rooms.findIndex(room=>(room.baseRoomId||room.id)===currentBase);
  const nextIdx=idx+direction;
  if(idx<0||nextIdx<0||nextIdx>=rooms.length)return;
  const target=rooms[nextIdx];
  const currentOrder=curRoom.roomOrder;
  const targetOrder=target.roomOrder;
  projectRooms(curRoom).forEach(room=>{
    if((room.baseRoomId||room.id)===currentBase)room.roomOrder=targetOrder;
    else if((room.baseRoomId||room.id)===(target.baseRoomId||target.id))room.roomOrder=currentOrder;
  });
  saveAll();
  showP();
}
function moveCurrentRoomToFloor(floorId){
  if(!curRoom||!floorId)return;
  const floor=projectFloors(curRoom).find(item=>item.id===floorId);
  if(!floor)return;
  optionSiblings(curRoom).forEach(room=>{
    room.floorId=floor.id;
    room.floorLabel=floor.label;
    room.floorOrder=floor.order;
    room.roomOrder=currentFloorRooms(curRoom,floor.id).length;
  });
  activeProjectFloorId=floor.id;
  saveAll();
  renderHome();
  showP();
}
function normalizeFurnitureSelection(){
  if(!curRoom){multiSelFurnitureIds=[];return[]}
  const ids=new Set(curRoom.furniture.map(f=>f.id));
  multiSelFurnitureIds=multiSelFurnitureIds.filter(id=>ids.has(id));
  if(sel.type==='furniture'&&curRoom.furniture[sel.idx]?.id){
    const id=curRoom.furniture[sel.idx].id;
    if(!multiSelFurnitureIds.includes(id))multiSelFurnitureIds.unshift(id);
  }
  multiSelFurnitureIds=[...new Set(multiSelFurnitureIds)];
  if(sel.type==='furniture'&&(!curRoom.furniture[sel.idx]||!multiSelFurnitureIds.includes(curRoom.furniture[sel.idx].id))){
    if(multiSelFurnitureIds.length){
      const idx=curRoom.furniture.findIndex(f=>f.id===multiSelFurnitureIds[0]);
      sel=idx>=0?{type:'furniture',idx}:{type:null,idx:-1};
    }else sel={type:null,idx:-1};
  }
  return multiSelFurnitureIds.slice();
}
function selectedFurnitureIndices(){
  if(!curRoom)return[];
  const ids=normalizeFurnitureSelection();
  return curRoom.furniture.reduce((acc,f,idx)=>(ids.includes(f.id)?(acc.push(idx),acc):acc),[]);
}
function selectedFurnitureRecords(){
  return selectedFurnitureIndices().map(idx=>curRoom.furniture[idx]).filter(Boolean);
}
function isFurnitureSelected(idx){
  if(!curRoom||idx<0)return false;
  const item=curRoom.furniture[idx];
  return !!item&&normalizeFurnitureSelection().includes(item.id);
}
function setFurnitureSelection(idx,{append=false,toggle=false}={}){
  if(!curRoom||idx<0||!curRoom.furniture[idx])return;
  const id=curRoom.furniture[idx].id;
  if(toggle){
    multiSelFurnitureIds=multiSelFurnitureIds.includes(id)
      ? multiSelFurnitureIds.filter(x=>x!==id)
      : [...multiSelFurnitureIds,id];
  }else if(append){
    multiSelFurnitureIds=[...new Set([...multiSelFurnitureIds,id])];
  }else{
    multiSelFurnitureIds=[id];
  }
  if(multiSelFurnitureIds.length){
    sel={type:'furniture',idx};
  }else{
    sel={type:null,idx:-1};
  }
}
function groupSelectionActive(){
  return selectedFurnitureIndices().length>1;
}
function selectionCentroid(records=selectedFurnitureRecords()){
  if(!records.length)return{x:0,z:0};
  const sum=records.reduce((acc,item)=>{acc.x+=item.x;acc.z+=item.z;return acc},{x:0,z:0});
  return{x:sum.x/records.length,z:sum.z/records.length};
}
function buildFurnitureClipboard(records=selectedFurnitureRecords()){
  if(!records.length)return null;
  const primary=(sel.type==='furniture'&&curRoom?.furniture[sel.idx])||records[0];
  const anchor={x:primary.x,z:primary.z};
  return {
    items:records.map(item=>({
      label:item.label,
      category:item.category,
      w:item.w,
      d:item.d,
      rotation:item.rotation,
      mountType:item.mountType,
      elevation:item.elevation,
      assetKey:item.assetKey,
      yOffset:item.yOffset,
      variantId:item.variantId||'',
      finishColor:item.finishColor||'',
      visible:item.visible!==false,
      source:item.source||'new',
      redesignAction:item.redesignAction||'keep',
      locked:!!item.locked,
      linkedExistingId:item.linkedExistingId||'',
      replacementId:item.replacementId||'',
      relX:item.x-anchor.x,
      relZ:item.z-anchor.z
    })),
    anchor
  };
}
function copySelectedFurniture(){
  const records=selectedFurnitureRecords();
  if(!records.length){toast('Select furniture first');return}
  furnitureClipboard=buildFurnitureClipboard(records);
  pasteCascade=0;
  showP();
  toast(records.length>1?`${records.length} pieces copied`:`${records[0].label||'Item'} copied`);
}
function getPasteAnchor(offsetFeet=.8){
  if(canvas){
    const center=tW(canvas.width/2,canvas.height/2);
    return{x:center.x+pasteCascade*offsetFeet,z:center.y+pasteCascade*offsetFeet};
  }
  const focus=getRoomFocus(curRoom);
  return{x:focus.x+pasteCascade*offsetFeet,z:focus.y+pasteCascade*offsetFeet};
}
function pasteFurniture(){
  if(!curRoom||!furnitureClipboard?.items?.length){toast('Copy furniture first');return}
  const anchor=getPasteAnchor();
  const newIds=[];
  furnitureClipboard.items.forEach(item=>{
    const pos=snapFurniturePoint(anchor.x+item.relX,anchor.z+item.relZ);
    const created=normalizeFurnitureRecord({
      id:uid(),
      label:item.label,
      category:item.category,
      x:pos.x,
      z:pos.z,
      w:item.w,
      d:item.d,
      rotation:item.rotation,
      mountType:item.mountType,
      elevation:item.elevation,
      assetKey:item.assetKey,
      yOffset:item.yOffset,
      variantId:item.variantId,
      finishColor:item.finishColor,
      visible:item.visible,
      source:item.source,
      redesignAction:item.redesignAction,
      locked:item.locked,
      linkedExistingId:item.linkedExistingId,
      replacementId:item.replacementId
    });
    curRoom.furniture.push(created);
    newIds.push(created.id);
  });
  pasteCascade++;
  multiSelFurnitureIds=newIds;
  const lastIdx=curRoom.furniture.findIndex(f=>f.id===newIds[newIds.length-1]);
  sel=lastIdx>=0?{type:'furniture',idx:lastIdx}:{type:null,idx:-1};
  panelHidden=false;
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
  toast(newIds.length>1?`${newIds.length} pieces pasted`:'Furniture pasted');
}
function duplicateSelectedFurniture(){
  const clipboard=buildFurnitureClipboard();
  if(!clipboard){toast('Select furniture first');return}
  furnitureClipboard=clipboard;
  pasteCascade=1;
  pasteFurniture();
}
function deleteSelectedFurniture(){
  const indices=selectedFurnitureIndices().sort((a,b)=>b-a);
  if(!indices.length){toast('Select furniture first');return}
  indices.forEach(idx=>curRoom.furniture.splice(idx,1));
  multiSelFurnitureIds=[];
  sel={type:null,idx:-1};
  panelHidden=false;
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function currentPlanViewMode(room=curRoom){
  return PLAN_VIEW_MODES[room?.planViewMode]?room.planViewMode:'combined';
}
function getFurnitureRenderState(item,room=curRoom,mode=currentPlanViewMode(room)){
  if(!item)return{visible:false,ghost:false,style:null};
  const style=item.source==='existing'?(EXISTING_ACTIONS[item.redesignAction]||EXISTING_ACTIONS.keep):null;
  const baseVisible=item.visible!==false;
  if(!baseVisible)return{visible:false,ghost:false,style};
  if(mode==='existing'){
    return {visible:item.source==='existing',ghost:false,style};
  }
  if(mode==='redesign'){
    if(item.source!=='existing')return{visible:true,ghost:false,style:null};
    const visible=item.redesignAction==='keep'||item.redesignAction==='move';
    return{visible,ghost:false,style};
  }
  if(item.source!=='existing')return{visible:true,ghost:false,style:null};
  if(room?.hideRemovedExisting&&item.redesignAction==='remove')return{visible:false,ghost:false,style};
  return {visible:true,ghost:room?.ghostExisting!==false,style};
}
function existingItemVisible(item,room=curRoom,mode=currentPlanViewMode(room)){
  return getFurnitureRenderState(item,room,mode).visible;
}
function existingItemGhost(item,room=curRoom,mode=currentPlanViewMode(room)){
  return getFurnitureRenderState(item,room,mode).ghost;
}
function setPlanViewMode(mode){
  if(!curRoom||!PLAN_VIEW_MODES[mode])return;
  curRoom.planViewMode=mode;
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function togglePlanLegend(){
  if(!curRoom)return;
  curRoom.showPlanLegend=!curRoom.showPlanLegend;
  pushU();
  draw();
  showP();
}
function toggle3DCompareMode(){
  if(!curRoom)return;
  const current=currentPlanViewMode(curRoom);
  let next='combined';
  if(current==='combined'){
    compare3DMode=true;
    next='existing';
  }else if(current==='existing'){
    compare3DMode=true;
    next='redesign';
  }else{
    compare3DMode=false;
    next='combined';
  }
  curRoom.planViewMode=next;
  const btn=document.getElementById('cmCompare');
  if(btn)btn.classList.toggle('act',compare3DMode);
  if(typeof refreshPresentationPill==='function')refreshPresentationPill();
  if(typeof updatePresentationTray==='function')updatePresentationTray();
  draw();
  showP();
  if(is3D)scheduleRebuild3D(40);
}
function updateSelectedFurnitureMeta(updates){
  const records=selectedFurnitureRecords();
  if(!records.length)return;
  records.forEach(item=>Object.assign(item,updates));
  if(updates.source!=='existing'){
    records.forEach(item=>{ if(item.source!=='existing') item.redesignAction='keep'; });
  }
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function pairedReplacementFor(existingItem,room=curRoom){
  if(!existingItem?.id||!room)return null;
  return room.furniture.find(item=>item.source==='new'&&item.linkedExistingId===existingItem.id)||null;
}
function linkedExistingFor(newItem,room=curRoom){
  if(!newItem?.linkedExistingId||!room)return null;
  return room.furniture.find(item=>item.id===newItem.linkedExistingId)||null;
}
function pairExistingAndReplacement(existingItem,newItem){
  if(!existingItem||!newItem)return false;
  existingItem.source='existing';
  existingItem.redesignAction='replace';
  existingItem.replacementId=newItem.id;
  newItem.source='new';
  newItem.linkedExistingId=existingItem.id;
  return true;
}
function pairSelectedReplacement(){
  const records=selectedFurnitureRecords();
  const existing=records.filter(item=>item.source==='existing');
  const fresh=records.filter(item=>item.source!=='existing');
  if(existing.length!==1||fresh.length!==1){toast('Select one existing piece and one redesign piece');return}
  pairExistingAndReplacement(existing[0],fresh[0]);
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
  toast('Replacement paired');
}
function clearSelectedReplacementPair(){
  const records=selectedFurnitureRecords();
  if(!records.length)return;
  records.forEach(item=>{
    if(item.source==='existing'){
      const paired=pairedReplacementFor(item);
      if(paired)paired.linkedExistingId='';
      item.replacementId='';
      if(item.redesignAction==='replace')item.redesignAction='keep';
    }else if(item.linkedExistingId){
      const existing=linkedExistingFor(item);
      if(existing)existing.replacementId='';
      item.linkedExistingId='';
    }
  });
  pushU();
  draw();
  showP();
}
function setSelectedFurnitureSource(source){
  const records=selectedFurnitureRecords();
  if(!records.length){toast('Select furniture first');return}
  records.forEach(item=>{
    if(item.source==='existing'&&item.replacementId){
      const paired=pairedReplacementFor(item);
      if(paired)paired.linkedExistingId='';
      item.replacementId='';
    }
    if(item.linkedExistingId){
      const existing=linkedExistingFor(item);
      if(existing)existing.replacementId='';
      item.linkedExistingId='';
    }
    item.source=source==='existing'?'existing':'new';
    if(item.source!=='existing'){
      item.redesignAction='keep';
      item.locked=false;
      item.replacementId='';
    }else if(!EXISTING_ACTIONS[item.redesignAction]){
      item.redesignAction='keep';
    }
  });
  if(source==='existing'&&curRoom)curRoom.existingRoomMode=true;
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function setSelectedRedesignAction(action){
  if(!EXISTING_ACTIONS[action])return;
  const records=selectedFurnitureRecords().filter(item=>item.source==='existing');
  if(!records.length){toast('Mark furniture as existing first');return}
  records.forEach(item=>item.redesignAction=action);
  if(action==='remove')records.forEach(item=>item.locked=true);
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function toggleSelectedFurnitureLock(force){
  const records=selectedFurnitureRecords();
  if(!records.length){toast('Select furniture first');return}
  const next=typeof force==='boolean'?force:!records.every(item=>item.locked);
  records.forEach(item=>item.locked=next);
  pushU();
  draw();
  showP();
}
function duplicateForRedesign(){
  const records=selectedFurnitureRecords().filter(item=>item.source==='existing');
  if(!records.length){toast('Select existing furniture first');return}
  const createdIds=[];
  records.forEach((item,index)=>{
    const pos=snapFurniturePoint(item.x+.75*(index+1),item.z+.75*(index+1));
    const copy=normalizeFurnitureRecord({
      ...item,
      id:uid(),
      x:pos.x,
      z:pos.z,
      source:'new',
      redesignAction:'keep',
      locked:false,
      linkedExistingId:item.id,
      replacementId:''
    });
    curRoom.furniture.push(copy);
    item.redesignAction='replace';
    item.replacementId=copy.id;
    createdIds.push(copy.id);
  });
  multiSelFurnitureIds=createdIds;
  const lastIdx=curRoom.furniture.findIndex(f=>f.id===createdIds[createdIds.length-1]);
  sel=lastIdx>=0?{type:'furniture',idx:lastIdx}:{type:null,idx:-1};
  panelHidden=false;
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
  toast(createdIds.length>1?`${createdIds.length} redesign copies created`:'Redesign copy created');
}
function toggleExistingRoomMode(){
  if(!curRoom)return;
  curRoom.existingRoomMode=!curRoom.existingRoomMode;
  if(curRoom.existingRoomMode&&curRoom.furniture.some(item=>item.source==='existing')===false){
    const selected=selectedFurnitureRecords();
    if(selected.length)selected.forEach(item=>item.source='existing');
  }
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function toggleHideRemovedExisting(){
  if(!curRoom)return;
  curRoom.hideRemovedExisting=!curRoom.hideRemovedExisting;
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function toggleGhostExisting(){
  if(!curRoom)return;
  curRoom.ghostExisting=!curRoom.ghostExisting;
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function drawPlanLegend(room){
  if(!ctx||!room?.existingRoomMode||room.showPlanLegend===false)return;
  const mode=currentPlanViewMode(room);
  const entries=mode==='redesign'
    ? [{label:'Existing Keep',stroke:EXISTING_ACTIONS.keep.stroke},{label:'Existing Move',stroke:EXISTING_ACTIONS.move.stroke},{label:'New Pieces',stroke:'#8B7E74'}]
    : mode==='existing'
      ? [{label:'Existing Room',stroke:'#8B7E74'}]
      : [{label:'Keep',stroke:EXISTING_ACTIONS.keep.stroke},{label:'Move',stroke:EXISTING_ACTIONS.move.stroke},{label:'Replace',stroke:EXISTING_ACTIONS.replace.stroke},{label:'Remove',stroke:EXISTING_ACTIONS.remove.stroke},{label:'New',stroke:'#8B7E74'}];
  const x=22,y=18,rowH=18,pad=12,w=170,h=pad*2+22+entries.length*rowH+10;
  ctx.save();
  ctx.fillStyle='rgba(255,250,245,.92)';
  ctx.strokeStyle='rgba(123,107,94,.14)';
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.roundRect(x,y,w,h,16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle='rgba(70,58,48,.82)';
  ctx.font='700 11px Outfit,sans-serif';
  ctx.fillText(`${PLAN_VIEW_MODES[mode]} View`,x+pad,y+20);
  entries.forEach((entry,index)=>{
    const ry=y+34+index*rowH;
    ctx.strokeStyle=entry.stroke;
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(x+pad,ry);
    ctx.lineTo(x+pad+18,ry);
    ctx.stroke();
    ctx.fillStyle='rgba(70,58,48,.74)';
    ctx.font='600 10px Outfit,sans-serif';
    ctx.fillText(entry.label,x+pad+28,ry+3);
  });
  ctx.restore();
}
function toggleFurnitureSnap(){
  furnitureSnap=!furnitureSnap;
  saveEditorPrefs();
  showP();
  draw();
}
function toggleMultiSelectMode(){
  multiSelectMode=!multiSelectMode;
  saveEditorPrefs();
  showP();
  draw();
}
function toggleUnitSystem(){
  unitSystem=unitSystem==='metric'?'imperial':'metric';
  saveEditorPrefs();
  draw();
  showP();
}
