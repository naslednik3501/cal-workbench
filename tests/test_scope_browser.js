// Synthetic browser integration; serve the repository or dist on localhost.
// Requires Playwright and its Chromium, or CHROMIUM_EXECUTABLE_PATH.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.argv[2];
if(!base||!['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname))throw Error('Usage: node tests/test_scope_browser.js http://127.0.0.1:PORT/');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true});
 try {
  const context=await browser.newContext({acceptDownloads:true});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'load'});
  await page.waitForFunction(()=>!document.getElementById('openCal').disabled);
  assert.equal(await page.evaluate(()=>CAL_CATALOG.meta.calculators),25455);
  assert(await page.evaluate(()=>Boolean(globalThis.CatalogScope)));
  const source='Size(200,120);Form{Digit(km,"Value",0,0,100);Label(msg,"",0,30);} OnShow{@0=17;km=2;} OnApply{@1=km;@2=@2+1;}';
  await page.locator('#openCal').setInputFiles({name:'coordinator-synthetic.cal',mimeType:'application/octet-stream',buffer:Buffer.from(source)});
  await page.locator('#openBin').setInputFiles({name:'coordinator-synthetic.bin',mimeType:'application/octet-stream',buffer:Buffer.alloc(16)});
  await page.waitForFunction(()=>!document.getElementById('apply').disabled);
  await page.locator('#cal-input-0').fill('7');
  await page.locator('#apply').click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save').click()]);
  const result=fs.readFileSync(await download.path());
  assert.deepEqual([...result],[17,7,1,...Array(13).fill(0)]);
  const [original]=await Promise.all([page.waitForEvent('download'),page.locator('#saveOriginal').click()]);
  assert.deepEqual(fs.readFileSync(await original.path()),Buffer.alloc(16));
  await page.locator('#apply').click();
  const [repeat]=await Promise.all([page.waitForEvent('download'),page.locator('#save').click()]);
  assert.deepEqual(fs.readFileSync(await repeat.path()),result);
  await page.reload({waitUntil:'load'});
  await page.waitForFunction(()=>!document.getElementById('openCal').disabled);
  await page.locator('#search').fill('coordinator-synthetic.cal');
  await page.waitForFunction(()=>document.querySelectorAll('.fileItem').length===1);
  assert(await page.locator('#saveOriginal').isDisabled());
  assert.deepEqual(errors,[]);
  console.log('PASS Chromium: policy loading, catalog count, synthetic CAL import, BIN preparation/apply, exact downloads, repeat apply, IndexedDB persistence and no BIN persistence');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
