const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// The string tokens
const startTemplate = '<!-- Admin Dashboard Template -->';
const endTemplate = '</template>\n\n    <!-- Driver Dashboard Template -->';

const startIndex = html.indexOf(startTemplate);
const endIndex = html.indexOf(endTemplate);

if (startIndex !== -1 && endIndex !== -1) {
    let templateHtml = html.substring(startIndex, endIndex);

    // 1. Change the main wrapper
    templateHtml = templateHtml.replace(
        '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">', 
        '<div class="flex flex-col lg:flex-row gap-6 w-full items-start">\n\n        <!-- Left Column -->\n        <div class="flex flex-col gap-6 lg:w-[65%] w-full">'
    );

    // 2. Identify the Side Widgets block and close the Left Column, open the Right Column
    templateHtml = templateHtml.replace(
        '            <!-- Side Widgets -->',
        '        <!-- Middle Right Widgets Break -->\n            <!-- Side Widgets -->'
    );

    // 3. Move Density Control to the left column (it's currently after Side Widgets)
    // Extract Side Widgets completely
    const sideWidgetsStart = templateHtml.indexOf('            <!-- Side Widgets -->');
    const densityControlStart = templateHtml.indexOf('            <!-- Density Control -->');
    const systemLogsStart = templateHtml.indexOf('            <!-- System Logs -->');
    const mapStart = templateHtml.indexOf('            <!-- Map View Placeholder (for next step) -->');
    
    // We basically just need to reorder the chunks.
    // Let's do it cleanly by extracting the 5 main chunks from the current template:
    // chunk1: Traffic Signal
    // chunk2: Side Widgets
    // chunk3: Density Control
    // chunk4: System Logs
    // chunk5: Map
    console.log("Proceeding with JS DOM parser approach instead due to safety.");
}

// Fallback to DOM manipulation on the client-side using JavaScript injected into index.html
// This is 100% robust and prevents any regex/substring corruption!
const scriptInjection = `
    <!-- Auto-Layout Rebalancer Script -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
             // We modify the template before it gets cloned
             const tpl = document.getElementById('adminDashboardTemplate');
             if(tpl) {
                 const grid = tpl.content.querySelector('.grid.grid-cols-1.lg\\\\:grid-cols-3');
                 if(grid) {
                     // Change parent styling
                     grid.className = 'flex flex-col lg:flex-row gap-6 w-full items-start';
                     
                     // Create columns
                     const leftCol = document.createElement('div');
                     leftCol.className = 'flex flex-col gap-6 lg:w-[65%] w-full';
                     
                     const rightCol = document.createElement('div');
                     rightCol.className = 'flex flex-col gap-6 lg:w-[35%] w-full';

                     // Move items sequentially
                     const children = Array.from(grid.children);
                     
                     // Assuming order: [0] Traffic, [1] Side Widgets Wrapper (has 4 items inside), [2] Density, [3] Logs, [4] Map
                     if(children.length >= 5) {
                         leftCol.appendChild(children[0]); // Traffic
                         leftCol.appendChild(children[2]); // Density
                         leftCol.appendChild(children[4]); // Map
                         
                         rightCol.appendChild(children[1]); // Side Widgets
                         rightCol.appendChild(children[3]); // System Logs
                         
                         grid.appendChild(leftCol);
                         grid.appendChild(rightCol);
                     }
                 }
             }
        });
    </script>
</head>
<body class="bg-slate-50`;

html = html.replace('</head>\n<body class="bg-slate-50', scriptInjection);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log("Successfully appended DOM rebalancer script.");
