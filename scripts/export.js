// ── EXPORT / PRINT ──
function exportPNG(){
  if(!curRoom){toast('Open a room first');return}
  let dataUrl;
  if(is3D&&ren){
    dataUrl=typeof capturePhotoMode==='function'?capturePhotoMode(false):(ren.render(scene,cam),ren.domElement.toDataURL('image/png'));
  }
  else if(canvas){dataUrl=canvas.toDataURL('image/png')}
  else{toast('Nothing to export');return}
  const a=document.createElement('a');a.href=dataUrl;a.download=`${(curRoom.name||'room').replace(/[^a-z0-9]/gi,'_')}_${is3D?(photoMode?'photo':'3d'):'plan'}.png`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);toast('PNG exported')
}
function renderPlanModeToDataURL(mode,width=1100,height=800){
  return renderRoomModeToDataURL(curRoom,mode,width,height,{legend:true,measurements:true});
}
function renderRoomModeToDataURL(room,mode,width=1100,height=800,opts={}){
  if(!room||!room.polygon.length)return null;
  const prevRoom=curRoom,prevCanvas=canvas,prevCtx=ctx,prevScale=vScale,prevOff={...vOff},prevMode=curRoom?.planViewMode,prevLegend=curRoom?.showPlanLegend,prevMeasurements=showMeasurements;
  const tempCanvas=document.createElement('canvas');
  tempCanvas.width=width;
  tempCanvas.height=height;
  const tempCtx=tempCanvas.getContext('2d');
  curRoom=room;
  canvas=tempCanvas;
  ctx=tempCtx;
  curRoom.planViewMode=mode;
  if(typeof opts.legend==='boolean')curRoom.showPlanLegend=opts.legend;
  showMeasurements=opts.measurements!==false;
  autoFit();
  draw();
  const dataUrl=tempCanvas.toDataURL('image/png');
  showMeasurements=prevMeasurements;
  canvas=prevCanvas;
  ctx=prevCtx;
  curRoom=prevRoom;
  if(curRoom){
    curRoom.planViewMode=prevMode;
    curRoom.showPlanLegend=prevLegend;
  }
  vScale=prevScale;
  vOff=prevOff;
  if(prevCanvas&&prevCtx)draw();
  return dataUrl;
}
function exportComparisonSheet(){
  if(!curRoom||!curRoom.polygon.length){toast('Open a room first');return}
  const before=renderPlanModeToDataURL('existing',1200,820);
  const after=renderPlanModeToDataURL('redesign',1200,820);
  if(!before||!after){toast('Could not render comparison');return}
  const out=document.createElement('canvas');
  out.width=2400;
  out.height=1500;
  const c=out.getContext('2d');
  c.fillStyle='#F6F0E8';
  c.fillRect(0,0,out.width,out.height);
  c.fillStyle='#3A2E25';
  c.font='700 60px Georgia, serif';
  c.fillText(curRoom.name||'Room Comparison',120,110);
  c.font='500 24px Outfit, sans-serif';
  c.fillStyle='#7B6B5E';
  c.fillText('Before / after room story board',120,152);
  const drawCard=(img,title,x)=>{
    c.fillStyle='rgba(255,252,248,.96)';
    c.strokeStyle='rgba(123,107,94,.12)';
    c.lineWidth=2;
    c.beginPath();
    c.roundRect(x,220,1020,1080,30);
    c.fill();
    c.stroke();
    c.fillStyle='#4C3F34';
    c.font='700 34px Outfit, sans-serif';
    c.fillText(title,x+40,278);
    c.drawImage(img,x+30,320,960,900);
  };
  const beforeImg=new Image(),afterImg=new Image();
  let loaded=0;
  const finalize=()=>{
    loaded++;
    if(loaded<2)return;
    drawCard(beforeImg,'Existing Room',120);
    drawCard(afterImg,'Redesign Direction',1260);
    const a=document.createElement('a');
    a.href=out.toDataURL('image/png');
    a.download=`${(curRoom.name||'room').replace(/[^a-z0-9]/gi,'_')}_comparison_sheet.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Comparison sheet exported');
  };
  beforeImg.onload=finalize;
  afterImg.onload=finalize;
  beforeImg.src=before;
  afterImg.src=after;
}
function exportDesignSummary(){
  if(!curRoom){toast('Open a room first');return}
  const siblings=optionSiblings(curRoom).sort((a,b)=>(a.optionName||'').localeCompare(b.optionName||''));
  const cardH=420,margin=70;
  const rooms=siblings.map(room=>{
    if(!room.previewThumb&&room.polygon?.length)updateRoomPreviewThumb(room);
    return room;
  });
  Promise.all(rooms.map(room=>new Promise(resolve=>{
    if(!room.previewThumb)return resolve({room,img:null});
    const img=new Image();
    img.onload=()=>resolve({room,img});
    img.onerror=()=>resolve({room,img:null});
    img.src=room.previewThumb;
  }))).then(entries=>{
    const out=document.createElement('canvas');
    out.width=1600;
    out.height=Math.max(900,220+entries.length*cardH);
    const c=out.getContext('2d');
    c.fillStyle='#F6F0E8';
    c.fillRect(0,0,out.width,out.height);
    c.fillStyle='#3A2E25';
    c.font='700 54px Georgia, serif';
    c.fillText(curRoom.name||'Room Summary',margin,92);
    c.font='500 22px Outfit, sans-serif';
    c.fillStyle='#7B6B5E';
  c.fillText('Design direction summary',margin,130);
    entries.forEach(({room,img},index)=>{
      const y=180+index*cardH;
      c.fillStyle='rgba(255,252,248,.96)';
      c.strokeStyle='rgba(123,107,94,.12)';
      c.lineWidth=2;
      c.beginPath();
      c.roundRect(margin,y,1460,360,28);
      c.fill();
      c.stroke();
      c.fillStyle='#4C3F34';
      c.font='700 30px Outfit, sans-serif';
      c.fillText(room.optionName||'Main Direction',margin+36,y+46);
      const stats=collectRoomPlanStats(room);
      c.font='500 18px Outfit, sans-serif';
      c.fillStyle='#7B6B5E';
      c.fillText(`Existing ${stats.existing} • New ${stats.newItems} • Keep ${stats.keep} • Move ${stats.move} • Replace ${stats.replace} • Remove ${stats.remove}`,margin+36,y+78);
      if(img)c.drawImage(img,margin+36,y+104,420,220);
      c.fillStyle='#4C3F34';
      c.font='600 18px Outfit, sans-serif';
      c.fillText('Story Notes',margin+500,y+128);
      c.font='500 18px Outfit, sans-serif';
      c.fillStyle='#6A5A4F';
      const notes=(room.optionNotes||'No notes yet.').slice(0,360);
      const words=notes.split(/\s+/);
      let line='',lineY=y+164;
      words.forEach(word=>{
        const test=(line?`${line} `:'')+word;
        if(c.measureText(test).width>560&&line){
          c.fillText(line,margin+500,lineY);
          line=word;
          lineY+=28;
        }else line=test;
      });
      if(line)c.fillText(line,margin+500,lineY);
    });
    const a=document.createElement('a');
    a.href=out.toDataURL('image/png');
    a.download=`${(curRoom.name||'room').replace(/[^a-z0-9]/gi,'_')}_design_summary.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast('Design summary exported');
  });
}
function exportBaseName(room=curRoom,suffix='plan'){
  return `${(room?.name||'room').replace(/[^a-z0-9]/gi,'_')}_${suffix}`;
}
function downloadTextFile(filename,text,type='text/plain;charset=utf-8'){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),500);
}
function rotatedFurnitureCorners(item){
  const hw=(item.w||2)/2,hd=(item.d||1.5)/2,an=((item.rotation||0)*Math.PI)/180;
  const pts=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]];
  return pts.map(([dx,dz])=>({
    x:(item.x||0)+dx*Math.cos(an)-dz*Math.sin(an),
    y:(item.z||0)+dx*Math.sin(an)+dz*Math.cos(an)
  }));
}
function openingCenterPoint(room,opening){
  const wall=room.walls.find(w=>w.id===opening.wallId);
  if(!wall)return null;
  const a=wS(room,wall),b=wE(room,wall),wl=wL(room,wall)||1,t=(opening.offset||0)/wl;
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x),wallLength:wl};
}
function roomExportMeta(room=curRoom){
  const b=getRoomBounds2D(room);
  const area=polygonArea(room.polygon||[]);
  return {bounds:b,area};
}
function exportSVG(){
  if(!curRoom||!curRoom.polygon?.length){toast('Open a room first');return}
  const room=curRoom;
  const meta=roomExportMeta(room);
  // Phase 2B — wider pad to make room for per-wall dims, scale bar, north arrow
  const pad=3.5;
  const minX=meta.bounds.x0-pad,maxX=meta.bounds.x1+pad,minY=meta.bounds.y0-pad,maxY=meta.bounds.y1+pad;
  const vbW=maxX-minX,vbH=maxY-minY;
  const mapPoint=pt=>`${(pt.x-minX).toFixed(2)},${(maxY-pt.y).toFixed(2)}`;
  const polygonPoints=(room.polygon||[]).map(mapPoint).join(' ');
  const walls=(room.walls||[]).map(w=>{
    const a=wS(room,w),b=wE(room,w);
    return `<line x1="${(a.x-minX).toFixed(2)}" y1="${(maxY-a.y).toFixed(2)}" x2="${(b.x-minX).toFixed(2)}" y2="${(maxY-b.y).toFixed(2)}" />`;
  }).join('\n');
  const openings=(room.openings||[]).map(op=>{
    const center=openingCenterPoint(room,op);
    if(!center)return '';
    const half=(op.width||3)/2;
    const dx=Math.cos(center.angle)*half,dy=Math.sin(center.angle)*half;
    const x1=(center.x-dx-minX).toFixed(2),y1=(maxY-(center.y-dy)).toFixed(2);
    const x2=(center.x+dx-minX).toFixed(2),y2=(maxY-(center.y+dy)).toFixed(2);
    return `<line class="${op.type}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
  }).join('\n');
  const furniture=(room.furniture||[]).filter(item=>getFurnitureRenderState(item,room).visible).map(item=>{
    const corners=rotatedFurnitureCorners(item);
    const pts=corners.map(mapPoint).join(' ');
    const labelX=((item.x||0)-minX).toFixed(2),labelY=(maxY-(item.z||0)).toFixed(2);
    return `<g class="furniture ${item.source||'new'}"><polygon points="${pts}" /><text x="${labelX}" y="${labelY}" text-anchor="middle">${esc(item.label||'Item')}</text></g>`;
  }).join('\n');
  const annotations=(room.textAnnotations||[]).map(note=>{
    const x=((note.x||0)-minX).toFixed(2),y=(maxY-(note.z||0)).toFixed(2);
    const fill=esc(note.color||'#8E6E6B');
    const size=(Math.max(11,Number(note.fontSize)||14)*0.06).toFixed(2);
    return `<text class="annotation" x="${x}" y="${y}" fill="${fill}" font-size="${size}" text-anchor="middle">${esc(note.text||'Note')}</text>`;
  }).join('\n');
  const dimensionAnnotations=(room.dimensionAnnotations||[]).map(note=>{
    const x1=((note.x1||0)-minX).toFixed(2),y1=(maxY-(note.z1||0)).toFixed(2);
    const x2=((note.x2||0)-minX).toFixed(2),y2=(maxY-(note.z2||0)).toFixed(2);
    const mx=((((note.x1||0)+(note.x2||0))/2)-minX).toFixed(2),my=(maxY-(((note.z1||0)+(note.z2||0))/2)).toFixed(2);
    const label=esc((note.label||'').trim()||formatDistance(Math.hypot((note.x2||0)-(note.x1||0),(note.z2||0)-(note.z1||0))));
    const stroke=esc(note.color||'#8E6E6B');
    const size=(Math.max(10,Number(note.fontSize)||13)*0.06).toFixed(2);
    return `<g class="dim-annotation" stroke="${stroke}" fill="${stroke}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" /><text x="${mx}" y="${my}" font-size="${size}" text-anchor="middle">${label}</text></g>`;
  }).join('\n');
  const roomLabelX=(meta.bounds.cx-minX).toFixed(2),roomLabelY=(maxY-meta.bounds.cy).toFixed(2);
  const widthLabel=formatDistance(meta.bounds.width),heightLabel=formatDistance(meta.bounds.height);
  // Phase 2B — per-wall dimension ticks: label each edge of the room polygon with its length
  const wallDims=(()=>{
    const poly=room.polygon||[];if(poly.length<2)return '';
    const parts=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i],b=poly[(i+1)%poly.length];
      const dx=b.x-a.x,dy=b.y-a.y;const len=Math.hypot(dx,dy);if(len<0.6)continue;
      const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      // offset perpendicular toward outside of polygon (away from centroid)
      const tx=-dy/len,ty=dx/len;
      const toCen=Math.sign((meta.bounds.cx-mx)*tx+(meta.bounds.cy-my)*ty);
      const off=0.55*(toCen>0?-1:1);
      const lx=(mx+tx*off-minX).toFixed(2),ly=(maxY-(my+ty*off)).toFixed(2);
      const ang=-Math.atan2(dy,dx)*180/Math.PI;
      parts.push(`<text class="walldim" x="${lx}" y="${ly}" transform="rotate(${ang.toFixed(1)} ${lx} ${ly})">${esc(formatDistance(len))}</text>`);
    }
    return parts.join('\n');
  })();
  // Phase 2B — scale bar (1 ft increments, 5ft total if room allows)
  const scaleBar=(()=>{
    const barFt=Math.min(5,Math.max(2,Math.floor(meta.bounds.width/4)));
    const barX=0.8,barY=vbH-1.1;
    const unit=1;const segs=[];
    for(let i=0;i<barFt;i++){
      segs.push(`<rect x="${(barX+i*unit).toFixed(2)}" y="${barY.toFixed(2)}" width="${unit.toFixed(2)}" height=".18" fill="${i%2?'#3a2e25':'#faf8f4'}" stroke="#3a2e25" stroke-width=".03"/>`);
    }
    segs.push(`<text class="scalebar" x="${(barX).toFixed(2)}" y="${(barY-.2).toFixed(2)}">0</text>`);
    segs.push(`<text class="scalebar" x="${(barX+barFt*unit).toFixed(2)}" y="${(barY-.2).toFixed(2)}">${barFt} ft</text>`);
    return segs.join('\n');
  })();
  // Phase 2B — north arrow, top-right corner
  const northArrow=(()=>{
    const nx=vbW-1.2,ny=1.4,r=0.55;
    return `<g class="north" transform="translate(${nx.toFixed(2)} ${ny.toFixed(2)})">
      <circle r="${r.toFixed(2)}" fill="none" stroke="#3a2e25" stroke-width=".04"/>
      <polygon points="0,-${r.toFixed(2)} ${(r*0.28).toFixed(2)},${(r*0.15).toFixed(2)} 0,0 -${(r*0.28).toFixed(2)},${(r*0.15).toFixed(2)}" fill="#3a2e25"/>
      <text x="0" y="-${(r+0.18).toFixed(2)}" class="north-label">N</text>
    </g>`;
  })();
  const svg=`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 ${vbW.toFixed(2)} ${vbH.toFixed(2)}">
  <style>
    .room-fill { fill: rgba(216,229,214,.45); stroke: #5f5a54; stroke-width: .08; }
    .walls { stroke: #3f3a36; stroke-width: .22; stroke-linecap: square; }
    .door { stroke: #b86e54; stroke-width: .16; }
    .window { stroke: #5b88b2; stroke-width: .16; }
    .furniture polygon { fill: rgba(139,115,85,.16); stroke: #6b5640; stroke-width: .08; }
    .furniture.existing polygon { fill: rgba(94,135,112,.12); stroke: #5e8770; }
    .furniture text { font: .52px Inter, Arial, sans-serif; fill: #3a2e25; dominant-baseline: middle; }
    .annotation { font-family: Inter, Arial, sans-serif; font-weight: 700; dominant-baseline: middle; }
    .dim-annotation line { stroke-width: .08; }
    .dim-annotation text { font-family: Inter, Arial, sans-serif; font-weight: 700; dominant-baseline: middle; }
    .room-title { font: .8px Georgia, serif; fill: #3a2e25; text-anchor: middle; }
    .room-meta { font: .46px Inter, Arial, sans-serif; fill: #7b6b5e; text-anchor: middle; }
    .dimension { font: .44px Inter, Arial, sans-serif; fill: #8b7355; text-anchor: middle; }
    .walldim { font: .36px Inter, Arial, sans-serif; fill: #5a4838; text-anchor: middle; dominant-baseline: middle; font-weight: 600; }
    .scalebar { font: .32px Inter, Arial, sans-serif; fill: #3a2e25; dominant-baseline: auto; }
    .north-label { font: .38px Georgia, serif; fill: #3a2e25; text-anchor: middle; font-weight: 700; }
  </style>
  <rect width="${vbW.toFixed(2)}" height="${vbH.toFixed(2)}" fill="#faf8f4" />
  <polygon class="room-fill" points="${polygonPoints}" />
  <g class="walls">${walls}</g>
  <g class="openings">${openings}</g>
  <g class="furniture">${furniture}</g>
  <g class="annotations">${annotations}</g>
  <g class="dimension-annotations">${dimensionAnnotations}</g>
  <text class="room-title" x="${roomLabelX}" y="${roomLabelY}">${esc(room.name||'Room')}</text>
  <text class="room-meta" x="${roomLabelX}" y="${(Number(roomLabelY)+0.9).toFixed(2)}">${formatArea(meta.area)}</text>
  <text class="dimension" x="${((meta.bounds.cx)-minX).toFixed(2)}" y="${(vbH-0.5).toFixed(2)}">${widthLabel}</text>
  <text class="dimension" x="${(0.6).toFixed(2)}" y="${(vbH/2).toFixed(2)}" transform="rotate(-90 ${(0.6).toFixed(2)} ${(vbH/2).toFixed(2)})">${heightLabel}</text>
  <g class="wall-dimensions">${wallDims}</g>
  ${scaleBar}
  ${northArrow}
</svg>`;
  downloadTextFile(`${exportBaseName(room,'plan')}.svg`,svg,'image/svg+xml;charset=utf-8');
  toast('SVG exported');
}
function exportProjectJSON(){
  if(!projects?.length){toast('No projects to export');return}
  const payload=window.RoseProjectSchema
    ? window.RoseProjectSchema.buildExportDocument(projects,activeProfile)
    : {
      schemaVersion:1,
      exportedAt:new Date().toISOString(),
      activeProfile,
      projects:JSON.parse(JSON.stringify(projects))
    };
  downloadTextFile(`${exportBaseName(curRoom||projects[0],'project')}.json`,JSON.stringify(payload,null,2),'application/json;charset=utf-8');
  toast('Project JSON exported');
}
function importProjectJSON(){
  const input=document.getElementById('projectJsonInput');
  if(!input)return;
  input.value='';
  input.click();
}
async function handleProjectJSONSelected(event){
  const file=event?.target?.files?.[0];
  if(!file)return;
  try{
    const text=await file.text();
    const parsed=JSON.parse(text);
    const validated=window.RoseProjectSchema
      ? window.RoseProjectSchema.validateImportedProjectDocument(parsed)
      : {rooms:Array.isArray(parsed)?parsed:Array.isArray(parsed.projects)?parsed.projects:null};
    const incoming=validated.rooms;
    if(!incoming?.length){toast('No projects found in JSON');return}
    const imported=incoming.map(room=>{
      const clone=JSON.parse(JSON.stringify(room));
      clone.id=clone.id||uid();
      return normalizeRoom(clone);
    });
    const ids=new Set(projects.map(room=>room.id));
    imported.forEach(room=>{
      if(ids.has(room.id))room.id=uid();
      projects.push(room);
      ids.add(room.id);
    });
    await saveAll();
    renderHome();
    toast(`Imported ${imported.length} room${imported.length===1?'':'s'}`);
  }catch(err){
    console.error('PROJECT JSON IMPORT ERROR',err);
    toast('Could not import JSON');
  }
}
function exportPDF(){
  exportPresentationPDF();
}
async function exportPresentationPDF(){
  if(!curRoom||!curRoom.polygon.length){toast('Open a room first');return}
  if(!window.jspdf){toast('PDF library loading...');return}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'pt',format:'a4'});
  const pageW=doc.internal.pageSize.getWidth(),pageH=doc.internal.pageSize.getHeight();
  const margin=36;
  const ink='#332922';
  const muted='#7B6B5E';
  const card='#FFFCF8';
  const border='#E6D8CC';
  const options=optionSiblings(curRoom).sort((a,b)=>(a.optionName||'').localeCompare(b.optionName||''));
  const roomName=curRoom.name||'Room';
  const fileBase=(roomName||'room').replace(/[^a-z0-9]/gi,'_');
  const created=new Date().toLocaleDateString();
  const pageFooter=(n,label="Rose's Indoor Designs Presentation")=>{
    doc.setDrawColor(border);
    doc.setLineWidth(1);
    doc.line(margin,pageH-28,pageW-margin,pageH-28);
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(140,126,116);
    doc.text(label,margin,pageH-14);
    doc.text(`Page ${n}`,pageW-margin,pageH-14,{align:'right'});
  };
  const roundedCard=(x,y,w,h,fill=card)=>{
    doc.setFillColor(fill);
    doc.setDrawColor(border);
    doc.roundedRect(x,y,w,h,16,16,'FD');
  };
  const addContainImage=(img,x,y,w,h,pad=12,fmt='PNG')=>{
    if(!img)return;
    const props=doc.getImageProperties(img);
    const iw=props?.width||w;
    const ih=props?.height||h;
    const scale=Math.min((w-pad*2)/iw,(h-pad*2)/ih);
    const drawW=iw*scale;
    const drawH=ih*scale;
    const dx=x+(w-drawW)/2;
    const dy=y+(h-drawH)/2;
    doc.addImage(img,fmt,dx,dy,drawW,drawH,undefined,'FAST');
  };
  const renderOptionDeck=(room)=>({
    combined:renderRoomModeToDataURL(room,'combined',1400,900,{legend:true,measurements:true}),
    existing:renderRoomModeToDataURL(room,'existing',1400,900,{legend:true,measurements:true}),
    redesign:renderRoomModeToDataURL(room,'redesign',1400,900,{legend:true,measurements:true})
  });
  const summarizeMeta=(room)=>{
    const b=getRoomBounds2D(room),area=polygonArea(room.polygon);
    return `${formatDistance(b.width)} x ${formatDistance(b.height)}   |   ${formatArea(area)}   |   Ceiling ${formatDistance(room.height)}`;
  };
  const writeWrapped=(text,x,y,maxW,lineH,maxLines=6,color=muted)=>{
    doc.setTextColor(color);
    const lines=doc.splitTextToSize(text||'',maxW).slice(0,maxLines);
    doc.text(lines,x,y);
    return y+(Math.max(lines.length,1)-1)*lineH;
  };
  const optionEntries=options.map(room=>{
    if(!room.previewThumb&&room.polygon?.length)updateRoomPreviewThumb(room);
    return {room,stats:collectRoomPlanStats(room),images:renderOptionDeck(room)};
  });

  doc.setFillColor(246,240,232);
  doc.rect(0,0,pageW,pageH,'F');
  doc.setFillColor(232,196,192);
  doc.roundedRect(margin,margin,pageW-margin*2,pageH-margin*2,22,22,'F');
  doc.setFillColor(255,252,248);
  doc.roundedRect(margin+18,margin+18,pageW-(margin+18)*2,pageH-(margin+18)*2,20,20,'F');
  doc.setFont('times','bold');
  doc.setFontSize(28);
  doc.setTextColor(ink);
  doc.text(roomName,margin+34,88);
  doc.setFont('helvetica','normal');
  doc.setFontSize(14);
  doc.setTextColor(muted);
  doc.text('Presentation deck for review and reveal',margin+34,112);
  doc.text(created,pageW-margin-10,88,{align:'right'});
  roundedCard(margin+28,136,370,354,'#F8EFE7');
  doc.setFont('helvetica','bold');
  doc.setFontSize(14);
  doc.setTextColor(ink);
  doc.text('Room Story',margin+48,170);
  doc.setFont('helvetica','normal');
  doc.setFontSize(12);
  writeWrapped(`This deck bundles the current room, redesign directions, notes, and comparison views into a clean presentation sequence.`,margin+48,196,322,18,5);
  const hero=renderRoomModeToDataURL(curRoom,'combined',1600,1000,{legend:true,measurements:true});
  roundedCard(420,136,pageW-456,354);
  addContainImage(hero,420,136,pageW-456,354,16);
  const overviewStats=collectRoomPlanStats(curRoom);
  const infoY=526;
  roundedCard(margin+28,infoY,pageW-margin*2-56,74,'#FBF6F0');
  doc.setFont('helvetica','bold');
  doc.setFontSize(13);
  doc.setTextColor(ink);
  doc.text('Current Room Snapshot',margin+48,infoY+26);
  doc.setFont('helvetica','normal');
  doc.setFontSize(11);
  doc.setTextColor(muted);
  doc.text(summarizeMeta(curRoom),margin+48,infoY+46);
  doc.text(`Options ${optionEntries.length}   |   Existing ${overviewStats.existing}   |   New ${overviewStats.newItems}   |   Replace ${overviewStats.replace}   |   Remove ${overviewStats.remove}`,margin+48,infoY+62);
  const listTop=infoY+94;
  const colW=(pageW-margin*2-72)/2;
  optionEntries.forEach((entry,index)=>{
    const col=index%2;
    const row=Math.floor(index/2);
    const x=margin+28+col*(colW+16);
    const y=listTop+row*82;
    if(y>pageH-90)return;
    roundedCard(x,y,colW,68,row%2?'#FFF9F5':'#FCF8F3');
    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.setTextColor(ink);
    doc.text(entry.room.optionName||`Option ${index+1}`,x+16,y+22);
    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    doc.setTextColor(muted);
    doc.text(`Keep ${entry.stats.keep}   Move ${entry.stats.move}   Replace ${entry.stats.replace}   Remove ${entry.stats.remove}`,x+16,y+40);
    const previewText=(entry.room.optionNotes||'No option notes yet.').trim()||'No option notes yet.';
    writeWrapped(previewText,x+16,y+56,colW-32,12,1);
  });
  pageFooter(1);

  let pageNo=2;
  optionEntries.forEach((entry,index)=>{
    doc.addPage('a4','landscape');
    doc.setFillColor(246,240,232);
    doc.rect(0,0,pageW,pageH,'F');
    doc.setFillColor(255,252,248);
    doc.roundedRect(margin,margin,pageW-margin*2,pageH-margin*2,20,20,'F');
    doc.setFont('times','bold');
    doc.setFontSize(24);
    doc.setTextColor(ink);
    doc.text(`${entry.room.optionName||`Option ${index+1}`}`,margin+18,72);
    doc.setFont('helvetica','normal');
    doc.setFontSize(11);
    doc.setTextColor(muted);
    doc.text(summarizeMeta(entry.room),margin+18,92);
    doc.text(`Existing ${entry.stats.existing}   New ${entry.stats.newItems}   Keep ${entry.stats.keep}   Move ${entry.stats.move}   Replace ${entry.stats.replace}   Remove ${entry.stats.remove}`,margin+18,108);
    roundedCard(margin+18,126,220,390,'#FBF5EE');
    doc.setFont('helvetica','bold');
    doc.setFontSize(13);
    doc.setTextColor(ink);
    doc.text('Story Notes',margin+34,152);
    doc.setFont('helvetica','normal');
    doc.setFontSize(11);
    writeWrapped((entry.room.optionNotes||'No notes yet for this option.').trim()||'No notes yet for this option.',margin+34,176,188,16,16);
    const slotX=254,slotY=126,slotW=pageW-slotX-margin-18,slotH=116,gap=12;
    [
      {title:'Existing Room',img:entry.images.existing},
      {title:'Redesign Direction',img:entry.images.redesign},
      {title:'Layered View',img:entry.images.combined}
    ].forEach((panel,panelIndex)=>{
      const y=slotY+panelIndex*(slotH+gap);
      roundedCard(slotX,y,slotW,slotH);
      doc.setFont('helvetica','bold');
      doc.setFontSize(12);
      doc.setTextColor(ink);
      doc.text(panel.title,slotX+14,y+18);
      addContainImage(panel.img,slotX+6,y+20,slotW-12,slotH-26,8);
    });
    pageFooter(pageNo++,`${roomName} | ${entry.room.optionName||`Option ${index+1}`}`);
  });

  for(let start=0;start<optionEntries.length;start+=2){
    doc.addPage('a4','landscape');
    doc.setFillColor(246,240,232);
    doc.rect(0,0,pageW,pageH,'F');
    doc.setFont('times','bold');
    doc.setFontSize(24);
    doc.setTextColor(ink);
    doc.text('Direction Comparison',margin,70);
    doc.setFont('helvetica','normal');
    doc.setFontSize(11);
    doc.setTextColor(muted);
    doc.text('Compare alternate redesign directions at a glance, with notes and plan views lined up for quick decisions.',margin,90);
    const chunk=optionEntries.slice(start,start+2);
    chunk.forEach((entry,idx)=>{
      const x=margin+idx*((pageW-margin*2-20)/2+20);
      const cardW=(pageW-margin*2-20)/2;
      roundedCard(x,116,cardW,380);
      doc.setFont('helvetica','bold');
      doc.setFontSize(14);
      doc.setTextColor(ink);
      doc.text(entry.room.optionName||`Option ${start+idx+1}`,x+18,142);
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      doc.setTextColor(muted);
      doc.text(`Keep ${entry.stats.keep}   Move ${entry.stats.move}   Replace ${entry.stats.replace}   Remove ${entry.stats.remove}`,x+18,160);
      addContainImage(entry.images.combined,x+16,172,cardW-32,190,12);
      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      doc.setTextColor(ink);
      doc.text('Story Notes',x+18,382);
      doc.setFont('helvetica','normal');
      doc.setFontSize(10);
      writeWrapped((entry.room.optionNotes||'No notes yet.').trim()||'No notes yet.',x+18,400,cardW-36,14,6);
    });
    pageFooter(pageNo++);
  }

  // === Phase 2C — Furniture schedule + materials legend page ===
  try{
    doc.addPage('a4','landscape');
    doc.setFillColor(246,240,232);
    doc.rect(0,0,pageW,pageH,'F');
    doc.setFillColor(255,252,248);
    doc.roundedRect(margin,margin,pageW-margin*2,pageH-margin*2,20,20,'F');
    doc.setFont('times','bold');doc.setFontSize(22);doc.setTextColor(ink);
    doc.text('Schedule & Finishes',margin+18,72);
    doc.setFont('helvetica','normal');doc.setFontSize(11);doc.setTextColor(muted);
    doc.text(`${roomName}   |   ${summarizeMeta(curRoom)}`,margin+18,92);

    // Furniture schedule table
    const schedRows=(curRoom.furniture||[]).map(f=>{
      const reg=(typeof MODEL_REGISTRY!=='undefined'&&MODEL_REGISTRY[f.assetKey])||{};
      const label=f.label||reg.label||f.assetKey||'Item';
      const dims=(f.w&&f.d)?`${formatDistance(f.w)} x ${formatDistance(f.d)}`:'-';
      const status=f.tag||f.status||(f.isNew?'New':'Existing');
      const cat=reg.category||f.category||'furniture';
      return [label,cat,dims,status];
    });
    // Phase 2C — totals row: counts by status
    const statusCounts=schedRows.reduce((acc,r)=>{const k=String(r[3]||'Other');acc[k]=(acc[k]||0)+1;return acc},{});
    const totalsLabel=Object.entries(statusCounts).map(([k,v])=>`${k} ${v}`).join('   |   ')||'No items';
    const roomArea=polygonArea(curRoom.polygon||[]);
    const headers=['Item','Category','Footprint','Status'];
    const colXs=[margin+18,margin+260,margin+400,margin+540];
    let y=126;
    doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(ink);
    doc.setDrawColor(border);doc.setLineWidth(1);
    doc.line(margin+18,y+4,pageW-margin-18,y+4);
    headers.forEach((h,i)=>doc.text(h,colXs[i],y));
    y+=18;
    doc.setFont('helvetica','normal');doc.setFontSize(10);
    schedRows.slice(0,22).forEach((row,i)=>{
      if(i%2===0){doc.setFillColor(251,246,240);doc.rect(margin+16,y-10,pageW-margin*2-32,16,'F')}
      doc.setTextColor(ink);
      row.forEach((cell,ci)=>{
        const txt=String(cell||'').slice(0,ci===0?36:20);
        doc.text(txt,colXs[ci],y);
      });
      y+=16;
      if(y>pageH-90)return;
    });
    if(schedRows.length>22){
      doc.setTextColor(muted);doc.setFontSize(9);
      doc.text(`+${schedRows.length-22} more items (see project file)`,margin+18,y+8);
      y+=14;
    }
    // Phase 2C — totals footer row
    doc.setDrawColor(border);doc.setLineWidth(1);
    doc.line(margin+18,y+6,pageW-margin-18,y+6);
    doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(ink);
    doc.text(`Total items: ${schedRows.length}`,margin+18,y+22);
    doc.setFont('helvetica','normal');doc.setTextColor(muted);
    doc.text(totalsLabel,margin+160,y+22);
    doc.text(`Room area: ${formatArea(roomArea)}`,pageW-margin-18,y+22,{align:'right'});

    // Phase 2C — multi-room project summary (only if >1 room)
    if(Array.isArray(projects)&&projects.length>1){
      doc.addPage('a4','landscape');
      doc.setFillColor(246,240,232);doc.rect(0,0,pageW,pageH,'F');
      doc.setFillColor(255,252,248);
      doc.roundedRect(margin,margin,pageW-margin*2,pageH-margin*2,20,20,'F');
      doc.setFont('times','bold');doc.setFontSize(22);doc.setTextColor(ink);
      doc.text('Project Summary',margin+18,72);
      doc.setFont('helvetica','normal');doc.setFontSize(11);doc.setTextColor(muted);
      doc.text(`${projects.length} rooms   |   ${created}`,margin+18,92);

      const rhead=['Room','Dimensions','Area','Ceiling','Items','Existing','New'];
      const rcols=[margin+18,margin+210,margin+360,margin+450,margin+540,margin+620,margin+700];
      let py=126;
      doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(ink);
      doc.setDrawColor(border);doc.setLineWidth(1);
      doc.line(margin+18,py+4,pageW-margin-18,py+4);
      rhead.forEach((h,i)=>doc.text(h,rcols[i],py));
      py+=18;
      doc.setFont('helvetica','normal');doc.setFontSize(10);

      let totalArea=0,totalItems=0,totalExisting=0,totalNew=0;
      projects.forEach((rm,i)=>{
        if(!rm.polygon?.length)return;
        const b=getRoomBounds2D(rm),a=polygonArea(rm.polygon);
        const items=(rm.furniture||[]).length;
        const ex=(rm.furniture||[]).filter(f=>(f.source||f.tag||'').toLowerCase().includes('exist')||f.isExisting).length;
        const nw=items-ex;
        totalArea+=a;totalItems+=items;totalExisting+=ex;totalNew+=nw;
        if(i%2===0){doc.setFillColor(251,246,240);doc.rect(margin+16,py-10,pageW-margin*2-32,16,'F')}
        doc.setTextColor(ink);
        const row=[
          String(rm.name||`Room ${i+1}`).slice(0,28),
          `${formatDistance(b.width)} x ${formatDistance(b.height)}`,
          formatArea(a),
          formatDistance(rm.height||8),
          String(items),String(ex),String(nw)
        ];
        row.forEach((c,ci)=>doc.text(c,rcols[ci],py));
        py+=16;
        if(py>pageH-90)return;
      });
      // totals row
      doc.setDrawColor(border);doc.setLineWidth(1.2);
      doc.line(margin+18,py+4,pageW-margin-18,py+4);
      py+=20;
      doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(ink);
      doc.text('Totals',rcols[0],py);
      doc.text(formatArea(totalArea),rcols[2],py);
      doc.text(String(totalItems),rcols[4],py);
      doc.text(String(totalExisting),rcols[5],py);
      doc.text(String(totalNew),rcols[6],py);
      pageFooter(pageNo++,`${roomName} | Project Summary`);
    }

    // Materials legend
    const legY=Math.max(y+24,pageH-180);
    const m=curRoom.materials||{};
    const swatches=[
      {label:'Wall',val:m.wall,sub:m.wallFinish||'-'},
      {label:'Floor',val:m.floor,sub:m.floorType||'-'},
      {label:'Ceiling',val:m.ceiling,sub:`brightness ${m.ceilingBrightness||1}`},
      {label:'Trim',val:m.trim,sub:'-'},
      {label:'Lighting',val:'#F8E7C5',sub:m.lightingPreset||'daylight'}
    ];
    doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(ink);
    doc.text('Finish Legend',margin+18,legY);
    const swW=(pageW-margin*2-36-(swatches.length-1)*12)/swatches.length;
    swatches.forEach((sw,i)=>{
      const sx=margin+18+i*(swW+12),sy=legY+10;
      roundedCard(sx,sy,swW,104,'#FBF6F0');
      // color chip
      try{
        const hex=(sw.val||'#EFE6DA').replace('#','');
        const r=parseInt(hex.substr(0,2),16)||239,g=parseInt(hex.substr(2,2),16)||230,b=parseInt(hex.substr(4,2),16)||218;
        doc.setFillColor(r,g,b);doc.setDrawColor(border);doc.roundedRect(sx+14,sy+14,swW-28,40,6,6,'FD');
      }catch(_){}
      doc.setFont('helvetica','bold');doc.setFontSize(11);doc.setTextColor(ink);
      doc.text(sw.label,sx+14,sy+70);
      doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(muted);
      doc.text(String(sw.val||'-'),sx+14,sy+84);
      doc.text(String(sw.sub||''),sx+14,sy+96);
    });
    pageFooter(pageNo++,`${roomName} | Schedule`);
  }catch(err){console.warn('Schedule page failed:',err)}

  doc.save(`${fileBase}_presentation.pdf`);
  toast('Presentation PDF exported');
}
function printFloorPlan(){
  if(!curRoom||!curRoom.polygon.length){toast('Open a room first');return}
  const prevM=showMeasurements;showMeasurements=true;
  const prevW=canvas.width,prevH=canvas.height;
  canvas.width=1400;canvas.height=1050;autoFit();draw();
  const ph=document.getElementById('printHeader');
  if(ph){const b=getRoomBounds2D(curRoom),area=polygonArea(curRoom.polygon);
    ph.querySelector('h2').textContent=curRoom.name||'Room';
    ph.querySelector('p').textContent=`${formatDistance(b.width)} x ${formatDistance(b.height)} | ${formatArea(area)} | Ceiling: ${formatDistance(curRoom.height)}`}
  window.print();
  canvas.width=prevW;canvas.height=prevH;showMeasurements=prevM;autoFit();draw()
}
