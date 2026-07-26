const fs = require('fs');
let s = fs.readFileSync('public/js/socket.js', 'utf8');

// Unhide chat box
const t1 = `            const msgBox = document.getElementById('driverMessages');
            if (msgBox) {
                msgBox.innerHTML`;
const r1 = `            const msgBox = document.getElementById('driverMessages');
            if (msgBox) {
                const wrap = document.getElementById('driverMessagingSection');
                if (wrap) wrap.classList.remove('hidden');
                
                msgBox.innerHTML`;

if (s.includes(t1)) {
    s = s.replace(t1, r1);
    fs.writeFileSync('public/js/socket.js', s, 'utf8');
    console.log("Driver chat logic patched.");
} else {
    console.log("driver chat logic target not found.");
}
