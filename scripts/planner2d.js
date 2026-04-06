// ── EDITOR ──
async function openEd(room){
  normalizeRoom(room);
  curRoom=room;sel={type:null,idx:-1};tool='select';undoSt=[];redoSt=[];multiSelFurnitureIds=[];is3D=false;drawMode=false;
  document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));document.getElementById('scrEd').classList.add('on');
  document.getElementById('edT').textContent=room.optionName&&room.optionName!=='Main'?`${room.name} · ${room.optionName}`:room.name;document.getElementById('dBar').classList.remove('on');document.getElementById('mTbar').style.display='';
  document.getElementById('threeC').classList.remove('on');document.getElementById('b3d').classList.remove('on');document.getElementById('vLbl').textContent='2D Plan';
  document.getElementById('camBtns').classList.remove('on');document.getElementById('walkHint').classList.remove('on');
  document.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',b.dataset.t==='select'));stop3D();initCan();await restoreRoomHistory(room);sel={type:null,idx:-1};panelHidden=false;showP();
  // First-time 3D hint
  if(!localStorage.getItem('rose_3d_hint')){setTimeout(()=>{toast('Tap the cube icon to step inside your room in 3D');localStorage.setItem('rose_3d_hint','1')},1200)}
  // Surface old note if returning to a room
  if(room.polygon&&room.polygon.length)maybeSurfaceNote(room.id);checkRoomReturn(room.id)}
function exitEd(){persistRoomHistory();savePrj();stop3D();if(resH){window.removeEventListener('resize',resH);resH=null}curRoom=null;drawMode=false;multiSelFurnitureIds=[];
  document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));document.getElementById('scrHome').classList.add('on');renderHome()}
function savePrj(){if(!curRoom)return;persistRoomHistory();syncCurrentRoomRecord(true)}

// ── CANVAS ──
function initCan(){
  const w=document.getElementById('cWrap');canvas=document.getElementById('edCan');ctx=canvas.getContext('2d');
  function rs(){canvas.width=w.clientWidth;canvas.height=w.clientHeight;if(!drawMode&&curRoom&&curRoom.polygon.length)autoFit();draw()}
  if(resH)window.removeEventListener('resize',resH);resH=rs;window.addEventListener('resize',resH);rs();
  canvas.onpointerdown=onD;canvas.onpointermove=onM;canvas.onpointerup=onU;canvas.addEventListener('wheel',onW,{passive:false})}
function autoFit(){if(!curRoom||!canvas||!curRoom.polygon.length)return;const b=getRoomBounds2D(curRoom),pd=64;const nextScale=Math.min(Math.max(120,canvas.width-pd*2)/(b.width||1),Math.max(120,canvas.height-pd*2)/(b.height||1),40);vScale=Math.max(5,nextScale);vOff.x=canvas.width/2-b.cx*vScale;vOff.y=canvas.height/2-b.cy*vScale}
function tS(p){return{x:p.x*vScale+vOff.x,y:p.y*vScale+vOff.y}}
function tW(x,y){return{x:(x-vOff.x)/vScale,y:(y-vOff.y)/vScale}}
function floorPattern2D(mat){
  const can=document.createElement('canvas');can.width=96;can.height=96;const c=can.getContext('2d');
  const preset=FLOOR_TYPES.find(f=>f.id===(mat.floorType||'light_oak'))||FLOOR_TYPES[0];
  const baseColor=mat.floor||preset.color;
  c.fillStyle=baseColor;c.fillRect(0,0,96,96);
  if(preset.family==='wood'){
    for(let y=0;y<96;y+=16){
      const row=Math.floor(y/16);
      c.fillStyle=row%2===0?'rgba(255,255,255,.18)':'rgba(0,0,0,.14)';
      c.fillRect(0,y,96,14);
      c.fillStyle='rgba(24,14,6,.44)';c.fillRect(0,y+14,96,2);
      const offset=row%2===0?0:24;
      for(let x=offset;x<96;x+=32){
        c.fillStyle='rgba(24,14,6,.3)';c.fillRect(x,y,2.5,14);
      }
      for(let g=0;g<4;g++){
        c.strokeStyle=`rgba(255,255,255,${.07+g*.022})`;c.lineWidth=.9;
        c.beginPath();c.moveTo(g*22+4,y+3);c.lineTo(g*22+18,y+11);c.stroke();
        c.strokeStyle='rgba(42,24,10,.08)';c.beginPath();c.moveTo(g*22+10,y+2);c.lineTo(g*22+20,y+12);c.stroke();
      }
      c.fillStyle='rgba(255,255,255,.12)';c.fillRect(0,y,96,2);
      c.fillStyle='rgba(0,0,0,.07)';c.fillRect(0,y+2,96,1);
    }
  }else if(preset.family==='tile'){
    const tile=24;
    for(let y=0;y<96;y+=tile)for(let x=0;x<96;x+=tile){
      const bright=((x+y)/tile)%3===0?.14:((x+y)/tile)%3===1?.08:.03;
      c.fillStyle=`rgba(255,255,255,${bright})`;c.fillRect(x+2,y+2,tile-4,tile-4);
      c.fillStyle='rgba(0,0,0,.13)';c.fillRect(x+tile-7,y+tile-7,7,7);
      c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1;c.strokeRect(x+3,y+3,tile-6,tile-6);
    }
    c.strokeStyle='rgba(112,102,92,.98)';c.lineWidth=3;
    for(let i=0;i<=96;i+=tile){c.beginPath();c.moveTo(i,0);c.lineTo(i,96);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(96,i);c.stroke()}
  }else if(preset.family==='checker'){
    const tile=24;
    for(let y=0;y<96;y+=tile)for(let x=0;x<96;x+=tile){
      c.fillStyle=((x+y)/tile)%2===0?baseColor:(preset.accent||'#888');c.fillRect(x,y,tile,tile);
      c.fillStyle='rgba(255,255,255,.12)';c.fillRect(x+2,y+2,tile-4,tile-4);
      c.fillStyle='rgba(0,0,0,.12)';c.fillRect(x,y+tile-4,tile,4);
    }
    c.strokeStyle='rgba(247,241,233,.86)';c.lineWidth=2.2;
    for(let i=0;i<=96;i+=tile){c.beginPath();c.moveTo(i,0);c.lineTo(i,96);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(96,i);c.stroke()}
  }else{
    for(let i=0;i<36;i++){
      c.fillStyle=`rgba(255,255,255,${.06+(i%4)*.025})`;
      c.fillRect((i*27)%96,(i*19)%96,18+(i%3)*6,8+(i%2)*4);
    }
    c.strokeStyle='rgba(0,0,0,.16)';c.lineWidth=1.4;
    for(let i=0;i<5;i++){c.beginPath();c.moveTo(0,i*20+8);c.lineTo(96,i*20+4);c.stroke()}
  }
  return ctx.createPattern(can,'repeat');
}

// ── FURNITURE 2D TINT ──
const FURN_GROUP_TINTS={
  'Seating':    '#87654D',
  'Tables':     '#A97B50',
  'Storage':    '#6C5645',
  'Lighting':   '#C59E58',
  'Decor':      '#6E8B66',
  'Rugs':       '#B46E55',
  'Wall Decor': '#8A7563',
};
function threeColorToRgba(color,alpha=1){
  return `rgba(${Math.round(color.r*255)},${Math.round(color.g*255)},${Math.round(color.b*255)},${alpha})`;
}
function furniture2DStroke(f,item){
  const tint=safeThreeColor(furniture2DTint(f,item),'#7B6B5E');
  return threeColorToRgba(tint.clone().offsetHSL(0,.02,-.18),.94);
}
function furniture2DLabelInk(f,item){
  const tint=safeThreeColor(furniture2DTint(f,item),'#7B6B5E');
  const hsl={h:0,s:0,l:0};
  tint.getHSL(hsl);
  return hsl.l>.55?'rgba(58,44,34,.82)':'rgba(248,244,236,.9)';
}
function furniture2DTint(f,item){
  if(f.finishColor)return f.finishColor;
  return FURN_GROUP_TINTS[item?.group]||'#8A7868';
}
function pendingFurniturePreviewItem(){
  if(!pendFurnPreviewKey)return null;
  return FURN_ITEM_BY_KEY.get(pendFurnPreviewKey)||FURN_ITEMS.find(item=>item.assetKey===pendFurnPreviewKey)||null;
}
function pendingFurnitureCollision(room,state){
  if(!room||!state?.item)return null;
  const radius=Math.max(.85,Math.max(state.item.w||2,state.item.d||1.5)*.44);
  return (room.furniture||[]).find(f=>Math.hypot((f.x||0)-state.snapped.x,(f.z||0)-state.snapped.z)<radius+Math.max(.75,Math.max(f.w||2,f.d||1.5)*.34))||null;
}
function getPendingFurniturePlacementState(room=curRoom){
  if(!room||!pendFurnPos)return null;
  const item=pendingFurniturePreviewItem();
  if(!item)return null;
  const snapped=snapFurniturePoint(pendFurnPos.x,pendFurnPos.y);
  const halfW=(item.w||2)/2;
  const halfD=(item.d||1.5)/2;
  const corners=[
    {x:snapped.x-halfW,y:snapped.z-halfD},
    {x:snapped.x+halfW,y:snapped.z-halfD},
    {x:snapped.x+halfW,y:snapped.z+halfD},
    {x:snapped.x-halfW,y:snapped.z+halfD},
  ];
  const inside=corners.every(pt=>pointInsideRoom2D(pt,room));
  const structureBlocked=collidesWithStructure(snapped.x,-snapped.z,room);
  const collision=pendingFurnitureCollision(room,{item,snapped});
  let reason='';
  if(!inside)reason='Move fully inside the room';
  else if(structureBlocked)reason='Target overlaps a built-in or closet';
  else if(collision)reason=`Too close to ${collision.label||'another piece'}`;
  let nearestWall=null;
  room.walls.forEach((wall,idx)=>{
    const dist=psw({x:snapped.x,y:snapped.z},wS(room,wall),wE(room,wall));
    if(!nearestWall||dist<nearestWall.distance)nearestWall={idx,distance:dist};
  });
  return {item,snapped,corners,inside,structureBlocked,collision,valid:inside&&!structureBlocked&&!collision,reason,nearestWall};
}
function drawPendingFurniturePlacement(room){
  if(!pendFurnPos)return;
  const state=getPendingFurniturePlacementState(room);
  if(!state)return;
  const {item,snapped,nearestWall}=state;
  const screen=tS({x:snapped.x,y:snapped.z});
  const width=(item?.w||2)*vScale;
  const depth=(item?.d||1.5)*vScale;
  const tone=safeThreeColor(furniture2DTint({finishColor:''},item),'#B8918E');
  const valid=!!state.valid;
  const accent=valid?safeThreeColor('#8FB47C','#8FB47C'):safeThreeColor('#C67B72','#C67B72');
  const fill=threeColorToRgba(valid?tone.clone().lerp(accent,.24):accent,.24);
  const stroke=threeColorToRgba(valid?accent.clone().offsetHSL(0,.02,-.08):accent.clone().offsetHSL(0,.04,-.02),.92);
  const glow=threeColorToRgba(valid?accent.clone().offsetHSL(0,.05,.08):accent.clone().offsetHSL(0,.04,.05),.28);
  if(nearestWall&&nearestWall.distance<=1.1){
    const wall=room.walls[nearestWall.idx];
    const a=tS(wS(room,wall)),b=tS(wE(room,wall));
    ctx.save();
    ctx.strokeStyle=threeColorToRgba(accent,.78);
    ctx.lineWidth=4;
    ctx.setLineDash([12,8]);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(screen.x,screen.y);
  ctx.beginPath();
  ctx.roundRect(-width/2,-depth/2,width,depth,Math.max(12,Math.min(width,depth)*.16));
  ctx.fillStyle=fill;
  ctx.shadowColor=glow;
  ctx.shadowBlur=18;
  ctx.fill();
  ctx.shadowBlur=0;
  ctx.strokeStyle=stroke;
  ctx.lineWidth=2.2;
  ctx.setLineDash([8,6]);
  ctx.stroke();
  ctx.setLineDash([]);
  const arrowY=-Math.max(18,depth*.32);
  ctx.beginPath();
  ctx.moveTo(-14,0);ctx.lineTo(14,0);ctx.moveTo(0,-14);ctx.lineTo(0,14);
  ctx.moveTo(0,arrowY);
  ctx.lineTo(-8,arrowY+10);
  ctx.lineTo(8,arrowY+10);
  ctx.closePath();
  ctx.strokeStyle=stroke;
  ctx.lineWidth=1.8;
  ctx.stroke();
  ctx.fillStyle=stroke;
  ctx.fill();
  const label=item?.label||pendFurnPreviewLabel||'Placement';
  const snapText=furnitureSnap?'snap on':'free place';
  const info=`${label} · ${state.valid?'ready':'adjust'} · ${formatDistance(snapped.x,'compact')}, ${formatDistance(snapped.z,'compact')} · ${snapText}`;
  ctx.font=`700 ${Math.max(8,vScale*.22)}px Outfit,sans-serif`;
  const infoW=Math.max(88,ctx.measureText(info).width+18);
  const pillY=-Math.max(depth/2+20,32);
  ctx.fillStyle='rgba(250,247,242,.94)';
  ctx.fillRect(-infoW/2,pillY-10,infoW,20);
  ctx.strokeStyle='rgba(184,145,142,.34)';
  ctx.lineWidth=1;
  ctx.strokeRect(-infoW/2,pillY-10,infoW,20);
  ctx.fillStyle='rgba(92,77,66,.88)';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(info,0,pillY);
  if(!state.valid&&state.reason){
    const reasonW=Math.max(96,ctx.measureText(state.reason).width+18);
    ctx.fillStyle='rgba(255,247,245,.96)';
    ctx.fillRect(-reasonW/2,pillY+16,reasonW,20);
    ctx.strokeStyle='rgba(198,123,114,.34)';
    ctx.strokeRect(-reasonW/2,pillY+16,reasonW,20);
    ctx.fillStyle='rgba(137,76,69,.9)';
    ctx.fillText(state.reason,0,pillY+26);
  }
  ctx.restore();
}

// ── DRAW 2D ──
function draw(){
  if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);drawGrid();
  if(drawMode){drawFD();return}
  if(!curRoom||!curRoom.polygon.length)return;const r=curRoom;
  // Wall paint wash
  ctx.save();ctx.beginPath();r.polygon.forEach((p,i)=>{const s=tS(p);if(!i)ctx.moveTo(s.x,s.y);else ctx.lineTo(s.x,s.y)});ctx.closePath();ctx.fillStyle=r.materials.wall||WALL_PALETTES[0].color;ctx.globalAlpha=.42;ctx.fill();ctx.restore();
  // Floor
  ctx.save();ctx.beginPath();r.polygon.forEach((p,i)=>{const s=tS(p);if(!i)ctx.moveTo(s.x,s.y);else ctx.lineTo(s.x,s.y)});ctx.closePath();ctx.fillStyle=floorPattern2D(r.materials)||r.materials.floor;ctx.globalAlpha=.92;ctx.fill();ctx.globalAlpha=1;ctx.restore();
  drawPendingFurniturePlacement(r);
  // Structures
  r.structures.forEach((st,i)=>{ctx.save();const is=sel.type==='structure'&&sel.idx===i;
    if(st.type==='closet'&&st.rect){const fin=CLOSET_FINISHES.find(f=>f.id===(st.finish||'white_painted'))||CLOSET_FINISHES[0];const a=tS({x:st.rect.x,y:st.rect.y}),b=tS({x:st.rect.x+st.rect.w,y:st.rect.y+st.rect.h});ctx.fillStyle=fin.body;ctx.strokeStyle=is?'#B8918E':fin.trim;ctx.lineWidth=is?2.5:1.5;if(is)ctx.setLineDash([5,3]);ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.setLineDash([]);const midX=(a.x+b.x)/2;ctx.strokeStyle=fin.trim;ctx.beginPath();ctx.moveTo(midX,a.y+4);ctx.lineTo(midX,b.y-4);ctx.stroke();ctx.fillStyle=fin.trim;ctx.font=`${Math.max(9,vScale*.35)}px Outfit,sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('closet',(a.x+b.x)/2,(a.y+b.y)/2)}
    else if(st.type==='partition'&&st.line){const a=tS(st.line.a),b=tS(st.line.b);ctx.strokeStyle=is?'#B8918E':'#5C4D42';ctx.lineWidth=Math.max(3,vScale*.15);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}ctx.restore()});
  // Walls
  r.walls.forEach(w=>{const a=tS(wS(r,w)),b=tS(wE(r,w));ctx.strokeStyle=r.materials.wall;ctx.lineWidth=Math.max(4,w.thickness*vScale);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle=r.materials.trim||'rgba(51,41,34,.2)';ctx.lineWidth=Math.max(1.2,vScale*.04);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    const l=wL(r,w),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,an=wA(r,w);ctx.save();ctx.translate(mx,my);let la=an;if(la>Math.PI/2)la-=Math.PI;if(la<-Math.PI/2)la+=Math.PI;ctx.rotate(la);ctx.fillStyle='rgba(51,41,34,.35)';ctx.font=`500 ${Math.max(9,vScale*.28)}px Outfit,sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(formatDistance(l,'compact'),0,-Math.max(4,w.thickness*vScale*.6));ctx.restore()});
  // Openings
  r.openings.forEach((op,i)=>{const w=r.walls.find(x=>x.id===op.wallId);if(!w)return;const a=wS(r,w),b=wE(r,w),wl=wL(r,w),an=wA(r,w),t=op.offset/wl;const sc=tS({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}),hw=op.width/2*vScale,is=sel.type==='opening'&&sel.idx===i,wt=Math.max(3,w.thickness*vScale*.6);
    ctx.save();ctx.translate(sc.x,sc.y);ctx.rotate(an);
    if(op.type==='door'){ctx.fillStyle=r.materials.floor;ctx.fillRect(-hw,-wt,hw*2,wt*2);ctx.strokeStyle=is?'#B8918E':(r.materials.trim||'rgba(51,41,34,.2)');ctx.lineWidth=1.2;ctx.setLineDash([3,2]);ctx.beginPath();const sd=op.swing==='in'?1:-1, hingeX=op.hinge==='right'?hw:-hw, startAng=op.hinge==='right'?Math.PI:0;ctx.arc(hingeX,0,op.width*vScale,startAng,startAng+(sd*(Math.PI/2)),sd<0);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle=is?'#B8918E':'#5C4D42';ctx.lineWidth=2;ctx.beginPath();if(op.hinge==='right'){ctx.moveTo(hw,0);ctx.lineTo(-hw,0)}else{ctx.moveTo(-hw,0);ctx.lineTo(hw,0)}ctx.stroke()}
    else if(op.type==='window'){ctx.fillStyle='rgba(180,210,230,.3)';ctx.fillRect(-hw,-wt*.7,hw*2,wt*1.4);ctx.strokeStyle=is?'#B8918E':(r.materials.trim||'#5B8FA8');ctx.lineWidth=is?2:1.5;ctx.strokeRect(-hw,-wt*.7,hw*2,wt*1.4);ctx.beginPath();ctx.moveTo(0,-wt*.7);ctx.lineTo(0,wt*.7);ctx.stroke()}
    if(is){ctx.fillStyle='#B8918E';ctx.font=`600 ${Math.max(8,vScale*.22)}px Outfit,sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(`${formatDistance(op.offset,'compact')} offset`,0,wt+2)}ctx.restore()});
  // Furniture
  r.furniture.forEach((f,i)=>{
    const renderState=getFurnitureRenderState(f,r);
    if(!renderState.visible)return;
    const sc=tS({x:f.x,y:f.z}),hw=(f.w||2)*vScale/2,hd=(f.d||1.5)*vScale/2,isPrimary=sel.type==='furniture'&&sel.idx===i,isGroup=isFurnitureSelected(i),is=isPrimary||isGroup;
    const item=FURN_ITEMS.find(x=>x.assetKey===f.assetKey)||FURN_ITEMS.find(x=>x.label===f.label);
    const tint=furniture2DTint(f,item);
    const existingStyle=renderState.style;
    const ghosted=renderState.ghost;
    const baseStroke=furniture2DStroke(f,item);
    const labelInk=furniture2DLabelInk(f,item);
    ctx.save();ctx.translate(sc.x,sc.y);ctx.rotate((f.rotation||0)*Math.PI/180);
    if(f.assetKey==='sofa_l'){
      const rr=Math.min(hw,hd)*.18,seatDepth=hd*1.08,legWidth=hw*1.04;
      ctx.beginPath();
      ctx.roundRect(-hw,-hd,hw*2,seatDepth,rr);
      ctx.roundRect(-hw,-hd,legWidth,hd*2,rr);
    }else{
      const rr=Math.min(hw,hd)*.22;
      ctx.beginPath();ctx.roundRect(-hw,-hd,hw*2,hd*2,rr);
    }
    ctx.shadowColor=ghosted?'rgba(51,41,34,.08)':'rgba(51,41,34,.16)';
    ctx.shadowBlur=Math.max(4,Math.min(16,Math.min(hw,hd)*.22));
    ctx.shadowOffsetY=Math.max(2,Math.min(8,hd*.08));
    ctx.fillStyle=existingStyle?.fill||tint;ctx.globalAlpha=existingStyle?(ghosted?.42:.62):(is?.96:.93);ctx.fill();ctx.globalAlpha=1;
    ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle=isPrimary?'#B8918E':(isGroup?'rgba(184,145,142,.82)':(existingStyle?.stroke||baseStroke));ctx.lineWidth=is?2.6:(existingStyle?1.9:1.45);ctx.stroke();
    if(is){ctx.setLineDash(isPrimary?[6,4]:[4,4]);ctx.strokeStyle=isPrimary?'rgba(184,145,142,.5)':'rgba(184,145,142,.3)';ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([])}
    if(existingStyle&&!is){ctx.setLineDash([5,4]);ctx.strokeStyle=existingStyle.stroke;ctx.lineWidth=1.2;ctx.stroke();ctx.setLineDash([])}
    const facingY=-Math.max(10,hd*.66);
    ctx.beginPath();
    ctx.moveTo(0,facingY);
    ctx.lineTo(-Math.max(5,hw*.14),facingY+Math.max(8,hd*.18));
    ctx.lineTo(Math.max(5,hw*.14),facingY+Math.max(8,hd*.18));
    ctx.closePath();
    ctx.fillStyle=isPrimary?'#B8918E':(isGroup?'rgba(184,145,142,.8)':'rgba(92,77,66,.72)');
    ctx.fill();
    ctx.fillStyle=isPrimary?'#8E6E6B':(isGroup?'rgba(112,88,86,.76)':labelInk);
    ctx.font=`${Math.max(14,vScale*.5)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText((item&&item.symbol)||item?.icon||'\u25A3',0,-Math.min(8,hd*.22));
    ctx.font=`600 ${Math.max(8,vScale*.24)}px Outfit,sans-serif`;
    const labelY=Math.min(10,hd*.28);
    const labelText=f.label||'Item';
    const labelW=Math.max(32,ctx.measureText(labelText).width+10);
    ctx.fillStyle='rgba(250,247,242,.68)';
    ctx.fillRect(-labelW/2,labelY-7,labelW,14);
    ctx.fillStyle=isPrimary?'#8E6E6B':(isGroup?'rgba(112,88,86,.76)':labelInk);
    ctx.fillText(labelText,0,labelY);
    if(existingStyle&&currentPlanViewMode(r)!=='existing'){
      ctx.fillStyle='rgba(250,247,242,.92)';
      const badgeText=f.redesignAction.toUpperCase()+(f.locked?' • LOCKED':'');
      ctx.fillRect(-Math.max(34,hw*.7),hd+4,Math.max(68,hw*1.4),16);
      ctx.fillStyle=existingStyle.stroke;
      ctx.font=`700 ${Math.max(7,vScale*.18)}px Outfit,sans-serif`;
      ctx.fillText(badgeText,0,hd+12);
    }
    ctx.restore()
  });
  drawPlanLegend(r);
  // Measurements
  if(showMeasurements&&r.polygon.length>=3){
    const b=getRoomBounds2D(r),area=polygonArea(r.polygon);
    // Overall bounding dimensions
    const tl=tS({x:b.x0,y:b.y0}),tr=tS({x:b.x1,y:b.y0}),bl=tS({x:b.x0,y:b.y1}),br=tS({x:b.x1,y:b.y1});
    const off=Math.max(24,vScale*1.2);
    drawDimLine(ctx,tl.x,tl.y-off,tr.x,tr.y-off,0,formatDistance(b.width));
    drawDimLine(ctx,tr.x+off,tl.y,br.x+off,br.y,0,formatDistance(b.height));
    // Area label
    const center=tS({x:b.cx,y:b.cy});
    ctx.save();ctx.fillStyle='rgba(142,110,107,.7)';ctx.font='600 11px Outfit,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(250,247,242,.8)';const areaText=formatArea(area);
    ctx.fillRect(center.x-areaText.length*3.4-6,center.y+vScale*.8-8,areaText.length*6.8+12,16);
    ctx.fillStyle='rgba(142,110,107,.75)';ctx.fillText(areaText,center.x,center.y+vScale*.8);ctx.restore();
  }
  // Vertices
  r.polygon.forEach((p,i)=>{const s=tS(p),is=sel.type==='vertex'&&sel.idx===i;ctx.beginPath();ctx.arc(s.x,s.y,is?8:5,0,Math.PI*2);ctx.fillStyle=is?'#B8918E':'#FFF';ctx.strokeStyle=is?'#8E6E6B':'#8B7E74';ctx.lineWidth=is?2.5:1.5;ctx.fill();ctx.stroke()});
  // Pending
  if(closetSt&&pendEnd){const a=tS(closetSt),b=tS(pendEnd);ctx.fillStyle='rgba(139,126,116,.06)';ctx.strokeStyle='#B8918E';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);ctx.setLineDash([])}
  if(partSt&&pendEnd){const a=tS(partSt),b=tS(pendEnd);ctx.strokeStyle='#8E6E6B';ctx.lineWidth=3;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([])}}

function drawFD(){
  if(drawPts.length>0){ctx.beginPath();drawPts.forEach((p,i)=>{const s=tS(p);if(!i)ctx.moveTo(s.x,s.y);else ctx.lineTo(s.x,s.y)});if(drawCur){const c=tS(drawCur);ctx.lineTo(c.x,c.y)}ctx.strokeStyle='#B8918E';ctx.lineWidth=2;ctx.stroke();
    if(drawPts.length>=3&&drawCur){const f=tS(drawPts[0]),c=tS(drawCur);if(Math.hypot(f.x-c.x,f.y-c.y)<20){ctx.beginPath();ctx.arc(f.x,f.y,12,0,Math.PI*2);ctx.fillStyle='rgba(184,145,142,.3)';ctx.fill()}}
    drawPts.forEach((p,i)=>{const s=tS(p);ctx.beginPath();ctx.arc(s.x,s.y,6,0,Math.PI*2);ctx.fillStyle=i===0?'#B8918E':'#FFF';ctx.strokeStyle='#8E6E6B';ctx.lineWidth=2;ctx.fill();ctx.stroke()});
    for(let i=0;i<drawPts.length-1;i++){const a=tS(drawPts[i]),b=tS(drawPts[i+1]),l=Math.sqrt((drawPts[i+1].x-drawPts[i].x)**2+(drawPts[i+1].y-drawPts[i].y)**2);ctx.fillStyle='rgba(51,41,34,.4)';ctx.font='500 10px Outfit,sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText(formatDistance(l,'compact'),(a.x+b.x)/2,(a.y+b.y)/2-6)}}
  if(drawCur){const c=tS(drawCur);ctx.beginPath();ctx.arc(c.x,c.y,4,0,Math.PI*2);ctx.fillStyle='rgba(184,145,142,.5)';ctx.fill();if(drawPts.length>0){const lp=drawPts[drawPts.length-1],l=Math.sqrt((drawCur.x-lp.x)**2+(drawCur.y-lp.y)**2);ctx.fillStyle='#B8918E';ctx.font='600 11px Outfit,sans-serif';ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillText(formatDistance(l,'compact'),c.x+10,c.y-6)}}}

function drawGrid(){const s=1,tl=tW(0,0),br=tW(canvas.width,canvas.height),sx=Math.floor(tl.x/s)*s,sy=Math.floor(tl.y/s)*s;ctx.strokeStyle='rgba(139,126,116,.04)';ctx.lineWidth=1;for(let x=sx;x<=br.x;x+=s){const px=x*vScale+vOff.x;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,canvas.height);ctx.stroke()}for(let y=sy;y<=br.y;y+=s){const py=y*vScale+vOff.y;ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(canvas.width,py);ctx.stroke()}}

// ── POINTER EVENTS ──
function gP(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function onD(e){const p=gP(e),wp=tW(p.x,p.y);isDrag=true;dStart=p;pendEnd=null;
  if(drawMode){let pt={x:Math.round(wp.x*2)/2,y:Math.round(wp.y*2)/2};if(drawPts.length>0&&angSnap)pt=snapAng(drawPts[drawPts.length-1],pt);pt={x:Math.round(pt.x*2)/2,y:Math.round(pt.y*2)/2};if(drawPts.length>=3){const f=tS(drawPts[0]);if(Math.hypot(f.x-p.x,f.y-p.y)<20){closeRoom();return}}drawPts.push(pt);draw();return}
  if(tool==='furniture'&&document.getElementById('furnPickOv')){updatePendingFurnitureTarget(wp);draw();return}
  if(tool==='select'){
    const h=hitTest(p),modMulti=!!(e.shiftKey||e.metaKey||e.ctrlKey||multiSelectMode);
    if(h){
      panelHidden=false;
      if(h.type==='furniture'){
        const clicked=curRoom.furniture[h.idx];
        const alreadySelected=isFurnitureSelected(h.idx);
        if(modMulti){
          setFurnitureSelection(h.idx,{toggle:true});
          isDrag=false;
          dOrig=null;
          showP();
          draw();
          return;
        }
        if(alreadySelected&&groupSelectionActive()){
          sel={type:'furniture',idx:h.idx};
          const selectedItems=selectedFurnitureRecords();
          if(selectedItems.every(item=>item.locked)){
            isDrag=false;
            dOrig=null;
          }else{
            dOrig=selectedItems.map(item=>({id:item.id,x:item.x,z:item.z,locked:item.locked}));
          }
        }else{
          setFurnitureSelection(h.idx);
          dOrig=clicked.locked?null:{x:clicked.x,z:clicked.z};
        }
      }else{
        clearFurnitureSelection();
        sel=h;
        if(h.type==='vertex')dOrig={...curRoom.polygon[h.idx]};
        else if(h.type==='opening')dOrig={...curRoom.openings[h.idx]};
        else if(h.type==='structure'){
          const st=curRoom.structures[h.idx];
          dOrig=st.rect?{...st.rect}:st.line?{a:{...st.line.a},b:{...st.line.b}}:null;
        }
      }
      showP();
    }else{
      clearFurnitureSelection();
      sel={type:null,idx:-1};panelHidden=false;dOrig={...vOff};showP();
    }
  }
  else if(tool==='draw'||tool==='vertex'){const nw=findNW(wp);if(nw!==null)addVtx(nw,wp)}
  else if(tool==='door'||tool==='window'){const existing=hitTest(p);if(existing&&existing.type==='opening'){tool='select';document.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',b.dataset.t==='select'));panelHidden=false;sel=existing;dOrig={...curRoom.openings[existing.idx]};showP()}else{const n=findNWO(wp);if(n){const w=curRoom.walls[n.wi];const op={id:uid(),type:tool,wallId:w.id,offset:n.off,width:tool==='door'?3:2.5,height:tool==='door'?7:4,sillHeight:tool==='window'?3:0,swing:'in',hinge:'left'};curRoom.openings.push(op);sel={type:'opening',idx:curRoom.openings.length-1};dOrig={...op};pushU();showP();toast(tool==='door'?'Door placed':'Window placed');if(curRoom.openings.length===3)findEgg(3)}}} // Easter egg: Hidden Garden
  else if(tool==='closet'){closetSt=wp;pendEnd=wp}
  else if(tool==='partition'){partSt=wp;pendEnd=wp}
  else if(tool==='furniture'){showFurnPicker(wp)}
  draw()}
function onM(e){const p=gP(e),wp=tW(p.x,p.y);
  if(drawMode){let pt={x:Math.round(wp.x*2)/2,y:Math.round(wp.y*2)/2};if(drawPts.length>0&&angSnap)pt=snapAng(drawPts[drawPts.length-1],pt);drawCur={x:Math.round(pt.x*2)/2,y:Math.round(pt.y*2)/2};draw();return}
  if(tool==='furniture'&&document.getElementById('furnPickOv')&&isDrag){updatePendingFurnitureTarget(wp);draw();return}
  if(!isDrag)return;
  if(tool==='select'&&sel.type==='vertex'&&dOrig){const dx=(p.x-dStart.x)/vScale,dy=(p.y-dStart.y)/vScale;curRoom.polygon[sel.idx].x=Math.round((dOrig.x+dx)*2)/2;curRoom.polygon[sel.idx].y=Math.round((dOrig.y+dy)*2)/2;curRoom.walls=genWalls(curRoom);draw()}
  else if(tool==='select'&&sel.type==='opening'&&dOrig){updateOpeningFromPoint(sel.idx,wp);draw();showP()}
  else if(tool==='select'&&sel.type==='structure'&&dOrig){const st=curRoom.structures[sel.idx],dx=(p.x-dStart.x)/vScale,dy=(p.y-dStart.y)/vScale;if(st.rect){st.rect.x=Math.round((dOrig.x+dx)*2)/2;st.rect.y=Math.round((dOrig.y+dy)*2)/2}else if(st.line&&dOrig.a){st.line.a={x:Math.round((dOrig.a.x+dx)*2)/2,y:Math.round((dOrig.a.y+dy)*2)/2};st.line.b={x:Math.round((dOrig.b.x+dx)*2)/2,y:Math.round((dOrig.b.y+dy)*2)/2}}draw()}
  else if(tool==='select'&&sel.type==='furniture'&&dOrig){
    const dx=(p.x-dStart.x)/vScale,dy=(p.y-dStart.y)/vScale;
    if(Array.isArray(dOrig)){
      const primaryId=curRoom.furniture[sel.idx]?.id||dOrig[0]?.id;
      const primary=dOrig.find(item=>item.id===primaryId)||dOrig[0];
      let moveX=dx,moveZ=dy;
      if(primary){
        const snapped=snapFurniturePoint(primary.x+dx,primary.z+dy);
        moveX=snapped.x-primary.x;
        moveZ=snapped.z-primary.z;
      }
      dOrig.forEach(origin=>{
        const item=curRoom.furniture.find(f=>f.id===origin.id);
        if(!item||origin.locked||item.locked)return;
        item.x=Math.round((origin.x+moveX)*2)/2;
        item.z=Math.round((origin.z+moveZ)*2)/2;
      });
    }else{
      const f=curRoom.furniture[sel.idx];
      if(f&&!f.locked){
        const snapped=snapFurniturePoint(dOrig.x+dx,dOrig.z+dy);
        f.x=Math.round(snapped.x*2)/2;
        f.z=Math.round(snapped.z*2)/2;
      }
    }
    draw()
  }
  else if(tool==='select'&&!sel.type&&dOrig){vOff.x=dOrig.x+(p.x-dStart.x);vOff.y=dOrig.y+(p.y-dStart.y);draw()}
  else if(tool==='closet'&&closetSt){pendEnd=wp;draw()}
  else if(tool==='partition'&&partSt){pendEnd=angSnap?snapAng(partSt,wp):wp;draw()}}
function onU(){
  if(tool==='furniture'&&document.getElementById('furnPickOv')){isDrag=false;dOrig=null;updateCatalogPendingUi?.();return}
  if(tool==='select'&&sel.type&&dOrig){pushU();showP()}
  if(tool==='closet'&&closetSt&&pendEnd){
    const x=Math.min(closetSt.x,pendEnd.x),y=Math.min(closetSt.y,pendEnd.y),w=Math.abs(pendEnd.x-closetSt.x),h=Math.abs(pendEnd.y-closetSt.y);
    if(w>.8&&h>.8){
      const rect={x:Math.round(x*2)/2,y:Math.round(y*2)/2,w:Math.round(Math.max(w,1)*2)/2,h:Math.round(Math.max(h,1)*2)/2};
      if(rectInsideRoom(rect,curRoom)||rectNearRoom(rect,curRoom,2)){
        const cl={id:uid(),type:'closet',rect,height:curRoom.height,look:'cabinetry',finish:curRoom.materials.closetStyle||'white_shaker'};
        curRoom.structures.push(cl);
        const ci=curRoom.structures.length-1;
        tool='select';
        document.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',b.dataset.t==='select'));
        sel={type:'structure',idx:ci};
        panelHidden=false;
        pushU();
        showP();
        toast('Closet created');
      }else toast('Closet must stay near the room');
    }else if(w>.1||h>.1)toast('Drag a larger area for closet');
    closetSt=null;pendEnd=null;draw()}
  if(tool==='partition'&&partSt&&pendEnd){
    const dx=pendEnd.x-partSt.x,dy=pendEnd.y-partSt.y,len=Math.hypot(dx,dy);
    if(len>1.2&&(pointInsideRoom2D(partSt,curRoom)||pointNearRoom2D(partSt,curRoom,2))&&(pointInsideRoom2D(pendEnd,curRoom)||pointNearRoom2D(pendEnd,curRoom,2))){
      const st={id:uid(),type:'partition',line:{a:{x:Math.round(partSt.x*2)/2,y:Math.round(partSt.y*2)/2},b:{x:Math.round(pendEnd.x*2)/2,y:Math.round(pendEnd.y*2)/2}}};
      curRoom.structures.push(st);
      sel={type:'structure',idx:curRoom.structures.length-1};
      tool='select';
      document.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',b.dataset.t==='select'));
      panelHidden=false;
      pushU();
      showP();
      toast('Interior wall added');
    }else if(len>.2)toast('Keep the wall near the room');
    partSt=null;pendEnd=null;draw()}
  isDrag=false;dOrig=null}
function onW(e){e.preventDefault();const p=gP(e),wb=tW(p.x,p.y);vScale=Math.max(5,Math.min(80,vScale*(e.deltaY>0?.9:1.1)));const wa=tW(p.x,p.y);vOff.x+=(wa.x-wb.x)*vScale;vOff.y+=(wa.y-wb.y)*vScale;draw()}

// ── HIT TEST ──
function hitTest(sp){const r=curRoom,hr=18;
  for(let i=r.openings.length-1;i>=0;i--){const op=r.openings[i],w=r.walls.find(x=>x.id===op.wallId);if(!w)continue;const a=wS(r,w),b=wE(r,w),wl=wL(r,w),an=wA(r,w),t=op.offset/wl,s=tS({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}),dx=sp.x-s.x,dy=sp.y-s.y,lx=dx*Math.cos(-an)-dy*Math.sin(-an),ly=dx*Math.sin(-an)+dy*Math.cos(-an),pad=hr*.65;if(Math.abs(lx)<=op.width*vScale/2+pad&&Math.abs(ly)<=Math.max(hr,Math.max(6,w.thickness*vScale)))return{type:'opening',idx:i}}
  for(let i=r.polygon.length-1;i>=0;i--){const s=tS(r.polygon[i]);if(Math.hypot(s.x-sp.x,s.y-sp.y)<hr)return{type:'vertex',idx:i}}
  for(let i=r.structures.length-1;i>=0;i--){const st=r.structures[i];if(st.rect){const a=tS({x:st.rect.x,y:st.rect.y}),b=tS({x:st.rect.x+st.rect.w,y:st.rect.y+st.rect.h});if(sp.x>=a.x&&sp.x<=b.x&&sp.y>=a.y&&sp.y<=b.y)return{type:'structure',idx:i}}else if(st.line){const a=tS(st.line.a),b=tS(st.line.b);if(psd(sp.x,sp.y,a.x,a.y,b.x,b.y)<hr)return{type:'structure',idx:i}}}
  for(let i=r.furniture.length-1;i>=0;i--){if(pointInFurniture2D(sp,r.furniture[i]))return{type:'furniture',idx:i}}return null}
function psd(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;if(!l)return Math.hypot(px-ax,py-ay);const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l));return Math.hypot(px-(ax+t*dx),py-(ay+t*dy))}
function psw(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;if(!l)return Math.hypot(p.x-a.x,p.y-a.y);const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy))}
function pointInsideRoom2D(pt, room){return pointInPolygon(pt.x,-pt.y,room.polygon)}
function pointNearRoom2D(pt, room, margin=1.5){
  if(pointInsideRoom2D(pt,room))return true;
  // Check if point is within margin of the polygon bounding box (for hallways/adjacent rooms)
  const b=getRoomBounds2D(room);
  return pt.x>=b.x0-margin&&pt.x<=b.x1+margin&&pt.y>=b.y0-margin&&pt.y<=b.y1+margin;
}
function rectInsideRoom(rect, room){
  const pts=[{x:rect.x,y:rect.y},{x:rect.x+rect.w,y:rect.y},{x:rect.x+rect.w,y:rect.y+rect.h},{x:rect.x,y:rect.y+rect.h}];
  return pts.every(pt=>pointInsideRoom2D(pt,room));
}
function rectNearRoom(rect, room, margin=1.5){
  const pts=[{x:rect.x,y:rect.y},{x:rect.x+rect.w,y:rect.y},{x:rect.x+rect.w,y:rect.y+rect.h},{x:rect.x,y:rect.y+rect.h}];
  return pts.every(pt=>pointNearRoom2D(pt,room,margin));
}
function pointInFurniture2D(sp,f){
  const s=tS({x:f.x,y:f.z}),dx=sp.x-s.x,dy=sp.y-s.y,an=-(f.rotation||0)*Math.PI/180;
  const lx=dx*Math.cos(an)-dy*Math.sin(an),ly=dx*Math.sin(an)+dy*Math.cos(an);
  if(f.assetKey==='sofa_l'){
    const w=(f.w||6),d=(f.d||3.6),seatDepth=d*.56,legWidth=w*.52;
    const inLong=Math.abs(lx)<=w/2*vScale&&Math.abs(ly)<=seatDepth/2*vScale;
    const inReturn=lx<=(-w/2+legWidth)*vScale&&lx>=-w/2*vScale&&ly>=-d/2*vScale&&ly<=d/2*vScale;
    return inLong||inReturn;
  }
  return Math.abs(lx)<=((f.w||2)*vScale/2)&&Math.abs(ly)<=((f.d||1.5)*vScale/2);
}
function roomStyleChanged(){
  pushU();
  draw();
  if(!sel.type||sel.idx<0)showP();
  applyRoomStyleToScene();
  scheduleRebuild3D();
}
function scheduleRebuild3D(delay=90){
  if(!is3D)return;
  if(rebuild3DTimer)clearTimeout(rebuild3DTimer);
  rebuild3DTimer=setTimeout(()=>{rebuild3DTimer=null;if(is3D)rebuild3D();},delay);
}
function applyRoomStyleToScene(){
  if(!is3D||!scene||!ren||!curRoom)return;
  const style=scene.userData?.styleTargets;
  if(!style)return;
  const preset=getLightingPreset(curRoom);
  const wallColor=safeThreeColor(curRoom.materials.wall,WALL_PALETTES[0].color);
  const wallFinish=WALL_PALETTES.find(w=>w.id===(curRoom.materials.wallFinish||'warm_white'))||WALL_PALETTES[0];
  const trimColor=safeThreeColor(curRoom.materials.trim,TRIM_COLORS[0]);
  const floorPreset=FLOOR_TYPES.find(f=>f.id===curRoom.materials.floorType)||FLOOR_TYPES[0];
  const floorColor=safeThreeColor(curRoom.materials.floor,floorPreset.color);
  const ceilingColor=safeThreeColor(curRoom.materials.ceiling,'#FAF7F2').multiplyScalar(Math.max(.86,Math.min(1.18,curRoom.materials.ceilingBrightness||1)));
  (style.wallMats||[]).forEach(mat=>{
    if(mat?.color){
      mat.color.copy(wallColor);
      mat.roughness=.62-wallFinish.sheen*.14;
      mat.metalness=.01;
      if(mat.emissive){
        mat.emissive.copy(wallColor).multiplyScalar(curRoom.materials.wallColorCustom?.11:.045);
      }
      mat.needsUpdate=true;
    }
  });
  (style.trimMats||[]).forEach(mat=>{if(mat?.color){mat.color.copy(trimColor);mat.needsUpdate=true;}});
  (style.floorMats||[]).forEach(mat=>{
    if(mat?.color){
      mat.color.copy(floorColor);
      mat.roughness=floorPreset.roughness;
      mat.metalness=floorPreset.family==='concrete'?.08:.03;
      mat.needsUpdate=true;
    }
  });
  (style.ceilingMats||[]).forEach(mat=>{if(mat?.color){mat.color.copy(ceilingColor);mat.needsUpdate=true;}});
  if(style.floorMesh?.material?.map){
    style.floorMesh.material.map.dispose?.();
    style.floorMesh.material.map=buildFloorTexture(curRoom.materials.floor,curRoom.materials.floorType||'light_oak');
    style.floorMesh.material.map.needsUpdate=true;
    style.floorMesh.material.needsUpdate=true;
  }
  if(style.floorAccent?.material){
    const accentTone=floorColor.clone().lerp(safeThreeColor('#ffffff','#ffffff'),.46);
    style.floorAccent.material.color?.copy(accentTone);
    style.floorAccent.material.opacity=floorPreset.family==='checker'?.36:floorPreset.family==='tile'?.42:floorPreset.family==='concrete'?.24:.34;
    style.floorAccent.material.needsUpdate=true;
  }
  if(style.floorAccent?.material?.map){
    style.floorAccent.material.map.dispose?.();
    style.floorAccent.material.map=buildFloorAccentTexture(curRoom.materials.floorType||'light_oak');
    style.floorAccent.material.map.needsUpdate=true;
    style.floorAccent.material.needsUpdate=true;
  }
  ren.toneMappingExposure=preset.exposure;
  scene.background=safeThreeColor(preset.background,'#0f141c');
  scene.fog=new THREE.Fog(scene.background.getHex(),preset.fogNear||28,preset.fogFar||82);
    if(style.hemiLight){style.hemiLight.intensity=preset.ambient*1.18;style.hemiLight.groundColor.setHex(preset.warm);}
    if(style.ambLight){style.ambLight.intensity=preset.ambient*.78;style.ambLight.color.setHex(preset.warm);}
    if(style.dirLight){style.dirLight.intensity=preset.dir;style.dirLight.color.setHex(preset.dirColor);}
    if(style.fillLight)style.fillLight.intensity=preset.ambient*.52;
    if(style.ceilingLight)style.ceilingLight.intensity=.28*(curRoom.materials.ceilingBrightness||1);
    (style.practicalLights||[]).forEach(entry=>{
      if(!entry?.light)return;
      const baseIntensity=Number(entry.baseIntensity)||1;
      const baseDistance=Number(entry.baseDistance)||6;
      entry.light.intensity=baseIntensity*Math.max(.08,preset.practical||.04)*(curRoom.materials.ceilingBrightness||1);
      if('distance' in entry.light)entry.light.distance=baseDistance*(preset.practical>.8?1.08:1);
      if(entry.light.color?.setHex)entry.light.color.setHex(preset.warm);
    });
  }
function setAdjRoomWidth(v){adjRoomCfg.width=Math.max(6,Math.min(30,parseDistanceInput(v,adjRoomCfg.width||10)));showP()}
function setAdjRoomDepth(v){adjRoomCfg.depth=Math.max(6,Math.min(30,parseDistanceInput(v,adjRoomCfg.depth||10)));showP()}
function wallMatchesSide(room,wall,side,b){
  const a=wS(room,wall),e=wE(room,wall),eps=.01;
  if((side==='east'||side==='west')&&Math.abs(a.x-e.x)<eps){
    const x=a.x;
    if(side==='east'&&Math.abs(x-b.x1)<eps)return true;
    if(side==='west'&&Math.abs(x-b.x0)<eps)return true;
  }
  if((side==='south'||side==='north')&&Math.abs(a.y-e.y)<eps){
    const y=a.y;
    if(side==='south'&&Math.abs(y-b.y1)<eps)return true;
    if(side==='north'&&Math.abs(y-b.y0)<eps)return true;
  }
  return false;
}
function attachAdjacentRoom(side,width=adjRoomCfg.width,depth=adjRoomCfg.depth){
  if(!curRoom||!curRoom.polygon?.length)return;
  const b=getRoomBounds2D(curRoom);
  const walls=curRoom.walls.filter(w=>wallMatchesSide(curRoom,w,side,b));
  if(!walls.length){toast('No exterior wall available on that side');return}
  const wall=walls.sort((a,b2)=>wL(curRoom,b2)-wL(curRoom,a))[0];
  const a=wS(curRoom,wall),c=wE(curRoom,wall);
  const next=curRoom.polygon.slice();
  const i=wall.startIdx,j=wall.endIdx;
  const pts=[];
  let connectorA=null,connectorB=null;
  if(side==='east'||side==='west'){
    const x=a.x,y0=Math.min(a.y,c.y),y1=Math.max(a.y,c.y),span=y1-y0,shared=Math.min(width,span),mid=(y0+y1)/2,start=mid-shared/2,end=mid+shared/2,outer=x+(side==='east'?depth:-depth),forward=a.y<c.y;
    connectorA={x,y:start};
    connectorB={x,y:end};
    if(forward){
      if(Math.abs(start-a.y)>.001)pts.push({x,y:start});
      pts.push({x:outer,y:start},{x:outer,y:end});
      if(Math.abs(end-c.y)>.001)pts.push({x,y:end});
    }else{
      if(Math.abs(end-a.y)>.001)pts.push({x,y:end});
      pts.push({x:outer,y:end},{x:outer,y:start});
      if(Math.abs(start-c.y)>.001)pts.push({x,y:start});
    }
  }else{
    const y=a.y,x0=Math.min(a.x,c.x),x1=Math.max(a.x,c.x),span=x1-x0,shared=Math.min(width,span),mid=(x0+x1)/2,start=mid-shared/2,end=mid+shared/2,outer=y+(side==='south'?depth:-depth),forward=a.x<c.x;
    connectorA={x:start,y};
    connectorB={x:end,y};
    if(forward){
      if(Math.abs(start-a.x)>.001)pts.push({x:start,y});
      pts.push({x:start,y:outer},{x:end,y:outer});
      if(Math.abs(end-c.x)>.001)pts.push({x:end,y});
    }else{
      if(Math.abs(end-a.x)>.001)pts.push({x:end,y});
      pts.push({x:end,y:outer},{x:start,y:outer});
      if(Math.abs(start-c.x)>.001)pts.push({x:start,y});
    }
  }
  next.splice(i+1,0,...pts);
  curRoom.polygon=next;
  curRoom.walls=genWalls(curRoom);
  const matchesSegment=(w,p1,p2)=>{
    const wa=wS(curRoom,w),wb=wE(curRoom,w);
    const same=(p,q)=>Math.abs(p.x-q.x)<.01&&Math.abs(p.y-q.y)<.01;
    return (same(wa,p1)&&same(wb,p2))||(same(wa,p2)&&same(wb,p1));
  };
  const sharedWall=connectorA&&connectorB?curRoom.walls.find(w=>matchesSegment(w,connectorA,connectorB)):null;
  if(sharedWall&&!curRoom.openings.some(o=>o.wallId===sharedWall.id&&o.type==='door')){
    const wl=wL(curRoom,sharedWall);
    if(wl>4){
      curRoom.openings.push({id:uid(),type:'door',wallId:sharedWall.id,offset:wl/2,width:3,height:7,swing:'in',hinge:'left'});
    }
  }
  sel={type:null,idx:-1};
  pushU();
  autoFit();
  draw();
  showP();
  if(is3D)rebuild3D();
  toast('Adjacent room added with connecting door');
}
function clampOpeningToWall(op){
  if(!curRoom||!op)return;
  const wall=curRoom.walls.find(x=>x.id===op.wallId);
  if(!wall)return;
  const wl=wL(curRoom,wall),half=Math.max(.5,(op.width||2.5)/2);
  op.offset=Math.max(half,Math.min(wl-half,op.offset||half));
}
function updateOpeningFromPoint(idx,wp){
  const op=curRoom?.openings?.[idx];
  const target=findNWO(wp);
  if(!op||!target)return;
  const wall=curRoom.walls[target.wi];
  if(!wall)return;
  op.wallId=wall.id;
  op.offset=target.off;
  clampOpeningToWall(op);
}
function findNW(wp){let b=-1,bd=Infinity;const snapDist=Math.max(2,3/Math.max(1,vScale/20));curRoom.walls.forEach((w,i)=>{const d=psw(wp,wS(curRoom,w),wE(curRoom,w));if(d<bd){bd=d;b=i}});return bd<snapDist?b:null}
function findNWO(wp){let best=null,bd=Infinity;const snapDist=Math.max(2,3/Math.max(1,vScale/20));curRoom.walls.forEach((w,i)=>{const d=psw(wp,wS(curRoom,w),wE(curRoom,w));if(d<bd&&d<snapDist){const a=wS(curRoom,w),b=wE(curRoom,w),dx=b.x-a.x,dy=b.y-a.y,wl=wL(curRoom,w),t=((wp.x-a.x)*dx+(wp.y-a.y)*dy)/(dx*dx+dy*dy);bd=d;best={wi:i,off:Math.round(Math.max(1.5,Math.min(wl-1.5,t*wl))*4)/4}}});return best}
function addVtx(wi,wp){const w=curRoom.walls[wi];curRoom.polygon.splice(w.startIdx+1,0,{x:Math.round(wp.x*2)/2,y:Math.round(wp.y*2)/2});curRoom.walls=genWalls(curRoom);sel={type:'vertex',idx:w.startIdx+1};pushU();showP();draw();toast('Vertex added')}

function setTool(t){
  tool=t;
  document.querySelectorAll('.tb').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  closetSt=null;
  pendEnd=null;
  if(t!=='furniture'&&typeof closeFurnPick==='function'&&document.getElementById('furnPickOv'))closeFurnPick();
  if(t!=='select'){
    clearFurnitureSelection();
    sel={type:null,idx:-1};
    if(isTouchUi()&&window.innerWidth<=760)panelHidden=true;
    hideP();
  }else if(isTouchUi()&&window.innerWidth<=760&&!sel.type){
    panelHidden=true;
    hideP();
  }
  draw();
}
