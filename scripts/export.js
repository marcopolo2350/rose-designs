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
  const pageFooter=(n,label='Rose Designs Presentation')=>{
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
