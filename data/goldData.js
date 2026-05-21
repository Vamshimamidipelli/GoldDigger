// =========================================================================
// DATA LAYER: IN-MEMORY DATA STORAGE (goldData.js)
// =========================================================================
// Welcome! As a beginner, you might wonder: "Where does my data go when I don't use a database?"
// The answer is: RAM (Random Access Memory).
// In this file, we are creating simple JavaScript variables to hold our data.
// 
// ⚠️ IMPORTANT CONCEPT FOR BEGINNERS:
// Because this data is stored in the server's memory, if you restart the server,
// the variables are reset, meaning all saved transactions and prices go back to their starting values!
// This is perfect for local testing and learning, but in a real-world app, you would connect to a database.

/**
 * 1. Transactions Array
 * This simple array acts as our transaction database table.
 * Every time a buyer purchases gold, we will generate a transaction object and use
 * the .push() method to add it to this array.
 */
const transactions = [];

/**
 * 2. Live Gold Price State
 * This object holds the current state of our live simulated gold.
 * - currentPrice: The live price per ounce/gram (starts at 75.00 GBP).
 * - previousPrice: Keeps track of what the price was BEFORE the last tick so we can check if it went up or down.
 * - trend: Describes the direction of movement ('up', 'down', or 'stable').
 * - lastUpdated: A timestamp showing exactly when the last price tick occurred.
 */
const goldState = {
    currentPrice: 75.00,
    previousPrice: 75.00,
    trend: "stable",
    lastUpdated: new Date().toISOString()
};

/**
 * 3. Module Exports
 * In Node.js, files are isolated by default. To make these variables accessible to other 
 * files (like our controllers and server.js), we must "export" them.
 * We do this by attaching them to the global 'module.exports' object.
 */
module.exports = {
    transactions,
    goldState
};
