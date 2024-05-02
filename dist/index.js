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
        //console.log(`Updated Candlestick - Timestamp: ${new Date(this.timestamp).toISOString()}, Open: ${this.open}, High: ${this.high}, Low: ${this.low}, Close: ${this.close}, Volume: ${this.volume}`);
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
class SimTrade {
    constructor(entryPrice, profitLoss, isActive, tradeDirection, contracts) {
        this.entryPrice = entryPrice;
        this.profitLoss = profitLoss;
        this.isActive = isActive;
        this.tradeDirection = tradeDirection;
        this.contracts = contracts;
    }
}
class SimAccount {
    constructor(totalPnL) {
        this.totalPnL = totalPnL;
    }
}
let isSimulationRunning = false;
let tradeInterval;
let candleTimer;
function simulateTrades(stock, chartProps) {
    // Initialize the first candle if not already present
    if (!currentCandle) {
        currentCandle = new Candlestick(stock.price, Date.now());
    }
    clearInterval(tradeInterval); // Clear previous trade simulation
    clearTimeout(candleTimer); // Clear the previous timer for candle completion
    // Trade simulation interval
    tradeInterval = setInterval(() => {
        if (!isSimulationRunning) {
            clearInterval(tradeInterval);
            return;
        }
        // Simulate trade
        const tradeVolume = Math.floor(Math.random() * 1000 + 100);
        const priceChange = (Math.random() * 1) - 0.5;
        stock.updatePrice(priceChange);
        currentCandle.update(priceChange, tradeVolume);
        drawCandlesticks([...candlesticks, currentCandle]); // Update visualization
        if (currentTrade) {
            updateTradeDisplay();
        }
    }, 1000);
    // Timeout to handle the completion of the current candle
    candleTimer = setTimeout(() => {
        handleCandleCompletion();
        simulateTrades(stock, chartProps); // Continue with new candle
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
        let close = open + (Math.random() * 5 - 2.5); // Random change between -10 and +10
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
    var _a;
    const canvas = document.getElementById('stockChart');
    const controls = (_a = document.getElementById('controls')) === null || _a === void 0 ? void 0 : _a.clientHeight;
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
    var height = canvas.height;
    if (controls) {
        height = canvas.height - controls;
    }
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
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.strokeStyle = '#808080'; // Light gray for grid lines
        ctx.stroke();
    }
    // Draw entry price line for an active trade
    if (currentTrade && currentTrade.isActive) {
        const entryPriceY = margin.top + (maxPrice - currentTrade.entryPrice) * yScale;
        ctx.beginPath();
        ctx.moveTo(margin.left, entryPriceY);
        ctx.lineTo(width - margin.right, entryPriceY);
        ctx.strokeStyle = currentTrade.tradeDirection ? '#00ff00' : '#ff0000'; // Green for buy, red for sell
        ctx.stroke();
        // Optionally, add text to indicate the entry price
        ctx.fillStyle = '#000';
        ctx.fillText(`Entry Price: ${currentTrade.entryPrice.toFixed(2)}`, margin.left, entryPriceY - 5);
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
    candlesticks.push(currentCandle); // Push the completed candle to the list
    // Start a new candle with the last close price
    currentCandle = new Candlestick(currentCandle.close, Date.now());
    drawCandlesticks(candlesticks); // Redraw all candles including the new one
}
let currentTrade = null;
let simAccount = new SimAccount(0);
function updateTradeDisplay() {
    const pnlDisplay = document.getElementById('pnl');
    const contractsInput = document.getElementById('contracts');
    const numContracts = parseInt(contractsInput.value, 10);
    if (currentTrade && currentTrade.isActive) {
        const currentPrice = appleStock.price;
        // Calculate current PnL
        currentTrade.profitLoss = (currentTrade.tradeDirection ? 1 : -1) * (currentPrice - currentTrade.entryPrice) * numContracts;
        // Update the display for the PnL of the current trade
        if (pnlDisplay) {
            pnlDisplay.style.color = currentTrade.profitLoss >= 0 ? 'green' : 'red';
            pnlDisplay.innerHTML = `P&L: $${currentTrade.profitLoss.toFixed(2)}`;
        }
        console.log(`Current Trade - Entry Price: ${currentTrade.entryPrice}, P&L: ${currentTrade.profitLoss}`);
    }
    else {
        console.log("No active trade.");
    }
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
    const buyButton = document.getElementById('buy');
    const sellButton = document.getElementById('sell');
    const closeButton = document.getElementById('close');
    const contracts = document.getElementById('contracts');
    if (!startButton || !periodicitySelect || !barsToLoadInput) {
        console.error('One or more interactive elements are missing!');
        return;
    }
    let chartProps = new ChartProperties(parseInt(barsToLoadInput.value, 2), periodicitySelect.value, 'linear');
    if (startButton) {
        startButton.addEventListener('click', () => {
            isSimulationRunning = !isSimulationRunning;
            startButton.textContent = isSimulationRunning ? 'Stop Simulation' : 'Start Simulation';
            if (isSimulationRunning) {
                const barsToLoad = parseInt(barsToLoadInput.value, 10);
                const periodicity = periodicitySelect.value;
                chartProps = new ChartProperties(barsToLoad, periodicity, 'linear');
                // Reinitialize market simulation or continue with existing data
                candlesticks = simulateMarket(chartProps, appleStock);
                let lastClose = candlesticks.length > 0 ? candlesticks[candlesticks.length - 1].close : appleStock.price;
                currentCandle = new Candlestick(lastClose, Date.now());
                drawCandlesticks(candlesticks); // Draw existing candlesticks
                simulateTrades(appleStock, chartProps); // Start trading simulation
            }
            else {
                clearInterval(tradeInterval); // Stop trading simulation
                clearTimeout(candleTimer); // Stop candle completion timer
            }
        });
    }
    if (!buyButton || !sellButton || !closeButton) {
        console.error('One or more trading buttons are missing!');
    }
    else {
        console.log("Trading buttons are initialized.");
    }
    if (!isSimulationRunning) {
        const numContracts = parseInt(contracts.value, 2);
        const pnl = document.getElementById('pnl');
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                if (!currentTrade || !currentTrade.isActive) {
                    currentTrade = new SimTrade(appleStock.price, 0, true, true, numContracts);
                    updateTradeDisplay();
                }
                else {
                    console.log("Close current trade before opening a new one.");
                }
            });
        }
        if (sellButton) {
            sellButton.addEventListener('click', () => {
                if (!currentTrade || !currentTrade.isActive) {
                    currentTrade = new SimTrade(appleStock.price, 0, true, false, numContracts);
                    updateTradeDisplay();
                }
                else {
                    console.log("Close current trade before opening a new one.");
                }
            });
        }
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                if (currentTrade && currentTrade.isActive) {
                    // Update the total PnL for the account with the final PnL of the closed trade
                    simAccount.totalPnL += currentTrade.profitLoss;
                    // Log the closure and update of the account
                    console.log(`Trade Closed - Final P&L: ${currentTrade.profitLoss}, Total Account P&L: ${simAccount.totalPnL}`);
                    // Display the updated total PnL
                    const totalPnLDisplay = document.getElementById('pnl');
                    if (totalPnLDisplay) {
                        totalPnLDisplay.style.color = simAccount.totalPnL >= 0 ? 'green' : 'red';
                        totalPnLDisplay.innerHTML = `Total P&L: $${simAccount.totalPnL.toFixed(2)}`;
                    }
                    // Reset current trade
                    currentTrade.isActive = false;
                    currentTrade = null;
                    updateTradeDisplay(); // Refresh the trade display to show no active trades
                }
            });
        }
    }
});
//# sourceMappingURL=index.js.map