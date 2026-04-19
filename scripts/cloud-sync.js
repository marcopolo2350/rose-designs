/**
 * Phase 7A — Supabase cloud sync (opt-in, profile-scoped).
 * The app always writes to IndexedDB first (offline-first). When cloud is configured + enabled,
 * saveAll() also pushes to Supabase, and loadAll() pulls remote rows and merges (last-write-wins on updatedAt).
 *
 * Setup:
 *   1. Create a free Supabase project at https://supabase.com
 *   2. In SQL editor, run the schema below (also stored in docs/cloud-schema.sql).
 *   3. In the app, open Settings → Cloud Sync, paste your URL + anon key, toggle on.
 *   4. Keys are stored in localStorage (global). Data is scoped per-profile via project_profile column.
 *
 * Conflict policy: last-write-wins by updatedAt. Deletes are soft (deleted=true) so offline devices don't
 * resurrect rows. Remote-only rooms are merged back into local state.
 */

const CLOUD_KEYS = {
  url:     'rose_cloud_url',
  key:     'rose_cloud_key',
  enabled: 'rose_cloud_enabled',
  lastSync:'rose_cloud_last_sync'
};

let cloudClient = null;
let cloudEnabled = false;
let cloudBusy = false;

function cloudGetConfig(){
  try{
    return {
      url: localStorage.getItem(CLOUD_KEYS.url)||'',
      key: localStorage.getItem(CLOUD_KEYS.key)||'',
      enabled: localStorage.getItem(CLOUD_KEYS.enabled)==='1'
    };
  }catch(_){ return {url:'',key:'',enabled:false}; }
}
function cloudSetConfig(url,key,enabled){
  try{
    localStorage.setItem(CLOUD_KEYS.url,url||'');
    localStorage.setItem(CLOUD_KEYS.key,key||'');
    localStorage.setItem(CLOUD_KEYS.enabled,enabled?'1':'0');
  }catch(_){}
  cloudEnabled=!!enabled;
  cloudClient=null; // force re-init
}

// Lazy-load supabase-js from CDN only when sync is actually used.
async function cloudEnsureClient(){
  if(cloudClient)return cloudClient;
  const {url,key,enabled}=cloudGetConfig();
  if(!enabled||!url||!key){cloudEnabled=false;return null}
  cloudEnabled=true;
  if(!window.supabase){
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload=resolve; s.onerror=()=>reject(new Error('Failed to load supabase-js'));
      document.head.appendChild(s);
    });
  }
  try{
    cloudClient = window.supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}});
    return cloudClient;
  }catch(e){
    console.warn('[cloud] createClient failed:',e);
    return null;
  }
}

async function cloudSignInAnonymous(){
  const c=await cloudEnsureClient(); if(!c)return null;
  // Supabase v2 anonymous sign-in (requires "Enable Anonymous Sign-ins" in project settings).
  try{
    const existing=await c.auth.getSession();
    if(existing?.data?.session)return existing.data.session;
    const {data,error}=await c.auth.signInAnonymously();
    if(error){console.warn('[cloud] anon sign-in failed:',error.message);return null}
    return data.session;
  }catch(e){console.warn('[cloud] auth exception:',e);return null}
}

// ───────── pull ─────────
async function cloudPullProjects(){
  if(cloudBusy)return null;
  const c=await cloudEnsureClient(); if(!c)return null;
  await cloudSignInAnonymous();
  const profile=(typeof activeProfile!=='undefined')?activeProfile:'default';
  cloudBusy=true;
  try{
    const {data,error}=await c.from('rose_projects')
      .select('id,payload,updated_at,deleted')
      .eq('profile',profile);
    if(error){console.warn('[cloud] pull failed:',error.message);return null}
    return (data||[]).filter(r=>!r.deleted).map(r=>r.payload);
  }finally{cloudBusy=false}
}

// ───────── push ─────────
async function cloudPushProjects(localProjects){
  if(cloudBusy)return false;
  const c=await cloudEnsureClient(); if(!c)return false;
  await cloudSignInAnonymous();
  const profile=(typeof activeProfile!=='undefined')?activeProfile:'default';
  cloudBusy=true;
  try{
    const rows=(localProjects||[]).map(p=>({
      id: p.id,
      profile,
      payload: p,
      updated_at: new Date(p.updatedAt||Date.now()).toISOString(),
      deleted: false
    }));
    if(!rows.length)return true;
    // upsert handles both insert and update
    const {error}=await c.from('rose_projects').upsert(rows,{onConflict:'id'});
    if(error){console.warn('[cloud] push failed:',error.message);return false}
    try{localStorage.setItem(CLOUD_KEYS.lastSync,new Date().toISOString())}catch(_){}
    return true;
  }finally{cloudBusy=false}
}

// ───────── merge ─────────
function cloudMerge(localList,remoteList){
  const byId=new Map();
  (localList||[]).forEach(p=>byId.set(p.id,p));
  (remoteList||[]).forEach(rp=>{
    const lp=byId.get(rp.id);
    if(!lp){byId.set(rp.id,rp);return}
    const lu=lp.updatedAt||0, ru=rp.updatedAt||0;
    byId.set(rp.id, ru>lu ? rp : lp);
  });
  return [...byId.values()];
}

// ───────── orchestration ─────────
// Called from saveAll() and loadAll() — non-blocking and safe when cloud is disabled.
async function cloudSyncAfterSave(){
  const {enabled}=cloudGetConfig();
  if(!enabled)return;
  if(typeof projects==='undefined')return;
  try{await cloudPushProjects(projects)}catch(e){console.warn('[cloud] sync-after-save:',e)}
}
async function cloudSyncOnLoad(){
  const {enabled}=cloudGetConfig();
  if(!enabled)return false;
  try{
    const remote=await cloudPullProjects();
    if(!remote||!remote.length)return false;
    if(typeof projects==='undefined')return false;
    const merged=cloudMerge(projects,remote.map(p=>{
      try{return (typeof normalizeRoom==='function')?normalizeRoom(p):p}catch(_){return p}
    }));
    projects.length=0;
    merged.forEach(p=>projects.push(p));
    // Persist merged view locally.
    try{await saveAll()}catch(_){}
    return true;
  }catch(e){console.warn('[cloud] sync-on-load:',e);return false}
}

// ───────── UI helpers (called from settings panel) ─────────
function cloudStatusText(){
  const {url,key,enabled}=cloudGetConfig();
  if(!url||!key)return 'Not configured';
  if(!enabled)return 'Configured (disabled)';
  const last=localStorage.getItem(CLOUD_KEYS.lastSync);
  return last ? `Synced ${new Date(last).toLocaleString()}` : 'Enabled (not yet synced)';
}
async function cloudTestConnection(){
  const c=await cloudEnsureClient();
  if(!c)return {ok:false,msg:'Missing URL or key, or library failed to load'};
  try{
    const {error}=await c.from('rose_projects').select('id').limit(1);
    if(error)return {ok:false,msg:error.message};
    return {ok:true,msg:'Connection OK'};
  }catch(e){return {ok:false,msg:String(e)}}
}

// Minimal settings modal (built on demand, no CSS dependencies beyond app.css).
function openCloudSyncSettings(){
  const existing=document.getElementById('cloudSyncModal');
  if(existing){existing.remove()}
  const cfg=cloudGetConfig();
  const statusHtml=cloudStatusText();
  const wrap=document.createElement('div');
  wrap.id='cloudSyncModal';
  wrap.style.cssText='position:fixed;inset:0;background:rgba(20,16,12,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  wrap.innerHTML=`
    <div style="background:#FDFAF5;border:1px solid #E6D8CC;border-radius:18px;max-width:560px;width:100%;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,.22);font-family:Inter,system-ui,sans-serif;color:#332922;">
      <h3 style="margin:0 0 6px;font-family:'Playfair Display',serif;font-size:22px;">Cloud Sync</h3>
      <p style="margin:0 0 20px;color:#7B6B5E;font-size:13px;line-height:1.5;">Optional. Syncs your rooms to Supabase so they follow you across devices. The app works fully offline without this.</p>
      <div style="font-size:12px;background:#F5EEE3;padding:10px 12px;border-radius:8px;margin-bottom:16px;color:#5A4C40;">Status: <strong>${statusHtml}</strong></div>
      <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">Supabase project URL</label>
      <input id="cloudUrl" type="text" placeholder="https://xxxxx.supabase.co" value="${(cfg.url||'').replace(/"/g,'&quot;')}" style="width:100%;padding:10px 12px;border:1px solid #D9CBBF;border-radius:8px;font-family:inherit;font-size:13px;margin-bottom:14px;box-sizing:border-box;">
      <label style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">Anon public key</label>
      <input id="cloudKey" type="password" placeholder="eyJhbGciOi..." value="${(cfg.key||'').replace(/"/g,'&quot;')}" style="width:100%;padding:10px 12px;border:1px solid #D9CBBF;border-radius:8px;font-family:inherit;font-size:13px;margin-bottom:14px;box-sizing:border-box;">
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:20px;">
        <input id="cloudEnabled" type="checkbox" ${cfg.enabled?'checked':''}>
        <span>Enable cloud sync on save &amp; load</span>
      </label>
      <div id="cloudTestResult" style="font-size:12px;margin-bottom:14px;min-height:16px;"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
        <button id="cloudTestBtn"   style="padding:10px 16px;border-radius:8px;border:1px solid #D9CBBF;background:#FFF;cursor:pointer;font-family:inherit;font-size:13px;">Test connection</button>
        <button id="cloudCancelBtn" style="padding:10px 16px;border-radius:8px;border:1px solid #D9CBBF;background:#FFF;cursor:pointer;font-family:inherit;font-size:13px;">Cancel</button>
        <button id="cloudSaveBtn"   style="padding:10px 16px;border-radius:8px;border:none;background:#C48C86;color:#FFF;cursor:pointer;font-family:inherit;font-size:13px;">Save</button>
      </div>
      <details style="margin-top:18px;font-size:12px;color:#7B6B5E;">
        <summary style="cursor:pointer;">Setup steps</summary>
        <ol style="line-height:1.6;padding-left:20px;">
          <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
          <li>In SQL Editor, run <code>docs/cloud-schema.sql</code> from this repo.</li>
          <li>In Auth → Providers, enable <em>Anonymous sign-ins</em>.</li>
          <li>Copy Project URL and anon key from Settings → API, paste above.</li>
        </ol>
      </details>
    </div>`;
  document.body.appendChild(wrap);
  const close=()=>wrap.remove();
  wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
  document.getElementById('cloudCancelBtn').onclick=close;
  document.getElementById('cloudTestBtn').onclick=async()=>{
    const u=document.getElementById('cloudUrl').value.trim();
    const k=document.getElementById('cloudKey').value.trim();
    cloudSetConfig(u,k,true);
    const res=document.getElementById('cloudTestResult');
    res.textContent='Testing...'; res.style.color='#7B6B5E';
    const r=await cloudTestConnection();
    res.textContent=r.msg;
    res.style.color=r.ok?'#3A7A3A':'#B14A3A';
  };
  document.getElementById('cloudSaveBtn').onclick=()=>{
    const u=document.getElementById('cloudUrl').value.trim();
    const k=document.getElementById('cloudKey').value.trim();
    const en=document.getElementById('cloudEnabled').checked;
    cloudSetConfig(u,k,en);
    if(typeof toast==='function')toast(en?'Cloud sync enabled':'Cloud sync disabled');
    close();
  };
}
window.openCloudSyncSettings = openCloudSyncSettings;

// Public surface
window.cloudSync = {
  getConfig: cloudGetConfig,
  setConfig: cloudSetConfig,
  testConnection: cloudTestConnection,
  statusText: cloudStatusText,
  pull: cloudPullProjects,
  push: cloudPushProjects,
  merge: cloudMerge,
  afterSave: cloudSyncAfterSave,
  onLoad: cloudSyncOnLoad
};
