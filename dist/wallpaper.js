import {stats,validate} from './core.js';
export const WALLPAPER_WIDTH=1179,WALLPAPER_HEIGHT=2556;
export function zonedDate(now=new Date(),timeZone='Asia/Kolkata'){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const value=type=>parts.find(p=>p.type===type).value;return `${value('year')}-${value('month')}-${value('day')}`;
}
export function snapshot(entries,timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Kolkata'){
 const days=new Map();for(const e of entries)days.set(e.date,e.type==='rest'?'rest':'train');
 return {version:1,timeZone,days:[...days].sort(([a],[b])=>a.localeCompare(b))};
}
export function normalizeSnapshot(value,now=new Date()){
 if(!value||value.version!==1||typeof value.timeZone!=='string'||!Array.isArray(value.days)||value.days.length>12000)throw Error('Invalid wallpaper history.');
 let today;try{today=zonedDate(now,value.timeZone);}catch{throw Error('Choose a valid time zone.');}
 const seen=new Set();const days=value.days.map(row=>{
  if(!Array.isArray(row)||row.length!==2||typeof row[0]!=='string'||!['train','rest'].includes(row[1])||seen.has(row[0]))throw Error('Invalid wallpaper day.');seen.add(row[0]);return row;
 }).sort(([a],[b])=>a.localeCompare(b));
 validate({version:1,entries:days.map(([date,type])=>({id:date,date,type:type==='train'?'gym':'rest',createdAt:'2000-01-01T00:00:00Z',updatedAt:'2000-01-01T00:00:00Z'}))},today);
 return {version:1,timeZone:value.timeZone,days};
}
export function wallpaperModel(data,now=new Date()){
 const today=zonedDate(now,data.timeZone),[year,month,day]=today.split('-').map(Number),count=new Date(Date.UTC(year,month,0)).getUTCDate(),start=today.slice(0,7),map=new Map(data.days);
 const entries=data.days.map(([date,type])=>({date,type:type==='rest'?'rest':'gym'})),s=stats(entries,today);
 const dots=Array.from({length:count},(_,i)=>{const date=`${start}-${String(i+1).padStart(2,'0')}`;return {day:i+1,date,status:map.get(date)|| (date<today?'missed':date===today?'today':'future'),today:date===today};});
 const trained=dots.filter(d=>d.status==='train').length,rest=dots.filter(d=>d.status==='rest').length,elapsed=day-1+(map.has(today)?1:0);
 return {today,year,month,day,count,dots,trained,rest,streak:s.current,progress:elapsed?Math.round((trained+rest)/elapsed*100):0,monthName:new Date(Date.UTC(year,month-1,1)).toLocaleDateString('en-US',{timeZone:'UTC',month:'long'}).toUpperCase()};
}
export function wallpaperSvg(data,now=new Date()){
 const m=wallpaperModel(data,now),columns=m.count===30?5:7,gap=130,radius=32,rows=Math.ceil(m.count/columns);
 const centreX=WALLPAPER_WIDTH/2,centreY=WALLPAPER_HEIGHT/2;
 const dots=m.dots.map((day,index)=>{
  const row=Math.floor(index/columns),column=index%columns,rowCount=Math.min(columns,m.count-row*columns);
  // Start with day one in the bottom row; center the shorter top row too.
  const x=centreX+(column-(rowCount-1)/2)*gap;
  const y=centreY+((rows-1)/2-row)*gap;
  const colour={train:'#a4ce8a',missed:'#bd6671',rest:'#a1b9d4',today:'#e6ebf1',future:'#343434'}[day.status];
  return `<g data-day="${day.day}" data-status="${day.status}" data-x="${x}" data-y="${y}">${day.today?`<circle cx="${x}" cy="${y}" r="44" fill="none" stroke="#8c939c" stroke-width="2"/>`:''}<circle cx="${x}" cy="${y}" r="${radius}" fill="${['rest','today'].includes(day.status)?'none':colour}" stroke="${colour}" stroke-width="${day.status==='rest'?4:2}"/></g>`;
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${WALLPAPER_WIDTH}" height="${WALLPAPER_HEIGHT}" viewBox="0 0 ${WALLPAPER_WIDTH} ${WALLPAPER_HEIGHT}"><rect width="${WALLPAPER_WIDTH}" height="${WALLPAPER_HEIGHT}" fill="#000000"/>${dots}</svg>`;
}
