import test from 'node:test';
import assert from 'node:assert/strict';
import {localDatabase,handler} from './d1-local.mjs';
const onRequest=await handler(),key='a'.repeat(43),auth={Authorization:'Bearer '+key};
async function fixture(){
  const db=localDatabase();
  const call=(path,method='GET',body,headers=auth)=>onRequest({env:{WISHLIST_DB:db,WISHLIST_ADMIN_KEY:key},request:new Request('https://cookie.test/api/wishlist/'+path,{method,headers:{...headers,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined})});
  await db.prepare("UPDATE wishlist_rounds SET stock_json=? WHERE id='first-round'").bind(JSON.stringify([{product:'macaron:speculaas',quantity:10,available:true}])).run();
  const admin=async()=> (await call('admin')).json();
  const body={id:crypto.randomUUID(),round:'first-round',revision:0,roundRevision:0,action:'save',customer:'Testklant',items:[{product:'macaron:speculaas',quantity:4,unitCents:250}]};
  return {db,call,admin,body};
}
test('create, retry, edit and cancellation update private orders and stock together',async()=>{
  const {db,call,admin,body}=await fixture();
  assert.equal((await call('orders','PUT',body,{})).status,401);
  assert.equal((await call('orders','PUT',body,{...auth,Origin:'https://evil.test'})).status,403);
  assert.equal((await call('orders','PUT',body)).status,200);
  assert.equal((await call('orders','PUT',body)).status,200);
  let data=await admin();assert.equal(data.stock.items[0].quantity,6);assert.equal(data.orders.length,1);
  const edit={...body,revision:1,items:[{...body.items[0],quantity:10}]};
  assert.equal((await call('orders','PUT',edit)).status,200);
  data=await admin();assert.equal(data.stock.items[0].quantity,0);assert.equal(data.stock.items[0].available,false);
  const publicData=await (await call('selection')).json();assert.ok(!JSON.stringify(publicData).includes('Testklant'));assert.equal(publicData.stock.length,0);
  assert.equal((await call('orders','PUT',{...edit,action:'cancel',revision:2})).status,200);
  assert.equal((await call('orders','PUT',{...edit,action:'cancel',revision:2})).status,200);
  data=await admin();assert.equal(data.stock.items[0].quantity,10);assert.equal(data.stock.items[0].available,true);assert.equal(data.orders[0].status,'cancelled');db.close();
});
test('insufficient, invalid, unknown, stale and concurrent orders cannot alter stock',async()=>{
  const {db,call,admin,body}=await fixture();
  for(const items of [[{...body.items[0],quantity:11}],[{...body.items[0],quantity:-1}],[{...body.items[0],unitCents:1.5}],[...body.items,...body.items],[{...body.items[0],product:'bad'}]]){
    assert.equal((await call('orders','PUT',{...body,items})).status,400);
    assert.equal((await admin()).stock.items[0].quantity,10);
  }
  assert.equal((await call('orders','PUT',{...body,roundRevision:99})).status,409);
  const results=await Promise.all([call('orders','PUT',body),call('orders','PUT',{...body,id:crypto.randomUUID()})]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal((await admin()).stock.items[0].quantity,6);
  await db.prepare("UPDATE wishlist_rounds SET stock_json=? WHERE id='first-round'").bind(JSON.stringify([{product:'macaron:speculaas',quantity:null,available:true}])).run();
  assert.equal((await call('orders','PUT',{...body,id:crypto.randomUUID(),revision:1})).status,400);
  await db.prepare("UPDATE wishlist_rounds SET status='closed' WHERE id='first-round'").run();
  assert.equal((await call('orders','PUT',{...body,action:'cancel',revision:1})).status,409);db.close();
});
