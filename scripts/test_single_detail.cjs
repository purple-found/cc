const http = require('http');
const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';

function fetchDetail(kid) {
  const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${kid}?service=${SERVICE_KEY}`;
  return new Promise((resolve) => {
    http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => resolve('ERR: ' + err.message));
  });
}

async function run() {
  const data = await fetchDetail('PF303383');
  console.log('Length:', data.length);
  console.log(data);
}

run();
