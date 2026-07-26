const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// 1. Upgrade the Tailwind Config
const oldConfigStr = `    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#f0f9ff',
                            100: '#e0f2fe',
                            500: '#0ea5e9',
                            600: '#0284c7',
                            900: '#0c4a6e',
                        },
                        dark: {
                            bg: '#0f172a',
                            panel: '#1e293b',
                            border: '#334155'
                        }
                    },
                    animation: {
                        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }
                }
            }
        }
    </script>`;

const newConfigStr = `    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: {
                            50: '#f0f9ff',
                            100: '#e0f2fe',
                            400: '#38bdf8',
                            500: '#0ea5e9',
                            600: '#0284c7',
                            900: '#0c4a6e',
                        },
                        dark: {
                            bg: '#0f172a',
                            panel: '#1e293b',
                            border: '#334155'
                        }
                    },
                    animation: {
                        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'blob': 'blob-bounce 10s infinite alternate',
                        'float': 'float 6s ease-in-out infinite'
                    }
                }
            }
        }
    </script>`;

if (html.includes(oldConfigStr)) {
    html = html.replace(oldConfigStr, newConfigStr);
    console.log("Tailwind config updated.");
}

// 2. Add blobs to body and upgrade background
const oldBodyStr = `<body class="bg-gray-50 text-slate-800 dark:bg-dark-bg dark:text-gray-200 transition-colors duration-300 antialiased h-full w-full flex flex-col overflow-hidden m-0 p-0">`;
const newBodyStr = `<body class="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-gray-200 transition-colors duration-500 antialiased h-full w-full flex flex-col overflow-hidden m-0 p-0 relative">
    
    <!-- Ambient Animated Blobs for Glassmorphism Effect -->
    <div class="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-500/10 dark:bg-brand-500/5 blur-[100px] animate-blob pointer-events-none z-0"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] animate-blob pointer-events-none z-0" style="animation-delay: 2s;"></div>
    <div class="fixed top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-purple-500/10 dark:bg-purple-500/5 blur-[100px] animate-blob pointer-events-none z-0" style="animation-delay: 4s;"></div>`;

if (html.includes(oldBodyStr)) {
    html = html.replace(oldBodyStr, newBodyStr);
    console.log("Body and blobs updated.");
}

// 3. Convert all cards to glassmorphism
const oldCardStr = `bg-white dark:bg-dark-panel rounded-2xl shadow-sm border border-gray-100 dark:border-dark-border`;
const newCardStr = `glass-panel dark:glass-panel rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-brand-200/50`;

html = html.split(oldCardStr).join(newCardStr);
console.log("Glassmorphism applied to panels.");

// 4. Update Header
const oldHeader = `bg-white dark:bg-dark-panel border-b border-gray-200 dark:border-dark-border py-3 px-6 shadow-sm z-10 hidden`;
const newHeader = `glass-panel dark:glass-panel border-b border-white/20 dark:border-slate-700/50 py-3 px-6 shadow-md z-10 hidden backdrop-blur-xl`;
html = html.replace(oldHeader, newHeader);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log("Done upgrading index.html");
