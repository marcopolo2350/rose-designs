// ── UNDO/REDO ──
function pushUBase(){
  if(!curRoom)return;
  const snap=roomSnapshot(curRoom);
  if(!snap)return;
  if(undoSt[undoSt.length-1]===snap)return;
  undoSt.push(snap);
  if(undoSt.length>50)undoSt.shift();
  redoSt=[];
  persistRoomHistory();
  if(typeof updateUndoStrip==='function')updateUndoStrip();
}
function doUndo(){
  if(undoSt.length<=1)return;
  redoSt.push(undoSt.pop());
  Object.assign(curRoom,JSON.parse(undoSt[undoSt.length-1]));
  normalizeRoom(curRoom);
  sel={type:null,idx:-1};
  multiSelFurnitureIds=[];
  hideP();
  draw();
  scheduleRebuild3D();
  persistRoomHistory();
  if(typeof updateUndoStrip==='function')updateUndoStrip();
}
function doRedo(){
  if(!redoSt.length)return;
  const n=redoSt.pop();
  undoSt.push(n);
  Object.assign(curRoom,JSON.parse(n));
  normalizeRoom(curRoom);
  sel={type:null,idx:-1};
  multiSelFurnitureIds=[];
  hideP();
  draw();
  scheduleRebuild3D();
  persistRoomHistory();
  if(typeof updateUndoStrip==='function')updateUndoStrip();
}
let cameraScript=null,walkthroughTrayOpen=false,photoMode=false,photoTrayOpen=false,contactShadowTexture=null,presentationShot='hero',composer=null,last2DViewState=null;
// Phase 3B — HDRI environment maps (Poly Haven CC0, served via jsDelivr). Cached across scene rebuilds.
const HDRI_SOURCES={
  daylight:'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/equirectangular/royal_esplanade_1k.hdr',
  evening: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/equirectangular/moonless_golf_1k.hdr',
  warm:    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/equirectangular/venice_sunset_1k.hdr'
};
const _hdriCache=new Map();
function _resolveHdriKey(id){
  return (id==='evening'||id==='night'||id==='moody'||id==='lamp_lit')?'evening'
       :(id==='warm'||id==='sunset'||id==='warm_evening'||id==='soft_lamp_glow'||id==='golden_hour'||id==='dawn')?'warm'
       :'daylight';
}
function loadHDRIEnvironment(presetId,renderer,sceneRef){
  if(!window.THREE||!THREE.RGBELoader||!THREE.PMREMGenerator)return;
  const key=_resolveHdriKey(presetId);
  const url=HDRI_SOURCES[key];if(!url)return;
  const apply=(envMap)=>{if(sceneRef&&sceneRef===scene){sceneRef.environment=envMap;sceneRef.userData.currentHdriKey=key}};
  if(_hdriCache.has(key)){apply(_hdriCache.get(key));return}
  try{
    const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
    new THREE.RGBELoader().setDataType(THREE.HalfFloatType).load(url,(tex)=>{
      const env=pmrem.fromEquirectangular(tex).texture;
      _hdriCache.set(key,env);
      tex.dispose();pmrem.dispose();
      apply(env);
    },undefined,(err)=>{console.warn('HDRI load failed:',err)});
  }catch(e){console.warn('HDRI setup failed:',e)}
}
// Time-of-day [0..1] → pick the HDRI that matches + tint the directional color.
// 0 = deep night, 0.14 = dawn, 0.3 = morning, 0.5 = noon, 0.72 = golden hour, 0.86 = dusk, 0.96 = lamp-lit night.
function hdriForTOD(t){
  if(t<0.18||t>0.9)return 'evening';
  if(t>0.62)return 'warm';
  return 'daylight';
}
function _lerpHex(a,b,t){
  const ah=parseInt(a.replace('#',''),16),bh=parseInt(b.replace('#',''),16);
  const ar=(ah>>16)&255,ag=(ah>>8)&255,ab=ah&255;
  const br=(bh>>16)&255,bg=(bh>>8)&255,bb=bh&255;
  const r=Math.round(ar+(br-ar)*t),g=Math.round(ag+(bg-ag)*t),bx=Math.round(ab+(bb-ab)*t);
  return '#'+((1<<24)|(r<<16)|(g<<8)|bx).toString(16).slice(1);
}
// Crossfade sky background + directional intensity based on TOD. Keep this cheap — it runs on slider drag.
function applyTimeOfDay(t){
  if(!scene||!curRoom)return;
  t=Math.max(0,Math.min(1,t));
  // Update room metadata so it persists + rebuilds pick it up
  curRoom.materials=curRoom.materials||{};
  curRoom.materials.timeOfDay=t;
  // Live background tint: dawn→noon→golden→dusk→night gradient
  const stops=[
    {t:0.00,c:'#0a0f1e'},{t:0.14,c:'#c8b8b0'},{t:0.30,c:'#d6e1eb'},
    {t:0.50,c:'#dfe8ee'},{t:0.72,c:'#e2c297'},{t:0.86,c:'#d4b9a7'},
    {t:0.96,c:'#2b2a32'},{t:1.00,c:'#0a0f1e'}
  ];
  let a=stops[0],b=stops[stops.length-1];
  for(let i=0;i<stops.length-1;i++){if(t>=stops[i].t&&t<=stops[i+1].t){a=stops[i];b=stops[i+1];break}}
  const lt=(t-a.t)/Math.max(0.0001,(b.t-a.t));
  const col=_lerpHex(a.c,b.c,lt);
  try{scene.background=new THREE.Color(col);if(scene.fog)scene.fog.color=new THREE.Color(col)}catch(_){}
  // Exposure curve: darker at night, brighter at noon
  if(ren){
    const eBase=0.68+Math.sin(Math.min(1,Math.max(0,t))*Math.PI)*0.42;
    ren.toneMappingExposure=eBase*(photoMode?1.08:1);
  }
  // Swap HDRI if the TOD bucket changed
  const targetKey=hdriForTOD(t);
  if(scene.userData.currentHdriKey!==targetKey){
    loadHDRIEnvironment(targetKey,ren,scene);
  }
  // Directional light tint + intensity
  const dir=scene.userData?.styleTargets?.dirLight;
  if(dir){
    const warm=t>0.65?_lerpHex('#ffd6a8','#ff9a5b',Math.min(1,(t-0.65)/0.25)):
               t<0.25?_lerpHex('#9ab4d0','#ffd6a8',Math.min(1,t/0.25)):'#fffaf2';
    try{dir.color=new THREE.Color(warm)}catch(_){}
    dir.intensity=(0.24+Math.sin(Math.max(0,Math.min(1,t))*Math.PI)*1.18);
  }
  const hemi=scene.userData?.styleTargets?.hemiLight;
  if(hemi){hemi.intensity=0.34+Math.sin(Math.max(0,Math.min(1,t))*Math.PI)*0.62}
}
if(typeof window!=='undefined'){window.applyTimeOfDay=applyTimeOfDay}

// ═══════════════════════════════════
// 3D — IMMERSIVE WALKTHROUGH
// ═══════════════════════════════════
function toggle3D(){
  if(is3D){exit3DView();return}
  if(!window.THREE){toast('3D library could not load');return}
  if(!curRoom||!curRoom.polygon.length){toast('Create a room first');return}
  assetWarned=false;
  presentationMode=false;
  compare3DMode=false;
  photoMode=false;
  photoTrayOpen=false;
  last2DViewState={vScale, vOff:{...vOff}};
  is3D=true;panelHidden=false;document.getElementById('threeC').classList.add('on');document.getElementById('b3d').classList.add('on');document.getElementById('vLbl').textContent='Step Inside 3D';document.getElementById('camBtns').classList.add('on');
  document.getElementById('cmCompare').classList.remove('act');
  document.getElementById('cmPhoto')?.classList.remove('act');
  document.getElementById('scrEd').classList.add('mode-3d');
  hideP();build3D();setTimeout(()=>{if(is3D){setViewPreset('eye');showViewChip('3D View - Room');}},80);updateWalkthroughTray();updatePhotoTray();}

function exit3DView(){stop3D();hideViewChip();is3D=false;camMode='orbit';presentationMode=false;compare3DMode=false;photoMode=false;photoTrayOpen=false;cameraScript=null;walkthroughTrayOpen=false;document.getElementById('scrEd').classList.remove('mode-3d','presentation','photo-mode');document.getElementById('threeC').classList.remove('on');document.getElementById('b3d').classList.remove('on');document.getElementById('vLbl').textContent='2D Plan';document.getElementById('camBtns').classList.remove('on');document.getElementById('walkHint').classList.remove('on');document.getElementById('presentPill').classList.remove('on');document.getElementById('presentPill').textContent='Presentation Mode';document.getElementById('photoPill')?.classList.remove('on');document.getElementById('cmCompare').classList.remove('act');document.getElementById('cmTour')?.classList.remove('act');document.getElementById('cmPhoto')?.classList.remove('act');updateWalkthroughTray();updatePhotoTray();resetRoomDebug();initCan();if(last2DViewState){vScale=last2DViewState.vScale;vOff={...last2DViewState.vOff}}draw();showP()}

function presentationShotLabel(mode){
  return ({
    hero:'Hero View',
    favorite:'Favorite Corner',
    overview:'Whole Room',
    intimate:'Intimate View',
    before_after:'Before / After',
  })[mode]||'Hero View';
}
let viewChipTimer=null;
function walkthroughPresetLabel(id){
  return ({
    favorite_corner:'Favorite Corner',
    dollhouse:'Dollhouse',
    stroll:'Stroll',
    corner_reveal:'Corner Reveal',
    before_after:'Before / After',
    romantic_reveal:'Romantic Reveal',
  })[id]||'Walkthrough';
}
function photoPresetLabel(mode){
  return ({
    hero:'Hero Shot',
    favorite:'Favorite Corner',
    intimate:'Intimate',
    overhead:'Overhead',
  })[mode]||'Hero Shot';
}
function viewPresetLabel(mode){
  return ({
    hero:'Hero View',
    overview:'Overview',
    corner:'Favorite Corner',
    eye:'Room View',
  })[mode]||'Orbit';
}
function showViewChip(label,ms=3400){
  const chip=document.getElementById('viewChip');
  if(!chip||!label)return;
  chip.textContent=label;
  chip.classList.add('show');
  if(viewChipTimer)clearTimeout(viewChipTimer);
  viewChipTimer=setTimeout(()=>chip.classList.remove('show'),ms);
}
function hideViewChip(){
  const chip=document.getElementById('viewChip');
  if(viewChipTimer)clearTimeout(viewChipTimer);
  viewChipTimer=null;
  chip?.classList.remove('show');
}
function roomStoryLine(room=curRoom){
  if(!room)return 'A polished view for reviewing the current design direction.';
  const direction=(typeof DESIGN_PRESETS!=='undefined'&&Array.isArray(DESIGN_PRESETS)?DESIGN_PRESETS.find(p=>p.id===room.designPreset)?.name:'')||'Current Direction';
  const mood=(room.mood||'').trim();
  const label=room.optionName||room.name||'This room';
  if(mood)return `${label} is framed as ${mood} ${direction.toLowerCase()} living.`;
  return `${label} is framed as ${direction.toLowerCase()} living.`;
}
function roomCentroidPose(room=curRoom){
  const focus=getRoomFocus(room);
  const centroid=(room?.furniture||[]).length
    ? room.furniture.reduce((acc,f)=>({x:acc.x+(f.x||0),z:acc.z-(f.z||0)}),{x:0,z:0})
    : {x:focus.x,z:-focus.y};
  if((room?.furniture||[]).length){
    centroid.x/=room.furniture.length;
    centroid.z/=room.furniture.length;
  }
  return centroid;
}
function currentFloor3DRooms(room=curRoom){
  if(!room||typeof currentFloorRooms!=='function')return [room].filter(Boolean);
  const rooms=currentFloorRooms(room,room.floorId||activeProjectFloorId)||[];
  return rooms.length?rooms:[room];
}
function getRoomsFocus(rooms=[curRoom]){
  const valid=(rooms||[]).filter(room=>room?.polygon?.length);
  if(!valid.length)return getRoomFocus(curRoom);
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity,maxH=0;
  valid.forEach(room=>{
    room.polygon.forEach(pt=>{
      if(pt.x<minX)minX=pt.x;
      if(pt.y<minY)minY=pt.y;
      if(pt.x>maxX)maxX=pt.x;
      if(pt.y>maxY)maxY=pt.y;
    });
    maxH=Math.max(maxH,room.height||0);
  });
  const width=Math.max(1,maxX-minX),height=Math.max(1,maxY-minY);
  return {x:(minX+maxX)/2,y:(minY+maxY)/2,width,height,maxD:Math.max(width,height),height3D:maxH||curRoom?.height||9};
}
function overviewRoomPose(room=curRoom){
  const rooms=currentFloor3DRooms(room);
  const focus=rooms.length>1?getRoomsFocus(rooms):getRoomFocus(room);
  const roomHeight=rooms.length>1?(focus.height3D||room.height):room.height;
  return {yaw:Math.PI*.16,pitch:.8,dist:Math.max(18,Math.min(56,Math.max(focus.width,focus.height,roomHeight)*2.08)),target:{x:focus.x,y:roomHeight*.47,z:-focus.y}};
}
function addGhostRoomShell(room,wallColor,floorColor){
  if(!scene||!room?.polygon?.length)return;
  const floorShape=new THREE.Shape();
  room.polygon.forEach((p,i)=>!i?floorShape.moveTo(p.x,p.y):floorShape.lineTo(p.x,p.y));
  floorShape.closePath();
  const floorMat=new THREE.MeshStandardMaterial({color:floorColor.clone(),roughness:.95,metalness:0,transparent:true,opacity:.24,depthWrite:false});
  const floorMesh=new THREE.Mesh(new THREE.ShapeGeometry(floorShape),floorMat);
  floorMesh.rotation.x=-Math.PI/2;
  floorMesh.position.y=.01;
  floorMesh.renderOrder=-2;
  scene.add(floorMesh);
  const wallMat=new THREE.MeshStandardMaterial({color:wallColor.clone(),roughness:.8,metalness:0,transparent:true,opacity:.18,depthWrite:false});
  (room.walls||[]).forEach(wall=>{
    const a=wS(room,wall),b=wE(room,wall),wl=wL(room,wall),an=wA(room,wall);
    if(wl<.08)return;
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(wl,room.height||9,.1),wallMat);
    mesh.position.set((a.x+b.x)/2,(room.height||9)/2,-(a.y+b.y)/2);
    mesh.rotation.y=-an;
    scene.add(mesh);
  });
}
function intimateRoomPose(room=curRoom){
  const focus=getRoomFocus(room);
  const centroid=roomCentroidPose(room);
  return {
    yaw:Math.PI*.3,
    pitch:.42,
    dist:Math.max(15,Math.min(28,Math.max(focus.width,focus.height,room.height)*1.15)),
    target:{x:(focus.x*.72)+(centroid.x*.28),y:room.height*.38,z:(-focus.y*.72)+(centroid.z*.28)}
  };
}
function heroRoomPose(room=curRoom){
  const favorite=favoriteCornerPose(room);
  return {
    yaw:favorite.yaw,
    pitch:Math.max(.34,favorite.pitch||.36),
    dist:Math.max(14,Math.min(26,favorite.dist*1.08)),
    target:{...favorite.target}
  };
}
function refreshPresentationPill(){
  const pill=document.getElementById('presentPill');
  if(!pill)return;
  const compareLabel=compare3DMode&&curRoom?`${PLAN_VIEW_MODES[currentPlanViewMode(curRoom)]||'Combined'} View`:'';
  let text='Presentation Mode';
  if(presentationMode)text=`Reveal Mode - ${presentationShotLabel(presentationShot)}`;
  else if(compare3DMode)text=compareLabel;
  pill.textContent=text;
  pill.classList.toggle('on',presentationMode||compare3DMode);
}
function updatePresentationTray(){
  const existing=document.getElementById('presentTray');
  if(!is3D||!presentationMode||photoMode){if(existing)existing.remove();return;}
  const stats=collectRoomPlanStats(curRoom);
  const shots=[
    ['hero','Hero View','Balanced framing for a polished first impression.'],
    ['favorite','Favorite Corner','Leans into the room\'s strongest composed angle.'],
    ['overview','Whole Room','Pulls back for a calm, readable room overview.'],
    ['intimate','Intimate View','Moves closer for warmer, more editorial storytelling.'],
    ['before_after','Before / After','Stages the existing, redesign, and combined story in sequence.'],
  ];
  const markup=`<div class="present-tray" id="presentTray"><div class="present-panel"><div class="present-head"><div><div class="present-title">Reveal Mode</div><div class="present-copy">${roomStoryLine(curRoom)}</div></div><button class="mini-chip secondary" type="button" data-action="toggle-presentation-mode">Exit</button></div><div class="present-story"><span class="present-story-label">${curRoom.optionName||curRoom.name||'Room Story'}</span><span class="present-story-meta">Keep ${stats.keep} | Move ${stats.move} | Replace ${stats.replace} | Remove ${stats.remove}</span></div><div class="present-grid">${shots.map(([id,label,copy])=>`<button class="present-shot${presentationShot===id?' active':''}" type="button" data-action="set-presentation-shot" data-shot="${id}"><span class="present-shot-title">${label}</span><span class="present-shot-copy">${copy}</span></button>`).join('')}</div><div class="present-actions"><button class="mini-chip" type="button" data-action="capture-presentation-still">Capture Cover</button><button class="mini-chip secondary" type="button" data-action="toggle-3d-compare-mode">Cycle Compare View</button><button class="mini-chip secondary" type="button" data-action="toggle-photo-mode" data-photo-force="true">Open Photo Mode</button></div></div></div>`;
  if(existing)existing.outerHTML=markup; else document.getElementById('cWrap').insertAdjacentHTML('beforeend',markup);
  refreshPresentationPill();
}

function togglePresentationMode(){
  if(!is3D)return;
  if(photoMode)togglePhotoMode(false);
  presentationMode=!presentationMode;
  document.getElementById('scrEd').classList.toggle('presentation',presentationMode);
  document.getElementById('cmPresent')?.classList.toggle('act',presentationMode);
  if(presentationMode){
    walkthroughTrayOpen=false;
    document.getElementById('cmTour')?.classList.remove('act');
    presentationShot='hero';
    compare3DMode=false;
    curRoom.planViewMode='combined';
    document.getElementById('cmCompare')?.classList.remove('act');
    setPresentationShot('hero');
  }else cameraScript=null;
  refreshPresentationPill();
  updatePresentationTray();
}
function setViewPreset(mode){
  if(!is3D||!curRoom)return;
  const focus=getRoomFocus(curRoom);
  const floorRooms=currentFloor3DRooms(curRoom);
  camMode='orbit';
  document.getElementById('cmOrbit').classList.add('act');
  document.getElementById('cmWalk').classList.remove('act');
  if(mode==='hero'){
    const pose=heroRoomPose(curRoom);
    cYaw=pose.yaw;cPitch=pose.pitch;cDist=pose.dist;orbitTarget={...pose.target};
    showViewChip('3D View - '+viewPresetLabel(mode));
    return;
  }
  if(mode==='overview'){
    const pose=overviewRoomPose(curRoom);
    cYaw=pose.yaw;cPitch=pose.pitch;cDist=pose.dist;orbitTarget={...pose.target};
    showViewChip('3D View - '+(floorRooms.length>1?'Whole Floor':viewPresetLabel(mode)));
    return;
  }else if(mode==='corner'){
    const pose=favoriteCornerPose(curRoom);
    cYaw=pose.yaw;cPitch=pose.pitch;cDist=Math.max(10,Math.min(20,pose.dist));orbitTarget={...pose.target};
    showViewChip('3D View - '+viewPresetLabel(mode));
    return;
  }else if(mode==='eye'){
    const pose=intimateRoomPose(curRoom);
    cYaw=pose.yaw;cPitch=pose.pitch;cDist=pose.dist;orbitTarget={...pose.target};
    showViewChip('3D View - '+viewPresetLabel(mode));
    return;
  }
  orbitTarget={x:focus.x,y:curRoom.height*.42,z:-focus.y};
  showViewChip('3D View - '+viewPresetLabel(mode));
}
function focusFurniture3D(itemOrId){
  if(!is3D||!curRoom)return;
  const id=typeof itemOrId==='string'?itemOrId:itemOrId?.id;
  const item=(curRoom.furniture||[]).find(f=>f.id===id)||itemOrId;
  if(!item)return;
  const placement=getFurniturePlacement(item,curRoom);
  camMode='orbit';
  document.getElementById('cmOrbit').classList.add('act');
  document.getElementById('cmWalk').classList.remove('act');
  orbitTarget={x:placement.position.x,y:Math.max(.9,placement.position.y+(verificationTargetSize(item.assetKey||'').h*.22)),z:placement.position.z};
  cDist=Math.max(6.8,Math.min(18,Math.max(item.w||2,item.d||2)*3.1));
  cPitch=.34;
  cYaw=Math.PI*.14;
}
function toggleWalkthroughTray(){
  if(!is3D)return;
  if(photoMode)togglePhotoMode(false);
  if(presentationMode)togglePresentationMode();
  walkthroughTrayOpen=!walkthroughTrayOpen;
  document.getElementById('cmTour')?.classList.toggle('act',walkthroughTrayOpen);
  updateWalkthroughTray();
}
function updateWalkthroughTray(){
  const existing=document.getElementById('tourTray');
  if(!is3D||!walkthroughTrayOpen||photoMode||presentationMode){if(existing)existing.remove();return;}
  const isTouch=(navigator.maxTouchPoints||0)>0||window.innerWidth<=760;
  const presets=[
    ['favorite_corner','Favorite Corner','Finds the room’s best-composed angle.'],
    ['dollhouse','Dollhouse','Pulls back for the full room form.'],
    ['stroll','Stroll','Walks the room at eye level.'],
    ['corner_reveal','Corner Reveal','Settles into a cinematic corner angle.'],
    ['before_after','Before / After','Cycles existing, redesign, and combined.'],
    ['romantic_reveal','Romantic Reveal','Soft presentation sweep for the final feel.'],
  ];
  const markup='<div class="tour-tray'+(isTouch?' touch':'')+'" id="tourTray"><div class="tour-panel'+(isTouch?' touch':'')+'"><div class="tour-head"><div><div class="tour-title">Walkthrough Presets</div><div class="tour-copy">'+(isTouch?'Pick a move and keep your thumb near the bottom edge.':'Choose a camera move for the room.')+'</div></div><button class="mini-chip secondary" type="button" data-action="toggle-walkthrough-tray">Close</button></div><div class="tour-grid'+(isTouch?' touch':'')+'">'+presets.map(([id,label,copy])=>'<button class="tour-preset'+(isTouch?' touch':'')+'" type="button" data-action="start-walkthrough-preset" data-preset-id="'+id+'"><span class="tour-preset-title">'+label+'</span><span class="tour-preset-copy">'+copy+'</span></button>').join('')+'</div></div></div>';
  if(existing)existing.outerHTML=markup; else document.getElementById('cWrap').insertAdjacentHTML('beforeend',markup);
}
function togglePhotoMode(force){
  if(!is3D)return;
  const next=typeof force==='boolean'?force:!photoMode;
  photoMode=next;
  if(photoMode){
    presentationMode=false;
    walkthroughTrayOpen=false;
    photoTrayOpen=true;
    document.getElementById('scrEd').classList.remove('presentation');
    document.getElementById('presentPill').classList.remove('on');
    document.getElementById('cmPresent')?.classList.remove('act');
    document.getElementById('cmTour')?.classList.remove('act');
    setPhotoPreset('hero');
  }else{
    photoTrayOpen=false;
  }
  document.getElementById('scrEd').classList.toggle('photo-mode',photoMode);
  document.getElementById('photoPill')?.classList.toggle('on',photoMode);
  document.getElementById('cmPhoto')?.classList.toggle('act',photoMode);
  updateWalkthroughTray();
  updatePhotoTray();
  applyRoomStyleToScene?.();
}
function updatePhotoTray(){
  const existing=document.getElementById('photoTray');
  if(!is3D||!photoMode||!photoTrayOpen){if(existing)existing.remove();return;}
  const presets=[
    ['hero','Hero Shot','Balanced hero angle for clean presentation images.'],
    ['favorite','Favorite Corner','Frames the room from its best-composed corner.'],
    ['intimate','Intimate','Moves in closer for softer, warmer storytelling.'],
    ['overhead','Overhead','Pulls up for a styled layout overview.']
  ];
  const markup=`<div class="photo-tray" id="photoTray"><div class="photo-panel"><div class="photo-head"><div><div class="photo-title">Photo Mode</div><div class="photo-copy">Clean capture UI, styled camera presets, and higher-quality PNG export.</div></div><button class="mini-chip secondary" type="button" data-action="toggle-photo-mode" data-photo-force="false">Exit</button></div><div class="photo-grid">${presets.map(([id,label,copy])=>`<button class="photo-preset" type="button" data-action="set-photo-preset" data-photo-preset="${id}"><span class="photo-preset-title">${label}</span><span class="photo-preset-copy">${copy}</span></button>`).join('')}</div><div class="photo-actions"><button class="mini-chip" type="button" data-action="capture-photo-mode">Capture PNG</button><button class="mini-chip secondary" type="button" data-action="set-view-preset" data-view-preset="corner">Reset View</button></div></div></div>`;
  if(existing)existing.outerHTML=markup; else document.getElementById('cWrap').insertAdjacentHTML('beforeend',markup);
}
function setPhotoPreset(mode){
  if(!is3D||!curRoom)return;
  const focus=getRoomFocus(curRoom);
  const current={yaw:cYaw,pitch:cPitch,dist:cDist,target:{...(orbitTarget||{x:focus.x,y:curRoom.height*.42,z:-focus.y})}};
  const favorite=favoriteCornerPose(curRoom);
  const poses={
    hero:favorite,
    favorite:favorite,
    intimate:{yaw:Math.PI*.58,pitch:.26,dist:Math.max(8.8,Math.min(18,Math.max(focus.width,focus.height)*.92)),target:{x:focus.x,y:curRoom.height*.34,z:-focus.y}},
    overhead:{yaw:Math.PI*.12,pitch:.86,dist:Math.max(16,Math.min(30,Math.max(focus.width,focus.height,curRoom.height)*1.32)),target:{x:focus.x,y:curRoom.height*.46,z:-focus.y}}
  };
  const next=poses[mode]||poses.hero;
  playCameraSequence([{duration:1100,apply:t=>applyCameraTween(current,next,t)}]);
}
function capturePhotoMode(download=true){
  if(!is3D||!ren||!cam)return null;
  const size=ren.getSize(new THREE.Vector2());
  const prevRatio=ren.getPixelRatio();
  const targetRatio=Math.min((photoMode?2.4:2)*Math.max(1,window.devicePixelRatio||1),3);
  ren.setPixelRatio(targetRatio);
  ren.setSize(size.x,size.y,false);
  if(composer){composer.setSize(size.x,size.y);if(composer._fxaa){const pr=ren.getPixelRatio();composer._fxaa.material.uniforms['resolution'].value.set(1/(size.x*pr),1/(size.y*pr))}composer.render()}else ren.render(scene,cam);
  const dataUrl=ren.domElement.toDataURL('image/png');
  ren.setPixelRatio(prevRatio);
  ren.setSize(size.x,size.y,false);
  if(composer){composer.setSize(size.x,size.y);if(composer._fxaa){const pr=ren.getPixelRatio();composer._fxaa.material.uniforms['resolution'].value.set(1/(size.x*pr),1/(size.y*pr))}composer.render()}else ren.render(scene,cam);
  if(download){
    const a=document.createElement('a');
    a.href=dataUrl;
    a.download=`${(curRoom?.name||'room').replace(/[^a-z0-9]/gi,'_')}_photo_mode.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Photo capture exported');
  }
  return dataUrl;
}
function easeInOut(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function applyCameraTween(from,to,t){
  const p=easeInOut(Math.max(0,Math.min(1,t)));
  camMode='orbit';
  cYaw=from.yaw+(to.yaw-from.yaw)*p;
  cPitch=from.pitch+(to.pitch-from.pitch)*p;
  cDist=from.dist+(to.dist-from.dist)*p;
  orbitTarget={x:from.target.x+(to.target.x-from.target.x)*p,y:from.target.y+(to.target.y-from.target.y)*p,z:from.target.z+(to.target.z-from.target.z)*p};
}
function applyWalkTween(from,to,t){
  const p=easeInOut(Math.max(0,Math.min(1,t)));
  camMode='walk';
  fpPos.x=from.x+(to.x-from.x)*p;
  fpPos.z=from.z+(to.z-from.z)*p;
}
function playCameraSequence(steps){cameraScript={steps,index:-1,stepStart:performance.now()}}
function setCompareModeForTour(mode){
  if(!curRoom)return;
  curRoom.planViewMode=mode;
  compare3DMode=mode!=='combined';
  const btn=document.getElementById('cmCompare');
  if(btn)btn.classList.toggle('act',compare3DMode);
  refreshPresentationPill();
  updatePresentationTray();
  scheduleRebuild3D(30);
}
function findTourWalkPoint(index,total){
  const floorRooms=currentFloor3DRooms(curRoom);
  const focus=floorRooms.length>1?getRoomsFocus(floorRooms):getRoomFocus(curRoom),radius=Math.max(1.4,Math.min(focus.maxD*.35,4.8)),angle=-Math.PI*.25+(index/Math.max(1,total-1))*Math.PI*.5;
  const candidate={x:focus.x+Math.cos(angle)*radius,z:-focus.y+Math.sin(angle)*radius};
  return clampWalkPos(candidate.x,candidate.z,floorRooms)?candidate:findWalkStart(floorRooms);
}
function favoriteCornerPose(room){
  const focus=getRoomFocus(room);
  const centroid=(room.furniture||[]).length
    ? room.furniture.reduce((acc,f)=>({x:acc.x+(f.x||0),z:acc.z-(f.z||0)}),{x:0,z:0})
    : {x:focus.x,z:-focus.y};
  if((room.furniture||[]).length){
    centroid.x/=(room.furniture||[]).length;
    centroid.z/=(room.furniture||[]).length;
  }
  const b=getRoomBounds2D(room);
  const inset=Math.max(.9,Math.min(2.4,Math.min(focus.width,focus.height)*.08));
  const corners=[
    {x:b.x0+inset,z:-b.y0-inset},
    {x:b.x1-inset,z:-b.y0-inset},
    {x:b.x1-inset,z:-b.y1+inset},
    {x:b.x0+inset,z:-b.y1+inset},
  ];
  let best=null;
  corners.forEach(corner=>{
    const dx=centroid.x-corner.x,dz=centroid.z-corner.z;
    const dist=Math.hypot(dx,dz);
    const score=dist-(Math.abs(dx)+Math.abs(dz))*.08;
    if(!best||score>best.score)best={corner,score,dist,dx,dz};
  });
  const yaw=Math.atan2(best.dx,-best.dz);
  const target={
    x:centroid.x+(best.dx*-0.06),
    y:room.height*.38,
    z:centroid.z+(best.dz*-0.06)
  };
  const dist=Math.max(8.5,Math.min(18,Math.max(focus.width,focus.height)*.82));
  return {yaw,pitch:.28,dist,target};
}
function startWalkthroughPreset(id){
  if(!is3D||!curRoom)return;
  walkthroughTrayOpen=false;updateWalkthroughTray();
  const floorRooms=currentFloor3DRooms(curRoom);
  const floorFocus=floorRooms.length>1?getRoomsFocus(floorRooms):getRoomFocus(curRoom);
  const focus=getRoomFocus(curRoom);
  const current={yaw:cYaw,pitch:cPitch,dist:cDist,target:{...(orbitTarget||{x:floorFocus.x,y:(floorFocus.height3D||curRoom.height)*.42,z:-floorFocus.y})}};
  const overview={yaw:Math.PI*.18,pitch:.78,dist:Math.max(18,Math.min(52,Math.max(floorFocus.width,floorFocus.height,floorFocus.height3D||curRoom.height)*2.2)),target:{x:floorFocus.x,y:(floorFocus.height3D||curRoom.height)*.5,z:-floorFocus.y}};
  const corner={yaw:Math.PI*.62,pitch:.36,dist:Math.max(12,Math.min(30,Math.max(focus.width,focus.height)*1.35)),target:{x:focus.x,y:curRoom.height*.4,z:-focus.y}};
  const romantic={yaw:Math.PI*.52,pitch:.28,dist:Math.max(10,Math.min(24,Math.max(focus.width,focus.height)*1.1)),target:{x:focus.x,y:curRoom.height*.36,z:-focus.y}};
  const favorite=favoriteCornerPose(curRoom);
  if(id==='favorite_corner')playCameraSequence([{duration:1800,apply:t=>applyCameraTween(current,favorite,t)}]);
  else if(id==='dollhouse')playCameraSequence([{duration:2200,apply:t=>applyCameraTween(current,overview,t)}]);
  else if(id==='corner_reveal')playCameraSequence([{duration:1500,apply:t=>applyCameraTween(current,overview,t)},{duration:2200,apply:t=>applyCameraTween(overview,corner,t)}]);
  else if(id==='romantic_reveal'){presentationMode=true;document.getElementById('scrEd').classList.add('presentation');document.getElementById('presentPill').classList.add('on');playCameraSequence([{duration:1600,apply:t=>applyCameraTween(current,corner,t)},{duration:2400,apply:t=>applyCameraTween(corner,romantic,t)}]);}
  else if(id==='before_after')playCameraSequence([{duration:900,onStart:()=>setCompareModeForTour('existing'),apply:t=>applyCameraTween(current,corner,t)},{duration:1200,onStart:()=>setCompareModeForTour('redesign'),apply:t=>applyCameraTween(corner,{...corner,yaw:corner.yaw+.24},t)},{duration:1200,onStart:()=>setCompareModeForTour('combined'),apply:t=>applyCameraTween({...corner,yaw:corner.yaw+.24},overview,t)}]);
  else if(id==='stroll'){
    const pts=[findTourWalkPoint(0,3),findTourWalkPoint(1,3),findTourWalkPoint(2,3)];
    playCameraSequence([{duration:400,onStart:()=>setCamMode('walk'),apply:()=>{}},{duration:1800,apply:t=>applyWalkTween(fpPos,pts[0],t)},{duration:1800,apply:t=>applyWalkTween(pts[0],pts[1],t)},{duration:1800,apply:t=>applyWalkTween(pts[1],pts[2],t)},{duration:900,onStart:()=>setCamMode('orbit'),apply:()=>{}}]);
  }
}
// Phase ✨ — Easing curves for walkthrough. Previously progress was linear, so every
// camera move felt robotic. easeInOutCubic on the default, easeOutQuint on reveals.
function _easeInOutCubic(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
function _easeOutQuint(t){return 1-Math.pow(1-t,5)}
function _easeInOutQuart(t){return t<0.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2}
function updateCameraScript(now){
  if(!cameraScript||!cameraScript.steps?.length)return;
  if(cameraScript.index===-1){cameraScript.index=0;cameraScript.stepStart=now;cameraScript.steps[0].onStart?.();}
  const step=cameraScript.steps[cameraScript.index];
  const raw=Math.max(0,Math.min(1,(now-cameraScript.stepStart)/Math.max(1,step.duration||1)));
  const ease=step.ease||'inOutCubic';
  const progress=ease==='outQuint'?_easeOutQuint(raw):ease==='inOutQuart'?_easeInOutQuart(raw):ease==='linear'?raw:_easeInOutCubic(raw);
  step.apply?.(progress);
  if(raw>=1){cameraScript.index+=1;if(cameraScript.index>=cameraScript.steps.length){cameraScript=null;return;}cameraScript.stepStart=now;cameraScript.steps[cameraScript.index].onStart?.();}
}

function setCamMode(m){
  camMode=m;document.getElementById('cmOrbit').classList.toggle('act',m==='orbit');document.getElementById('cmWalk').classList.toggle('act',m==='walk');
  const r=curRoom,floorRooms=currentFloor3DRooms(r),focus=floorRooms.length>1?getRoomsFocus(floorRooms):getRoomFocus(r);
  orbitTarget={x:focus.x,y:(floorRooms.length>1?(focus.height3D||r.height):r.height)*.42,z:-focus.y};
  if(scene){scene.traverse(obj=>{if(obj.name==='roomCeiling'||obj.name==='roomCeilingDetails')obj.visible=m==='walk'})}
  if(m==='walk'){const start=findWalkStart(floorRooms);const startRoom=getWalkRoomAtPoint?.(start.x,start.z,floorRooms)||r;fpPos={x:start.x,y:Math.max(4.9,Math.min((startRoom.height||r.height)-1.15,(startRoom.height||r.height)*.54)),z:start.z};cYaw=0;cPitch=0;orbitVel={yaw:0,pitch:0,zoom:0};bindWalkKeys();if(typeof recordWalkUsage==='function')recordWalkUsage();
    document.getElementById('walkHint').classList.add('on');setTimeout(()=>document.getElementById('walkHint').classList.remove('on'),2500);}
  else{cYaw=Math.PI*.18;cPitch=.52;cDist=Math.max(11,Math.min(42,Math.max(cDist||17,focus.maxD*2.35,Math.max(focus.width||0,focus.height||0,r.height*.9)*1.65,r.height*1.45)));orbitVel={yaw:0,pitch:0,zoom:0}}
  showViewChip(`3D View - ${m==='walk'?'Walk':'Orbit'}`);
  updateWalkUI();updateWalkthroughTray()}
function startWalkMove(dir){activeWalkDir=dir||0}
function stopWalkMove(){activeWalkDir=0}
function startWalkTurn(dir){activeTurnDir=dir||0}
function stopWalkTurn(){activeTurnDir=0}
function toggleWalkControlLayout(){
  walkControlLayout=walkControlLayout==='wide'?'auto':'wide';
  updateWalkUI();
}
function getLightingPreset(room){
  return LIGHTING_PRESETS[room?.materials?.lightingPreset||'daylight']||LIGHTING_PRESETS.daylight;
}
function getLightCharacter(room){
  return Math.max(0,Math.min(1,room?.materials?.lightCharacter??.5));
}
function computeSceneLightingState(room){
  const preset=getLightingPreset(room);
  const t=getLightCharacter(room);
  const morningSky=safeThreeColor('#d8e2ea','#d8e2ea');
  const noonSky=safeThreeColor('#dde6eb','#dde6eb');
  const sunsetSky=safeThreeColor('#d3b28f','#d3b28f');
  const blueHour=safeThreeColor('#7c8396','#7c8396');
  const practicalBias=Math.max(0,Math.min(1,(preset.practical||0)));
  const daylightBlend=t<.55?t/.55:1;
  const warmSky=daylightBlend<1?morningSky.clone().lerp(noonSky,daylightBlend):sunsetSky.clone().lerp(blueHour,Math.max(0,(t-.55)/.45));
  const background=safeThreeColor(preset.background,'#0f141c').lerp(warmSky,.3-(practicalBias*.1));
  const dirColor=safeThreeColor(preset.dirColor,0xffffff).lerp(safeThreeColor('#ffd6a8','#ffd6a8'),Math.max(0,t-.35)*.34);
  const warmColor=safeThreeColor(preset.warm,0xFFF1D3).lerp(safeThreeColor('#ffd0a1','#ffd0a1'),Math.max(0,t-.4)*.32);
  const dirHeight=(room?.height||9)*(1.9-t*.72);
  const dirDepth=Math.max(4,(room?.height||9))*(.72+t*.55);
  return {
    preset,
    background,
    dirColor,
    warmColor,
    exposure:preset.exposure*(photoMode?1.05:1)*(0.94-t*.04),
    ambientIntensity:preset.ambient*(0.94-t*.04),
    hemiIntensity:preset.ambient*(1.02-t*.05),
    dirIntensity:preset.dir*(0.92-t*.1),
    fillIntensity:preset.ambient*(.38+t*.08),
    practicalMultiplier:(preset.practical||.04)*(1+t*.28+(photoMode?.08:0)),
    fogNear:(preset.fogNear||28)*(photoMode?1.08:1),
    fogFar:(preset.fogFar||82)*(photoMode?1.08:1),
    sunPosition:{x:Math.max(6,(room?.height||9))*((t<.5)?1.05:.9),y:dirHeight,z:dirDepth*((t<.5)?.85:.55)},
    fillPosition:{x:-Math.max(5,(room?.height||9))*.82,y:(room?.height||9)*(1.08-t*.12),z:-Math.max(5,(room?.height||9))*(.35+t*.2)},
    shadowStrength:photoMode?.28:.22
  };
}
function getContactShadowTexture(){
  if(contactShadowTexture)return contactShadowTexture;
  const can=document.createElement('canvas');
  can.width=256;can.height=256;
  const c=can.getContext('2d');
  const grad=c.createRadialGradient(128,128,16,128,128,112);
  grad.addColorStop(0,'rgba(48,32,22,.34)');
  grad.addColorStop(.55,'rgba(48,32,22,.12)');
  grad.addColorStop(1,'rgba(48,32,22,0)');
  c.fillStyle=grad;
  c.fillRect(0,0,256,256);
  contactShadowTexture=new THREE.CanvasTexture(can);
  contactShadowTexture.needsUpdate=true;
  return contactShadowTexture;
}
function buildContactShadowMesh(f){
  if(!f||['wall','ceiling','surface'].includes(f.mountType))return null;
  const w=Math.max(.8,(f.w||2)*1.08);
  const d=Math.max(.8,(f.d||1.5)*1.06);
  const opacity=(String(f.assetKey||'').includes('rug')?.08:.16)+(photoMode?.03:0);
  const mat=new THREE.MeshBasicMaterial({map:getContactShadowTexture(),transparent:true,opacity,depthWrite:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);
  mesh.rotation.x=-Math.PI/2;
  mesh.position.y=.02;
  mesh.renderOrder=1;
  return mesh;
}
function canUseLampShadows(room){
  const lamps=(room?.furniture||[]).filter(f=>String(f.assetKey||'').startsWith('lamp_')).length;
  const mobile=(navigator.maxTouchPoints||0)>0;
  return mobile?lamps<=2:lamps<=4;
}
function registerPracticalLight(light,baseIntensity,baseDistance,room=curRoom){
  if(!scene?.userData?.styleTargets||!light)return;
  if(!scene.userData.styleTargets.practicalLights)scene.userData.styleTargets.practicalLights=[];
  scene.userData.styleTargets.practicalLights.push({light,baseIntensity,baseDistance,room});
}
function addRoomPracticalLight(type,anchor,preset,room){
  if(!anchor||!scene||preset.practical<.12)return;
  const useShadows=canUseLampShadows(room);
  const warmColor=safeThreeColor(preset.warm,0xFFBE78);
  const ceilingBoost=room?.materials?.ceilingBrightness||1;
  const addBulb=(pos,size=.12,intensity=.55)=>{
    const bulb=new THREE.Mesh(
      new THREE.SphereGeometry(size,18,18),
      new THREE.MeshStandardMaterial({color:0xfff4d7,emissive:0xffd39b,emissiveIntensity:intensity,roughness:.2,metalness:0})
    );
    bulb.position.copy(pos);
    anchor.add(bulb);
  };
    if(type==='lamp_floor'||type==='lamp_stand'){
      const light=new THREE.PointLight(warmColor,preset.practical*3.2*ceilingBoost,11,1.7);
    light.position.set(0,4.9,0);
    light.castShadow=useShadows;
    light.shadow.mapSize.width=useShadows?768:256;
    light.shadow.mapSize.height=useShadows?768:256;
    light.shadow.bias=-0.0008;
    anchor.add(light);
    addBulb(new THREE.Vector3(0,4.9,0),.14,.8);
    registerPracticalLight(light,3.2,11,room);
    }else if(type==='lamp_table'){
      const light=new THREE.PointLight(warmColor,preset.practical*2.1*ceilingBoost,6.5,1.85);
    light.position.set(0,1.15,0);
    light.castShadow=useShadows;
    light.shadow.mapSize.width=useShadows?512:256;
    light.shadow.mapSize.height=useShadows?512:256;
    light.shadow.bias=-0.001;
    anchor.add(light);
    addBulb(new THREE.Vector3(0,1.1,0),.1,.7);
    registerPracticalLight(light,2.1,6.5,room);
    }else if(type==='lamp_wall'){
      const light=new THREE.SpotLight(warmColor,preset.practical*3.1*ceilingBoost,12,Math.PI/4,.45,1.25);
    light.position.set(0,.3,-.08);
    light.target.position.set(0,-1.15,2.2);
    light.castShadow=useShadows;
    light.shadow.mapSize.width=useShadows?768:256;
    light.shadow.mapSize.height=useShadows?768:256;
    light.shadow.bias=-0.0012;
    anchor.add(light);
    anchor.add(light.target);
    addBulb(new THREE.Vector3(0,.26,0),.09,.75);
    registerPracticalLight(light,3.1,12,room);
    }else if(type==='lamp_pendant'||type==='lamp_chandelier'||type==='lamp_ceiling'||type==='lamp_cube'){
      const light=new THREE.PointLight(warmColor,preset.practical*3.8*ceilingBoost,13,1.55);
    light.position.set(0,-.2,0);
    light.castShadow=useShadows;
    light.shadow.mapSize.width=useShadows?768:256;
    light.shadow.mapSize.height=useShadows?768:256;
    light.shadow.bias=-0.001;
    anchor.add(light);
    addBulb(new THREE.Vector3(0,-.15,0),.12,.85);
    registerPracticalLight(light,3.8,13,room);
  }
}

function pushStyleMaterial(bucket,material,room=curRoom){
  if(!scene?.userData?.styleTargets||!material)return material;
  if(!scene.userData.styleTargets[bucket])scene.userData.styleTargets[bucket]=[];
  scene.userData.styleTargets[bucket].push({material,room});
  return material;
}
function pushStyleNode(bucket,node,room=curRoom){
  if(!scene?.userData?.styleTargets||!node)return node;
  if(!scene.userData.styleTargets[bucket])scene.userData.styleTargets[bucket]=[];
  scene.userData.styleTargets[bucket].push({node,room});
  return node;
}
function buildRoomEnvelope3D(room,{floorFocus,renderer}={}){
  if(!room?.polygon?.length||!scene)return;
  const roomHeight=room.height||curRoom?.height||9;
  const wallFinish=WALL_PALETTES.find(x=>x.id===(room.materials.wallFinish||'warm_white'))||WALL_PALETTES[0];
  const floorPreset=FLOOR_TYPES.find(x=>x.id===(room.materials.floorType||'light_oak'))||FLOOR_TYPES[0];
  const tc=safeThreeColor(room.materials.trim,TRIM_COLORS[0]);
  const wc=safeThreeColor(room.materials.wall,WALL_PALETTES[0].color);
  const floorShape=new THREE.Shape();
  room.polygon.forEach((p,i)=>!i?floorShape.moveTo(p.x,p.y):floorShape.lineTo(p.x,p.y));
  floorShape.closePath();
  const floorMap=buildFloorTexture(room.materials.floor,room.materials.floorType||'light_oak');
  const floorAccentMap=buildFloorAccentTexture(room.materials.floorType||'light_oak');
  const floorGeo=applyPlanarUVs(new THREE.ShapeGeometry(floorShape),room.polygon);
  const floorMat=pushStyleMaterial('floorMats',new THREE.MeshStandardMaterial({color:safeThreeColor(room.materials.floor,floorPreset.color),roughness:Math.max(.8,Number.isFinite(floorPreset.roughness)?floorPreset.roughness:.88),metalness:0,map:floorMap}),room);
  if(floorMat.map){floorMat.map.needsUpdate=true;try{floorMat.map.anisotropy=Math.min(16,renderer?.capabilities?.getMaxAnisotropy?.()||1)}catch(_){}}
  const floorMesh=new THREE.Mesh(floorGeo,floorMat);floorMesh.rotation.x=-Math.PI/2;floorMesh.receiveShadow=true;scene.add(floorMesh);pushStyleNode('floorMeshes',floorMesh,room);
  const accentMat=new THREE.MeshStandardMaterial({color:safeThreeColor(room.materials.floor,floorPreset.color),roughness:1,metalness:0,map:floorAccentMap,transparent:true,opacity:.14,depthWrite:true});
  const accentMesh=new THREE.Mesh(applyPlanarUVs(new THREE.ShapeGeometry(floorShape),room.polygon),accentMat);accentMesh.rotation.x=-Math.PI/2;accentMesh.position.y=.003;accentMesh.renderOrder=-1;scene.add(accentMesh);pushStyleNode('floorAccents',accentMesh,room);
  const ceilColor=safeThreeColor(room.materials.ceiling,'#FAF7F2').multiplyScalar(Math.max(.86,Math.min(1.18,room.materials.ceilingBrightness||1)));
  const ceilMesh=new THREE.Mesh(new THREE.ShapeGeometry(floorShape),pushStyleMaterial('ceilingMats',new THREE.MeshStandardMaterial({color:ceilColor,roughness:.92,side:THREE.BackSide}),room));ceilMesh.name='roomCeiling';ceilMesh.visible=camMode==='walk';ceilMesh.rotation.x=-Math.PI/2;ceilMesh.position.y=roomHeight-.01;scene.add(ceilMesh);
  const style=room.materials.ceilingStyle||'flat';
  if(style!=='flat'){
    const grp=new THREE.Group();grp.name='roomCeilingDetails';grp.visible=camMode==='walk';
    if(style==='crown'){
      const crownMat=pushStyleMaterial('trimMats',new THREE.MeshStandardMaterial({color:tc,roughness:.45,metalness:.04,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),room);
      room.walls.forEach(wall=>{
        const a=wS(room,wall),b=wE(room,wall),wl=wL(room,wall),an=wA(room,wall);
        if(wl<.2)return;
        const crown=new THREE.Mesh(new THREE.BoxGeometry(wl,0.35,0.12),crownMat);
        const cN=getInteriorWallNormal(room,wall);const cOff=0.12;
        crown.position.set((a.x+b.x)/2+cN.x*cOff,roomHeight-0.18,-(a.y+b.y)/2+cN.z*cOff);
        crown.rotation.y=-an;
        grp.add(crown);
      });
    }else if(style==='beams'){
      const beamMat=new THREE.MeshStandardMaterial({color:0x5a3f27,roughness:.82,metalness:.02});
      const bbox=new THREE.Box3().setFromPoints(room.polygon.map(p=>new THREE.Vector3(p.x,0,-p.y)));
      const spanX=bbox.max.x-bbox.min.x,spanZ=bbox.max.z-bbox.min.z;
      const along=spanX>spanZ?'z':'x';
      const count=Math.max(3,Math.floor((along==='z'?spanX:spanZ)/3.2));
      for(let i=1;i<count;i++){
        const u=i/count;
        if(along==='z'){
          const x=bbox.min.x+u*spanX;
          const beam=new THREE.Mesh(new THREE.BoxGeometry(0.35,0.32,spanZ*0.96),beamMat);
          beam.position.set(x,roomHeight-0.18,(bbox.min.z+bbox.max.z)/2);grp.add(beam);
        }else{
          const z=bbox.min.z+u*spanZ;
          const beam=new THREE.Mesh(new THREE.BoxGeometry(spanX*0.96,0.32,0.35),beamMat);
          beam.position.set((bbox.min.x+bbox.max.x)/2,roomHeight-0.18,z);grp.add(beam);
        }
      }
    }else if(style==='coffered'){
      const panelMat=pushStyleMaterial('ceilingMats',new THREE.MeshStandardMaterial({color:ceilColor.clone().multiplyScalar(0.94),roughness:.86,side:THREE.BackSide}),room);
      const trimMat=pushStyleMaterial('trimMats',new THREE.MeshStandardMaterial({color:tc,roughness:.5,metalness:.04,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),room);
      const bbox=new THREE.Box3().setFromPoints(room.polygon.map(p=>new THREE.Vector3(p.x,0,-p.y)));
      const cols=Math.max(2,Math.floor((bbox.max.x-bbox.min.x)/4));
      const rows=Math.max(2,Math.floor((bbox.max.z-bbox.min.z)/4));
      const cellW=(bbox.max.x-bbox.min.x)/cols,cellD=(bbox.max.z-bbox.min.z)/rows;
      for(let cx2=0;cx2<cols;cx2++)for(let cz2=0;cz2<rows;cz2++){
        const px=bbox.min.x+(cx2+0.5)*cellW,pz=bbox.min.z+(cz2+0.5)*cellD;
        const panel=new THREE.Mesh(new THREE.BoxGeometry(cellW*0.88,0.15,cellD*0.88),panelMat);
        panel.position.set(px,roomHeight-0.08,pz);grp.add(panel);
        const frameTh=0.08;
        const frameH=new THREE.Mesh(new THREE.BoxGeometry(cellW*0.88,0.06,frameTh),trimMat);
        frameH.position.set(px,roomHeight-0.02,pz-cellD*0.44);grp.add(frameH);
        const frameH2=frameH.clone();frameH2.position.z=pz+cellD*0.44;grp.add(frameH2);
        const frameV=new THREE.Mesh(new THREE.BoxGeometry(frameTh,0.06,cellD*0.88),trimMat);
        frameV.position.set(px-cellW*0.44,roomHeight-0.02,pz);grp.add(frameV);
        const frameV2=frameV.clone();frameV2.position.x=px+cellW*0.44;grp.add(frameV2);
      }
    }
    scene.add(grp);
  }
  const wallMat=pushStyleMaterial('wallMats',new THREE.MeshStandardMaterial({color:wc,roughness:.68-wallFinish.sheen*.12,metalness:.005,side:THREE.DoubleSide,emissive:wc.clone().multiplyScalar(room.materials.wallColorCustom?.06:.03)}),room);
  wallMat.userData={isWallSurface:true,styleRoomId:room.id};
  room.walls.forEach(wall=>{
    const a=wS(room,wall),b=wE(room,wall),wl=wL(room,wall),an=wA(room,wall);
    if(wl<.01)return;
    const ops=room.openings.filter(o=>o.wallId===wall.id).sort((oa,ob)=>oa.offset-ob.offset);
    if(!ops.length)addWSeg(a,an,0,wl,0,roomHeight,wallMat);
    else{
      let pos=0;
      ops.forEach(op=>{
        const os=op.offset-op.width/2,oe=op.offset+op.width/2;
        if(os>pos)addWSeg(a,an,pos,os,0,roomHeight,wallMat);
        if(op.type==='door'){
          addWSeg(a,an,os,oe,op.height,roomHeight,wallMat);
          const frameMat=pushStyleMaterial('trimMats',new THREE.MeshStandardMaterial({color:tc,roughness:.44,metalness:.04,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),room);
          addWSeg(a,an,os,os+.06,0,op.height,frameMat);addWSeg(a,an,oe-.06,oe,0,op.height,frameMat);addWSeg(a,an,os,oe,op.height-.06,op.height,frameMat);addDoorLeaf3D(a,an,os,oe,op,tc);
        }else{
          addWSeg(a,an,os,oe,0,op.sillHeight,wallMat);addWSeg(a,an,os,oe,op.sillHeight+op.height,roomHeight,wallMat);
          const glassMat=new THREE.MeshStandardMaterial({color:0xBFD9EA,transparent:true,opacity:.42,roughness:.08,metalness:.18});
          addWSeg(a,an,os,oe,op.sillHeight,op.sillHeight+op.height,glassMat);
          const frameMat=pushStyleMaterial('trimMats',new THREE.MeshStandardMaterial({color:tc,roughness:.48,metalness:.04,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),room);
          const ft=.08,mid=(os+oe)/2;
          addWSeg(a,an,os,os+ft,op.sillHeight,op.sillHeight+op.height,frameMat);addWSeg(a,an,oe-ft,oe,op.sillHeight,op.sillHeight+op.height,frameMat);addWSeg(a,an,os,oe,op.sillHeight,op.sillHeight+ft,frameMat);addWSeg(a,an,os,oe,op.sillHeight+op.height-ft,op.sillHeight+op.height,frameMat);addWSeg(a,an,mid-ft/2,mid+ft/2,op.sillHeight,op.sillHeight+op.height,frameMat);addWindowAssembly3D(a,an,os,oe,op,tc);
        }
        pos=oe;
      });
      if(pos<wl)addWSeg(a,an,pos,wl,0,roomHeight,wallMat);
    }
    const bbMat=pushStyleMaterial('trimMats',new THREE.MeshStandardMaterial({color:tc,roughness:.28,metalness:.08,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),room);
    const bbN=getInteriorWallNormal(room,wall);const bbOff=0.1;const bb=new THREE.Mesh(new THREE.PlaneGeometry(wl,.48),bbMat);bb.position.set((a.x+b.x)/2+bbN.x*bbOff,.24,-(a.y+b.y)/2+bbN.z*bbOff);bb.rotation.y=-an;scene.add(bb);
  });
  room.structures.forEach(st=>{if(st.type==='closet'&&st.rect)scene.add(buildCloset3D(st,room));else if(st.type==='partition'&&st.line){const pa=st.line.a,pb=st.line.b,pl=Math.sqrt((pb.x-pa.x)**2+(pb.y-pa.y)**2),pAn=Math.atan2(pb.y-pa.y,pb.x-pa.x);const pm=new THREE.Mesh(new THREE.PlaneGeometry(pl,roomHeight),new THREE.MeshStandardMaterial({color:wc,roughness:.65,side:THREE.DoubleSide}));pm.position.set((pa.x+pb.x)/2,roomHeight/2,-(pa.y+pb.y)/2);pm.rotation.y=-pAn;scene.add(pm)}});
  room.furniture.forEach(f=>placeFurnitureInScene(f,room));
  const ceilLight=new THREE.PointLight(0xFFF8E8,.28*(room.materials.ceilingBrightness||1),Math.max((getRoomFocus(room).maxD||6)*3.2,(floorFocus?.maxD||6)*2.4));ceilLight.position.set(getRoomFocus(room).x,roomHeight-.4,-getRoomFocus(room).y);scene.add(ceilLight);pushStyleNode('ceilingLights',ceilLight,room);
}

function build3D(){
  try{
    resetRoomDebug();
    const cont=document.getElementById('threeC');const w=cont.clientWidth,h=cont.clientHeight;
    const r=curRoom,rH=r.height,focus=getRoomFocus(r),floorRooms=currentFloor3DRooms(r),floorFocus=floorRooms.length>1?getRoomsFocus(floorRooms):focus,maxFloorHeight=Math.max(rH,...floorRooms.map(room=>room?.height||0)),maxD=Math.max(6,focus.maxD),frameSpan=Math.max(focus.width||0,focus.height||0,rH*.9);
    const lightState=computeSceneLightingState(r);
    const preset=lightState.preset;
    scene=new THREE.Scene();
    scene.userData.styleTargets={wallMats:[],trimMats:[],floorMats:[],ceilingMats:[],floorMeshes:[],floorAccents:[],ceilingLights:[],floorReflectors:[]};
    scene.background=lightState.background.clone();
    scene.fog=new THREE.Fog(scene.background.getHex(),lightState.fogNear,lightState.fogFar);
    cam=new THREE.PerspectiveCamera(53,w/h,.3,140);
    cDist=Math.max(11,Math.min(56,Math.max(maxD*2.35,frameSpan*1.65,maxFloorHeight*1.45,(floorFocus.maxD||0)*1.7)));
    if(camMode==='orbit'){cYaw=Math.PI*.22;cPitch=.48}
    orbitTarget={x:floorFocus.x,y:(floorFocus.height3D||maxFloorHeight)*.42,z:-floorFocus.y};orbitVel={yaw:0,pitch:0,zoom:0};
    ren=new THREE.WebGLRenderer({antialias:true});
    ren.setSize(w,h);ren.setPixelRatio(Math.min(window.devicePixelRatio,photoMode?2:1.7));
    ren.physicallyCorrectLights=true;
    ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=lightState.exposure;
    ren.outputEncoding=THREE.sRGBEncoding;
    cont.innerHTML='';cont.appendChild(ren.domElement);
    ren.shadowMap.enabled=true;
    // Phase ✨ — VSM gives genuinely soft contact-hardening shadows instead of PCFSoft's uniform edges.
    // Fall back to PCFSoft if VSM isn't available in the build. Needs per-light shadow.blurSamples + radius set below.
    ren.shadowMap.type=(THREE.VSMShadowMap!==undefined&&!photoMode?THREE.VSMShadowMap:THREE.PCFSoftShadowMap);
    // Photo mode: use PCFSoft at 4K for crispest result; VSM is softer but blurrier per-pixel.
    if(photoMode)ren.shadowMap.type=THREE.PCFSoftShadowMap;
    // === Post-processing pipeline (Phase 3A) ===
    // Disable heavy passes on mobile/small screens to keep 60fps; always keep FXAA for crispness.
    try{
      const isMobile=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)||Math.min(w,h)<520;
      const heavyFX=!isMobile&&!!(THREE.EffectComposer&&THREE.RenderPass&&THREE.ShaderPass);
      if(THREE.EffectComposer&&THREE.RenderPass&&THREE.ShaderPass&&THREE.FXAAShader){
        composer=new THREE.EffectComposer(ren);
        composer.setSize(w,h);
        composer.addPass(new THREE.RenderPass(scene,cam));
        if(heavyFX&&THREE.SSAOPass&&THREE.SimplexNoise){
          const ssao=new THREE.SSAOPass(scene,cam,w,h);
          ssao.kernelRadius=photoMode?12:8;
          ssao.minDistance=0.002;
          ssao.maxDistance=0.12;
          ssao.output=THREE.SSAOPass.OUTPUT.Default;
          composer.addPass(ssao);
          composer._ssao=ssao;
        }
        if(heavyFX&&THREE.UnrealBloomPass){
          const bloom=new THREE.UnrealBloomPass(new THREE.Vector2(w,h),photoMode?0.42:0.3,0.4,0.85);
          composer.addPass(bloom);
          composer._bloom=bloom;
        }
        // Phase ✨ — Depth of field in photo mode. BokehPass keeps foreground sharp and softly blurs background,
        // which makes exported screenshots read as "marketing render" instead of "game screenshot".
        if(photoMode&&heavyFX&&THREE.BokehPass){
          try{
            const bokeh=new THREE.BokehPass(scene,cam,{focus:Math.max(8,cDist*0.9),aperture:0.00018,maxblur:0.006,width:w,height:h});
            composer.addPass(bokeh);
            composer._bokeh=bokeh;
          }catch(e){console.warn('Bokeh init failed:',e)}
        }
        const fxaa=new THREE.ShaderPass(THREE.FXAAShader);
        const pr=ren.getPixelRatio();
        fxaa.material.uniforms['resolution'].value.set(1/(w*pr),1/(h*pr));
        fxaa.renderToScreen=true;
        composer.addPass(fxaa);
        composer._fxaa=fxaa;
      }else{composer=null}
    }catch(e){console.warn('Post-processing init failed:',e);composer=null}
    // Phase 3B — load HDRI environment for PBR reflections (async; scene renders immediately, reflections pop in once loaded).
    loadHDRIEnvironment(preset&&preset.id,ren,scene);
    const hemiLight=new THREE.HemisphereLight(0xfaf8f4,lightState.warmColor,lightState.hemiIntensity*1.1);scene.add(hemiLight);
    const ambLight=new THREE.AmbientLight(lightState.warmColor,lightState.ambientIntensity*.82);scene.add(ambLight);
    const _shMap=photoMode?4096:2048;const dir=new THREE.DirectionalLight(lightState.dirColor,lightState.dirIntensity*1.05);dir.position.set(lightState.sunPosition.x,lightState.sunPosition.y,lightState.sunPosition.z);dir.castShadow=true;dir.shadow.mapSize.width=_shMap;dir.shadow.mapSize.height=_shMap;
    // VSM wants more blur samples + a larger radius to look smooth; PCFSoft wants a smaller radius.
    if(ren.shadowMap.type===THREE.VSMShadowMap){dir.shadow.radius=photoMode?10:8;dir.shadow.blurSamples=photoMode?24:18}
    else{dir.shadow.radius=photoMode?6:4}
    dir.shadow.bias=-0.0002;dir.shadow.normalBias=0.025;dir.shadow.camera.near=1;dir.shadow.camera.far=96;dir.shadow.camera.left=-32;dir.shadow.camera.right=32;dir.shadow.camera.top=32;dir.shadow.camera.bottom=-32;scene.add(dir);
    const fill=new THREE.DirectionalLight(0xf0e8de,lightState.fillIntensity*1.1);fill.position.set(lightState.fillPosition.x,lightState.fillPosition.y,lightState.fillPosition.z);scene.add(fill);
    // Soft bounce light from floor
    const bounce=new THREE.DirectionalLight(0xf5ede2,.12);bounce.position.set(floorFocus.x,-2,-floorFocus.y);scene.add(bounce);
    scene.userData.styleTargets.hemiLight=hemiLight;
    scene.userData.styleTargets.ambLight=ambLight;
    scene.userData.styleTargets.dirLight=dir;
    scene.userData.styleTargets.fillLight=fill;
    floorRooms.forEach(room=>buildRoomEnvelope3D(room,{floorFocus,renderer:ren}));
    applyRoomStyleToScene();
    attach3DPointerControls();updateWalkUI();
    // Phase ✨ — Inertial camera: lerp the *rendered* camera position toward the target position each frame.
    // This makes every movement (drag, zoom, preset switch, walk tween) glide instead of snap.
    const _smoothCam={pos:new THREE.Vector3(),look:new THREE.Vector3(),ready:false};
    (function anim(){raf3d=requestAnimationFrame(anim);if(!scene||!cam||!ren)return;updateCameraScript(performance.now());
      // Compute target pose first into temp vectors, then lerp the actual camera toward it.
      const tgtPos=new THREE.Vector3(),tgtLook=new THREE.Vector3();
      if(camMode==='orbit'){
        cYaw+=orbitVel.yaw;cPitch=Math.max(.12,Math.min(.9,cPitch+orbitVel.pitch));cDist=Math.max(7.5,Math.min(42,cDist+orbitVel.zoom));
        // Slightly gentler damping — 0.94/0.92/0.88 feels like it's gliding on glass
        orbitVel.yaw*=.94;orbitVel.pitch*=.92;orbitVel.zoom*=.88;
        tgtPos.set(orbitTarget.x+Math.sin(cYaw)*Math.cos(cPitch)*cDist,orbitTarget.y+Math.sin(cPitch)*cDist,orbitTarget.z+Math.cos(cYaw)*Math.cos(cPitch)*cDist);
        tgtLook.set(orbitTarget.x,orbitTarget.y,orbitTarget.z);
      }else{
        if(!cameraScript)applyWalkInputStep();
        const walkRoom=getWalkRoomAtPoint?.(fpPos.x,fpPos.z,floorRooms)||r;
        const walkHeight=walkRoom?.height||rH;
        fpPos.y=Math.max(4.9,Math.min(walkHeight-1.15,walkHeight*.54));
        tgtPos.set(fpPos.x,fpPos.y,fpPos.z);
        tgtLook.set(fpPos.x+Math.sin(cYaw)*10,fpPos.y+cPitch*8,fpPos.z-Math.cos(cYaw)*10);
      }
      if(!_smoothCam.ready){_smoothCam.pos.copy(tgtPos);_smoothCam.look.copy(tgtLook);_smoothCam.ready=true}
      // Walk mode lerps faster so response doesn't feel sluggish; orbit gets more glide.
      const lerp=camMode==='walk'?0.35:0.18;
      _smoothCam.pos.lerp(tgtPos,lerp);_smoothCam.look.lerp(tgtLook,lerp);
      updateOrbitWallCutaway(_smoothCam.pos);
      cam.position.copy(_smoothCam.pos);cam.lookAt(_smoothCam.look);
      // Update Bokeh focus distance dynamically (keeps mid-room in focus as user orbits).
      if(composer&&composer._bokeh){try{composer._bokeh.uniforms&&composer._bokeh.uniforms.focus&&(composer._bokeh.uniforms.focus.value=Math.max(6,cam.position.distanceTo(_smoothCam.look)*0.85))}catch(_){}}
      if(composer)composer.render();else ren.render(scene,cam)
    })()
  }catch(err){console.warn('3D build failed:',err);toast(`3D build failed: ${(err&&err.message)||'check room materials or shape'}`);exit3DView()}
}

// On-screen walk controls for mobile
function updateWalkUI(){
  let wc2=document.getElementById('walkCtrl');
  if(camMode==='walk'&&is3D){
    const isWide=walkControlLayout==='wide'||window.innerWidth>window.innerHeight;
    const className=isWide?'wide':'';
    const markup=`<div id="walkCtrl" class="${className}" style="position:absolute;left:12px;right:12px;bottom:${isWide?12:18}px;z-index:65;display:flex;align-items:flex-end;justify-content:space-between;gap:10px;pointer-events:none">
        <div style="display:grid;grid-template-columns:repeat(2,52px);gap:8px;pointer-events:auto">
          <button class="cmb" style="width:52px;height:52px" data-hold-action="walk-turn" data-direction="-1"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--esp);fill:none;stroke-width:2"><polyline points="15 18 9 12 15 6"/></svg></button>
          <button class="cmb" style="width:52px;height:52px" data-hold-action="walk-move" data-direction="1"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--esp);fill:none;stroke-width:2"><polyline points="18 15 12 9 6 15"/></svg></button>
          <button class="cmb" style="width:52px;height:52px" data-hold-action="walk-turn" data-direction="1"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--esp);fill:none;stroke-width:2"><polyline points="9 18 15 12 9 6"/></svg></button>
          <button class="cmb" style="width:52px;height:52px" data-hold-action="walk-move" data-direction="-1"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--esp);fill:none;stroke-width:2"><polyline points="18 9 12 15 6 9"/></svg></button>
        </div>
        <div style="pointer-events:auto;display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <div style="padding:10px 12px;border-radius:16px;background:rgba(250,247,242,.92);box-shadow:var(--shl);font-size:10px;font-weight:700;color:var(--rose-d);max-width:${isWide?'220px':'180px'};text-align:right">${isWide?'Landscape walkthrough mode':'Use the dock for movement and drag anywhere else to look around'}</div>
          <button class="mini-chip" type="button" style="pointer-events:auto" data-action="toggle-walk-control-layout">${isWide?'Standard Dock':'Sideways Dock'}</button>
        </div>
      </div>`;
    if(!wc2)document.getElementById('cWrap').insertAdjacentHTML('beforeend',markup);
    else{
      const wrap=document.createElement('div');
      wrap.innerHTML=markup;
      wc2.replaceWith(wrap.firstElementChild);
    }
  }else{if(wc2)wc2.remove();stopWalkMove();stopWalkTurn()}}

function addWSeg(ws,an,s,e,botY,topY,mat){
  const sw=e-s,sh=topY-botY;if(sw<.01||sh<.01)return;
  // Phase 5C — wall-with-holes: give walls real thickness so openings visibly
  // cut through solid wall (door/window jambs show reveal depth). Glass window
  // infills stay thin so they don't overlap the frame trim.
  const isGlass=mat&&mat.transparent&&(mat.opacity||1)<.9;
  const th=isGlass?0.04:0.18;
  const g=new THREE.BoxGeometry(sw,sh,th);
  const m=new THREE.Mesh(g,mat);
  m.castShadow=!isGlass;m.receiveShadow=!isGlass;
  const mid=(s+e)/2;
  m.position.set(ws.x+Math.cos(an)*mid,(botY+topY)/2,-(ws.y+Math.sin(an)*mid));
  m.rotation.y=-an;
  if(!isGlass&&mat?.userData?.isWallSurface){
    m.userData.roomWallSegment=true;
    m.userData.wallCenter2D={x:m.position.x,y:-m.position.z};
    m.userData.roomId=mat.userData.styleRoomId||'';
  }
  scene.add(m)}
function updateOrbitWallCutaway(cameraPos){
  if(!scene||!curRoom)return;
  const walls=scene.children.filter(obj=>obj.userData?.roomWallSegment);
  if(!walls.length)return;
  walls.forEach(obj=>obj.visible=true);
  if(camMode!=='orbit')return;
  const cam2D={x:cameraPos.x,y:-cameraPos.z};
  const floorRooms=currentFloor3DRooms(curRoom);
  const outside=typeof pointInsideRoom2D==='function'?!floorRooms.some(room=>pointInsideRoom2D(cam2D,room)):true;
  if(!outside)return;
  walls
    .map(obj=>({obj,d:Math.hypot((obj.userData.wallCenter2D?.x||0)-cam2D.x,(obj.userData.wallCenter2D?.y||0)-cam2D.y)}))
    .sort((a,b)=>a.d-b.d)
    .slice(0,Math.min(3,walls.length))
    .forEach(entry=>{entry.obj.visible=false;});
}
function addDoorLeaf3D(ws,an,os,oe,op,trimColor){
  const width=Math.max(.55,oe-os),doorW=Math.max(.45,width-.12),doorH=Math.max(2.1,(op.height||7)-.08);
  const hingeRight=op.hinge==='right',swingIn=op.swing!=='out';
  const hingeOffset=hingeRight?oe-.04:os+.04;
  const pivot=new THREE.Group();
  pivot.position.set(ws.x+Math.cos(an)*hingeOffset,.02,-(ws.y+Math.sin(an)*hingeOffset));
  pivot.rotation.y=-an;
  const angle=(swingIn?-1:1)*(hingeRight?1:-1)*Math.PI*.5;
  pivot.rotation.y+=angle;
  const doorMat=new THREE.MeshStandardMaterial({color:trimColor.clone().offsetHSL(.015,.08,-.05),roughness:.54,metalness:.04,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const insetMat=new THREE.MeshStandardMaterial({color:trimColor.clone().offsetHSL(.01,.05,.08),roughness:.44,metalness:.03,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const handleMat=new THREE.MeshStandardMaterial({color:0x8b8479,roughness:.24,metalness:.72});
  scene?.userData?.styleTargets?.trimMats?.push(doorMat,insetMat);
  const leaf=new THREE.Mesh(new THREE.BoxGeometry(doorW,doorH,.08),doorMat);
  leaf.castShadow=true;
  leaf.position.set(hingeRight?-doorW/2:doorW/2,doorH/2,hingeRight?.03:-.03);
  pivot.add(leaf);
  const inset=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.2,doorW-.34),Math.max(.4,doorH-.7),.02),insetMat);
  inset.position.set(hingeRight?-doorW/2:doorW/2,doorH/2,hingeRight?-.02:.02);
  pivot.add(inset);
  const handle=new THREE.Mesh(new THREE.BoxGeometry(.05,.24,.03),handleMat);
  handle.position.set(hingeRight?-(doorW-.16):doorW-.16,doorH*.52,hingeRight?-.045:.045);
  pivot.add(handle);
  scene.add(pivot);
}
function addWindowAssembly3D(ws,an,os,oe,op,trimColor){
  const width=Math.max(.8,oe-os),height=Math.max(1.6,op.height||4),sill=op.sillHeight||3,mid=(os+oe)/2;
  const cx=ws.x+Math.cos(an)*mid,cz=-(ws.y+Math.sin(an)*mid);
  const frameMat=new THREE.MeshStandardMaterial({color:trimColor.clone().offsetHSL(.01,.04,.03),roughness:.5,metalness:.03,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const sillMat=new THREE.MeshStandardMaterial({color:trimColor.clone().offsetHSL(.02,.03,-.02),roughness:.58,metalness:.02,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  scene?.userData?.styleTargets?.trimMats?.push(frameMat,sillMat);
  const trimDepth=.06;
  const horizTop=new THREE.Mesh(new THREE.BoxGeometry(width+.04,.08,trimDepth));
  horizTop.material=frameMat; horizTop.position.set(cx,sill+height-.04,cz); horizTop.rotation.y=-an; scene.add(horizTop);
  const horizBottom=new THREE.Mesh(new THREE.BoxGeometry(width+.04,.08,trimDepth));
  horizBottom.material=frameMat; horizBottom.position.set(cx,sill+.04,cz); horizBottom.rotation.y=-an; scene.add(horizBottom);
  const left=new THREE.Mesh(new THREE.BoxGeometry(.08,height,trimDepth));
  left.material=frameMat; left.position.set(ws.x+Math.cos(an)*(os+.04),sill+height/2,-(ws.y+Math.sin(an)*(os+.04))); left.rotation.y=-an; scene.add(left);
  const right=new THREE.Mesh(new THREE.BoxGeometry(.08,height,trimDepth));
  right.material=frameMat; right.position.set(ws.x+Math.cos(an)*(oe-.04),sill+height/2,-(ws.y+Math.sin(an)*(oe-.04))); right.rotation.y=-an; scene.add(right);
  const mullion=new THREE.Mesh(new THREE.BoxGeometry(.05,height-.18,trimDepth*.8));
  mullion.material=frameMat; mullion.position.set(cx,sill+height/2,cz); mullion.rotation.y=-an; scene.add(mullion);
  const transom=new THREE.Mesh(new THREE.BoxGeometry(width-.14,.05,trimDepth*.8));
  transom.material=frameMat; transom.position.set(cx,sill+height/2,cz); transom.rotation.y=-an; scene.add(transom);
  const sillBoard=new THREE.Mesh(new THREE.BoxGeometry(width+.14,.06,.18),sillMat);
  sillBoard.position.set(cx,sill-.07,cz+.02); sillBoard.rotation.y=-an; scene.add(sillBoard);
}

function buildFloorTexture(color,type){
  const preset=FLOOR_TYPES.find(f=>f.id===type)||FLOOR_TYPES[0];
  const can=document.createElement('canvas');can.width=768;can.height=768;const c=can.getContext('2d');
  const base=safeThreeColor(color,preset.color),accent=safeThreeColor(preset.accent,preset.color);
  const _baseHSL={h:0,s:0,l:0};base.getHSL(_baseHSL);
  const checkerMate=base.clone().lerp(_baseHSL.l>.52?safeThreeColor('#231D1A','#231D1A'):safeThreeColor('#FBF4EA','#FBF4EA'),.78);
  c.fillStyle='#'+base.getHexString();c.fillRect(0,0,768,768);
  if(preset.family==='wood'){
    const plankH=88,jointW=4;
    for(let y=0;y<768;y+=plankH){
      const row=Math.floor(y/plankH);
      const offset=row%2===0?0:104;
      // Plank body: alternate slight brightness
      c.fillStyle=row%2===0?'rgba(255,255,255,.15)':'rgba(0,0,0,.13)';
      c.fillRect(0,y,768,plankH-jointW);
      // Row separator (dark joint)
      c.fillStyle='rgba(18,10,4,.42)';c.fillRect(0,y+plankH-jointW,768,jointW);
      // Plank vertical joints
      for(let x=offset;x<768;x+=200){
        c.fillStyle='rgba(18,10,4,.26)';c.fillRect(x,y,5,plankH-jointW);
      }
      // Wood grain — subtle diagonal streaks
      for(let g=0;g<11;g++){
        const sx=g*68+offset*.18;
        c.strokeStyle=`rgba(255,255,255,${.05+g*.01})`;c.lineWidth=1.4;
        c.beginPath();c.moveTo(sx,y+8);c.lineTo(sx+34,y+plankH-12);c.stroke();
        c.strokeStyle='rgba(34,20,10,.09)';c.lineWidth=1;
        c.beginPath();c.moveTo(sx+18,y+10);c.lineTo(sx+42,y+plankH-16);c.stroke();
      }
      // Edge highlight
      c.fillStyle='rgba(255,255,255,.16)';c.fillRect(0,y,768,4);
      c.fillStyle='rgba(0,0,0,.08)';c.fillRect(0,y+14,768,1);
    }
  }else if(preset.family==='tile'){
    const tile=120;
    for(let y=0;y<768;y+=tile)for(let x=0;x<768;x+=tile){
      // Tile surface variation
      const v=((x/tile*3+y/tile*7)%5)*.026;
      c.fillStyle=`rgba(255,255,255,${.05+v})`;c.fillRect(x+6,y+6,tile-12,tile-12);
      c.fillStyle='rgba(0,0,0,.07)';c.fillRect(x+tile-18,y+tile-18,18,18);
      c.strokeStyle='rgba(255,255,255,.08)';c.lineWidth=2;c.strokeRect(x+8,y+8,tile-16,tile-16);
    }
    // Grout: strong, slightly warm-grey
    c.strokeStyle='rgba(126,116,104,.98)';c.lineWidth=10;
    for(let i=0;i<=768;i+=tile){c.beginPath();c.moveTo(i,0);c.lineTo(i,768);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(768,i);c.stroke()}
  }else if(preset.family==='checker'){
    const tile=160;
    for(let y=0;y<768;y+=tile)for(let x=0;x<768;x+=tile){
      const useAccent=((x+y)/tile)%2===1;
      const fill=useAccent?checkerMate:base;
      c.fillStyle='#'+fill.getHexString();c.fillRect(x,y,tile,tile);
      // Tile sheen
      c.fillStyle=`rgba(255,255,255,${useAccent?.03:.08})`;c.fillRect(x+8,y+8,tile-16,tile-16);
      c.fillStyle='rgba(0,0,0,.08)';c.fillRect(x,y+tile-10,tile,10);
    }
    c.strokeStyle='rgba(242,236,228,.82)';c.lineWidth=10;
    for(let i=0;i<=768;i+=tile){c.beginPath();c.moveTo(i,0);c.lineTo(i,768);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(768,i);c.stroke()}
  }else{
    // Concrete: surface aggregate and polish marks
    for(let i=0;i<200;i++){
      c.fillStyle=`rgba(255,255,255,${.03+(i%6)*.01})`;
      c.beginPath();c.ellipse((i*47)%768,(i*71)%768,22+(i%5)*14,8+(i%4)*6,(i%8)*.28,0,Math.PI*2);c.fill();
    }
    c.strokeStyle='rgba(255,255,255,.11)';c.lineWidth=2.4;
    for(let i=0;i<14;i++){c.beginPath();c.moveTo(0,i*56+14);c.lineTo(768,i*56+Math.sin(i*.7)*24);c.stroke()}
  }
  const tex=new THREE.CanvasTexture(can);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(preset.repeat,preset.repeat);
  return tex;
}
function applyPlanarUVs(geometry,points){
  if(!geometry?.attributes?.position||!points?.length)return geometry;
  const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));
  const minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  const spanX=Math.max(.001,maxX-minX),spanY=Math.max(.001,maxY-minY);
  const pos=geometry.attributes.position;
  const uv=new Float32Array(pos.count*2);
  for(let i=0;i<pos.count;i++){
    uv[i*2]=(pos.getX(i)-minX)/spanX;
    uv[i*2+1]=(pos.getY(i)-minY)/spanY;
  }
  geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  geometry.attributes.uv.needsUpdate=true;
  return geometry;
}
function buildFloorAccentTexture(type){
  const preset=FLOOR_TYPES.find(f=>f.id===type)||FLOOR_TYPES[0];
  const can=document.createElement('canvas');can.width=1024;can.height=1024;const c=can.getContext('2d');
  c.clearRect(0,0,1024,1024);
  if(preset.family==='wood'){
    const plank=96;
    for(let y=0;y<1024;y+=plank){
      c.fillStyle='rgba(70,48,28,.18)';c.fillRect(0,y,1024,3);
      for(let x=36;x<1024;x+=148){
        c.fillStyle='rgba(255,255,255,.075)';c.fillRect(x,y+10,2,plank-20);
      }
    }
    for(let i=0;i<180;i++){
      c.strokeStyle=`rgba(255,255,255,${.02+(i%5)*.005})`;c.lineWidth=1.1;
      c.beginPath();const sx=(i*37)%1024;c.moveTo(sx,0);c.bezierCurveTo(sx+18,220,sx-12,760,sx+12,1024);c.stroke();
    }
  }else if(preset.family==='tile'){
    const tile=128;
    c.strokeStyle='rgba(248,245,240,.94)';c.lineWidth=10;
    for(let i=0;i<=1024;i+=tile){
      c.beginPath();c.moveTo(i,0);c.lineTo(i,1024);c.stroke();
      c.beginPath();c.moveTo(0,i);c.lineTo(1024,i);c.stroke();
    }
  }else if(preset.family==='checker'){
    const tile=160;
    c.strokeStyle='rgba(248,245,240,.82)';c.lineWidth=10;
    for(let i=0;i<=1024;i+=tile){
      c.beginPath();c.moveTo(i,0);c.lineTo(i,1024);c.stroke();
      c.beginPath();c.moveTo(0,i);c.lineTo(1024,i);c.stroke();
    }
  }else{
    c.strokeStyle='rgba(255,255,255,.13)';c.lineWidth=3.4;
    for(let i=0;i<14;i++){c.beginPath();c.moveTo(0,i*72+24);c.lineTo(1024,i*72+Math.sin(i*1.2)*24);c.stroke()}
  }
  const tex=new THREE.CanvasTexture(can);
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.repeat.set(preset.repeat,preset.repeat);
  return tex;
}
function buildCloset3D(st,r){
  const g=new THREE.Group(),h=st.height||r.height,rect=st.rect;
  const finish=CLOSET_FINISHES.find(f=>f.id===(st.finish||'white_shaker'))||CLOSET_FINISHES[0];
  const bodyMat=new THREE.MeshStandardMaterial({color:finish.body,roughness:finish.style==='dark_walnut'?.44:.58,metalness:.03});
  const doorMat=new THREE.MeshStandardMaterial({color:finish.door,roughness:.34,metalness:.04});
  const trimMat=new THREE.MeshStandardMaterial({color:finish.trim,roughness:.45,metalness:.06,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
  const handleMat=new THREE.MeshStandardMaterial({color:0x8f8a83,roughness:.28,metalness:.62});
  const cx=rect.x+rect.w/2,cz=-(rect.y+rect.h/2);
  const carcass=new THREE.Mesh(new THREE.BoxGeometry(rect.w,h,rect.h),bodyMat);
  carcass.position.set(cx,h/2,cz);g.add(carcass);
  const topCap=new THREE.Mesh(new THREE.BoxGeometry(rect.w+.06,.08,rect.h+.08),trimMat);topCap.position.set(cx,h+.04,cz);g.add(topCap);
  const plinth=new THREE.Mesh(new THREE.BoxGeometry(rect.w,.22,rect.h),trimMat);plinth.position.set(cx,.11,cz);g.add(plinth);
  const frontZ=-(rect.y+rect.h+.035),usableH=h-.34;
  if(finish.style==='open_shelving'){
    for(let i=0;i<4;i++){
      const shelf=new THREE.Mesh(new THREE.BoxGeometry(rect.w-.18,.07,rect.h-.22),trimMat);
      shelf.position.set(cx,.8+i*(usableH/4.2),cz);g.add(shelf);
    }
    for(const side of [-1,1]){
      const rail=new THREE.Mesh(new THREE.BoxGeometry(.06,usableH,.08),trimMat);
      rail.position.set(cx+side*(rect.w/2-.1),usableH/2+.18,frontZ+.04);g.add(rail);
    }
  }else{
    const isSliding=finish.style==='sliding_doors';
    const panelCount=isSliding?2:2;
    const panelW=Math.max(.42,rect.w/panelCount-.06);
    for(let i=0;i<panelCount;i++){
      const x=cx-rect.w/2+panelW/2+.04+i*(panelW+.02);
      const z=frontZ+(isSliding?(i%2===0?0:.06):0);
      const panel=new THREE.Mesh(new THREE.BoxGeometry(panelW,usableH,.06),doorMat);
      panel.position.set(x,usableH/2+.18,z);g.add(panel);
      const inset=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.2,panelW-.18),Math.max(.4,usableH-.5),.02),trimMat);
      inset.position.set(x,usableH/2+.18,z-.045);g.add(inset);
      const handle=new THREE.Mesh(new THREE.BoxGeometry(.04,isSliding?.95:.42,.03),handleMat);
      handle.position.set(x+(isSliding?0:(i===0?panelW/2-.08:-panelW/2+.08)),usableH/2+.18,z-.055);g.add(handle);
    }
  }
  return g;
}
function ensureGLTFLoader(){if(!gltfLoader&&window.THREE&&THREE.GLTFLoader)gltfLoader=new THREE.GLTFLoader();return gltfLoader}
function warnAssetFallback(assetKey){
  console.warn(`[FALLBACK BLOCKED] ${assetKey}`);
  trackModelStatus('blocked',assetKey);
  if(!assetWarned){assetWarned=true;toast(location.protocol==='file:'?'Mapped model failed. Serve the app over HTTP or use a working asset path.':'Mapped model failed to load. Check debug badge');}
}
function cloneAssetScene(asset){return asset?asset.clone(true):null}
function loadModelAsset(assetKey){
  const reg=MODEL_REGISTRY[assetKey];
  if(!reg)return Promise.resolve(null);
  if(!ensureGLTFLoader()){
    console.error(`[MODEL LOAD FAIL] ${assetKey} -> ${reg.file}`, new Error('GLTFLoader unavailable'));
    trackModelStatus('fail',assetKey,reg.file);
    return Promise.resolve(null);
  }
  if(!assetCache.has(assetKey)){
    assetCache.set(assetKey,resolveAndLoadModelAsset(assetKey).then(result=>{
      if(result.scene){
        MODEL_ERROR_DETAILS.delete(assetKey);
        trackModelStatus('ok',assetKey,result.url);
        return {scene:result.scene,url:result.url};
      }
      console.error(`[MODEL LOAD FAIL] ${assetKey} -> ${result.url||reg.file}`,result.error);
      MODEL_ERROR_DETAILS.set(assetKey,(result.error&&result.error.message)||'load failed');
      trackModelStatus('fail',assetKey,result.url||reg.file);
      assetCache.delete(assetKey);
      return {scene:null,url:result.url||reg.file};
    }));
  }
  return assetCache.get(assetKey).then(result=>{
    if(result&&result.scene){
      const clone=cloneAssetScene(result.scene);
      if(clone)clone.userData.__sourceUrl=result.url;
      return clone;
    }
    return null;
  });
}
function fitObjectToFootprint(obj,targetW,targetD,targetH,fitMode='footprint'){
  const box=new THREE.Box3().setFromObject(obj),size=new THREE.Vector3();
  box.getSize(size);
  if(size.x<=0||size.y<=0||size.z<=0)return obj;
  const scales=[targetW/size.x];
  if(targetH)scales.push(targetH/size.y);
  if(fitMode==='footprint'||fitMode==='surface')scales.push(targetD/size.z);
  const scaleFactor=Math.min(...scales.filter(v=>Number.isFinite(v)&&v>0));
  obj.scale.multiplyScalar(scaleFactor);
  obj.updateMatrixWorld(true);
  const box2=new THREE.Box3().setFromObject(obj),center=new THREE.Vector3();
  box2.getCenter(center);
  obj.position.x-=center.x;
  obj.position.z-=center.z;
  obj.position.y-=box2.min.y;
  return obj;
}
function getRoomAssetTargetSize(f,r,placement,reg){
  const base=verificationTargetSize(f.assetKey||'');
  let w=Math.max(.45,Number.isFinite(f.w)?f.w:(base.w||1.8));
  let d=Math.max(.2,Number.isFinite(f.d)?f.d:(base.d||1.2));
  let h=Math.max(.7,base.h||Math.min(r.height*.38,3.2));
  if(reg?.mountType==='floor'){
    h=Math.max(h,Math.min(r.height*.52,h));
  }
  if(reg?.mountType==='surface'){
    h=Math.max(base.h||1.1,Math.min(r.height*.26,1.9));
  }
  if(reg?.mountType==='ceiling'){
    h=Math.max(base.h||1.1,1);
  }
  if(reg?.mountType==='wall'){
    h=Math.max(base.h||1.2,Math.min(r.height*.4,base.h||2.4));
    d=Math.max(.12,Math.min(d,base.d||.4));
  }
  if(placement?.windowTarget){
    const opening=placement.windowTarget.opening||{};
    const openingW=Math.max(1.2,opening.width||w);
    const openingH=Math.max(1.5,opening.height||h);
    if(f.assetKey==='curtains'){
      w=Math.max(base.w||0,openingW+1.05);
      h=Math.max(base.h||0,openingH+1.45);
      d=Math.max(.18,base.d||.3);
    }else if(f.assetKey==='blinds'){
      w=Math.max(base.w||0,openingW+.14);
      h=Math.max(base.h||0,openingH+.34);
      d=Math.max(.12,base.d||.18);
    }
  }
  if(['wall_art_01','wall_art_04','wall_art_06'].includes(f.assetKey)){
    w=Math.max(1.4,Math.min(w||base.w||2.2,3.2));
    h=Math.max(1,Math.min(h||base.h||1.4,2.2));
  }
  if(f.assetKey==='mirror'){
    w=Math.max(1.2,Math.min(w||base.w||1.8,2.8));
    h=Math.max(2,Math.min(h||base.h||2.6,3.6));
  }
  if(f.assetKey==='rug'||f.assetKey==='rug_round'||f.assetKey==='runner_rug'){
    h=.08;
  }
  return {w,d,h};
}
function furnitureMaterialProfile(f){
  const variant=typeof getFurnitureVariant==='function'?getFurnitureVariant(f):null;
  const tintColor=(variant?.previewColor)||f?.finishColor||'';
  if(!tintColor)return null;
  return {
    tint:safeThreeColor(tintColor,'#D7C4B2'),
    accent:safeThreeColor(variant?.accentColor||tintColor,'#E8DCCF'),
    family:variant?.family||'finish',
    roughness:Number.isFinite(variant?.roughness)?variant.roughness:.74,
    metalness:Number.isFinite(variant?.metalness)?variant.metalness:.05,
    tintStrength:Number.isFinite(variant?.tintStrength)?variant.tintStrength:.48,
  };
}
function furnitureBaseTint(f,fallback='#D7C4B2'){
  return furnitureMaterialProfile(f)?.tint||safeThreeColor(f?.finishColor||fallback,fallback);
}
function premiumVariantMat(f,colorOverride,roughOverride=null,metalOverride=null){
  const profile=furnitureMaterialProfile(f);
  const color=colorOverride||profile?.tint||safeThreeColor('#D7C4B2','#D7C4B2');
  const family=profile?.family||'finish';
  const defaults={
    fabric:{rough:.88,metal:.02},
    boucle:{rough:.96,metal:.01},
    linen:{rough:.9,metal:.01},
    velvet:{rough:.58,metal:.02},
    leather:{rough:.48,metal:.03},
    wood:{rough:.58,metal:.06},
    metal:{rough:.24,metal:.84},
    rug:{rough:.97,metal:0}
  }[family]||{rough:.72,metal:.04};
  return new THREE.MeshStandardMaterial({
    color,
    roughness:roughOverride??profile?.roughness??defaults.rough,
    metalness:metalOverride??profile?.metalness??defaults.metal
  });
}
function applyFurnitureFinishToModel(obj,f){
  const profile=furnitureMaterialProfile(f);
  if(!obj||!f||!profile)return;
  const tint=profile.tint;
  const family=profile.family||'finish';
  const familyTintStrength={
    fabric:.46,boucle:.42,linen:.44,velvet:.58,leather:.52,wood:.34,metal:.24,rug:.62,finish:profile.tintStrength
  }[family]??profile.tintStrength;
  const familyRoughness={
    fabric:.9,boucle:.97,linen:.92,velvet:.56,leather:.46,wood:.58,metal:.22,rug:.98,finish:profile.roughness
  }[family]??profile.roughness;
  const familyMetalness={
    fabric:.02,boucle:.01,linen:.01,velvet:.02,leather:.03,wood:.05,metal:.88,rug:0,finish:profile.metalness
  }[family]??profile.metalness;
  obj.traverse(child=>{
    if(!child.isMesh||!child.material)return;
    if(Array.isArray(child.material)){
      child.material=child.material.map(mat=>{
        const next=mat.clone();
        if(next.color)next.color.lerp(tint,familyTintStrength);
        if(typeof next.roughness==='number')next.roughness=(next.roughness+familyRoughness*2)/3;
        if(typeof next.metalness==='number')next.metalness=(next.metalness+familyMetalness*2)/3;
        if(typeof next.envMapIntensity==='number'){
          if(family==='metal')next.envMapIntensity=Math.max(next.envMapIntensity||1,1.45);
          else if(['leather','wood'].includes(family))next.envMapIntensity=Math.max(next.envMapIntensity||.6,.9);
        }
        if(next.emissive&&family==='velvet')next.emissive.copy(tint).multiplyScalar(.03);
        if(typeof next.needsUpdate!=='undefined')next.needsUpdate=true;
        return next;
      });
    }else{
      const next=child.material.clone();
      if(next.color)next.color.lerp(tint,familyTintStrength);
      if(typeof next.roughness==='number')next.roughness=(next.roughness+familyRoughness*2)/3;
      if(typeof next.metalness==='number')next.metalness=(next.metalness+familyMetalness*2)/3;
      if(typeof next.envMapIntensity==='number'){
        if(family==='metal')next.envMapIntensity=Math.max(next.envMapIntensity||1,1.45);
        else if(['leather','wood'].includes(family))next.envMapIntensity=Math.max(next.envMapIntensity||.6,.9);
      }
      if(next.emissive&&family==='velvet')next.emissive.copy(tint).multiplyScalar(.03);
      if(typeof next.needsUpdate!=='undefined')next.needsUpdate=true;
      child.material=next;
    }
  });
}
function premiumMat(color,rough=.72,metal=.04){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal})}
function addPremiumHeroEnhancement(anchor,f,targetW,targetD,targetH){
  if(!anchor||!f)return;
  const key=f.assetKey;
  const g=new THREE.Group();
  const baseColor=furnitureBaseTint(f,key==='bed'?'#EEE5D9':key==='bench'?'#A67C58':'#D7C4B2');
  if(key==='sofa_l'){
    const chaiseW=targetW*.48,chaiseD=targetD*.96,seatD=targetD*.5,seatH=Math.max(.44,targetH*.17),backH=Math.max(.92,targetH*.34),armW=Math.max(.2,targetW*.07);
    const mainBody=box3(targetW*.96,seatH,seatD,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.01,-.03),.78,.03));mainBody.position.set(0,seatH*.52,targetD*.22);g.add(mainBody);
    const chaise=box3(chaiseW,seatH,chaiseD,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.012,-.02),.8,.03));chaise.position.set(-targetW*.24,seatH*.52,0);g.add(chaise);
    const back=box3(targetW*.94,backH,targetD*.15,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.02,-.06),.82,.03));back.position.set(0,seatH+backH*.5,-targetD*.18);g.add(back);
    const sideBack=box3(targetW*.16,backH,chaiseD*.88,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.02,-.05),.82,.03));sideBack.position.set(-targetW*.4,seatH+backH*.5,0);g.add(sideBack);
    const armR=box3(armW,targetH*.36,seatD*.92,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.015,-.04),.8,.03));armR.position.set(targetW*.45-armW*.5,targetH*.18,targetD*.21);g.add(armR);
    const chaiseFront=box3(chaiseW*.92,seatH*.54,chaiseD*.62,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.025,.06),.92,.01));chaiseFront.position.set(-targetW*.23,seatH*.88,targetD*.02);g.add(chaiseFront);
    const mainSeat=box3(targetW*.56,seatH*.56,seatD*.62,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.025,.06),.92,.01));mainSeat.position.set(targetW*.14,seatH*.88,targetD*.21);g.add(mainSeat);
    const pillow1=box3(targetW*.26,backH*.42,targetD*.14,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.02,.12),.9,.01));pillow1.position.set(targetW*.16,seatH+backH*.45,-targetD*.04);g.add(pillow1);
    const pillow2=box3(targetW*.2,backH*.42,targetD*.14,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.02,.12),.9,.01));pillow2.position.set(-targetW*.16,seatH+backH*.45,-targetD*.04);g.add(pillow2);
    const legMat=premiumVariantMat(f,safeThreeColor('#5A4A3E','#5A4A3E'),.46,.16);
    [[targetW*.4,targetD*.4],[targetW*.4,0],[-targetW*.42,targetD*.4],[-targetW*.42,-targetD*.38],[0,-targetD*.38]].forEach(([x,z])=>{const leg=cy3(.045,Math.max(.18,targetH*.1),legMat);leg.position.set(x,.09,z);g.add(leg)});
  }else if(['sofa','sofa_small','sofa_compact','sofa_medium','sofa_large','sofa_modern','sofa_grand'].includes(key)){
    const seatH=Math.max(.44,targetH*.17),backH=Math.max(.92,targetH*.34),armW=Math.max(.2,targetW*.08);
    const body=box3(targetW*.96,seatH,targetD*.88,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.01,-.03),.78,.03));body.position.set(0,seatH*.52,0);g.add(body);
    const back=box3(targetW*.94,backH,targetD*.16,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.02,-.06),.82,.03));back.position.set(0,seatH+backH*.5,-targetD*.36);g.add(back);
    const armL=box3(armW,targetH*.36,targetD*.8,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.015,-.04),.8,.03));armL.position.set(-targetW*.47+armW*.5,targetH*.18,-targetD*.01);g.add(armL);
    const armR=armL.clone();armR.position.x*=-1;g.add(armR);
    const cushions=targetW>5.4?3:2,cushW=(targetW*.76)/cushions;
    for(let i=0;i<cushions;i++){
      const x=(-targetW*.38)+(i+.5)*cushW;
      const seat=box3(cushW*.92,seatH*.56,targetD*.54,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.025,.06),.92,.01));seat.position.set(x,seatH*.9,targetD*.03);g.add(seat);
      const pillow=box3(cushW*.82,backH*.42,targetD*.14,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.02,.12),.9,.01));pillow.position.set(x,seatH+backH*.45,-targetD*.22);g.add(pillow);
    }
    const legMat=premiumVariantMat(f,safeThreeColor('#5A4A3E','#5A4A3E'),.46,.16),lx=targetW*.41,lz=targetD*.31;
    [[-lx,lz],[lx,lz],[-lx,-lz],[lx,-lz]].forEach(([x,z])=>{const leg=cy3(.045,Math.max(.18,targetH*.1),legMat);leg.position.set(x,.09,z);g.add(leg)});
  }else if(['bed','bed_king','bed_twin'].includes(key)){
    const wood=premiumVariantMat(f,safeThreeColor('#8A6A52','#8A6A52'),.56,.06);
    const head=box3(targetW*.98,Math.max(1.7,targetH*.62),targetD*.08,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.01,-.02),.78,.03));head.position.set(0,targetH*.34,-targetD*.44);g.add(head);
    const foot=box3(targetW*.95,Math.max(.55,targetH*.2),targetD*.07,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.015,-.05),.72,.03));foot.position.set(0,targetH*.11,targetD*.44);g.add(foot);
    const frame=box3(targetW*.98,Math.max(.24,targetH*.09),targetD*.96,wood);frame.position.set(0,.12,0);g.add(frame);
    const railL=box3(.08,Math.max(.42,targetH*.16),targetD*.88,wood);railL.position.set(-targetW*.45,.28,0);g.add(railL);
    const railR=railL.clone();railR.position.x*=-1;g.add(railR);
    const mattress=box3(targetW*.9,Math.max(.44,targetH*.17),targetD*.88,premiumVariantMat(f,safeThreeColor('#F3EEE6','#F3EEE6'),.96,0));mattress.position.set(0,.38,0);g.add(mattress);
    const duvet=box3(targetW*.86,Math.max(.28,targetH*.12),targetD*.52,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.02,.04),.95,0));duvet.position.set(0,.64,targetD*.09);g.add(duvet);
    const throwFold=box3(targetW*.84,Math.max(.08,targetH*.035),targetD*.18,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.025,-.06),.94,0));throwFold.position.set(0,.78,targetD*.23);g.add(throwFold);
    for(const x of [-targetW*.2,targetW*.2]){
      const pillow=box3(Math.max(.7,targetW*.22),Math.max(.16,targetH*.07),targetD*.18,premiumVariantMat(f,safeThreeColor('#FBF8F4','#FBF8F4'),.98,0));
      pillow.position.set(x,.72,-targetD*.18);g.add(pillow);
    }
  }else if(key==='bench'){
    const wood=premiumVariantMat(f,baseColor.clone().offsetHSL(0,.01,-.02),.58,.05),dark=premiumVariantMat(f,safeThreeColor('#3F3A36','#3F3A36'),.42,.22);
    const seat=box3(targetW*.96,Math.max(.14,targetH*.12),targetD*.42,wood);seat.position.set(0,Math.max(.52,targetH*.42),0);g.add(seat);
    for(const x of [-targetW*.26,0,targetW*.26]){
      const slat=box3(targetW*.26,Math.max(.03,targetH*.02),targetD*.44,premiumVariantMat(f,baseColor.clone().offsetHSL(0,.015,.06),.56,.04));
      slat.position.set(x,seat.position.y+.06,0);g.add(slat);
    }
    [[-targetW*.34,targetD*.12],[targetW*.34,targetD*.12],[-targetW*.34,-targetD*.12],[targetW*.34,-targetD*.12]].forEach(([x,z])=>{
      const leg=box3(.08,Math.max(.72,targetH*.58),.08,dark);leg.position.set(x,Math.max(.36,targetH*.29),z);g.add(leg);
    });
  }else return;
  g.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});
  anchor.add(g);
}
function findNearestWallForPoint(pt,r){let best=null,bd=Infinity;r.walls.forEach(wall=>{const a=wS(r,wall),b=wE(r,wall),dx=b.x-a.x,dy=b.y-a.y,wl=wL(r,wall),t=Math.max(0,Math.min(1,((pt.x-a.x)*dx+(pt.y-a.y)*dy)/(dx*dx+dy*dy))),proj={x:a.x+dx*t,y:a.y+dy*t},dist=Math.hypot(pt.x-proj.x,pt.y-proj.y);if(dist<bd){bd=dist;best={wall,offset:t*wl,length:wl,point:proj}}});return best||{wall:r.walls[0],offset:1,length:wL(r,r.walls[0])}}
function getInteriorWallNormal(r,wall){
  const a=wS(r,wall),b=wE(r,wall),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const focus=getRoomFocus(r);
  const n1={x:Math.sin(wA(r,wall)),z:Math.cos(wA(r,wall))};
  const n2={x:-n1.x,z:-n1.z};
  const p1={x:mid.x+n1.x*.35,y:mid.y-n1.z*.35};
  const d1=Math.hypot(p1.x-focus.x,p1.y-focus.y);
  const p2={x:mid.x+n2.x*.35,y:mid.y-n2.z*.35};
  const d2=Math.hypot(p2.x-focus.x,p2.y-focus.y);
  return d1<d2?n1:n2;
}
function findNearestWindowOpening(pt,r){
  let best=null,bd=Infinity;
  r.openings.forEach(op=>{
    if(op.type!=='window')return;
    const wall=r.walls.find(x=>x.id===op.wallId);if(!wall)return;
    const a=wS(r,wall),b=wE(r,wall),wl=wL(r,wall),t=op.offset/wl,center={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t},dist=Math.hypot(pt.x-center.x,pt.y-center.y);
    if(dist<bd)best={opening:op,wall,center,length:op.width},bd=dist;
  });
  return best;
}
function estimatedSurfaceHeight(f){
  const map={nightstand:2.1,dresser:3.05,desk:2.45,tv_console:2.1,table_coffee:1.55,dining_table:2.45,bookshelf:2.9,cabinet:2.6,shelving:3.4};
  return map[f.assetKey]||Math.max(1.8,(f.d||1.5));
}
function findNearestSurfaceFurniture(pt,r){
  let best=null,bd=Infinity;
  (r.furniture||[]).forEach(f=>{
    if(['nightstand','dresser','desk','tv_console','table_coffee','dining_table','bookshelf','cabinet','shelving'].includes(f.assetKey)){
      const dist=Math.hypot(pt.x-f.x,pt.y-f.z);
      if(dist<bd){bd=dist;best=f;}
    }
  });
  return best;
}
function effectiveWallFacingMode(f,reg){
  if(!(reg?.mountType==='wall'||f?.mountType==='wall'))return 'free';
  if(reg?.wallFacingMode)return reg.wallFacingMode;
  const key=String(f?.assetKey||'').toLowerCase();
  if(/lamp_wall/.test(key))return 'face_interior';
  if(/curtain|blind/.test(key))return 'follow_wall';
  return 'follow_wall';
}
function wallMountedDepthOffset(f,reg){
  const wallHalf=0.095;
  const key=String(f?.assetKey||'').toLowerCase();
  if(reg?.snapToOpening)return wallHalf+0.03;
  if(/wall_art|mirror|towel|panel|doorway|shelf|fireplace/.test(key))return wallHalf+0.045;
  if(/curtain|blind/.test(key))return wallHalf+0.025;
  return wallHalf+Math.min(.16,Math.max(.05,(f.d||.35)*.28));
}
function getWallFacingAdjustment(reg,placement,f){
  const mode=effectiveWallFacingMode(f,reg);
  if(mode==='free'||!placement?.wallNormal)return 0;
  const inwardYaw=Math.atan2(placement.wallNormal.x,placement.wallNormal.z);
  if(mode==='face_interior')return inwardYaw;
  if(mode==='face_exterior')return inwardYaw+Math.PI;
  if(mode==='follow_wall')return placement.wallAngleYaw||0;
  return inwardYaw;
}
function computeFurnitureYaw(f,reg,placement){
  const appRotation=-(Number.isFinite(f.rotation)?f.rotation:0)*Math.PI/180;
  const yawOffset=(reg?.yawOffset||0)+axisYawOffset(reg?.forwardAxis);
  const wallAdjust=getWallFacingAdjustment(reg,placement,f);
  return appRotation+yawOffset+wallAdjust;
}
function getFurniturePlacement(f,r){
  const reg=MODEL_REGISTRY[f.assetKey];
  if(f.mountType==='ceiling'||reg?.mountType==='ceiling'){
    const placement={position:new THREE.Vector3(f.x||getRoomFocus(r).x,Math.max(7.2,r.height-.55),-(f.z||getRoomFocus(r).y)),wallNormal:null};
    placement.rotationY=computeFurnitureYaw(f,reg,placement);
    return placement;
  }
  if(f.mountType==='surface'||reg?.mountType==='surface'){
    const host=findNearestSurfaceFurniture({x:f.x,y:f.z},r);
    const baseX=host?host.x:f.x,baseZ=host?host.z:f.z,baseY=host?estimatedSurfaceHeight(host):defaultElevation('surface',f.assetKey,resolveLabel(f.label));
    const placement={position:new THREE.Vector3(baseX,baseY,-baseZ),host,wallNormal:null};
    placement.rotationY=computeFurnitureYaw(f,reg,placement);
    return placement;
  }
  if(f.mountType==='wall'||(reg&&reg.mountType==='wall')){
    const windowTarget=reg?.snapToOpening?findNearestWindowOpening({x:f.x,y:f.z},r):null;
    if(reg?.snapToOpening&&!windowTarget)return null;
    const nearest=windowTarget?{wall:windowTarget.wall,offset:windowTarget.opening.offset,length:wL(r,windowTarget.wall)}:findNearestWallForPoint({x:f.x,y:f.z},r);
    const wall=nearest.wall,a=wS(r,wall),an=wA(r,wall),n=getInteriorWallNormal(r,wall),along=Math.max(.4,Math.min(nearest.length-.4,nearest.offset||nearest.length/2));
    let mountY=f.elevation||defaultElevation('wall',f.assetKey,resolveLabel(f.label));
    if(windowTarget&&f.assetKey==='curtains')mountY=(windowTarget.opening.sillHeight||3)+(windowTarget.opening.height||4)+.35;
    if(windowTarget&&f.assetKey==='blinds')mountY=(windowTarget.opening.sillHeight||3)+(windowTarget.opening.height||4)-.06;
    const base=new THREE.Vector3(a.x+Math.cos(an)*along,mountY,-(a.y+Math.sin(an)*along));
    // Walls are thick BoxGeometry (0.18 total, ~0.09 half-thickness). Push wall-mounted
    // items past the inner wall face so they sit flush on the surface, not inside it.
    const depth=wallMountedDepthOffset(f,reg);
    base.x+=n.x*depth;base.z+=n.z*depth;
    const placement={position:base,windowTarget,wallNormal:n,wallAngleYaw:-an};
    placement.rotationY=computeFurnitureYaw(f,reg,placement);
    return placement;
  }
  const placement={position:new THREE.Vector3(f.x,Number.isFinite(f.elevation)?f.elevation:(reg?.yOffset||f.yOffset||0),-f.z),wallNormal:null};
  placement.rotationY=computeFurnitureYaw(f,reg,placement);
  return placement;
}
function placeFurnitureInScene(f,r){
  const reg=f.assetKey?MODEL_REGISTRY[f.assetKey]:null,anchor=new THREE.Group(),placement=getFurniturePlacement(f,r);
  if(!placement)return;
  const renderState=getFurnitureRenderState(f,r);
  anchor.position.copy(placement.position);anchor.rotation.y=placement.rotationY;anchor.visible=renderState.visible;anchor.userData.furnitureId=f.id;anchor.userData.assetKey=f.assetKey;scene.add(anchor);
  const contactShadow=buildContactShadowMesh(f);
  if(contactShadow){
    if(renderState.ghost)contactShadow.material.opacity*=.6;
    anchor.add(contactShadow);
  }
  let diagEntry=null;
  if(reg){
    ROOM_MODEL_DEBUG.active.add(f.assetKey);
    diagEntry=ensureRoomDiagEntry(f,reg);
    diagEntry.status='loading';
    diagEntry.file=reg.file;
    diagEntry.mountType=f.mountType||reg.mountType;
    diagEntry.worldPosition=anchor.position.clone();
    diagEntry.anchor=anchor;
    diagEntry.object=null;
    diagEntry.fallbackAttempted=false;
    diagEntry.error='';
    diagEntry.issues=[];
  }
  updateRoomDebugBadge();
  updateRoomRuntimeDiag();
  if(!reg){
    const fallback=buildFurniture3D(f,r.height);
    if(fallback)anchor.add(fallback);
    addPremiumHeroEnhancement(anchor,f,f.w||2,f.d||1.5,Math.max(1.2,r.height*.2));
    return;
  }
  loadModelAsset(f.assetKey).then(model=>{
    if(!scene||!anchor.parent)return;
    if(!model){
      if(MODEL_DEBUG.fail.has(f.assetKey)){console.error(`[ROOM MODEL LOAD FAIL] ${f.assetKey} -> ${reg.file}`);trackRoomModelStatus('fail',f.assetKey);if(diagEntry)diagEntry.status='fail';}
      else{console.warn(`[ROOM FALLBACK BLOCKED] ${f.assetKey}`);trackRoomModelStatus('blocked',f.assetKey);if(diagEntry)diagEntry.status='blocked';}
      if(diagEntry){diagEntry.fallbackAttempted=true;diagEntry.error=MODEL_ERROR_DETAILS.get(f.assetKey)||'';diagEntry.issues=['model unavailable'];updateRoomRuntimeDiag();}
      warnAssetFallback(f.assetKey);return;
    }
    const target=getRoomAssetTargetSize(f,r,placement,reg);
    const targetW=target.w,targetD=target.d,targetH=target.h;
    fitObjectToFootprint(model,targetW,targetD,targetH,placement.windowTarget?'opening':(reg.fit||'footprint'));
    if(reg.defaultScale&&reg.defaultScale!==1)model.scale.multiplyScalar(reg.defaultScale);
    // Phase ✨ — Material audit upgrades PBR props on all meshes
    if(typeof patchGLBMaterials==='function')patchGLBMaterials(model,ren);
    applyFurnitureFinishToModel(model,f);
    if(placement.windowTarget&&f.assetKey==='curtains'){
      const topY=(placement.windowTarget.opening.sillHeight||3)+(placement.windowTarget.opening.height||4)+.35;
      model.position.y+=(topY-(targetH/2))-anchor.position.y;
    }else if(placement.windowTarget&&f.assetKey==='blinds'){
      const topY=(placement.windowTarget.opening.sillHeight||3)+(placement.windowTarget.opening.height||4)-.06;
      model.position.y+=(topY-(targetH/2))-anchor.position.y;
    }else{
      if(f.assetKey==='curtains')model.position.y+=.18;
      if(f.assetKey==='blinds')model.position.y+=.04;
    }
    model.position.y+=reg.yOffset||0;
    model.traverse(child=>{if(child.isMesh){child.castShadow=true;child.receiveShadow=true}});
    if(renderState.ghost){
      model.traverse(child=>{
        if(!child.isMesh||!child.material)return;
        const mats=Array.isArray(child.material)?child.material:[child.material];
        mats.forEach(mat=>{
          mat.transparent=true;
          mat.opacity=Math.min(Number.isFinite(mat.opacity)?mat.opacity:1,.45);
          mat.needsUpdate=true;
        });
      });
    }
    anchor.add(model);
    if(placement.windowTarget&&f.assetKey==='curtains'){
      const rod=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,targetW,18),new THREE.MeshStandardMaterial({color:r.materials.trim||'#3F3A36',roughness:.34,metalness:.42}));
      rod.rotation.z=Math.PI/2;
      rod.position.set(0,(placement.windowTarget.opening.sillHeight||3)+(placement.windowTarget.opening.height||4)+.32-anchor.position.y,.06);
      anchor.add(rod);
    }else if(placement.windowTarget&&f.assetKey==='blinds'){
      const headrail=new THREE.Mesh(new THREE.BoxGeometry(targetW,.12,.12),new THREE.MeshStandardMaterial({color:r.materials.trim||'#F8F5F0',roughness:.52,metalness:.08}));
      headrail.position.set(0,(placement.windowTarget.opening.sillHeight||3)+(placement.windowTarget.opening.height||4)-.03-anchor.position.y,.05);
      anchor.add(headrail);
    }
    addPremiumHeroEnhancement(anchor,f,targetW,targetD,targetH);
    addRoomPracticalLight(f.assetKey,anchor,getLightingPreset(r),r);
    trackRoomModelStatus('ok',f.assetKey);
    if(diagEntry){
      diagEntry.status='ok';
      diagEntry.object=model;
      diagEntry.file=model.userData.__sourceUrl||reg.file;
      diagEntry.error='';
      analyzeRoomModelPlacement(diagEntry,r);
      updateRoomRuntimeDiag();
    }
  }).catch(err=>{
    console.error(`[ROOM MODEL LOAD FAIL] ${f.assetKey} -> ${reg.file}`,err);
    trackRoomModelStatus('fail',f.assetKey);
    if(diagEntry){diagEntry.status='fail';diagEntry.fallbackAttempted=true;diagEntry.error=(err&&err.message)||'load exception';diagEntry.issues=[(err&&err.message)||'load exception'];updateRoomRuntimeDiag();}
  });
}
function attach3DPointerControls(){const el=ren.domElement;let pointerId=null;const activePtrs=new Map();const ray=new THREE.Raycaster();let pDown,pUp,pMove,pCancel,pDbl;pDown=e=>{activePtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(activePtrs.size===1){d3=true;pointerId=e.pointerId;p3x=e.clientX;p3y=e.clientY;if(el.setPointerCapture)try{el.setPointerCapture(e.pointerId)}catch(_){}}if(activePtrs.size===2){isPinch=true;const pts=[...activePtrs.values()];pinchDist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)}};pUp=e=>{activePtrs.delete(e.pointerId);if(activePtrs.size<2)isPinch=false;if(activePtrs.size===0){d3=false;if(pointerId!==null&&el.releasePointerCapture)try{el.releasePointerCapture(pointerId)}catch(_){}pointerId=null}};pCancel=e=>{if(e&&e.pointerId)activePtrs.delete(e.pointerId);if(activePtrs.size<2)isPinch=false;if(activePtrs.size===0){d3=false;pointerId=null}};pMove=e=>{if(activePtrs.has(e.pointerId))activePtrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(isPinch&&activePtrs.size===2&&camMode==='orbit'){const pts=[...activePtrs.values()],nd=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);if(pinchDist>0&&nd>0)orbitVel.zoom+=((pinchDist/nd)-1)*cDist*.42;pinchDist=nd;return}if(!d3||activePtrs.size>1)return;const dx=e.clientX-p3x,dy=e.clientY-p3y;p3x=e.clientX;p3y=e.clientY;if(camMode==='orbit'){orbitVel.yaw+=dx*.00066*cDist;orbitVel.pitch+=-dy*.00052*cDist}else{cYaw-=dx*.002;cPitch=Math.max(-.35,Math.min(.25,cPitch+dy*.0015))}};pDbl=e=>{if(!scene||!cam||camMode!=='orbit')return;const rect=el.getBoundingClientRect();const pointer=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);ray.setFromCamera(pointer,cam);const hits=ray.intersectObjects(scene.children,true);const hit=hits.find(entry=>{let obj=entry.object;while(obj){if(obj.userData?.furnitureId)return true;obj=obj.parent}return false});if(!hit)return;let obj=hit.object;while(obj&&!obj.userData?.furnitureId)obj=obj.parent;if(obj?.userData?.furnitureId)focusFurniture3D(obj.userData.furnitureId)};el.addEventListener('pointerdown',pDown);el.addEventListener('pointerup',pUp);el.addEventListener('pointermove',pMove);el.addEventListener('pointercancel',pCancel);el.addEventListener('lostpointercapture',pCancel);el.addEventListener('dblclick',pDbl);ren._listeners={el,pDown,pUp,pMove,pCancel,pDbl}}

function verificationTargetSize(key){
  const map={rug:{w:3.8,d:2.8,h:.2},runner_rug:{w:6.5,d:2,h:.2},rug_round:{w:4.2,d:4.2,h:.2},curtains:{w:3.8,d:.3,h:4},blinds:{w:3.5,d:.2,h:2.7},wall_art_01:{w:2.2,d:.2,h:1.4},wall_art_04:{w:2.2,d:.2,h:1.4},wall_art_06:{w:2.2,d:.2,h:1.4},mirror:{w:1.8,d:.2,h:2.6},lamp_wall:{w:1.4,d:.4,h:2.2},lamp_table:{w:1.1,d:1.1,h:1.45},lamp_chandelier:{w:2,d:2,h:1.65},lamp_ceiling:{w:1.6,d:1.6,h:1.2},lamp_cube:{w:1.35,d:1.35,h:1.35},lamp_pendant:{w:1.6,d:1.6,h:1.9},lamp_stand:{w:1,d:1,h:4.2},shelving:{w:2.8,d:.6,h:2.1},shelf_small:{w:2.1,d:.45,h:1.2},plant_small:{w:1.1,d:1.1,h:1.6},plant_cactus:{w:1,d:1,h:1.8},plant_leafy:{w:1.4,d:1.4,h:2.1},plant_palm:{w:1.6,d:1.6,h:2.8},plant_round:{w:1.25,d:1.25,h:1.7},chair_office:{w:2,d:2,h:3},nightstand:{w:1.8,d:1.5,h:2.2},nightstand_alt:{w:1.8,d:1.55,h:2.25},dresser:{w:3.8,d:1.8,h:3.2},dresser_tall:{w:3.3,d:1.7,h:4.1},console_low:{w:4.6,d:1.35,h:2.4},tv_console:{w:4.8,d:1.5,h:2.8},dining_table:{w:5.2,d:3,h:2.8},table_round_large:{w:4.2,d:4.2,h:2.8},table_round_small:{w:2.4,d:2.4,h:2.2},stool:{w:1.4,d:1.4,h:1.9},bench:{w:3.6,d:1.4,h:2.2},sofa_small:{w:3.4,d:2.05,h:2.8},sofa_compact:{w:3.6,d:2.1,h:3},sofa_medium:{w:4.4,d:2.35,h:3.05},sofa_large:{w:5.8,d:2.6,h:3.1},sofa_modern:{w:5.2,d:2.55,h:3.05},sofa_grand:{w:6.4,d:2.8,h:3.2},bed_king:{w:6.4,d:7.4,h:2.7},bed_double:{w:5.5,d:6.8,h:2.6},bed_twin:{w:3.6,d:6.6,h:2.5},bunk_bed:{w:4.4,d:6.8,h:5.8},bookcase_books:{w:3.1,d:1.1,h:4.8},closet_tall:{w:3.4,d:1.8,h:6.2},closet_full:{w:3.7,d:1.9,h:6.6},closet_short:{w:3.1,d:1.7,h:4.2},fireplace:{w:4.2,d:1.3,h:3.6},kitchen_cabinet_base:{w:3,d:2,h:3},kitchen_cabinet_upper:{w:3,d:1.1,h:2},kitchen_island:{w:4.2,d:2.5,h:3},kitchen_fridge:{w:3,d:2.6,h:6.6},kitchen_stove:{w:2.6,d:2.2,h:3.2},kitchen_hood:{w:2.6,d:1,h:1.8},kitchen_sink:{w:3,d:2.1,h:3.3},kitchen_dishwasher:{w:2,d:2.1,h:3},bathroom_vanity_single:{w:2.6,d:1.9,h:3.2},bathroom_vanity_double:{w:4.4,d:1.9,h:3.2},bathroom_toilet:{w:1.4,d:2.4,h:2.9},bathroom_tub:{w:2.8,d:5.7,h:2.4},bathroom_shower:{w:3,d:3,h:6.8},bathroom_mirror:{w:2.4,d:.2,h:2.6},bathroom_towel_bar:{w:2,d:.35,h:1.1},washing_machine:{w:2.7,d:2.8,h:3.6},column_round:{w:1.4,d:1.4,h:8.2},trashcan_small:{w:1,d:1,h:1.4},trashcan_large:{w:1.2,d:1.2,h:2.2},square_plate:{w:.9,d:.9,h:.18},table_rect:{w:4.4,d:2.6,h:2.8}};
  return map[key]||{w:3.2,d:2,h:3.6};
}
function updateVerificationCard(key,state){
  const card=document.querySelector(`[data-verify-key="${key}"]`);if(!card)return;
  card.classList.remove('ok','fail');
  const badge=card.querySelector('.verify-badge'),meta=card.querySelector('.verify-meta'),note=card.querySelector('.verify-note');
  badge.className='verify-badge '+(state.status||'pending');
  badge.textContent=state.status||'pending';
  if(state.status==='loaded')card.classList.add('ok');
  if(state.status==='failed')card.classList.add('fail');
  meta.innerHTML=`<div>${key}</div><div>${state.url||modelUrl(MODEL_REGISTRY[key].file)}</div><div>http: ${state.httpStatus??'pending'}</div><div>bbox: ${state.bbox||'pending'}</div><div>fallback: ${state.fallback?'yes':'no'}</div>`;
  note.textContent=state.note||'';
}
function renderVerificationCards(){
  const grid=document.getElementById('verifyGrid');
  const keys=Object.keys(MODEL_REGISTRY);
  grid.innerHTML=keys.map(key=>`<div class="verify-card" data-verify-key="${key}"><div class="verify-badge pending">pending</div><h4>${key}</h4><div class="verify-meta">${MODEL_REGISTRY[key].file}</div><div class="verify-note"></div></div>`).join('');
}
function disposeVerificationScene(){
  if(!verify3D)return;
  if(verify3D.raf)cancelAnimationFrame(verify3D.raf);
  if(verify3D.ren){verify3D.ren.dispose();if(verify3D.ren.domElement&&verify3D.ren.domElement.parentNode)verify3D.ren.domElement.parentNode.removeChild(verify3D.ren.domElement)}
  verify3D=null;
}
function closeAssetVerification(){document.getElementById('verifyOv').classList.remove('on');disposeVerificationScene()}
async function openAssetVerification(){document.getElementById('verifyOv').classList.add('on');await refreshAssetVerification()}
async function refreshAssetVerification(){
  disposeVerificationScene();renderVerificationCards();
  const cont=document.getElementById('verifyCanvas');const w=cont.clientWidth||cont.offsetWidth,h=cont.clientHeight||cont.offsetHeight;
  verify3D={scene:new THREE.Scene(),cam:new THREE.PerspectiveCamera(42,w/h,.1,250),ren:new THREE.WebGLRenderer({antialias:true}),items:[],cycleIndex:0};
  verify3D.scene.background=new THREE.Color(0xf3efe8);
  verify3D.ren.setSize(w,h);verify3D.ren.setPixelRatio(Math.min(window.devicePixelRatio,2));cont.innerHTML='';cont.appendChild(verify3D.ren.domElement);
  verify3D.scene.add(new THREE.HemisphereLight(0xffffff,0xd9d1c6,1.35));
  const keyLight=new THREE.DirectionalLight(0xffffff,1.15);keyLight.position.set(10,14,8);verify3D.scene.add(keyLight);
  const fillLight=new THREE.DirectionalLight(0xfff4e4,.5);fillLight.position.set(-8,10,-6);verify3D.scene.add(fillLight);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0xe5ded5,roughness:.94,metalness:.02}));floor.rotation.x=-Math.PI/2;verify3D.scene.add(floor);
  const grid=new THREE.GridHelper(60,30,0xd7cfc3,0xe7dfd6);verify3D.scene.add(grid);
  const keys=Object.keys(MODEL_REGISTRY);
  const cols=4;
  await Promise.all(keys.map(async(key,idx)=>{
    const reg=MODEL_REGISTRY[key],group=new THREE.Group(),row=Math.floor(idx/cols),col=idx%cols,x=(col-(cols-1)/2)*7,z=row*7-4;
    group.position.set(x,0,z);verify3D.scene.add(group);
    const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(1.8,1.95,.18,24),new THREE.MeshStandardMaterial({color:0xf8f5f0,roughness:.75}));pedestal.position.y=.09;group.add(pedestal);
    try{
      const preflight=await preflightModelFile(reg.file);
      const model=await loadModelAsset(key);
      if(!model){group.add(new THREE.Mesh(new THREE.BoxGeometry(1.8,1.8,.2),new THREE.MeshStandardMaterial({color:0xc66565,roughness:.6})));updateVerificationCard(key,{status:'failed',url:preflight.url,httpStatus:preflight.status,bbox:'0 x 0 x 0',fallback:false,note:MODEL_ERROR_DETAILS.get(key)||'failed to load'});verify3D.items.push({key,group,bbox:null});return;}
      const target=verificationTargetSize(key);fitObjectToFootprint(model,target.w,target.d,target.h);model.rotation.y+=(reg.yawOffset||0)+axisYawOffset(reg.forwardAxis);model.position.y+=reg.yOffset||0;group.add(model);
      const bbox=new THREE.Box3().setFromObject(model),size=new THREE.Vector3();bbox.getSize(size);
      updateVerificationCard(key,{status:'loaded',url:preflight.url,httpStatus:preflight.status,bbox:`${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`,fallback:false,note:reg.category});
      verify3D.items.push({key,group,bbox});
    }catch(err){
      console.error('Verification asset failed',key,err);
      group.add(new THREE.Mesh(new THREE.BoxGeometry(1.8,1.8,.2),new THREE.MeshStandardMaterial({color:0xc66565,roughness:.6})));
      updateVerificationCard(key,{status:'failed',bbox:'0 x 0 x 0',fallback:false,note:(err&&err.message)||'exception during gallery load'});
      verify3D.items.push({key,group,bbox:null});
    }
  }));
  verify3D.cam.position.set(0,12,22);verify3D.cam.lookAt(0,2,4);
  (function anim(){if(!verify3D)return;verify3D.raf=requestAnimationFrame(anim);verify3D.ren.render(verify3D.scene,verify3D.cam)})();
}
function cycleVerificationAssets(){
  if(!verify3D||!verify3D.items.length)return;
  const item=verify3D.items[verify3D.cycleIndex%verify3D.items.length];
  verify3D.cycleIndex++;
  const pos=item.group.position.clone();
  verify3D.cam.position.set(pos.x,5.5,pos.z+8.5);
  verify3D.cam.lookAt(pos.x,1.6,pos.z);
}

// ── REAL 3D FURNITURE ──
function buildFurniture3D(f, rH) {
  const g = new THREE.Group();
  const type = resolveLabel(f.label);
  const sc = furnitureBaseTint(f, '#C9B99A');

  try {
  if (type === 'sofa') {
    const bm = new THREE.MeshStandardMaterial({color: sc, roughness: .75});
    const base = box3(f.w||5, 1, f.d||2.5, bm); base.position.y = .5; g.add(base);
    const back = box3(f.w||5, .9, .4, bm); back.position.set(0, 1.4, -(f.d||2.5)/2+.2); g.add(back);
    const aL = box3(.35, .65, (f.d||2.5)-.4, bm); aL.position.set(-(f.w||5)/2+.175, .95, 0); g.add(aL);
    const aR = aL.clone(); aR.position.x = (f.w||5)/2-.175; g.add(aR);
    // Cushions
    const cm = new THREE.MeshStandardMaterial({color: new THREE.Color(sc).offsetHSL(0, .02, .05), roughness: .85});
    const cw = ((f.w||5)-1) / 2;
    const c1 = box3(cw, .2, (f.d||2.5)-.8, cm); c1.position.set(-cw/2-.05, 1.1, .1); g.add(c1);
    const c2 = c1.clone(); c2.position.x = cw/2+.05; g.add(c2);
    // Legs
    const lm = new THREE.MeshStandardMaterial({color: 0x5C4D42, roughness: .5, metalness: .1});
    const hw = (f.w||5)/2-.3, hd = (f.d||2.5)/2-.3;
    [[-hw,hd],[hw,hd],[-hw,-hd],[hw,-hd]].forEach(p => { const l = cy3(.05, .3, lm); l.position.set(p[0], .15, p[1]); g.add(l) });
  } else if (type === 'bed') {
    const wm = new THREE.MeshStandardMaterial({color: 0x8B6D4C, roughness: .55});
    const fm2 = new THREE.MeshStandardMaterial({color: 0xF0EAE0, roughness: .9});
    const frame = box3(f.w||5.5, .5, f.d||7, wm); frame.position.y = .35; g.add(frame);
    const matt = box3((f.w||5.5)-.3, .45, (f.d||7)-.3, fm2); matt.position.y = .82; g.add(matt);
    const head = box3(f.w||5.5, 2.5, .3, new THREE.MeshStandardMaterial({color: sc, roughness: .7}));
    head.position.set(0, 1.55, -(f.d||7)/2+.15); g.add(head);
    // Pillows
    const pm2 = new THREE.MeshStandardMaterial({color: 0xFAF7F2, roughness: .9});
    const p1 = box3(1.5, .25, .85, pm2); p1.position.set(-1.1, 1.2, -(f.d||7)/2+1.5); g.add(p1);
    const p2 = p1.clone(); p2.position.x = 1.1; g.add(p2);
    // Sheet
    const sheet = box3((f.w||5.5)-.5, .06, (f.d||7)*.5, new THREE.MeshStandardMaterial({color: sc.clone().offsetHSL(0,0,.08), roughness: .85}));
    sheet.position.set(0, 1.08, (f.d||7)*.1); g.add(sheet);
  } else if (type === 'table' || type === 'desk') {
    const wm = new THREE.MeshStandardMaterial({color: 0x8B7355, roughness: .5, metalness: .05});
    const top = box3(f.w||3.5, .12, f.d||1.8, wm); top.position.y = 2.3; g.add(top);
    const lm = new THREE.MeshStandardMaterial({color: 0x6B4D35, roughness: .5});
    const hw = (f.w||3.5)/2-.3, hd = (f.d||1.8)/2-.2;
    [[-hw,hd],[hw,hd],[-hw,-hd],[hw,-hd]].forEach(p => { const l = cy3(.05, 2.15, lm); l.position.set(p[0], 1.075, p[1]); g.add(l) });
  } else if (type === 'chair') {
    const cm = new THREE.MeshStandardMaterial({color: sc, roughness: .7});
    const seat = box3(1.6, .45, 1.6, cm); seat.position.y = 1.2; g.add(seat);
    const back = box3(1.6, 1.2, .18, cm); back.position.set(0, 2.05, -.7); g.add(back);
    const lm = new THREE.MeshStandardMaterial({color: 0x6B4D35, roughness: .55});
    [[-0.6,.6],[.6,.6],[-.6,-.6],[.6,-.6]].forEach(p => { const l = cy3(.04, .95, lm); l.position.set(p[0], .475, p[1]); g.add(l) });
  } else if (type === 'lamp') {
    const base = cy3(.25, .08, new THREE.MeshStandardMaterial({color: 0x555, roughness: .4, metalness: .3}));
    base.position.y = .04; g.add(base);
    const pole = cy3(.025, 4, new THREE.MeshStandardMaterial({color: 0x888, metalness: .5}));
    pole.position.y = 2; g.add(pole);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.12, .4, .55, 16, 1, true),
      new THREE.MeshStandardMaterial({color: 0xF5E8D0, roughness: .8, side: THREE.DoubleSide}));
    // No extra light on mobile - lamp is visual only
    shade.position.y = 4.3; g.add(shade);
  } else if (type === 'plant') {
    const pot = cy3(.3, .6, new THREE.MeshStandardMaterial({color: 0x8B7E74, roughness: .8}));
    pot.position.y = .3; g.add(pot);
    const lm = new THREE.MeshStandardMaterial({color: 0x5C8B4A, roughness: .8});
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.25 + Math.random() * .15, 8, 6), lm);
      leaf.position.set((Math.random()-.5)*.4, 1.2 + Math.random() * 1, (Math.random()-.5)*.4);
      leaf.scale.set(1, 1.3, .7); g.add(leaf);
    }
  } else if (type === 'storage') {
    const body = box3(f.w||4, 2.8, f.d||1.5, new THREE.MeshStandardMaterial({color:0xB79F84, roughness:.65}));
    body.position.y = 1.4; g.add(body);
    const top2 = box3((f.w||4)+.05, .12, (f.d||1.5)+.05, new THREE.MeshStandardMaterial({color:0x8B7355, roughness:.45}));
    top2.position.y = 2.86; g.add(top2);
    const hm = new THREE.MeshStandardMaterial({color:0x8F8A83, metalness:.45, roughness:.35});
    for(let row=0;row<3;row++){const hh=new THREE.Mesh(new THREE.BoxGeometry(.28,.05,.05),hm);hh.position.set(0,.7+row*.75,(f.d||1.5)/2+.03);g.add(hh)}
  } else if (type === 'rug') {
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(f.w||5, f.d||3.5),
      new THREE.MeshStandardMaterial({color: sc, roughness: .95, side: THREE.DoubleSide}));
    rug.rotation.x = -Math.PI/2; rug.position.y = .02; g.add(rug);
  } else if (type === 'cabinet' || type === 'base cabinet' || type === 'upper cabinet') {
    const bm = new THREE.MeshStandardMaterial({color: sc, roughness: .55, metalness: .02});
    const wm = new THREE.MeshStandardMaterial({color: 0x8B7355, roughness: .5, metalness: .05});
    const hm = new THREE.MeshStandardMaterial({color: 0x888888, roughness: .2, metalness: .8});
    const body = box3(f.w||1.5, f.d||2.9, (f.d||0.65), bm); body.position.y = (f.d||2.9)/2; g.add(body);
    const top = box3((f.w||1.5)+.04, .06, (f.d||0.65)+.04, wm); top.position.y = (f.d||2.9)+.03; g.add(top);
    const doors = Math.max(1, Math.round((f.w||1.5)/0.75));
    const dw = ((f.w||1.5) - .08) / doors;
    for(let i = 0; i < doors; i++) {
      const door = box3(dw-.04, (f.d||2.9)-.2, .04, new THREE.MeshStandardMaterial({color: new THREE.Color(sc).offsetHSL(0,0,.04), roughness:.48}));
      door.position.set(-((f.w||1.5)/2) + dw*(i+.5), (f.d||2.9)/2, (f.d||0.65)/2+.02); g.add(door);
      const handle = box3(.04, .35, .03, hm); handle.position.set(-((f.w||1.5)/2)+dw*(i+.5)+dw*.35, (f.d||2.9)/2, (f.d||0.65)/2+.055); g.add(handle);
    }
    const plinth = box3((f.w||1.5), .18, (f.d||0.65), new THREE.MeshStandardMaterial({color:0x555555, roughness:.7})); plinth.position.y = .09; g.add(plinth);
  } else if (type === 'refrigerator' || type === 'fridge') {
    const bm = new THREE.MeshStandardMaterial({color: 0xE0E0E0, roughness: .15, metalness: .7});
    const dm = new THREE.MeshStandardMaterial({color: 0xD0D0D0, roughness: .18, metalness: .65});
    const hm = new THREE.MeshStandardMaterial({color: 0xA8A8A8, roughness: .12, metalness: .85});
    const body = box3(f.w||2.8, f.h||5.8, f.d||2.2, bm); body.position.y = (f.h||5.8)/2; g.add(body);
    const fdh = (f.h||5.8) * .65;
    const doorL = box3((f.w||2.8)/2-.06, fdh-.1, .06, dm); doorL.position.set(-(f.w||2.8)/4, (f.h||5.8)-(fdh/2)-.02, (f.d||2.2)/2+.03); g.add(doorL);
    const doorR = doorL.clone(); doorR.position.x = (f.w||2.8)/4; g.add(doorR);
    const drawer = box3((f.w||2.8)-.08, (f.h||5.8)*.28-.1, .06, dm); drawer.position.set(0, (f.h||5.8)*.14, (f.d||2.2)/2+.03); g.add(drawer);
    const hL = box3(.05, .7, .05, hm); hL.position.set(-(f.w||2.8)/4+.35, (f.h||5.8)-(fdh/2), (f.d||2.2)/2+.07); g.add(hL);
    const hR = hL.clone(); hR.position.x = (f.w||2.8)/4-.35; g.add(hR);
  } else if (type === 'stove' || type === 'range' || type === 'gas range') {
    const bm = new THREE.MeshStandardMaterial({color: 0xD8D8D8, roughness: .2, metalness: .65});
    const top = new THREE.MeshStandardMaterial({color: 0x2A2A2A, roughness: .35, metalness: .1});
    const body = box3(f.w||2.5, 2.9, f.d||2.0, bm); body.position.y = 1.45; g.add(body);
    const cooktop = box3((f.w||2.5)-.1, .04, (f.d||2.0)*.55, top); cooktop.position.set(0, 2.94, -(f.d||2.0)*.2); g.add(cooktop);
    const burnerM = new THREE.MeshStandardMaterial({color:0x444444, roughness:.4, metalness:.5});
    [[-0.7,.4],[0.7,.4],[-0.7,-.2],[0.7,-.2],[0,-.2]].forEach(([x,z]) => {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.05,12), burnerM); b.position.set(x, 2.98, -(f.d||2.0)*.2+z); g.add(b);
    });
    const oven = box3((f.w||2.5)-.1, 1.5, .05, new THREE.MeshStandardMaterial({color:0xC8C8C8, roughness:.22, metalness:.6})); oven.position.set(0, .85, (f.d||2.0)/2+.025); g.add(oven);
    const handle = box3((f.w||2.5)*.55, .06, .04, new THREE.MeshStandardMaterial({color:0x999999, roughness:.15, metalness:.9})); handle.position.set(0, 1.65, (f.d||2.0)/2+.06); g.add(handle);
  } else if (type === 'sink' || type === 'kitchen sink') {
    const bm = new THREE.MeshStandardMaterial({color: sc, roughness:.5, metalness:.02});
    const sm = new THREE.MeshStandardMaterial({color: 0xE8E8E8, roughness:.1, metalness:.75});
    const body = box3(f.w||3.0, 2.9, f.d||0.65, bm); body.position.y = 1.45; g.add(body);
    const ctop = box3((f.w||3.0)-.04, .06, (f.d||0.65)-.04, sm); ctop.position.y = 2.92; g.add(ctop);
    const basin = box3((f.w||3.0)*.55, .36, (f.d||0.65)*.7, new THREE.MeshStandardMaterial({color:0xDDDDDD, roughness:.08, metalness:.85})); basin.position.set(-(f.w||3.0)*.12, 2.73, 0); g.add(basin);
    const faucetBase = new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,.12,8), sm); faucetBase.position.set(0, 2.98, -(f.d||0.65)*.25); g.add(faucetBase);
    const faucetNeck = new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.8,8), sm); faucetNeck.position.set(0, 3.45, -(f.d||0.65)*.25); g.add(faucetNeck);
    const door = box3((f.w||3.0)-.08, 2.2, .04, new THREE.MeshStandardMaterial({color:new THREE.Color(sc).offsetHSL(0,0,.04), roughness:.48})); door.position.set(0, 1.18, (f.d||0.65)/2+.02); g.add(door);
  } else if (type === 'island' || type === 'kitchen island') {
    const bm = new THREE.MeshStandardMaterial({color: sc, roughness:.5, metalness:.02});
    const wm = new THREE.MeshStandardMaterial({color: 0x8B7355, roughness:.6, metalness:.03});
    const body = box3(f.w||4.0, 2.9, f.d||2.5, bm); body.position.y = 1.45; g.add(body);
    const itop = box3((f.w||4.0)+.08, .08, (f.d||2.5)+.08, wm); itop.position.y = 2.96; g.add(itop);
    for(let side of [1,-1]) {
      const door = box3((f.w||4.0)*.45, 1.8, .04, new THREE.MeshStandardMaterial({color:new THREE.Color(sc).offsetHSL(0,0,.04), roughness:.48})); door.position.set(side*(f.w||4.0)*.24, 1.48, side*(f.d||2.5)/2+.02); door.rotation.y = side===1?0:Math.PI; g.add(door);
    }
  } else if (type === 'vanity' || type === 'single vanity' || type === 'double vanity') {
    const bm = new THREE.MeshStandardMaterial({color: sc, roughness:.5, metalness:.02});
    const sm = new THREE.MeshStandardMaterial({color: 0xE5E5E5, roughness:.08, metalness:.6});
    const mm = new THREE.MeshStandardMaterial({color: 0xD0D0D0, roughness:.06, metalness:.75});
    const body = box3(f.w||2.5, 2.8, f.d||0.6, bm); body.position.y = 1.4; g.add(body);
    const counter = box3((f.w||2.5)+.04, .08, (f.d||0.6)+.04, new THREE.MeshStandardMaterial({color:0xF2EDE6, roughness:.15, metalness:.05})); counter.position.y = 2.84; g.add(counter);
    const basins = f.label&&f.label.toLowerCase().includes('double')?2:1;
    const bw = ((f.w||2.5)-0.3) / basins;
    for(let i=0;i<basins;i++){
      const basin = box3(bw*.7, .25, (f.d||0.6)*.6, sm); basin.position.set(-((f.w||2.5)/2-0.15)+bw*(i+.5), 2.75, 0); g.add(basin);
      const fn = new THREE.Mesh(new THREE.CylinderGeometry(.02,.025,.5,8), mm); fn.position.set(-((f.w||2.5)/2-0.15)+bw*(i+.5), 3.15, -(f.d||0.6)*.2); g.add(fn);
    }
    const doors = Math.max(1, Math.round((f.w||2.5)/0.7));
    const dw2 = ((f.w||2.5)-.08)/doors;
    for(let i=0;i<doors;i++){
      const door = box3(dw2-.04, 2.0, .04, new THREE.MeshStandardMaterial({color:new THREE.Color(sc).offsetHSL(0,0,.04), roughness:.48})); door.position.set(-(f.w||2.5)/2+dw2*(i+.5), 1.08, (f.d||0.6)/2+.02); g.add(door);
      const handle = box3(.04, .25, .03, mm); handle.position.set(-(f.w||2.5)/2+dw2*(i+.5)+dw2*.38, 1.3, (f.d||0.6)/2+.055); g.add(handle);
    }
  } else if (type === 'toilet') {
    const wm = new THREE.MeshStandardMaterial({color: 0xF9F6F0, roughness:.15, metalness:.02});
    const gm = new THREE.MeshStandardMaterial({color: 0xDDD9D0, roughness:.2, metalness:.02});
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.38,.42,.48,16), wm); base.position.set(0,.24,-(f.d||2.0)*.15); g.add(base);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,.28,16), wm); bowl.position.set(0,.62,-(f.d||2.0)*.15); g.add(bowl);
    const seat = new THREE.Mesh(new THREE.TorusGeometry(.3,.06,8,24), gm); seat.rotation.x=Math.PI/2; seat.position.set(0,.78,-(f.d||2.0)*.15); g.add(seat);
    const tank = box3(.52,.88,.26, wm); tank.position.set(0,.44,(f.d||2.0)*.35); g.add(tank);
    const tankTop = box3(.56,.06,.3, gm); tankTop.position.set(0,.91,(f.d||2.0)*.35); g.add(tankTop);
  } else if (type === 'bathtub' || type === 'tub') {
    const wm = new THREE.MeshStandardMaterial({color: 0xFAF6F0, roughness:.12, metalness:.02});
    const cm = new THREE.MeshStandardMaterial({color: 0xC0C0C0, roughness:.15, metalness:.8});
    const outer = box3(f.w||2.5, 1.6, f.d||5.5, wm); outer.position.y = .8; g.add(outer);
    const inner = box3((f.w||2.5)-.22, 1.2, (f.d||5.5)-.22, new THREE.MeshStandardMaterial({color:0xF0ECE6, roughness:.08, metalness:.04})); inner.position.y = 1.0; g.add(inner);
    const rim = box3((f.w||2.5)+.06, .12, (f.d||5.5)+.06, new THREE.MeshStandardMaterial({color:0xF4F0EA, roughness:.1, metalness:.04})); rim.position.y = 1.62; g.add(rim);
    const fn2 = new THREE.Mesh(new THREE.CylinderGeometry(.03,.035,.55,8), cm); fn2.position.set(0, 2.22, -(f.d||5.5)*.38); g.add(fn2);
  } else if (type === 'shower') {
    const gm = new THREE.MeshStandardMaterial({color: 0xE0EEF5, roughness:.05, metalness:.02, transparent:true, opacity:.45});
    const fm = new THREE.MeshStandardMaterial({color: 0xDDD9D2, roughness:.35});
    const cm2 = new THREE.MeshStandardMaterial({color: 0xC8C8C8, roughness:.15, metalness:.8});
    const sbase = box3(f.w||3.0, .12, f.d||3.0, fm); sbase.position.y = .06; g.add(sbase);
    const pF = box3(f.w||3.0, 5.5, .06, gm); pF.position.set(0, 2.8, (f.d||3.0)/2); g.add(pF);
    const pL = box3(.06, 5.5, f.d||3.0, gm); pL.position.set(-(f.w||3.0)/2, 2.8, 0); g.add(pL);
    const pR = pL.clone(); pR.position.x = (f.w||3.0)/2; g.add(pR);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.9,8), cm2); arm.rotation.z=Math.PI/2; arm.position.set(-(f.w||3.0)*.35, 6.2, -(f.d||3.0)*.3); g.add(arm);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,.06,16), cm2); head.rotation.z=0; head.position.set(-(f.w||3.0)*.35+.5, 6.2, -(f.d||3.0)*.3); g.add(head);
  } else {
    // Generic box
    const bx = box3(f.w||2, 1.5, f.d||1.5, new THREE.MeshStandardMaterial({color: sc, roughness: .7}));
    bx.position.y = .75; g.add(bx);
  }
  } catch(err) { console.warn('Furniture build error:', err); }
  return g;
}

function box3(w,h,d,m){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m)}
function cy3(r,h,m){return new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),m)}

function rebuild3D(){
  stop3D();
  build3D();
  if(typeof applyRoomStyleToScene==='function')applyRoomStyleToScene();
  updateWalkthroughTray();
  updatePhotoTray();
}
function disposeMaterial(mat){
  if(!mat)return;
  const mats=Array.isArray(mat)?mat:[mat];
  mats.forEach(m=>{
    if(!m)return;
    ['map','alphaMap','aoMap','bumpMap','displacementMap','emissiveMap','envMap','lightMap','metalnessMap','normalMap','roughnessMap'].forEach(key=>{
      const tex=m[key];
      if(tex&&typeof tex.dispose==='function')tex.dispose();
    });
    if(typeof m.dispose==='function')m.dispose();
  });
}
function disposeSceneGraph(root){
  if(!root)return;
  root.traverse(obj=>{
    if(obj.geometry&&typeof obj.geometry.dispose==='function')obj.geometry.dispose();
    if(obj.material)disposeMaterial(obj.material);
  });
}
function stop3D(){
  if(raf3d){cancelAnimationFrame(raf3d);raf3d=null}
  if(rebuild3DTimer){clearTimeout(rebuild3DTimer);rebuild3DTimer=null}
const wc2=document.getElementById('walkCtrl');if(wc2)wc2.remove();stopWalkMove();stopWalkTurn();
  document.getElementById('photoTray')?.remove();
  document.getElementById('tourTray')?.remove();
  document.getElementById('presentTray')?.remove();
  if(scene)disposeSceneGraph(scene);
  if(ren){
    if(ren._listeners){
      const L=ren._listeners;
      L.el.removeEventListener('pointerdown',L.pDown);
      L.el.removeEventListener('pointerup',L.pUp);
      L.el.removeEventListener('pointermove',L.pMove);
      L.el.removeEventListener('pointercancel',L.pCancel);
      L.el.removeEventListener('lostpointercapture',L.pCancel);
    }
    ren._listeners=null;
    ren.dispose();
    ren.forceContextLoss?.();
    if(ren.domElement&&ren.domElement.parentNode)ren.domElement.parentNode.removeChild(ren.domElement);
    ren=null}
  const cont=document.getElementById('threeC');if(cont)cont.innerHTML='';
  document.getElementById('scrEd')?.classList.remove('mode-3d');
  if(composer){try{composer.passes&&composer.passes.forEach(p=>p.dispose&&p.dispose())}catch(_){}composer=null}
  scene=null;cam=null}

// Presentation / reveal polish overrides
exit3DView=function(){
  stop3D();
  hideViewChip();
  is3D=false;camMode='orbit';presentationMode=false;compare3DMode=false;photoMode=false;photoTrayOpen=false;cameraScript=null;walkthroughTrayOpen=false;
  document.getElementById('scrEd').classList.remove('mode-3d','presentation','photo-mode');
  document.getElementById('threeC').classList.remove('on');
  document.getElementById('b3d').classList.remove('on');
  document.getElementById('vLbl').textContent='2D Plan';
  document.getElementById('camBtns').classList.remove('on');
  document.getElementById('walkHint').classList.remove('on');
  document.getElementById('presentPill').classList.remove('on');
  document.getElementById('presentPill').textContent='Presentation Mode';
  document.getElementById('photoPill')?.classList.remove('on');
  document.getElementById('cmCompare').classList.remove('act');
  document.getElementById('cmTour')?.classList.remove('act');
  document.getElementById('cmPhoto')?.classList.remove('act');
  document.getElementById('presentTray')?.remove();
  updateWalkthroughTray();
  updatePhotoTray();
  resetRoomDebug();
  initCan();
  draw();
  showP();
}
toggleWalkthroughTray=function(){
  if(!is3D)return;
  if(photoMode)togglePhotoMode(false);
  if(presentationMode)togglePresentationMode();
  walkthroughTrayOpen=!walkthroughTrayOpen;
  document.getElementById('cmTour')?.classList.toggle('act',walkthroughTrayOpen);
  updateWalkthroughTray();
}
updateWalkthroughTray=function(){
  const existing=document.getElementById('tourTray');
  if(!is3D||!walkthroughTrayOpen||photoMode||presentationMode){if(existing)existing.remove();return;}
  const isTouch=(navigator.maxTouchPoints||0)>0||window.innerWidth<=760;
  const presets=[
    ['favorite_corner','Favorite Corner','Finds the room\'s best-composed angle.'],
    ['dollhouse','Dollhouse','Pulls back for the whole-room silhouette.'],
    ['stroll','Stroll','Walks the room at eye level with a calmer pace.'],
    ['corner_reveal','Corner Reveal','Starts wide, then settles into the strongest corner.'],
    ['before_after','Before / After','Stages existing, redesign, and combined in sequence.'],
    ['romantic_reveal','Romantic Reveal','A soft, slower sweep for the final presentation feel.'],
  ];
  const markup='<div class="tour-tray'+(isTouch?' touch':'')+'" id="tourTray"><div class="tour-panel'+(isTouch?' touch':'')+'"><div class="tour-head"><div><div class="tour-title">Walkthrough Moves</div><div class="tour-copy">'+(isTouch?'Choose a move, then keep your thumb near the bottom edge while the room glides into place.':'Choose a guided move for a cleaner, more cinematic room reveal.')+'</div></div><button class="mini-chip secondary" type="button" data-action="toggle-walkthrough-tray">Close</button></div><div class="tour-grid'+(isTouch?' touch':'')+'">'+presets.map(([id,label,copy])=>'<button class="tour-preset'+(isTouch?' touch':'')+'" type="button" data-action="start-walkthrough-preset" data-preset-id="'+id+'"><span class="tour-preset-title">'+label+'</span><span class="tour-preset-copy">'+copy+'</span></button>').join('')+'</div></div></div>';
  if(existing)existing.outerHTML=markup; else document.getElementById('cWrap').insertAdjacentHTML('beforeend',markup);
}
togglePhotoMode=function(force){
  if(!is3D)return;
  const next=typeof force==='boolean'?force:!photoMode;
  photoMode=next;
  if(photoMode){
    presentationMode=false;
    walkthroughTrayOpen=false;
    photoTrayOpen=true;
    document.getElementById('scrEd').classList.remove('presentation');
    document.getElementById('cmPresent')?.classList.remove('act');
    document.getElementById('cmTour')?.classList.remove('act');
    setPhotoPreset('hero');
  }else{
    photoTrayOpen=false;
  }
  document.getElementById('scrEd').classList.toggle('photo-mode',photoMode);
  document.getElementById('photoPill')?.classList.toggle('on',photoMode);
  document.getElementById('cmPhoto')?.classList.toggle('act',photoMode);
  updateWalkthroughTray();
  updatePhotoTray();
  updatePresentationTray();
  refreshPresentationPill();
  applyRoomStyleToScene?.();
}
updatePhotoTray=function(){
  const existing=document.getElementById('photoTray');
  if(!is3D||!photoMode||!photoTrayOpen){if(existing)existing.remove();return;}
  const presets=[
    ['hero','Hero Shot','Balanced hero angle for clean presentation images.'],
    ['favorite','Favorite Corner','Frames the room from its best-composed corner.'],
    ['intimate','Intimate','Moves in closer for softer, warmer storytelling.'],
    ['overhead','Overhead','Pulls up for a styled layout overview.']
  ];
  const markup=`<div class="photo-tray" id="photoTray"><div class="photo-panel"><div class="photo-head"><div><div class="photo-title">Photo Mode</div><div class="photo-copy">Minimal chrome, styled camera presets, and cleaner capture framing for presentation-ready stills.</div></div><button class="mini-chip secondary" type="button" data-action="toggle-photo-mode" data-photo-force="false">Exit</button></div><div class="photo-grid">${presets.map(([id,label,copy])=>`<button class="photo-preset" type="button" data-action="set-photo-preset" data-photo-preset="${id}"><span class="photo-preset-title">${label}</span><span class="photo-preset-copy">${copy}</span></button>`).join('')}</div><div class="photo-actions"><button class="mini-chip" type="button" data-action="capture-photo-mode">Capture PNG</button><button class="mini-chip secondary" type="button" data-action="set-view-preset" data-view-preset="hero">Reset to Hero</button></div></div></div>`;
  if(existing)existing.outerHTML=markup; else document.getElementById('cWrap').insertAdjacentHTML('beforeend',markup);
}
setPhotoPreset=function(mode){
  if(!is3D||!curRoom)return;
  const focus=getRoomFocus(curRoom);
  const current={yaw:cYaw,pitch:cPitch,dist:cDist,target:{...(orbitTarget||{x:focus.x,y:curRoom.height*.42,z:-focus.y})}};
  const poses={
    hero:heroRoomPose(curRoom),
    favorite:favoriteCornerPose(curRoom),
    intimate:intimateRoomPose(curRoom),
    overhead:{yaw:Math.PI*.12,pitch:.86,dist:Math.max(16,Math.min(30,Math.max(focus.width,focus.height,curRoom.height)*1.32)),target:{x:focus.x,y:curRoom.height*.46,z:-focus.y}}
  };
  const next=poses[mode]||poses.hero;
  showViewChip(`Photo Mode · ${photoPresetLabel(mode)}`);
  playCameraSequence([{duration:1100,apply:t=>applyCameraTween(current,next,t)}]);
}
function capturePresentationStill(){
  if(!is3D||!ren||!cam)return null;
  const size=ren.getSize(new THREE.Vector2());
  const prevRatio=ren.getPixelRatio();
  const targetRatio=Math.min(2.3*Math.max(1,window.devicePixelRatio||1),3);
  ren.setPixelRatio(targetRatio);
  ren.setSize(size.x,size.y,false);
  if(composer){composer.setSize(size.x,size.y);if(composer._fxaa){const pr=ren.getPixelRatio();composer._fxaa.material.uniforms['resolution'].value.set(1/(size.x*pr),1/(size.y*pr))}composer.render()}else ren.render(scene,cam);
  const dataUrl=ren.domElement.toDataURL('image/png');
  ren.setPixelRatio(prevRatio);
  ren.setSize(size.x,size.y,false);
  if(composer){composer.setSize(size.x,size.y);if(composer._fxaa){const pr=ren.getPixelRatio();composer._fxaa.material.uniforms['resolution'].value.set(1/(size.x*pr),1/(size.y*pr))}composer.render()}else ren.render(scene,cam);
  const a=document.createElement('a');
  a.href=dataUrl;
  a.download=`${(curRoom?.name||'room').replace(/[^a-z0-9]/gi,'_')}_reveal_cover.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast('Reveal cover exported');
  return dataUrl;
}
favoriteCornerPose=function(room){
  const focus=getRoomFocus(room);
  const centroid=(room.furniture||[]).length
    ? room.furniture.reduce((acc,f)=>({x:acc.x+(f.x||0),z:acc.z-(f.z||0)}),{x:0,z:0})
    : {x:focus.x,z:-focus.y};
  if((room.furniture||[]).length){
    centroid.x/=(room.furniture||[]).length;
    centroid.z/=(room.furniture||[]).length;
  }
  const b=getRoomBounds2D(room);
  const insetX=Math.max(1.2,Math.min(focus.width*.18,2.6));
  const insetY=Math.max(1.2,Math.min(focus.height*.18,2.6));
  const corners=[
    {x:b.x0+insetX,z:-b.y0-insetY},
    {x:b.x1-insetX,z:-b.y0-insetY},
    {x:b.x1-insetX,z:-b.y1+insetY},
    {x:b.x0+insetX,z:-b.y1+insetY},
  ];
  let best=null;
  corners.forEach(corner=>{
    const dx=centroid.x-corner.x,dz=centroid.z-corner.z;
    const dist=Math.hypot(dx,dz);
    const score=dist+(Math.abs(dx)+Math.abs(dz))*.2;
    if(!best||score>best.score)best={corner,score,dist,dx,dz};
  });
  const yaw=Math.atan2(best.dx,-best.dz);
  const dist=Math.max(14,Math.min(28,Math.max(focus.width,focus.height,room.height)*1.16));
  return {
    yaw,
    pitch:.38,
    dist,
    target:{
      x:focus.x*.76+centroid.x*.24,
      y:room.height*.38,
      z:(-focus.y)*.76+centroid.z*.24
    }
  };
}
function setPresentationShot(mode){
  if(!is3D||!curRoom)return;
  presentationShot=mode;
  showViewChip(`Presentation · ${presentationShotLabel(mode)}`);
  refreshPresentationPill();
  updatePresentationTray();
  if(mode==='before_after'){
    startWalkthroughPreset('before_after');
    return;
  }
  const focus=getRoomFocus(curRoom);
  const current={yaw:cYaw,pitch:cPitch,dist:cDist,target:{...(orbitTarget||{x:focus.x,y:curRoom.height*.42,z:-focus.y})}};
  const poses={
    hero:heroRoomPose(curRoom),
    favorite:favoriteCornerPose(curRoom),
    overview:overviewRoomPose(curRoom),
    intimate:intimateRoomPose(curRoom),
  };
  const next=poses[mode]||poses.hero;
  playCameraSequence([{duration:1350,apply:t=>applyCameraTween(current,next,t)}]);
}
startWalkthroughPreset=function(id){
  if(!is3D||!curRoom)return;
  walkthroughTrayOpen=false;updateWalkthroughTray();
  showViewChip(`Walkthrough · ${walkthroughPresetLabel(id)}`);
  const focus=getRoomFocus(curRoom);
  const current={yaw:cYaw,pitch:cPitch,dist:cDist,target:{...(orbitTarget||{x:focus.x,y:curRoom.height*.42,z:-focus.y})}};
  const overview=overviewRoomPose(curRoom);
  const corner=favoriteCornerPose(curRoom);
  const romantic={yaw:Math.PI*.52,pitch:.28,dist:Math.max(10,Math.min(24,Math.max(focus.width,focus.height)*1.1)),target:{x:focus.x,y:curRoom.height*.36,z:-focus.y}};
  const favorite=favoriteCornerPose(curRoom);
  if(id==='favorite_corner')playCameraSequence([{duration:1800,apply:t=>applyCameraTween(current,favorite,t)}]);
  else if(id==='dollhouse')playCameraSequence([{duration:2200,apply:t=>applyCameraTween(current,overview,t)}]);
  else if(id==='corner_reveal')playCameraSequence([{duration:1500,apply:t=>applyCameraTween(current,overview,t)},{duration:2200,apply:t=>applyCameraTween(overview,corner,t)}]);
  else if(id==='romantic_reveal'){presentationMode=true;presentationShot='hero';document.getElementById('scrEd').classList.add('presentation');playCameraSequence([{duration:1600,apply:t=>applyCameraTween(current,corner,t)},{duration:2400,apply:t=>applyCameraTween(corner,romantic,t)}]);}
  else if(id==='before_after'){presentationShot='before_after';playCameraSequence([{duration:900,onStart:()=>setCompareModeForTour('existing'),apply:t=>applyCameraTween(current,corner,t)},{duration:1200,onStart:()=>setCompareModeForTour('redesign'),apply:t=>applyCameraTween(corner,{...corner,yaw:corner.yaw+.24},t)},{duration:1200,onStart:()=>setCompareModeForTour('combined'),apply:t=>applyCameraTween({...corner,yaw:corner.yaw+.24},overview,t)}]);}
  else if(id==='stroll'){
    const pts=[findTourWalkPoint(0,3),findTourWalkPoint(1,3),findTourWalkPoint(2,3)];
    playCameraSequence([{duration:400,onStart:()=>setCamMode('walk'),apply:()=>{}},{duration:1800,apply:t=>applyWalkTween(fpPos,pts[0],t)},{duration:1800,apply:t=>applyWalkTween(pts[0],pts[1],t)},{duration:1800,apply:t=>applyWalkTween(pts[1],pts[2],t)},{duration:900,onStart:()=>setCamMode('orbit'),apply:()=>{}}]);
  }
  refreshPresentationPill();
  updatePresentationTray();
}
rebuild3D=function(){
  stop3D();
  build3D();
  if(typeof applyRoomStyleToScene==='function')applyRoomStyleToScene();
  refreshPresentationPill();
  updatePresentationTray();
  updateWalkthroughTray();
  updatePhotoTray();
}

// ═══════════════════════════════════════════════
// INFINITE DISCOVERY ENGINE
// Finite milestones + infinite generative moments
// Combinational: time x season x mood x behavior x history
// ═══════════════════════════════════════════════

function getTimeOfDay(){const h=new Date().getHours();if(h>=5&&h<12)return'morning';if(h>=12&&h<17)return'afternoon';if(h>=17&&h<22)return'evening';return'night'}
function getSeason(){const m=new Date().getMonth();if(m>=2&&m<=4)return'spring';if(m>=5&&m<=7)return'summer';if(m>=8&&m<=10)return'autumn';return'winter'}
function getDayType(){const d=new Date().getDay();return d===0?'sunday':d===6?'saturday':'weekday'}

const TIME_CONFIG={
  morning:{bodyClass:'',exposure:1.2,ambientIntensity:.5,warmth:0xFFF8E0},
  afternoon:{bodyClass:'',exposure:1.15,ambientIntensity:.45,warmth:0xFFF5E8},
  evening:{bodyClass:'evening',exposure:1.05,ambientIntensity:.38,warmth:0xFFE8C0},
  night:{bodyClass:'night',exposure:.95,ambientIntensity:.3,warmth:0xFFDDA0},
};
const MOOD_CONFIG={
  cozy:{exposureMod:-.05,adj:['tucked in','blanketed','nestled','soft','warm']},
  dreamy:{exposureMod:-.08,adj:['floating','gentle','hazy','drifting','quiet']},
  elegant:{exposureMod:.03,adj:['composed','graceful','poised','clean','refined']},
  'feels like home':{exposureMod:-.02,adj:['familiar','settled','real','lived-in','ours']},
  romantic:{exposureMod:-.06,adj:['candlelit','intimate','close','tender','warm']},
  peaceful:{exposureMod:-.03,adj:['still','unhurried','open','calm','resting']},
  bright:{exposureMod:.06,adj:['airy','fresh','awake','light','clear']},
  moody:{exposureMod:-.1,adj:['shadowed','cinematic','quiet','deep','velvet']},
};

function applyTimeTheme(){const tc=TIME_CONFIG[getTimeOfDay()];document.body.classList.remove('evening','night');if(tc.bodyClass)document.body.classList.add(tc.bodyClass)}

// Context snapshot for combinational selection
function getCtx(){
  const tod=getTimeOfDay(),season=getSeason(),day=getDayType(),room=curRoom;
  const labels=room?(room.furniture||[]).map(f=>resolveLabel(f.label)):[];
  const mood=room?(room.mood||''):'';
  const mc=MOOD_CONFIG[mood];
  const adj=mc?mc.adj[Math.floor(Math.random()*mc.adj.length)]:'soft';
  const A=adj.charAt(0).toUpperCase()+adj.slice(1);
  return{tod,season,day,mood,adj,A,hasLamp:labels.includes('lamp'),hasPlant:labels.includes('plant'),
    hasRug:labels.includes('rug'),hasBed:labels.includes('bed'),hasSofa:labels.includes('sofa'),
    items:room?(room.furniture||[]).length:0,opens:room?(room.openings||[]).length:0,is3D,camMode};
}
