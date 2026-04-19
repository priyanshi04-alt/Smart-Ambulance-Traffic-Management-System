const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// The intersection grid container has `lg:col-span-2` which causes it to dynamically stretch to match the right column height.
// Adding `self-start` will completely collapse the dead whitespace at the bottom.
const target = 'class="lg:col-span-2 glass-panel dark:glass-panel rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-brand-200/50 p-5"';
const replacement = 'class="lg:col-span-2 self-start glass-panel dark:glass-panel rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-brand-200/50 p-5"';

if(html.includes(target)) {
    html = html.replace(target, replacement);
    console.log("Successfully fixed spacing on the Admin Intersection Container.");
} else {
    // Fallback if class string has minor whitespace variation
    html = html.replace(/class="lg:col-span-2 glass-panel dark:glass-panel/g, 'class="lg:col-span-2 self-start glass-panel dark:glass-panel');
    console.log("Applied fallback regex replacement for spacing.");
}

fs.writeFileSync(htmlPath, html, 'utf8');
