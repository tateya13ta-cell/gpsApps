const batchFields=[
  ['batchName','ชื่อสูตร / สินค้า','', 'text'],
  ['batchYield','จำนวนผลิตต่อรอบ','แพ็ก','number'],
  ['productWeight','น้ำหนักต่อแพ็ก','กรัม','number']
];
const otherFields=[
  ['packagingPerUnit','แพ็กเกจต่อแพ็ก','บาท'],
  ['laborBatch','ค่าแรงต่อรอบ','บาท'],
  ['utilitiesBatch','ค่าน้ำ/ไฟ/แก๊ส','บาท'],
  ['logisticsBatch','ขนส่งจากโรงงาน','บาท'],
  ['overheadBatch','ค่าใช้จ่ายอื่น','บาท'],
  ['productionWastePct','ของเสียการผลิต','%']
];
const tradeFields=[
  ['retailerMarginPct','GP / Margin ห้าง','%'],
  ['promoPct','ส่วนลดและงบโปรโมชั่น','%'],
  ['distributionPct','ค่ากระจายสินค้า / DC','%'],
  ['rebatePct','Rebate / ส่วนลดปลายปี','%'],
  ['marketingPct','ค่าการตลาด / กิจกรรมห้าง','%'],
  ['returnReservePct','เผื่อคืนสินค้า / ใกล้หมดอายุ','%'],
  ['adminPct','ค่าบริหารระบบ / หักอื่น','%'],
  ['fixedFeePerUnit','ค่าธรรมเนียมคงที่ต่อแพ็ก','บาท'],
  ['listingFeeTotal','ค่าเปิดสินค้า / ค่าแรกเข้า รวม','บาท'],
  ['listingAmortUnits','จำนวนแพ็กที่ใช้เฉลี่ยค่าแรกเข้า','แพ็ก'],
  ['creditDays','เครดิตเทอม','วัน'],
  ['financeRatePct','ต้นทุนเงินทุนต่อปี','%'],
  ['targetGmPct','กำไรขั้นต้นเป้าหมาย','%'],
  ['vatPct','VAT','%'],
  ['positionPct','ตำแหน่งเทียบตลาด','%']
];
function field(f,scope){const[k,l,s,t='number']=f,v=state[scope][k];return `<div class="field"><label>${l}</label><div class="suffix"><input class="input scope-input" data-scope="${scope}" data-key="${k}" type="${t}" ${t==='number'?'step="0.01"':''} value="${esc(v)}">${s?`<em>${s}</em>`:''}</div></div>`}
function renderForms(){
  $('#batchForm').innerHTML=batchFields.map(f=>field(f,'costing')).join('');
  $('#otherForm').innerHTML=otherFields.map(f=>field(f,'costing')).join('');
  $('#tradeForm').innerHTML=`<div class="trade-help" style="grid-column:1/-1;padding:11px 13px;border-radius:10px;background:#fff8e8;border:1px solid #efdca9;font-size:10px;line-height:1.6;color:#65522f"><b>ค่าหัก Modern Trade</b><br>กรอกตามใบเสนอเงื่อนไขหรือสัญญาจริงของ CJ MORE / Big C เท่านั้น ช่องที่ไม่มีให้ใส่ 0 และอย่านับค่าขนส่งซ้ำทั้งในต้นทุนการผลิตและค่ากระจายสินค้า</div>`+tradeFields.map(f=>field(f,'trade')).join('');
  $$('.scope-input').forEach(i=>i.oninput=e=>{const s=e.target.dataset.scope,k=e.target.dataset.key;state[s][k]=e.target.type==='number'?num(e.target.value):e.target.value;save();renderCost();renderDashboard();renderCompetitors()});
  renderIngredients();renderCost();
}
function renderIngredients(){
  $('#ingredientRows').innerHTML=state.costing.ingredients.map(i=>`<div class="ingredient-row" data-id="${i.id}"><input class="input name" data-key="name" value="${esc(i.name)}" placeholder="ชื่อวัตถุดิบ"><input class="input" data-key="purchaseQty" type="number" step="0.01" value="${num(i.purchaseQty)}"><input class="input" data-key="purchasePrice" type="number" step="0.01" value="${num(i.purchasePrice)}"><input class="input" data-key="usageQty" type="number" step="0.01" value="${num(i.usageQty)}"><input class="input" data-key="wastePct" type="number" step="0.01" value="${num(i.wastePct)}"><div class="ingredient-cost">${money(ingredientCost(i))}</div><button class="remove" onclick="removeIng('${i.id}')">×</button></div>`).join('');
  $$('.ingredient-row input').forEach(inp=>inp.oninput=e=>{const row=e.target.closest('.ingredient-row'),it=state.costing.ingredients.find(x=>x.id===row.dataset.id),k=e.target.dataset.key;it[k]=e.target.type==='number'?num(e.target.value):e.target.value;save();row.querySelector('.ingredient-cost').textContent=money(ingredientCost(it));renderCost();renderDashboard()});
}
function renderCost(){
  const c=calcCost(),p=calcPrice();
  $('#costPerPack').textContent=money(c.cost);
  $('#costBreakdown').innerHTML=[
    ['วัตถุดิบต่อรอบ',c.ing],
    ['ค่าใช้จ่ายอื่นต่อรอบ',c.other],
    ['แพ็กเกจต่อแพ็ก',state.costing.packagingPerUnit],
    ['ผลิตได้',state.costing.batchYield+' แพ็ก']
  ].map(x=>`<div class="summary-line"><span>${x[0]}</span><b>${typeof x[1]==='number'?money(x[1]):x[1]}</b></div>`).join('');
  $('#recommendedPrice').textContent=money(p.recommended);
  $('#priceContext').innerHTML=`ขั้นต่ำ ${money(p.floor)} · ตลาด ${money(p.benchmark)} · GM ${(p.actual*100).toFixed(1)}%<br>ค่าหักแปรผัน ${(p.variablePct*100).toFixed(1)}% · ค่าแรกเข้าเฉลี่ย ${money(p.listingPerUnit)}/แพ็ก · ต้นทุนเครดิต ${(p.financePct*100).toFixed(2)}%`;
  $('#scenarioList').innerHTML=[['ประหยัด',-10],['แข่งขันตรง',0],['พรีเมียม',10]].map(x=>{const r=calcPrice(x[1]);return `<div class="scenario"><div class="scenario-head"><div><h4>${x[0]}</h4><div class="price">${money(r.recommended)}</div></div><span class="position">${x[1]>0?'+':''}${x[1]}% ตลาด</span></div><div class="scenario-metrics"><span>ขายส่งหลัง GP<b>${money(r.wholesale)}</b></span><span>ค่าหักอื่น<b>${money(r.variableDeductions+r.financeCost+r.fixedPerUnit)}</b></span><span>รายรับสุทธิ<b>${money(r.net)}</b></span><span>กำไร/แพ็ก<b>${money(r.profit)}</b></span><span>GM<b>${(r.actual*100).toFixed(1)}%</b></span></div></div>`}).join('');
}
function addIng(){state.costing.ingredients.push({id:'i'+Date.now(),name:'',purchaseQty:1000,purchasePrice:0,usageQty:0,wastePct:0});save();renderIngredients();renderCost()}
function removeIng(id){if(state.costing.ingredients.length<=1)return toast('ต้องมีวัตถุดิบอย่างน้อย 1 รายการ');state.costing.ingredients=state.costing.ingredients.filter(i=>i.id!==id);save();renderIngredients();renderCost();renderDashboard()}
window.removeIng=removeIng;