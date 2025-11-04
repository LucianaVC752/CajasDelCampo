const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '..', 'tests'),
  path.join(__dirname, '..', '__tests__'),
  path.join(__dirname, '..', 'frontend', 'tests')
];

function rmrf(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`Eliminado: ${targetPath}`);
  } else {
    console.log(`No existe: ${targetPath}`);
  }
}

// Buscar y eliminar archivos *.test.js dentro de frontend/src
function removeFrontendSrcTests() {
  const srcDir = path.join(__dirname, '..', 'frontend', 'src');
  if (!fs.existsSync(srcDir)) return;
  const stack = [srcDir];
  while (stack.length) {
    const dir = stack.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (/\.test\.js$|\.spec\.js$/i.test(entry.name)) {
        fs.unlinkSync(full);
        console.log(`Eliminado archivo de test: ${full}`);
      }
    }
  }
}

targets.forEach(rmrf);
removeFrontendSrcTests();
console.log('Limpieza de tests completada.');