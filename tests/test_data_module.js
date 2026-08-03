// Test 1: Verify that window.AppData is defined correctly
window.assert(typeof window.AppData !== 'undefined', "window.AppData is undefined!");
console.log("    - window.AppData exists");

// Test 2: Verify the public API of AppData
window.assert(typeof window.AppData.fetchUnits === 'function', "fetchUnits is not exposed");
window.assert(typeof window.AppData.getUnitDetails === 'function', "getUnitDetails is not exposed");
console.log("    - window.AppData exposes correct API");

// Test 3: Test the fetchUnits() functionality using our mock supabase
const units = await window.AppData.fetchUnits();
window.assert(Array.isArray(units), "fetchUnits did not return an array");
window.assert(units.length > 0, "fetchUnits array is empty");
window.assert(units[0].unit_number === 'A01', "fetchUnits returned wrong data");
console.log("    - window.AppData.fetchUnits() returns correct mocked data");

// Test 4: Test getUnitDetails
const details = await window.AppData.getUnitDetails('A01');
window.assert(details !== null, "getUnitDetails returned null");
window.assert(details.unit_number === 'A01', "getUnitDetails returned wrong unit");
console.log("    - window.AppData.getUnitDetails() returns correct mocked data");
