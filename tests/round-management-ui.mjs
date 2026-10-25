// Run with Playwright available in NODE_PATH. All requests use an in-memory D1 fixture.
import {createRequire} from 'node:module';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {localDatabase,handler} from './d1-local.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const db=localDatabase(),onRequest=await handler(),key='a'.repeat(43);
await db.prepare("UPDATE wishlist_rounds SET start_date='2098-01-01',end_date='2098-01-07' WHERE id='first-round'").run();
const browser=await chromium.launch({channel:'chrome',headless:true});
const root=fileURLToPath(new URL('../site/',import.meta.url));
const errors=[];
try {
  const context=await browser.newContext({locale:'nl-BE'});
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.pathname.startsWith('/api/wishlist')){
      const response=await onRequest({env:{WISHLIST_DB:db,WISHLIST_ADMIN_KEY:key},request:new Request(req.url(),{method:req.method(),headers:req.headers(),body:req.postData()||undefined})});
      return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer())});
    }
    const path=resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname==='/opvolging'?'/opvolging.html':decodeURIComponent(url.pathname)));
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.ttf':'font/ttf','.webm':'video/webm'};
    try {await route.fulfill({contentType:types[extname(path)]||'application/octet-stream',body:await readFile(path)});}
    catch {await route.fulfill({status:404,body:''});}
  });
  const admin=await context.newPage();admin.setDefaultTimeout(10000);
  await admin.goto('https://cookie.test/opvolging#key='+key);
  await admin.locator('#results input').first().waitFor();
  assert.equal(await admin.locator('#edit-start').inputValue(),'2098-01-01');
  await admin.getByRole('checkbox',{name:'In deze bakronde: Speculaas (Macaron)',exact:true}).check();
  await admin.getByRole('checkbox',{name:'In deze bakronde: Pecan pie (Cookies & sweets)',exact:true}).check();
  await admin.locator('#save-selection').click();
  await admin.waitForFunction(()=>document.querySelector('#stock-results input[type=number]'));
  await admin.getByRole('spinbutton',{name:'Aantal (optioneel): Speculaas (Macaron)',exact:true}).fill('12');
  await admin.getByRole('checkbox',{name:'Gebakken en beschikbaar: Pecan pie (Cookies & sweets)',exact:true}).check();
  assert(await admin.locator('#round-fields').evaluate(fieldset=>fieldset.disabled));
  await admin.getByRole('button',{name:'EN',exact:true}).click();
  assert.equal(await admin.locator('#stock-results input[type=number]').first().inputValue(),'12');
  await admin.getByRole('button',{name:'NL',exact:true}).click();
  await admin.locator('#save-stock').click();
  await admin.waitForFunction(()=>document.querySelector('#save-stock').disabled);
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  await admin.locator('#edit-round-name').fill('Huidige ronde');
  await admin.locator('#edit-start').fill(today);await admin.locator('#edit-end').fill(today);
  await admin.locator('#edit-status').selectOption('baking');await admin.locator('#save-round').click();
  await admin.waitForFunction(()=>document.querySelector('#admin-status').textContent==='De bakronde is opgeslagen.');
  const website=await context.newPage();
  async function openWebsite(){
    await website.goto('https://cookie.test/');
    if(await website.locator('#welcome-intro').evaluate(dialog=>dialog.open)){
      await website.locator('#welcome-skip').click();await website.waitForFunction(()=>!document.querySelector('#welcome-intro').open);
    }
    await website.waitForFunction(()=>window.KMCBakeSelection?.available);
  }
  await openWebsite();
  assert.equal(await website.locator('#bake-round h2').textContent(),'Huidige ronde');
  assert.equal(await website.locator('#bake-round').getAttribute('data-state'),'active');
  assert.equal(await website.locator('#product-grid .bake-stock-badge:visible').count(),0,'count and start of week do not make a product ready');
  assert.equal(await website.locator('#product-grid .bake-product-badge:not(.bake-stock-badge):visible').first().textContent(),'Geselecteerd voor deze bakronde');
  assert.equal(await website.locator('#sweets .bake-stock-badge:visible').count(),1);
  await admin.getByRole('checkbox',{name:'Gebakken en beschikbaar: Speculaas (Macaron)',exact:true}).check();await admin.locator('#save-stock').click();
  await admin.waitForFunction(()=>document.querySelector('#save-stock').disabled);await openWebsite();
  assert.equal(await website.locator('#product-grid .bake-stock-badge:visible').count(),1);
  assert.equal(await website.locator('#product-grid .bake-product-badge:not(.bake-stock-badge):visible').count(),0,'ready products replace the selection label with availability');
  await website.selectOption('#flavor-select','speculaas');assert(await website.locator('#ontdek .bake-stock-badge').isVisible());
  await admin.locator('#round-name').fill('Voorjaar');await admin.locator('#new-start').fill('2099-03-10');await admin.locator('#new-end').fill('2099-03-17');await admin.locator('#new-round').click();
  await admin.waitForFunction(()=>document.querySelector('#edit-round-name').value==='Voorjaar');
  assert.equal(await admin.locator('#results input:checked').count(),0);
  await admin.getByRole('checkbox',{name:'In deze bakronde: Cupcakes (Cookies & sweets)',exact:true}).check();await admin.locator('#save-selection').click();
  await admin.waitForFunction(()=>document.querySelector('#selection-state').textContent==='Selectie bepaald');
  await openWebsite();assert.equal(await website.locator('#bake-round h2').textContent(),'Huidige ronde');
  await admin.locator('#round-select').selectOption('first-round');await admin.waitForFunction(()=>document.querySelector('#edit-round-name').value==='Huidige ronde');
  assert.equal(await admin.getByRole('spinbutton',{name:'Aantal (optioneel): Speculaas (Macaron)',exact:true}).inputValue(),'12');
  await admin.locator('#edit-status').selectOption('stock');await admin.locator('#save-round').click();await admin.waitForFunction(()=>document.querySelector('#edit-status').value==='stock'&&document.querySelector('#save-round').disabled);
  await openWebsite();assert.equal(await website.locator('#bake-round h2').textContent(),'Voorjaar');
  assert(await website.locator('.bake-round-wrap').isVisible());
  assert(await website.locator('.bake-countdown').isVisible());
  assert(Number(await website.locator('[data-count=days]').textContent())>0);
  assert.equal(await website.locator('#sweets .bake-product-badge:not(.bake-stock-badge):visible').count(),1);
  assert.equal(await website.locator('#sweets .bake-product-badge:not(.bake-stock-badge):visible').textContent(),'Geselecteerd voor de volgende bakronde');
  assert.equal(await website.locator('#product-grid .bake-stock-badge:visible').count(),1);
  await admin.getByRole('spinbutton',{name:'Aantal (optioneel): Speculaas (Macaron)',exact:true}).fill('0');await admin.locator('#save-stock').click();await admin.waitForFunction(()=>document.querySelector('#save-stock').disabled);
  await openWebsite();assert.equal(await website.locator('#product-grid .bake-stock-badge:visible').count(),0);
  assert.equal(await website.locator('#sweets .bake-stock-badge:visible').count(),1);
  for(const language of ['en','fr','nl']){
    await admin.evaluate(language=>I18n.setLanguage(language),language);
    await website.evaluate(language=>I18n.setLanguage(language),language);
    assert.equal(await admin.locator('#edit-status').inputValue(),'stock');
  }
  await mkdir('research',{recursive:true});
  for(const width of [1440,390,320]){
    await admin.setViewportSize({width,height:960});await website.setViewportSize({width,height:960});
    assert(await admin.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'admin overflow '+width);
    assert(await website.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'website overflow '+width);
    if(width!==320){
      await admin.locator('#round-form').scrollIntoViewIfNeeded();await admin.screenshot({path:'research/round-management-admin-'+width+'.png'});
      await admin.locator('#stock-fields').scrollIntoViewIfNeeded();await admin.screenshot({path:'research/round-management-stock-'+width+'.png'});
      await website.locator('#bake-round').scrollIntoViewIfNeeded();await website.screenshot({path:'research/round-management-public-'+width+'.png'});
      await website.locator('#sweets').scrollIntoViewIfNeeded();await website.screenshot({path:'research/round-management-product-states-'+width+'.png'});
    }
  }
  admin.once('dialog',dialog=>dialog.accept());await admin.locator('#edit-status').selectOption('closed');await admin.locator('#save-round').click();
  await admin.waitForFunction(()=>document.querySelector('#edit-status').value==='closed'&&document.querySelector('#save-round').disabled);
  assert(await admin.locator('#stock-fields').evaluate(fieldset=>fieldset.disabled));
  await openWebsite();assert.equal(await website.locator('.bake-stock-badge:visible').count(),0);
  // With no upcoming round, leftover stock becomes the main announcement.
  await admin.locator('#round-select').selectOption({label:(await admin.locator('#round-select option').allTextContents()).find(text=>text.startsWith('Voorjaar'))});
  await admin.waitForFunction(()=>document.querySelector('#edit-round-name').value==='Voorjaar');
  admin.once('dialog',dialog=>dialog.accept());await admin.locator('#edit-status').selectOption('closed');await admin.locator('#save-round').click();
  await admin.waitForFunction(()=>document.querySelector('#edit-status').value==='closed'&&document.querySelector('#save-round').disabled);
  await admin.locator('#round-select').selectOption('first-round');await admin.waitForFunction(()=>document.querySelector('#edit-round-name').value==='Huidige ronde');
  await admin.locator('#edit-status').selectOption('stock');await admin.locator('#save-round').click();
  await admin.waitForFunction(()=>document.querySelector('#edit-status').value==='stock'&&document.querySelector('#save-round').disabled);
  await openWebsite();assert.equal(await website.locator('#bake-round').getAttribute('data-state'),'stock');
  assert.equal(await website.locator('.bake-round-status').textContent(),'Nog voorraad beschikbaar');
  assert(await website.locator('.bake-countdown').isHidden());
  assert.equal(await website.locator('#sweets .bake-stock-badge:visible').count(),1);
  assert(await website.locator('.wishlist-button').first().isDisabled());
  assert.deepEqual(errors,[]);
  console.log('UI passed: schedule, selection, private optional stock counts, end baking, sell out, archive, draft retention, NL/EN/FR and 320/390/1440px layouts.');
}finally{await browser.close();db.close();}
