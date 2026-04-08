const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// For Signal Synthesis Plot
// It seems my previous string replacement for XAxis axisLine={false} failed because the exact string didn't match.
// I'll do a more robust replacement using regex or carefully matched strings.

code = code.replace(
  /<XAxis\s*\n\s*dataKey="t"\s*\n\s*type="number"\s*\n\s*domain=\{\[0, windowDuration\]\}\s*\n\s*tickCount=\{11\}\s*\n\s*label=\{\{ value: 'Time \(s\)', position: 'insideBottomRight', offset: -5 \}\}\s*\n\s*allowDataOverflow\s*\n\s*\/>/m,
  `<XAxis \n                  dataKey="t" \n                  type="number" \n                  domain={[0, windowDuration]} \n                  tickCount={11} \n                  label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }} \n                  allowDataOverflow \n                  axisLine={false}\n                  tickLine={false}\n                />`
);

fs.writeFileSync('src/App.tsx', code);
