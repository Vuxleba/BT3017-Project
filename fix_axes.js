const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// For Signal Synthesis Plot
// Remove axisLine for XAxis and keep it clean
code = code.replace(
  /<XAxis \n                  dataKey="t" \n                  type="number" \n                  domain=\{\[0, windowDuration\]\} \n                  tickCount=\{11\} \n                  label=\{\{ value: 'Time \\(s\\)', position: 'insideBottomRight', offset: -5 \}\} \n                  allowDataOverflow \n                \/>/g,
  `<XAxis \n                  dataKey="t" \n                  type="number" \n                  domain={[0, windowDuration]} \n                  tickCount={11} \n                  label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }} \n                  allowDataOverflow \n                  axisLine={false}\n                />`
);

// We also make sure YAxis has no axisLine if we want, but actually YAxis axisLine is at x=0.
// We will just let YAxis have its axisLine or we can disable it too.
// Let's just disable axisLine for XAxis since that's the one at the bottom.

fs.writeFileSync('src/App.tsx', code);
