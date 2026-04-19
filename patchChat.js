const fs = require('fs');
let s = fs.readFileSync('public/js/socket.js', 'utf8');

const t = `            <div class="text-right shrink-0">
                <div class="text-[10px] font-bold text-brand-600 dist-val">-- km</div>
                <div class="text-[8px] text-slate-400 font-medium">\${time}</div>
            </div>
        </div>
    \`;`;

const r = `            <div class="text-right shrink-0">
                <div class="text-[10px] font-bold text-brand-600 dist-val">-- km</div>
                <div class="text-[8px] text-slate-400 font-medium">\${time}</div>
            </div>
        </div>
        <div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800" onclick="event.stopPropagation()">
            <div class="alert-messages hidden mb-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded text-[10px] text-slate-600 dark:text-slate-300 max-h-20 overflow-y-auto w-full"></div>
            <div class="flex gap-1">
                <input type="text" class="hosp-msg-input w-full text-[10px] p-1.5 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 outline-none dark:text-white" placeholder="Type instructions..." onkeypress="if(event.key==='Enter') sendHospitalMsg('\${data.alertId}', '\${data.hospitalName}')">
                <button type="button" onclick="sendHospitalMsg('\${data.alertId}', '\${data.hospitalName}')" class="px-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded font-bold">Reply</button>
            </div>
        </div>
    \`;`;

if (s.includes(t)) {
    fs.writeFileSync('public/js/socket.js', s.replace(t, r));
    console.log('Chat injected!');
} else {
    console.log('Target not found in socket.js');
}
