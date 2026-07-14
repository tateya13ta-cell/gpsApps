const KEY='chaojaosamut-market-costing-v2',LEGACY='chawchaosamut-competitor-intelligence-v1';
const baseTrade={promoPct:0,distributionPct:0,rebatePct:0,marketingPct:0,returnReservePct:0,adminPct:0,fixedFeePerUnit:0,listingFeeTotal:0,listingAmortUnits:1000,creditDays:0,financeRatePct:0,vatPct:7,targetGmPct:35,positionPct:0};
const defaultProfiles={
  CJ:{...baseTrade,retailerMarginPct:40,distributionPct:7,listingFeeTotal:5000},
  BIGC:{...baseTrade,retailerMarginPct:0,distributionPct:0,listingFeeTotal:0}
};
const defaults={
  competitors:[
    {id:'c1',brand:'ทาโร