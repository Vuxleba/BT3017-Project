const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /<YAxis \n                    domain=\{\[-maxAmp, maxAmp\]\}\n                    ticks=\{\[-maxAmp, 0, maxAmp\]\}\n                    label=\{\{ value: 'Amplitude', angle: -90, position: 'insideLeft' \}\} \n                  \/>/,
  `<YAxis domain={[-maxAmp, maxAmp]} label={{ value: 'Amplitude', angle: -90, position: 'insideLeft' }} />`
);
fs.writeFileSync('src/App.tsx', code);
