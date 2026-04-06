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
}
let cameraScript=null,walkthroughTrayOpen=false;

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
  is3D=true;panelHidden=false;document.getElementById('threeC').classList.add('on');document.getElementById('b3d').classList.add('on');document.getElementById('vLbl').textContent='Step Inside 3D';document.getElementById('camBtns').classList.add('on');
  document.getElementById('cmCompare').classList.remove('act');
  document.getElementById('scrEd').classList.add('mode-3d');
  hideP();build3D();setTimeout(()=>{if(is3D)setViewPreset('overview')},80);updateWalkthroughTray();findEgg(5)}

function exit3DView(){stop3D();is3D=false;camMode='orbit';presentationMode=false;compare3DMode=false;cameraScript=null;walkthroughTrayOpen=false;document.getElementById('scrEd').classList.remove('mode-3d','presentation');document.getElementById('threeC').classList.remove('on');document.getElementById('b3d').classList.remove('on');document.getElementById('vLbl').textContent='2D Plan';document.getElementById('camBtns').classList.remove('on');document.getElementById('walkHint').classList.remove('on');document.getElementById('presentPill').classList.remove('on');document.getElementById('presentPill').textContent='Presentation Mode';document.getElementById('cmCompare').classList.remove('act');document.getElementById('cmTour')?.classList.remove('act');updateWalkthroughTray();resetRoomDebug();initCan();draw();showP()}

function togglePresentationMode(){
  if(!is3D)return;
  presentationMode=!presentationMode;
  document.getElementById('scrEd').classList.toggle('presentation',presentationMode);
  document.getElementById('presentPill').classList.toggle('on',presentationMode);
  document.getElementById('cmPresent').classList.toggle('act',presentationMode);
  if(presentationMode)setViewPreset('corner');
}
function setViewPreset(mode){
  if(!is3D||!curRoom)return;
  const focus=getRoomFocus(curRoom);
  camMode='orbit';
  document.getElementById('cmOrbit').classList.add('act');
  document.getElementById('cmWalk').classList.remove('act');
  if(mode==='overview'){
    cYaw=Math.PI*.18;cPitch=.72;cDist=Math.max(14,Math.min(44,Math.max(focus.width,focus.height,curRoom.height)*1.95));
  }else if(mode==='corner'){
    cYaw=Math.PI*.65;cPitch=.34;cDist=Math.max(12,Math.min(36,Math.max(focus.width,focus.height)*1.45));
  }else if(mode==='eye'){
    cYaw=Math.PI*.1;cPitch=.22;cDist=Math.max(10,Math.min(26,Math.max(focus.width,focus.height)*1.18));
  }
  orbitTarget={x:focus.x,y:curRoom.height*.42,z:-focus.y};
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
  walkthroughTrayOpen=!walkthroughTrayOpen;
  document.getElementById('cmTour')?.classList.toggle('act',walkthroughTrayOpen);
  updateWalkthroughTray();
}
function updateWalkthroughTray(){
  const existing=document.getElementById('tourTray');
  if(!is3D||!walkthroughTrayOpen){if(existing)existing.remove();return;}
  const isTouch=(navigator.maxTouchPoints||0)>0||window.innerWidth<=760;
  const presets=[
    ['favorite_corner','Favorite Corner','Finds the room’s best-composed angle.'],
    ['dollhouse','Dollhouse','Pulls back for the full room form.'],
    ['stroll','Stroll','Walks the room at eye level.'],
    ['corner_reveal','Corner Reveal','Settles into a cinematic corner angle.'],
    ['before_after','Before / After','Cycles existing, redesign, and combined.'],
    ['romantic_reveal','Romantic Reveal','Soft presentation sweep for the final feel.'],
  ];
  const markup='<div class="tour-tray'+(isTouch?' touch':'')+'" id="tourTray"><div class="tour-panel'+(isTouch?' touch':'')+'"><div class="tour-head"><div><div class="tour-title">Walkthrough Presets</div><div class="tour-copy">'+(isTouch?'Pick a move and keep your thumb near the bottom edge.':'Choose a camera move for the room.')+'</div></div><button class="mini-chip secondary" type="button" onclick="toggleWalkthroughTray()">Close</button></div><div class="tour-grid'+(isTouch?' touch':'')+'">'+presets.map(([id,label,copy])=>'<button class="tour-preset'+(isTouch?' touch':'')+'" type="button" onclick="startWalkthroughPreset(\''+id+'\')"><span class="tour-preset-title">'+label+'</span><span class="tour-preset-copy">'+copy+'</span></button>').join('')+'</div></div></div>';
  if(existing)existing.outerHTML=markup; else document.getElementById('cWrap').insertAdjacentHTML('beforeend',markup);
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
  scheduleRebuild3D(30);
}
function findTourWalkPoint(index,total){
  const focus=getRoomFocus(curRoom),radius=Math.max(1.4,Math.min(focus.maxD*.35,3.6)),angle=-Math.PI*.25+(index/Math.max(1,total-1))*Math.PI*.5;
  const candidate={x:focus.x+Math.cos(angle)*radius,z:-focus.y+Math.sin(angle)*radius};
  return clampWalkPos(candidate.x,candidate.z,curRoom)?candidate:findWalkStart(curRoom);
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
  const corners=[
    {x:b.x0-.8,z:-b.y0+.8},
    {x:b.x1+.8,z:-b.y0+.8},
    {x:b.x1+.8,z:-b.y1-.8},
    {x:b.x0-.8,z:-b.y1-.8},
  ];
  let best=null;
  corners.forEach(corner=>{
    const dx=centroid.x-corner.x,dz=centroid.z-corner.z;
    const dist=Math.hypot(dx,dz);
    const score=dist+(Math.abs(dx)+Math.abs(dz))*.2;
    if(!best||score>best.score)best={corner,score,dist,dx,dz};
  });
  const yaw=Math.atan2(best.dx,-best.dz);
  const dist=Math.max(10,Math.min(24,Math.max(focus.width,focus.height)*1.12));
  return {yaw,pitch:.32,dist,target:{x:centroid.x,y:room.height*.38,z:centroid.z}};
}
function startWalkthroughPreset(id){
  if(!is3D||!curRoom)return;
  walkthroughTrayOpen=false;updateWalkthroughTray();
  const focus=getRoomFocus(curRoom);
  const current={yaw:cYaw,pitch:cPitch,dist:cDist,target:{...(orbitTarget||{x:focus.x,y:curRoom.height*.42,z:-focus.y})}};
  const overview={yaw:Math.PI*.18,pitch:.78,dist:Math.max(18,Math.min(48,Math.max(focus.width,focus.height,curRoom.height)*2.2)),target:{x:focus.x,y:curRoom.height*.5,z:-focus.y}};
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
function updateCameraScript(now){
  if(!cameraScript||!cameraScript.steps?.length)return;
  if(cameraScript.index===-1){cameraScript.index=0;cameraScript.stepStart=now;cameraScript.steps[0].onStart?.();}
  const step=cameraScript.steps[cameraScript.index];
  const progress=Math.max(0,Math.min(1,(now-cameraScript.stepStart)/Math.max(1,step.duration||1)));
  step.apply?.(progress);
  if(progress>=1){cameraScript.index+=1;if(cameraScript.index>=cameraScript.steps.length){cameraScript=null;return;}cameraScript.stepStart=now;cameraScript.steps[cameraScript.index].onStart?.();}
}

function setCamMode(m){
  camMode=m;document.getElementById('cmOrbit').classList.toggle('act',m==='orbit');document.getElementById('cmWalk').classList.toggle('act',m==='walk');
  const r=curRoom,focus=getRoomFocus(r);
  orbitTarget={x:focus.x,y:r.height*.42,z:-focus.y};
  const ceiling=scene?.getObjectByName?.('roomCeiling');
  if(ceiling)ceiling.visible=m==='walk';
  if(m==='walk'){const start=findWalkStart(r);fpPos={x:start.x,y:Math.max(4.9,Math.min(r.height-1.15,r.height*.54)),z:start.z};cYaw=0;cPitch=0;orbitVel={yaw:0,pitch:0,zoom:0};bindWalkKeys();DS.walkUses++;saveDS();checkUnlocks();
    // Make ceiling visible for entire extended polygon in walk mode
    if(scene){scene.traverse(obj=>{if(obj.name==='roomCeiling')obj.visible=true})};
    document.getElementById('walkHint').classList.add('on');setTimeout(()=>document.getElementById('walkHint').classList.remove('on'),2500);findEgg(6)}
  else{cYaw=Math.PI*.18;cPitch=.52;cDist=Math.max(11,Math.min(42,Math.max(cDist||17,focus.maxD*2.35,Math.max(focus.width||0,focus.height||0,r.height*.9)*1.65,r.height*1.45)));orbitVel={yaw:0,pitch:0,zoom:0}}
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
function canUseLampShadows(room){
  const lamps=(room?.furniture||[]).filter(f=>String(f.assetKey||'').startsWith('lamp_')).length;
  const mobile=(navigator.maxTouchPoints||0)>0;
  return mobile?lamps<=2:lamps<=4;
}
function registerPracticalLight(light,baseIntensity,baseDistance){
  if(!scene?.userData?.styleTargets||!light)return;
  if(!scene.userData.styleTargets.practicalLights)scene.userData.styleTargets.practicalLights=[];
  scene.userData.styleTargets.practicalLights.push({light,baseIntensity,baseDistance});
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
    registerPracticalLight(light,3.2,11);
    }else if(type==='lamp_table'){
      const light=new THREE.PointLight(warmColor,preset.practical*2.1*ceilingBoost,6.5,1.85);
    light.position.set(0,1.15,0);
    light.castShadow=useShadows;
    light.shadow.mapSize.width=useShadows?512:256;
    light.shadow.mapSize.height=useShadows?512:256;
    light.shadow.bias=-0.001;
    anchor.add(light);
    addBulb(new THREE.Vector3(0,1.1,0),.1,.7);
    registerPracticalLight(light,2.1,6.5);
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
    registerPracticalLight(light,3.1,12);
    }else if(type==='lamp_pendant'||type==='lamp_chandelier'||type==='lamp_ceiling'||type==='lamp_cube'){
      const light=new THREE.PointLight(warmColor,preset.practical*3.8*ceilingBoost,13,1.55);
    light.position.set(0,-.2,0);
    light.castShadow=useShadows;
    light.shadow.mapSize.width=useShadows?768:256;
    light.shadow.mapSize.height=useShadows?768:256;
    light.shadow.bias=-0.001;
    anchor.add(light);
    addBulb(new THREE.Vector3(0,-.15,0),.12,.85);
    registerPracticalLight(light,3.8,13);
  }
}

function build3D(){
  try{
    resetRoomDebug();
    const cont=document.getElementById('threeC');const w=cont.clientWidth,h=cont.clientHeight;
    const r=curRoom,rH=r.height,focus=getRoomFocus(r),cx=focus.x,cz=focus.y,maxD=Math.max(6,focus.maxD),frameSpan=Math.max(focus.width||0,focus.height||0,rH*.9);
    const preset=getLightingPreset(r);
    const wallFinish=WALL_PALETTES.find(x=>x.id===(r.materials.wallFinish||'warm_white'))||WALL_PALETTES[0];
    const floorPreset=FLOOR_TYPES.find(x=>x.id===(r.materials.floorType||'light_oak'))||FLOOR_TYPES[0];
    scene=new THREE.Scene();
    scene.userData.styleTargets={wallMats:[],trimMats:[],floorMats:[],ceilingMats:[]};
    scene.background=safeThreeColor(preset.background,'#0f141c');
    scene.fog=new THREE.Fog(scene.background.getHex(),preset.fogNear||28,preset.fogFar||82);
    cam=new THREE.PerspectiveCamera(53,w/h,.3,140);
    cDist=Math.max(11,Math.min(42,Math.max(maxD*2.35,frameSpan*1.65,rH*1.45)));
    if(camMode==='orbit'){cYaw=Math.PI*.22;cPitch=.48}
    orbitTarget={x:cx,y:rH*.42,z:-cz};orbitVel={yaw:0,pitch:0,zoom:0};
    ren=new THREE.WebGLRenderer({antialias:true});
    ren.setSize(w,h);ren.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
    ren.toneMapping=THREE.NoToneMapping;ren.toneMappingExposure=preset.exposure;
    ren.outputEncoding=THREE.sRGBEncoding;
    cont.innerHTML='';cont.appendChild(ren.domElement);
    ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;
    const hemiLight=new THREE.HemisphereLight(0xffffff,preset.warm,preset.ambient*1.18);scene.add(hemiLight);
    const ambLight=new THREE.AmbientLight(preset.warm,preset.ambient*.78);scene.add(ambLight);
    const dir=new THREE.DirectionalLight(preset.dirColor,preset.dir);dir.position.set(maxD,rH*1.8,maxD*.75);dir.castShadow=true;dir.shadow.mapSize.width=1024;dir.shadow.mapSize.height=1024;dir.shadow.radius=4;dir.shadow.camera.near=1;dir.shadow.camera.far=80;dir.shadow.camera.left=-24;dir.shadow.camera.right=24;dir.shadow.camera.top=24;dir.shadow.camera.bottom=-24;scene.add(dir);
    const fill=new THREE.DirectionalLight(0xf4ede4,preset.ambient*.52);fill.position.set(-maxD*.8,rH*1.1,-maxD*.35);scene.add(fill);
    scene.userData.styleTargets.hemiLight=hemiLight;
    scene.userData.styleTargets.ambLight=ambLight;
    scene.userData.styleTargets.dirLight=dir;
    scene.userData.styleTargets.fillLight=fill;
    const tc=safeThreeColor(r.materials.trim,TRIM_COLORS[0]),wc=safeThreeColor(r.materials.wall,WALL_PALETTES[0].color);
    const floorShape=new THREE.Shape();r.polygon.forEach((p,i)=>!i?floorShape.moveTo(p.x,p.y):floorShape.lineTo(p.x,p.y));floorShape.closePath();
    const floorMap=buildFloorTexture(r.materials.floor,r.materials.floorType||'light_oak');
    const floorAccentMap=buildFloorAccentTexture(r.materials.floorType||'light_oak');
    const floorGeo=applyPlanarUVs(new THREE.ShapeGeometry(floorShape),r.polygon);
    const floorMat=new THREE.MeshStandardMaterial({color:safeThreeColor(r.materials.floor,floorPreset.color),roughness:floorPreset.roughness,metalness:floorPreset.family==='concrete'?.08:.03,map:floorMap});
    if(floorMat.map){floorMat.map.needsUpdate=true}
    const floorMesh=new THREE.Mesh(floorGeo,floorMat);floorMesh.rotation.x=-Math.PI/2;floorMesh.receiveShadow=true;scene.add(floorMesh);
    scene.userData.styleTargets.floorMats.push(floorMat);
    scene.userData.styleTargets.floorMesh=floorMesh;
    const accentTone=safeThreeColor(r.materials.floor,floorPreset.color).lerp(safeThreeColor('#ffffff','#ffffff'),.46);
    const accentOpacity=floorPreset.family==='checker'?.36:floorPreset.family==='tile'?.42:floorPreset.family==='concrete'?.24:.34;
    const accentMat=new THREE.MeshStandardMaterial({color:accentTone,roughness:1,metalness:0,map:floorAccentMap,transparent:true,opacity:accentOpacity,depthWrite:false});
    const accentMesh=new THREE.Mesh(applyPlanarUVs(new THREE.ShapeGeometry(floorShape),r.polygon),accentMat);accentMesh.rotation.x=-Math.PI/2;accentMesh.position.y=.012;scene.add(accentMesh);
    scene.userData.styleTargets.floorAccent=accentMesh;
    const ceilColor=safeThreeColor(r.materials.ceiling,'#FAF7F2').multiplyScalar(Math.max(.86,Math.min(1.18,r.materials.ceilingBrightness||1)));
    const ceilMesh=new THREE.Mesh(new THREE.ShapeGeometry(floorShape),new THREE.MeshStandardMaterial({color:ceilColor,roughness:.92,side:THREE.BackSide}));ceilMesh.name='roomCeiling';ceilMesh.visible=camMode==='walk';ceilMesh.rotation.x=-Math.PI/2;ceilMesh.position.y=rH-.01;scene.add(ceilMesh);
    scene.userData.styleTargets.ceilingMats.push(ceilMesh.material);
    const ceilLight=new THREE.PointLight(0xFFF8E8,.28*(r.materials.ceilingBrightness||1),maxD*3.2);ceilLight.position.set(cx,rH-.4,-cz);scene.add(ceilLight);
    scene.userData.styleTargets.ceilingLight=ceilLight;
    const wallMat=new THREE.MeshStandardMaterial({color:wc,roughness:.62-wallFinish.sheen*.14,metalness:.01,side:THREE.DoubleSide,emissive:wc.clone().multiplyScalar(r.materials.wallColorCustom?.08:.04)});
    scene.userData.styleTargets.wallMats.push(wallMat);
    r.walls.forEach(wall=>{const a=wS(r,wall),b=wE(r,wall),wl=wL(r,wall),an=wA(r,wall);if(wl<.01)return;const ops=r.openings.filter(o=>o.wallId===wall.id).sort((oa,ob)=>oa.offset-ob.offset);if(!ops.length)addWSeg(a,an,0,wl,0,rH,wallMat);else{let pos=0;ops.forEach(op=>{const os=op.offset-op.width/2,oe=op.offset+op.width/2;if(os>pos)addWSeg(a,an,pos,os,0,rH,wallMat);if(op.type==='door'){addWSeg(a,an,os,oe,op.height,rH,wallMat);const frameMat=new THREE.MeshStandardMaterial({color:tc,roughness:.44,metalness:.04});scene.userData.styleTargets.trimMats.push(frameMat);addWSeg(a,an,os,os+.06,0,op.height,frameMat);addWSeg(a,an,oe-.06,oe,0,op.height,frameMat);addWSeg(a,an,os,oe,op.height-.06,op.height,frameMat);addDoorLeaf3D(a,an,os,oe,op,tc)}else{addWSeg(a,an,os,oe,0,op.sillHeight,wallMat);addWSeg(a,an,os,oe,op.sillHeight+op.height,rH,wallMat);const glassMat=new THREE.MeshStandardMaterial({color:0xBFD9EA,transparent:true,opacity:.42,roughness:.08,metalness:.18});addWSeg(a,an,os,oe,op.sillHeight,op.sillHeight+op.height,glassMat);const frameMat=new THREE.MeshStandardMaterial({color:tc,roughness:.48,metalness:.04});scene.userData.styleTargets.trimMats.push(frameMat);const ft=.08,mid=(os+oe)/2;addWSeg(a,an,os,os+ft,op.sillHeight,op.sillHeight+op.height,frameMat);addWSeg(a,an,oe-ft,oe,op.sillHeight,op.sillHeight+op.height,frameMat);addWSeg(a,an,os,oe,op.sillHeight,op.sillHeight+ft,frameMat);addWSeg(a,an,os,oe,op.sillHeight+op.height-ft,op.sillHeight+op.height,frameMat);addWSeg(a,an,mid-ft/2,mid+ft/2,op.sillHeight,op.sillHeight+op.height,frameMat);addWindowAssembly3D(a,an,os,oe,op,tc)}pos=oe});if(pos<wl)addWSeg(a,an,pos,wl,0,rH,wallMat)}const bbMat=new THREE.MeshStandardMaterial({color:tc,roughness:.28,metalness:.08});scene.userData.styleTargets.trimMats.push(bbMat);const bb=new THREE.Mesh(new THREE.PlaneGeometry(wl,.48),bbMat);bb.position.set((a.x+b.x)/2,.24,-(a.y+b.y)/2-.01);bb.rotation.y=-an;scene.add(bb)});
    r.structures.forEach(st=>{if(st.type==='closet'&&st.rect)scene.add(buildCloset3D(st,r));else if(st.type==='partition'&&st.line){const pa=st.line.a,pb=st.line.b,pl=Math.sqrt((pb.x-pa.x)**2+(pb.y-pa.y)**2),pAn=Math.atan2(pb.y-pa.y,pb.x-pa.x);const pm=new THREE.Mesh(new THREE.PlaneGeometry(pl,rH),new THREE.MeshStandardMaterial({color:wc,roughness:.65,side:THREE.DoubleSide}));pm.position.set((pa.x+pb.x)/2,rH/2,-(pa.y+pb.y)/2);pm.rotation.y=-pAn;scene.add(pm)}});
    r.furniture.forEach(f=>placeFurnitureInScene(f,r));
    applyRoomStyleToScene();
    attach3DPointerControls();updateWalkUI();
    (function anim(){raf3d=requestAnimationFrame(anim);if(!scene||!cam||!ren)return;updateCameraScript(performance.now());if(camMode==='orbit'){cYaw+=orbitVel.yaw;cPitch=Math.max(.12,Math.min(.9,cPitch+orbitVel.pitch));cDist=Math.max(7.5,Math.min(42,cDist+orbitVel.zoom));orbitVel.yaw*=.92;orbitVel.pitch*=.9;orbitVel.zoom*=.84;cam.position.set(orbitTarget.x+Math.sin(cYaw)*Math.cos(cPitch)*cDist,orbitTarget.y+Math.sin(cPitch)*cDist,orbitTarget.z+Math.cos(cYaw)*Math.cos(cPitch)*cDist);cam.lookAt(orbitTarget.x,orbitTarget.y,orbitTarget.z)}else{if(!cameraScript)applyWalkInputStep();fpPos.y=Math.max(4.9,Math.min(rH-1.15,rH*.54));cam.position.set(fpPos.x,fpPos.y,fpPos.z);cam.lookAt(fpPos.x+Math.sin(cYaw)*10,fpPos.y+cPitch*8,fpPos.z-Math.cos(cYaw)*10)}ren.render(scene,cam)})()
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
          <button class="cmb" style="width:52px;height:52px" onpointerdown="startWalkTurn(-1)" onpointerup="stopWalkTurn()" onpointerleave="stopWalkTurn()" onpointercancel="stopWalkTurn()"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--esp);fill:none;stroke-width:2"><polyline points="15 18 9 12 15 6"/></svg></button>
          <button class="cmb" style="width:52px;height:52px" onpointerdown="startWalkMove(1)" onpointerup="stopWalkMove()" onpointerleave="stopWalkMove()" onpointercancel="stopWalkMove()"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--esp);fill:none;stroke-width:2"><polyline points="18 15 12 9 6 15"/></svg></button>
          <button class="cmb" style="width:52px;height:52px" onpointerdown="startWalkTurn(1)" onpointerup="stopWalkTurn()" onpointerleave="stopWalkTurn()" onpointercancel="stopWalkTurn()"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--esp);fill:none;stroke-width:2"><polyline points="9 18 15 12 9 6"/></svg></button>
          <button class="cmb" style="width:52px;height:52px" onpointerdown="startWalkMove(-1)" onpointerup="stopWalkMove()" onpointerleave="stopWalkMove()" onpointercancel="stopWalkMove()"><svg viewBox="0 0 24 24" style="width:18px;height:18px;stroke:var(--esp);fill:none;stroke-width:2"><polyline points="18 9 12 15 6 9"/></svg></button>
        </div>
        <div style="pointer-events:auto;display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <div style="padding:10px 12px;border-radius:16px;background:rgba(250,247,242,.92);box-shadow:var(--shl);font-size:10px;font-weight:700;color:var(--rose-d);max-width:${isWide?'220px':'180px'};text-align:right">${isWide?'Landscape walkthrough mode':'Use the dock for movement and drag anywhere else to look around'}</div>
          <button class="mini-chip" style="pointer-events:auto" onclick="toggleWalkControlLayout()">${isWide?'Standard Dock':'Sideways Dock'}</button>
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
  const g=new THREE.PlaneGeometry(sw,sh);const m=new THREE.Mesh(g,mat);
  const mid=(s+e)/2;m.position.set(ws.x+Math.cos(an)*mid,(botY+topY)/2,-(ws.y+Math.sin(an)*mid));
  m.rotation.y=-an;scene.add(m)}
function addDoorLeaf3D(ws,an,os,oe,op,trimColor){
  const width=Math.max(.55,oe-os),doorW=Math.max(.45,width-.12),doorH=Math.max(2.1,(op.height||7)-.08);
  const hingeRight=op.hinge==='right',swingIn=op.swing!=='out';
  const hingeOffset=hingeRight?oe-.04:os+.04;
  const pivot=new THREE.Group();
  pivot.position.set(ws.x+Math.cos(an)*hingeOffset,.02,-(ws.y+Math.sin(an)*hingeOffset));
  pivot.rotation.y=-an;
  const angle=(swingIn?-1:1)*(hingeRight?1:-1)*Math.PI*.5;
  pivot.rotation.y+=angle;
  const doorMat=new THREE.MeshStandardMaterial({color:trimColor.clone().offsetHSL(.015,.08,-.05),roughness:.54,metalness:.04});
  const insetMat=new THREE.MeshStandardMaterial({color:trimColor.clone().offsetHSL(.01,.05,.08),roughness:.44,metalness:.03});
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
  const frameMat=new THREE.MeshStandardMaterial({color:trimColor.clone().offsetHSL(.01,.04,.03),roughness:.5,metalness:.03});
  const sillMat=new THREE.MeshStandardMaterial({color:trimColor.clone().offsetHSL(.02,.03,-.02),roughness:.58,metalness:.02});
  scene?.userData?.styleTargets?.trimMats?.push(frameMat,sillMat);
  const trimDepth=.06;
  const horizTop=new THREE.Mesh(new THREE.BoxGeometry(width+.04,.08,trimDepth));
  horizTop.material=frameMat; horizTop.position.set(cx,sill+height-.04,cz); scene.add(horizTop);
  const horizBottom=new THREE.Mesh(new THREE.BoxGeometry(width+.04,.08,trimDepth));
  horizBottom.material=frameMat; horizBottom.position.set(cx,sill+.04,cz); scene.add(horizBottom);
  const left=new THREE.Mesh(new THREE.BoxGeometry(.08,height,trimDepth));
  left.material=frameMat; left.position.set(ws.x+Math.cos(an)*(os+.04),sill+height/2,-(ws.y+Math.sin(an)*(os+.04))); scene.add(left);
  const right=new THREE.Mesh(new THREE.BoxGeometry(.08,height,trimDepth));
  right.material=frameMat; right.position.set(ws.x+Math.cos(an)*(oe-.04),sill+height/2,-(ws.y+Math.sin(an)*(oe-.04))); scene.add(right);
  const mullion=new THREE.Mesh(new THREE.BoxGeometry(.05,height-.18,trimDepth*.8));
  mullion.material=frameMat; mullion.position.set(cx,sill+height/2,cz); scene.add(mullion);
  const transom=new THREE.Mesh(new THREE.BoxGeometry(width-.14,.05,trimDepth*.8));
  transom.material=frameMat; transom.position.set(cx,sill+height/2,cz); scene.add(transom);
  const sillBoard=new THREE.Mesh(new THREE.BoxGeometry(width+.14,.06,.18),sillMat);
  sillBoard.position.set(cx,sill-.07,cz+.02); scene.add(sillBoard);
}

function buildFloorTexture(color,type){
  const preset=FLOOR_TYPES.find(f=>f.id===type)||FLOOR_TYPES[0];
  const can=document.createElement('canvas');can.width=768;can.height=768;const c=can.getContext('2d');
  const base=safeThreeColor(color,preset.color),accent=safeThreeColor(preset.accent,preset.color);
  const checkerMate=base.clone().lerp(base.clone().getHSL({h:0,s:0,l:0}).l>.52?safeThreeColor('#231D1A','#231D1A'):safeThreeColor('#FBF4EA','#FBF4EA'),.78);
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
  const trimMat=new THREE.MeshStandardMaterial({color:finish.trim,roughness:.45,metalness:.06});
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
        console.log(`[MODEL LOAD OK] ${assetKey} -> ${result.url}`);
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
function applyFurnitureFinishToModel(obj,f){
  if(!obj||!f||!f.finishColor)return;
  const tint=safeThreeColor(f.finishColor,'#D7C4B2');
  obj.traverse(child=>{
    if(!child.isMesh||!child.material)return;
    if(Array.isArray(child.material)){
      child.material=child.material.map(mat=>{
        const next=mat.clone();
        if(next.color)next.color.lerp(tint,.42);
        if(typeof next.needsUpdate!=='undefined')next.needsUpdate=true;
        return next;
      });
    }else{
      const next=child.material.clone();
      if(next.color)next.color.lerp(tint,.42);
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
  const baseColor=safeThreeColor(f.finishColor||(key==='bed'?'#EEE5D9':key==='bench'?'#A67C58':'#D7C4B2'),'#D7C4B2');
  if(key==='sofa_l'){
    const chaiseW=targetW*.48,chaiseD=targetD*.96,seatD=targetD*.5,seatH=Math.max(.44,targetH*.17),backH=Math.max(.92,targetH*.34),armW=Math.max(.2,targetW*.07);
    const mainBody=box3(targetW*.96,seatH,seatD,premiumMat(baseColor.clone().offsetHSL(0,.01,-.03),.78,.03));mainBody.position.set(0,seatH*.52,targetD*.22);g.add(mainBody);
    const chaise=box3(chaiseW,seatH,chaiseD,premiumMat(baseColor.clone().offsetHSL(0,.012,-.02),.8,.03));chaise.position.set(-targetW*.24,seatH*.52,0);g.add(chaise);
    const back=box3(targetW*.94,backH,targetD*.15,premiumMat(baseColor.clone().offsetHSL(0,.02,-.06),.82,.03));back.position.set(0,seatH+backH*.5,-targetD*.18);g.add(back);
    const sideBack=box3(targetW*.16,backH,chaiseD*.88,premiumMat(baseColor.clone().offsetHSL(0,.02,-.05),.82,.03));sideBack.position.set(-targetW*.4,seatH+backH*.5,0);g.add(sideBack);
    const armR=box3(armW,targetH*.36,seatD*.92,premiumMat(baseColor.clone().offsetHSL(0,.015,-.04),.8,.03));armR.position.set(targetW*.45-armW*.5,targetH*.18,targetD*.21);g.add(armR);
    const chaiseFront=box3(chaiseW*.92,seatH*.54,chaiseD*.62,premiumMat(baseColor.clone().offsetHSL(0,.025,.06),.92,.01));chaiseFront.position.set(-targetW*.23,seatH*.88,targetD*.02);g.add(chaiseFront);
    const mainSeat=box3(targetW*.56,seatH*.56,seatD*.62,premiumMat(baseColor.clone().offsetHSL(0,.025,.06),.92,.01));mainSeat.position.set(targetW*.14,seatH*.88,targetD*.21);g.add(mainSeat);
    const pillow1=box3(targetW*.26,backH*.42,targetD*.14,premiumMat(baseColor.clone().offsetHSL(0,.02,.12),.9,.01));pillow1.position.set(targetW*.16,seatH+backH*.45,-targetD*.04);g.add(pillow1);
    const pillow2=box3(targetW*.2,backH*.42,targetD*.14,premiumMat(baseColor.clone().offsetHSL(0,.02,.12),.9,.01));pillow2.position.set(-targetW*.16,seatH+backH*.45,-targetD*.04);g.add(pillow2);
    const legMat=premiumMat('#5A4A3E',.46,.16);
    [[targetW*.4,targetD*.4],[targetW*.4,0],[-targetW*.42,targetD*.4],[-targetW*.42,-targetD*.38],[0,-targetD*.38]].forEach(([x,z])=>{const leg=cy3(.045,Math.max(.18,targetH*.1),legMat);leg.position.set(x,.09,z);g.add(leg)});
  }else if(['sofa','sofa_small','sofa_compact','sofa_medium','sofa_large','sofa_modern','sofa_grand'].includes(key)){
    const seatH=Math.max(.44,targetH*.17),backH=Math.max(.92,targetH*.34),armW=Math.max(.2,targetW*.08);
    const body=box3(targetW*.96,seatH,targetD*.88,premiumMat(baseColor.clone().offsetHSL(0,.01,-.03),.78,.03));body.position.set(0,seatH*.52,0);g.add(body);
    const back=box3(targetW*.94,backH,targetD*.16,premiumMat(baseColor.clone().offsetHSL(0,.02,-.06),.82,.03));back.position.set(0,seatH+backH*.5,-targetD*.36);g.add(back);
    const armL=box3(armW,targetH*.36,targetD*.8,premiumMat(baseColor.clone().offsetHSL(0,.015,-.04),.8,.03));armL.position.set(-targetW*.47+armW*.5,targetH*.18,-targetD*.01);g.add(armL);
    const armR=armL.clone();armR.position.x*=-1;g.add(armR);
    const cushions=targetW>5.4?3:2,cushW=(targetW*.76)/cushions;
    for(let i=0;i<cushions;i++){
      const x=(-targetW*.38)+(i+.5)*cushW;
      const seat=box3(cushW*.92,seatH*.56,targetD*.54,premiumMat(baseColor.clone().offsetHSL(0,.025,.06),.92,.01));seat.position.set(x,seatH*.9,targetD*.03);g.add(seat);
      const pillow=box3(cushW*.82,backH*.42,targetD*.14,premiumMat(baseColor.clone().offsetHSL(0,.02,.12),.9,.01));pillow.position.set(x,seatH+backH*.45,-targetD*.22);g.add(pillow);
    }
    const legMat=premiumMat('#5A4A3E',.46,.16),lx=targetW*.41,lz=targetD*.31;
    [[-lx,lz],[lx,lz],[-lx,-lz],[lx,-lz]].forEach(([x,z])=>{const leg=cy3(.045,Math.max(.18,targetH*.1),legMat);leg.position.set(x,.09,z);g.add(leg)});
  }else if(['bed','bed_king','bed_twin'].includes(key)){
    const wood=premiumMat('#8A6A52',.56,.06);
    const head=box3(targetW*.98,Math.max(1.7,targetH*.62),targetD*.08,premiumMat('#C8B29E',.78,.03));head.position.set(0,targetH*.34,-targetD*.44);g.add(head);
    const foot=box3(targetW*.95,Math.max(.55,targetH*.2),targetD*.07,premiumMat('#BBA58F',.72,.03));foot.position.set(0,targetH*.11,targetD*.44);g.add(foot);
    const frame=box3(targetW*.98,Math.max(.24,targetH*.09),targetD*.96,wood);frame.position.set(0,.12,0);g.add(frame);
    const railL=box3(.08,Math.max(.42,targetH*.16),targetD*.88,wood);railL.position.set(-targetW*.45,.28,0);g.add(railL);
    const railR=railL.clone();railR.position.x*=-1;g.add(railR);
    const mattress=box3(targetW*.9,Math.max(.44,targetH*.17),targetD*.88,premiumMat('#F3EEE6',.96,0));mattress.position.set(0,.38,0);g.add(mattress);
    const duvet=box3(targetW*.86,Math.max(.28,targetH*.12),targetD*.52,premiumMat(baseColor.clone().offsetHSL(0,.02,.04),.95,0));duvet.position.set(0,.64,targetD*.09);g.add(duvet);
    const throwFold=box3(targetW*.84,Math.max(.08,targetH*.035),targetD*.18,premiumMat(baseColor.clone().offsetHSL(0,.025,-.06),.94,0));throwFold.position.set(0,.78,targetD*.23);g.add(throwFold);
    for(const x of [-targetW*.2,targetW*.2]){
      const pillow=box3(Math.max(.7,targetW*.22),Math.max(.16,targetH*.07),targetD*.18,premiumMat('#FBF8F4',.98,0));
      pillow.position.set(x,.72,-targetD*.18);g.add(pillow);
    }
  }else if(key==='bench'){
    const wood=premiumMat(baseColor.clone().offsetHSL(0,.01,-.02),.58,.05),dark=premiumMat('#3F3A36',.42,.22);
    const seat=box3(targetW*.96,Math.max(.14,targetH*.12),targetD*.42,wood);seat.position.set(0,Math.max(.52,targetH*.42),0);g.add(seat);
    for(const x of [-targetW*.26,0,targetW*.26]){
      const slat=box3(targetW*.26,Math.max(.03,targetH*.02),targetD*.44,premiumMat(baseColor.clone().offsetHSL(0,.015,.06),.56,.04));
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
function getWallFacingAdjustment(reg,placement){
  if(!reg||reg.wallFacingMode==='free'||!placement?.wallNormal)return 0;
  const inwardYaw=Math.atan2(placement.wallNormal.x,placement.wallNormal.z);
  if(reg.wallFacingMode==='face_interior')return inwardYaw;
  if(reg.wallFacingMode==='face_exterior')return inwardYaw+Math.PI;
  if(reg.wallFacingMode==='follow_wall')return placement.wallAngleYaw||0;
  return inwardYaw;
}
function computeFurnitureYaw(f,reg,placement){
  const appRotation=-(Number.isFinite(f.rotation)?f.rotation:0)*Math.PI/180;
  const yawOffset=(reg?.yawOffset||0)+axisYawOffset(reg?.forwardAxis);
  const wallAdjust=getWallFacingAdjustment(reg,placement);
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
    const nearest=windowTarget?{wall:windowTarget.wall,offset:windowTarget.opening.offset,length:wL(r,windowTarget.wall)}:findNearestWallForPoint({x:f.x,y:f.z},r);
    const wall=nearest.wall,a=wS(r,wall),an=wA(r,wall),n=getInteriorWallNormal(r,wall),along=Math.max(.4,Math.min(nearest.length-.4,nearest.offset||nearest.length/2));
    let mountY=f.elevation||defaultElevation('wall',f.assetKey,resolveLabel(f.label));
    if(windowTarget&&f.assetKey==='curtains')mountY=(windowTarget.opening.sillHeight||3)+(windowTarget.opening.height||4)+.35;
    if(windowTarget&&f.assetKey==='blinds')mountY=(windowTarget.opening.sillHeight||3)+(windowTarget.opening.height||4)-.06;
    const base=new THREE.Vector3(a.x+Math.cos(an)*along,mountY,-(a.y+Math.sin(an)*along));
    const depth=(reg&&reg.snapToOpening)?0.03:Math.min(.1,(f.d||.4)/2);
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
  const renderState=getFurnitureRenderState(f,r);
  anchor.position.copy(placement.position);anchor.rotation.y=placement.rotationY;anchor.visible=renderState.visible;anchor.userData.furnitureId=f.id;anchor.userData.assetKey=f.assetKey;scene.add(anchor);
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
    console.log(`[ROOM MODEL LOAD OK] ${f.assetKey} -> ${model.userData.__sourceUrl||reg.file}`);
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
  const map={rug:{w:3.8,d:2.8,h:.2},runner_rug:{w:6.5,d:2,h:.2},rug_round:{w:4.2,d:4.2,h:.2},curtains:{w:3.8,d:.3,h:4},blinds:{w:3.5,d:.2,h:2.7},wall_art_01:{w:2.2,d:.2,h:1.4},wall_art_04:{w:2.2,d:.2,h:1.4},wall_art_06:{w:2.2,d:.2,h:1.4},mirror:{w:1.8,d:.2,h:2.6},lamp_wall:{w:1.4,d:.4,h:2.2},lamp_table:{w:1.1,d:1.1,h:1.45},lamp_chandelier:{w:2,d:2,h:1.65},lamp_ceiling:{w:1.6,d:1.6,h:1.2},lamp_cube:{w:1.35,d:1.35,h:1.35},lamp_pendant:{w:1.6,d:1.6,h:1.9},lamp_stand:{w:1,d:1,h:4.2},shelving:{w:2.8,d:.6,h:2.1},shelf_small:{w:2.1,d:.45,h:1.2},plant_small:{w:1.1,d:1.1,h:1.6},plant_cactus:{w:1,d:1,h:1.8},plant_leafy:{w:1.4,d:1.4,h:2.1},plant_palm:{w:1.6,d:1.6,h:2.8},plant_round:{w:1.25,d:1.25,h:1.7},chair_office:{w:2,d:2,h:3},nightstand:{w:1.8,d:1.5,h:2.2},nightstand_alt:{w:1.8,d:1.55,h:2.25},dresser:{w:3.8,d:1.8,h:3.2},dresser_tall:{w:3.3,d:1.7,h:4.1},console_low:{w:4.6,d:1.35,h:2.4},tv_console:{w:4.8,d:1.5,h:2.8},dining_table:{w:5.2,d:3,h:2.8},table_round_large:{w:4.2,d:4.2,h:2.8},table_round_small:{w:2.4,d:2.4,h:2.2},stool:{w:1.4,d:1.4,h:1.9},bench:{w:3.6,d:1.4,h:2.2},sofa_small:{w:3.4,d:2.05,h:2.8},sofa_compact:{w:3.6,d:2.1,h:3},sofa_medium:{w:4.4,d:2.35,h:3.05},sofa_large:{w:5.8,d:2.6,h:3.1},sofa_modern:{w:5.2,d:2.55,h:3.05},sofa_grand:{w:6.4,d:2.8,h:3.2},bed_king:{w:6.4,d:7.4,h:2.7},bed_twin:{w:3.6,d:6.6,h:2.5},bunk_bed:{w:4.4,d:6.8,h:5.8},bookcase_books:{w:3.1,d:1.1,h:4.8},closet_tall:{w:3.4,d:1.8,h:6.2},closet_short:{w:3.1,d:1.7,h:4.2},fireplace:{w:4.2,d:1.3,h:3.6}};
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
  const sc = new THREE.Color('#C9B99A');

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
  scene=null;cam=null}

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
