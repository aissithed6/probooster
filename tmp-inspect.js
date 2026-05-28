const fs = require('fs');
const path = 'app/dashboard/page.tsx';
const text = fs.readFileSync(path, 'utf8');
const idx = text.indexOf('  return (');
console.log('return index', idx);
const snippet = text.slice(idx - 20, idx + 60);
console.log('snippet:\n' + snippet);
const codes = Array.from(snippet).map(ch => ch.charCodeAt(0));
console.log('codes:', codes.join(','));
const suspect = [];
for (let i = 0; i < text.length; i++) {
  const code = text.charCodeAt(i);
  if (code === 0x2028 || code === 0x2029 || code === 0x200b || code === 0x200e || code === 0x200f || (code >= 0x2060 && code <= 0x2064) || code === 0x00a0 || code === 0xfeff) {
    suspect.push({ index: i, code: '0x' + code.toString(16) });
  }
}
console.log('suspect chars', suspect);
