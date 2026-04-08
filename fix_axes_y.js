const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Also remove axisLine from YAxis to prevent the default line at the left side
code = code.replace(
  /<YAxis domain=\{\[-maxAmp, maxAmp\]\} label=\{\{ value: 'Amplitude', angle: -90, position: 'insideLeft' \}\} \/>/,
  `<YAxis domain={[-maxAmp, maxAmp]} label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }} axisLine={false} />`
);

fs.writeFileSync('src/App.tsx', code);
