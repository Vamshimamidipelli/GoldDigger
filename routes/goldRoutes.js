// =========================================================================
// ROUTING LAYER: ROUTE DEFINITIONS (goldRoutes.js)
// =========================================================================
// As your application grows, writing all routes directly in server.js makes it messy.
// To keep things clean, Express provides "Routers".
// A Router is like a mini-app that only handles mapping URL paths to controllers.
//
// In this file, we define the endpoints (URLs) that our server supports,
// and we connect each endpoint to a specific controller function from 'goldController.js'.

// 1. Import Express
// We need Express to access the Router class.
const express = require("express");

// 2. Create Router Instance
// We initialize a new Router object which will hold all our route declarations.
const router = express.Router();

// 3. Import Controllers
// We import the controller functions we wrote in 'controllers/goldController.js'.
const goldController = require("../controllers/goldController");

/**
 * 4. Route Mapping
 * 
 * Each route is constructed like this:
 * router.<HTTP_METHOD>("<URL_PATH>", <CONTROLLER_FUNCTION>)
 * 
 * HTTP Methods:
 * - GET: Used to fetch data from the server.
 * - POST: Used to send new data to the server (e.g. submitting a form).
 */

// Route A: GET /gold-price
// When someone visits http://localhost:3000/gold-price with a GET request,
// we run the 'getGoldPrice' controller to send them the live price.
router.get("/gold-price", goldController.getGoldPrice);

// Route B: POST /buy-gold
// When the frontend submits a purchase via a POST request to http://localhost:3000/buy-gold,
// we execute the 'buyGold' controller which validates, calculates, saves, and confirms the trade.
router.post("/buy-gold", goldController.buyGold);

// Route C: GET /transactions
// When someone makes a GET request to http://localhost:3000/transactions,
// we run the 'getTransactions' controller to return all the stored transactions.
router.get("/transactions", goldController.getTransactions);

/**
 * 5. Export the Router
 * We export the router object so it can be imported and mounted by our main file: 'server.js'.
 */
module.exports = router;
