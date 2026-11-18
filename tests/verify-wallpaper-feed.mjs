import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {POST,GET,DELETE} from '../api/wallpaper.js';
const readKey=randomBytes(32).toString('hex'),writeKey=randomBytes(32).toString('hex');
const endpoint=`${process.env.WALLPAPER_TEST_ORIGIN||'http://localhost:4173'}/api/wallpaper?key=${readKey}`;
const call=(method,request)=>process.env.WALLPAPER_TEST_ORIGIN?fetch(request):({POST,GET,DELETE}[method])(request);
const request=(method,body,write=writeKey)=>new Request(endpoint,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${write}`},...(body?{body:JSON.stringify(body)}:{})});
const data={version:1,timeZone:'Asia/Kolkata',days:[['2026-11-03','train'],['2026-11-04','rest']]};
try{
 assert.equal((await call('GET',new Request(endpoint))).status,404);
 let result=await call('POST',request('POST',data));assert.equal(result.status,200,await result.text());
 assert.equal((await call('POST',request('POST',data,'f'.repeat(64)))).status,403);
 result=await call('GET',new Request(endpoint));assert.equal(result.status,200);assert.equal(result.headers.get('content-type'),'image/png');assert.ok(result.headers.get('cache-control').includes('no-store'));const png=Buffer.from(await result.arrayBuffer());assert.equal(png.readUInt32BE(16),1179);assert.equal(png.readUInt32BE(20),2556);
 result=await call('POST',request('POST',{...data,days:[...data.days,['2026-11-05','train']]}));assert.equal(result.status,200,await result.text());
 const changed=await call('GET',new Request(endpoint));assert.equal(changed.status,200);assert.ok(!png.equals(Buffer.from(await changed.arrayBuffer())),'A successful sync must change the next wallpaper image immediately');
 assert.equal((await call('DELETE',request('DELETE',null,'e'.repeat(64)))).status,403);
 assert.equal((await call('DELETE',request('DELETE'))).status,200);
 assert.equal((await call('GET',new Request(endpoint))).status,404);
 console.log('Private feed integration passed: create, authorize, render PNG, update, disconnect, revoked read.');
}finally{await call('DELETE',request('DELETE'));}
