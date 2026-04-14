const fs = require('fs');
const files = [
    'frontend/src/pages/Vtr.tsx',
    'frontend/src/pages/Equipamentos.tsx',
    'frontend/src/pages/Usuarios.tsx',
    'frontend/src/pages/Extraviados.tsx',
    'frontend/src/pages/Militares.tsx',
    'frontend/src/pages/Transferencias.tsx',
    'frontend/src/pages/Unidades.tsx',
    'frontend/src/pages/Cautelas.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // Remove rogue } before divs
    content = content.replace(/\n\}\s*<div/g, '\n          <div');
    // Fix common imbalance in VTR
    if (file.includes('Vtr.tsx')) {
        content = content.replace(/<\/select>\s*<\/div>\s*(\n\s*)*\{\/\* Form Footer \*\/\}/g, '</select>\n                </div>\n              </div>\n\n          {/* Form Footer */}');
    }
    fs.writeFileSync(file, content);
});
