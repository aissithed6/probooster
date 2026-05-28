const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'components', 'super-admin', 'marketing-promotions.tsx');
const src = fs.readFileSync(filePath, 'utf8');
let balance = 0;
const stack = [];
let line = 1;
let col = 0;
for (const ch of src) {
  if (ch === '\n') {
    line += 1;
    col = 0;
    continue;
  }
  col += 1;
  if (ch === '{') {
    balance += 1;
    stack.push({ line, col });
  } else if (ch === '}') {
    balance -= 1;
    stack.pop();
  }
}
console.log('Final balance:', balance);
console.log('Remaining stack:', stack.slice(-10));
