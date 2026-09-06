import fs from 'fs';
const c = fs.readFileSync('components/layout/footer.tsx', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('toast.')) console.log((i+1) + ': ' + l.trim());
});