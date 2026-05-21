// =========================================================================
// FRONTEND JAVASCRIPT: Connects the UI to our backend APIs (index.js)
// =========================================================================
// This file is loaded by index.html as a module script.
// It does three things:
//   1. Polls GET /gold-price every 2.5 seconds to display the live price
//   2. Handles the "Invest Now!" button click to POST /buy-gold
//   3. Validates that the user cannot enter negative or zero amounts

// ---------------------------------------------------------
// 1. GRAB REFERENCES TO HTML ELEMENTS
// ---------------------------------------------------------
// We use document.getElementById() to get a reference to elements we need to update or listen to.

const priceDisplay = document.getElementById("price-display");           // The <span> that shows the price number
const connectionStatus = document.getElementById("connection-status");   // The "Live Price 🟢" status text
const investmentInput = document.getElementById("investment-amount");    // The £ amount input field
const investBtn = document.getElementById("invest-btn");                 // The "Invest Now!" button
const dialog = document.querySelector("dialog");                         // The summary popup dialog
const investmentSummary = document.getElementById("investment-summary"); // The <p> inside the dialog
const dialogCloseBtn = dialog.querySelector("button");                   // The "OK" button inside the dialog

// We store the latest gold price fetched from the server so we can use it when the user clicks "Invest Now!"
let latestGoldPrice = 0;

// ---------------------------------------------------------
// 2. POLL THE LIVE GOLD PRICE EVERY 2.5 SECONDS
// ---------------------------------------------------------
// We create a function that fetches the current price from our backend
// and updates the display. Then we call it on a timer.

async function fetchLivePrice() {
    try {
        // fetch() makes an HTTP GET request to our backend endpoint
        const response = await fetch("/gold-price");

        // If the server returned an error status, mark connection as offline
        if (!response.ok) {
            connectionStatus.textContent = "Disconnected 🔴";
            return;
        }

        // Parse the JSON body from the response
        const data = await response.json();

        // Save the latest price so the invest button can use it
        latestGoldPrice = data.currentPrice;

        // Update the price number on screen (e.g. "75.42")
        priceDisplay.textContent = data.currentPrice.toFixed(2);

        // Show a green connection indicator
        connectionStatus.textContent = "Live Price 🟢";

    } catch (error) {
        // If the fetch fails entirely (server down, network issue), show red status
        connectionStatus.textContent = "Disconnected 🔴";
        console.error("Failed to fetch gold price:", error);
    }
}

// Call it once immediately so the price shows right away (no 2.5s wait on page load)
fetchLivePrice();

// Then repeat every 2500ms (2.5 seconds) to keep the display in sync with the server simulation
setInterval(fetchLivePrice, 2500);

// ---------------------------------------------------------
// 3. HANDLE THE "INVEST NOW!" BUTTON
// ---------------------------------------------------------
// When the user fills in an amount and clicks the button, we:
//   a. Validate the input (no negatives, no zero, no empty)
//   b. Calculate how many ounces they can buy at the current price
//   c. Send a POST request to /buy-gold
//   d. Show the summary dialog with the transaction details

// We listen on the <form> submit event instead of just the button click.
// This way pressing Enter in the input field also works.
const form = document.querySelector("form");

form.addEventListener("submit", async function (event) {
    // Prevent the browser's default form submission (which would reload the page)
    event.preventDefault();

    // --- VALIDATION ---
    const investmentAmount = Number(investmentInput.value);

    // Block negative numbers and zero
    if (!investmentAmount || investmentAmount <= 0) {
        alert("Please enter a valid amount greater than £0.");
        return;
    }

    // Make sure we have a live price to calculate with
    if (latestGoldPrice <= 0) {
        alert("Waiting for live price... please try again in a moment.");
        return;
    }

    // --- CALCULATE QUANTITY ---
    // The user enters a £ amount. We divide by the current price per ounce
    // to find out how many ounces they are buying.
    const quantity = Number((investmentAmount / latestGoldPrice).toFixed(4));

    // --- SEND POST REQUEST TO BACKEND ---
    try {
        const response = await fetch("/buy-gold", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"   // Tell the server we are sending JSON
            },
            body: JSON.stringify({
                buyerName: "Investor",                // Default buyer name
                sellerName: "Gold Market",            // Default seller name
                quantity: quantity                     // Calculated ounces
            })
        });

        // Parse the transaction object returned by the server
        const transaction = await response.json();

        // If the server returned an error, show it
        if (!response.ok) {
            alert(transaction.error || "Something went wrong. Please try again.");
            return;
        }

        // --- SHOW SUCCESS DIALOG ---
        investmentSummary.innerHTML =
            `You just bought <strong>${transaction.quantity} ounces (ozt)</strong> ` +
            `for <strong>£${transaction.totalAmount.toFixed(2)}</strong>.<br><br>` +
            `Transaction ID: <strong>${transaction.transactionId}</strong><br>` +
            `You will receive documentation shortly.`;

        dialog.showModal();    // Open the popup

        // Clear the input field for the next purchase
        investmentInput.value = "";

    } catch (error) {
        alert("Could not complete your purchase. Is the server running?");
        console.error("Purchase error:", error);
    }
});

// ---------------------------------------------------------
// 4. CLOSE THE DIALOG WHEN "OK" IS CLICKED
// ---------------------------------------------------------
dialogCloseBtn.addEventListener("click", function () {
    dialog.close();
});
