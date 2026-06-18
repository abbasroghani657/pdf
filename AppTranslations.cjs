const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

app = app.replace(
  /{ path: '\/', label: 'Home' }/g,
  "{ path: '/', label: isEs ? 'Inicio' : 'Home' }"
);
app = app.replace(
  /{ path: '\/tools', label: 'Tools' }/g,
  "{ path: '/tools', label: isEs ? 'Herramientas' : 'Tools' }"
);
app = app.replace(
  /{ path: '\/pricing', label: 'Pricing' }/g,
  "{ path: '/pricing', label: isEs ? 'Precios' : 'Pricing' }"
);
app = app.replace(
  /{ path: '\/compare', label: 'Why Us\?' }/g,
  "{ path: '/compare', label: isEs ? '¿Por qué nosotros?' : 'Why Us?' }"
);

app = app.replace(
  /\{user\.profile\?\.name \|\| 'Dashboard'\}/g,
  "{user.profile?.name || (isEs ? 'Panel' : 'Dashboard')}"
);
app = app.replace(
  /<button\s+onClick=\{logout\}[^>]*>\s*Logout\s*<\/button>/g,
  (match) => match.replace('Logout', "{isEs ? 'Cerrar sesión' : 'Logout'}")
);
app = app.replace(
  /Admin\s*<\/button>/g,
  "{isEs ? 'Administrador' : 'Admin'}</button>"
);
app = app.replace(
  /<button onClick=\{\(\) => handleNavClick\('\/login'\)\}[^>]*>\s*Sign in\s*<\/button>/g,
  (match) => match.replace('Sign in', "{isEs ? 'Iniciar sesión' : 'Sign in'}")
);
app = app.replace(
  /<button onClick=\{\(\) => handleNavClick\('\/register'\)\}[^>]*>\s*Sign up\s*<\/button>/g,
  (match) => match.replace('Sign up', "{isEs ? 'Registrarse' : 'Sign up'}")
);

app = app.replace(
  /\{ icon: 'solar:stars-linear', label: 'AI powered',/g,
  "{ icon: 'solar:stars-linear', label: isEs ? 'Con IA' : 'AI powered',"
);
app = app.replace(
  /\{ icon: 'solar:widget-5-linear', label: '37\+ tools',/g,
  "{ icon: 'solar:widget-5-linear', label: isEs ? 'Más de 37 herramientas' : '37+ tools',"
);
app = app.replace(
  /\{ icon: 'solar:user-cross-linear', label: 'No signup',/g,
  "{ icon: 'solar:user-cross-linear', label: isEs ? 'Sin registro' : 'No signup',"
);
app = app.replace(
  /\{ icon: 'solar:shield-check-linear', label: '256-bit SSL',/g,
  "{ icon: 'solar:shield-check-linear', label: isEs ? 'SSL de 256 bits' : '256-bit SSL',"
);
app = app.replace(
  /\{ icon: 'solar:devices-linear', label: 'All devices',/g,
  "{ icon: 'solar:devices-linear', label: isEs ? 'Todos los dispositivos' : 'All devices',"
);
app = app.replace(
  /\{ icon: 'solar:cloud-bold', label: 'Fast & Secure',/g,
  "{ icon: 'solar:cloud-bold', label: isEs ? 'Rápido y seguro' : 'Fast & Secure',"
);

fs.writeFileSync('src/App.jsx', app);
console.log('App.jsx translated!');
