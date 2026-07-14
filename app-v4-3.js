const batchFields=[
  ['batchName','ชื่อสูตร / สินค้า','', 'text'],
  ['batchYield','จำนวนผลิตต่อรอบ','แพ็ก','number'],
  ['productWeight','น้ำหนักต่อแพ็ก','กรัม','number']
];
const otherFields=[
  ['packagingPerUnit','แพ็กเกจต่อแพ็ก','บาท'],
  ['laborBatch','ค่าแรงต่อรอบ','บาท'],
  ['utilitiesBatch','ค่าน้ำ/ไฟ/แก๊ส','บาท'],
  ['logisticsBatch','ขนส่งจากโรงงานไปคลังห้าง','บาท'],
  ['overheadBatch','Fix Cost / ค่าใช้จ่ายอื่น','บาท'],
  ['productionWastePct','ของเสียการผลิต','%']
];
const tradeFields=[
  ['retailerMarginPct','GP / Margin ห้าง','%'],
  ['distributionPct','DC Fee / ค่ากระจายสินค้า','%'],
  ['promoPct','ส่วนลดและงบโปรโมชั่น','%'],
  ['rebatePct','Rebate / ส่วนลดปลายปี','%'],
  ['marketingPct','ค่าการตลาด / กิจกรรมห้าง','%'],
  ['returnReservePct','เผื่อคืนสินค้า / ใกล้หมดอายุ','%'],
  ['adminPct','ค่าบริหารระบบ / หักอื่น','%'],
  ['fixedFeePerUnit','ค่าธรรมเนียมคงที่ต่อแพ็ก','บาท'],
  ['listingFeeTotal','ค่าเปิดหน้าบัญชี / ค่าแรกเข้า รวม','บาท'],
  ['listingAmortUnits','จำนวนแพ็กที่ใช้เฉลี่ยค่าครั้งแรก','แพ็ก'],
  ['creditDays','เครดิตเทอม','วัน'],
  ['financeRatePct','ต้นทุนเงินทุนต่อปี','%'],
  ['targetGmPct','กำไรขั้นต้นเป้าหมายของเรา','%'],
  ['vatPct','VAT','%'],
  ['positionPct','ตำแหน่งเทียบตลาด','%']
];
function field(f,scope){const[k,l,s,t='number']=f,v=scope==='trade'?currentTrade()[k]:state[scope][k];return `<div class="field"><label>${l}</label><div class="suffix"><input class="input scope-input" data-scope="${scope}" data-key="${k}" type="${t}" ${t==='number'?'step="0.01"':''} value="${esc(v)}">${s?`<em>${s}</em>`:''}</div></div>`}
function tradeProfileHeader(){
  const active=state.activeRetailer||'CJ';
  const isCJ=active==='CJ';
  return `<div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px">
    <button type="button" class="btn ${isCJ?'primary':'ghost'} retailer-profile" data-retailer="CJ">CJ MORE</button>
    <button type="button" class="btn ${!isCJ?'primary':'ghost'} retailer-profile" data-retailer="BIGC">Big C</button>
  </div>
  <div class="trade-help" style="grid-column:1/-1;padding:12px 14px;border-radius:10px;background:${isCJ?'#fff8e8':'#eef6ff'};border:1px solid ${isCJ?'#efdca9':'#cddff3'};font-size:10px;line-height:1.65;color:#4b5668">
    <b>${isCJ?'Preset CJ MORE':'Preset Big C'}</b><br>
    ${isCJ?'ตั้งต้น GP 40%, DC Fee 7%, ค่าเปิดหน้าบัญชี 5,000 บาท ตามข้อมูลที่ได้รับ ส่วนค่าหักอื่นเริ่มที่ 0':'ยังไม่มี Commercial Terms ที่ยืนยัน จึงตั้ง GP, DC และค่าแรกเข้าเป็น 0 กรุณากรอกตามเอกสาร Buyer หรือสัญญาจริง'}
  </div>`;
}
function renderForms(){
  $('#batchForm').innerHTML=batchFields.map(f=>field(f,'costing')).join('');
  $('#otherForm').innerHTML=otherFields.map(f=>field(f,'costing')).join('');
  $('#tradeForm').innerHTML=tradeProfileHeader()+tradeFields.map(f=>field(f,'trade')).join('');
  $$('.retailer-profile').forEach(b=>b.onclick=()=>{state.activeRetailer=b.dataset.retailer;save();renderForms();renderDashboard();renderCompetitors()});
  $$('.scope-input').forEach(i=>i.oninput=e=>{const s=e.target.dataset.scope,k=e.target.dataset.key,v=e.target.type==='number'?num(e.target.value):e.target.value;if(s==='trade')currentTrade()[k]=v;else state[s][k]=v;save();renderCost();renderDashboard();renderCompetitors()});
  renderIngredients();renderCost();
}
function renderIngredients(){
  $('#ingredientRows').innerHTML=state.costing.ingredients.map(i=>`<div class="ingredient-row" data-id="${i.id}"><input class="input name" data-key="name" value="${esc(i.name)}" placeholder="ชื่อวัตถุดิบ"><input class="input" data-key="purchaseQty" type="number" step="0.01" value="${num(i.purchaseQty)}"><input class="input" data-key="purchasePrice" type="number" step="0.01" value="${num(i.purchasePrice)}"><input class="input" data-key="usageQty" type="number" step="0.01" value="${num(i.usageQty)}"><input class="input" data-key="wastePct" type="number" step="0.01" value="${num(i.wastePct)}"><div class="ingredient-cost">${money(ingredientCost(i))}</div><button class="remove" onclick="removeIng('${i.id}')">×</button></div>`).join('');
  $$('.ingredient-row input').forEach(inp=>inp.oninput=e=>{const row=e.target.closest('.ingredient-row'),it=state.costing.ingredients.find(x=>x.id===row.dataset.id),k=e.target.dataset.key;it[k]=e.target.type==='number'?num(e.target.value):e.target.value;save();row.querySelector('.ingredient-cost').textContent=money(ingredientCost(it));renderCost();renderDashboard()});
}
function renderCost(){
  const c=calcCost(),p=calcPrice(),name=retailerName();
  $('#costPerPack').textContent=money(c.cost);
  $('#costBreakdown').innerHTML=[
    ['วัตถุดิบต่อรอบ',c.ing],['ค่าใช้จ่ายอื่นต่อรอบ',c.other],['แพ็กเกจต่อแพ็ก',state.costing.packagingPerUnit],['ผลิตได้',state.costing.batchYield+' แพ็ก']
  ].map(x=>`<div class="summary-line"><span>${x[0]}</span><b>${typeof x[1]==='number'?money(x[1]):x[1]}</b></div>`).join('');
  $('#recommendedPrice').textContent=money(p.recommended);
  $('#priceContext').innerHTML=`${name} · ราคาต่ำสุด ${money(p.floor)} · ตลาด ${money(p.benchmark)} · GM ${(p.actual*100).toFixed(1)}%<br>ราคาขายให้ห้างก่อน VAT ${money(p.wholesale)} · DC/ค่าหักแปรผัน ${money(p.variableDeductions)} · ค่าแรกเข้าเฉลี่ย ${money(p.listingPerUnit)}/แพ็ก`;
  $('#scenarioList').innerHTML=[['ประหยัด',-10],['แข่งขันตรง',0],['พรีเมียม',10]].map(x=>{const r=calcPrice(x[1]);return `<div class="scenario"><div class="scenario-head"><div><h4>${x[0]} · ${name}</h4><div class="price">${money(r.recommended)}</div></div><span class="position">${x[1]>0?'+':''}${x[1]}% ตลาด</span></div><div class="scenario-metrics"><span>ราคาขายให้ห้างก่อน VAT<b>${money(r.wholesale)}</b></span><span>DC และค่าหักอื่น<b>${money(r.variableDeductions+r.financeCost+r.fixedPerUnit)}</b></span><span>รายรับสุทธิของเรา<b>${money(r.net)}</b></span><span>กำไร/แพ็ก<b>${money(r.profit)}</b></span><span>GM ของเรา<b>${(r.actual*100).toFixed(1)}%</b></span></div></div>`}).join('');
}
function addIng(){state.costing.ingredients.push({id:'i'+Date.now(),name:'',purchaseQty:1000,purchasePrice:0,usageQty:0,wastePct:0});save();renderIngredients();renderCost()}
function removeIng(id){if(state.costing.ingredients.length<=1)return toast('ต้องมีวัตถุดิบอย่างน้อย 1 รายการ');state.costing.ingredients=state.costing.ingredients.filter(i=>i.id!==id);save();renderIngredients();renderCost();renderDashboard()}
window.removeIng=removeIng;