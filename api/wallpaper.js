import {createHash,timingSafeEqual} from 'node:crypto';
import {get,put,del} from '@vercel/blob';
import {Resvg} from '@resvg/resvg-js';
import {normalizeSnapshot,wallpaperSvg} from '../dist/wallpaper.js';
const headers={'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(value,status=200)=>Response.json(value,{status,headers});
const digest=s=>createHash('sha256').update(s).digest('hex');
const validKey=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
function credentials(request){const key=new URL(request.url).searchParams.get('key');if(!validKey(key))throw Object.assign(Error('Wallpaper link is missing or invalid.'),{status:400});return {key,pathname:`wallpaper/${digest(key)}.json`};}
async function readFeed(pathname){const result=await get(pathname,{access:'private',useCache:false});if(!result)return null;if(result.statusCode!==200)throw Error('Wallpaper storage unavailable.');return {data:await new Response(result.stream).json(),etag:result.blob.etag};}
function authorized(request,feed){const supplied=request.headers.get('authorization')?.replace(/^Bearer /,'');return validKey(supplied)&&timingSafeEqual(Buffer.from(digest(supplied),'hex'),Buffer.from(feed.writeHash,'hex'));}
function fail(error){if(error.status)return json({error:error.message},error.status);console.error('Wallpaper service error:',error.name);return json({error:'Wallpaper service is temporarily unavailable. Your workouts remain saved on this device.'},503);}
export async function GET(request){try{
 const {pathname}=credentials(request),feed=await readFeed(pathname);if(!feed)return json({error:'This wallpaper link is not active. Open IRONFORM and sync your wallpaper.'},404);
 const svg=wallpaperSvg(feed.data.snapshot,new Date());
 const png=new Resvg(svg,{font:{loadSystemFonts:false}}).render().asPng();
 return new Response(new Uint8Array(png),{headers:{...headers,'Content-Type':'image/png','Content-Disposition':'inline; filename="ironform-wallpaper.png"'}});
}catch(error){return fail(error);}}
export async function POST(request){try{
 const {pathname}=credentials(request),supplied=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!validKey(supplied))return json({error:'Wallpaper write key is missing.'},401);
 const raw=await request.text();if(raw.length>500000)return json({error:'Wallpaper history is too large.'},413);
 let data;try{data=normalizeSnapshot(JSON.parse(raw));}catch(error){return json({error:error.message},400);}
 const existing=await readFeed(pathname);if(existing&&!authorized(request,existing.data))return json({error:'This browser cannot update that wallpaper link.'},403);
 const body=JSON.stringify({writeHash:digest(supplied),snapshot:data,updatedAt:new Date().toISOString()});
 try{await put(pathname,body,{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:!!existing,...(existing?{ifMatch:existing.etag}:{}),cacheControlMaxAge:60});}
 catch(error){if(/condition|exists/i.test(error.name))return json({error:'Wallpaper changed in another tab. Try syncing again.'},409);throw error;}
 return json({ok:true,syncedAt:new Date().toISOString()});
}catch(error){return fail(error);}}
export async function DELETE(request){try{const {pathname}=credentials(request),feed=await readFeed(pathname);if(feed&&!authorized(request,feed.data))return json({error:'This browser cannot disconnect that wallpaper.'},403);if(feed)await del(pathname);return json({ok:true});}catch(error){return fail(error);}}
