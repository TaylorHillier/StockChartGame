"use strict";
class Stock {
    constructor(symbol, _price) {
        this.symbol = symbol;
        this._price = _price;
    }
    get price() {
        return this._price;
    }
    set price(value) {
        if (value < 0)
            throw new Error("Price cannot be negative.");
        this._price = value;
    }
    updatePrice(change) {
        this.price = this._price + change; // This now uses the setter
    }
}
var Periodicity;
(function (Periodicity) {
    Periodicity["oneminute"] = "1 minute";
    Periodicity["fiveminute"] = "5 minute";
    Periodicity["thirtyminute"] = "30 minute";
    Periodicity["onehour"] = "1 hour";
})(Periodicity || (Periodicity = {}));
class ChartProperties {
    // Constructor to initialize the properties
    constructor(barsToLoad, periodicity, scale) {
        this.barsToLoad = barsToLoad;
        this.periodicity = periodicity;
        this.scale = scale;
    }
}
class Candlestick {
    constructor(open, timestamp) {
        this.open = open;
        this.high = open;
        this.low = open;
        this.close = open;
        this.volume = 0;
        this.timestamp = timestamp;
    }
    update(priceChange, tradeVolume) {
        const newPrice = this.close + priceChange;
        this.close = newPrice;
        this.high = Math.max(this.high, newPrice);
        this.low = Math.min(this.low, newPrice);
        this.volume += tradeVolume;
        console.log(`Updated Candlestick - Timestamp: ${new Date(this.timestamp).toISOString()}, Open: ${this.open}, High: ${this.high}, Low: ${this.low}, Close: ${this.close}, Volume: ${this.volume}`);
    }
    isUpCandle() {
        return this.close > this.open;
    }
    getColor() {
        return this.isUpCandle() ? 'green' : 'red';
    }
}
class Trade {
    constructor(tradeVolume, tradeType, tradeStrength) {
        this.tradeVolume = tradeVolume;
        this.tradeType = tradeType;
        this.tradeStrength = tradeStrength;
    }
}
function simulateTrades(stock, currentCandle, chartProps, onComplete) {
    let intervalId = setInterval(() => {
        // Randomize trade volume and strength
        const tradeVolume = Math.floor(Math.random() * 1000 + 100);
        const priceChange = Math.random() * 1 - 0.5; // Strength between -2.5 and +2.5
        const tradeType = Math.random() > 0.5; // Randomly true (buy) or false (sell)
        stock.updatePrice(priceChange); // Update stock price based on trade
        currentCandle.update(priceChange, tradeVolume); // Update only the current candle
        console.log(`Trade executed: ${tradeType ? 'Buy' : 'Sell'} - Volume: ${tradeVolume}, Price Change: ${priceChange}`);
        // Update the visualization of the candle
        drawCandlesticks([...candlesticks, currentCandle]); // Render all candles plus the current updating candle
    }, 1000); // Simulate a trade every second
    // Stop trading and finalize the current candle after the period ends
    setTimeout(() => {
        clearInterval(intervalId);
        onComplete(); // This will push the current candle to the array and draw
    }, getPeriodMilliseconds(chartProps.periodicity));
}
function simulateMarket(chartProps, stock) {
    let now = new Date();
    let endMS = now.getTime();
    let startMS = endMS - getPeriodMilliseconds(chartProps.periodicity) * chartProps.barsToLoad;
    let candlesticks = [];
    let lastClose = Math.random() * 100 + 100; // Initial random close price for the first candle
    for (let i = startMS; i < endMS; i += getPeriodMilliseconds(chartProps.periodicity)) {
        let open = lastClose; // Set open to last candle's close
        let close = open + (Math.random() * 5 - 2); // Random change between -10 and +10
        let high = Math.max(open, close) + Math.random() * 2; // High is above the max of open/close
        let low = Math.min(open, close) - Math.random() * 2; // Low is below the min of open/close
        let volume = Math.floor(Math.random() * 1000 + 100); // Random volume from 100 to 1100
        let candlestick = new Candlestick(open, i);
        candlestick.high = high;
        candlestick.low = low;
        candlestick.close = close;
        candlestick.volume = volume;
        candlesticks.push(candlestick);
        // Update lastClose for the next candle
        lastClose = close;
    }
    stock.price = lastClose; // Update the stock price to the last close
    return candlesticks;
}
function getPeriodMilliseconds(periodicity) {
    switch (periodicity) {
        case Periodicity.oneminute:
            return 60000;
        case Periodicity.fiveminute:
            return 300000;
        case Periodicity.thirtyminute:
            return 1800000;
        case Periodicity.onehour:
            return 3600000;
        default:
            throw new Error("Unsupported periodicity");
    }
}
function drawCandlesticks(candlesticks) {
    const canvas = document.getElementById('stockChart');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Unable to get 2D context from canvas');
        return;
    }
    const width = canvas.width;
    const height = canvas.height;
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    // Define margins for the axes
    const margin = { top: 50, right: 20, bottom: 50, left: 50 };
    const drawableHeight = height - margin.top - margin.bottom;
    const drawableWidth = width - margin.left - margin.right;
    // Determine min and max prices
    const maxPrice = Math.max(...candlesticks.map(c => c.high));
    const minPrice = Math.min(...candlesticks.map(c => c.low));
    const yScale = drawableHeight / (maxPrice - minPrice);
    const xScale = drawableWidth / candlesticks.length;
    // Draw price labels on y-axis
    const yAxisSteps = 10; // Number of steps on the y-axis
    const priceIncrement = (maxPrice - minPrice) / yAxisSteps;
    for (let i = 0; i <= yAxisSteps; i++) {
        const price = minPrice + i * priceIncrement;
        const y = margin.top + drawableHeight - (price - minPrice) * yScale;
        ctx.fillStyle = '#000';
        ctx.fillText(`${price.toFixed(2)}`, margin.left - 40, y);
        ctx.beginPath();
        ctx.moveTo(margin.left - 10, y);
        ctx.lineTo(width - margin.right, y);
        ctx.strokeStyle = '#ddd'; // Light gray for grid lines
        ctx.stroke();
    }
    candlesticks.forEach((candle, index) => {
        const x = margin.left + index * xScale;
        const yHigh = margin.top + (maxPrice - candle.high) * yScale;
        const yLow = margin.top + (maxPrice - candle.low) * yScale;
        const yOpen = margin.top + (maxPrice - candle.open) * yScale;
        const yClose = margin.top + (maxPrice - candle.close) * yScale;
        // Draw the wick
        ctx.beginPath();
        ctx.moveTo(x + xScale / 2 * 0.8, yHigh);
        ctx.lineTo(x + xScale / 2 * 0.8, yLow);
        ctx.strokeStyle = '#000';
        ctx.stroke();
        // Draw the body
        ctx.fillStyle = candle.isUpCandle() ? 'green' : 'red';
        ctx.fillRect(x, Math.min(yOpen, yClose), xScale * 0.8, Math.abs(yOpen - yClose));
        // Draw the timestamp label for every nth bar (e.g., every 5 bars)
        if (index % 5 === 0) { // Change "5" to another number to adjust the frequency
            const date = new Date(candle.timestamp);
            const timeLabel = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            ctx.fillStyle = 'black';
            ctx.fillText(timeLabel, x, height - margin.bottom + 15);
        }
    });
}
// Ensure that these variables are declared and initialized before they are used
const appleStock = new Stock("AAPL", 150);
let candlesticks = []; // Declaration of the candlesticks array
let currentCandle = new Candlestick(appleStock.price, Date.now());
function handleCandleCompletion() {
    candlesticks.push(currentCandle);
    currentCandle = new Candlestick(appleStock.price, Date.now());
    drawCandlesticks(candlesticks);
}
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('stockChart');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.canvas.width = 0.8 * window.innerWidth;
        ctx.canvas.height = 0.8 * window.innerHeight;
    }
    const startButton = document.getElementById('startSimulation');
    const periodicitySelect = document.getElementById('periodicity');
    const barsToLoadInput = document.getElementById('barsToLoad');
    if (!startButton || !periodicitySelect || !barsToLoadInput) {
        console.error('One or more interactive elements are missing!');
        return;
    }
    let chartProps = new ChartProperties(parseInt(barsToLoadInput.value, 10), periodicitySelect.value, 'linear');
    if (startButton) {
        startButton.addEventListener('click', () => {
            const barsToLoad = parseInt(barsToLoadInput.value, 10);
            const periodicity = periodicitySelect.value;
            chartProps = new ChartProperties(barsToLoad, periodicity, 'linear');
            candlesticks = simulateMarket(chartProps, appleStock);
            drawCandlesticks(candlesticks);
            let lastCandleClose = candlesticks[candlesticks.length - 1].close;
            currentCandle = new Candlestick(lastCandleClose, Date.now());
            simulateTrades(appleStock, currentCandle, chartProps, handleCandleCompletion);
            console.log(chartProps.barsToLoad, chartProps.periodicity);
        });
    }
});
//# sourceMappingURL=index.js.map