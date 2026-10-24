const fs = require('fs');

const { initialRealConcerts } = require('../src/data/initialRealConcerts.js');

console.log('Total concerts:', initialRealConcerts.length);

let missingHall = 0;
let genericPerformers = 0;
let genericPrice = 0;
let genericDesc = 0;

initialRealConcerts.forEach(c => {
  if (!c.hall) missingHall++;
  const perfs = (c.performers || []).join('');
  if (perfs === c.title || perfs.length <= 2) genericPerformers++;
  if (!c.price || c.price === '공식 예매처 참조') genericPrice++;
  if (!c.description || c.description.includes('정통 클래식 무대') || c.description.includes('공연예술통합전산망(KOPIS)')) genericDesc++;
});

console.log('Missing detailed hall:', missingHall);
console.log('Generic/unparsed performers:', genericPerformers);
console.log('Generic price:', genericPrice);
console.log('Generic description:', genericDesc);
