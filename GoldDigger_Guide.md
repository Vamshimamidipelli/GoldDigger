# 🟡 GoldDigger - Backend & JavaScript Reference Guide

Welcome to the architectural specification and step-by-step guide for **GoldDigger**, a simulated live gold trading backend built using **Node.js**, **Express.js**, and standard JavaScript!

This guide walks you through the entire planning, system design, and coding process, focusing exclusively on:
1. **Backend Routing and Server Setup** (Express middleware, ports, mounting endpoints).
2. **Business Logic Layer** (Input validations, total cost calculations, custom formatting, and ID generation).
3. **In-Memory Data Structures** (Variables acting as temporary database storage).
4. **Live Price Simulation** (Dynamic background timers and math formulas).
5. **Client-Side JavaScript** (How browser-side JS polls prices and posts trade actions using the `fetch()` API).

---

## 📐 Part 1: System Design & Architectural Plan

To build professional software, we separate different concerns into specialized directories. This decouples our data from our business logic and URL routing maps, matching the industry-standard **Model-View-Controller (MVC)** design pattern.

```mermaid
graph TD
    Client[Browser fetch() / Postman] -->|HTTP Request| Server[server.js]
    Server -->|Express Router| Routes[routes/goldRoutes.js]
    Routes -->|Controllers| Controllers[controllers/goldController.js]
    Controllers -->|Read/Write State| DataStore[data/goldData.js]
    Server -->|Static Files| ClientJS[public/index.js]
```

### Decoupled Folder Structure
We will organize our code inside the following files:
* `package.json` — Tracks metadata and external libraries (`express`).
* `server.js` — The boot manager, mounts middleware, and runs the background timer.
* `data/goldData.js` — The virtual data database layer.
* `controllers/goldController.js` — The functional backend business rules.
* `routes/goldRoutes.js` — Maps incoming request paths and HTTP verbs to the controllers.
* `public/index.js` — The browser JavaScript client that communicates with our backend endpoints.

---

## 💾 Part 2: State and Live Price Simulation Plan

### 1. In-Memory Registry
Because we are building a beginner-friendly project, we store data directly in the server's **RAM** (active memory) rather than connecting an external database like MongoDB.
* We initialize an empty JavaScript array `[]` to store transaction records.
* We store the live gold price in a central `goldState` object so it can be updated by the simulation timer and read by the routes.

### 2. Fluctuating Live Prices via `setInterval`
We create a dynamic simulator that ticks every **2.5 seconds** to update the gold price:
* **Starting Price**: Initialized at `75.00` GBP.
* **Fluctuation Range**: Small realistic increments/decrements. We calculate a change value between `-0.80` and `+0.80` using `(Math.random() - 0.5) * 1.6`.
* **Floor/Ceiling Bounds**: To prevent the price from dropping into negative figures or skyrocketing excessively, we set a minimum bound of `70.00` and a maximum of `120.00`.
* **Trend Tracker**: If the new price is greater than the previous tick, we record the trend as `"up"`. If it decreases, we record `"down"`.

---

## 🛠️ Part 3: Step-by-Step Implementation Guide

Follow these sequential steps to build the application from scratch:

### 📥 Step 1: Initialize the Project and Dependencies
Create an empty folder, open your terminal inside it, and run:
```bash
npm init -y
npm install express
```
* **`npm init -y`**: Generates a standard `package.json` file to manage configurations.
* **`npm install express`**: Downloads the Express framework which manages HTTP routes.

---

### 🗃️ Step 2: Build the Data Store
Create a directory named `data` and create `data/goldData.js`. This file holds our state variables and exports them so other modules can read/write to them.

```javascript
// data/goldData.js

// 1. Array holding all purchase transaction history
const transactions = [];

// 2. Central state holding the current live gold price and trend metrics
const goldState = {
    currentPrice: 75.00,
    previousPrice: 75.00,
    trend: "stable",
    lastUpdated: new Date().toISOString()
};

// Export variables so other files in the project can access and update them
module.exports = {
    transactions,
    goldState
};
```

---

### 🧠 Step 3: Implement Business Logic Controllers
Create a directory named `controllers` and create `controllers/goldController.js`. It contains all our core functions for checking validation, executing transaction calculations, and formatting outputs.

```javascript
// controllers/goldController.js

const { transactions, goldState } = require("../data/goldData");

// Helper: Converts current clock time into standard 12-hour AM/PM string (e.g. "10:45 PM")
function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Adjust midnight '0' to be '12'
    const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    
    return `${hours}:${formattedMinutes} ${ampm}`;
}

// Controller A: GET /gold-price
// Responds with the live gold state
exports.getGoldPrice = (req, res) => {
    res.status(200).json({
        currentPrice: Number(goldState.currentPrice.toFixed(2)),
        trend: goldState.trend,
        timestamp: goldState.lastUpdated
    });
};

// Controller B: POST /buy-gold
// Processes a new trade purchase, validating inputs and outputting calculated metadata
exports.buyGold = (req, res) => {
    const { buyerName, sellerName, quantity } = req.body;

    // 1. Server-side inputs validation: Reject negative values, zero, or missing fields
    if (!buyerName || !sellerName || quantity === undefined) {
        return res.status(400).json({ 
            error: "Bad Request: Missing required trade parameters." 
        });
    }

    const numericQuantity = Number(quantity);
    if (isNaN(numericQuantity) || numericQuantity <= 0) {
        return res.status(400).json({ 
            error: "Bad Request: Purchase quantity must be a positive number greater than 0." 
        });
    }

    // 2. Perform Calculations
    const currentGoldPrice = goldState.currentPrice;
    const calculatedTotal = Number((currentGoldPrice * numericQuantity).toFixed(2));

    // 3. Generate transaction metadata
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit unique integer
    const generatedTxId = `GD${randomNum}`;
    const formattedDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const formattedTime = getFormattedTime(); // e.g. "12:30 PM"

    // 4. Assemble trade record
    const newTransaction = {
        transactionId: generatedTxId,
        buyerName: buyerName.trim(),
        sellerName: sellerName.trim(),
        quantity: numericQuantity,
        goldPrice: Number(currentGoldPrice.toFixed(2)),
        totalAmount: calculatedTotal,
        date: formattedDate,
        time: formattedTime
    };

    // 5. Append to database array and return confirmation with HTTP Status 201 (Created)
    transactions.push(newTransaction);
    res.status(201).json(newTransaction);
};

// Controller C: GET /transactions
// Responds with full list of logged transactions
exports.getTransactions = (req, res) => {
    res.status(200).json(transactions);
};
```

---

### 🗺️ Step 4: Map Endpoints to Routers
Create a directory named `routes` and create `routes/goldRoutes.js`. This matches paths to their HTTP handlers.

```javascript
// routes/goldRoutes.js

const express = require("express");
const router = express.Router();
const goldController = require("../controllers/goldController");

// Connect route definitions to business controller operations
router.get("/gold-price", goldController.getGoldPrice);
router.post("/buy-gold", goldController.buyGold);
router.get("/transactions", goldController.getTransactions);

module.exports = router;
```

---

### ⚡ Step 5: Construct the Boot Server & Price simulation Loop
Create the main core runner `server.js` in the root folder. It pulls all components together, parses incoming data streams, serves static resources, and boots the live simulator timer.

```javascript
// server.js

const express = require("express");
const { goldState } = require("./data/goldData");
const goldRoutes = require("./routes/goldRoutes");

const app = express();

// A. Express Middleware
app.use(express.json()); // Parses incoming json payloads into req.body
app.use(express.static("public")); // Auto-serves files inside the public folder

// B. Load Router Mapping
app.use("/", goldRoutes);

// C. Background Price Ticker Simulation
setInterval(() => {
    const oldPrice = goldState.currentPrice;
    
    // Generates a random change between -0.80 and +0.80 GBP
    const priceChange = (Math.random() - 0.5) * 1.6;
    let newPrice = oldPrice + priceChange;

    // Safety Floor/Ceiling guards
    const MIN_PRICE = 70.00;
    const MAX_PRICE = 120.00;
    if (newPrice < MIN_PRICE) {
        newPrice = MIN_PRICE + Math.random() * 0.5;
    } else if (newPrice > MAX_PRICE) {
        newPrice = MAX_PRICE - Math.random() * 0.5;
    }

    // Dynamic Trend Check
    let currentTrend = "stable";
    if (newPrice > oldPrice) {
        currentTrend = "up";
    } else if (newPrice < oldPrice) {
        currentTrend = "down";
    }

    // Save outputs
    goldState.previousPrice = oldPrice;
    goldState.currentPrice = Number(newPrice.toFixed(2));
    goldState.trend = currentTrend;
    goldState.lastUpdated = new Date().toISOString();

    // Log update ticks directly to terminal console
    console.log(
        `[LIVE PRICE TICK] Gold Price updated: £${goldState.currentPrice.toFixed(2)} / Oz | Trend: ${currentTrend.toUpperCase()}`
    );
}, 2500); // Triggers every 2.5 seconds (2500ms)

// D. Boot Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("=================================================");
    console.log(`   GoldDigger Backend Server is up and running!`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log("=================================================");
});
```

---

### 🌐 Step 6: Connect Client-Side JavaScript API Calls
Create `public/index.js` which manages sending request payloads and handling local data changes directly within the DOM structure.

```javascript
// public/index.js

const priceDisplay = document.getElementById("price-display");
const connectionStatus = document.getElementById("connection-status");
const investmentInput = document.getElementById("investment-amount");
const form = document.querySelector("form");
const dialog = document.querySelector("dialog");
const investmentSummary = document.getElementById("investment-summary");
const dialogCloseBtn = dialog.querySelector("button");

let latestGoldPrice = 0;

// A. Poll GET /gold-price and render updates on screen
async function fetchLivePrice() {
    try {
        const response = await fetch("/gold-price");
        if (!response.ok) {
            connectionStatus.textContent = "Disconnected 🔴";
            return;
        }

        const data = await response.json();
        latestGoldPrice = data.currentPrice;

        // Render current gold price values
        priceDisplay.textContent = data.currentPrice.toFixed(2);
        connectionStatus.textContent = "Live Price 🟢";
    } catch (error) {
        connectionStatus.textContent = "Disconnected 🔴";
        console.error("Failed to connect to backend api:", error);
    }
}

// Call on startup, and then run polling on a 2.5s loop
fetchLivePrice();
setInterval(fetchLivePrice, 2500);

// B. Intercept trades, run client checks (reject negative inputs), and POST buy order
form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Stop standard page reload

    const investmentAmount = Number(investmentInput.value);

    // Front-end security check: validate against negative/zero value inputs
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
        alert("Please enter a valid amount greater than £0.");
        return;
    }

    if (latestGoldPrice <= 0) {
        alert("Error: Price feeds not ready. Please try again.");
        return;
    }

    // Calculate how many ounces this amount purchases
    const quantity = Number((investmentAmount / latestGoldPrice).toFixed(4));

    try {
        // Dispatch POST call containing JSON load to backend
        const response = await fetch("/buy-gold", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                buyerName: "Investor",
                sellerName: "Gold Market",
                quantity: quantity
            })
        });

        const transaction = await response.json();
        if (!response.ok) {
            alert(transaction.error || "Trade failed.");
            return;
        }

        // Show Modal Popup summary
        investmentSummary.innerHTML =
            `You just bought <strong>${transaction.quantity} ounces (ozt)</strong> ` +
            `for <strong>£${transaction.totalAmount.toFixed(2)}</strong>.<br><br>` +
            `Transaction ID: <strong>${transaction.transactionId}</strong>`;

        dialog.showModal();
        investmentInput.value = ""; // Clear input field

    } catch (error) {
        alert("Trade request could not be sent. Check backend server connection.");
    }
});

// Close dialog
dialogCloseBtn.addEventListener("click", () => dialog.close());
```

---

## 🧪 Part 4: How to Run and Test

### 1. Run the Web Server
Launch your terminal inside the project directory and execute:
```bash
npm start
```
You will immediately see the live prices generating dynamic trends and printing logs every 2.5 seconds to your console screen!

### 2. Request / Response Contracts

#### A. GET `/gold-price`
* **Request Verb**: `GET`
* **Target Address**: `http://localhost:3000/gold-price`
* **Returned JSON Structure**:
  ```json
  {
      "currentPrice": 75.06,
      "trend": "down",
      "timestamp": "2026-05-21T11:33:33.856Z"
  }
  ```

#### B. POST `/buy-gold`
* **Request Verb**: `POST`
* **Target Address**: `http://localhost:3000/buy-gold`
* **Content Headers**: `Content-Type: application/json`
* **JSON Body Payload**:
  ```json
  {
      "buyerName": "Vamshi",
      "sellerName": "Gold Market",
      "quantity": 5
  }
  ```
* **Returned JSON Response (HTTP Status 201)**:
  ```json
  {
      "transactionId": "GD7154",
      "buyerName": "Vamshi",
      "sellerName": "Gold Market",
      "quantity": 5,
      "goldPrice": 75.06,
      "totalAmount": 375.3,
      "date": "2026-05-21",
      "time": "12:33 PM"
  }
  ```

#### C. GET `/transactions`
* **Request Verb**: `GET`
* **Target Address**: `http://localhost:3000/transactions`
* **Returned JSON Array Structure**:
  ```json
  [
      {
          "transactionId": "GD7154",
          "buyerName": "Vamshi",
          "sellerName": "Gold Market",
          "quantity": 5,
          "goldPrice": 75.06,
          "totalAmount": 375.3,
          "date": "2026-05-21",
          "time": "12:33 PM"
      }
  ]
  ```

---

## 💡 Important Rules for Local Testing
To test and interact with this project successfully, you **MUST** run the server and access the page by typing **`http://localhost:3000`** in your browser's address bar. 

If you attempt to load the HTML layout by double-clicking it directly from your file manager (which opens it as a `file://` URL path), browser security engines will block ES modules and `fetch()` REST API connections from running, resulting in static labels (`----.--`) and non-functional buttons.
