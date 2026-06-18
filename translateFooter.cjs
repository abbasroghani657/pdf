const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');

// Mobile Nav
app = app.replace(
  /{ label: 'Home', icon: 'solar:home-linear', path: '\/' },/g,
  `{ label: isEs ? 'Inicio' : 'Home', icon: 'solar:home-linear', path: '/' },`
);
app = app.replace(
  /{ label: 'Merge', icon: 'solar:layers-linear', path: '\/tools\/merge-pdf' },/g,
  `{ label: isEs ? 'Unir' : 'Merge', icon: 'solar:layers-linear', path: '/tools/merge-pdf' },`
);
app = app.replace(
  /{ label: 'Sign', icon: 'solar:pen-linear', path: '\/tools\/sign-pdf' },/g,
  `{ label: isEs ? 'Firmar' : 'Sign', icon: 'solar:pen-linear', path: '/tools/sign-pdf' },`
);
app = app.replace(
  /{ label: 'AI Chat', icon: 'solar:chat-round-linear', path: '\/tools\/chat-with-pdf' },/g,
  `{ label: isEs ? 'Chat de IA' : 'AI Chat', icon: 'solar:chat-round-linear', path: '/tools/chat-with-pdf' },`
);
app = app.replace(
  /{ label: 'More', icon: 'solar:hamburger-menu-linear', path: null },/g,
  `{ label: isEs ? 'Más' : 'More', icon: 'solar:hamburger-menu-linear', path: null },`
);

// Footer headings
app = app.replace(
  /{ title: 'Tools', links:/g,
  `{ title: isEs ? 'Herramientas' : 'Tools', links:`
);
app = app.replace(
  /{ title: 'Company', links:/g,
  `{ title: isEs ? 'Compañía' : 'Company', links:`
);
app = app.replace(
  /{ title: 'Legal', links:/g,
  `{ title: isEs ? 'Legal' : 'Legal', links:`
);

// Footer links
app = app.replace(
  /{ label: 'Merge PDF', path: '\/tools\/merge-pdf' }/g,
  `{ label: isEs ? 'Unir PDF' : 'Merge PDF', path: '/tools/merge-pdf' }`
);
app = app.replace(
  /{ label: 'Split PDF', path: '\/tools\/split-pdf' }/g,
  `{ label: isEs ? 'Dividir PDF' : 'Split PDF', path: '/tools/split-pdf' }`
);
app = app.replace(
  /{ label: 'Compress PDF', path: '\/tools\/compress-pdf' }/g,
  `{ label: isEs ? 'Comprimir PDF' : 'Compress PDF', path: '/tools/compress-pdf' }`
);
app = app.replace(
  /{ label: 'PDF to Word', path: '\/tools\/pdf-to-word' }/g,
  `{ label: isEs ? 'PDF a Word' : 'PDF to Word', path: '/tools/pdf-to-word' }`
);
app = app.replace(
  /{ label: 'Sign PDF', path: '\/tools\/sign-pdf' }/g,
  `{ label: isEs ? 'Firmar PDF' : 'Sign PDF', path: '/tools/sign-pdf' }`
);
app = app.replace(
  /{ label: 'Edit PDF', path: '\/tools\/edit-pdf' }/g,
  `{ label: isEs ? 'Editar PDF' : 'Edit PDF', path: '/tools/edit-pdf' }`
);

app = app.replace(
  /{ label: 'About Us', path: '\/about' }/g,
  `{ label: isEs ? 'Sobre nosotros' : 'About Us', path: '/about' }`
);
app = app.replace(
  /{ label: 'Contact', path: '\/contact' }/g,
  `{ label: isEs ? 'Contacto' : 'Contact', path: '/contact' }`
);
app = app.replace(
  /{ label: 'Pricing', path: '\/pricing' }/g,
  `{ label: isEs ? 'Precios' : 'Pricing', path: '/pricing' }`
);

app = app.replace(
  /{ label: 'Privacy Policy', path: '\/privacy' }/g,
  `{ label: isEs ? 'Política de privacidad' : 'Privacy Policy', path: '/privacy' }`
);
app = app.replace(
  /{ label: 'Terms of Service', path: '\/terms' }/g,
  `{ label: isEs ? 'Términos de servicio' : 'Terms of Service', path: '/terms' }`
);


fs.writeFileSync('src/App.jsx', app);
