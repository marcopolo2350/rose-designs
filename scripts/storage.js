// ── DB ──
const DB='RoseForRose',DBST='rooms';
function odb(){return new Promise((r,j)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=e=>{if(!e.target.result.objectStoreNames.contains(DBST))e.target.result.createObjectStore(DBST)};q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})}
function scopedDbKey(k){return storageKey(`db::${k}`)}
async function dg(k,{legacy=false}={}){try{const d=await odb();return new Promise(r=>{const q=d.transaction(DBST,'readonly').objectStore(DBST).get(legacy?k:scopedDbKey(k));q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}catch(e){return null}}
async function ds(k,v){try{const d=await odb();return new Promise(r=>{const t=d.transaction(DBST,'readwrite');t.objectStore(DBST).put(v,scopedDbKey(k));t.oncomplete=()=>r();t.onerror=()=>r()})}catch(e){}}
function profileSeenKey(){return `profile_seen_${activeProfile}`}
function updateProfileChip(){const chip=document.getElementById('profileChip');if(chip)chip.textContent=PROFILE_LABELS[activeProfile]||"Rose's Space"}
function openProfileSwitcher(){document.getElementById('profileMod')?.classList.add('on')}
function closeProfileSwitcher(){document.getElementById('profileMod')?.classList.remove('on')}
async function migrateLegacyProjectsIntoProfile(){
  const scoped=await dg('projects');
  if(scoped&&Array.isArray(scoped)&&scoped.length)return;
  const legacy=await dg('projects',{legacy:true});
  if(legacy&&Array.isArray(legacy)&&legacy.length)await ds('projects',legacy);
}
function loadActiveProfile(){
  try{
    const raw=localStorage.getItem(PROFILE_LOCAL_KEY);
    if(raw&&PROFILE_LABELS[raw])activeProfile=raw;
  }catch(e){}
  updateProfileChip();
}

// ── STATE ──
const DEV_MODE=location.hash.includes('dev')||location.search.includes('dev=1');
let projects=[],curRoom=null,tool='select',selPreset='living_room';
let canvas,ctx,vOff={x:0,y:0},vScale=1;
let sel={type:null,idx:-1},isDrag=false,dStart={x:0,y:0},dOrig=null;
let closetSt=null,partSt=null,pendEnd=null,dimAnnStart=null,pendDimEnd=null;
let undoSt=[],redoSt=[],resH=null;
let multiSelFurnitureIds=[],furnitureClipboard=null;
let drawMode=false,drawPts=[],drawCur=null,angSnap=true;
let is3D=false,scene,cam,ren,raf3d;
let camMode='orbit',cYaw=Math.PI*.25,cPitch=.5,cDist=20;
let fpPos={x:0,y:4.5,z:0};
let activeWalkDir=0,activeTurnDir=0,orbitTarget={x:0,y:0,z:0};
let walkControlLayout='auto';
let d3=false,p3x=0,p3y=0;
let pinchDist=0,isPinch=false;
let gltfLoader=null,assetWarned=false,orbitVel={yaw:0,pitch:0,zoom:0};
const assetCache=new Map();
let verify3D=null;
let presentationMode=false,furnQuery='';
let furnitureSnap=true,multiSelectMode=false,unitSystem='imperial',pasteCascade=0;
let compare3DMode=false;
let activeProjectFloorId=null;
const EXTERIOR_MODE_ENABLED=false;
const ROOM_HISTORY_PREFIX='room_history_';
const FEET_TO_METERS=.3048;
const SQFT_TO_SQM=.092903;
const FURNITURE_GRID=.5;
const EXISTING_ACTIONS={
  keep:{label:'Keep',stroke:'#5E8770',fill:'rgba(94,135,112,.12)'},
  move:{label:'Move',stroke:'#C18A4A',fill:'rgba(193,138,74,.12)'},
  replace:{label:'Replace',stroke:'#9B6FA6',fill:'rgba(155,111,166,.12)'},
  remove:{label:'Remove',stroke:'#B56767',fill:'rgba(181,103,103,.12)'}
};
const PLAN_VIEW_MODES={
  combined:'Show Both',
  existing:'Existing Only',
  redesign:'Concept Only'
};
const PLAN_LAYER_DEFAULTS={
  reference:true,
  walls:true,
  openings:true,
  furniture_existing:true,
  furniture_new:true,
  room_labels:true,
  dimensions:true,
  annotations:true
};
const PLAN_LAYER_META=[
  {id:'reference',label:'Reference Overlay'},
  {id:'walls',label:'Walls'},
  {id:'openings',label:'Doors & Windows'},
  {id:'furniture_existing',label:'Existing Furniture'},
  {id:'furniture_new',label:'New Furniture'},
  {id:'room_labels',label:'Room Labels'},
  {id:'dimensions',label:'Dimensions'},
  {id:'annotations',label:'Annotations'}
];
const ASSET_FINISHES=['#F5F2EC','#D8C1A4','#B58F68','#7D624F','#595F66','#A7B79D','#CDA8A4','#3F3A36'];
const FLOOR_TYPES=[
  {id:'light_oak',name:'Light Oak Hardwood',family:'wood',color:'#d0b18d',accent:'#ead6bb',roughness:.84,repeat:3.9},
  {id:'medium_oak',name:'Medium Oak Hardwood',family:'wood',color:'#b78c61',accent:'#d5b086',roughness:.8,repeat:3.7},
  {id:'dark_walnut',name:'Dark Walnut Hardwood',family:'wood',color:'#6f523f',accent:'#8d6d55',roughness:.78,repeat:3.4},
  {id:'cool_gray_wood',name:'Cool Gray Wood',family:'wood',color:'#9b9993',accent:'#bdbab5',roughness:.86,repeat:3.8},
  {id:'warm_stone_tile',name:'Warm Stone Tile',family:'tile',color:'#cdbca7',accent:'#efe5d8',roughness:.9,repeat:2.6},
  {id:'matte_porcelain',name:'Matte Porcelain Tile',family:'tile',color:'#d8d7d2',accent:'#f6f4ef',roughness:.93,repeat:2.8},
  {id:'checker_tile',name:'Checker Tile',family:'checker',color:'#d8d0c4',accent:'#5b554f',roughness:.88,repeat:2.2},
  {id:'polished_concrete',name:'Polished Concrete',family:'concrete',color:'#a7a4a0',accent:'#d1ccc5',roughness:.58,repeat:2.1},
];
const FLOOR_SWATCHES=FLOOR_TYPES.map(f=>f.color);
const WALL_PALETTES=[
  {id:'warm_white',name:'Warm White',color:'#F3EFE7',sheen:.08},
  {id:'soft_beige',name:'Soft Beige',color:'#E8D7C5',sheen:.09},
  {id:'greige',name:'Greige',color:'#CFC4B6',sheen:.08},
  {id:'sage',name:'Sage',color:'#BCCAB9',sheen:.07},
  {id:'dusty_rose',name:'Dusty Rose',color:'#D2B0AD',sheen:.07},
  {id:'muted_blue',name:'Muted Blue',color:'#AEBCCC',sheen:.06},
  {id:'charcoal_accent',name:'Charcoal Accent',color:'#55525A',sheen:.04},
];
const TRIM_COLORS=['#F8F5F0','#D8CBB8','#B79E84','#6F7C8A','#3F3A36'];
const LIGHTING_PRESETS={
  daylight:{name:'Daylight',background:'#d6e5f2',ambient:1.02,dir:1.72,dirColor:0xf9fdff,exposure:1.32,warm:0xFFF8EC,practical:.04,fogNear:38,fogFar:120,hdri:'daylight',tod:0.5},
  warm_evening:{name:'Warm Evening',background:'#dcc3af',ambient:0.46,dir:0.58,dirColor:0xffd09c,exposure:0.94,warm:0xFFC27F,practical:.82,fogNear:22,fogFar:76,hdri:'warm',tod:0.78},
  soft_lamp_glow:{name:'Soft Lamp Glow',background:'#cdb6a6',ambient:0.26,dir:0.2,dirColor:0xffc991,exposure:0.8,warm:0xFFB96E,practical:1.12,fogNear:18,fogFar:58,hdri:'warm',tod:0.86},
  moody:{name:'Moody',background:'#8c878d',ambient:0.12,dir:0.16,dirColor:0xbfd0e6,exposure:0.62,warm:0xFFAA62,practical:.56,fogNear:15,fogFar:48,hdri:'evening',tod:0.94},
  bright_studio:{name:'Bright Studio',background:'#eef4f8',ambient:1.14,dir:1.9,dirColor:0xffffff,exposure:1.42,warm:0xFFF6E7,practical:.02,fogNear:44,fogFar:132,hdri:'daylight',tod:0.45},
  // New cinematic presets (Phase ✨)
  golden_hour:{name:'Golden Hour',background:'#e8c79a',ambient:0.62,dir:1.28,dirColor:0xffc074,exposure:1.14,warm:0xFFD38A,practical:.28,fogNear:26,fogFar:92,hdri:'warm',tod:0.72},
  overcast:{name:'Overcast',background:'#c8ccd2',ambient:1.22,dir:0.54,dirColor:0xe4e9ee,exposure:1.06,warm:0xECEEF2,practical:.08,fogNear:30,fogFar:104,hdri:'daylight',tod:0.52},
  lamp_lit:{name:'Lamp-Lit',background:'#2b2a32',ambient:0.08,dir:0.06,dirColor:0x7a8aa6,exposure:0.72,warm:0xFF9E5C,practical:1.42,fogNear:12,fogFar:42,hdri:'evening',tod:0.96},
  dawn:{name:'Dawn',background:'#c8b8b0',ambient:0.34,dir:0.42,dirColor:0xf3c6b0,exposure:0.88,warm:0xFFDCC4,practical:.62,fogNear:24,fogFar:78,hdri:'warm',tod:0.14},
};
const ROOM_TYPES=[
  {id:'living_room',name:'Living Room',suggestions:['sofa_modern','sofa_large','table_coffee','rug','lamp_floor','wall_art_01','plant_palm']},
  {id:'bedroom',name:'Bedroom',suggestions:['bed_king','nightstand','nightstand_alt','dresser','rug_round','lamp_table','mirror']},
  {id:'dining_room',name:'Dining Room',suggestions:['dining_table','table_round_large','bench','chair','runner_rug','lamp_pendant','wall_art_04']},
  {id:'office',name:'Office',suggestions:['desk','chair_office','bookcase_books','shelf_small','lamp_table','plant_leafy','rug']},
  {id:'nursery',name:'Nursery',suggestions:['bed_twin','bunk_bed','dresser_tall','plant_round','rug_round','lamp_ceiling','wall_art_06']},
  {id:'entry',name:'Entry / Hall',suggestions:['console_low','mirror','runner_rug','lamp_wall','bench','plant_round']},
  {id:'kitchen',name:'Kitchen',suggestions:['kitchen_cabinet_base','kitchen_island','kitchen_fridge','kitchen_stove','kitchen_sink','kitchen_hood']},
  {id:'bathroom',name:'Bathroom',suggestions:['bathroom_vanity_single','bathroom_toilet','bathroom_tub','bathroom_mirror','bathroom_towel_bar']},
  {id:'laundry',name:'Laundry',suggestions:['washing_machine','kitchen_cabinet_base','shelf_small','trashcan_small']},
];
const DESIGN_PRESETS=[
  {id:'warm_modern',name:'Warm Modern',roomType:'living_room',wallFinish:'soft_beige',floorType:'medium_oak',trim:'#D8CBB8',lightingPreset:'warm_evening',ceilingBrightness:1.05,mood:'elegant',note:'Soft oak, beige walls, and cozy evening light.'},
  {id:'quiet_luxury',name:'Quiet Luxury',roomType:'bedroom',wallFinish:'greige',floorType:'dark_walnut',trim:'#F8F5F0',lightingPreset:'soft_lamp_glow',ceilingBrightness:1.02,mood:'keep forever',note:'Deeper wood, clean trim, and tailored calm.'},
  {id:'tailored_masculine',name:'Tailored Masculine',roomType:'office',wallFinish:'charcoal_accent',floorType:'dark_walnut',trim:'#B79E84',lightingPreset:'moody',ceilingBrightness:.94,mood:'moody',note:'Richer contrast with darker, more grounded materials.'},
  {id:'airy_minimal',name:'Airy Minimal',roomType:'living_room',wallFinish:'warm_white',floorType:'light_oak',trim:'#F8F5F0',lightingPreset:'daylight',ceilingBrightness:1.14,mood:'bright',note:'Clean light finishes and soft open daylight.'},
];
const ROOM_STARTERS=[
  {id:'living_room',name:'Living Room',shape:'rect',width:16,depth:13,height:9,roomType:'living_room',designPreset:'warm_modern',tag:'Gather',hint:'A balanced layout with soft seating and a place to land.'},
  {id:'bedroom',name:'Bedroom',shape:'rect',width:14,depth:14,height:9,roomType:'bedroom',designPreset:'quiet_luxury',tag:'Rest',hint:'Warm light, layered textiles, and a gentle bedroom rhythm.'},
  {id:'dining_room',name:'Dining Room',shape:'rect',width:15,depth:12,height:9,roomType:'dining_room',designPreset:'quiet_luxury',tag:'Host',hint:'A room that feels ready for dinner and slow conversation.'},
  {id:'office',name:'Office',shape:'rect',width:13,depth:11,height:9,roomType:'office',designPreset:'tailored_masculine',tag:'Focus',hint:'Grounded materials and a calmer work-focused setup.'},
  {id:'nursery',name:'Nursery',shape:'rect',width:12,depth:12,height:9,roomType:'nursery',designPreset:'airy_minimal',tag:'Tender',hint:'Soft light, clear flow, and room to breathe.'},
  {id:'reading_nook',name:'Reading Nook',shape:'lshape',width:12,depth:10,height:9,roomType:'living_room',designPreset:'warm_modern',tag:'Quiet',hint:'A cozier corner with a chair, lamp, rug, and something green.'},
  {id:'studio',name:'Studio',shape:'lshape',width:20,depth:16,height:10,roomType:'living_room',designPreset:'airy_minimal',tag:'Open',hint:'A larger starter for shaping one connected home space.'},
  {id:'kitchen',name:'Kitchen',shape:'rect',width:14,depth:12,height:9,roomType:'kitchen',designPreset:'warm_modern',tag:'Cook',hint:'Counters, cabinets, and room to move.'},
  {id:'bathroom',name:'Bathroom',shape:'rect',width:10,depth:8,height:9,roomType:'bathroom',designPreset:'airy_minimal',tag:'Refresh',hint:'Vanity, shower or tub, clean surfaces.'},
  {id:'laundry',name:'Laundry',shape:'rect',width:9,depth:7,height:9,roomType:'laundry',designPreset:'airy_minimal',tag:'Refresh',hint:'Washer, storage, and a little room to breathe.'},
  {id:'closet_room',name:'Closet / Dressing Room',shape:'rect',width:11,depth:9,height:9,roomType:'bedroom',designPreset:'quiet_luxury',tag:'Dress',hint:'Made for mirrors, storage, and built-ins.'},
  // Phase 6A — new starters
  {id:'home_theater',name:'Home Theater',shape:'rect',width:16,depth:20,height:9,roomType:'living_room',designPreset:'tailored_masculine',tag:'Watch',hint:'A deep, focused room for cinema nights.'},
  {id:'mudroom',name:'Mudroom / Entry',shape:'rect',width:8,depth:10,height:9,roomType:'entry',designPreset:'warm_modern',tag:'Arrive',hint:'Drop zone with hooks, bench, and a mat.'},
  {id:'kids_room',name:'Kids Room',shape:'rect',width:12,depth:13,height:9,roomType:'bedroom',designPreset:'airy_minimal',tag:'Play',hint:'Bunk beds, soft rugs, and room to play.'},
  {id:'primary_suite',name:'Primary Suite',shape:'lshape',width:20,depth:16,height:9,roomType:'bedroom',designPreset:'quiet_luxury',tag:'Retreat',hint:'King bed, sitting area, and a dressing nook.'},
  {id:'free',name:'Free Draw',shape:'free',width:14,depth:12,height:9,roomType:'living_room',designPreset:'',tag:'Sketch',hint:'Start with a blank page and draw your own footprint.'},
];
const CLOSET_FINISHES=[
  {id:'white_shaker',name:'White Shaker',body:'#F3F0EB',door:'#FBF9F4',trim:'#D9D2C8',style:'double_doors'},
  {id:'natural_oak',name:'Natural Oak',body:'#C4A07B',door:'#D5B189',trim:'#9A7755',style:'double_doors'},
  {id:'dark_walnut',name:'Dark Walnut',body:'#6E513E',door:'#7A5A44',trim:'#3E2D23',style:'double_doors'},
  {id:'open_shelving',name:'Open Shelving',body:'#D8C6B3',door:'#D8C6B3',trim:'#A08163',style:'open_shelving'},
  {id:'sliding_doors',name:'Sliding Doors',body:'#EEE8DE',door:'#DDD3C3',trim:'#B8A891',style:'sliding_doors'},
  {id:'double_doors',name:'Double Doors',body:'#F1E9DC',door:'#FAF4EA',trim:'#C7B79F',style:'double_doors'},
];
const MODEL_REGISTRY={
  sofa:{file:'sofa_modern.glb',category:'sofa',mountType:'floor',defaultScale:1,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  bed:{file:'bed_king.glb',category:'bed',mountType:'floor',defaultScale:1,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  chair:{file:'chair.glb',category:'chair',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  desk:{file:'desk.glb',category:'desk',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  table_coffee:{file:'table_coffee.glb',category:'table',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  cabinet:{file:'cabinet.glb',category:'storage',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  shelving:{file:'shelving.glb',category:'shelving',mountType:'wall',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall'},
  lamp_floor:{file:'lamp_floor.glb',category:'lamp',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  lamp_wall:{file:'lamp_wall.glb',category:'lamp',mountType:'wall',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall'},
  plant_floor:{file:'plant_floor.glb',category:'plant',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  plant_small:{file:'plant_small.glb',category:'plant',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:false,fit:'surface'},
  rug:{file:'rug.glb',category:'rug',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0.02,snapToWall:false,snapToFloor:true,fit:'footprint'},
  mirror:{file:'mirror.glb',category:'mirror',mountType:'wall',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall'},
  wall_art_01:{file:'wall_art_01.glb',category:'wall_art',mountType:'wall',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall'},
  wall_art_04:{file:'wall_art_04.glb',category:'wall_art',mountType:'wall',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall'},
  wall_art_06:{file:'wall_art_06.glb',category:'wall_art',mountType:'wall',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall'},
  curtains:{file:'curtains.glb',category:'curtains',mountType:'wall',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:true,snapToFloor:false,snapToOpening:true,fit:'opening'},
  bookshelf:{file:'bookcase_books.glb',category:'bookshelf',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  nightstand:{file:'nightstand.glb',category:'nightstand',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  dresser:{file:'dresser.glb',category:'dresser',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  tv_console:{file:'tv_console.glb',category:'tv_console',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  dining_table:{file:'dining_table.glb',category:'dining_table',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  bench:{file:'bench.glb',category:'bench',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  blinds:{file:'blinds.glb',category:'blinds',mountType:'wall',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:true,snapToFloor:false,snapToOpening:true,fit:'opening'},
  sofa_medium:{file:'sofa_medium.glb',category:'sofa',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  sofa_l:{file:'sofa_l.glb',category:'sofa',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  sofa_compact:{file:'sofa_compact.glb',category:'sofa',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  sofa_grand:{file:'sofa_grand.glb',category:'sofa',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  sofa_small:{file:'sofa_small.glb',category:'sofa',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  sofa_large:{file:'sofa_large.glb',category:'sofa',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  sofa_modern:{file:'sofa_modern.glb',category:'sofa',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  chair_office:{file:'chair_office.glb',category:'chair',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  rug_round:{file:'rug_round.glb',category:'rug',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0.02,snapToWall:false,snapToFloor:true,fit:'footprint'},
  runner_rug:{file:'runner_rug.glb',category:'rug',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0.02,snapToWall:false,snapToFloor:true,fit:'footprint'},
  bed_king:{file:'bed_king.glb',category:'bed',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  bed_double:{file:'bed_double.glb',category:'bed',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  bed_twin:{file:'bed_twin.glb',category:'bed',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  bunk_bed:{file:'bunk_bed.glb',category:'bed',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  table_round_large:{file:'table_round_large.glb',category:'table',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  table_round_small:{file:'table_round_small.glb',category:'table',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  stool:{file:'stool.glb',category:'chair',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  shelf_small:{file:'shelf_small.glb',category:'shelving',mountType:'wall',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall'},
  bookcase_books:{file:'bookcase_books.glb',category:'bookshelf',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  closet_tall:{file:'closet_tall.glb',category:'storage',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  closet_full:{file:'closet_full.glb',category:'storage',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  closet_short:{file:'closet_short.glb',category:'storage',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  nightstand_alt:{file:'nightstand_alt.glb',category:'nightstand',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  dresser_tall:{file:'dresser_tall.glb',category:'dresser',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  console_low:{file:'console_low.glb',category:'tv_console',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  fireplace:{file:'fireplace.glb',category:'decor',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  plant_cactus:{file:'plant_cactus.glb',category:'plant',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  plant_leafy:{file:'plant_leafy.glb',category:'plant',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  plant_palm:{file:'plant_palm.glb',category:'plant',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  plant_round:{file:'plant_round.glb',category:'plant',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  lamp_table:{file:'lamp_table.glb',category:'lamp',mountType:'surface',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:false,fit:'surface'},
  lamp_chandelier:{file:'lamp_chandelier.glb',category:'lamp',mountType:'ceiling',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:false,fit:'surface'},
  lamp_ceiling:{file:'lamp_ceiling.glb',category:'lamp',mountType:'ceiling',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:false,fit:'surface'},
  lamp_stand:{file:'lamp_stand.glb',category:'lamp',mountType:'floor',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:true,fit:'footprint'},
  lamp_cube:{file:'lamp_cube.glb',category:'lamp',mountType:'ceiling',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:false,fit:'surface'},
  lamp_pendant:{file:'lamp_pendant.glb',category:'lamp',mountType:'ceiling',defaultScale:1,defaultRotation:0,yOffset:0,snapToWall:false,snapToFloor:false,fit:'surface'},
  // ── Poly Haven CC0 Models ──
  ph_armchair_01:{file:'ph_armchair_01.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_armchair_modern:{file:'ph_armchair_modern.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_chair_midcentury:{file:'ph_chair_midcentury.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_sofa_01:{file:'ph_sofa_01.glb',category:'sofa',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_sofa_02:{file:'ph_sofa_02.glb',category:'sofa',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_sofa_03:{file:'ph_sofa_03.glb',category:'sofa',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_sofa_painted:{file:'ph_sofa_painted.glb',category:'sofa',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_ottoman_01:{file:'ph_ottoman_01.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_chair_green:{file:'ph_chair_green.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_chair_chinese:{file:'ph_chair_chinese.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_chair_gallinera:{file:'ph_chair_gallinera.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_chair_painted:{file:'ph_chair_painted.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_bar_chair:{file:'ph_bar_chair.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_stool_metal:{file:'ph_stool_metal.glb',category:'seating',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_coffee_table_01:{file:'ph_coffee_table_01.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_coffee_round:{file:'ph_coffee_round.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_coffee_modern:{file:'ph_coffee_modern.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_coffee_modern_2:{file:'ph_coffee_modern_2.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_coffee_gothic:{file:'ph_coffee_gothic.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_coffee_industrial:{file:'ph_coffee_industrial.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_table_wooden:{file:'ph_table_wooden.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_table_wooden_2:{file:'ph_table_wooden_2.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_table_round:{file:'ph_table_round.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_table_painted:{file:'ph_table_painted.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_table_gallinera:{file:'ph_table_gallinera.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_side_table:{file:'ph_side_table.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_side_table_tall:{file:'ph_side_table_tall.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_shelf_01:{file:'ph_shelf_01.glb',category:'shelving',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_bookshelf:{file:'ph_bookshelf.glb',category:'bookshelf',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_console_01:{file:'ph_console_01.glb',category:'storage',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_console_chinese:{file:'ph_console_chinese.glb',category:'storage',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_cabinet_modern:{file:'ph_cabinet_modern.glb',category:'storage',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_cabinet_painted:{file:'ph_cabinet_painted.glb',category:'storage',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_cabinet_vintage:{file:'ph_cabinet_vintage.glb',category:'storage',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_cabinet_drawer:{file:'ph_cabinet_drawer.glb',category:'storage',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_cabinet_chinese:{file:'ph_cabinet_chinese.glb',category:'storage',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_chandelier_01:{file:'ph_chandelier_01.glb',category:'lamp',mountType:'ceiling',defaultScale:1,yOffset:0,fit:'surface'},
  ph_chandelier_02:{file:'ph_chandelier_02.glb',category:'lamp',mountType:'ceiling',defaultScale:1,yOffset:0,fit:'surface'},
  ph_chandelier_03:{file:'ph_chandelier_03.glb',category:'lamp',mountType:'ceiling',defaultScale:1,yOffset:0,fit:'surface'},
  ph_chandelier_chinese:{file:'ph_chandelier_chinese.glb',category:'lamp',mountType:'ceiling',defaultScale:1,yOffset:0,fit:'surface'},
  ph_chandelier_lantern:{file:'ph_chandelier_lantern.glb',category:'lamp',mountType:'ceiling',defaultScale:1,yOffset:0,fit:'surface'},
  ph_lamp_ceiling:{file:'ph_lamp_ceiling.glb',category:'lamp',mountType:'ceiling',defaultScale:1,yOffset:0,fit:'surface'},
  ph_lamp_desk:{file:'ph_lamp_desk.glb',category:'lamp',mountType:'surface',defaultScale:1,yOffset:0,fit:'surface'},
  ph_lamp_industrial:{file:'ph_lamp_industrial.glb',category:'lamp',mountType:'ceiling',defaultScale:1,yOffset:0,fit:'surface'},
  ph_lamp_pipe:{file:'ph_lamp_pipe.glb',category:'lamp',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_bed_gothic:{file:'ph_bed_gothic.glb',category:'bed',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_nightstand_classic:{file:'ph_nightstand_classic.glb',category:'nightstand',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_nightstand:{file:'ph_nightstand.glb',category:'nightstand',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_plant_potted_01:{file:'ph_plant_potted_01.glb',category:'plant',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_plant_potted_02:{file:'ph_plant_potted_02.glb',category:'plant',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_plant_potted_04:{file:'ph_plant_potted_04.glb',category:'plant',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_planter_clay:{file:'ph_planter_clay.glb',category:'plant',mountType:'floor',defaultScale:1,yOffset:0,fit:'footprint'},
  ph_mirror_ornate:{file:'ph_mirror_ornate.glb',category:'mirror',mountType:'wall',defaultScale:1,yOffset:0,fit:'wall',snapToWall:true,wallFacingMode:'face_interior',defaultFacing:'interior'},
  ph_vase_ceramic_01:{file:'ph_vase_ceramic_01.glb',category:'decor',mountType:'surface',defaultScale:1,yOffset:0,fit:'surface'},
  ph_vase_brass_01:{file:'ph_vase_brass_01.glb',category:'decor',mountType:'surface',defaultScale:1,yOffset:0,fit:'surface'},
  kitchen_cabinet_base:{file:'cabinet.glb',category:'kitchen',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  kitchen_cabinet_upper:{file:'shelf_small.glb',category:'kitchen',mountType:'wall',defaultScale:1,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall',yawOffset:0,forwardAxis:'+z',wallFacingMode:'face_interior',defaultFacing:'interior'},
  kitchen_island:{file:'dining_table.glb',category:'kitchen',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  kitchen_fridge:{file:'kitchen_fridge.glb',category:'kitchen',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  kitchen_stove:{file:'kitchen_stove.glb',category:'kitchen',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  kitchen_hood:{file:'shelf_small.glb',category:'kitchen',mountType:'wall',defaultScale:1,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall',yawOffset:0,forwardAxis:'+z',wallFacingMode:'face_interior',defaultFacing:'interior'},
  kitchen_sink:{file:'kitchen_sink.glb',category:'kitchen',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  kitchen_dishwasher:{file:'cabinet.glb',category:'kitchen',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  bathroom_vanity_single:{file:'bathroom_vanity_single.glb',category:'bathroom',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  bathroom_vanity_double:{file:'bathroom_vanity_double.glb',category:'bathroom',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  bathroom_toilet:{file:'bathroom_toilet.glb',category:'bathroom',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  bathroom_tub:{file:'bathroom_tub.glb',category:'bathroom',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  bathroom_shower:{file:'bathroom_shower.glb',category:'bathroom',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  bathroom_mirror:{file:'mirror.glb',category:'bathroom',mountType:'wall',defaultScale:1,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall',yawOffset:0,forwardAxis:'+z',wallFacingMode:'face_interior',defaultFacing:'interior'},
  bathroom_towel_bar:{file:'bathroom_towel_bar.glb',category:'bathroom',mountType:'wall',defaultScale:1,yOffset:0,snapToWall:true,snapToFloor:false,fit:'wall',yawOffset:0,forwardAxis:'+z',wallFacingMode:'face_interior',defaultFacing:'interior'},
  washing_machine:{file:'washing_machine.glb',category:'laundry',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  column_round:{file:'column_round.glb',category:'decor',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  trashcan_small:{file:'trashcan_small.glb',category:'decor',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  trashcan_large:{file:'trashcan_large.glb',category:'decor',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  square_plate:{file:'square_plate.glb',category:'decor',mountType:'surface',defaultScale:1,yOffset:0,snapToFloor:false,fit:'surface',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
  table_rect:{file:'table_rect.glb',category:'table',mountType:'floor',defaultScale:1,yOffset:0,snapToFloor:true,fit:'footprint',yawOffset:0,forwardAxis:'+z',wallFacingMode:'free',defaultFacing:'forward'},
};
Object.entries(MODEL_REGISTRY).forEach(([key,reg])=>{
  reg.yawOffset=Number.isFinite(reg.yawOffset)?reg.yawOffset:(Number.isFinite(reg.defaultRotation)?reg.defaultRotation:0);
  reg.forwardAxis=reg.forwardAxis||'+z';
  reg.wallFacingMode=reg.wallFacingMode||(reg.mountType==='wall'?'face_interior':'free');
  reg.defaultFacing=reg.defaultFacing||(reg.mountType==='wall'?'interior':'forward');
  delete reg.defaultRotation;
});
['mirror','wall_art_01','wall_art_04','wall_art_06','curtains','blinds','lamp_wall','shelving','shelf_small','kitchen_cabinet_upper','kitchen_hood','bathroom_mirror','bathroom_towel_bar'].forEach(key=>{
  if(MODEL_REGISTRY[key]){
    MODEL_REGISTRY[key].wallFacingMode='face_interior';
    MODEL_REGISTRY[key].defaultFacing='interior';
  }
});
const MODEL_DEBUG={ok:new Set(),fail:new Set(),blocked:new Set(),messages:[]};
const ROOM_MODEL_DEBUG={ok:new Set(),fail:new Set(),blocked:new Set(),messages:[],active:new Set()};
const MODEL_URL_CACHE=new Map();
const MODEL_ERROR_DETAILS=new Map();
const MODEL_PREFLIGHT=new Map();
const ROOM_RUNTIME_DIAG={items:new Map(),summary:null};
let runtimeDiagOpen=false,preflightPanelOpen=false;
let rebuild3DTimer=null;
const GROUP_CATEGORY_MAP={Seating:'seating',Beds:'beds',Tables:'tables',Storage:'storage',Lighting:'lighting',Decor:'decor',Rugs:'rugs','Wall Decor':'wall_decor','Window Decor':'window_decor',Openings:'openings'};

async function loadAll(){
  let d=await dg('projects');
  if((!d||!Array.isArray(d)||!d.length)){
    const legacy=await dg('projects',{legacy:true});
    if(legacy&&Array.isArray(legacy)&&legacy.length){
      d=legacy;
      await ds('projects',legacy);
    }
  }
  projects=d&&Array.isArray(d)?d.map(normalizeRoom):[];
  // Phase 7A — merge with cloud if enabled (non-blocking; UI renders with local data first).
  if(window.cloudSync&&typeof window.cloudSync.onLoad==='function'){
    window.cloudSync.onLoad().then(merged=>{
      if(merged&&typeof draw==='function')draw();
      if(merged&&typeof refreshLibrary==='function')refreshLibrary();
    }).catch(()=>{});
  }
}
async function saveAll(){
  await ds('projects',JSON.parse(JSON.stringify(projects)));
  // Phase 7A — fire-and-forget cloud push if enabled.
  if(window.cloudSync&&typeof window.cloudSync.afterSave==='function'){
    window.cloudSync.afterSave().catch(()=>{});
  }
}
let toastHideTimer=null;
function toast(m){
  const msg=String(m||'').trim();
  if(!msg)return;
  if(
    /^Tap the cube icon\b/i.test(msg) ||
    /^Room added (up|down|left|right)$/i.test(msg) ||
    /^Room duplicated$/i.test(msg) ||
    /^Project duplicated$/i.test(msg) ||
    /^Deleted$/i.test(msg) ||
    /^Saved$/i.test(msg) ||
    / copied$/i.test(msg) ||
    / pasted$/i.test(msg) ||
    / placed$/i.test(msg)
  )return;
  const t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.classList.add('show');
  if(toastHideTimer)clearTimeout(toastHideTimer);
  toastHideTimer=setTimeout(()=>t.classList.remove('show'),1800);
}
function esc(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function updateDebugBadge(){
  const el=document.getElementById('debugBadge');
  if(!el)return;
  const ok=MODEL_DEBUG.ok.size,fail=MODEL_DEBUG.fail.size,blocked=MODEL_DEBUG.blocked.size;
  const show=ok||fail||blocked;
  el.classList.toggle('show',!!show);
  el.classList.toggle('fail',fail>0||blocked>0);
  el.classList.toggle('ok',show&&fail===0&&blocked===0);
  if(!show){el.textContent='';return}
  const recent=MODEL_DEBUG.messages.slice(-2).join(' | ');
  el.textContent=`Models ${ok} ok / ${fail} fail / ${blocked} blocked${recent?` - ${recent}`:''}`;
}
function trackModelStatus(kind,key,file){
  if(kind==='ok'){MODEL_DEBUG.fail.delete(key);MODEL_DEBUG.blocked.delete(key);}
  if(kind==='fail'){MODEL_DEBUG.ok.delete(key);}
  MODEL_DEBUG[kind].add(key);
  MODEL_DEBUG.messages.push(`${key}:${kind}`);
  if(MODEL_DEBUG.messages.length>6)MODEL_DEBUG.messages.shift();
  updateDebugBadge();
}
function resetRoomDebug(){
  ROOM_MODEL_DEBUG.ok.clear();
  ROOM_MODEL_DEBUG.fail.clear();
  ROOM_MODEL_DEBUG.blocked.clear();
  ROOM_MODEL_DEBUG.messages.length=0;
  ROOM_MODEL_DEBUG.active.clear();
  ROOM_RUNTIME_DIAG.items.clear();
  ROOM_RUNTIME_DIAG.summary=null;
  updateRoomDebugBadge();
  updateRoomRuntimeDiag();
}
function updateRoomDebugBadge(){
  const el=document.getElementById('roomDebugBadge');
  if(!el)return;
  const ok=ROOM_MODEL_DEBUG.ok.size,fail=ROOM_MODEL_DEBUG.fail.size,blocked=ROOM_MODEL_DEBUG.blocked.size,active=ROOM_MODEL_DEBUG.active.size;
  const show=active>0||ok>0||fail>0||blocked>0;
  el.classList.toggle('show',show);
  el.classList.toggle('fail',fail>0||blocked>0);
  el.classList.toggle('ok',show&&fail===0&&blocked===0);
  el.textContent=show?`Room models ${ok} ok / ${fail} fail / ${blocked} blocked${active?` / ${active} mapped`:''}`:'';
}
function trackRoomModelStatus(kind,key){
  if(kind==='ok'){ROOM_MODEL_DEBUG.fail.delete(key);ROOM_MODEL_DEBUG.blocked.delete(key);}
  if(kind==='fail'){ROOM_MODEL_DEBUG.ok.delete(key);}
  ROOM_MODEL_DEBUG[kind].add(key);
  ROOM_MODEL_DEBUG.messages.push(`${key}:${kind}`);
  if(ROOM_MODEL_DEBUG.messages.length>8)ROOM_MODEL_DEBUG.messages.shift();
  updateRoomDebugBadge();
}
function formatVec3(v){
  if(!v)return 'n/a';
  return `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`;
}
function formatSize3(v){
  if(!v)return 'n/a';
  return `${v.x.toFixed(2)} x ${v.y.toFixed(2)} x ${v.z.toFixed(2)}`;
}
function roomDiagId(f){
  return `${f.id||f.assetKey}-${f.assetKey||'item'}`;
}
function getAssetBase(){
  return new URL('./assets/models/', window.location.href).href;
}
function modelUrl(file){
  return new URL(file, getAssetBase()).href;
}
async function ensureHttpRuntime(){
  if(location.protocol!=='file:')return true;
  const target='http://127.0.0.1:8000/roses-indoor-designs.html';
  try{
    const res=await fetch(target,{mode:'no-cors',cache:'no-store'});
    location.replace(target);
    return false;
  }catch(err){
    const el=document.getElementById('assetPreflightPanel');
    if(el){
      el.classList.add('show');
      el.innerHTML=`<h4>HTTP Required</h4><div class="ap-meta">page: ${window.location.href}
asset base: ${getAssetBase()}
Model loading is blocked in file mode.

Open the app at:
http://127.0.0.1:8000/roses-indoor-designs.html</div><div class="ap-list"><div class="ap-row fail">Local server not detected at http://127.0.0.1:8000
GLB loading will fail from file:/// mode.</div></div>`;
    }
    return false;
  }
}
async function preflightModelFile(file){
  if(location.protocol==='file:'){
    return {url:modelUrl(file),status:0,ok:false,error:'File mode blocked. Open via http://127.0.0.1:8000/roses-indoor-designs.html'};
  }
  const url=modelUrl(file);
  const cached=MODEL_PREFLIGHT.get(url);
  if(cached&&!(cached instanceof Promise))return cached;
  if(cached instanceof Promise)return cached;
  const promise=(async()=>{
    try{
      const res=await fetch(url,{cache:'no-store'});
      const result={url,status:res.status,ok:res.ok,error:''};
      MODEL_PREFLIGHT.set(url,result);
      updateAssetPreflightPanel();
      return result;
    }catch(err){
      const result={url,status:0,ok:false,error:(err&&err.message)||'fetch failed'};
      MODEL_PREFLIGHT.set(url,result);
      updateAssetPreflightPanel();
      return result;
    }
  })();
  MODEL_PREFLIGHT.set(url,promise);
  return promise;
}
async function preflightAllModels(){
  const entries=await Promise.all(Object.entries(MODEL_REGISTRY).map(async([key,reg])=>({key,file:reg.file,...await preflightModelFile(reg.file)})));
  updateAssetPreflightPanel(entries);
  return entries;
}
function updateAssetPreflightPanel(entries){
  const el=document.getElementById('assetPreflightPanel');
  if(!el)return;
  const rows=entries&&entries.length?entries:[...Object.entries(MODEL_REGISTRY)].map(([key,reg])=>{
    const url=modelUrl(reg.file);
    const cached=MODEL_PREFLIGHT.get(url);
    const pending=cached instanceof Promise;
    return {key,file:reg.file,url,status:pending?'pending':(cached&&cached.status)||'pending',ok:!pending&&!!(cached&&cached.ok),error:pending?'':(cached&&cached.error)||''};
  });
  const sofa=rows.find(r=>r.key==='sofa');
  const hasFail=rows.some(r=>r.status!=='pending'&&!r.ok);
  el.classList.toggle('show',preflightPanelOpen||hasFail);
  el.innerHTML=`<h4>Asset Preflight</h4><div class="ap-meta">page: ${window.location.href}
asset base: ${getAssetBase()}
sofa url: ${sofa?sofa.url:modelUrl('sofa.glb')}</div><div class="ap-list">${rows.map(row=>`<div class="ap-row ${row.ok?'ok':'fail'}">${row.key} -> ${row.status}${row.error?` (${row.error})`:''}
${row.url}</div>`).join('')}</div>`;
}
function togglePreflightPanel(){preflightPanelOpen=!preflightPanelOpen;updateAssetPreflightPanel()}
function ensureRoomDiagEntry(f,reg){
  const id=roomDiagId(f);
  if(!ROOM_RUNTIME_DIAG.items.has(id)){
    ROOM_RUNTIME_DIAG.items.set(id,{
      id,
      label:f.label||f.assetKey||'Item',
      key:f.assetKey||'unmapped',
      file:reg?.file||'n/a',
      status:'loading',
      worldPosition:null,
      bboxSize:null,
      scale:null,
      mountType:f.mountType||reg?.mountType||'floor',
      fallbackAttempted:false,
      error:'',
      issues:[],
      anchor:null,
      object:null
    });
  }
  return ROOM_RUNTIME_DIAG.items.get(id);
}
function updateRoomRuntimeDiag(){
  const el=document.getElementById('roomRuntimeDiag');
  const actions=document.getElementById('roomRuntimeActions');
  if(actions)actions.classList.toggle('on',!!is3D);
  if(!el)return;
  const items=[...ROOM_RUNTIME_DIAG.items.values()];
  if(!is3D||!items.length){el.classList.remove('on');el.innerHTML='';return}
  const summary=ROOM_RUNTIME_DIAG.summary;
  const hasAlert=items.some(item=>item.status==='fail'||item.status==='blocked'||item.issues.length);
  el.classList.toggle('on',runtimeDiagOpen||hasAlert);
  el.innerHTML=`<div class="runtime-diag-head"><div><h4>Room Runtime Diagnostics</h4><div class="runtime-diag-note">${summary?`ok ${summary.ok} · fail ${summary.fail} · invisible/offscreen ${summary.invisible} · blocked ${summary.blocked}`:'live asset placement diagnostics'}</div></div><button class="runtime-btn" onclick="document.getElementById('roomRuntimeDiag').classList.remove('on')">Hide</button></div><div class="runtime-diag-list">${items.map(item=>`<div class="runtime-diag-card ${item.status}"><div class="rd-title"><span>${item.key}</span><span>${item.status}</span></div><div class="rd-meta">path: ${item.file}
mount: ${item.mountType}
world: ${formatVec3(item.worldPosition)}
bbox: ${formatSize3(item.bboxSize)}
scale: ${item.scale?formatVec3(item.scale):'n/a'}
fallback attempted: ${item.fallbackAttempted?'yes':'no'}${item.error?`\nerror: ${item.error}`:''}${item.issues.length?`\nissues: ${item.issues.join(', ')}`:''}</div></div>`).join('')}</div>`;
}
function toggleRoomRuntimeDiag(){runtimeDiagOpen=!runtimeDiagOpen;updateRoomRuntimeDiag()}
function boxInCameraFrustum(box){
  if(!box||!cam)return false;
  const frustum=new THREE.Frustum();
  const proj=new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);
  frustum.setFromProjectionMatrix(proj);
  return frustum.intersectsBox(box);
}
function analyzeRoomModelPlacement(entry,r){
  if(!entry.object||!entry.anchor)return entry;
  entry.anchor.updateMatrixWorld(true);
  entry.object.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(entry.object),size=new THREE.Vector3(),center=new THREE.Vector3();
  box.getSize(size);box.getCenter(center);
  entry.worldPosition=center.clone();
  entry.bboxSize=size.clone();
  entry.scale=entry.object.scale.clone();
  const issues=[];
  if(size.x<.05||size.y<.05||size.z<.05)issues.push('near-zero scale');
  if(center.distanceTo(new THREE.Vector3(getRoomFocus(r).x,r.height*.3,-getRoomFocus(r).y))>Math.max(18,getRoomFocus(r).maxD*4.4))issues.push('far from room');
  if(box.max.y<0||box.min.y<-.12)issues.push('below floor');
  if(!boxInCameraFrustum(box))issues.push('offscreen');
  entry.issues=issues;
  return entry;
}
function runRoomModelAudit(){
  if(!is3D||!curRoom||!scene){toast('Enter 3D first');return}
  let ok=0,fail=0,invisible=0,blocked=0;
  const items=[...ROOM_RUNTIME_DIAG.items.values()];
  items.forEach(entry=>{
    if(entry.status==='ok'){analyzeRoomModelPlacement(entry,curRoom);ok++;}
    if(entry.status==='fail')fail++;
    if(entry.status==='blocked')blocked++;
    if(entry.status==='ok'&&entry.issues.length)invisible++;
  });
  ROOM_RUNTIME_DIAG.summary={ok,fail,invisible,blocked};
  updateRoomRuntimeDiag();
  const failingKeys=items.filter(entry=>entry.status==='fail').map(entry=>entry.key);
  const invisibleKeys=items.filter(entry=>entry.status==='ok'&&entry.issues.length).map(entry=>entry.key);
  console.log(`[ROOM MODEL AUDIT] ok=${ok} fail=${fail} invisible=${invisible} blocked=${blocked}`);
  console.log(JSON.stringify({ok,fail,invisible,blocked,failingKeys,invisibleKeys,blockedKeys:items.filter(entry=>entry.status==='blocked').map(entry=>entry.key)},null,2));
  if(fail||blocked||invisible){
    console.table(items.map(entry=>({key:entry.key,status:entry.status,issues:entry.issues.join(', '),path:entry.file,world:formatVec3(entry.worldPosition),bbox:formatSize3(entry.bboxSize)})));
  }
  toast(`Audit: ${ok} ok, ${fail} fail, ${invisible} invisible, ${blocked} blocked`);
  return ROOM_RUNTIME_DIAG.summary;
}
function focusSelectedAsset(){
  if(!is3D||!curRoom){toast('Enter 3D first');return}
  const selected=sel.type==='furniture'&&sel.idx>=0?curRoom.furniture[sel.idx]:null;
  if(!selected||!selected.assetKey){toast('Select a mapped asset first');return}
  const entry=ROOM_RUNTIME_DIAG.items.get(roomDiagId(selected));
  if(!entry||!entry.object){toast('Selected asset has no loaded model');return}
  analyzeRoomModelPlacement(entry,curRoom);
  const target=entry.worldPosition||entry.anchor?.getWorldPosition(new THREE.Vector3());
  if(!target){toast('No asset bounds available');return}
  camMode='orbit';
  document.getElementById('cmOrbit').classList.add('act');
  document.getElementById('cmWalk').classList.remove('act');
  orbitTarget={x:target.x,y:target.y,z:target.z};
  cDist=Math.max(6,Math.min(18,Math.max(entry.bboxSize?.x||3,entry.bboxSize?.y||3,entry.bboxSize?.z||3)*3.2));
  toast(`Focused ${entry.key}`);
}
function loadSingleModelUrl(url){
  return new Promise(resolve=>{
    ensureGLTFLoader().load(url,gltf=>resolve({scene:gltf.scene||null,url,error:null}),()=>{},err=>resolve({scene:null,url,error:err||new Error('load failed')}));
  });
}
async function resolveAndLoadModelAsset(assetKey){
  const reg=MODEL_REGISTRY[assetKey];
  if(!reg)return {scene:null,url:null,error:new Error('missing registry entry')};
  const url=modelUrl(reg.file);
  MODEL_URL_CACHE.set(assetKey,[url]);
  const preflight=await preflightModelFile(reg.file);
  updateAssetPreflightPanel();
  if(!preflight.ok){
    return {scene:null,url,error:new Error(`Preflight ${preflight.status||0} ${preflight.error||''}`.trim())};
  }
  console.info(`[MODEL PATH TRY] ${assetKey} -> ${url}`);
  return loadSingleModelUrl(url);
}
function normalizeRoom(room){
  if(!room)return room;
  room.openings=Array.isArray(room.openings)?room.openings:[];
  room.structures=Array.isArray(room.structures)?room.structures:[];
  room.furniture=Array.isArray(room.furniture)?room.furniture:[];
  room.dimensionAnnotations=Array.isArray(room.dimensionAnnotations)?room.dimensionAnnotations:[];
  room.textAnnotations=Array.isArray(room.textAnnotations)?room.textAnnotations:[];
  room.materials=room.materials||{};
  room.materials.wallFinish=room.materials.wallFinish||'warm_white';
  const wallPreset=WALL_PALETTES.find(w=>w.id===room.materials.wallFinish)||WALL_PALETTES[0];
  room.materials.wallFinish=wallPreset.id;
  room.materials.wall=normalizeColorValue(room.materials.wall||wallPreset.color,wallPreset.color);
  room.materials.wallColorCustom=!!room.materials.wallColorCustom;
  room.materials.floorType=room.materials.floorType||'light_oak';
  const floorPreset=FLOOR_TYPES.find(f=>f.id===room.materials.floorType)||FLOOR_TYPES[0];
  room.materials.floorType=floorPreset.id;
  room.materials.floor=normalizeColorValue(room.materials.floor||floorPreset.color,floorPreset.color);
  room.materials.floorColorCustom=!!room.materials.floorColorCustom;
  room.materials.ceiling=normalizeColorValue(room.materials.ceiling||'#FAF7F2','#FAF7F2');
  room.materials.trim=normalizeColorValue(room.materials.trim||'#E6DFD4',TRIM_COLORS[0]);
  room.materials.ceilingBrightness=Number.isFinite(room.materials.ceilingBrightness)?room.materials.ceilingBrightness:1;
  room.materials.lightingPreset=room.materials.lightingPreset||'daylight';
  room.materials.lightCharacter=Number.isFinite(room.materials.lightCharacter)
    ? Math.max(0,Math.min(1,room.materials.lightCharacter))
    : ({daylight:.38,warm_evening:.76,soft_lamp_glow:.84,moody:.92,bright_studio:.28}[room.materials.lightingPreset]??.5);
  room.materials.closetStyle=room.materials.closetStyle||'white_shaker';
  room.mood=room.mood||'';
  room.roomType=room.roomType||'living_room';
  room.designPreset=room.designPreset||'';
  room.existingRoomMode=!!room.existingRoomMode;
  room.hideRemovedExisting=!!room.hideRemovedExisting;
  room.ghostExisting=room.ghostExisting!==false;
  room.planViewMode=PLAN_VIEW_MODES[room.planViewMode]?room.planViewMode:'combined';
  room.showPlanLegend=room.showPlanLegend!==false;
  const nextLayerVisibility={...PLAN_LAYER_DEFAULTS};
  if(room.layerVisibility&&typeof room.layerVisibility==='object'){
    Object.keys(PLAN_LAYER_DEFAULTS).forEach(key=>{
      if(typeof room.layerVisibility[key]==='boolean')nextLayerVisibility[key]=room.layerVisibility[key];
    });
  }
  room.layerVisibility=nextLayerVisibility;
  room.projectId=room.projectId||room.id;
  room.projectName=(typeof room.projectName==='string'&&room.projectName.trim())?room.projectName.trim():room.name||'Home Project';
  room.floorId=room.floorId||'floor_1';
  room.floorLabel=(typeof room.floorLabel==='string'&&room.floorLabel.trim())?room.floorLabel.trim():'Floor 1';
  room.floorOrder=Number.isFinite(room.floorOrder)?Math.max(0,Math.round(room.floorOrder)):0;
  room.roomOrder=Number.isFinite(room.roomOrder)?Math.max(0,Math.round(room.roomOrder)):0;
  room.connections=Array.isArray(room.connections)?room.connections.map(link=>({
    roomId:link?.roomId||'',
    side:link?.side||'',
    via:link?.via||'',
    label:typeof link?.label==='string'?link.label:''
  })).filter(link=>link.roomId):[];
  room.baseRoomId=room.baseRoomId||room.id;
  room.optionName=room.optionName||'Main';
  room.optionNotes=typeof room.optionNotes==='string'?room.optionNotes:'';
  room.previewThumb=typeof room.previewThumb==='string'?room.previewThumb:'';
  room.referenceOverlay=normalizeReferenceOverlay(room.referenceOverlay,room);
  room.wallThickness=room.wallThickness||.5;
  room.height=room.height||9;
  room.walls=genWalls(room);
  room.openings=room.openings.map(op=>({
    ...op,
    swing:op.swing||'in',
    hinge:op.hinge||'left'
  }));
  room.furniture=room.furniture.map(normalizeFurnitureRecord);
  room.dimensionAnnotations=room.dimensionAnnotations.map(note=>({
    id:note?.id||uid(),
    x1:Number.isFinite(note?.x1)?note.x1:0,
    z1:Number.isFinite(note?.z1)?note.z1:0,
    x2:Number.isFinite(note?.x2)?note.x2:0,
    z2:Number.isFinite(note?.z2)?note.z2:0,
    label:typeof note?.label==='string'?note.label:'',
    color:typeof note?.color==='string'&&note.color?note.color:'#8E6E6B',
    fontSize:Number.isFinite(note?.fontSize)?Math.max(10,Math.min(28,note.fontSize)):13,
    offset:Number.isFinite(note?.offset)?Math.max(.3,Math.min(2.5,note.offset)):.8
  }));
  room.structures=room.structures.map(st=>{
    if(st.type==='closet'&&st.rect){
      st.height=st.height||room.height;
      st.look=st.look||'cabinetry';
      st.finish=st.finish||'white_shaker';
    }
    return st;
  });
  room.textAnnotations=room.textAnnotations.map(note=>({
    id:note?.id||uid(),
    text:typeof note?.text==='string'&&note.text.trim()?note.text.trim():'Note',
    x:Number.isFinite(note?.x)?note.x:0,
    z:Number.isFinite(note?.z)?note.z:0,
    color:typeof note?.color==='string'&&note.color?note.color:'#8E6E6B',
    fontSize:Number.isFinite(note?.fontSize)?Math.max(10,Math.min(28,note.fontSize)):14,
    rotation:Number.isFinite(note?.rotation)?note.rotation:0
  }));
  return room;
}
function roomLayerVisible(room,key){
  if(!room)return true;
  const visibility=room.layerVisibility||PLAN_LAYER_DEFAULTS;
  return visibility[key]!==false;
}
function safeThreeColor(value,fallback){
  try{return new THREE.Color(value);}
  catch(_){
    try{return new THREE.Color(fallback);}
    catch(__){return new THREE.Color('#ffffff');}
  }
}
function normalizeReferenceOverlay(ref,room){
  const bounds=getRoomBounds2D(room);
  const naturalWidth=Math.max(1,Number(ref?.naturalWidth)||1);
  const naturalHeight=Math.max(1,Number(ref?.naturalHeight)||1);
  const defaultWidth=Math.max(8,Math.min(30,bounds.width||12));
  const pdfPageCount=Number.isFinite(ref?.pdfPageCount)&&ref.pdfPageCount>0?Math.round(ref.pdfPageCount):0;
  return {
    src:typeof ref?.src==='string'?ref.src:'',
    sourceType:ref?.sourceType==='pdf'?'pdf':'image',
    sourceName:typeof ref?.sourceName==='string'?ref.sourceName:'',
    pdfSource:typeof ref?.pdfSource==='string'?ref.pdfSource:'',
    pdfPageCount,
    pdfPage:pdfPageCount?Math.max(1,Math.min(pdfPageCount,Math.round(ref?.pdfPage)||1)):1,
    visible:ref?.visible!==false,
    locked:ref?.locked!==false,
    opacity:Math.max(.08,Math.min(.95,Number(ref?.opacity)||.56)),
    centerX:Number.isFinite(ref?.centerX)?ref.centerX:bounds.cx,
    centerY:Number.isFinite(ref?.centerY)?ref.centerY:bounds.cy,
    baseWidth:Number.isFinite(ref?.baseWidth)?Math.max(2,ref.baseWidth):defaultWidth,
    scale:Number.isFinite(ref?.scale)?Math.max(.1,Math.min(12,ref.scale)):1,
    naturalWidth,
    naturalHeight,
    calibrationPoints:Array.isArray(ref?.calibrationPoints)?ref.calibrationPoints.filter(Boolean).slice(0,2):[],
    calibrationDistance:Number.isFinite(ref?.calibrationDistance)?ref.calibrationDistance:0,
    calibrationActive:!!ref?.calibrationActive,
  };
}
function normalizeColorValue(value,fallback){
  try{return '#'+safeThreeColor(value,fallback).getHexString();}
  catch(_){return fallback||'#ffffff';}
}
