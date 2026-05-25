const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath);
    } else if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.json')) {
      let content = fs.readFileSync(filePath, 'utf8');
      // Absolute yolları relative yollara çevir (/_expo -> _expo, /assets -> assets)
      const newContent = content
        .replace(/src="\//g, 'src="./')
        .replace(/href="\//g, 'href="./')
        .replace(/"\/_expo/g, '"./_expo')
        .replace(/"\/assets/g, '"./assets');
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Fixed paths in: ${filePath}`);
      }
    }
  });
}

if (fs.existsSync(distPath)) {
  console.log('Fixing paths for GitHub Pages...');
  walk(distPath);
  console.log('All paths fixed!');
} else {
  console.error('Dist folder not found!');
}
