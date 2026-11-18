import {key} from './core.js';
import {snapshot,wallpaperSvg,wallpaperModel} from './wallpaper.js';
const configKey=key+'.wallpaper',byId=id=>document.getElementById(id);
let config=null,latest=[],feedState='Not connected',working=false,queued=false,pngBlob=null,pngRevision='',renderRevision=0,getEntries;
try{const value=JSON.parse(localStorage.getItem(configKey)||'null');if(value&&/^[a-f0-9]{64}$/.test(value.readKey)&&/^[a-f0-9]{64}$/.test(value.writeKey))config=value;}catch{}
const zone=()=>config?.timeZone||Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Kolkata';
const imageSvg=entries=>wallpaperSvg(snapshot(entries,zone()));
const imageUrl=entries=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(imageSvg(entries));
const readUrl=()=>`${location.origin}/api/wallpaper?key=${config.readKey}`;
function saveConfig(){localStorage.setItem(configKey,JSON.stringify(config));}
const randomKey=()=>[...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
export function wallpaperCard(entries){return `<section class="card wallpaper-card"><img class="wallpaper-mini" src="${imageUrl(entries)}" alt="Your monthly dots wallpaper preview"><div><span class="eyebrow">YOUR LOCK SCREEN. YOUR STANDARD.</span><h2>Keep the work in sight.</h2><p>A fresh monthly dot wallpaper for your iPhone 16.</p><button type="button" class="wallpaper-open subtle-link" data-wallpaper-open>Wallpaper & daily Shortcut ↗</button></div></section>`;}
function paint(){
 const preview=byId('wallpaper-preview');if(!preview)return;
 preview.src=imageUrl(latest);
 byId('wallpaper-feed-status').textContent=feedState;
 byId('enable-wallpaper').hidden=!!config;byId('connected-wallpaper').hidden=!config;
 byId('wallpaper-error').hidden=!/failed|unavailable|could not/i.test(feedState);
 byId('wallpaper-error').textContent=/failed|unavailable|could not/i.test(feedState)?'Your entries are safe on this device. Tap Sync now when you’re online. The Shortcut will show the last successful sync until then.':'';
 byId('wallpaper-sync').disabled=working;byId('wallpaper-disconnect').disabled=working;byId('copy-wallpaper-url').disabled=working||!config?.syncedAt;
 if(config){byId('wallpaper-feed-url').value=readUrl();byId('wallpaper-sync-time').textContent=config.syncedAt?'Last synced '+new Date(config.syncedAt).toLocaleString():'Waiting for the first sync';}
 const mini=document.querySelector('.wallpaper-mini');if(mini)mini.src=imageUrl(latest);
}
async function generatePng(){
 const revision=++renderRevision,data=snapshot(latest,zone()),date=new Date(),signature=JSON.stringify(data)+date.toLocaleDateString();
 if(pngBlob&&pngRevision===signature)return pngBlob;
 const svg=wallpaperSvg(data,date),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=1179;canvas.height=2556;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Image export failed')),'image/png'));
 if(revision===renderRevision){pngBlob=blob;pngRevision=signature;}return blob;
 }finally{URL.revokeObjectURL(url);}
}
async function download(share=false){const button=byId('download-wallpaper');button.disabled=true;button.textContent='Preparing image…';try{const blob=await generatePng(),day=wallpaperModel(snapshot(latest,zone())).today,file=new File([blob],`ironform-${day}.png`,{type:'image/png'});
 if(share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'IRONFORM wallpaper'});}else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 }catch(error){if(error.name!=='AbortError'){byId('wallpaper-download-status').textContent='Could not export the image. Try again.';}}finally{button.disabled=false;button.textContent='Download PNG';}}
async function sync(){
 if(!config)return;if(working){queued=true;return;}
 working=true;queued=false;feedState='Syncing your latest progress…';paint();
 const data=snapshot(latest,zone()),signature=JSON.stringify(data);
 try{const response=await fetch(`/api/wallpaper?key=${config.readKey}`,{method:'POST',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json',Authorization:`Bearer ${config.writeKey}`},body:signature});const result=await response.json();if(!response.ok)throw Error(result.error||'Sync failed');config.syncedAt=result.syncedAt;config.signature=signature;saveConfig();feedState='Private feed is up to date';}
 catch{feedState='Sync failed — retry when online';}
 finally{working=false;paint();if(queued){queued=false;void sync();}}
}
async function connect(){if(working)return;try{config={readKey:randomKey(),writeKey:randomKey(),timeZone:zone()};saveConfig();feedState='Connecting private feed…';paint();await sync();}catch{config=null;feedState='Could not save wallpaper settings on this device';paint();}}
async function disconnect(){if(!config||working)return;working=true;paint();try{const response=await fetch(`/api/wallpaper?key=${config.readKey}`,{method:'DELETE',signal:AbortSignal.timeout(15000),headers:{Authorization:`Bearer ${config.writeKey}`}});if(!response.ok)throw Error();config=null;localStorage.removeItem(configKey);feedState='Disconnected. The old Shortcut link is no longer active.';}catch{feedState='Could not disconnect — retry when online';}finally{working=false;paint();}}
export function initWallpaper(readEntries){
 getEntries=readEntries;latest=getEntries();
 const dialog=document.createElement('dialog');dialog.id='wallpaper-dialog';dialog.setAttribute('aria-labelledby','wallpaper-title');
 dialog.innerHTML=`<div class="dialog-head"><div><span class="eyebrow">IPHONE 16 · 1179 × 2556</span><h2 id="wallpaper-title">Your progress. On display.</h2></div><button type="button" class="icon-button" id="close-wallpaper" aria-label="Close wallpaper">×</button></div><div class="wallpaper-dialog-grid"><div class="wallpaper-preview-frame"><img id="wallpaper-preview" alt="Monthly dot wallpaper with space above for your iPhone clock"></div><div class="wallpaper-controls"><p class="muted">One dot per day, building from the bottom upward. Green: trained. Red: missed. Hollow steel-blue: recovery. Black background, no text.</p><button id="download-wallpaper" class="primary" type="button">Download PNG</button><button id="share-wallpaper" class="text-button" type="button">Share image / Save to Photos</button><p id="wallpaper-download-status" class="muted" role="status">A new PNG is generated after every entry change.</p><section class="wallpaper-feed"><h3>Make it automatic</h3><p class="muted">Sync only your day statuses to a private feed. Notes, distances and durations stay on your device. Enable this in the same iPhone browser you use to log workouts.</p><button id="enable-wallpaper" class="primary" type="button">Enable daily wallpaper</button><p id="wallpaper-feed-status" class="feed-status" role="status"></p><p id="wallpaper-error" class="recovery-info" hidden></p><div id="connected-wallpaper" hidden><label for="wallpaper-feed-url">Your private Shortcut URL</label><input id="wallpaper-feed-url" readonly type="text" spellcheck="false" aria-label="Your private Shortcut URL"><div class="wallpaper-link-actions"><button id="copy-wallpaper-url" class="primary" type="button">Copy Shortcut URL</button><button id="wallpaper-sync" class="text-button" type="button">Sync now</button></div><p id="wallpaper-sync-time" class="muted"></p><p class="wallpaper-privacy">Anyone with this link can view your wallpaper. Keep it private. Disconnecting invalidates it.</p><button id="wallpaper-disconnect" type="button" class="text-button danger">Disconnect private feed</button></div></section><details class="shortcut-guide"><summary>Set up your iPhone Shortcut</summary><ol><li>Enable the feed here and tap <strong>Copy Shortcut URL</strong>.</li><li>Open <strong>Shortcuts</strong> → <strong>+</strong>. Name it <strong>IRONFORM Wallpaper</strong>.</li><li>Add <strong>URL</strong> and paste your private link.</li><li>Add <strong>Get Contents of URL</strong>, using GET.</li><li>Add <strong>Get Images from Input</strong> if the next action does not recognise the image.</li><li>Add <strong>Set Wallpaper Photo</strong>. Choose your photo Lock Screen. Turn <strong>Show Preview</strong> and <strong>Crop to Subject</strong> off if shown.</li><li>Run it once while unlocked and allow the requested access.</li><li>In <strong>Automation</strong>, create <strong>Time of Day</strong> → <strong>Daily</strong> → <strong>Run Immediately</strong>. Choose <strong>IRONFORM Wallpaper</strong>. An evening time updates after your usual workout; a morning run shows the latest synced history.</li></ol><p class="muted">iOS changes the wallpaper when the Shortcut runs, not the moment you log. Run it manually after logging for an immediate update. The feed renders the correct month and day using your saved time zone, even while the app is closed.</p><a href="https://support.apple.com/guide/shortcuts/apd932ff833f/ios" target="_blank" rel="noreferrer" class="subtle-link">Apple’s automation guide ↗</a></details></div></div>`;
 document.body.append(dialog);byId('close-wallpaper').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 document.addEventListener('click',e=>{if(e.target.closest('[data-wallpaper-open]')){latest=getEntries();paint();dialog.showModal();void generatePng().catch(()=>{});}});
 byId('download-wallpaper').onclick=()=>download(false);byId('share-wallpaper').onclick=()=>download(true);byId('enable-wallpaper').onclick=connect;byId('wallpaper-sync').onclick=sync;byId('wallpaper-disconnect').onclick=disconnect;
 byId('copy-wallpaper-url').onclick=async()=>{try{await navigator.clipboard.writeText(readUrl());byId('wallpaper-feed-status').textContent='Shortcut URL copied';}catch{byId('wallpaper-feed-url').select();byId('wallpaper-feed-status').textContent='Select and copy the private URL above.';}};
 window.addEventListener('ironform:entries',e=>{latest=e.detail;pngBlob=null;paint();void generatePng().catch(()=>{});if(config)void sync();});
 window.addEventListener('online',()=>{if(config)void sync();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){latest=getEntries();paint();void generatePng().catch(()=>{});if(config&&config.signature!==JSON.stringify(snapshot(latest,zone())))void sync();}});
 if(config){feedState=config.syncedAt?'Private feed connected':'First sync pending';if(config.signature!==JSON.stringify(snapshot(latest,zone())))void sync();}
 void generatePng().catch(()=>{});
}
