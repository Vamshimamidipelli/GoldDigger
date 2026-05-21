// =========================================================================
// CONTROLLER LAYER: BUSINESS LOGIC (goldController.js)
// =========================================================================
// In web servers, "Controllers" are like the brains of our operations.
// They receive the incoming HTTP requests, process the data, perform calculations,
// update our data store, and send back the final HTTP response to the client (like a browser or Postman).
//
// Every controller function receives two standard arguments from Express:
// 1. 'req' (Request): Contains all information about the incoming request (headers, URL, body, etc.).
// 2. 'res' (Response): Contains functions to send back a reply (status code, JSON data, HTML, etc.).

// We import the in-memory data store that we created in 'data/goldData.js' so we can access/modify prices and transactions.
const { transactions, goldState } = require("../data/goldData");

/**
 * 1. Helper Function: Get Formatted Time (e.g., "10:45 PM")
 * A simple utility to convert the current date into the specific string format expected by our frontend.
 */
function getFormattedTime() {
    // Get the current date and time
    const now = new Date();
    
    // Extract the hours (0-23)
    let hours = now.getHours();
    
    // Extract the minutes (0-59)
    const minutes = now.getMinutes();
    
    // Determine whether it is AM or PM based on standard 24-hour clock
    const ampm = hours >= 12 ? "PM" : "AM";
    
    // Convert 24-hour format to 12-hour format
    hours = hours % 12;
    // If the hour is 0, make it 12 (midnight/noon adjustment)
    hours = hours ? hours : 12; 
    
    // Pad minutes with a leading zero if they are less than 10 (e.g., 5 becomes "05")
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    
    // Return the final formatted time string (e.g. "12:05 PM")
    return `${hours}:${formattedMinutes} ${ampm}`;
}

/**
 * 2. GET /gold-price
 * Sends back the current simulated live gold price, trend, and timestamp.
 */
exports.getGoldPrice = (req, res) => {
    // Why: The frontend needs to fetch the live price to display it on the screen.
    // What: We pull the live state from our goldState object.
    
    // We send a JSON response to the user with a 200 OK status code.
    // res.status(200) tells the client that the request was successful.
    // res.json(...) converts our JavaScript object into a JSON string and sends it over the network.
    res.status(200).json({
        currentPrice: Number(goldState.currentPrice.toFixed(2)), // Convert to decimal number with 2 decimal places
        trend: goldState.trend,                                 // Whether the price is "up", "down", or "stable"
        timestamp: goldState.lastUpdated                       // The last update timestamp
    });
};

/**
 * 3. POST /buy-gold
 * Receives buyer name, seller name, and quantity from client,
 * calculates total price, generates an ID, records date/time, and saves the transaction.
 */
exports.buyGold = (req, res) => {
    // Why: When the user submits the "Invest Now!" form, the frontend sends a POST request with the order details.
    
    // We extract the fields from 'req.body' (Request Body).
    // Express parses the JSON sent by the frontend, making it available as standard object properties.
    const { buyerName, sellerName, quantity } = req.body;

    // --- STEP 1: VALIDATION ---
    // In backend development, NEVER trust user input! We must validate everything.
    
    // Check if any required field is missing or empty
    if (!buyerName || !sellerName || quantity === undefined) {
        return res.status(400).json({ 
            error: "Bad Request: Please provide buyerName, sellerName, and quantity." 
        });
    }

    // Convert the quantity to a number (just in case the frontend sent it as a string)
    const numericQuantity = Number(quantity);

    // Check if the quantity is a valid positive number greater than 0
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({ 
            error: "Bad Request: Quantity must be a valid number greater than 0." 
        });
    }

    // --- STEP 2: AUTO-CALCULATION & ENHANCEMENT ---
    
    // Fetch the live price of gold from our simulated state
    const currentGoldPrice = goldState.currentPrice;

    // Calculate total amount (Price per unit * Quantity purchased)
    // We use .toFixed(2) to round to two decimal places, then wrap in Number() to convert it back to a number.
    const calculatedTotal = Number((currentGoldPrice * numericQuantity).toFixed(2));

    // Generate a unique Transaction ID starting with 'GD' followed by a random 4-digit number (e.g., "GD1023")
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Guarantees a 4-digit integer between 1000 and 9999
    const generatedTxId = `GD${randomNum}`;

    // Get the current calendar date in YYYY-MM-DD format
    // Date.toISOString() returns something like "2026-05-21T11:45:00.000Z". 
    // We split it by the letter "T" and grab the first part, which is the date "2026-05-21".
    const formattedDate = new Date().toISOString().split("T")[0];

    // Get the standard 12-hour formatted time (e.g., "10:45 PM") using our helper function
    const formattedTime = getFormattedTime();

    // --- STEP 3: CREATE TRANSACTION OBJECT ---
    // We assemble the data into the exact format requested by the project requirements.
    const newTransaction = {
        transactionId: generatedTxId,
        buyerName: buyerName.trim(),     // We use .trim() to clean up any accidental leading/trailing spaces
        sellerName: sellerName.trim(),
        quantity: numericQuantity,
        goldPrice: Number(currentGoldPrice.toFixed(2)),
        totalAmount: calculatedTotal,
        date: formattedDate,
        time: formattedTime
    };

    // --- STEP 4: SAVE TRANSACTION ---
    // We push (insert) the new transaction object to our in-memory array.
    transactions.push(newTransaction);

    // --- STEP 5: SEND SUCCESS RESPONSE ---
    // HTTP Status 201 means "Created". We send back the saved transaction as JSON
    // so the frontend can display a beautiful summary dialog.
    res.status(201).json(newTransaction);
};

/**
 * 4. GET /transactions
 * Returns a list of all successful gold purchases recorded in our server memory.
 */
exports.getTransactions = (req, res) => {
    // Why: The frontend or admin dashboard wants to display the purchase history log.
    // What: We simply respond with the complete array of transactions.
    
    // HTTP Status 200 means "OK". We send the transactions array as JSON.
    res.status(200).json(transactions);
};
