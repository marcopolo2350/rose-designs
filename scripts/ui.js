// ── WELCOME ──
async function checkWelcome(){
  const w=document.getElementById('welcome');
  if(!w)return;
  const greet=document.querySelector('.w-greeting');
  const personal=document.querySelector('.w-personal');
  if(greet)greet.textContent=`Hi ${window.APP_CONFIG?.branding?.welcomeName||'Rose'}`;
  if(personal)personal.textContent=window.APP_CONFIG?.branding?.welcomeLine||'Ready when you are';
  w.classList.remove('fade','gone');
}
function dismissWelcome(){
  const w=document.getElementById('welcome');
  w.classList.add('fade');
  setTimeout(()=>w.classList.add('gone'),800);
  ds('welcomed',true);
}

function handleUiAction(action,target,event){
  if(!action)return;
  if(target?.dataset?.stopPropagation==='true')event?.stopPropagation();
  if(target?.dataset?.preventDefault==='true')event?.preventDefault();
  if(action==='dismiss-welcome')return dismissWelcome();
  if(action==='choose-profile')return chooseProfile(target?.dataset?.profile||'rose');
  if(action==='open-profile-switcher')return openProfileSwitcher();
  if(action==='start-tutorial')return startTut(target?.dataset?.force==='true');
  if(action==='open-create-room')return openCrModal(target?.dataset?.roomType||'');
  if(action==='open-create-room-brief')return openCrModalWithBrief(target?.dataset?.roomType||'',target?.dataset?.brief||'');
  if(action==='open-last-project')return openLastProject();
  if(action==='open-project')return openPrj(target?.dataset?.projectId||'');
  if(action==='hide-room-runtime-diagnostics')return document.getElementById('roomRuntimeDiag')?.classList.remove('on');
  if(action==='favorite-project')return toggleFavoriteProject(target?.dataset?.projectId||'');
  if(action==='duplicate-project-card')return dupPrj(target?.dataset?.projectId||'');
  if(action==='delete-project-card')return showDeleteConfirm(target?.dataset?.projectId||'');
  if(action==='close-delete-confirm')return closeDeleteConfirm();
  if(action==='confirm-delete')return confirmDelete();
  if(action==='exit-editor')return exitEd();
  if(action==='undo')return doUndo();
  if(action==='redo')return doRedo();
  if(action==='set-tool')return setTool(target?.dataset?.tool||target?.dataset?.t||'select');
  if(action==='toggle-measurements')return toggleMeasurements();
  if(action==='toggle-3d')return toggle3D();
  if(action==='save-project')return savePrj();
  if(action==='toggle-editor-more')return toggleEditorMore();
  if(action==='editor-more'){
    const fn=window[target?.dataset?.fn];
    if(typeof fn==='function')fn();
    return closeEditorMore();
  }
  if(action==='open-panel')return openP();
  if(action==='toggle-snap')return togSnap();
  if(action==='close-room')return closeRoom();
  if(action==='set-time-of-day')return setTimeOfDay(Number(target?.dataset?.timeOfDay||50));
  if(action==='set-cam-mode')return setCamMode(target?.dataset?.camMode||'orbit');
  if(action==='set-view-preset')return setViewPreset(target?.dataset?.viewPreset||'overview');
  if(action==='toggle-walkthrough-tray')return toggleWalkthroughTray();
  if(action==='start-walkthrough-preset')return startWalkthroughPreset(target?.dataset?.presetId||'favorite_corner');
  if(action==='toggle-presentation-mode')return togglePresentationMode();
  if(action==='set-presentation-shot')return setPresentationShot(target?.dataset?.shot||'hero');
  if(action==='capture-presentation-still')return capturePresentationStill();
  if(action==='toggle-photo-mode'){
    const forced=target?.dataset?.photoForce;
    return forced===undefined?togglePhotoMode():togglePhotoMode(forced==='true');
  }
  if(action==='set-photo-preset')return setPhotoPreset(target?.dataset?.photoPreset||'hero');
  if(action==='capture-photo-mode')return capturePhotoMode();
  if(action==='toggle-walk-control-layout')return toggleWalkControlLayout();
  if(action==='toggle-3d-compare-mode')return toggle3DCompareMode();
  if(action==='export-png')return exportPNG();
  if(action==='room-runtime-action'){
    const fn=window[target?.dataset?.fn];
    if(typeof fn==='function')return fn();
    return;
  }
  if(action==='set-create-room-layout')return setCreateRoomLayoutMode(target?.dataset?.layoutMode||'empty');
  if(action==='select-create-room-preset')return selPre(target?.dataset?.presetId||'',target);
  if(action==='create-room-from-preset')return createFromPreset();
  if(action==='jump-undo-step')return jumpUndoStep(Number(target?.dataset?.step||0));
  if(action==='start-free-draw')return startFreeDraw();
  if(action==='cancel-reference-calibration')return cancelReferenceCalibrationModal();
  if(action==='submit-reference-calibration')return submitReferenceCalibration();
  if(action==='toggle-preflight-panel')return togglePreflightPanel();
  if(action==='open-asset-verification')return openAssetVerification();
  if(action==='cycle-verification-assets')return cycleVerificationAssets();
  if(action==='refresh-asset-verification')return refreshAssetVerification();
  if(action==='close-asset-verification')return closeAssetVerification();
  if(action==='catalog-overlay-close'){
    if(event?.target===target)return closeFurnPick();
    return;
  }
  if(action==='catalog-close')return closeFurnPick();
  if(action==='catalog-select-collection')return setCatalogCollection(target?.dataset?.collection||'all');
  if(action==='catalog-select-category')return setCatalogCategory(target?.dataset?.category||'all');
  if(action==='catalog-choose-or-place')return chooseOrPlaceFurn(Number(target?.dataset?.itemIndex));
  if(action==='catalog-toggle-favorite'){
    event?.preventDefault();
    event?.stopPropagation();
    return toggleFavoriteCatalogItem(target?.dataset?.assetKey||'');
  }
  if(action==='catalog-place-pending')return confirmPendingFurniturePlacement();
  if(action==='catalog-variant'){
    event?.preventDefault();
    if(target?.dataset?.stopPropagation==='true')event?.stopPropagation();
    const assetKey=target?.dataset?.assetKey||'';
    const variantId=target?.dataset?.variantId||'';
    const handler=target?.dataset?.variantHandler||'';
    if(handler==='setCatalogVariant')return setCatalogVariant(assetKey,variantId);
    if(handler==='setSelectedFurnitureVariant')return setSelectedFurnitureVariant(assetKey,variantId);
    return;
  }
  if(action==='prop-close')return closeP();
  if(action==='room-panel-group')return setRoomPanelGroup(target?.dataset?.group||'build');
  if(action==='open-project-room')return openProjectRoom(target?.dataset?.roomId||'');
  if(action==='duplicate-project-room')return duplicateProjectRoom(target?.dataset?.roomId||'');
  if(action==='delete-project-room')return deleteProjectRoom(target?.dataset?.roomId||'');
  if(action==='set-active-floor')return setActiveFloor(target?.dataset?.floorId||'floor_1');
  if(action==='open-add-room-modal-for-project')return openAddRoomModalForProject(target?.dataset?.floorId||'floor_1');
  if(action==='move-project-room-to-floor')return moveProjectRoomToFloor(target?.dataset?.roomId||'',target?.dataset?.floorId||'floor_1');
  if(action==='move-current-room-to-floor')return moveCurrentRoomToFloor(target?.dataset?.floorId||'floor_1');
  if(action==='create-next-floor')return createNextFloor();
  if(action==='duplicate-current-room')return duplicateCurrentRoom();
  if(action==='move-current-room-order')return moveCurrentRoomOrder(Number(target?.dataset?.direction||0));
  if(action==='delete-current-room')return deleteCurrentRoom();
  if(action==='attach-adjacent-room')return attachAdjacentRoom(target?.dataset?.side||'east');
  if(action==='set-wall-finish')return setWallFinish(target?.dataset?.finishId||'warm_white');
  if(action==='reset-wall-color-to-style')return resetWallColorToStyle();
  if(action==='set-wall-paint')return setWallPaint(target?.dataset?.color||'');
  if(action==='set-floor-type')return setFloorType(target?.dataset?.floorType||'light_oak');
  if(action==='reset-floor-color-to-style')return resetFloorColorToStyle();
  if(action==='set-floor-paint')return setFloorPaint(target?.dataset?.color||'');
  if(action==='set-trim-color')return setTrimColor(target?.dataset?.color||'');
  if(action==='set-lighting-preset')return setLightingPreset(target?.dataset?.presetId||'daylight');
  if(action==='set-room-type')return setRoomType(target?.dataset?.roomType||'living_room');
  if(action==='toggle-design-preset-panel')return toggleDesignPresetPanel();
  if(action==='select-pending-design-preset')return selectPendingDesignPreset(target?.dataset?.presetId||'');
  if(action==='apply-pending-design-preset')return applyPendingDesignPreset();
  if(action==='import-reference-asset')return importReferenceAsset();
  if(action==='toggle-reference-visibility')return toggleReferenceVisibility();
  if(action==='toggle-reference-lock')return toggleReferenceLock();
  if(action==='set-reference-pdf-page')return setReferencePdfPage(Number(target?.dataset?.page||1));
  if(action==='start-reference-calibration')return startReferenceCalibration();
  if(action==='cancel-reference-overlay-calibration')return cancelReferenceCalibration();
  if(action==='clear-reference-overlay')return clearReferenceOverlay();
  if(action==='toggle-existing-room-mode')return toggleExistingRoomMode();
  if(action==='toggle-ghost-existing')return toggleGhostExisting();
  if(action==='toggle-hide-removed-existing')return toggleHideRemovedExisting();
  if(action==='toggle-plan-legend')return togglePlanLegend();
  if(action==='set-plan-view-mode')return setPlanViewMode(target?.dataset?.mode||'combined');
  if(action==='set-selected-furniture-source')return setSelectedFurnitureSource(target?.dataset?.source||'new');
  if(action==='duplicate-for-redesign')return duplicateForRedesign();
  if(action==='toggle-furniture-snap')return toggleFurnitureSnap();
  if(action==='toggle-multi-select')return toggleMultiSelectMode();
  if(action==='toggle-unit-system')return toggleUnitSystem();
  if(action==='paste-furniture')return pasteFurniture();
  if(action==='copy-selected-furniture')return copySelectedFurniture();
  if(action==='duplicate-selected-furniture')return duplicateSelectedFurniture();
  if(action==='rotate-selected-furniture')return rotateSelectedFurniture(Number(target?.dataset?.delta||0));
  if(action==='turn-around-selected-furniture')return turnAroundSelectedFurniture();
  if(action==='toggle-selected-furniture-lock')return toggleSelectedFurnitureLock();
  if(action==='set-selected-redesign-action')return setSelectedRedesignAction(target?.dataset?.redesignAction||'keep');
  if(action==='pair-selected-replacement')return pairSelectedReplacement();
  if(action==='clear-selected-replacement-pair')return clearSelectedReplacementPair();
  if(action==='set-furniture-finish')return setFurnitureFinish(target?.dataset?.color||'');
  if(action==='delete-selected-furniture')return dF();
  if(action==='delete-selected-vertex')return dV();
  if(action==='delete-selected-opening')return dO();
  if(action==='delete-selected-structure')return dS();
  if(action==='delete-selected-annotation')return dA();
  if(action==='delete-selected-dimension-annotation')return dDA();
  if(action==='export-comparison-sheet')return exportComparisonSheet();
  if(action==='toggle-room-layer')return toggleRoomLayer(target?.dataset?.layer||'furniture');
  if(action==='create-room-option-from-current')return createRoomOptionFromCurrent();
  if(action==='export-design-summary')return exportDesignSummary();
  if(action==='export-presentation-pdf')return exportPresentationPDF();
  if(action==='switch-to-option')return switchToOption(target?.dataset?.optionId||'');
  if(action==='tutorial-next')return nextTut();
  if(action==='tutorial-end')return endTut();
  if(action==='close-shortcut-sheet')return closeShortcutSheet();
}

function bindStaticUiActions(){
  if(document.body?.dataset?.uiActionsBound==='1')return;
  document.body.dataset.uiActionsBound='1';
  document.getElementById('crMod')?.addEventListener('click',event=>{
    if(event.target===event.currentTarget)closeCr();
  });
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-action]');
    if(!target)return;
    handleUiAction(target.dataset.action,target,event);
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const target=event.target.closest('[role="button"][data-action]');
    if(!target)return;
    event.preventDefault();
    handleUiAction(target.dataset.action,target,event);
  });
  document.addEventListener('pointerdown',event=>{
    const target=event.target.closest('[data-hold-action]');
    if(!target)return;
    const dir=Number(target.dataset.direction||0);
    if(target.dataset.holdAction==='walk-turn')startWalkTurn(dir);
    if(target.dataset.holdAction==='walk-move')startWalkMove(dir);
  });
  for(const type of ['pointerup','pointerleave','pointercancel']){
    document.addEventListener(type,event=>{
      const target=event.target.closest('[data-hold-action]');
      if(!target)return;
      if(target.dataset.holdAction==='walk-turn')stopWalkTurn();
      if(target.dataset.holdAction==='walk-move')stopWalkMove();
    });
  }
  document.addEventListener('change',event=>{
    const target=event.target;
    if(target?.dataset?.action==='handle-project-json-selected')handleProjectJSONSelected(event);
    if(target?.dataset?.action==='rename-current-project')renameCurrentProject(target.value);
    if(target?.dataset?.action==='rename-current-room')renameCurrentRoom(target.value);
    if(target?.dataset?.action==='set-adj-room-width')setAdjRoomWidth(target.value);
    if(target?.dataset?.action==='set-adj-room-depth')setAdjRoomDepth(target.value);
    if(target?.dataset?.action==='set-wall-paint-input')setWallPaint(target.value);
    if(target?.dataset?.action==='set-floor-paint-input')setFloorPaint(target.value);
    if(target?.dataset?.action==='set-trim-color-input')setTrimColor(target.value);
    if(target?.dataset?.action==='set-light-character-input')setLightCharacter(target.value);
    if(target?.dataset?.action==='set-ceiling-brightness-input')setCeilingBrightness(target.value);
    if(target?.dataset?.action==='set-room-height-input')uRoomHeight(target.value);
    if(target?.dataset?.action==='set-reference-center-axis')setReferenceCenterAxis(target.dataset.axis,target.value);
    if(target?.dataset?.action==='rename-current-option')renameCurrentOption(target.value);
    if(target?.dataset?.action==='set-current-option-notes')setCurrentOptionNotes(target.value);
    if(target?.dataset?.action==='update-selected-furniture')uF(target.dataset.field,target.value);
    if(target?.dataset?.action==='update-selected-vertex')uV(target.dataset.field,target.value);
    if(target?.dataset?.action==='update-selected-opening')uO(target.dataset.field,target.value);
    if(target?.dataset?.action==='update-selected-structure')uS(target.dataset.field,target.value);
    if(target?.dataset?.action==='update-selected-annotation')uA(target.dataset.field,target.value);
    if(target?.dataset?.action==='update-selected-dimension-annotation')uDA(target.dataset.field,target.value);
  });
  document.addEventListener('input',event=>{
    const target=event.target;
    if(target?.dataset?.action==='time-of-day-input')onTimeOfDayChange(target.value);
    if(target?.dataset?.action==='catalog-search')filterFurnPicker(target.value);
    if(target?.dataset?.action==='set-reference-opacity')setReferenceOpacity(target.value);
    if(target?.dataset?.action==='set-reference-scale')setReferenceScale(target.value);
  });
  document.addEventListener('pointerover',event=>{
    const target=event.target.closest('[data-preview-index]');
    if(!target)return;
    const idx=Number(target.dataset.previewIndex);
    if(Number.isFinite(idx)&&typeof FURN_ITEMS!=='undefined'&&typeof setPendingFurniturePreview==='function'){
      setPendingFurniturePreview(FURN_ITEMS[idx],idx);
    }
  });
  document.addEventListener('focusin',event=>{
    const target=event.target.closest('[data-preview-index]');
    if(!target)return;
    const idx=Number(target.dataset.previewIndex);
    if(Number.isFinite(idx)&&typeof FURN_ITEMS!=='undefined'&&typeof setPendingFurniturePreview==='function'){
      setPendingFurniturePreview(FURN_ITEMS[idx],idx);
    }
  });
}

// ── TUTORIAL ──
async function chooseProfile(profileId,{skipReload=false}={}){
  activeProfile=PROFILE_LABELS[profileId]?profileId:'rose';
  try{
    localStorage.setItem(PROFILE_LOCAL_KEY,activeProfile);
  }catch(e){
    window.reportRoseError?.('profile-select-save',e,{profileId:activeProfile});
  }
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
}
let tutS=-1;
const TUTS=[
  {t:'Start with one room',d:'Begin with a simple room card. You can reshape it later or grow the footprint with the Up, Right, Down, and Left room buttons.'},
  {t:'Shape the shell first',d:'Use Draw or Vertex to reshape the footprint. Doors and windows snap to walls, so build the shell before styling.'},
  {t:'Keep the panel collapsed while placing',d:'On phone, reopen the panel only when you need details. The floating panel chip lets you place or move pieces without the sheet covering the room.'},
  {t:'Furnish with tap, then place',d:'Choose Furnish, pick an item, then tap the exact spot where it belongs. This is the fastest way to work on iPhone.'},
  {t:'Use Existing Room mode for redesigns',d:'Mark real pieces as Existing, then tag them Keep, Move, Replace, or Remove so the redesign stays organized.'},
  {t:'Walk in 3D with the touch controls',d:'Switch to Walk, use the new move and turn controls, and drag to look around. Landscape is the easiest way to explore.'},
  {t:'Save options instead of overwriting',d:'Use room Options to make Option A, B, and C. Each one keeps its own notes, compare views, and exports.'},
  {t:'This device remembers your work',d:'Rose Designs keeps your rooms, notes, and saved preferences on this device so you can jump back in fast.'},
];
function startTut(force=false){if(!force&&getLocal(profileSeenKey()))return;tutS=0;showTut()}
function showTut(){
  if(tutS<0||tutS>=TUTS.length){endTut();return}
  const s=TUTS[tutS];
  const overlay=document.getElementById('tutOv');
  const card=document.getElementById('tutCard');
  if(!overlay||!card)return;
  overlay.classList.add('on');
  window.RoseHTML.clear(card);

  const title=document.createElement('h4');
  title.textContent=s.t;
  card.appendChild(title);

  const copy=document.createElement('p');
  copy.textContent=s.d;
  card.appendChild(copy);

  const actions=document.createElement('div');
  actions.className='tut-actions';
  const next=document.createElement('button');
  next.type='button';
  next.dataset.action=tutS>=TUTS.length-1?'tutorial-end':'tutorial-next';
  next.textContent=tutS>=TUTS.length-1?"Let's go!":'Next';
  actions.appendChild(next);
  const skip=document.createElement('button');
  skip.type='button';
  skip.className='tut-skip';
  skip.dataset.action='tutorial-end';
  skip.textContent='Skip tutorial';
  actions.appendChild(skip);
  card.appendChild(actions);

  const dots=document.createElement('div');
  dots.className='tut-dots';
  TUTS.forEach((_,i)=>{
    const dot=document.createElement('div');
    dot.className=`tut-d${i===tutS?' on':''}`;
    dots.appendChild(dot);
  });
  card.appendChild(dots);
}
function nextTut(){tutS++;showTut()}
function endTut(){tutS=-1;document.getElementById('tutOv').classList.remove('on');setLocal(profileSeenKey(),'1')}

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
function normalizeProjectRoomOrders(projectOrRoom=curRoom){
  const projectId=typeof projectOrRoom==='string'?projectOrRoom:(projectOrRoom?.projectId||projectOrRoom?.id);
  if(!projectId)return;
  projectFloors(projectId).forEach(floor=>{
    currentFloorRooms(projectId,floor.id)
      .sort((a,b)=>(a.roomOrder-b.roomOrder)||String(a.name||'').localeCompare(String(b.name||'')))
      .forEach((room,index)=>{
        optionSiblings(room).forEach(option=>{ option.roomOrder=index; });
      });
  });
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
let createRoomLayoutMode='empty';
function loadCreateRoomLayoutMode(){
  const saved=getLocal?.('create_room_layout_mode',{global:true});
  createRoomLayoutMode=saved==='starter'?'starter':'empty';
}
function syncCreateRoomLayoutModeUI(){
  const emptyBtn=document.getElementById('crLayoutEmpty');
  const starterBtn=document.getElementById('crLayoutStarter');
  const hint=document.getElementById('crLayoutHint');
  if(emptyBtn)emptyBtn.classList.toggle('sel',createRoomLayoutMode==='empty');
  if(starterBtn)starterBtn.classList.toggle('sel',createRoomLayoutMode==='starter');
  if(hint)hint.textContent=createRoomLayoutMode==='starter'
    ? 'Suggested furniture will be staged for this room type.'
    : 'The room will open blank so you can place everything intentionally.';
}
function setCreateRoomLayoutMode(mode='empty'){
  createRoomLayoutMode=mode==='starter'?'starter':'empty';
  setLocal?.('create_room_layout_mode',createRoomLayoutMode,{global:true});
  syncCreateRoomLayoutModeUI();
}

// ── EDITOR MORE MENU ──
function toggleEditorMore(){
  const menu=document.getElementById('edMoreMenu');
  if(menu)menu.classList.toggle('on');
}
function closeEditorMore(){
  const menu=document.getElementById('edMoreMenu');
  if(menu)menu.classList.remove('on');
}
// Close more menu when clicking outside
document.addEventListener('pointerdown',function(e){
  const menu=document.getElementById('edMoreMenu');
  const btn=document.getElementById('edMoreBtn');
  if(menu&&menu.classList.contains('on')&&!menu.contains(e.target)&&!btn?.contains(e.target)){
    menu.classList.remove('on');
  }
});
function openLastProject(){
  const sorted=[...projects].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  if(sorted.length)openEd(sorted[0]);
}

// ── HOME ──
const PROJECT_CARD_SVG_NS='http://www.w3.org/2000/svg';
function createProjectSvg(attrs={}){
  const svg=document.createElementNS(PROJECT_CARD_SVG_NS,'svg');
  Object.entries(attrs).forEach(([key,value])=>svg.setAttribute(key,String(value)));
  svg.setAttribute('aria-hidden','true');
  svg.setAttribute('focusable','false');
  return svg;
}
function appendProjectSvgShape(svg,tag,attrs={}){
  const shape=document.createElementNS(PROJECT_CARD_SVG_NS,tag);
  Object.entries(attrs).forEach(([key,value])=>shape.setAttribute(key,String(value)));
  svg.appendChild(shape);
  return shape;
}
function createProjectIcon(type){
  const svg=createProjectSvg({viewBox:'0 0 24 24'});
  if(type==='favorite'){
    appendProjectSvgShape(svg,'path',{d:'M12 17.3 5.8 21l1.7-7-5.5-4.8 7.2-.6L12 2l2.8 6.6 7.2.6-5.5 4.8 1.7 7z'});
  }else if(type==='duplicate'){
    appendProjectSvgShape(svg,'rect',{x:'9',y:'9',width:'13',height:'13',rx:'2'});
    appendProjectSvgShape(svg,'path',{d:'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'});
  }else if(type==='delete'){
    appendProjectSvgShape(svg,'polyline',{points:'3 6 5 6 21 6'});
    appendProjectSvgShape(svg,'path',{d:'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'});
  }else{
    svg.setAttribute('fill','none');
    svg.setAttribute('stroke','rgba(0,0,0,.22)');
    svg.setAttribute('stroke-width','1.5');
    appendProjectSvgShape(svg,'path',{d:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'});
  }
  return svg;
}
function createProjectActionButton(action,projectId,title,iconType){
  const button=document.createElement('button');
  button.className='pab';
  button.type='button';
  button.dataset.action=action;
  button.dataset.projectId=projectId;
  button.dataset.stopPropagation='true';
  button.dataset.preventDefault='true';
  button.title=title;
  button.setAttribute('aria-label',title);
  button.appendChild(createProjectIcon(iconType));
  return button;
}
function appendProjectChip(container,label){
  if(!label)return;
  const chip=document.createElement('span');
  chip.className='chip';
  chip.textContent=label;
  container.appendChild(chip);
}
function renderProjectEmptyState(list){
  window.RoseHTML.clear(list);
  const empty=document.createElement('div');
  empty.className='emp';
  const icon=document.createElement('div');
  icon.className='ei';
  icon.textContent='+';
  empty.appendChild(icon);
  const title=document.createElement('h3');
  title.textContent='No projects yet';
  empty.appendChild(title);
  const copy=document.createElement('p');
  copy.textContent='Create your first room to start designing.';
  empty.appendChild(copy);
  list.appendChild(empty);
}
function createProjectPreview(project,wall,floor,trim){
  const preview=document.createElement('div');
  preview.className='pci';
  if(project.previewThumb){
    preview.classList.add('pci-thumb');
    const img=document.createElement('img');
    img.className='pci-thumb-img';
    img.alt='';
    img.src=project.previewThumb;
    preview.appendChild(img);
    return preview;
  }
  if(project.polygon?.length){
    preview.classList.add('pci-material');
    preview.style.background=`linear-gradient(145deg,${wall} 0%,${wall} 44%,${floor} 44%,${floor} 100%)`;
    preview.style.border=`2px solid ${typeof trim==='string'?trim:'rgba(0,0,0,.08)'}`;
    preview.appendChild(createProjectIcon('home'));
    return preview;
  }
  preview.textContent=project.favorite?'\u2728':'\u{1F3E0}';
  return preview;
}
function createProjectCard(project){
  const projectId=project.projectId||project.id;
  const type=(ROOM_TYPES.find(t=>t.id===(project.roomType||'living_room'))||ROOM_TYPES[0]).name;
  const moodLabel=project.mood&&MOOD_CONFIG[project.mood]?(project.mood.charAt(0).toUpperCase()+project.mood.slice(1)):null;
  const presetLabel=project.designPreset?(DESIGN_PRESETS.find(d=>d.id===project.designPreset)?.name||'Styled'):null;
  const primaryChip=moodLabel||presetLabel||'In Progress';
  const edited=new Date(project.updatedAt||project.createdAt||Date.now()).toLocaleDateString(undefined,{month:'short',day:'numeric'});
  const roomCount=projectMainRooms(project).length;
  const floorCount=projectFloors(project).length;
  if(!project.previewThumb&&project.polygon?.length)updateRoomPreviewThumb(project);
  const wall=project.materials?.wall||'#F3EFE7';
  const floor=project.materials?.floor||'#d0b18d';
  const trim=project.materials?.trim||'rgba(0,0,0,.08)';

  const card=document.createElement('div');
  card.className='pc';
  card.setAttribute('role','button');
  card.tabIndex=0;
  card.dataset.action='open-project';
  card.dataset.projectId=projectId;
  card.appendChild(createProjectPreview(project,wall,floor,trim));

  const body=document.createElement('div');
  body.className='pcf';
  const title=document.createElement('h3');
  title.textContent=project.projectName||project.name||'Untitled Project';
  body.appendChild(title);
  const meta=document.createElement('p');
  meta.textContent=`${roomCount} room${roomCount===1?'':'s'} \u00b7 ${floorCount} floor${floorCount===1?'':'s'} \u00b7 ${edited}`;
  body.appendChild(meta);
  const chips=document.createElement('div');
  chips.className='pcmeta';
  appendProjectChip(chips,primaryChip);
  appendProjectChip(chips,type);
  if(project.optionName&&project.optionName!=='Main')appendProjectChip(chips,project.optionName);
  const siblings=optionSiblings(project);
  if(siblings.length>1)appendProjectChip(chips,`${siblings.length} options`);
  body.appendChild(chips);
  card.appendChild(body);

  const actions=document.createElement('div');
  actions.className='pca';
  actions.appendChild(createProjectActionButton('favorite-project',projectId,'Favorite','favorite'));
  actions.appendChild(createProjectActionButton('duplicate-project-card',projectId,'Duplicate','duplicate'));
  actions.appendChild(createProjectActionButton('delete-project-card',projectId,'Delete','delete'));
  card.appendChild(actions);
  return card;
}
function renderHome(){
  updateProfileChip();
  // Show/hide continue button
  const continueBtn=document.getElementById('continueBtn');
  if(continueBtn){
    continueBtn.classList.toggle('is-hidden',!projects.length);
  }
  const l=document.getElementById('prjList');
  if(!l)return;
  window.RoseHTML.clear(l);
  if(!projects.length){renderProjectEmptyState(l);return}
  const grouped=[...new Map(projects.map(room=>[(room.projectId||room.id),projectPrimaryRoom(room)])).values()].filter(Boolean).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  grouped.forEach(project=>l.appendChild(createProjectCard(project)));
}
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
// Custom delete confirmation modal (replaces browser confirm)
let pendingDeleteId=null;
let deleteConfirmRestoreFocus=null;
function handleDeleteConfirmKeydown(event){
  const overlay=document.getElementById('delConfirm');
  if(!overlay)return;
  if(event.key==='Escape'){
    event.preventDefault();
    event.stopPropagation();
    closeDeleteConfirm();
    return;
  }
  if(event.key!=='Tab')return;
  const focusable=[...overlay.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter(node=>!node.disabled&&node.offsetParent!==null);
  if(!focusable.length){
    event.preventDefault();
    return;
  }
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){
    event.preventDefault();
    last.focus();
  }else if(!event.shiftKey&&document.activeElement===last){
    event.preventDefault();
    first.focus();
  }
}
function showDeleteConfirm(id){
  if(document.getElementById('delConfirm'))return;
  pendingDeleteId=id;
  deleteConfirmRestoreFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const room=projectPrimaryRoom(id)||projects.find(r=>r.id===id);
  const name=room?(room.projectName||room.name):'this project';
  const overlay=document.createElement('div');
  overlay.id='delConfirm';
  overlay.className='confirm-overlay';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','delConfirmTitle');
  overlay.addEventListener('click',event=>{
    if(event.target===overlay)closeDeleteConfirm();
  });
  overlay.addEventListener('keydown',handleDeleteConfirmKeydown);
  const card=document.createElement('div');
  card.className='confirm-card';
  const title=document.createElement('div');
  title.id='delConfirmTitle';
  title.className='confirm-title';
  title.textContent='Delete project?';
  const copy=document.createElement('div');
  copy.className='confirm-copy';
  copy.textContent=name;
  const actions=document.createElement('div');
  actions.className='confirm-actions';
  const cancel=document.createElement('button');
  cancel.type='button';
  cancel.className='confirm-btn';
  cancel.dataset.action='close-delete-confirm';
  cancel.textContent='Cancel';
  const remove=document.createElement('button');
  remove.type='button';
  remove.className='confirm-btn danger';
  remove.dataset.action='confirm-delete';
  remove.textContent='Delete';
  actions.append(cancel,remove);
  card.append(title,copy,actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  cancel.focus();
}
function closeDeleteConfirm(){
  const el=document.getElementById('delConfirm');
  if(el)el.remove();
  pendingDeleteId=null;
  if(deleteConfirmRestoreFocus&&document.body.contains(deleteConfirmRestoreFocus))deleteConfirmRestoreFocus.focus();
  deleteConfirmRestoreFocus=null;
}
function confirmDelete(){if(pendingDeleteId){delPrj(pendingDeleteId)}closeDeleteConfirm()}

// ── CREATE ──
function createPresetShapeSvg(shape='rect'){
  const svg=createProjectSvg({viewBox:'0 0 60 40'});
  if(shape==='lshape'){
    appendProjectSvgShape(svg,'path',{d:'M4 4h32v16h20v16H4z',fill:'none',stroke:'#8B7E74','stroke-width':'1.5'});
  }else if(shape==='ushape'){
    appendProjectSvgShape(svg,'path',{d:'M4 4h52v32H40V18H20v18H4z',fill:'none',stroke:'#8B7E74','stroke-width':'1.5'});
  }else if(shape==='free'){
    appendProjectSvgShape(svg,'path',{d:'M8 30L15 8L35 4L52 15L48 34L25 36Z',fill:'none',stroke:'#B8918E','stroke-width':'1.5','stroke-dasharray':'3 2'});
  }else{
    appendProjectSvgShape(svg,'rect',{x:'4',y:'4',width:'52',height:'32',fill:'none',stroke:'#8B7E74','stroke-width':'1.5',rx:'1'});
  }
  return svg;
}
function createPresetCard(preset){
  const card=document.createElement('div');
  card.className=`pi${preset.id===selPreset?' sel':''}`;
  card.setAttribute('role','button');
  card.tabIndex=0;
  card.dataset.action='select-create-room-preset';
  card.dataset.presetId=preset.id;
  const tag=document.createElement('span');
  tag.className='starter-tag';
  tag.textContent=preset.tag;
  const name=document.createElement('span');
  name.textContent=preset.name;
  const hint=document.createElement('small');
  hint.textContent=preset.hint;
  card.append(tag,createPresetShapeSvg(preset.shape),name,hint);
  return card;
}
function popPresets(){
  const grid=document.getElementById('preG');
  if(!grid)return;
  window.RoseHTML.clear(grid);
  ROOM_STARTERS.forEach(preset=>grid.appendChild(createPresetCard(preset)));
}
function defaultPersonalRoomName(){return activeProfile==='rose'?"Living Room":"Living Room"}
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
  loadCreateRoomLayoutMode();
  selPreset=starter.id;
  document.getElementById('crN').value=createRoomContext.mode==='project_room'
    ? starter.name
    : (starter.name==="Bedroom"?defaultPersonalRoomName():starter.name);
  document.getElementById('crW').value=starter.width;document.getElementById('crL').value=starter.depth;document.getElementById('crH').value=starter.height;popPresets();document.getElementById('crMod').classList.add('on');
  syncCreateRoomLayoutModeUI();
}
// Opens the create modal pre-seeded with a room type from a design brief.
// briefId is informational only — the modal still lets the user adjust before creating.
function openCrModalWithBrief(roomType, briefId) {
  setCreateRoomLayoutMode('starter');
  openCrModal(roomType);
}

function closeCr(){document.getElementById('crMod').classList.remove('on')}
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
    kitchen:[{label:'Base Cabinet',assetKey:'kitchen_cabinet_base',x:1,y:l-0.5,w:1.5,d:0.65,rotation:180},{label:'Refrigerator',assetKey:'thi_kitchen_fridge',x:w-1.5,y:l-1.2,w:2.8,d:2.2,rotation:180},{label:'Oven',assetKey:'thi_kitchen_oven',x:midX,y:l-1.2,w:2.5,d:2,rotation:180},{label:'Sink',assetKey:'thi_kitchen_sink',x:midX-3,y:l-0.5,w:3,d:0.65,rotation:180},{label:'Range Hood',assetKey:'kn_hood_modern',x:midX,y:l-0.2,w:2.5,d:1.4,rotation:180,mountType:'ceiling',elevation:6.6},{label:'Kitchen Island',assetKey:'kitchen_island',x:midX,y:midY,w:4,d:2.5,rotation:0}],
    bathroom:[{label:'Vanity Sink',assetKey:'thi_bathroom_sink',x:midX,y:l-0.5,w:2.5,d:0.6,rotation:180},{label:'Toilet',assetKey:'thi_toilet',x:w-1,y:l-1.5,w:1.2,d:2,rotation:180},{label:'Bathtub',assetKey:'thi_bathtub',x:2.1,y:2.8,w:2.5,d:5.5,rotation:90},{label:'Towel Rack',assetKey:'thi_towel_rack',x:w-0.1,y:midY,w:1.8,d:0.2,rotation:90,mountType:'wall',elevation:4.2},{label:'Bathroom Mirror',assetKey:'bathroom_mirror',x:midX,y:l-0.1,w:2.5,d:0.2,rotation:180,mountType:'wall',elevation:5}],
    laundry:[{label:'Washing Machine',assetKey:'thi_washing_machine',x:2.2,y:l-1.6,w:2.6,d:2.7,rotation:180},{label:'Dryer',assetKey:'kn_dryer',x:5.1,y:l-1.6,w:2.6,d:2.7,rotation:180},{label:'Small Shelf',assetKey:'shelf_small',x:w-0.15,y:midY,w:2.2,d:0.45,rotation:90,mountType:'wall',elevation:5.2},{label:'Small Trashcan',assetKey:'trashcan_small',x:w-1.1,y:1.2,w:1,d:1,rotation:0}],
    // Phase 6A — new starter furniture sets
    home_theater:[{label:'Sectional Sofa',assetKey:'kn_lounge_sectional',x:midX,y:l-4,w:9,d:3.6,rotation:180},{label:'Coffee Table',assetKey:'table_coffee',x:midX,y:l-7,w:3.2,d:1.8,rotation:0},{label:'TV Cabinet',assetKey:'kn_cabinet_tv_doors',x:midX,y:1.2,w:5.2,d:1.6,rotation:0},{label:'Area Rug',assetKey:'rug',x:midX,y:l-5,w:9,d:6,rotation:0},{label:'Floor Lamp',assetKey:'lamp_floor',x:1.5,y:l-2,w:1,d:1,rotation:0}],
    mudroom:[{label:'Bench',assetKey:'bench',x:midX,y:l-1.2,w:4,d:1.4,rotation:180},{label:'Standing Coat Rack',assetKey:'kn_coat_rack_standing',x:1.2,y:2,w:1.4,d:1.4,rotation:0},{label:'Coat Rack',assetKey:'kn_coat_rack',x:w-0.2,y:midY,w:2.4,d:0.2,rotation:90,mountType:'wall',elevation:4.8},{label:'Doormat',assetKey:'kn_rug_doormat',x:midX,y:1.3,w:3,d:1.8,rotation:0}],
    kids_room:[{label:'Bunk Bed',assetKey:'thi_bunk_bed',x:midX-1,y:l-3,w:3.5,d:6.5,rotation:180},{label:'Nightstand',assetKey:'tfp_night_stand',x:midX-3.2,y:l-1.8,w:1.7,d:1.5,rotation:180},{label:'Round Rug',assetKey:'rug_round',x:midX+1,y:midY,w:5,d:5,rotation:0},{label:'Teddy Bear',assetKey:'kn_bear',x:midX+1,y:l-2,w:0.5,d:0.5,rotation:0},{label:'Short Closet',assetKey:'tfp_closet_short',x:w-1,y:2,w:2.8,d:1.8,rotation:270}],
    primary_suite:[{label:'King Bed',assetKey:'bed_king',x:midX-2,y:l-4,w:6.4,d:7.4,rotation:180},{label:'Nightstand L',assetKey:'nightstand',x:midX-5.2,y:l-2.8,w:1.7,d:1.5,rotation:180},{label:'Nightstand R',assetKey:'nightstand_alt',x:midX+1.2,y:l-2.8,w:1.8,d:1.55,rotation:180},{label:'Area Rug',assetKey:'rug',x:midX-2,y:l-5,w:7,d:5,rotation:0},{label:'Lounge Chair',assetKey:'chair',x:midX+5,y:midY-1,w:2,d:2,rotation:200},{label:'Tall Closet',assetKey:'tfp_closet',x:w-1,y:2,w:3.2,d:2,rotation:270},{label:'Floor Lamp',assetKey:'lamp_floor',x:midX+5.5,y:l-2,w:1,d:1,rotation:0}],
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
  room.furniture=createRoomLayoutMode==='starter'?buildStarterFurniture(starter,w,l):[];
  if(starter.designPreset)applyDesignPresetToRoom(room,starter.designPreset);
  projects.push(room);normalizeProjectRoomOrders(room);saveAll();closeCr();openEd(room);
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
  projects.push(room);normalizeProjectRoomOrders(room);saveAll();curRoom=room;drawMode=true;drawPts=[];drawCur=null;
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
}

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
  if(!curRoom||!floorId)return;
  activeProjectFloorId=floorId;
  const floorRooms=currentFloorRooms(curRoom,floorId);
  const currentBase=curRoom.baseRoomId||curRoom.id;
  const currentOnFloor=floorRooms.some(room=>(room.baseRoomId||room.id)===currentBase);
  if(!currentOnFloor&&floorRooms[0]){
    openEd(floorRooms[0]);
    return;
  }
  if(is3D&&typeof rebuild3D==='function')rebuild3D();
  else{
    autoFit?.();
    draw?.();
  }
  showP();
}
function openProjectRoom(baseRoomId){
  const baseRoom=projectRooms(curRoom).find(room=>(room.baseRoomId||room.id)===baseRoomId);
  const target=(baseRoom?optionSiblings(baseRoom).find(room=>room.id===curRoom.id||room.optionName==='Main'):null)
    || baseRoom;
  if(target)openEd(target);
}
function findProjectBaseRoom(baseRoomId,projectOrRoom=curRoom){
  return projectRooms(projectOrRoom).find(room=>(room.baseRoomId||room.id)===baseRoomId)||null;
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
function duplicateProjectRoom(baseRoomId=(curRoom?.baseRoomId||curRoom?.id)){
  if(!curRoom)return;
  const source=findProjectBaseRoom(baseRoomId,curRoom);
  if(!source)return;
  const clone=JSON.parse(JSON.stringify(source));
  clone.id=uid();
  clone.baseRoomId=clone.id;
  clone.optionName='Main';
  clone.roomOrder=projectMainRooms(curRoom).length;
  clone.connections=[];
  clone.createdAt=Date.now();
  clone.updatedAt=Date.now();
  clone.furniture=(clone.furniture||[]).map(item=>({...item,id:uid(),linkedExistingId:'',replacementId:''}));
  projects.push(normalizeRoom(clone));
  normalizeProjectRoomOrders(clone);
  saveAll();
  renderHome();
  openEd(projects.find(room=>room.id===clone.id));
  toast('Room duplicated');
}
function duplicateCurrentRoom(){
  duplicateProjectRoom(curRoom?.baseRoomId||curRoom?.id);
}
function deleteProjectRoom(baseRoomId=(curRoom?.baseRoomId||curRoom?.id)){
  if(!curRoom)return;
  const source=findProjectBaseRoom(baseRoomId,curRoom);
  if(!source)return;
  const siblings=projectMainRooms(curRoom);
  if(siblings.length<=1){
    toast('Keep at least one room in the project');
    return;
  }
  const removeBase=source.baseRoomId||source.id;
  const nextRoom=siblings.find(room=>(room.baseRoomId||room.id)!==removeBase);
  projects=projects.filter(room=>!((room.projectId||room.id)===(curRoom.projectId||curRoom.id)&&(room.baseRoomId||room.id)===removeBase));
  projects.forEach(room=>{
    if((room.projectId||room.id)===(curRoom.projectId||curRoom.id)){
      room.connections=(room.connections||[]).filter(link=>link.roomId!==source.id&&link.roomId!==removeBase);
    }
  });
  normalizeProjectRoomOrders(curRoom);
  saveAll();
  renderHome();
  if((curRoom.baseRoomId||curRoom.id)===removeBase){
    if(nextRoom)openEd(nextRoom); else exitEd();
  }else{
    showP();
    draw?.();
  }
  toast('Room removed from project');
}
function deleteCurrentRoom(){
  deleteProjectRoom(curRoom?.baseRoomId||curRoom?.id);
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
  normalizeProjectRoomOrders(curRoom);
  saveAll();
  renderHome();
  showP();
  draw?.();
}
function moveProjectRoomToFloor(baseRoomId=(curRoom?.baseRoomId||curRoom?.id),floorId){
  if(!curRoom||!floorId)return;
  const floor=projectFloors(curRoom).find(item=>item.id===floorId);
  if(!floor)return;
  const source=findProjectBaseRoom(baseRoomId,curRoom);
  if(!source)return;
  optionSiblings(source).forEach(room=>{
    room.floorId=floor.id;
    room.floorLabel=floor.label;
    room.floorOrder=floor.order;
    room.roomOrder=currentFloorRooms(curRoom,floor.id).filter(item=>(item.baseRoomId||item.id)!==baseRoomId).length;
  });
  activeProjectFloorId=floor.id;
  normalizeProjectRoomOrders(curRoom);
  saveAll();
  renderHome();
  showP();
  draw?.();
  if((curRoom.baseRoomId||curRoom.id)!==baseRoomId)toast(`Moved to ${floor.label}`);
}
function moveCurrentRoomToFloor(floorId){
  moveProjectRoomToFloor(curRoom?.baseRoomId||curRoom?.id,floorId);
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
function toggleRoomLayer(key){
  if(!curRoom||!PLAN_LAYER_DEFAULTS[key])return;
  curRoom.layerVisibility={...PLAN_LAYER_DEFAULTS,...(curRoom.layerVisibility||{})};
  curRoom.layerVisibility[key]=!curRoom.layerVisibility[key];
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
// Phase ✨ — Time-of-day slider wiring (live preview; persists per-room)
function _todLabelForValue(v){
  const t=v/100;
  if(t<0.1)return'Midnight';if(t<0.22)return'Dawn';if(t<0.38)return'Morning';
  if(t<0.58)return'Noon';if(t<0.76)return'Golden';if(t<0.9)return'Dusk';return'Night';
}
function onTimeOfDayChange(v){
  const t=Number(v)/100;
  const label=document.getElementById('todLabel');
  if(label)label.textContent=_todLabelForValue(Number(v));
  if(typeof applyTimeOfDay==='function')applyTimeOfDay(t);
}
function setTimeOfDay(v){
  const s=document.getElementById('todSlider');
  if(s)s.value=v;
  onTimeOfDayChange(v);
}
if(typeof window!=='undefined'){window.onTimeOfDayChange=onTimeOfDayChange;window.setTimeOfDay=setTimeOfDay}

// Phase ✨ — Undo timeline strip: thumbnail dots showing undo/redo stack position
function updateUndoStrip(){
  let strip=document.getElementById('undoStrip');
  if(!curRoom||!is3D===false&&!curRoom){if(strip)strip.classList.remove('on');return}
  if(!strip){
    strip=document.createElement('div');strip.id='undoStrip';strip.className='undo-strip';
    document.body.appendChild(strip);
  }
  const totalUndo=(typeof undoSt!=='undefined'?undoSt.length:1);
  const totalRedo=(typeof redoSt!=='undefined'?redoSt.length:0);
  const total=totalUndo+totalRedo;
  if(total<=1){strip.classList.remove('on');return}
  // Current position: at index (totalUndo-1) from left
  const cur=totalUndo-1;
  const nodes=[];
  const max=Math.min(total,12);
  const offset=Math.max(0,cur-Math.floor(max/2));
  for(let i=0;i<max&&(i+offset)<total;i++){
    const idx=i+offset;
    const isCurrent=idx===cur;
    const stepsBack=cur-idx;
    nodes.push(`<div class="undo-node${isCurrent?' current':''}" role="button" tabindex="0" data-action="jump-undo-step" data-step="${stepsBack}" title="${stepsBack===0?'Current':stepsBack>0?stepsBack+' step back':(-stepsBack)+' step forward'}">${isCurrent?'•':''}</div>`);
  }
  strip.innerHTML=nodes.join('');
  strip.classList.add('on');
  clearTimeout(strip._t);
  strip._t=setTimeout(()=>strip.classList.remove('on'),3200);
}
function jumpUndoStep(steps){
  if(!steps||typeof doUndo!=='function')return;
  const fn=steps>0?doUndo:doRedo;
  for(let i=0;i<Math.abs(steps);i++)fn();
  updateUndoStrip();
}
if(typeof window!=='undefined'){window.updateUndoStrip=updateUndoStrip;window.jumpUndoStep=jumpUndoStep}
