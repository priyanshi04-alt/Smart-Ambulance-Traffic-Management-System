const fs = require('fs');
const path = require('path');
const appJsPath = path.join('c:', 'projects', 'smart-ambulance', 'public', 'js', 'app.js');

let appJs = fs.readFileSync(appJsPath, 'utf8');

// 1. Fix innerText -> textContent for view digital chart
appJs = appJs.replace(
    /btn\.innerText && btn\.innerText\.includes\('View Digital Chart'\)/g,
    "btn.textContent && btn.textContent.includes('View Digital Chart')"
);

appJs = appJs.replace(
    /btn\.innerText\.includes\('View Digital Chart'\)/g,
    "btn.textContent.includes('View Digital Chart')"
);

fs.writeFileSync(appJsPath, appJs);
console.log('patched app.js');
