// Catalog
const CATALOG_CATEGORY_ORDER=['Seating','Beds','Tables','Storage','Lighting','Decor','Rugs','Wall Decor','Openings'];
const CATEGORY_ALIAS_MAP={'Window Decor':'Openings'};
const COLLECTION_THEMES={
  'Cozy Rose':'linear-gradient(135deg,#fff4f1,#edd7d0)',
  'Soft Romantic':'linear-gradient(135deg,#fff6f6,#eadde6)',
  'Quiet Luxury':'linear-gradient(135deg,#f7f4ef,#ddd2c2)',
  'Warm Modern':'linear-gradient(135deg,#fbf2e7,#dcc3ab)',
  'Tailored Calm':'linear-gradient(135deg,#f3f0ee,#d4dce0)',
  'Everyday Staples':'linear-gradient(135deg,#f6f2eb,#e5ddd0)'
};
const FURN_ITEMS=[
  {label:'Sofa',w:5.2,d:2.55,icon:'???',symbol:'S',assetKey:'sofa',group:'Seating'},
  {label:'Small Sofa',w:3.4,d:2.05,icon:'???',symbol:'S',assetKey:'sofa_small',group:'Seating'},
  {label:'Compact Sofa',w:3.6,d:2.1,icon:'???',symbol:'C',assetKey:'sofa_compact',group:'Seating'},
  {label:'Sofa Medium',w:4.4,d:2.35,icon:'???',symbol:'S',assetKey:'sofa_medium',group:'Seating'},
  {label:'Large Sofa',w:5.8,d:2.6,icon:'???',symbol:'L',assetKey:'sofa_large',group:'Seating'},
  {label:'Grand Sofa',w:6.4,d:2.8,icon:'???',symbol:'G',assetKey:'sofa_grand',group:'Seating'},
  {label:'Modern Sofa',w:5.2,d:2.55,icon:'???',symbol:'M',assetKey:'sofa_modern',group:'Seating'},
  {label:'Sectional Sofa',w:6,d:3.6,icon:'???',symbol:'L',assetKey:'sofa_l',group:'Seating'},
  {label:'Loveseat',w:4,d:2.3,icon:'???',symbol:'L',assetKey:'sofa',group:'Seating'},
  {label:'Chair',w:1.6,d:1.6,icon:'??',symbol:'C',assetKey:'chair',group:'Seating'},
  {label:'Office Chair',w:2,d:2,icon:'??',symbol:'O',assetKey:'chair_office',group:'Seating'},
  {label:'Stool',w:1.4,d:1.4,icon:'??',symbol:'S',assetKey:'stool',group:'Seating'},
  {label:'Bench',w:3.5,d:1.4,icon:'??',symbol:'B',assetKey:'bench',group:'Seating'},
  {label:'Bed',w:6.2,d:7.2,icon:'???',symbol:'B',assetKey:'bed',group:'Beds'},
  {label:'King Bed',w:6.4,d:7.4,icon:'???',symbol:'K',assetKey:'bed_king',group:'Beds'},
  {label:'Twin Bed',w:3.6,d:6.6,icon:'???',symbol:'T',assetKey:'bed_twin',group:'Beds'},
  {label:'Bunk Bed',w:4.4,d:6.8,icon:'???',symbol:'U',assetKey:'bunk_bed',group:'Beds'},
  {label:'Coffee Table',w:3.2,d:1.8,icon:'??',symbol:'T',assetKey:'table_coffee',group:'Tables'},
  {label:'Dining Table',w:5,d:3,icon:'???',symbol:'D',assetKey:'dining_table',group:'Tables'},
  {label:'Round Dining Table',w:4.2,d:4.2,icon:'???',symbol:'R',assetKey:'table_round_large',group:'Tables'},
  {label:'Round Side Table',w:2.4,d:2.4,icon:'???',symbol:'R',assetKey:'table_round_small',group:'Tables'},
  {label:'Desk',w:4,d:2,icon:'??',symbol:'K',assetKey:'desk',group:'Tables'},
  {label:'Bookshelf',w:3.2,d:1.1,icon:'??',symbol:'H',assetKey:'bookshelf',group:'Storage'},
  {label:'Bookcase With Books',w:3.2,d:1.1,icon:'??',symbol:'B',assetKey:'bookcase_books',group:'Storage'},
  {label:'Shelving',w:3.5,d:.6,icon:'??',symbol:'E',assetKey:'shelving',group:'Storage'},
  {label:'Small Shelf',w:2.2,d:.45,icon:'??',symbol:'S',assetKey:'shelf_small',group:'Storage'},
  {label:'Dresser',w:4,d:1.8,icon:'???',symbol:'R',assetKey:'dresser',group:'Storage'},
  {label:'Tall Dresser',w:3.4,d:1.7,icon:'???',symbol:'T',assetKey:'dresser_tall',group:'Storage'},
  {label:'TV Console',w:5,d:1.4,icon:'??',symbol:'V',assetKey:'tv_console',group:'Storage'},
  {label:'Low Console',w:4.6,d:1.35,icon:'??',symbol:'L',assetKey:'console_low',group:'Storage'},
  {label:'Nightstand',w:1.7,d:1.5,icon:'??',symbol:'N',assetKey:'nightstand',group:'Storage'},
  {label:'Alt Nightstand',w:1.8,d:1.55,icon:'??',symbol:'A',assetKey:'nightstand_alt',group:'Storage'},
  {label:'Fireplace',w:4.2,d:1.3,icon:'??',symbol:'F',assetKey:'fireplace',group:'Decor'},
  {label:'Floor Lamp',w:1,d:1,icon:'??',symbol:'L',assetKey:'lamp_floor',group:'Lighting'},
  {label:'Stand Lamp',w:1,d:1,icon:'??',symbol:'S',assetKey:'lamp_stand',group:'Lighting'},
  {label:'Table Lamp',w:1,d:1,icon:'???',symbol:'T',assetKey:'lamp_table',group:'Lighting'},
  {label:'Chandelier',w:2.2,d:2.2,icon:'?',symbol:'C',assetKey:'lamp_chandelier',group:'Lighting'},
  {label:'Ceiling Light',w:1.6,d:1.6,icon:'?',symbol:'C',assetKey:'lamp_ceiling',group:'Lighting'},
  {label:'Cube Light',w:1.35,d:1.35,icon:'?',symbol:'Q',assetKey:'lamp_cube',group:'Lighting'},
  {label:'Pendant Light',w:1.7,d:1.7,icon:'?',symbol:'P',assetKey:'lamp_pendant',group:'Lighting'},
  {label:'Wall Lamp',w:1.2,d:.4,icon:'??',symbol:'W',assetKey:'lamp_wall',group:'Lighting'},
  {label:'Plant',w:1.4,d:1.4,icon:'??',symbol:'P',assetKey:'plant_floor',group:'Decor'},
  {label:'Cactus',w:1,d:1,icon:'??',symbol:'C',assetKey:'plant_cactus',group:'Decor'},
  {label:'Leafy Plant',w:1.35,d:1.35,icon:'??',symbol:'L',assetKey:'plant_leafy',group:'Decor'},
  {label:'Palm Plant',w:1.5,d:1.5,icon:'??',symbol:'P',assetKey:'plant_palm',group:'Decor'},
  {label:'Round Plant',w:1.2,d:1.2,icon:'??',symbol:'R',assetKey:'plant_round',group:'Decor'},
  {label:'Shelf Plant',w:1,d:1,icon:'??',symbol:'P',assetKey:'plant_small',group:'Decor'},
  {label:'Area Rug',w:5,d:3.5,icon:'??',symbol:'A',assetKey:'rug',group:'Rugs'},
  {label:'Runner Rug',w:6.5,d:2,icon:'??',symbol:'R',assetKey:'runner_rug',group:'Rugs'},
  {label:'Round Rug',w:4.2,d:4.2,icon:'??',symbol:'O',assetKey:'rug_round',group:'Rugs'},
  {label:'Mirror',w:2,d:.3,icon:'??',symbol:'M',assetKey:'mirror',group:'Wall Decor'},
  {label:'Wall Art I',w:2.4,d:.2,icon:'???',symbol:'A',assetKey:'wall_art_01',group:'Wall Decor'},
  {label:'Wall Art II',w:2.4,d:.2,icon:'???',symbol:'A',assetKey:'wall_art_04',group:'Wall Decor'},
  {label:'Wall Art III',w:2.4,d:.2,icon:'???',symbol:'A',assetKey:'wall_art_06',group:'Wall Decor'},
  {label:'Curtains',w:4,d:.4,icon:'??',symbol:'C',assetKey:'curtains',group:'Openings'},
  {label:'Blinds',w:4,d:.3,icon:'??',symbol:'B',assetKey:'blinds',group:'Openings'},
];
const DEFAULT_COLLECTIONS=['all','Cozy Rose','Soft Romantic','Quiet Luxury','Warm Modern','Tailored Calm'];
let assetManifest=[];
let assetMetaByKey=new Map();
let activeCatalogCollection='all';
let activeCatalogCategory='all';
let catalogFavorites=[];
let catalogRecent=[];
function normalizeArrayValue(value){
  if(Array.isArray(value))return value.filter(Boolean);
  if(value===null||value===undefined||value==='')return [];
  return [value];
}
function uniqueList(values){return [...new Set((values||[]).filter(Boolean))]}
function normalizeCatalogGroup(group){return CATEGORY_ALIAS_MAP[group]||group||'Decor'}
function catalogCategoryList(){return ['all',...CATALOG_CATEGORY_ORDER]}
function catalogStorageKey(name){return 'catalog_'+name}
async function loadCatalogPrefs(){
  catalogFavorites=normalizeArrayValue(await dg(catalogStorageKey('favorites')));
  catalogRecent=normalizeArrayValue(await dg(catalogStorageKey('recent')));
}
function saveCatalogPrefs(){
  ds(catalogStorageKey('favorites'),catalogFavorites.slice(0,36));
  ds(catalogStorageKey('recent'),catalogRecent.slice(0,18));
}
function rememberCatalogRecent(assetKey){
  if(!assetKey)return;
  catalogRecent=[assetKey,...catalogRecent.filter(key=>key!==assetKey)].slice(0,12);
  saveCatalogPrefs();
}
function toggleFavoriteCatalogItem(assetKey){
  if(!assetKey)return;
  catalogFavorites=catalogFavorites.includes(assetKey)
    ? catalogFavorites.filter(key=>key!==assetKey)
    : [assetKey,...catalogFavorites].slice(0,24);
  saveCatalogPrefs();
  const search=document.getElementById('furnSearch');
  if(search)filterFurnPicker(search.value||'');
}
function isFavoriteCatalogItem(assetKey){return catalogFavorites.includes(assetKey)}
function catalogCollections(){
  const set=new Set(DEFAULT_COLLECTIONS);
  FURN_ITEMS.forEach(item=>(item.collections||[]).forEach(name=>set.add(name)));
  return [...set];
}
function itemMatchesCollection(item,collection){
  if(!collection||collection==='all')return true;
  return (item.collections||[]).includes(collection);
}
function itemMatchesCategory(item,category){
  if(!category||category==='all')return true;
  return normalizeCatalogGroup(item.group)===category;
}
function getFurnitureCatalogItem(record){
  return (record?.assetKey&&FURN_ITEM_BY_KEY.get(record.assetKey))||FURN_ITEM_BY_LABEL.get(((record?.label)||'').toLowerCase())||null;
}
function catalogSearchText(item){
  return [item.label,item.group,item.category,...(item.tags||[]),...(item.collections||[]),...(item.recommendedRoomTypes||[])].join(' ').toLowerCase();
}
function catalogCardTone(item){
  const collection=(item.collections||[])[0]||'Everyday Staples';
  return COLLECTION_THEMES[collection]||'linear-gradient(135deg,#f8f4ee,#e9e0d5)';
}
function catalogPlaceholderMarkup(item){
  if(item.thumbnailPath)return `<div class="catalog-thumb-media" style="background-image:url('${esc(item.thumbnailPath)}')"></div>`;
  return `<div class="catalog-thumb-mark">${esc(item.symbol||item.label.charAt(0).toUpperCase())}</div>`;
}
function buildCatalogOptionCard(item,index,compact=false){
  const collection=(item.collections||[])[0]||'Everyday Staples';
  const favClass=isFavoriteCatalogItem(item.assetKey)?' active':'';
  return `<button class="catalog-card furn-option${compact?' compact':''}" type="button" data-asset-key="${esc(item.assetKey||'')}" data-group="${esc(item.group)}" data-category="${esc(normalizeCatalogGroup(item.group))}" data-collection="${esc((item.collections||[]).join('|'))}" data-label="${esc(catalogSearchText(item))}" onclick="placeFurn(${index})"><span class="catalog-fav${favClass}" onclick="event.stopPropagation();toggleFavoriteCatalogItem('${esc(item.assetKey||'')}')">&#9733;</span><span class="catalog-thumb" style="background:${catalogCardTone(item)}">${catalogPlaceholderMarkup(item)}</span><span class="catalog-meta"><span class="catalog-title">${esc(item.label)}</span><span class="catalog-sub">${esc(collection)}</span></span></button>`;
}
function catalogItemsForKeys(keys){return keys.map(key=>FURN_ITEM_BY_KEY.get(key)).filter(Boolean)}
async function loadAssetManifest(){
  try{
    const res=await fetch('./data/asset-manifest.json',{cache:'no-store'});
    if(!res.ok)return;
    const json=await res.json();
    if(!Array.isArray(json))return;
    assetManifest=json.map(entry=>({
      ...entry,
      category:normalizeCatalogGroup(entry.category),
      tags:normalizeArrayValue(entry.tags),
      collections:normalizeArrayValue(entry.collections),
      recommendedRoomTypes:normalizeArrayValue(entry.recommendedRoomTypes)
    }));
    window.assetManifest=assetManifest;
    assetMetaByKey=new Map(assetManifest.map(entry=>[entry.id,entry]));
    FURN_ITEMS.forEach(item=>{
      const meta=item.assetKey?assetMetaByKey.get(item.assetKey):null;
      item.group=normalizeCatalogGroup(meta?.category||item.group);
      item.category=GROUP_CATEGORY_MAP[item.group]||'decor';
      item.mountType=item.mountType||MODEL_REGISTRY[item.assetKey]?.mountType||'floor';
      item.rotationPolicy=item.rotationPolicy||'free';
      item.defaultFacing=item.defaultFacing||MODEL_REGISTRY[item.assetKey]?.defaultFacing||'forward';
      item.tags=uniqueList([...(item.tags||[]),...(meta?.tags||[])]);
      item.collections=uniqueList([...(item.collections||[]),...(meta?.collections||[])]);
      item.recommendedRoomTypes=uniqueList([...(item.recommendedRoomTypes||[]),...(meta?.recommendedRoomTypes||[])]);
      item.thumbnailPath=meta?.thumbnailPath||item.thumbnailPath||'';
    });
    await loadCatalogPrefs();
  }catch(_){}
}
const FURN_ITEM_BY_KEY=new Map(FURN_ITEMS.filter(item=>item.assetKey).map(item=>[item.assetKey,item]));
const FURN_ITEM_BY_LABEL=new Map(FURN_ITEMS.map(item=>[(item.label||'').toLowerCase(),item]));
function normalizeFurnitureRecord(f){
  const catalog=getFurnitureCatalogItem(f);
  const assetKey=f.assetKey||catalog?.assetKey||inferAssetKey(f.label,f.mountType||catalog?.mountType);
  const reg=assetKey?MODEL_REGISTRY[assetKey]:null;
  const mountType=f.mountType||catalog?.mountType||reg?.mountType||'floor';
  const type=resolveLabel(f.label||catalog?.label);
  const redesignAction=EXISTING_ACTIONS[f.redesignAction]?f.redesignAction:'keep';
  return {
    id:f.id||uid(),
    label:f.label||catalog?.label||'Item',
    category:f.category||catalog?.category||reg?.category||type||'decor',
    x:Number.isFinite(f.x)?f.x:0,
    z:Number.isFinite(f.z)?f.z:0,
    w:Number.isFinite(f.w)?f.w:(catalog?.w||2),
    d:Number.isFinite(f.d)?f.d:(catalog?.d||1.5),
    rotation:Number.isFinite(f.rotation)?f.rotation:0,
    mountType,
    elevation:Number.isFinite(f.elevation)?f.elevation:defaultElevation(mountType,assetKey,type),
    assetKey,
    yOffset:Number.isFinite(f.yOffset)?f.yOffset:(reg?.yOffset||0),
    finishColor:f.finishColor||'',
    visible:f.visible!==false,
    source:f.source==='existing'?'existing':'new',
    redesignAction,
    locked:!!f.locked,
    linkedExistingId:f.linkedExistingId||'',
    replacementId:f.replacementId||'',
  };
}
let pendFurnPos=null;
function showFurnPicker(wp){
  pendFurnPos=wp;
  furnQuery='';
  activeCatalogCollection='all';
  activeCatalogCategory='all';
  const suggested=getSuggestedItems(curRoom);
  const favoriteItems=catalogItemsForKeys(catalogFavorites);
  const recentItems=catalogItemsForKeys(catalogRecent);
  const collectionButtons=catalogCollections().map(name=>`<button class="mini-chip${name===activeCatalogCollection?'':' secondary'}" type="button" onclick="setCatalogCollection('${esc(name)}')" style="padding:8px 11px;font-size:9px">${esc(name==='all'?'All Collections':name)}</button>`).join('');
  const categoryButtons=catalogCategoryList().map(name=>`<button class="mini-chip${name===activeCatalogCategory?'':' secondary'}" type="button" onclick="setCatalogCategory('${esc(name)}')" style="padding:8px 11px;font-size:9px">${esc(name==='all'?'All Categories':name)}</button>`).join('');
  const section=(title,key,items,compact=false)=>items.length?'<div class="furn-group" data-group="'+esc(key)+'"><div class="catalog-section-title">'+esc(title)+'</div><div class="catalog-grid'+(compact?' compact':'')+'">'+items.map(item=>buildCatalogOptionCard(item,FURN_ITEMS.indexOf(item),compact)).join('')+'</div></div>':'';
  const roomLabel=(ROOM_TYPES.find(t=>t.id===(curRoom?.roomType||'living_room'))||ROOM_TYPES[0]).name;
  const html='<div class="catalog-overlay" id="furnPickOv" onclick="if(event.target===this)closeFurnPick()"><div class="catalog-sheet"><div class="catalog-grabber"></div><div class="catalog-head"><div><div class="catalog-heading">Bring Something Beautiful In</div><div class="catalog-copy">Search the curated catalog, save favorites, and drop pieces in with confidence.</div></div><button class="mini-chip secondary" type="button" onclick="closeFurnPick()">Close</button></div><input id="furnSearch" type="search" placeholder="Search sofa, bed, lamp, console, romantic..." oninput="filterFurnPicker(this.value)" class="catalog-search"><div class="catalog-chip-row">'+collectionButtons+'</div><div class="catalog-chip-row catalog-chip-row-alt">'+categoryButtons+'</div>'+section('Favorites','favorites',favoriteItems,true)+section('Recent','recent',recentItems,true)+section('Quick Picks For '+roomLabel,'quick',suggested,true)+CATALOG_CATEGORY_ORDER.map(group=>section(group,group,FURN_ITEMS.filter(f=>normalizeCatalogGroup(f.group)===group),false)).join('')+'<div id="furnEmpty" class="catalog-empty">No matches yet. Try a broader word like sofa, bed, rug, mirror, or storage.</div></div></div>';
  document.body.insertAdjacentHTML('beforeend',html);
  filterFurnPicker('');
}
function closeFurnPick(){const ov=document.getElementById('furnPickOv');if(ov)ov.remove();pendFurnPos=null}
function setCatalogCollection(collection){
  activeCatalogCollection=collection||'all';
  const search=document.getElementById('furnSearch');
  filterFurnPicker(search?search.value:'');
  document.querySelectorAll('#furnPickOv .catalog-chip-row:not(.catalog-chip-row-alt) .mini-chip').forEach(btn=>{
    const active=btn.textContent.trim()===(activeCatalogCollection==='all'?'All Collections':activeCatalogCollection);
    btn.classList.toggle('secondary',!active);
  });
}
function setCatalogCategory(category){
  activeCatalogCategory=category||'all';
  const search=document.getElementById('furnSearch');
  filterFurnPicker(search?search.value:'');
  document.querySelectorAll('#furnPickOv .catalog-chip-row-alt .mini-chip').forEach(btn=>{
    const active=btn.textContent.trim()===(activeCatalogCategory==='all'?'All Categories':activeCatalogCategory);
    btn.classList.toggle('secondary',!active);
  });
}
function filterFurnPicker(query){
  furnQuery=(query||'').trim().toLowerCase();
  const options=[...document.querySelectorAll('.furn-option')];
  const groups=[...document.querySelectorAll('.furn-group')];
  options.forEach(el=>{
    const collectionMatch=activeCatalogCollection==='all'||(el.dataset.collection||'').split('|').includes(activeCatalogCollection);
    const categoryMatch=activeCatalogCategory==='all'||(el.dataset.category||'')===activeCatalogCategory;
    const textMatch=!furnQuery||el.dataset.label.includes(furnQuery);
    const match=collectionMatch&&categoryMatch&&textMatch;
    el.dataset.match=match?'1':'0';
    el.style.display=match?'':'none';
  });
  groups.forEach(group=>{
    const visible=[...group.querySelectorAll('.furn-option')].some(el=>el.dataset.match==='1');
    group.style.display=visible?'':'none';
  });
  const anyVisible=options.some(el=>el.dataset.match==='1');
  const empty=document.getElementById('furnEmpty');
  if(empty)empty.style.display=anyVisible?'none':'block';
}
function placeFurn(itemIdx){
  if(!pendFurnPos||!curRoom)return;
  const item=FURN_ITEMS[itemIdx];
  if(!item)return;
  const reg=item.assetKey?MODEL_REGISTRY[item.assetKey]:null;
  const pos=snapFurniturePoint(pendFurnPos.x,pendFurnPos.y);
  curRoom.furniture.push(normalizeFurnitureRecord({
    id:uid(),
    label:item.label,
    category:item.category,
    x:pos.x,
    z:pos.z,
    w:item.w,
    d:item.d,
    rotation:0,
    mountType:item.mountType||reg?.mountType||'floor',
    elevation:Number.isFinite(item.elevation)?item.elevation:defaultElevation(item.mountType||reg?.mountType||'floor',item.assetKey,resolveLabel(item.label)),
    assetKey:item.assetKey,
    yOffset:reg?.yOffset||0,
    visible:true
  }));
  const idx=curRoom.furniture.length-1;
  tool='select';
  document.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',b.dataset.t==='select'));
  setFurnitureSelection(idx);
  if(isTouchUi()&&window.innerWidth<=760)panelHidden=true;
  rememberCatalogRecent(item.assetKey);
  pushU();closeFurnPick();draw();showP();
  toast(item.label+' placed');
  if(curRoom.furniture.length===5)findEgg(4);
}

// ── PROPS ──
function getWallStylePreset(room=curRoom){
  return WALL_PALETTES.find(w=>w.id===(room?.materials?.wallFinish||'warm_white'))||WALL_PALETTES[0];
}
function getFloorStylePreset(room=curRoom){
  return FLOOR_TYPES.find(f=>f.id===(room?.materials?.floorType||'light_oak'))||FLOOR_TYPES[0];
}
function wallColorIsCustom(room=curRoom){
  return !!room?.materials?.wallColorCustom;
}
function floorColorIsCustom(room=curRoom){
  return !!room?.materials?.floorColorCustom;
}
function setWallPaint(color){
  if(!curRoom)return;
  curRoom.materials.wall=normalizeColorValue(color,getWallStylePreset(curRoom).color);
  curRoom.materials.wallColorCustom=true;
  roomStyleChanged();
}
function setWallFinish(id){
  if(!curRoom)return;
  const match=WALL_PALETTES.find(w=>w.id===id);
  if(!match)return;
  curRoom.materials.wallFinish=id;
  curRoom.materials.wall=match.color;
  curRoom.materials.wallColorCustom=false;
  roomStyleChanged();
}
function resetWallColorToStyle(){
  if(!curRoom)return;
  const match=getWallStylePreset(curRoom);
  curRoom.materials.wall=match.color;
  curRoom.materials.wallColorCustom=false;
  roomStyleChanged();
}
function setFloorPaint(color){
  if(!curRoom)return;
  curRoom.materials.floor=normalizeColorValue(color,getFloorStylePreset(curRoom).color);
  curRoom.materials.floorColorCustom=true;
  roomStyleChanged();
}
function setFloorType(type){
  if(!curRoom)return;
  const match=FLOOR_TYPES.find(f=>f.id===type);
  if(!match)return;
  curRoom.materials.floorType=match.id;
  curRoom.materials.floor=match.color;
  curRoom.materials.floorColorCustom=false;
  roomStyleChanged();
}
function resetFloorColorToStyle(){
  if(!curRoom)return;
  const match=getFloorStylePreset(curRoom);
  curRoom.materials.floor=match.color;
  curRoom.materials.floorColorCustom=false;
  roomStyleChanged();
}
function setTrimColor(color){if(!curRoom)return;curRoom.materials.trim=normalizeColorValue(color,TRIM_COLORS[0]);roomStyleChanged()}
function setCeilingBrightness(v){if(!curRoom)return;curRoom.materials.ceilingBrightness=Math.max(.7,Math.min(1.35,parseFloat(v)||1));roomStyleChanged()}
function setLightingPreset(id){if(!curRoom)return;curRoom.materials.lightingPreset=id;if(is3D&&ren&&scene){const preset=getLightingPreset(curRoom);ren.toneMappingExposure=preset.exposure;scene.background=safeThreeColor(preset.background,'#0f141c');scene.fog=new THREE.Fog(scene.background.getHex(),preset.fogNear||28,preset.fogFar||82)}roomStyleChanged()}
function setRoomType(id){if(!curRoom)return;curRoom.roomType=id;pushU();draw();showP()}
function nudgeStyle(action){
  if(!curRoom)return;
  const moves={
    softer:()=>{setWallFinish('dusty_rose');setFloorType('light_oak');setLightingPreset('warm_evening')},
    warmer:()=>{setWallFinish('soft_beige');setFloorType('medium_oak');setLightingPreset('warm_evening')},
    brighter:()=>{setWallFinish('warm_white');setFloorType('light_oak');setLightingPreset('bright_studio');setCeilingBrightness(1.18)},
    cozier:()=>{setWallFinish('greige');setFloorType('dark_walnut');setLightingPreset('soft_lamp_glow')},
    romantic:()=>{applyDesignPreset('soft_romantic')},
    elegant:()=>{applyDesignPreset('quiet_luxury')},
    minimal:()=>{applyDesignPreset('airy_minimal')}
  };
  if(moves[action])moves[action]();
}
function applyDesignPresetToRoom(room,id){
  if(!room)return;
  const preset=DESIGN_PRESETS.find(p=>p.id===id);
  if(!preset)return;
  room.designPreset=id;
  room.roomType=preset.roomType||room.roomType||'living_room';
  const wall=WALL_PALETTES.find(w=>w.id===preset.wallFinish);
  const floor=FLOOR_TYPES.find(f=>f.id===preset.floorType);
  if(wall){room.materials.wallFinish=wall.id;room.materials.wall=wall.color;room.materials.wallColorCustom=false;}
  if(floor){room.materials.floorType=floor.id;room.materials.floor=floor.color;room.materials.floorColorCustom=false;}
  room.materials.trim=preset.trim||room.materials.trim;
  room.materials.lightingPreset=preset.lightingPreset||room.materials.lightingPreset;
  room.materials.ceilingBrightness=Number.isFinite(preset.ceilingBrightness)?preset.ceilingBrightness:(room.materials.ceilingBrightness||1);
  room.mood=preset.mood||room.mood;
}
function applyDesignPreset(id){
  if(!curRoom)return;
  const preset=DESIGN_PRESETS.find(p=>p.id===id);
  if(!preset)return;
  applyDesignPresetToRoom(curRoom,id);
  roomStyleChanged();
  toast(`${preset.name} applied`);
}
function getSuggestedItems(room){
  const type=ROOM_TYPES.find(t=>t.id===(room?.roomType||'living_room'))||ROOM_TYPES[0];
  const preset=DESIGN_PRESETS.find(p=>p.id===room?.designPreset)||null;
  const presetSuggestions=Array.isArray(preset?.suggestions)?preset.suggestions:[];
  const typeSuggestions=Array.isArray(type?.suggestions)?type.suggestions:[];
  const keys=[...presetSuggestions,...typeSuggestions];
  const seen=new Set();
  return keys
    .filter(key=>typeof key==='string'&&key)
    .filter(key=>seen.has(key)?false:(seen.add(key),true))
    .map(key=>FURN_ITEMS.find(item=>item.assetKey===key))
    .filter(Boolean)
    .slice(0,8);
}
function setClosetStyle(id){
  if(!curRoom)return;
  curRoom.materials.closetStyle=id;
  curRoom.structures.forEach(st=>{if(st.type==='closet'&&st.rect)st.finish=id});
  pushU();draw();showP();if(is3D)rebuild3D();
}
function setFurnitureFinish(color){
  const records=selectedFurnitureRecords();
  if(!records.length)return;
  records.forEach(item=>item.finishColor=color||'');
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function rotateSelectedFurniture(delta){
  const records=selectedFurnitureRecords();
  if(!records.length)return;
  records.forEach(f=>{
    let next=((Number(f.rotation)||0)+Number(delta||0))%360;
    if(next<0)next+=360;
    f.rotation=next;
  });
  pushU();
  draw();
  showP();
  scheduleRebuild3D();
}
function turnAroundSelectedFurniture(){rotateSelectedFurniture(180)}
function uRoomHeight(v){curRoom.height=parseDistanceInput(v,curRoom.height||9)||9;curRoom.structures.forEach(st=>{if(st.type==='closet'&&st.rect)st.height=curRoom.height});draw();showP();pushU();scheduleRebuild3D()}
let panelHidden=false;
function isTouchUi(){return Math.max(navigator.maxTouchPoints||0,0)>0}
function mobilePanelShouldPeek(){
  if(!isTouchUi()||window.innerWidth>760)return false;
  if(!curRoom)return false;
  if(tool==='furniture'&&!sel.type)return true;
  if(!sel.type||sel.idx<0)return true;
  return false;
}
function propSection(title,body){return `<div class="prop-section"><div class="prop-sec-title">${title}</div>${body}</div>`}
const LIGHTING_PRESET_HELP={
  daylight:'Bright, airy daylight for checking colors and keeping the room open.',
  warm_evening:'Golden evening light that makes the room feel softer and more intimate.',
  soft_lamp_glow:'Mostly practical lamp light with a gentle cozy falloff around the room.',
  moody:'Low, dramatic light with deeper shadows and a more cinematic feel.',
  bright_studio:'Even, neutral brightness for styling, staging, and clear presentation shots.',
};
function lightingPresetHelp(id){
  return LIGHTING_PRESET_HELP[id]||'Changes the 3D mood, exposure, and practical light balance for this room.';
}
function ceilingBrightnessLabel(room){
  const value=room?.materials?.ceilingBrightness||1;
  if(value>=1.18)return 'Ceiling is helping bounce a lot of light back into the room.';
  if(value<=0.88)return 'Ceiling is intentionally toned down for a moodier top plane.';
  return 'Ceiling is staying close to its natural painted brightness.';
}

function showP(){
  const p=document.getElementById('propsP'),r=curRoom;
  const tab=document.getElementById('propsTab');
  if(!r){hideP();return}
  normalizeFurnitureSelection();
  tab.classList.toggle('on',panelHidden);
  if(panelHidden){p.classList.remove('on');return}
  p.classList.toggle('peek',mobilePanelShouldPeek());
  let h='';
  const cBtn='<div class="props-hdr"><h4>$T</h4><button class="props-close" onclick="closeP()">\u00D7</button></div>';
  if(!sel.type||sel.idx<0){
    const activeLightingPreset=r.materials.lightingPreset||'daylight';
    h=cBtn.replace('$T','Room Style');
    h+=propSection('Surfaces',`<label>WALL STYLE</label><div class="mat-grid">${WALL_PALETTES.map(c=>`<button class="mat-btn${(r.materials.wallFinish||'warm_white')===c.id?' sel':''}" onclick="setWallFinish('${c.id}')" style="background:${c.color};color:${c.id==='charcoal_accent'?'#fff':'#332922'}">${c.name}</button>`).join('')}</div><div class="prop-state${wallColorIsCustom(r)?' custom':''}">${wallColorIsCustom(r)?`Custom color active <button class="prop-link-btn" onclick="resetWallColorToStyle()">Reset to style</button>`:'Wall color follows the selected wall style.'}</div><label style="margin-top:8px">WALL COLOR OVERRIDE</label><div class="paint-row">${WALL_PALETTES.map(c=>`<button class="swatch${r.materials.wall===c.color?' sel':''}" style="background:${c.color}" onclick="setWallPaint('${c.color}')" title="Use ${c.name} as a custom wall color"></button>`).join('')}</div><div class="prop-tip">Choosing a wall style resets the wall back to that style color. Picking a swatch creates an intentional custom override.</div><label style="margin-top:8px">FLOOR STYLE</label><div class="mat-grid">${FLOOR_TYPES.map(ft=>`<button class="mat-btn${(r.materials.floorType||'light_oak')===ft.id?' sel':''}" onclick="setFloorType('${ft.id}')">${ft.name}</button>`).join('')}</div><div class="prop-state${floorColorIsCustom(r)?' custom':''}">${floorColorIsCustom(r)?`Custom color active <button class="prop-link-btn" onclick="resetFloorColorToStyle()">Reset to style</button>`:'Floor color follows the selected floor style.'}</div><label style="margin-top:8px">FLOOR COLOR OVERRIDE</label><div class="paint-row">${FLOOR_TYPES.map(ft=>`<button class="swatch${r.materials.floor===ft.color?' sel':''}" style="background:${ft.color}" onclick="setFloorPaint('${ft.color}')" title="Use ${ft.name} as a custom floor color"></button>`).join('')}</div><div class="prop-tip">Floor style controls texture and the default finish color. Use a swatch only when you want to override that style on purpose.</div><label style="margin-top:8px">TRIM COLOR</label><div class="paint-row">${TRIM_COLORS.map(c=>`<button class="swatch${r.materials.trim===c?' sel':''}" style="background:${c}" onclick="setTrimColor('${c}')"></button>`).join('')}</div>`);
    h+=propSection('Lighting Scene',`<label>LIGHTING MOOD</label><div class="mat-grid tall">${Object.entries(LIGHTING_PRESETS).map(([id,preset])=>`<button class="mat-btn${activeLightingPreset===id?' sel':''}" onclick="setLightingPreset('${id}')">${preset.name}</button>`).join('')}</div><div class="prop-state">Active scene: <strong>${LIGHTING_PRESETS[activeLightingPreset]?.name||'Daylight'}</strong></div><div class="prop-tip">${lightingPresetHelp(activeLightingPreset)}</div><label style="margin-top:8px">CEILING BRIGHTNESS</label><input type="range" min="0.7" max="1.35" step="0.05" value="${r.materials.ceilingBrightness||1}" oninput="setCeilingBrightness(this.value)"><div class="prop-tip">Brightness only changes how much light the ceiling appears to bounce in 3D. It does not change room size.</div><div class="prop-state">${ceilingBrightnessLabel(r)}</div>`);
    h+=propSection('Ceiling Geometry',`<label>CEILING HEIGHT (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(r.height)}" onchange="uRoomHeight(this.value)"><div class="prop-tip">Height changes the room geometry, wall proportions, and how the 3D space feels. It is a structural room value, not a lighting effect.</div><div class="prop-tip">Closets live in the dedicated structural tool, not the furniture catalog.</div>`);
    h+=propSection('Room Direction',`<label>ROOM TYPE</label><div class="mat-grid">${ROOM_TYPES.map(type=>`<button class="mat-btn${(r.roomType||'living_room')===type.id?' sel':''}" onclick="setRoomType('${type.id}')">${type.name}</button>`).join('')}</div><label style="margin-top:8px">DESIGN PRESET</label><div class="mat-grid tall">${DESIGN_PRESETS.map(preset=>`<button class="mat-btn${(r.designPreset||'')===preset.id?' sel':''}" onclick="applyDesignPreset('${preset.id}')">${preset.name}</button>`).join('')}</div><div class="prop-tip">${(DESIGN_PRESETS.find(p=>p.id===r.designPreset)?.note)||'Choose a style direction to coordinate finishes, lighting, and mood.'}</div>`);
    h+=propSection('Expand Home',`<div class="pr"><div><label>ROOM WIDTH (${distanceLabel()})</label><input type="number" step="${distanceInputStep(1)}" value="${distanceInputValue(adjRoomCfg.width)}" onchange="setAdjRoomWidth(this.value)"></div><div><label>ROOM DEPTH (${distanceLabel()})</label><input type="number" step="${distanceInputStep(1)}" value="${distanceInputValue(adjRoomCfg.depth)}" onchange="setAdjRoomDepth(this.value)"></div></div><div class="mat-grid tall"><button class="mat-btn" onclick="attachAdjacentRoom('north')">Add North Room</button><button class="mat-btn" onclick="attachAdjacentRoom('east')">Add East Room</button><button class="mat-btn" onclick="attachAdjacentRoom('south')">Add South Room</button><button class="mat-btn" onclick="attachAdjacentRoom('west')">Add West Room</button></div><div class="prop-tip">Adds a connected room to the current footprint so you can keep building one walkable home.</div>`);
    h+=propSection('Existing Room',`<div class="mat-grid tall"><button class="mat-btn${r.existingRoomMode?' sel':''}" onclick="toggleExistingRoomMode()">Existing Room Mode ${r.existingRoomMode?'On':'Off'}</button><button class="mat-btn${r.ghostExisting?' sel':''}" onclick="toggleGhostExisting()">Ghost Existing ${r.ghostExisting?'On':'Off'}</button><button class="mat-btn${r.hideRemovedExisting?' sel':''}" onclick="toggleHideRemovedExisting()">Hide Removed ${r.hideRemovedExisting?'On':'Off'}</button><button class="mat-btn${r.showPlanLegend?' sel':''}" onclick="togglePlanLegend()">Legend ${r.showPlanLegend?'On':'Off'}</button></div><label style="margin-top:8px">PLAN VIEW</label><div class="mat-grid tall">${Object.entries(PLAN_VIEW_MODES).map(([mode,label])=>`<button class="mat-btn${currentPlanViewMode(r)===mode?' sel':''}" onclick="setPlanViewMode('${mode}')">${label}</button>`).join('')}</div><div class="quick-rotate-row"><button class="pbtn soft" onclick="setSelectedFurnitureSource('existing')">Mark Selected Existing</button><button class="pbtn soft" onclick="setSelectedFurnitureSource('new')">Mark Selected New</button><button class="pbtn soft" onclick="duplicateForRedesign()">Make Redesign Copy</button></div><button class="pbtn soft" style="width:100%;margin-top:8px" onclick="exportComparisonSheet()">Export Before / After Sheet</button><div class="prop-tip">Use this when the real room is already furnished. Existing pieces get design tags so Rose can plan what stays, moves, gets replaced, or disappears.</div>`);
    h+=propSection('Options',`<label>OPTION NAME</label><input value="${esc(r.optionName||'Main')}" onchange="renameCurrentOption(this.value)"><label style="margin-top:8px">OPTION NOTES</label><textarea rows="4" onchange="setCurrentOptionNotes(this.value)" placeholder="What changes does this option explore?">${esc(r.optionNotes||'')}</textarea><div class="quick-rotate-row"><button class="pbtn soft" onclick="createRoomOptionFromCurrent()">Create New Option</button><button class="pbtn soft" onclick="exportComparisonSheet()">Export Compare Sheet</button><button class="pbtn soft" onclick="exportDesignSummary()">Export Summary</button></div><div class="quick-rotate-row"><button class="pbtn soft" style="width:100%" onclick="exportPresentationPDF()">Export Client PDF</button></div><div class="mat-grid tall">${optionSiblings(r).sort((a,b)=>(a.optionName||'').localeCompare(b.optionName||'')).map(opt=>`<button class="mat-btn${opt.id===r.id?' sel':''}" onclick="switchToOption('${opt.id}')">${esc(opt.optionName||'Main')}</button>`).join('')}</div><div class="prop-tip">Options let you save alternate redesign directions for the same room without overwriting each other.</div>`);
    h+=propSection('Mood',`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px"><div class="prop-tip" style="margin:0">Mood tags guide storytelling and ambiance labels for this room.</div><button class="props-close" style="flex-shrink:0" onclick="showMoodHelp()" title="What do moods do?">?</button></div><div class="mood-tags premium">${MOODS.map(m=>`<button class="mood-tag premium${(r.mood||'')===m.toLowerCase()?' sel':''}" onclick="setRoomMood('${m.toLowerCase()}')">${m}</button>`).join('')}</div>`);
    h+=propSection('Style Moves',`<div class="mat-grid tall"><button class="mat-btn" onclick="nudgeStyle('softer')">Make It Softer</button><button class="mat-btn" onclick="nudgeStyle('warmer')">Make It Warmer</button><button class="mat-btn" onclick="nudgeStyle('brighter')">Make It Brighter</button><button class="mat-btn" onclick="nudgeStyle('cozier')">Make It Cozier</button><button class="mat-btn" onclick="nudgeStyle('romantic')">Make It More Romantic</button><button class="mat-btn" onclick="nudgeStyle('elegant')">Make It More Elegant</button><button class="mat-btn" onclick="nudgeStyle('minimal')">Make It More Minimal</button></div><div class="prop-tip">Each move shifts multiple finishes and lighting together so the room changes like a design decision, not just a color swap.</div>`);
    h+=propSection('Editor',`<div class="mat-grid tall"><button class="mat-btn${furnitureSnap?' sel':''}" onclick="toggleFurnitureSnap()">Furniture Snap ${furnitureSnap?'On':'Off'}</button><button class="mat-btn${multiSelectMode?' sel':''}" onclick="toggleMultiSelectMode()">Multi-Select ${multiSelectMode?'On':'Off'}</button><button class="mat-btn" onclick="toggleUnitSystem()">Units: ${unitSystem==='metric'?'Metric':'Imperial'}</button>${furnitureClipboard?.items?.length?`<button class="mat-btn" onclick="pasteFurniture()">Paste ${furnitureClipboard.items.length>1?'Selection':'Furniture'}</button>`:''}</div><div class="prop-tip">Use Multi-Select to tap several furniture pieces on touch devices. Paste drops copied pieces near the center of the current view.</div>`);
    p.innerHTML=h;p.classList.add('on');return}
  if(sel.type==='vertex'){const pt=r.polygon[sel.idx];h=cBtn.replace('$T','Vertex '+(sel.idx+1))+`<label>X (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(pt.x)}" onchange="uV('x',this.value)"><label>Y (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(pt.y)}" onchange="uV('y',this.value)"><button class="pbtn dng" onclick="dV()">Delete</button>`}
  else if(sel.type==='opening'){const op=r.openings[sel.idx];h=cBtn.replace('$T',op.type==='door'?'Door':'Window')+`<label>OFFSET (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(op.offset)}" onchange="uO('offset',this.value)"><label>WIDTH (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(op.width)}" onchange="uO('width',this.value)">${op.type==='door'?`<label>SWING DIRECTION</label><select onchange="uO('swing',this.value)"><option value="in"${op.swing==='in'?' selected':''}>In</option><option value="out"${op.swing==='out'?' selected':''}>Out</option></select><label>HINGE SIDE</label><select onchange="uO('hinge',this.value)"><option value="left"${op.hinge==='left'?' selected':''}>Left</option><option value="right"${op.hinge==='right'?' selected':''}>Right</option></select>`:`<label>SILL HEIGHT (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(op.sillHeight||3)}" onchange="uO('sillHeight',this.value)"><label>HEIGHT (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(op.height||4)}" onchange="uO('height',this.value)"><div class="prop-tip">Drag this opening along any wall to reposition it.</div>`}<button class="pbtn dng" onclick="dO()">Delete</button>`}
  else if(sel.type==='structure'){const st=r.structures[sel.idx];if(st.rect)h=cBtn.replace('$T','Closet')+`<div class="pr"><div><label>X (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(st.rect.x)}" onchange="uS('x',this.value)"></div><div><label>Y (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(st.rect.y)}" onchange="uS('y',this.value)"></div></div><div class="pr"><div><label>W (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(st.rect.w)}" onchange="uS('w',this.value)"></div><div><label>D (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(st.rect.h)}" onchange="uS('h',this.value)"></div></div><label>FINISH</label><select onchange="uS('finish',this.value)">${CLOSET_FINISHES.map(f=>`<option value="${f.id}"${st.finish===f.id?' selected':''}>${f.name}</option>`).join('')}</select><div class="prop-tip">Built-in styling now belongs to the selected closet.</div><button class="pbtn dng" onclick="dS()">Delete</button>`;else h=cBtn.replace('$T','Partition')+`<button class="pbtn dng" onclick="dS()">Delete</button>`}
  else if(sel.type==='furniture'){
    const records=selectedFurnitureRecords();
    if(records.length>1){
      const centroid=selectionCentroid(records);
      const existingCount=records.filter(item=>item.source==='existing').length;
      h=cBtn.replace('$T',`${records.length} Pieces Selected`)+`<div class="prop-tip">Tap more furniture while Multi-Select is on, then move the group together by dragging any selected piece.</div><div class="pr"><div><label>CENTER X (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(centroid.x)}" disabled></div><div><label>CENTER Y (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(centroid.z)}" disabled></div></div><div class="quick-rotate-row"><button class="pbtn soft" onclick="copySelectedFurniture()">Copy</button><button class="pbtn soft" onclick="duplicateSelectedFurniture()">Duplicate</button><button class="pbtn soft" onclick="pasteFurniture()">Paste</button></div><div class="quick-rotate-row"><button class="pbtn soft" onclick="rotateSelectedFurniture(-15)">Rotate Left</button><button class="pbtn soft" onclick="turnAroundSelectedFurniture()">Turn Around</button><button class="pbtn soft" onclick="rotateSelectedFurniture(15)">Rotate Right</button></div><div class="quick-rotate-row"><button class="pbtn soft" onclick="setSelectedFurnitureSource('existing')">Mark Existing</button><button class="pbtn soft" onclick="setSelectedFurnitureSource('new')">Mark New</button><button class="pbtn soft" onclick="toggleSelectedFurnitureLock()">${records.every(item=>item.locked)?'Unlock':'Lock'}</button></div>${existingCount?`<label>PLAN ACTION</label><div class="mat-grid tall">${Object.entries(EXISTING_ACTIONS).map(([key,meta])=>`<button class="mat-btn" onclick="setSelectedRedesignAction('${key}')">${meta.label}</button>`).join('')}</div><div class="quick-rotate-row"><button class="pbtn soft" onclick="duplicateForRedesign()">Make Redesign Copy</button><button class="pbtn soft" onclick="pairSelectedReplacement()">Pair Replacement</button><button class="pbtn soft" onclick="clearSelectedReplacementPair()">Clear Pair</button></div>`:''}<label>FINISH COLOR</label><div class="asset-color-grid"><button class="asset-color-chip" style="background:linear-gradient(135deg,#fff,#efe7db)" onclick="setFurnitureFinish('')"></button>${ASSET_FINISHES.map(c=>`<button class="asset-color-chip" style="background:${c}" onclick="setFurnitureFinish('${c}')"></button>`).join('')}</div><button class="pbtn dng" onclick="dF()">Delete Selection</button>`;
    }else{
      const f=r.furniture[sel.idx];
      const pairText=f.source==='existing'
        ? (pairedReplacementFor(f,r)?.label?`Paired with: ${pairedReplacementFor(f,r).label}`:'No replacement paired yet.')
        : (linkedExistingFor(f,r)?.label?`Replaces: ${linkedExistingFor(f,r).label}`:'Not paired to an existing piece.');
      h=cBtn.replace('$T',f.label||'Item')+`<label>LABEL</label><input value="${esc(f.label||'')}" onchange="uF('label',this.value)"><div class="pr"><div><label>W (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(f.w||2)}" onchange="uF('w',this.value)"></div><div><label>D (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.5)}" value="${distanceInputValue(f.d||1.5)}" onchange="uF('d',this.value)"></div></div><label>ROTATION</label><input type="number" step="15" value="${f.rotation||0}" onchange="uF('rotation',this.value)"><div class="prop-tip">The little triangle in 2D shows the front of the piece.</div><div class="quick-rotate-row"><button class="pbtn soft" onclick="copySelectedFurniture()">Copy</button><button class="pbtn soft" onclick="duplicateSelectedFurniture()">Duplicate</button><button class="pbtn soft" onclick="pasteFurniture()">Paste</button></div><div class="quick-rotate-row"><button class="pbtn soft" onclick="rotateSelectedFurniture(-15)">Rotate Left</button><button class="pbtn soft" onclick="turnAroundSelectedFurniture()">Turn Around</button><button class="pbtn soft" onclick="rotateSelectedFurniture(15)">Rotate Right</button></div><label>MOUNT</label><select onchange="uF('mountType',this.value)"><option value="floor"${f.mountType==='floor'?' selected':''}>Floor</option><option value="wall"${f.mountType==='wall'?' selected':''}>Wall</option><option value="surface"${f.mountType==='surface'?' selected':''}>Surface</option><option value="ceiling"${f.mountType==='ceiling'?' selected':''}>Ceiling</option></select><label>ELEVATION (${distanceLabel()})</label><input type="number" step="${distanceInputStep(.25)}" value="${distanceInputValue(f.elevation||0)}" onchange="uF('elevation',this.value)"><label>ROOM ROLE</label><div class="mat-grid tall"><button class="mat-btn${f.source==='existing'?' sel':''}" onclick="setSelectedFurnitureSource('existing')">Existing Piece</button><button class="mat-btn${f.source!=='existing'?' sel':''}" onclick="setSelectedFurnitureSource('new')">New Piece</button><button class="mat-btn${f.locked?' sel':''}" onclick="toggleSelectedFurnitureLock()">${f.locked?'Locked':'Unlocked'}</button></div>${f.source==='existing'?`<label>PLAN ACTION</label><div class="mat-grid tall">${Object.entries(EXISTING_ACTIONS).map(([key,meta])=>`<button class="mat-btn${f.redesignAction===key?' sel':''}" onclick="setSelectedRedesignAction('${key}')">${meta.label}</button>`).join('')}</div><div class="quick-rotate-row"><button class="pbtn soft" onclick="duplicateForRedesign()">Make Redesign Copy</button><button class="pbtn soft" onclick="pairSelectedReplacement()">Pair Replacement</button><button class="pbtn soft" onclick="clearSelectedReplacementPair()">Clear Pair</button></div><div class="prop-tip">${pairText}</div>`:`<div class="quick-rotate-row"><button class="pbtn soft" onclick="pairSelectedReplacement()">Pair To Existing</button><button class="pbtn soft" onclick="clearSelectedReplacementPair()">Clear Pair</button><button class="pbtn soft" onclick="setSelectedFurnitureSource('new')">Keep As New</button></div><div class="prop-tip">${pairText}</div>`}<label>FINISH COLOR</label><div class="asset-color-grid"><button class="asset-color-chip${!f.finishColor?' sel':''}" style="background:linear-gradient(135deg,#fff,#efe7db)" onclick="setFurnitureFinish('')"></button>${ASSET_FINISHES.map(c=>`<button class="asset-color-chip${f.finishColor===c?' sel':''}" style="background:${c}" onclick="setFurnitureFinish('${c}')"></button>`).join('')}</div><button class="pbtn dng" onclick="dF()">Delete</button>`;
    }
  }
  p.innerHTML=h;p.classList.add('on')}
function hideP(){const panel=document.getElementById('propsP');panel.classList.remove('on','peek');document.getElementById('propsTab').classList.toggle('on',panelHidden&&!!curRoom)}
function closeP(){panelHidden=true;hideP()}
function openP(){panelHidden=false;showP()}
function uV(k,v){curRoom.polygon[sel.idx][k]=parseDistanceInput(v,curRoom.polygon[sel.idx][k]);curRoom.walls=genWalls(curRoom);pushU();draw()}
function dV(){if(curRoom.polygon.length<=3){toast('Need at least 3');return}curRoom.polygon.splice(sel.idx,1);curRoom.walls=genWalls(curRoom);sel={type:null,idx:-1};panelHidden=false;pushU();draw();showP()}
function uO(k,v){const o=curRoom.openings[sel.idx];if(k==='swing'||k==='hinge')o[k]=v;else o[k]=parseDistanceInput(v,o[k]||0);clampOpeningToWall(o);pushU();draw();showP();scheduleRebuild3D()}
function dO(){curRoom.openings.splice(sel.idx,1);sel={type:null,idx:-1};panelHidden=false;pushU();draw();showP();scheduleRebuild3D()}
function uS(k,v){const st=curRoom.structures[sel.idx];if(st.rect){if(k==='finish')st.finish=v;else st.rect[k]=parseDistanceInput(v,st.rect[k]||0)}pushU();draw();showP();scheduleRebuild3D()}
function dS(){curRoom.structures.splice(sel.idx,1);sel={type:null,idx:-1};panelHidden=false;pushU();draw();showP();scheduleRebuild3D()}
function uF(k,v){
  const records=selectedFurnitureRecords();
  if(!records.length)return;
  records.forEach(f=>{
    if(k==='label'){f[k]=v}
    else if(k==='mountType'){f[k]=v;if(v==='wall'&&(!f.elevation||f.elevation<2))f.elevation=defaultElevation(v,f.assetKey,resolveLabel(f.label))}
    else if(k==='rotation')f[k]=parseFloat(v)||0;
    else f[k]=parseDistanceInput(v,f[k]||0);
  });
  pushU();draw();showP();scheduleRebuild3D()
}
function dF(){deleteSelectedFurniture()}
