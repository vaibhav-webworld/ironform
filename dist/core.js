import { exerciseNameLimit, workoutPresets } from './workouts.js';

export const key='afterglow.v1';
export const dateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function shift(date,n){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return dateKey(d);}
export function weekStart(date){const day=new Date(date+'T12:00:00').getDay();return shift(date,-((day+6)%7));}
export function recoveryStatus(entries,date){
 const week=weekStart(date),rests=new Set(entries.filter(e=>e.type==='rest'&&e.date!==date).map(e=>e.date));
 const used=[...rests].filter(d=>weekStart(d)===week).length;
 let reason='';
 if(entries.some(e=>e.date===date&&e.type!=='rest'))reason='Training is already logged for this day. Remove its workouts before marking recovery.';
 else if(used>=2)reason='Both recovery days are already used this week (Monday–Sunday).';
 else {let consecutive=1;for(const step of [-1,1]){let cursor=shift(date,step);while(rests.has(cursor)){consecutive++;cursor=shift(cursor,step);}}if(consecutive>2)reason='Keep recovery to two consecutive days to protect your consistency streak.';}
 return {used,remaining:Math.max(0,2-used),allowed:!reason,reason};
}
export function stats(entries,today=dateKey()){
 const training=entries.filter(e=>e.type!=='rest'),days=[...new Set(training.map(e=>e.date))].sort(),active=new Set(days),rest=new Set(entries.filter(e=>e.type==='rest').map(e=>e.date)),trackedDays=[...new Set(entries.map(e=>e.date))].sort();
 let longest=0,run=0,previous;const lengths=new Map();
 for(const day of trackedDays){if(previous&&shift(previous,1)!==day)run=0;if(active.has(day))run++;else if(run>0)run++;longest=Math.max(longest,run);lengths.set(day,run);previous=day;}
 const cursor=lengths.has(today)?today:shift(today,-1),current=lengths.get(cursor)||0;
 return {days,active,rest,trackedDays,current,longest,total:days.length,recovery:rest.size,gym:training.filter(e=>e.type==='gym').length,run:training.filter(e=>e.type==='run').length,minutes:training.reduce((s,e)=>s+(e.duration||0),0),distance:training.reduce((s,e)=>s+(e.distance||0),0)};
}
export function validate(data,today=dateKey()){
 if(!data||data.version!==1||!Array.isArray(data.entries))throw Error('Choose an IRONFORM or Afterglow version 1 backup.');
 if(data.entries.length>100000)throw Error('This backup is too large.');
 const seen=new Set(),ids=new Set();
 const result=data.entries.map(e=>{
 if(!e||typeof e.id!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(e.id)||ids.has(e.id)||!['gym','run','rest'].includes(e.type)||typeof e.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(new Date(e.date+'T12:00:00').getTime())||dateKey(new Date(e.date+'T12:00:00'))!==e.date||e.date>today)throw Error('The backup contains an invalid or future entry.');
 const pair=e.date+e.type;if(seen.has(pair))throw Error('The backup contains duplicate workouts.');seen.add(pair);ids.add(e.id);
 for(const field of ['duration','distance'])if(e[field]!=null&&(typeof e[field]!=='number'||!Number.isFinite(e[field])||e[field]<0||e[field]>(field==='duration'?1440:1000)))throw Error('The backup contains invalid workout details.');
 if(e.type==='gym'&&e.distance!=null)throw Error('Gym entries cannot contain running distance.');
 if(e.type==='rest'&&(e.duration!=null||e.distance!=null))throw Error('Recovery days cannot contain workout duration or distance.');
 if(e.note!=null&&(typeof e.note!=='string'||e.note.length>500))throw Error('Workout notes must be 500 characters or less.');
 if(typeof e.createdAt!=='string'||typeof e.updatedAt!=='string'||!Number.isFinite(Date.parse(e.createdAt))||!Number.isFinite(Date.parse(e.updatedAt)))throw Error('The backup contains invalid timestamps.');
 const entry={id:e.id,date:e.date,type:e.type,duration:e.duration??null,distance:e.distance??null,note:e.note||'',createdAt:e.createdAt,updatedAt:e.updatedAt};
 if(e.workoutFocus!=null){
  if(e.type!=='gym'||typeof e.workoutFocus!=='string'||!Object.hasOwn(workoutPresets,e.workoutFocus))throw Error('The backup contains an invalid workout focus.');
  entry.workoutFocus=e.workoutFocus;
 }
 if(e.exercises!=null){
  if(e.type!=='gym'||!Array.isArray(e.exercises)||e.exercises.length>2||e.exercises.some(name=>typeof name!=='string'||!name.trim()||name.length>exerciseNameLimit))throw Error('Add up to two exercise names of 80 characters or less to a gym entry.');
  if(e.exercises.length)entry.exercises=e.exercises.map(name=>name.trim());
 }
 return entry;
 });
 const trainingDays=new Set(result.filter(e=>e.type!=='rest').map(e=>e.date)),rests=new Set(result.filter(e=>e.type==='rest').map(e=>e.date)),weeks=new Map();
 for(const date of rests){if(trainingDays.has(date))throw Error('A day cannot be both training and recovery.');const week=weekStart(date),count=(weeks.get(week)||0)+1;weeks.set(week,count);if(count>2)throw Error('Only two recovery days are allowed per Monday–Sunday week.');if(rests.has(shift(date,1))&&rests.has(shift(date,2)))throw Error('Only two consecutive recovery days are allowed.');}
 return result;
}
export function reward(total){const milestones=[1,3,7,14,30];const next=milestones.find(n=>n>total)??(30+7*(Math.floor((total-30)/7)+1));const previous=[0,...milestones].filter(n=>n<=total).at(-1);const start=total>=30?next-7:previous;return {next,progress:(total-start)/(next-start),stage:total>=30?'The grove':total>=14?'The luminous tree':total>=7?'First bloom':total>=3?'The fern':total>=1?'A new sprout':'A little possibility'};}
export function restoreRemoved(entries,removed,today=dateKey()){
 let next=[...entries],restored=0;
 // Newer removals take precedence; never overwrite entries added after removal.
 for(const entry of [...removed].reverse()){
  try{next=validate({version:1,entries:[...next,entry]},today);restored++;}catch{}
 }
 return {entries:next,restored,skipped:removed.length-restored};
}
