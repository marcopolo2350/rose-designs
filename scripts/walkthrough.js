// ── IDLE (UI auto-fade in 3D) ──
let idleT = null, idleOn = false;
function resetIdle() {
  if (idleT) clearTimeout(idleT);
  if (idleOn) {
    document.querySelectorAll('.ed-hdr,.tbar,.cam-btns').forEach(el => {
      el.style.opacity = '';
      el.style.transition = '';
    });
    idleOn = false;
  }
  if (is3D) idleT = setTimeout(() => {
    idleOn = true;
    document.querySelectorAll('.ed-hdr,.tbar').forEach(el => {
      el.style.opacity = '0.12';
      el.style.transition = 'opacity 2.5s ease';
    });
  }, 20000);
}

// ── UNDO HOOK ──
// Called on every edit action. Pushes undo snapshot and resets idle timer.
function pushU() { pushUBase(); resetIdle(); }

// ── WELCOME (time-aware greeting) ──
function updateWelcomeForTime() {
  const g = document.querySelector('.w-greeting');
  if (!g) return;
  if (activeProfile !== 'rose') { g.textContent = 'Welcome back'; return; }
  const t = getTimeOfDay();
  if (t === 'morning') g.textContent = 'Good morning, Rose';
  else if (t === 'evening') g.textContent = 'Good evening, Rose';
  else if (t === 'night') g.textContent = 'Late night, Rose';
  else g.textContent = 'Hi Rose';
}

// ── STUBS (formerly affirmation/garden/story — removed) ──
// These stubs prevent errors from any remaining call sites.
function maybeAffirm() {}
function maybeMirror() {}
function maybeNoteP() {}
function trackPace() {}
function getPace() { return 'normal'; }
function checkReturn() {}
function checkRoomReturn() {}
function checkFullBloom() {}
function checkDeep() {}
async function loadDS() {}
async function saveDS() {}
function checkUnlocks() {}
function openGarden() {}
function closeGarden() {}
async function showStory() {}
function closeStory() {}
function enterPause() {}
async function saveMemory() {}
async function generateStory() { return ''; }
async function loadRoomNotes() { return []; }
async function saveRoomNote() {}
async function maybeSurfaceNote() {}
const MOODS = ['Cozy','Dreamy','Elegant','Feels like home','Keep forever','Peaceful','Romantic','Bright','Moody'];
function setRoomMood(mood) {
  if (!curRoom) return;
  curRoom.mood = curRoom.mood === mood ? '' : mood;
  saveAll();
  document.querySelectorAll('.mood-tag').forEach(tag => {
    tag.classList.toggle('sel', tag.textContent.toLowerCase() === curRoom.mood);
  });
  if (curRoom.mood) toast(curRoom.mood.charAt(0).toUpperCase() + curRoom.mood.slice(1));
}
function showMoodHelp() {
  toast('Mood tags help label the feeling of this room in summaries and presentation views.');
}
function getSeasonalTouch() { return null; }
function recordWalkUsage() {}

// ── UTILITY ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── SELF TEST (dev tool — intact) ──
let selfTestPromise = null;
async function runSelfTest() {
  if (selfTestPromise) return selfTestPromise;
  selfTestPromise = (async () => {
    const out = document.getElementById('selfTestResults');
    if (!out) return;
    out.style.display = 'block';
    const results = [];
    const note = (name, pass, detail = '') => results.push(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` - ${detail}` : ''}`);
    try {
      const room = normalizeRoom({
        id: uid(), name: 'Self Test Room', height: 9, wallThickness: .5,
        polygon: [{x:0,y:0},{x:14,y:0},{x:14,y:12},{x:0,y:12}],
        openings: [], structures: [], furniture: [],
        materials: {
          wall: WALL_PALETTES[0].color, wallFinish: 'warm_white',
          floor: FLOOR_TYPES[0].color, floorType: FLOOR_TYPES[0].id,
          ceiling: '#FAF7F2', trim: TRIM_COLORS[0],
          ceilingBrightness: 1, lightingPreset: 'daylight'
        },
        createdAt: Date.now(), updatedAt: Date.now()
      });
      projects = [room]; curRoom = room; openEd(room);
      const wall0 = curRoom.walls[0], wall1 = curRoom.walls[1];
      curRoom.openings.push({id:uid(),type:'door',wallId:wall0.id,offset:4,width:3,height:7,swing:'in'});
      curRoom.openings.push({id:uid(),type:'window',wallId:wall1.id,offset:5,width:3,height:4,sillHeight:3});
      curRoom.openings.push({id:uid(),type:'window',wallId:wall1.id,offset:9,width:3.6,height:4,sillHeight:2.8});
      curRoom.structures.push({id:uid(),type:'closet',rect:{x:9,y:7,w:4,h:4},height:curRoom.height,look:'cabinetry',finish:'white_shaker'});
      const placedAssets = [
        {label:'Sofa',assetKey:'sofa',x:3.4,z:3.6,w:5,d:2.5,rotation:25,mountType:'floor',elevation:0},
        {label:'Bookshelf',assetKey:'bookshelf',x:11.2,z:2.1,w:3,d:1,rotation:180,mountType:'floor',elevation:0},
        {label:'Dining Table',assetKey:'dining_table',x:6.8,z:7.1,w:5,d:3,rotation:0,mountType:'floor',elevation:0},
        {label:'Blinds',assetKey:'blinds',x:14,z:6,w:3.6,d:.2,rotation:0,mountType:'wall',elevation:6},
        {label:'Wall Art',assetKey:'wall_art_01',x:0,z:6,w:2.4,d:.2,rotation:0,mountType:'wall',elevation:5.2},
        {label:'Floor Lamp',assetKey:'lamp_floor',x:2,z:9.5,w:1,d:1,rotation:0,mountType:'floor',elevation:0},
        {label:'Dresser',assetKey:'dresser',x:10.8,z:10,w:4,d:1.8,rotation:180,mountType:'floor',elevation:0},
        {label:'Curtains',assetKey:'curtains',x:14,z:9,w:3.8,d:.25,rotation:0,mountType:'wall',elevation:7.2},
        {label:'Mirror',assetKey:'mirror',x:0,z:3.6,w:2,d:.2,rotation:0,mountType:'wall',elevation:5},
      ];
      placedAssets.forEach(item => curRoom.furniture.push({id:uid(),...item,yOffset:0}));
      pushU(); draw();
      note('door created', curRoom.openings.some(o => o.type === 'door'));
      note('window created', curRoom.openings.filter(o => o.type === 'window').length === 2);
      note('closet created', curRoom.structures.some(s => s.type === 'closet' && s.finish === 'white_shaker'));
      sel = {type:'structure',idx:0}; uS('finish','dark_walnut');
      note('closet finish options work', curRoom.structures[0].finish === 'dark_walnut');
      sel = {type:null,idx:-1};
      note('picker keys match placed asset keys', placedAssets.every(item => curRoom.furniture.some(f => f.assetKey === item.assetKey && f.label === item.label)));
      sel = {type:'opening',idx:1}; panelHidden = false; showP();
      note('window panel opens', document.getElementById('propsP').innerHTML.includes('Window') && document.getElementById('propsP').innerHTML.includes('props-close'));
      closeP(); sel = {type:'opening',idx:1}; panelHidden = false; showP();
      note('panel reopens after close', document.getElementById('propsP').classList.contains('on'));
      sel = {type:'furniture',idx:0}; panelHidden = false; showP(); closeP();
      const center = tS({x:curRoom.furniture[0].x,y:curRoom.furniture[0].z});
      note('rotated furniture hit test', hitTest(center)?.type === 'furniture');
      setWallFinish('sage'); setFloorType('checker_tile'); setTrimColor(TRIM_COLORS[2]);
      setCeilingBrightness(1.2); setLightingPreset('warm_evening');
      note('room materials updated',
        curRoom.materials.wallFinish === 'sage' &&
        curRoom.materials.floorType === 'checker_tile' &&
        String(curRoom.materials.trim).toLowerCase() === String(TRIM_COLORS[2]).toLowerCase() &&
        curRoom.materials.lightingPreset === 'warm_evening' &&
        curRoom.materials.ceilingBrightness === 1.2
      );
      toggle3D(); await sleep(4000);
      note('entered 3D', is3D && !!scene && !!ren);
      setCamMode('walk'); await sleep(150);
      note('walk mode toggles', camMode === 'walk');
      setCamMode('orbit'); await sleep(150);
      note('orbit mode toggles', camMode === 'orbit');
      const expectedLightingState = computeSceneLightingState(curRoom);
      note('lighting preset affects renderer', Math.abs((ren?.toneMappingExposure || 0) - expectedLightingState.exposure) < .001, `exp:${ren?.toneMappingExposure}`);
      note('checker tile texture active', scene?.children.some(ch => ch.material && ch.material.map && ch.material.map.repeat && Math.abs(ch.material.map.repeat.x - FLOOR_TYPES.find(f => f.id === 'checker_tile').repeat) < .01));
      const requiredRoomAssets = ['sofa','bookshelf','dining_table','blinds','wall_art_01','lamp_floor','dresser','curtains','mirror'];
      note('room scene uses mapped models', requiredRoomAssets.every(k => ROOM_MODEL_DEBUG.ok.has(k)), `room-ok:${[...ROOM_MODEL_DEBUG.ok].join(',')}`);
      note('room scene has no mapped fallback block', ROOM_MODEL_DEBUG.blocked.size === 0, `blocked:${[...ROOM_MODEL_DEBUG.blocked].join(',')}`);
      note('room scene has no mapped load fail', ROOM_MODEL_DEBUG.fail.size === 0, `fail:${[...ROOM_MODEL_DEBUG.fail].join(',')}`);
      exit3DView(); await sleep(200);
      note('2D reselection after 3D', hitTest(center)?.type === 'furniture');
      savePrj(); await saveAll(); projects = []; await loadAll();
      const reloaded = projects.find(p => p.name === 'Self Test Room');
      note('save/load persisted',
        !!reloaded && reloaded.furniture.length === 9 && reloaded.openings.length === 3 &&
        reloaded.structures.length === 1 && reloaded.materials.floorType === 'checker_tile' &&
        reloaded.materials.lightingPreset === 'warm_evening'
      );
      openEd(reloaded); await sleep(100); toggle3D(); await sleep(4500); await sleep(600);
      note('save/load preserved real models',
        requiredRoomAssets.every(k => ROOM_MODEL_DEBUG.ok.has(k)) &&
        ROOM_MODEL_DEBUG.fail.size === 0 && ROOM_MODEL_DEBUG.blocked.size === 0,
        `room-ok:${[...ROOM_MODEL_DEBUG.ok].join(',')}`
      );
      exit3DView(); await sleep(100);
      await openAssetVerification(); await sleep(5000);
      const loadedCards = [...document.querySelectorAll('.verify-card .verify-badge.loaded')].length;
      const failedCards = [...document.querySelectorAll('.verify-card .verify-badge.fail')].length;
      note('asset verification gallery loaded', loadedCards === Object.keys(MODEL_REGISTRY).length, `loaded:${loadedCards} failed:${failedCards}`);
    } catch (err) {
      note('self test runtime', false, err.message || String(err));
      console.error('SELF TEST ERROR', err);
    }
    out.innerHTML = `<pre>${results.join('\n')}</pre>`;
    document.body.setAttribute('data-selftest', results.join('|'));
    const summary = {
      passed: results.filter(x => x.startsWith('PASS')),
      failed: results.filter(x => x.startsWith('FAIL')),
      roomModelsOk: [...ROOM_MODEL_DEBUG.ok],
      roomModelsFail: [...ROOM_MODEL_DEBUG.fail],
      roomModelsBlocked: [...ROOM_MODEL_DEBUG.blocked],
      mappedAssetsLoaded: [...MODEL_DEBUG.ok],
      mappedAssetsFailed: [...MODEL_DEBUG.fail],
      standIns: []
    };
    window.__lastSelfTest = summary;
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  })();
  try { return await selfTestPromise; } finally { selfTestPromise = null; }
}

// ── BOOT ──
async function boot() {
  document.body.classList.toggle('dev-mode', DEV_MODE);
  const httpReady = await ensureHttpRuntime();
  if (!httpReady && location.protocol === 'file:') return;
  loadActiveProfile();
  loadEditorPrefs();
  bindEditorKeys();
  await migrateLegacyProjectsIntoProfile();
  await loadAssetManifest();
  await loadAll();
  await checkWelcome();
  await preflightAllModels();
  applyTimeTheme();
  updateWelcomeForTime();
  renderHome();
  popPresets();
  if (!getLocal(profileSeenKey())) openProfileSwitcher();
  setInterval(applyTimeTheme, 60000);
  if (location.hash === '#selftest') setTimeout(() => runSelfTest(), 400);
}

window.runRoseSelfTest = runSelfTest;
window.openAssetVerification = openAssetVerification;
window.runRoomModelAudit = runRoomModelAudit;
