# 🟡 GoldDigger Backend - Developer Guide

Welcome to **GoldDigger**, a beginner-friendly backend project designed to teach you the fundamentals of **Node.js**, **Express.js**, and building standard **REST APIs**! 

GoldDigger simulates a live gold trading platform. It updates the live price of gold in the background every few seconds and exposes three key API endpoints allowing buyers to fetch the live price, submit buy orders, and check past transaction logs.

---

## 📂 Project Structure Explained

Here is the folder structure we designed. Keeping files organized by "concerns" (data vs. routing vs. logic) is a standard industry best practice!

* 📁 **`data/`**
  * `goldData.js`: Serves as our temporary in-memory database. It stores the live gold price and the list of successful transactions.
* 📁 **`controllers/`**
  * `goldController.js`: The "brain" of our routes. It handles incoming requests, runs validations, performs price calculations, generates unique transaction IDs, formats dates, and sends JSON responses back to the user.
* 📁 **`routes/`**
  * `goldRoutes.js`: Maps our URL paths (like `/gold-price`) to their specific controller functions.
* 📄 **`server.js`**: The main entrypoint. It configures our Express application, serves our frontend files, runs the background gold price simulation loop, and boots up the server.
* 📁 **`public/`**: Contains the pre-built frontend files (HTML, CSS, images). The backend serves these files statically at the root URL.

---

## 🛠️ Step 1: Installing Dependencies

Before you can run the server, you need to make sure the required packages are downloaded. We use the **npm** package manager (which is installed automatically when you download Node.js).

1. Open your terminal or command prompt.
2. Navigate to this project folder.
3. Run the following command:
   ```bash
   npm install
   ```
   * **What does this do?** It reads the `package.json` file we initialized and downloads the `express` web framework into a folder called `node_modules`.

---

## 🚀 Step 2: Running the Server

Once installation is complete, you can start your local backend server!

In your terminal, run:
```bash
npm start
```
*(Alternatively, you can run `node server.js` directly).*

You should see an output in your console that looks like this:
```text
=================================================
   GoldDigger Backend Server is up and running!
   URL: http://localhost:3000
   Serving frontend from 'public/' folder
   Press Ctrl + C to stop the server
=================================================
[LIVE PRICE TICK] Gold Price updated: £75.42 / Oz | Trend: UP
[LIVE PRICE TICK] Gold Price updated: £76.10 / Oz | Trend: UP
[LIVE PRICE TICK] Gold Price updated: £75.80 / Oz | Trend: DOWN
```
* Every **2.5 seconds**, the background `setInterval()` timer updates the gold price with realistic fluctuations and logs the changes directly to your console!
* To stop the server at any time, click on your terminal and press `Ctrl + C`.

---

## 📬 Step 3: Testing Your APIs in Postman

Postman is a fantastic tool used by developers to test backend APIs before writing frontend code. Here is how you can test each of the three endpoints:

### A. Fetch the Live Gold Price
* **Method (Verb)**: `GET`
* **URL**: `http://localhost:3000/gold-price`
* **Headers**: *None required*
* **How to test**: Set the method to `GET`, paste the URL, and click **Send**.
* **Example JSON Response**:
  ```json
  {
      "currentPrice": 75.80,
      "trend": "down",
      "timestamp": "2026-05-21T11:45:30.000Z"
  }
  ```

---

### B. Submit a Gold Purchase Order
* **Method (Verb)**: `POST`
* **URL**: `http://localhost:3000/buy-gold`
* **Headers**:
  * Set `Content-Type` to `application/json`.
* **Body**:
  * Select **raw** and choose **JSON** format. Paste this JSON payload:
  ```json
  {
      "buyerName": "Vamshi",
      "sellerName": "Gold Market",
      "quantity": 5
  }
  ```
* **How to test**: Set the method to `POST`, paste the URL, go to the **Body** tab, choose **raw** -> **JSON**, paste the text above, and click **Send**.
* **What happens behind the scenes?** 
  The server takes the `quantity` (5), multiplies it by the **live** gold price (e.g. `75.80`), automatically creates a unique transaction ID (`GD1023`), timestamps it with the date and standard 12-hour time, and records it in memory.
* **Example JSON Response** (HTTP Status `201 Created`):
  ```json
  {
      "transactionId": "GD8651",
      "buyerName": "Vamshi",
      "sellerName": "Gold Market",
      "quantity": 5,
      "goldPrice": 75.80,
      "totalAmount": 379.00,
      "date": "2026-05-21",
      "time": "10:45 PM"
  }
  ```

---

### C. Retrieve All Stored Transactions
* **Method (Verb)**: `GET`
* **URL**: `http://localhost:3000/transactions`
* **How to test**: Set the method to `GET`, paste the URL, and click **Send**.
* **Example JSON Response**:
  ```json
  [
      {
          "transactionId": "GD8651",
          "buyerName": "Vamshi",
          "sellerName": "Gold Market",
          "quantity": 5,
          "goldPrice": 75.80,
          "totalAmount": 379.00,
          "date": "2026-05-21",
          "time": "10:45 PM"
      }
  ]
  ```

---

## 🔌 Step 4: Connecting the Frontend to the Backend

If you want to understand how a frontend connects to this backend, web applications use the browser's built-in **`fetch()`** API to make HTTP network calls.

### 1. Polling for Live Prices in Frontend
To display live price changes on the page in real-time, the frontend uses `setInterval` to request the price endpoint repeatedly:
```javascript
// Function that makes the network call
async function updateLivePrice() {
    try {
        // 1. Fetch the data from our backend GET endpoint
        const response = await fetch("/gold-price");
        
        // 2. Parse the JSON response
        const data = await response.json();
        
        // 3. Update the HTML document elements
        const priceElement = document.getElementById("price-display");
        priceElement.textContent = data.currentPrice.toFixed(2);
        
        // Change colors depending on trend!
        if (data.trend === "up") {
            priceElement.className = "price price-up";
        } else if (data.trend === "down") {
            priceElement.className = "price price-down";
        }
    } catch (error) {
        console.error("Error fetching live price:", error);
    }
}

// Automatically fetch the price every 2.5 seconds to match the server!
setInterval(updateLivePrice, 2500);
```

### 2. Submitting a Purchase from Frontend Form
When the buyer inputs an investment amount and clicks "Invest Now!", the frontend calculates the ounces they want to buy and submits a POST request:
```javascript
async function purchaseGold(buyer, quantity) {
    try {
        // 1. Trigger POST request with headers and body stringified
        const response = await fetch("/buy-gold", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                buyerName: buyer,
                sellerName: "Gold Market",
                quantity: quantity
            })
        });

        // 2. Parse the newly created transaction returned by the server
        const transaction = await response.json();

        // 3. Open a modal/dialog with the transaction summary
        const dialog = document.querySelector("dialog");
        const summaryText = document.getElementById("investment-summary");
        
        summaryText.innerHTML = `Success! Transaction ID: <strong>${transaction.transactionId}</strong>.<br>
                                 You bought ${transaction.quantity} Oz at £${transaction.goldPrice}/Oz.<br>
                                 Total spent: <strong>£${transaction.totalAmount}</strong>.`;
        
        dialog.showModal(); // Pop open the confirmation popup
    } catch (error) {
        console.error("Purchase failed:", error);
    }
}
```

---

## 💡 Key Takeaways for Beginners

1. **`express.json()`**: Crucial middleware. Without it, `req.body` will always be `undefined`.
2. **`express.static('public')`**: Tells Express to serve HTML, CSS, and images when a browser connects. This removes the need to write separate frontend serving routes!
3. **In-Memory Arrays**: Great for quick development and prototypes, but keep in mind they reset every time the server code changes or restarts!
4. **Validation**: Always check if inputs exist and match the correct type (e.g. check if quantity is a positive number) before saving to protect your server.
