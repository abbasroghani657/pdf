const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /{ icon: 'solar:magic-stick-3-linear', text: 'AI powered', color: 'text-purple-600 bg-purple-50' },/g,
  "{ icon: 'solar:magic-stick-3-linear', text: isEs ? 'Impulsado por IA' : 'AI powered', color: 'text-purple-600 bg-purple-50' },"
);
app = app.replace(
  /{ icon: 'solar:widget-add-linear', text: '37\\+ tools', color: 'text-blue-600 bg-blue-50' },/g,
  "{ icon: 'solar:widget-add-linear', text: isEs ? '+37 herramientas' : '37+ tools', color: 'text-blue-600 bg-blue-50' },"
);
app = app.replace(
  /{ icon: 'solar:user-cross-linear', text: 'No signup', color: 'text-amber-600 bg-amber-50' },/g,
  "{ icon: 'solar:user-cross-linear', text: isEs ? 'Sin registro' : 'No signup', color: 'text-amber-600 bg-amber-50' },"
);
app = app.replace(
  /{ icon: 'solar:devices-linear', text: 'All devices', color: 'text-emerald-600 bg-emerald-50' },/g,
  "{ icon: 'solar:devices-linear', text: isEs ? 'Todos los disp.' : 'All devices', color: 'text-emerald-600 bg-emerald-50' },"
);
app = app.replace(
  /{ icon: 'solar:bolt-linear', text: 'Fast & Secure', color: 'text-teal-600 bg-teal-50' }/g,
  "{ icon: 'solar:bolt-linear', text: isEs ? 'Rápido y Seguro' : 'Fast & Secure', color: 'text-teal-600 bg-teal-50' }"
);
app = app.replace(
  /{ icon: 'solar:shield-check-linear', text: '256-bit SSL', color: 'text-slate-600 bg-slate-100' },/g,
  "{ icon: 'solar:shield-check-linear', text: isEs ? 'SSL de 256 bits' : '256-bit SSL', color: 'text-slate-600 bg-slate-100' },"
);

fs.writeFileSync('src/App.jsx', app);
