const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Digital Chart Button
html = html.replace(
    '<button class="px-3 py-1 bg-brand-600 text-white text-[10px] font-bold rounded-lg hover:bg-brand-700 transition flex items-center gap-1">\\r\\n                                    <i data-lucide="file-text" class="w-3 h-3"></i> View Digital Chart\\r\\n                                </button>',
    '<button onclick="alert(\\\'Digital Chart synced with Driver Telemetry\\\')" class="px-3 py-1 bg-brand-600 text-white text-[10px] font-bold rounded-lg hover:bg-brand-700 transition flex items-center gap-1">\\r\\n                                    <i data-lucide="file-text" class="w-3 h-3"></i> View Digital Chart\\r\\n                                </button>'
);

html = html.replace(
    '<button class="px-3 py-1 bg-brand-600 text-white text-[10px] font-bold rounded-lg hover:bg-brand-700 transition flex items-center gap-1">\\n                                    <i data-lucide="file-text" class="w-3 h-3"></i> View Digital Chart\\n                                </button>',
    '<button onclick="alert(\\\'Digital Chart synced with Driver Telemetry\\\')" class="px-3 py-1 bg-brand-600 text-white text-[10px] font-bold rounded-lg hover:bg-brand-700 transition flex items-center gap-1">\\n                                    <i data-lucide="file-text" class="w-3 h-3"></i> View Digital Chart\\n                                </button>'
);


// 2. Floating Phone Button
const oldPhoneStr1 = '<button class="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 active:scale-95 transition-all outline-none">\\n                    <i data-lucide="phone-forwarded" class="w-6 h-6"></i>\\n                </button>';
const oldPhoneStr2 = '<button class="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 active:scale-95 transition-all outline-none">\\r\\n                    <i data-lucide="phone-forwarded" class="w-6 h-6"></i>\\r\\n                </button>';

const newPhoneStr = '<button onclick="alert(\\\'Secure Voice Channel active\\\')" class="bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-full shadow-2xl transform hover:scale-110 active:scale-95 transition-all outline-none">\\n                    <i data-lucide="phone-forwarded" class="w-6 h-6"></i>\\n                </button>';

html = html.replace(oldPhoneStr1, newPhoneStr);
html = html.replace(oldPhoneStr2, newPhoneStr);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("HTML patched with dummy button handlers.");
