const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

const targetStr = `            <!-- Traffic Signal Visualizer -->
            <div class="lg:col-span-2 glass-panel`;

const replacement = `            <!-- Center Content: Visualizer & Map -->
            <div class="lg:col-span-2 flex flex-col gap-6">
            
            <!-- Traffic Signal Visualizer -->
            <div class="glass-panel`;

// Replace opening div
html = html.replace(targetStr, replacement);

// Find the end of visualizer to close the wrapper and add Map
const targetEnd = `                        </div>
                    </div>
                </div>
            </div>

            <!-- Side Widgets -->`;

const replacementEnd = `                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Global Admin Network Map -->
            <div class="glass-panel dark:glass-panel rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden relative min-h-[400px] flex-1">
                <div class="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur z-10 absolute top-0 w-full shadow-sm flex items-center justify-between pointer-events-none">
                    <h3 class="text-sm font-bold flex items-center gap-2"><i data-lucide="map" class="text-brand-500 w-4 h-4"></i> City Network Map</h3>
                </div>
                <div id="adminNetworkMap" class="w-full h-full bg-slate-200 dark:bg-slate-800 z-0 absolute inset-0"></div>
            </div>
            
            </div> <!-- End Center Content Wrapper -->

            <!-- Side Widgets -->`;

html = html.replace(targetEnd, replacementEnd);
fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Admin Map Injected.");
