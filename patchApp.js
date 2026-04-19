const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'public', 'js', 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// 1. Change const to let for problem
appJs = appJs.replace(
    "const problem = document.getElementById('patientProblem').value;", 
    "let problem = document.getElementById('patientProblem').value;"
);

// 2. Remove the alert() block and replace with default filler
const blockToRemove = `    if (!problem || !problem.trim()) {
        alert("Please describe the patient's condition first.");
        return;
    }`;

const replacementBlock = `    if (!problem || !problem.trim()) {
        problem = "Emergency Response Requested [Auto-Generated]";
    }`;

if (appJs.includes('alert("Please describe the')) {
    appJs = appJs.replace(blockToRemove, replacementBlock);
    fs.writeFileSync(appJsPath, appJs, 'utf8');
    console.log("Successfully patched app.js constraints!");
} else {
    console.log("Failed to find alert block in app.js");
}
