import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {localDatabase,handler} from './d1-local.mjs';
const onRequest = await handler();
const key = 'a'.repeat(43), visitor = 'b'.repeat(64);
function fixture() {
  const db = localDatabase(),env = {WISHLIST_DB:db,WISHLIST_ADMIN_KEY:key};
  db.prepare("UPDATE wishlist_rounds SET start_date='2098-01-01',end_date='2098-01-07' WHERE id='first-round'").run();
  return {db,call:async(path='',method='GET',body,headers={})=>onRequest({env,request:new Request('https://cookie.test/api/wishlist'+path,{method,headers:{'X-Visitor-Id':visitor,...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined})})};
}
const auth = {Authorization:'Bearer '+key};
const schedule={name:'Nieuw',startDate:'2099-01-01',endDate:'2099-01-07'};
async function updateRound(call,round='first-round',changes={}) {
  const admin=await (await call('/admin?round='+round,'GET',undefined,auth)).json();
  const current=admin.rounds.find(r=>r.id===round);
  return call('/rounds','PUT',{round,revision:current.revision,name:current.name,startDate:current.start_date,endDate:current.end_date,status:current.status,...changes},auth);
}
test('published baking selection is public, separate from votes, editable and retractable',async()=>{
  const {db,call}=fixture();
  const body={round:'first-round',revision:0,products:['macaron:speculaas','sweet:pecan-pie']};
  assert.equal((await call('/selection','PUT',body)).status,401);
  assert.equal((await call('/selection','GET',undefined,{'X-Visitor-Id':''})).status,200);
  assert.equal((await call('/selection','PUT',body,auth)).status,200);
  const publicData=await (await call('/selection')).json();
  assert.deepEqual(publicData.selection,{products:body.products,revision:1});
  assert.ok(!JSON.stringify(publicData).includes('visitor'));
  const admin=await (await call('/admin','GET',undefined,auth)).json();
  assert.deepEqual(admin.selection,publicData.selection);assert.equal(admin.visitors,0);
  assert.equal((await call('/selection','PUT',body,auth)).status,409);
  assert.equal((await call('/selection','PUT',{...body,revision:1,products:['sweet:cupcakes']},auth)).status,200);
  assert.deepEqual((await (await call('/selection')).json()).selection.products,['sweet:cupcakes']);
  assert.equal((await call('/selection','PUT',{...body,revision:2,products:[]},auth)).status,200);
  assert.deepEqual((await (await call('/selection')).json()).selection.products,[]);db.close();
});
test('baking selections validate inputs and remain archived when a new round starts',async()=>{
  const {db,call}=fixture();const body={round:'first-round',revision:0,products:['sweet:pecan-pie']};
  for(const products of [['unknown'],['sweet:pecan-pie','sweet:pecan-pie'],null]) {
    assert.equal((await call('/selection','PUT',{...body,products},auth)).status,400);
  }
  assert.equal((await call('/selection','PUT',{...body,revision:-1},auth)).status,400);
  assert.equal((await call('/selection','PUT',body,{...auth,Origin:'https://evil.test'})).status,403);
  await call('/selection','PUT',body,auth);
  await updateRound(call,'first-round',{status:'closed'});
  await call('/rounds','POST',schedule,auth);
  assert.deepEqual((await (await call('/selection')).json()).selection,{products:[],revision:0});
  assert.equal((await call('/selection','PUT',{...body,revision:1},auth)).status,409);
  const archived=await (await call('/admin?round=first-round','GET',undefined,auth)).json();
  assert.deepEqual(archived.selection.products,body.products);db.close();
});
test('deduplication, independent browsers, withdrawal and no visitor identities in admin output',async()=>{
  const {db,call}=fixture();
  const initial=await (await call()).json();
  const vote={round:initial.round.id,product:'macaron:creme-brulee',selected:true};
  assert.equal((await call('','PUT',vote)).status,200);
  assert.equal((await call('','PUT',vote)).status,200);
  assert.equal((await call('','PUT',vote,{'X-Visitor-Id':'c'.repeat(64)})).status,200);
  let admin=await (await call('/admin','GET',undefined,auth)).json();
  assert.equal(admin.visitors,2);assert.equal(admin.counts[0].count,2);
  assert.ok(!JSON.stringify(admin).includes('visitor_hash'));assert.ok(!JSON.stringify(admin).includes(visitor));
  assert.deepEqual((await (await call()).json()).selected,[vote.product]);
  await call('','PUT',{...vote,selected:false});
  admin=await (await call('/admin','GET',undefined,auth)).json();assert.equal(admin.counts[0].count,1);
  db.close();
});
test('planning preserves other rounds and closing archives votes and moves the public round',async()=>{
  const {db,call}=fixture();const original=await (await call()).json();
  const vote={round:original.round.id,product:'sweet:pecan-pie',selected:true};await call('','PUT',vote);
  const next=await call('/rounds','POST',schedule,auth);assert.equal(next.status,201);
  assert.deepEqual((await (await call()).json()).selected,[vote.product]);
  assert.equal((await updateRound(call,vote.round,{status:'closed'})).status,200);
  assert.deepEqual((await (await call()).json()).selected,[]);
  assert.equal((await call('','PUT',vote)).status,409);
  assert.equal((await call('/rounds','PUT',{round:vote.round,revision:0,...schedule,status:'planned'},auth)).status,409);
  const archived=await (await call('/admin?round='+vote.round,'GET',undefined,auth)).json();assert.equal(archived.counts[0].count,1);assert.equal(archived.rounds.length,2);
  assert.equal(archived.rounds.filter(r=>!r.closed_at).length,1);db.close();
});
test('unauthorized, foreign origin, malformed and oversized requests fail closed',async()=>{
  const {db,call}=fixture();
  assert.equal((await call('/admin')).status,401);
  assert.equal((await call('/admin','GET',undefined,{Authorization:'Bearer '+'d'.repeat(43)})).status,401);
  assert.equal((await call('/rounds','POST',{round:'first-round',name:'Hacked'})).status,401);
  assert.equal((await call('','PUT',{round:'first-round',product:'unknown',selected:true})).status,400);
  assert.equal((await call('','GET',undefined,{'X-Visitor-Id':'invalid'})).status,400);
  assert.equal((await call('','PUT',{},{Origin:'https://evil.test'})).status,403);
  assert.equal((await call('','PUT',{padding:'a'.repeat(2100)})).status,400);
  assert.equal((await call('/admin','GET',undefined,auth)).headers.get('cache-control'),'no-store');db.close();
});
test('unconfigured deployment returns 503 without disclosing data',async()=>{
  const result=await onRequest({env:{},request:new Request('https://cookie.test/api/wishlist',{headers:{'X-Visitor-Id':visitor}})});assert.equal(result.status,503);
});
test('round schedule validates dates, preserves selections, supports edits and rejects stale updates',async()=>{
  const {db,call}=fixture();
  for(const patch of [{name:''},{startDate:'2099-02-30'},{startDate:'2099-13-01'},{endDate:'2098-01-01'},{startDate:null}]) {
    assert.equal((await call('/rounds','POST',{...schedule,...patch},auth)).status,400,JSON.stringify(patch));
  }
  await call('/selection','PUT',{round:'first-round',revision:0,products:['macaron:speculaas']},auth);
  const next=await (await call('/rounds','POST',schedule,auth)).json();
  assert.equal((await (await call('/selection')).json()).round.id,'first-round');
  assert.equal((await updateRound(call,next.id,{name:'Voorjaar',startDate:'2097-01-01',endDate:'2097-01-03'})).status,200);
  assert.equal((await (await call('/selection')).json()).round.id,next.id);
  const original=await (await call('/admin?round=first-round','GET',undefined,auth)).json();
  assert.deepEqual(original.selection.products,['macaron:speculaas']);
  assert.equal((await call('/rounds','PUT',{...schedule,round:next.id,revision:0,status:'closed'},auth)).status,409);
  assert.equal((await call('/rounds','PUT',{...schedule,round:next.id,revision:1,status:'wrong'},auth)).status,400);db.close();
});
test('optional stock quantities remain private, survive end of baking and coexist with future rounds',async()=>{
  const {db,call}=fixture();
  await call('/selection','PUT',{round:'first-round',revision:0,products:['macaron:speculaas','sweet:pecan-pie']},auth);
  const counted=[{product:'macaron:speculaas',available:false,quantity:12},{product:'sweet:pecan-pie',available:false,quantity:null}];
  const items=counted.map(item=>({...item,available:true}));
  const stock={round:'first-round',revision:0,roundRevision:0,items:counted};
  assert.equal((await call('/stock','PUT',stock)).status,401);
  assert.equal((await call('/stock','PUT',stock,auth)).status,200);
  assert.deepEqual((await (await call('/selection')).json()).stock,[],'entering counts never publishes availability');
  assert.equal((await updateRound(call,'first-round',{status:'baking'})).status,200);
  let publicData=await (await call('/selection')).json();assert.equal(publicData.round.state,'baking');
  assert.deepEqual(publicData.stock,[],'starting the baking week never makes products baked or available');
  assert.equal((await call('/stock','PUT',{...stock,revision:1,roundRevision:1,items},auth)).status,200);
  publicData=await (await call('/selection')).json();
  assert.deepEqual(publicData.stock[0].products,items.map(i=>i.product));assert.ok(!JSON.stringify(publicData).includes('quantity'));
  assert.equal((await updateRound(call,'first-round',{status:'stock'})).status,200);
  const next=await (await call('/rounds','POST',schedule,auth)).json();
  publicData=await (await call('/selection')).json();assert.equal(publicData.round.id,next.id);assert.equal(publicData.stock.length,1);
  const admin=await (await call('/admin?round=first-round','GET',undefined,auth)).json();assert.deepEqual(admin.stock.items,items);assert.equal(admin.stock.revision,2);
  assert.equal((await call('/selection','PUT',{round:'first-round',revision:1,products:[]},auth)).status,409);
  assert.equal((await call('/stock','PUT',{...stock,revision:2},auth)).status,409,'lifecycle revision must match');
  const sold=items.map(item=>({...item,available:false,quantity:0}));
  assert.equal((await call('/stock','PUT',{...stock,revision:2,roundRevision:2,items:sold},auth)).status,200);
  assert.equal((await call('/stock','PUT',{...stock,revision:2,roundRevision:2},auth)).status,409,'stale counts must not overwrite');
  assert.deepEqual((await (await call('/selection')).json()).stock,[]);
  await updateRound(call,'first-round',{status:'closed'});
  assert.equal((await call('/stock','PUT',{...stock,revision:3,roundRevision:3},auth)).status,409);db.close();
});
test('stock rejects invalid quantities, contradictions, duplicates and cross-origin writes',async()=>{
  const {db,call}=fixture(),body={round:'first-round',revision:0,roundRevision:0,items:[]};
  const item={product:'macaron:speculaas',available:true,quantity:1};
  for(const items of [[{...item,quantity:-1}],[{...item,quantity:1.5}],[{...item,quantity:100001}],[{...item,quantity:'2'}],[{...item,quantity:0}],[{...item,product:'unknown'}],[item,item],[null]]){
    assert.equal((await call('/stock','PUT',{...body,items},auth)).status,400,JSON.stringify(items));
  }
  assert.equal((await call('/stock','PUT',{...body,items:[item]},{...auth,Origin:'https://evil.test'})).status,403);
  assert.equal((await call('/stock','GET',undefined,auth)).status,404);db.close();
});
test('dates and finishing the round never publish unbaked products or counted stock',async()=>{
  const {db,call}=fixture();
  const item={product:'macaron:speculaas',available:false,quantity:12};
  await call('/stock','PUT',{round:'first-round',revision:0,roundRevision:0,items:[item]},auth);
  await updateRound(call,'first-round',{startDate:'2000-01-01',endDate:'2000-01-02'});
  let data=await (await call('/selection')).json();assert.equal(data.round,null);assert.deepEqual(data.stock,[]);
  await updateRound(call,'first-round',{status:'stock'});
  data=await (await call('/selection')).json();assert.equal(data.round,null);assert.deepEqual(data.stock,[]);
  await call('/stock','PUT',{round:'first-round',revision:1,roundRevision:2,items:[{...item,available:true}]},auth);
  data=await (await call('/selection')).json();assert.equal(data.round.state,'stock');assert.deepEqual(data.stock[0].products,[item.product]);
  await call('/stock','PUT',{round:'first-round',revision:2,roundRevision:2,items:[item]},auth);
  const admin=await (await call('/admin','GET',undefined,auth)).json();assert.equal(admin.stock.items[0].quantity,12,'hiding availability preserves the private count');
  assert.deepEqual((await (await call('/selection')).json()).stock,[]);db.close();
});
test('date boundaries use Belgian calendar and expired rounds can retain stock without votes',async()=>{
  const {db,call}=fixture();
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  await updateRound(call,'first-round',{startDate:today,endDate:today});
  assert.equal((await (await call('/selection')).json()).round.state,'baking','end date remains inclusive');
  await call('/stock','PUT',{round:'first-round',revision:0,roundRevision:1,items:[{product:'macaron:speculaas',available:true,quantity:null}]},auth);
  await updateRound(call,'first-round',{startDate:'2000-01-01',endDate:'2000-01-02'});
  const ended=await (await call('/selection')).json();assert.equal(ended.round.state,'ended');assert.equal(ended.stock.length,1);
  assert.deepEqual(await (await call()).json(),{round:null,selected:[]});
  assert.equal((await call('','PUT',{round:'first-round',product:'macaron:speculaas',selected:true})).status,409);
  assert.equal((await call('/selection','PUT',{round:'first-round',revision:0,products:['macaron:speculaas']},auth)).status,409);
  await updateRound(call,'first-round',{status:'closed'});
  assert.equal((await (await call('/selection')).json()).round,null);db.close();
});
test('all dashboard translations exist and all 21 catalog IDs are accepted by the API',async()=>{
  const context={window:{}};vm.createContext(context);
  for(const file of ['i18n-data.js','wishlist-copy.js','wishlist-catalog.js'])vm.runInContext(readFileSync(new URL('../site/'+file,import.meta.url),'utf8'),context);
  const html=readFileSync(new URL('../site/opvolging.html',import.meta.url),'utf8')+readFileSync(new URL('../site/privacy.html',import.meta.url),'utf8');
  for(const match of html.matchAll(/data-i18n="([^"]+)"/g)){const values=context.window.KMCTranslations.copy[match[1]];assert.equal(values?.length,3,match[1]);assert.ok(values.every(Boolean),match[1]);}
  // A valid translation array can still point to the wrong caption.
  for(const match of html.matchAll(/data-i18n="(wish[^"]+)"[^>]*>([^<]+)</g)) {
    assert.equal(context.window.KMCTranslations.copy[match[1]][0],match[2].replaceAll('&amp;','&'),match[1]);
  }
  const {db,call}=fixture();
  assert.equal(context.window.KMCWishlistProducts.length,21);
  for(const [product] of context.window.KMCWishlistProducts)assert.equal((await call('','PUT',{round:'first-round',product,selected:true})).status,200,product);
  db.close();
});
