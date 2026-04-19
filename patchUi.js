const fs = require('fs');
const path = require('path');
const p = path.join('c:', 'projects', 'smart-ambulance', 'public', 'index.html');
let content = fs.readFileSync(p, 'utf8');

// 1. Hide the floating phone button
content = content.replace(
    '<button class="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 active:scale-95 transition-all outline-none">\r\n                    <i data-lucide="phone-forwarded" class="w-6 h-6"></i>\r\n                </button>',
    '<button class="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 active:scale-95 transition-all outline-none hidden">\n                    <i data-lucide="phone-forwarded" class="w-6 h-6"></i>\n                </button>'
);
content = content.replace(
    '<button class="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 active:scale-95 transition-all outline-none">\n                    <i data-lucide="phone-forwarded" class="w-6 h-6"></i>\n                </button>',
    '<button class="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 active:scale-95 transition-all outline-none hidden">\n                    <i data-lucide="phone-forwarded" class="w-6 h-6"></i>\n                </button>'
);

// 2. We already fixed the view digital chart button using event delegation!
fs.writeFileSync(p, content);
console.log('patched');
