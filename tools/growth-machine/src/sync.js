/* ============================================================
   Updates folder. Claude drops stamped update files into a private Google Drive folder that Drive for desktop
   syncs to this computer. "Check for updates" merges any new ones in date order (each into the client it names),
   skips files already merged, and saves a backup into the folder's backups/ subfolder.
   Chrome and Edge only (File System Access API).
   ============================================================ */
const SYNC_NAME_KEY = 'tgm.studio.syncFolder';
const syncState = { handle: null, name: '', perm: '', last: null, busy: false };
const syncSupported = () => typeof window.showDirectoryPicker === 'function';
/* The folder is picked once per session rather than remembered: reading a stored folder handle back proved
   unreliable in testing (it crashed the browser tab), and Chrome asks for permission each session anyway.
   The picker reopens in the same folder, so it's one extra click a day. Only the folder's name is remembered. */
function syncLoad() { try { syncState.name = localStorage.getItem(SYNC_NAME_KEY) || ''; } catch (err) { /* ignore */ } }
function syncSetHandle(h) {
  syncState.handle = h; syncState.name = h.name; syncState.perm = 'granted'; syncState.last = null;
  try { localStorage.setItem(SYNC_NAME_KEY, h.name); } catch (err) { /* ignore */ }
}
async function syncConnect() {
  if (!syncSupported()) return toast('This browser can’t open folders. Use Chrome or Edge.');
  try { const h = await window.showDirectoryPicker({ id: 'tgm-updates', mode: 'readwrite' }); syncSetHandle(h); render(); await syncCheck(false); }
  catch (err) { if (err.name !== 'AbortError') toast('Could not open the folder: ' + err.message); }
}
async function syncPermitted() {
  const h = syncState.handle; if (!h) return false;
  if (!h.queryPermission) return true;
  let p = await h.queryPermission({ mode: 'readwrite' });
  if (p !== 'granted') p = await h.requestPermission({ mode: 'readwrite' });
  syncState.perm = p; return p === 'granted';
}
const syncEngId = (client) => Object.keys(db.engagements).find((k) => db.engagements[k].client && db.engagements[k].client.name === client);
/** Merge every new update file in the folder, oldest first. Files for clients not in this browser are left alone. */
async function syncCheck(auto) {
  if (syncState.busy) return;
  if (!syncState.handle) return syncConnect();
  syncState.busy = true;
  try {
    if (!(await syncPermitted())) { if (!auto) toast('Allow access to the updates folder to check for updates'); return; }
    const found = []; let already = 0, other = 0, bad = 0;
    for await (const [name, fh] of syncState.handle.entries()) {
      if (fh.kind !== 'file' || !/\.json$/i.test(name) || /\.tgm\.json$/i.test(name)) continue;
      let obj; try { obj = JSON.parse(await (await fh.getFile()).text()); } catch (err) { bad++; continue; }
      if (!obj || obj.engagements || !obj._meta || !obj._meta.generatedAt) continue;
      const engId = obj._meta.client ? syncEngId(obj._meta.client) : db.activeId;
      if (!engId) { other++; continue; }
      const fp = obj._meta.fileId || hashStr(JSON.stringify(obj));
      if ((db.engagements[engId].meta.mergeLog || []).some((l) => l.fp === fp)) { already++; continue; }
      found.push({ name, obj, engId });
    }
    found.sort((a, b) => String(a.obj._meta.generatedAt).localeCompare(String(b.obj._meta.generatedAt)) || a.name.localeCompare(b.name));
    const back = db.activeId; const touched = new Set();
    found.forEach((f) => { db.activeId = f.engId; doMerge(f.obj, f.name, true); touched.add(f.engId); });
    for (const id of touched) { db.activeId = id; await syncBackup(true); }
    db.activeId = back; save();
    syncState.last = { at: nowISO(), merged: found.map((f) => f.name), already, other, bad };
    render();
    if (found.length || !auto) toast(found.length ? `Merged ${found.length} update${found.length > 1 ? 's' : ''} from the folder, oldest first, and saved a backup there` : 'No new updates in the folder');
  } catch (err) { toast('Could not read the updates folder: ' + err.message); }
  finally { syncState.busy = false; }
}
/** Write a full backup of the active client into <folder>/backups/, stamped to the minute. */
async function syncBackup(quiet) {
  if (!syncState.handle || !(await syncPermitted())) { if (!quiet) toast('Connect the updates folder first'); return false; }
  const e = E(); e.meta.lastExported = nowISO(); save();
  const dir = await syncState.handle.getDirectoryHandle('backups', { create: true });
  const stamp = nowISO().slice(0, 16).replace('T', '-').replace(':', '');
  const fh = await dir.getFileHandle(`${slugify(e.client.name)}-${stamp}.tgm.json`, { create: true });
  const w = await fh.createWritable(); await w.write(JSON.stringify(stripMarks(e), null, 2)); await w.close();
  if (!quiet) { render(); toast(`Backup saved to ${syncState.name}/backups`); }
  return true;
}
function syncTopBtn() {
  if (!syncSupported() || (!syncState.handle && !syncState.name)) return '';
  return `<button class="btn sm ghost" data-action="syncCheck" title="${syncState.handle ? `Merge new update files from ${esc(syncState.name)} and save a backup there` : `Pick the ${esc(syncState.name)} folder (once per session), then merge new update files`}">⟳ Updates</button>`;
}
function syncCard() {
  if (!syncSupported()) return card('Updates folder', '<p class="faint small">Open the Studio in Chrome or Edge to pick up update files automatically from a synced Google Drive folder. Until then, use "Merge a JSON file".</p>');
  const l = syncState.last;
  const status = !syncState.handle ? `<p class="small">${syncState.name ? `Last used: <b>${esc(syncState.name)}</b>. Pick it again to check this session.` : 'Not connected.'}</p>`
    : `<p class="small">Folder: <b>${esc(syncState.name)}</b>${syncState.perm && syncState.perm !== 'granted' ? ' · <span class="warn-t">click Check for updates to allow access</span>' : ''}</p>
       ${l ? `<p class="faint small">Last checked ${esc(new Date(l.at).toLocaleString('en-GB'))}: ${l.merged.length ? `merged ${l.merged.map(esc).join(', ')}` : 'nothing new'}${l.already ? ` · ${l.already} already merged` : ''}${l.other ? ` · ${l.other} for clients not in this browser` : ''}${l.bad ? ` · ${l.bad} unreadable` : ''}.</p>` : ''}`;
  return card('Updates folder', `${status}
    <div class="btn-row">${syncState.handle ? '<button class="btn" data-action="syncCheck">⟳ Check for updates</button><button class="btn ghost" data-action="syncBackup">Back up to folder</button>' : ''}<button class="btn ${syncState.handle ? 'ghost' : ''}" data-action="syncConnect">${syncState.handle ? 'Change folder' : syncState.name ? 'Pick folder and check for updates' : 'Connect updates folder'}</button></div>
    <p class="faint small">Claude puts each update into the <b>TGM Studio updates</b> folder in your Google Drive. With Google Drive for desktop, pick that folder here once per session (the picker opens in it). "Check for updates" merges any new files, oldest first, into the client each one names, skips files already merged, and saves a backup into the folder's <b>backups</b> subfolder (which Drive keeps in the cloud).</p>`);
}
