"use strict";
// Stock class to represent an individual stock
class Stock {
    constructor(symbol, _price) {
        this.symbol = symbol;
        this._price = _price;
    }
    // Getter for the stock price
    get price() {
        return this._price;
    }
    // Method to simulate a price change
    updatePrice(change) {
        this._price += change;
        console.log(`${this.symbol} new price: $${this._price.toFixed(2)}`);
    }
}
// Market class to manage multiple stocks and simulate market changes
class Market {
    constructor() {
        this.stocks = new Map();
    }
    // Add a new stock to the market
    addStock(stock) {
        this.stocks.set(stock.symbol, stock);
    }
    // Simulate a market update
    updatePrices() {
        this.stocks.forEach(stock => {
            const priceChange = Math.random() * 10 - 5; // Random change between -5 and 5
            stock.updatePrice(priceChange);
        });
    }
}
// TransactionManager class to handle buy and sell orders
class TransactionManager {
    // Simulate buying a stock
    buy(stock, quantity) {
        console.log(`Bought ${quantity} shares of ${stock.symbol} at $${stock.price.toFixed(2)} each.`);
    }
    // Simulate selling a stock
    sell(stock, quantity) {
        console.log(`Sold ${quantity} shares of ${stock.symbol} at $${stock.price.toFixed(2)} each.`);
    }
}
// Example usage
const mainMarket = new Market();
const googleStock = new Stock('GOOGL', 1000);
const appleStock = new Stock('AAPL', 200);
mainMarket.addStock(googleStock);
mainMarket.addStock(appleStock);
// Simulating market dynamics
mainMarket.updatePrices();
const transactionManager = new TransactionManager();
transactionManager.buy(googleStock, 10);
transactionManager.sell(appleStock, 5);
// Schedule regular market updates
setInterval(() => {
    console.log('Updating market prices...');
    mainMarket.updatePrices();
}, 5000); // Update every 5 seconds
//# sourceMappingURL=index.js.map
