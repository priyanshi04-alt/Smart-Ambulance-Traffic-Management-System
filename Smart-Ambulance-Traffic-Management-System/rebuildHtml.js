const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'public', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Strip previous injected script
const scriptStart = html.indexOf('<!-- Auto-Layout Rebalancer Script -->');
if (scriptStart !== -1) {
    const headEnd = html.indexOf('</head>', scriptStart);
    if (headEnd !== -1) {
        html = html.substring(0, scriptStart) + html.substring(headEnd);
    }
}
html = html.replace('</head>\n<body class="bg-slate-50', '</head>\n<body class="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-gray-200 transition-colors duration-500 antialiased h-full w-full flex flex-col overflow-hidden m-0 p-0 relative">');

const blockStart = html.indexOf('<!-- Admin Dashboard Template -->');
const blockEnd = html.indexOf('</template>', blockStart) + 11; // length of </template>

let templateStr = html.substring(blockStart, blockEnd);

function extractBlock(startMarker, nextMarker) {
    const s = templateStr.indexOf(startMarker);
    const e = nextMarker ? templateStr.indexOf(nextMarker, s) : templateStr.length;
    if (s === -1) return '';
    return templateStr.substring(s, e);
}

const trafficBlock = extractBlock('            <!-- Traffic Signal Visualizer -->', '            <!-- Side Widgets -->');
const sideWidgetsBlock = extractBlock('            <!-- Side Widgets -->', '            <!-- Density Control -->');
const densityBlock = extractBlock('            <!-- Density Control -->', '            <!-- System Logs -->');
const logsBlock = extractBlock('            <!-- System Logs -->', '            <!-- Map View Placeholder (for next step) -->');
const mapBlock = extractBlock('            <!-- Map View Placeholder (for next step) -->', '        </div>\n    </template>');

if (trafficBlock && sideWidgetsBlock && densityBlock) {
    const newTemplate = `<!-- Admin Dashboard Template -->
    <template id="adminDashboardTemplate">
        <div class="flex flex-col lg:flex-row gap-6 w-full items-start">
            <!-- LEFT COLUMN (65%) -->
            <div class="flex flex-col gap-6 lg:w-[65%] w-full">
${trafficBlock.trimEnd()}
${densityBlock.trimEnd()}
${mapBlock.trimEnd()}
            </div>
            <!-- RIGHT COLUMN (35%) -->
            <div class="flex flex-col gap-6 lg:w-[35%] w-full">
${sideWidgetsBlock.trimEnd()}
${logsBlock.trimEnd()}
            </div>
        </div>
    </template>`;

    html = html.substring(0, blockStart) + newTemplate + html.substring(blockEnd);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log("Successfully rebuilt layout into columns natively!");
} else {
    console.log("Extraction failed. T:", !!trafficBlock, "SW:", !!sideWidgetsBlock, "D:", !!densityBlock);
}
