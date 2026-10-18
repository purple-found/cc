const fs = require('fs');

const content = fs.readFileSync('src/data/initialRealConcerts.js', 'utf8');

// Match JSON objects or find pieces
const regex = /"id":\s*"([^"]+)"[\s\S]*?"title":\s*"([^"]+)"[\s\S]*?"pieces":\s*(\[[^\]]*\])/g;

let count = 0;
let match;
while ((match = regex.exec(content)) !== null) {
  const [_, id, title, piecesStr] = match;
  if (piecesStr.includes('"') || piecesStr.includes("'")) {
    count++;
    console.log(`[${id}] ${title} (${piecesStr.replace(/\s+/g, ' ')})`);
  }
}

console.log(`Total non-empty pieces concerts: ${count}`);
