const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const ver = '?v=' + Date.now();

html = html.replace(/src="\/js\/socket\.js(\?v=[0-9]+)?"/g, 'src="/js/socket.js' + ver + '"');
html = html.replace(/src="\/js\/app\.js(\?v=[0-9]+)?"/g, 'src="/js/app.js' + ver + '"');
html = html.replace(/src="\/js\/map\.js(\?v=[0-9]+)?"/g, 'src="/js/map.js' + ver + '"');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log("Injected cache buster to index.html successfully.");
