// Portable synthetic/import and real-catalog UI checks; no private BIN required.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.argv[2];
if(!base||!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Usage: node tests/test_catalog_dedup_browser.js http://127.0.0.1:PORT/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'load'});await page.waitForFunction(()=>!document.getElementById('openCal').disabled);
  const initial=await page.evaluate(()=>({visible:Number(document.getElementById('count').textContent.replace(/\D/g,'')),expected:CatalogScope.calculatorGroups(CAL_CATALOG.entries).length,raw:CAL_CATALOG.meta.calculators}));
  assert.equal(initial.visible,initial.expected);assert(initial.visible<initial.raw);
  const example=await page.evaluate(()=>{const g=CatalogScope.calculatorGroups(CAL_CATALOG.entries).find(g=>g.e.path.includes('/Dashboard/')&&g.aliases.some(e=>e.path.includes('/Car/')));return {representative:g.e.path,alias:g.aliases.find(e=>e.path.includes('/Car/')).path,sha:g.e.sha};});
  await page.locator('#search').fill(example.alias);
  assert.equal(await page.locator('.fileItem').count(),1);await page.locator('.fileItem').click();
  assert((await page.locator('#calcPath').textContent()).includes(example.representative));assert((await page.locator('#calcPath').textContent()).includes(example.alias));
  await page.locator('#calcDetails > summary').click();
  await page.locator('#calcPath button').filter({hasText:example.alias}).click();
  assert.equal(await page.locator('.fileItem[aria-pressed="true"]').count(),1);
  assert.equal(await page.locator('#calcPath > span').first().textContent(),example.alias);
  const source='Size(200,120);Form{Digit(km,"Value",0,0,100);}OnShow{km=2;}OnApply{@0=km;}';
  const upload=async(text)=>{await page.locator('#openCal').setInputFiles({name:'dedup-synthetic.cal',mimeType:'application/octet-stream',buffer:Buffer.from(text)});await page.waitForFunction(()=>!document.getElementById('openCal').disabled);};
  await upload(source);await upload(source);await upload(source.replace('km=2','km=3'));
  await page.locator('#search').fill('dedup-synthetic.cal');assert.equal(await page.locator('.fileItem').count(),2);
  for(const text of await page.locator('.fileItem').allTextContents())assert.match(text,/вариант [12]/);
  assert.equal(await page.locator('#count').textContent(),(initial.visible+2).toLocaleString('ru-RU'));
  await page.reload({waitUntil:'load'});await page.waitForFunction(()=>!document.getElementById('openCal').disabled);
  await page.locator('#search').fill('dedup-synthetic.cal');assert.equal(await page.locator('.fileItem').count(),2);
  assert.deepEqual(errors,[]);
  console.log('PASS Chromium: unique visible count, alias-only search, original path selection, identical import consolidation, distinct same-name versions, IndexedDB reload, no page errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
