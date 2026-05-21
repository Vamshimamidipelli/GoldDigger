// =========================================================================
// MAIN ENTRYPOINT: EXPRESS SERVER & LIVE SIMULATION (server.js)
// =========================================================================
// Welcome to GoldDigger! This is the main file that boots up your server.
// Think of this file as the "manager" of our entire application. It coordinates
// the express server, sets up configurations, starts background tasks, and starts listening for connections.

// ---------------------------------------------------------
// 1. IMPORT DEPENDENCIES
// ---------------------------------------------------------
// In standard Node.js, we use 'require()' to import modules and packages.

// Express is our web framework. It helps us handle HTTP requests and build APIs easily.
const express = require("express");

// We import our goldState object from our data store file.
// This allows server.js to update the "live" gold prices directly in memory.
const { goldState } = require("./data/goldData");

// We import the router containing all our API routes (GET /gold-price, etc.).
const goldRoutes = require("./routes/goldRoutes");

// ---------------------------------------------------------
// 2. INITIALIZE EXPRESS APPLICATION
// ---------------------------------------------------------
// We call express() to create our Express app instance.
// This 'app' object has all the tools to configure middleware, define paths, and start the server.
const app = express();

// ---------------------------------------------------------
// 3. CONFIGURE MIDDLEWARE
// ---------------------------------------------------------
// Middleware functions are code blocks that run in the middle of a request-response cycle.
// They process incoming requests BEFORE they reach your specific routes.

// A. JSON Body Parser Middleware
// Why: When a client sends a POST request with JSON data in the body (like buying gold),
// standard Express doesn't know how to read it. This middleware automatically parses
// that JSON and puts it into 'req.body' for us.
app.use(express.json());

// B. Static Files Middleware
// Why: To host our frontend application seamlessly!
// This middleware tells Express to automatically serve any files located in the 'public/' directory.
// When a browser visits 'http://localhost:3000', Express will automatically look for and serve
// the 'public/index.html' file, along with its stylesheet (index.css) and assets (gold.png).
app.use(express.static("public"));

// ---------------------------------------------------------
// 4. REGISTER ROUTER MIDDLEWARE
// ---------------------------------------------------------
// We mount our routes. By passing "/" as the path, all routes defined inside
// 'goldRoutes' will be available directly on the root of our server (e.g. GET /gold-price, POST /buy-gold).
app.use("/", goldRoutes);

// ---------------------------------------------------------
// 5. LIVE GOLD PRICE SIMULATION (setInterval)
// ---------------------------------------------------------
// How does a live price chart work? In our server, we simulate fluctuation using a timer!
//
// 'setInterval(callback, delay)' is a built-in JavaScript function.
// It executes a callback function repeatedly, waiting for the specified delay (in milliseconds).
// Here, we run it every 2500ms (2.5 seconds) to create "live" updates.
setInterval(() => {
    // A. Keep track of the current price before we change it, so we can calculate the trend.
    const oldPrice = goldState.currentPrice;

    // B. Calculate a small random price fluctuation.
    // - Math.random() returns a decimal between 0 and 1.
    // - (Math.random() - 0.5) shifts this range to be between -0.5 and +0.5.
    // - Multiplying by 1.6 gives a realistic change between -0.80 and +0.80 GBP per tick.
    const priceChange = (Math.random() - 0.5) * 1.6;

    // C. Add the change to the old price to get the new price.
    let newPrice = oldPrice + priceChange;

    // D. Price safety limits (floor and ceiling bounds)
    // We don't want our gold price to plummet below 70 GBP (floor) or skyrocket unreasonably (ceiling).
    const MIN_PRICE = 70.00;
    const MAX_PRICE = 120.00;

    if (newPrice < MIN_PRICE) {
        // If the price drops too low, nudge it back up
        newPrice = MIN_PRICE + Math.random() * 0.5;
    } else if (newPrice > MAX_PRICE) {
        // If the price climbs too high, nudge it back down
        newPrice = MAX_PRICE - Math.random() * 0.5;
    }

    // E. Determine the price trend ('up' or 'down')
    let currentTrend = "stable";
    if (newPrice > oldPrice) {
        currentTrend = "up";
    } else if (newPrice < oldPrice) {
        currentTrend = "down";
    }

    // F. Save the new values directly into the shared state object.
    goldState.previousPrice = oldPrice;
    goldState.currentPrice = Number(newPrice.toFixed(2)); // Round to 2 decimal places (standard for money)
    goldState.trend = currentTrend;
    goldState.lastUpdated = new Date().toISOString(); // Record exactly when this update happened

    // G. Print a friendly update in the server terminal so we can see the simulation running!
    console.log(
        `[LIVE PRICE TICK] Gold Price updated: £${goldState.currentPrice.toFixed(2)} / Oz | Trend: ${currentTrend.toUpperCase()}`
    );
}, 2500); // 2500ms = 2.5 seconds

// ---------------------------------------------------------
// 6. START THE WEB SERVER
// ---------------------------------------------------------
// We choose a Port number where our server will listen for incoming traffic.
// Standard local development port for Node.js is 3000.
// We also use 'process.env.PORT' which is a standard way to support cloud deployments.
const PORT = process.env.PORT || 3000;

// app.listen() starts the server. It takes the port number and a callback function
// that runs once the server has successfully booted.
app.listen(PORT, () => {
    console.log("=================================================");
    console.log(`   GoldDigger Backend Server is up and running!`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Serving frontend from 'public/' folder`);
    console.log(`   Press Ctrl + C to stop the server`);
    console.log("=================================================");
});
