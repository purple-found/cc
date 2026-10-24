const http = require('http');

const SERVICE_KEY = 'cdafc9fb4b1f4286a7e5dc59cb370c86';
const testId = 'PF296659'; // Paavo Jarvi

const url = `http://www.kopis.or.kr/openApi/restful/pblprfr/${testId}?service=${SERVICE_KEY}`;

http.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('KOPIS Response for', testId);
    console.log(data);
  });
}).on('error', (e) => console.error(e.message));
