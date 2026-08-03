const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log("🚀 Starting Vanilla JS Test Runner...");

// Create a DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
    url: "http://localhost",
    runScripts: "dangerously"
});

// Setup globals so scripts think they are in a browser
global.window = dom.window;
global.document = dom.window.document;
global.console = console;

// Mock the Supabase global object that is normally loaded via CDN in index.html
global.window.supabase = {
    createClient: () => {
        return {
            from: (table) => ({
                select: () => ({
                    order: () => Promise.resolve({ data: [{ id: 1, unit_number: 'A01' }, { id: 2, unit_number: 'B02' }], error: null }),
                    limit: () => ({ single: () => Promise.resolve({ data: { unit_number: 'A01' }, error: null }) }),
                    ilike: () => ({ single: () => Promise.resolve({ data: { unit_number: 'A01' }, error: null }) })
                })
            })
        };
    }
};

// Also copy to global scope since the script accesses `supabase` directly
dom.window.supabase = global.window.supabase;

function loadScript(filePath) {
    const code = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    const scriptEl = dom.window.document.createElement("script");
    scriptEl.textContent = code;
    dom.window.document.body.appendChild(scriptEl);
}

// Load the module to test
try {
    loadScript('supabase-client.js');
    console.log("✅ Loaded supabase-client.js");
} catch(e) {
    console.error("❌ Failed to load supabase-client.js", e);
    process.exit(1);
}

// Simple test runner logic
let testsPassed = 0;
let testsFailed = 0;

async function runTests() {
    const testDir = path.resolve(__dirname, 'tests');
    if (!fs.existsSync(testDir)) {
        console.log("No tests directory found.");
        return;
    }
    
    const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.js'));
    
    for (const file of testFiles) {
        console.log(`\n📄 Running test file: ${file}`);
        const testCode = fs.readFileSync(path.resolve(testDir, file), 'utf8');
        
        // Expose an assert function to the window for tests to use
        dom.window.assert = function(condition, message) {
            if (!condition) throw new Error(message || "Assertion failed");
        };

        // Wrap the test file in an async IIFE inside the DOM
        const scriptEl = dom.window.document.createElement("script");
        scriptEl.textContent = `
            (async function() {
                try {
                    ${testCode}
                    window._testResult = { status: 'pass' };
                } catch(e) {
                    window._testResult = { status: 'fail', error: e.stack || e.message || e };
                }
            })();
        `;
        dom.window.document.body.appendChild(scriptEl);

        // Wait a tiny bit for async tests to complete
        await new Promise(r => setTimeout(r, 100));

        const result = dom.window._testResult;
        if (result && result.status === 'pass') {
            console.log(`  ✅ Passed`);
            testsPassed++;
        } else {
            console.error(`  ❌ Failed:`, result ? result.error : "Unknown error");
            testsFailed++;
        }
    }

    console.log(`\n🏁 Test Run Complete. ${testsPassed} Passed, ${testsFailed} Failed.`);
    if (testsFailed > 0) process.exit(1);
}

runTests();
