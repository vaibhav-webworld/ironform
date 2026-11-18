import {gardenArt} from './garden.js';
import {wallpaperCard,initWallpaper} from './wallpaper-client.js';
import {key,dateKey,shift,stats,validate,reward,recoveryStatus,restoreRemoved} from './core.js';
import {exerciseNameLimit,lastWorkoutPair,workoutPresets} from './workouts.js';
const $=s=>document.querySelector(s);
const icons={phone:'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 16h4',trash:'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',rest:'M8 5h2v14H8zM14 5h2v14h-2z',ironform:'M3 4h5v16H3zM12 4h10v4h-6v3h5v4h-5v5h-4z',sprout:'M12 21v-9M12 16C4 17 3 11 4 5c7 0 9 4 8 11ZM12 19c7 0 9-5 8-10-6 0-8 4-8 10Z',leaf:'M19 3C6 2 2 9 5 16s15 4 14-13ZM5 20l9-11',grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',chart:'M4 20V11M10 20V5M16 20v-7M22 20V2',settings:'M9 3h6l1 4 4 1 2 5-3 3v4l-5 2-3-3-4 1-3-5 2-4-1-4 4-1ZM15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0',gym:'M7 8v8M4 6v12M17 8v8M20 6v12M7 12h10M2 10v4M22 10v4',run:'m14 7-4 5 4 3-2 6M10 12l-4 1-3 5M14 7l3 5h4M17 3a1.5 1.5 0 1 0 0 .1',flame:'M13 2c2 6-3 7-1 11 3-1 4-3 4-5 8 7 3 14-4 14S1 15 7 8c0 4 2 4 2 4s-1-5 4-10Z',trophy:'M7 3h10v6c0 7-10 7-10 0V3ZM7 5H3v3c0 3 3 4 5 4M17 5h4v3c0 3-3 4-5 4M12 15v6M8 21h8',check:'m5 12 4 4 10-10',arrow:'M5 12h14m-5-5 5 5-5 5',download:'M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6',upload:'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',flower:'M12 9C4-2 0 11 9 12c-11 8 2 12 3 3 8 11 12-2 3-3 11-8-2-12-3-3ZM12 11v2',tree:'M12 22v-7M12 2 4 12h4l-4 5h16l-4-5h4L12 2Z'};
const icon=(name)=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[name]||icons.sprout}"/></svg>`;
function hydrate(){document.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});}
let entries=[],page='today',month=new Date().getMonth(),year=new Date().getFullYear(),editing=null,selectedDate=dateKey(),pendingImport=null,toastTimer;
try{const raw=localStorage.getItem(key);if(raw)entries=validate(JSON.parse(raw));}catch{showError('Your saved data could not be read. It has not been overwritten. Use Data & backups to import a valid backup.');}
let dataBlocked=!$('#persistent-error').hidden;
function showError(message){$('#persistent-error').textContent=message;$('#persistent-error').hidden=false;}
function persist(next,{replace=false}={}){if(dataBlocked&&!replace){notify('Import a valid backup to restore your saved data.');return false;}try{validate({version:1,entries:next});}catch(error){notify(error.message);return false;}try{localStorage.setItem(key,JSON.stringify({version:1,entries:next}));entries=next;window.dispatchEvent(new CustomEvent('ironform:entries',{detail:entries}));dataBlocked=false;$('#persistent-error').hidden=true;return true;}catch{showError('Could not save on this device. Your last saved history is unchanged. Free some browser storage and try again.');return false;}}
function notify(message){if($('#workout-dialog').open){$('#form-message').textContent=message;$('#form-message').hidden=false;}clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('visible');toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3800);}
const readable=(date,options={month:'short',day:'numeric'})=>new Date(date+'T12:00:00').toLocaleDateString('en-GB',options);
let pendingRemoved=[];
try{const saved=JSON.parse(sessionStorage.getItem(key+'.removed')||'[]');if(Array.isArray(saved))pendingRemoved=saved.flatMap(e=>{try{return validate({version:1,entries:[e]});}catch{return [];}});}catch{}
function updateUndo(){
 try{sessionStorage.setItem(key+'.removed',JSON.stringify(pendingRemoved));}catch{}
 $('#undo-bar').hidden=!pendingRemoved.length;
 document.body.classList.toggle('has-undo',!!pendingRemoved.length);
 $('#undo-message').textContent=pendingRemoved.length===1?'Entry removed':`${pendingRemoved.length} entries removed`;
}
function removeEntry(id){
 const entry=entries.find(e=>e.id===id);if(!entry)return;
 const wasDialog=$('#workout-dialog').open;
 if(!persist(entries.filter(e=>e.id!==id)))return;
 pendingRemoved.push(entry);if(wasDialog)$('#workout-dialog').close();
 clearTimeout(toastTimer);$('#toast').classList.remove('visible');render();updateUndo();
 if(wasDialog)$('#undo-remove').focus({preventScroll:true});
}
$('#undo-remove').onclick=()=>{
 const result=restoreRemoved(entries,pendingRemoved);
 if(result.restored&&!persist(result.entries))return;
 pendingRemoved=[];updateUndo();render();
 notify(result.skipped?`${result.restored} restored. ${result.skipped} could not be restored because that day changed.`:result.restored===1?'Entry restored.':`${result.restored} entries restored.`);
 const target=document.querySelector(`[data-date="${selectedDate}"]`)||document.querySelector('[data-log]');target?.focus({preventScroll:true});
};
$('#dismiss-undo').onclick=()=>{pendingRemoved=[];updateUndo();};
updateUndo();
function streakCard(s){return `<section class="card streak-card"><div class="streak-label">${icon('flame')} Consistency streak</div><div class="streak-number">${s.current}<span>${s.current===1?'day':'days'} on track</span></div><p>${s.current===0?'Start today. Build from here.':s.rest.has(dateKey())?'Recovery logged. Your streak stays intact.':s.active.has(dateKey())?'Session logged. Keep building.':'Show up today. Keep the momentum.'}</p><div class="streak-rule">Training + planned recovery. Missed days reset.</div><div class="streak-orbit">${icon('ironform')}<i></i></div><div class="best-streak">${icon('trophy')} Personal best: ${s.longest} ${s.longest===1?'day':'days'}</div></section>`;}
function checkin(s){
 const today = dateKey(), loggedToday = entries.filter(entry => entry.date === today);
 const activities = [['gym', 'Gym'], ['run', 'Run'], ['rest', 'Recovery']];
 const buttons = activities.map(([type, label]) => {
  const saved = loggedToday.find(entry => entry.type === type);
  return `<button type="button" class="activity-button ${saved ? 'logged' : ''}" data-log="${type}" aria-label="${saved ? 'View ' : 'Log '}${label.toLowerCase()}">${icon(type)}<span>${label}<small>${saved ? 'Logged · view' : type === 'gym' ? 'Choose workout' : 'Tap to log'}</small></span><span class="plus" aria-hidden="true">${saved ? '✓' : '+'}</span></button>`;
 }).join('');
 const gym = loggedToday.find(entry => entry.type === 'gym');
 const summary = workoutPresets[gym?.workoutFocus]?.label || (s.rest.has(today) ? 'Recovery day. Recharge for tomorrow.' : s.active.has(today) ? 'Today is on the board.' : 'Choose how you showed up today.');
 return `<section class="card checkin"><div class="card-heading"><h2>${loggedToday.length ? 'TODAY, LOGGED.' : 'LOG YOUR DAY'}</h2><span class="eyebrow">${loggedToday.length ? 'KEEP BUILDING' : 'MAKE IT COUNT'}</span></div><p>${summary}</p><div class="activity-buttons">${buttons}</div></section>`;
}
function calendar(s){const first=new Date(year,month,1),count=new Date(year,month+1,0).getDate(),offset=(first.getDay()+6)%7,today=dateKey(),monthLabel=first.toLocaleDateString('en-GB',{month:'long',year:'numeric'});let days='<span></span>'.repeat(offset);for(let n=1;n<=count;n++){const day=dateKey(new Date(year,month,n)),isActive=s.active.has(day),isRest=s.rest.has(day),future=day>today,missed=!isActive&&!isRest&&s.days.length&&day>=s.days[0]&&day<today;days+=`<button class="day ${isActive?'active-day':''} ${isRest?'rest-day':''} ${missed?'missed':''} ${future?'future':''} ${day===today?'today':''}" data-date="${day}" ${future?'disabled':''} ${day===today?'aria-current="date"':''} aria-label="${readable(day,{day:'numeric',month:'long',year:'numeric'})}: ${isActive?'active':isRest?'recovery':missed?'missed':future?'future day':'no activity'}"><span class="dot"></span><span>${n}</span></button>`;}
return `<section class="card calendar-card"><div class="card-heading"><h2>Your consistency</h2><div class="calendar-controls"><button class="icon-button" id="prev-month" aria-label="Previous month">‹</button><span>${monthLabel}</span><button class="icon-button" id="next-month" aria-label="Next month" ${year===new Date().getFullYear()&&month===new Date().getMonth()?'disabled':''}>›</button></div></div><div class="weekdays">${['M','T','W','T','F','S','S'].map(v=>`<span>${v}</span>`).join('')}</div><div class="calendar-grid">${days}</div><div class="calendar-legend"><span><i class="legend-dot"></i>Active</span><span><i class="legend-dot recovery"></i>Recovery</span><span><i class="legend-dot red"></i>Missed</span><span><i class="legend-dot grey"></i>Unlogged</span><span class="calendar-hint">Tap a day to edit</span></div></section>`;}
function gardenCard(s){const r=reward(s.total);return `<section class="card garden-card"><div class="card-heading"><h2>PROGRESS TAKES ROOT</h2><a href="#garden" class="subtle-link">View growth ↗</a></div>${gardenArt(s.total)}<div class="garden-caption"><strong>${r.stage}</strong><span>${s.total} / ${r.next} active days</span></div><div class="progress-track" role="progressbar" aria-label="Progress to next garden milestone" aria-valuenow="${Math.round(r.progress*100)}" aria-valuemin="0" aria-valuemax="100"><div style="width:${r.progress*100}%"></div></div><p class="garden-footnote">${r.next-s.total} more active ${r.next-s.total===1?'day':'days'} to your next growth milestone.</p></section>`;}
function statCard(title,value,unit,type){return `<section class="card stat-card"><div class="stat-title">${icon(type)}${title}</div><div class="stat-value">${value}<span>${unit}</span></div></section>`;}
function statsRow(s){return `<div class="stats-row">${statCard('Active days',s.total,'days of showing up','chart')}${statCard('Gym sessions',s.gym,'strength sessions','gym')}${statCard('Runs completed',s.run,'running sessions','run')}</div>`;}
function render(){const s=stats(entries),r=reward(s.total);page=['today','progress','garden'].includes(location.hash.slice(1))?location.hash.slice(1):'today';$('#header-date').textContent=new Date().toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});$('#page-label').textContent={today:'YOUR DAILY STANDARD',progress:'TRAINING RECORD',garden:'EARNED BY YOU'}[page];document.querySelectorAll('[data-page]').forEach(el=>{el.classList.toggle('active',el.dataset.page===page);if(el.dataset.page===page)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
const intro=page==='today'?`<div class="intro"><div><h1>BUILT BY <em>SHOWING UP.</em></h1><p>Every session counts. Make this one yours.</p></div><div class="little-pill">${icon('gym')} YOUR EFFORT. YOUR STANDARD.</div></div>`:page==='progress'?'<div class="intro"><div><h1>YOUR WORK. <em>ON RECORD.</em></h1><p>Your consistency, measured one session at a time.</p></div></div>':'<div class="intro"><div><h1>STRONG ROOTS. <em>LASTING GROWTH.</em></h1><p>A living record of the work you put in.</p></div></div>';
let content;if(page==='today')content=`<div class="dashboard">${streakCard(s)}${checkin(s)}${calendar(s)}${gardenCard(s)}${statsRow(s)}${wallpaperCard(entries)}</div>`;
if(page==='progress'){const monthly=s.days.filter(d=>d.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length;content=`<div class="full-grid">${statsRow(s)}${calendar(s)}${statCard('Longest streak',s.longest,'consecutive days','trophy')}${statCard('Movement time',s.minutes,'minutes recorded','clock')}${statCard('Running distance',Number(s.distance.toFixed(2)),'kilometres recorded','run')}${statCard('Selected month',monthly,'training days','gym')}${statCard('Recovery days',s.recovery,'planned rest · no growth points','rest')}</div>`;}
if(page==='garden')content=`<section class="card garden-hero"><span class="eyebrow">${s.total} ACTIVE ${s.total===1?'DAY':'DAYS'} · EARNED ONE DAY AT A TIME</span>${gardenArt(s.total,true)}<h2>${r.stage}</h2><p>${s.total?'Your effort takes root. Every active day adds to it.':'Start with one session. Give your progress roots.'}</p><div class="progress-track"><div style="width:${r.progress*100}%"></div></div><p>${r.next-s.total} more active ${r.next-s.total===1?'day':'days'} to the next chapter</p></section><div class="milestones">${[[1,'A new sprout','sprout'],[3,'The fern','leaf'],[7,'First bloom','flower'],[14,'Luminous tree','tree'],[30,'The grove','sprout']].map(([n,label,type])=>`<section class="card milestone ${s.total>=n?'unlocked':''}">${icon(type)}<strong>${label}</strong><small>${n} active days ${s.total>=n?'· Unlocked ✓':''}</small></section>`).join('')}</div><p class="muted" style="text-align:center;margin-top:24px">After 30 days, a new flower joins your grove every 7 active days.<br>Gym, running, or both — each training day earns one growth step. Recovery preserves your streak without adding growth.</p>`;
$('#view').innerHTML=`<div class="page-enter">${intro}${content}</div>`;hydrate();bindView();}
function bindView(){document.querySelectorAll('[data-log]').forEach(b=>b.onclick=()=>quickLog(b.dataset.log));document.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>openDay(b.dataset.date));if($('#prev-month'))$('#prev-month').onclick=()=>changeMonth(-1);if($('#next-month'))$('#next-month').onclick=()=>changeMonth(1);}
function changeMonth(n){const d=new Date(year,month+n,1);year=d.getFullYear();month=d.getMonth();render();}
const activityLabels = { gym: 'Gym', run: 'Run', rest: 'Recovery' };
const exerciseInputs = [$('#exercise-first'), $('#exercise-second')];
const suggestion = $('#workout-suggestion'), usePair = $('#use-workout-pair');
let dayDrafts = new Map(), suggestedPair;

function saveWorkout(entry) {
 const previousStage = reward(stats(entries).total).stage;
 const now = new Date().toISOString();
 const updated = {
  ...entry,
  id: entry.id || crypto.randomUUID(),
  date: selectedDate,
  createdAt: entry.createdAt || now,
  updatedAt: now,
 };
 const next = [...entries.filter(row => !(row.date === selectedDate && row.type === entry.type)), updated];
 if (!persist(next)) return false;
 $('#workout-dialog').close();
 render();
 const stage = reward(stats(entries).total).stage;
 const message = entry.id ? 'Changes saved.' : entry.type === 'rest'
  ? 'Recovery logged. Time to recharge.' : 'Workout logged. Another day earned.';
 notify(stage !== previousStage ? message + ' Unlocked ' + stage + '.' : message);
 return true;
}

function quickLog(type) {
 const today = dateKey();
 const existing = entries.find(entry => entry.date === today && entry.type === type);
 if (type !== 'rest' && entries.some(entry => entry.date === today && entry.type === 'rest')) {
  openDay(today, 'rest');
  notify('Remove this recovery entry to log training.');
  return;
 }
 if (existing || type === 'gym') {
  openDay(today, type);
  return;
 }
 selectedDate = today;
 if (type === 'rest') {
  const status = recoveryStatus(entries, today);
  if (!status.allowed) {
   notify(status.reason);
   return;
  }
 }
 saveWorkout({ type, duration: null, distance: null, note: '' });
}

function openDay(date, type = null) {
 selectedDate = date;
 dayDrafts = new Map(entries.filter(entry => entry.date === date).map(entry => [entry.type, { ...entry }]));
 editing = dayDrafts.get(type) || (type ? { type } : ['gym', 'run', 'rest'].map(activity => dayDrafts.get(activity)).find(Boolean)) || { type: 'gym' };
 $('#workout-kicker').textContent = readable(date, { weekday: 'long', day: 'numeric', month: 'long' });
 $('#extra-details').open = false;
 $('#more-workouts').open = false;
 paintDay();
 if (!$('#workout-dialog').open) $('#workout-dialog').showModal();
 $('#workout-dialog').scrollTop = 0;
}

function captureDraft() {
 editing.duration = editing.type === 'rest' || $('#duration').value === '' ? null : Number($('#duration').value);
 editing.distance = editing.type === 'run' && $('#distance').value !== '' ? Number($('#distance').value) : null;
 editing.note = $('#note').value.trim();
 if (editing.type === 'gym') {
  editing.exercises = exerciseInputs.map(input => input.value.trim()).filter(Boolean);
 }
 dayDrafts.set(editing.type, editing);
}

function workoutChoices() {
 const previous = entries.filter(entry => entry.type === 'gym' && entry.date < selectedDate && entry.workoutFocus)
  .sort((a, b) => b.date.localeCompare(a.date))[0];
 const mainIds = [...new Set([previous?.workoutFocus, 'chest-biceps', 'back-triceps', 'legs', 'shoulders'].filter(Boolean))].slice(0, 4);
 const button = id => {
  const selected = (editing.workoutFocus || '') === id;
  return `<button type="button" data-focus="${id}" aria-pressed="${selected}" class="${selected ? 'selected' : ''}">${workoutPresets[id]?.label || 'Just a gym session'}${id && id === previous?.workoutFocus ? '<small>Last used</small>' : ''}</button>`;
 };
 $('#workout-choices').innerHTML = mainIds.map(button).join('');
 const otherIds = Object.keys(workoutPresets).filter(id => !mainIds.includes(id));
 $('#other-workout-choices').innerHTML = otherIds.map(button).join('') + button('');
 if (editing.workoutFocus && !mainIds.includes(editing.workoutFocus)) $('#more-workouts').open = true;
 document.querySelectorAll('[data-focus]').forEach(button => {
  button.onclick = () => {
   editing.workoutFocus = button.dataset.focus;
   document.querySelectorAll('[data-focus]').forEach(choice => {
    const selected = choice.dataset.focus === editing.workoutFocus;
    choice.setAttribute('aria-pressed', String(selected));
    choice.classList.toggle('selected', selected);
   });
   showWorkoutSuggestion();
   updateSaveButton();
  };
 });
}

for (const input of exerciseInputs) {
 input.maxLength = exerciseNameLimit;
 input.addEventListener('input', updatePairButton);
}

function updatePairButton() {
 const values = exerciseInputs.map(input => input.value.trim());
 const matches = !!suggestedPair && values.every((value, index) => value === suggestedPair[index]);
 usePair.disabled = matches;
 usePair.textContent = matches ? 'Pair added' : values.some(Boolean) ? 'Replace pair' : 'Use pair';
}

function showWorkoutSuggestion() {
 const previousPair = lastWorkoutPair(entries, editing.workoutFocus, selectedDate);
 suggestedPair = previousPair || workoutPresets[editing.workoutFocus]?.pair;
 suggestion.hidden = !suggestedPair;
 $('#pair-preview').hidden = !suggestedPair;
 if (!suggestedPair) return;
 $('#pair-preview').textContent = (previousPair ? 'Last time · ' : 'Try · ') + suggestedPair.join(' + ');
 $('#suggestion-label').textContent = previousPair ? 'Reuse your last pair' : 'Add suggested exercises';
 updatePairButton();
}

usePair.onclick = () => {
 if (!suggestedPair) return;
 exerciseInputs.forEach((input, index) => { input.value = suggestedPair[index]; });
 updatePairButton();
};

function showSavedDetails() {
 const details = $('#saved-details');
 details.replaceChildren();
 const saved = entries.find(entry => entry.id === editing.id);
 details.hidden = !saved;
 if (!saved) return;
 const summary = document.createElement('p');
 summary.className = 'saved-metrics';
 const metrics = [saved.duration != null ? saved.duration + ' min' : '', saved.distance != null ? saved.distance + ' km' : ''].filter(Boolean);
 summary.textContent = [...(saved.exercises || []), ...metrics].join(' · ');
 if (summary.textContent) details.append(summary);
 if (saved.note) {
  const note = document.createElement('p');
  note.className = 'saved-note';
  note.textContent = saved.note;
  details.append(note);
 }
 details.hidden = !details.childElementCount;
}

function updateSaveButton() {
 const label = editing.id ? 'Save changes' : 'Log ' + (workoutPresets[editing.workoutFocus]?.label || activityLabels[editing.type].toLowerCase());
 $('#save-workout').textContent = label;
}

function paintDay() {
 $('#form-message').hidden = true;
 const list = entries.filter(entry => entry.date === selectedDate);
 const saved = list.find(entry => entry.type === editing.type);
 $('#workout-title').textContent = saved ? 'Your workout' : 'Log your day';
 $('#day-summary').hidden = !saved;
 $('#day-summary').textContent = saved ? 'Saved · ' + (workoutPresets[saved.workoutFocus]?.label || activityLabels[saved.type]) : '';
 $('#day-activities').innerHTML = Object.entries(activityLabels).map(([type, label]) =>
  `<button type="button" data-choose="${type}" aria-pressed="${editing.type === type}" class="${editing.type === type ? 'selected' : ''}">${label}${list.some(entry => entry.type === type) ? ' ✓' : ''}</button>`
 ).join('');
 document.querySelectorAll('[data-choose]').forEach(button => {
  button.onclick = () => {
   if (editing.type === button.dataset.choose) return;
   captureDraft();
   editing = dayDrafts.get(button.dataset.choose) || { type: button.dataset.choose };
   paintDay();
  };
 });
 const isGym = editing.type === 'gym', isRecovery = editing.type === 'rest';
 $('#workout-picker').hidden = !isGym;
 $('#workout-picker').open = !editing.id;
 $('#change-workout-label').hidden = !editing.id;
 for (const id of ['gym-details', 'exercise-details']) {
  $('#' + id).hidden = !isGym;
  $('#' + id).disabled = !isGym;
 }
 $('#duration').value = editing.duration ?? '';
 $('#distance').value = editing.distance ?? '';
 $('#note').value = editing.note || '';
 exerciseInputs.forEach((input, index) => { input.value = editing.exercises?.[index] || ''; });
 if (isGym) {
  workoutChoices();
  showWorkoutSuggestion();
 }
 $('#duration').closest('.field-row').hidden = isRecovery;
 $('#duration').disabled = isRecovery;
 $('#distance-label').hidden = editing.type !== 'run';
 $('#distance').disabled = editing.type !== 'run';
 const status = recoveryStatus(entries, selectedDate);
 $('#recovery-info').hidden = !isRecovery;
 $('#recovery-info').textContent = status.allowed ? 'Recovery protects an existing streak. Up to 2 days a week.' : status.reason;
 $('#save-workout').disabled = isRecovery && !status.allowed;
 $('#delete-workout').hidden = !editing.id;
 $('#delete-workout').textContent = 'Delete ' + activityLabels[editing.type].toLowerCase() + ' entry';
 const hasDetails = editing.note || editing.exercises?.length || editing.duration != null || editing.distance != null;
 $('#extra-details-label').textContent = hasDetails ? 'Edit details' : 'Add details';
 showSavedDetails();
 updateSaveButton();
}

$('#workout-form').addEventListener('invalid', () => {
 $('#extra-details').open = true;
}, true);

$('#workout-form').onsubmit = event => {
 event.preventDefault();
 captureDraft();
 const updated = { ...editing };
 if (!updated.workoutFocus) delete updated.workoutFocus;
 if (!updated.exercises?.length) delete updated.exercises;
 saveWorkout(updated);
};

$('#delete-workout').onclick = () => { if (editing?.id) removeEntry(editing.id); };

function openBackup(){pendingImport=null;$('#import').value='';$('#import-preview').hidden=true;$('#backup-dialog').showModal();}
$('#backup-open').onclick=openBackup;$('#mobile-backup').onclick=openBackup;$('#import-open').onclick=()=>$('#import').click();
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{const rect=d.getBoundingClientRect();if(e.target===d&&(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom))d.close();}));
$('#export').onclick=()=>{const raw=JSON.stringify({version:1,exportedAt:new Date().toISOString(),entries},null,2);const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`ironform-${dateKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Backup downloaded. Keep it somewhere safe.');};
$('#import').onchange=async e=>{const file=e.target.files[0];if(!file)return;const preview=$('#import-preview');preview.hidden=false;try{if(file.size>20*1024*1024)throw Error('Choose a backup smaller than 20 MB.');pendingImport=validate(JSON.parse(await file.text()));const s=stats(pendingImport);preview.innerHTML=`<strong>Ready to import</strong><p>${pendingImport.length} entries: ${s.total} training days and ${s.recovery} recovery days.<br>This will replace your ${entries.length} saved entries on this device.</p><button id="confirm-import" class="primary">Replace history & import</button><button id="cancel-import" class="text-button" style="margin-left:15px">Cancel</button>`;$('#confirm-import').onclick=()=>{if(pendingImport&&persist(pendingImport,{replace:true})){pendingImport=null;$('#backup-dialog').close();render();notify('Training history restored.');}};$('#cancel-import').onclick=()=>{pendingImport=null;preview.hidden=true;$('#import').value='';};}catch(err){pendingImport=null;preview.textContent=err instanceof SyntaxError?'This file is not valid JSON. Your history is unchanged.':err.message;}};
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});window.addEventListener('storage',e=>{if(e.key===key){try{const next=e.newValue?validate(JSON.parse(e.newValue)):[];entries=next;window.dispatchEvent(new CustomEvent('ironform:entries',{detail:entries}));dataBlocked=false;$('#persistent-error').hidden=true;document.querySelectorAll('dialog[open]').forEach(d=>d.close());render();notify('History updated from another tab.');}catch{notify('Another tab saved unreadable history. Export your current backup.');}}});let lastDate=dateKey();function refreshDate(){if(lastDate!==dateKey()){lastDate=dateKey();year=new Date().getFullYear();month=new Date().getMonth();document.querySelectorAll('dialog[open]').forEach(d=>d.close());render();}}document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate();});setInterval(refreshDate,30000);render();
initWallpaper(()=>entries);
