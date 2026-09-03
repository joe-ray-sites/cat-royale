// Bundles index.html + css + js into a single self-contained dist/index.html
const fs = require('fs');
const path = require('path');
const root = __dirname;
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) =>
  '<style>\n' + fs.readFileSync(path.join(root, href), 'utf8') + '\n</style>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) =>
  '<script>\n' + fs.readFileSync(path.join(root, src), 'utf8') + '\n</script>');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), html);
console.log('Built dist/index.html (' + (html.length / 1024).toFixed(0) + ' KB)');

// Artifact build: same bundle without the document wrapper (the Artifact host supplies doctype/head/body)
let art = html.replace(/^[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*$/, '');
const styles = [...html.matchAll(/<style>[\s\S]*?<\/style>/g)].map(m => m[0]).join('\n');
art = '<title>Cat Royale</title>\n' + styles + '\n' + art;
fs.writeFileSync(path.join(root, 'dist', 'artifact.html'), art);
console.log('Built dist/artifact.html (' + (art.length / 1024).toFixed(0) + ' KB)');
