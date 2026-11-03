// Portable integration of delivered catalog, illustrations and partial readers.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.argv[2];
if(!base||!['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname))throw Error('Supply localhost URL');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true});
 try{
  const page=await browser.newPage({acceptDownloads:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'load'});await page.waitForFunction(()=>!document.getElementById('openCal').disabled);
  const selectSha=sha=>page.evaluate(sha=>select(entries.find(e=>e.sha===sha)),sha);
  const upload=async bytes=>{await page.locator('#openBin').setInputFiles({name:'synthetic.bin',mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});await page.waitForFunction(()=>!binLoading&&original!==null);};
  const sportage='1544ac94267414e7aebae42bfc455d1699df96e60417469dcdeb118e0770fffa';
  const expected=km=>{const b=Buffer.alloc(2048,0xa5),q=Math.floor(km/15);for(let at=0x4c;at<0x13c;at+=6){b[at]=q&255;b[at+1]=q>>>8;b[at+2]=q%2?0xe0:0;b[at+3]=b[at+4]=q%2?0xff:0;b[at+5]=(b[at]+b[at+1]+b[at+2]+b[at+3]+b[at+4]+0xaa)&255;}return b;};
  await selectSha(sportage);await upload(expected(180000));
  const distance=page.locator('#formArea input[type=text]').first();assert.equal(await distance.inputValue(),'180000');
  await distance.fill('123456');await page.locator('#apply').click();
  const downloaded=page.waitForEvent('download');await page.locator('#save').click();const file=await downloaded;
  assert.deepEqual(fs.readFileSync(await file.path()),expected(123456));
  assert(await page.locator('.calPicture').count()>0);
  console.log('PASS built-in Sportage: read, apply, independent full-buffer download, original picture');
  const ecu='545d98cd88f60f924bf05bcd00e9eff8df1412d10ef700cc315787bd42accd2a';
  const dump=Buffer.from(Array.from({length:1024},(_,i)=>(i*17+23)&255));dump[0]=dump[1]=0;dump[0x10e]=0x34;dump[0x10f]=0x12;
  await selectSha(ecu);await upload(dump);
  assert.equal(await page.locator('#cal-input-0').inputValue(),'4660');
  assert.equal(await page.locator('#compatBadge').textContent(),'Только чтение');
  for(const id of ['apply','save','selection'])assert(await page.locator('#'+id).isDisabled());
  assert.match(await page.locator('#compat').textContent(),/apply/);
  // Even a readable OnShow that prepares bytes must never offer those bytes as a result.
  await page.evaluate(()=>{const p=CalSource.parse(new TextEncoder().encode('Size(10,10);Form{}OnShow{@0=77;}OnApply{@1=88;}'));p.partial=true;p.eventErrors={apply:'invalid apply'};program=p;initializeSession();});
  assert.equal(await page.evaluate(()=>session.buffer[0]),77);
  assert.equal(await page.evaluate(()=>candidate),null);assert(await page.locator('#save').isDisabled());
  await page.evaluate(()=>document.getElementById('apply').onclick());assert.equal(await page.evaluate(()=>candidate),null);
  // Manual HEX edits still begin from the original, never the hidden prepared bytes.
  await page.evaluate(()=>commitByte(1,22));assert.deepEqual(await page.evaluate(()=>[candidate[0],candidate[1],original[1]]),[0,22,0]);
  await selectSha('5f74901d009f3bca42a60ae00125bc3278892358b61b35907bc8ae8648e6a7be');
  assert(await page.locator('#apply').isDisabled());assert.equal(await page.locator('#compatBadge').textContent(),'Только чтение');
  console.log('PASS partial readers: correct PIN, unavailable write, no prepared download, manual HEX isolation, source warning');
  const assets=await page.evaluate(async()=>{const all=Object.values(CAL_IMAGE_DATA.assets);await Promise.all(all.map(a=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>i.naturalWidth===a.width&&i.naturalHeight===a.height?ok():no(Error(a.src));i.onerror=()=>no(Error(a.src));i.src=a.src;})));return all.length;});
  assert.equal(assets,135);
  const examples=await page.evaluate(()=>{const out=[];for(const category of ['board_chip_location','logo','device_identification']){for(const [key,m] of Object.entries(CAL_IMAGE_DATA.mappings)){if(CAL_IMAGE_DATA.assets[m.sha].category!==category)continue;const sha=key.split(':')[0],e=entries.find(e=>e.sha===sha);if(!e)continue;try{const p=E.parse(raw(e),{sha});if(p.executable){out.push({sha,src:CAL_IMAGE_DATA.assets[m.sha].src});break;}}catch{}}}return out;});
  // Category labels are inventory data, so also exercise one image of each actual category.
  if(!examples.length)throw Error('No image integration examples');
  for(const width of [1280,375,320]){await page.setViewportSize({width,height:900});for(const ex of examples){await selectSha(ex.sha);const img=page.locator('img[src="'+ex.src+'"]');assert(await img.count()>0);await img.first().evaluate(i=>i.decode());assert(await img.first().evaluate(i=>{const r=i.getBoundingClientRect(),p=i.parentElement.getBoundingClientRect();return r.width>0&&r.width<=p.width+1&&r.height<=440&&getComputedStyle(i).objectFit==='contain';}));}}
  assert.deepEqual(errors,[]);console.log('PASS restored images: all135 decode, real forms at1280/375/320px, no script errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
