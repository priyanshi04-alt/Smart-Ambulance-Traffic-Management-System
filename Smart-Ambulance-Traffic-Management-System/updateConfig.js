const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Regex to find and replace the Tailwind config script
const regex = /<script>\s*tailwind\.config\s*=\s*{[\s\S]*?<\/script>/;

const newTailwind = `<script>
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
                            bg: '#0f172a', /* slate-900 equivalent base */
                            panel: '#1e293b',
                            border: '#334155'
                        }
                    },
                    animation: {
                        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'blob': 'blob-bounce 10s infinite alternate',
                        'float': 'float 6s ease-in-out infinite'
                    },
                    boxShadow: {
                        'neon-red': '0 0 15px rgba(220,38,38,0.6), 0 0 30px rgba(220,38,38,0.4)',
                        'neon-brand': '0 0 15px rgba(14,165,233,0.5)',
                        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
                    }
                }
            }
        }
    </script>`;

html = html.replace(regex, newTailwind);

// Enhance Buttons
html = html.split('class="emp-btn').join('class="emp-btn shadow-md hover:-translate-y-0.5 hover:shadow-lg');

// AI CoPilot Card animation
html = html.replace('id="copilotProgress" class="bg-white', 'id="copilotProgress" class="bg-white shimmer-effect animate-pulse');

// Enhance Patient Info Panel
html = html.replace('id="patientInfoPanel" class="', 'id="patientInfoPanel" class="animate-float ');

// Hospital Dashboard Eta Timer logic
html = html.replace('id="hospitalEtaTimer" class="text-4xl font-black"', 'id="hospitalEtaTimer" class="text-4xl font-black drop-shadow-md"');

fs.writeFileSync(htmlPath, html, 'utf8');
console.log("Tailwind config and micro-animations successfully updated");
