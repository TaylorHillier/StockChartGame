class Stock {
    constructor(public symbol: string, private _price: number) {}

    get price(): number {
        return this._price;
    }

    set price(value: number) {
        if (value < 0) throw new Error("Price cannot be negative.");
        this._price = value;
    }

    updatePrice(change: number): void {
        this.price = this._price + change; // This now uses the setter
    }
}


enum Periodicity {
    oneminute = '1 minute',
    fiveminute = '5 minute',
    thirtyminute = '30 minute',
    onehour = '1 hour'
}

class ChartProperties{
    barsToLoad: number;
    periodicity: Periodicity;
    scale: string;

    // Constructor to initialize the properties
    constructor(barsToLoad: number, periodicity: Periodicity, scale: string) {
        this.barsToLoad = barsToLoad;
        this.periodicity = periodicity;
        this.scale = scale;
    }
}

class Candlestick {
    public open: number;
    public high: number;
    public low: number;
    public close: number;
    public volume: number;
    public timestamp: number;

    constructor(open: number, timestamp: number) {
        this.open = open;
        this.high = open;
        this.low = open;
        this.close = open;
        this.volume = 0;
        this.timestamp = timestamp;
    }

    update(priceChange: number, tradeVolume: number) {
        const newPrice = this.close + priceChange;
        this.close = newPrice;
        this.high = Math.max(this.high, newPrice);
        this.low = Math.min(this.low, newPrice);
        this.volume += tradeVolume;

        console.log(`Updated Candlestick - Timestamp: ${new Date(this.timestamp).toISOString()}, Open: ${this.open}, High: ${this.high}, Low: ${this.low}, Close: ${this.close}, Volume: ${this.volume}`);
    }

    isUpCandle(): boolean {
        return this.close > this.open;
    }

    getColor(): string {
        return this.isUpCandle() ? 'green' : 'red';
    }
}

class Trade{
    public tradeVolume: number;
    public tradeType: boolean;
    public tradeStrength: number;

    constructor(tradeVolume: number, tradeType: boolean, tradeStrength: number){
        this.tradeVolume = tradeVolume;
        this.tradeType = tradeType;
        this.tradeStrength = tradeStrength;
    }
}

let isSimulationRunning = false;
let tradeInterval: number | undefined;
let candleTimer: number | undefined;

function simulateTrades(stock: Stock, chartProps: ChartProperties) {
    // Initialize the first candle if not already present
    if (!currentCandle) {
        currentCandle = new Candlestick(stock.price, Date.now());
    }

    clearInterval(tradeInterval);  // Clear previous trade simulation
    clearTimeout(candleTimer);  // Clear the previous timer for candle completion

    // Trade simulation interval
    tradeInterval = setInterval(() => {
        if (!isSimulationRunning) {
            clearInterval(tradeInterval);
            return;
        }

        // Simulate trade
        const tradeVolume = Math.floor(Math.random() * 1000 + 100);
        const priceChange = (Math.random() * 5) - 2.5;
        stock.updatePrice(priceChange);
        currentCandle.update(priceChange, tradeVolume);

        drawCandlesticks([...candlesticks, currentCandle]);  // Update visualization
    }, 1000);

    // Timeout to handle the completion of the current candle
    candleTimer = setTimeout(() => {
        handleCandleCompletion();
        simulateTrades(stock, chartProps);  // Continue with new candle
    }, getPeriodMilliseconds(chartProps.periodicity));
}





function simulateMarket(chartProps: ChartProperties, stock: Stock): Candlestick[] {
    let now = new Date();
    let endMS = now.getTime();
    let startMS = endMS - getPeriodMilliseconds(chartProps.periodicity) * chartProps.barsToLoad;
    let candlesticks: Candlestick[] = [];
    let lastClose = Math.random() * 100 + 100;  // Initial random close price for the first candle

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


function getPeriodMilliseconds(periodicity: Periodicity): number {
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

function drawCandlesticks(candlesticks: Candlestick[]) {
    const canvas = document.getElementById('stockChart') as HTMLCanvasElement | null;
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
    if (index % 5 === 0) {  // Change "5" to another number to adjust the frequency
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

let candlesticks: Candlestick[] = []; // Declaration of the candlesticks array
let currentCandle = new Candlestick(appleStock.price, Date.now());

function handleCandleCompletion() {
    candlesticks.push(currentCandle); // Push the completed candle to the list

    // Start a new candle with the last close price
    currentCandle = new Candlestick(currentCandle.close, Date.now());

    drawCandlesticks(candlesticks); // Redraw all candles including the new one
}



document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('stockChart') as HTMLCanvasElement | null;
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }

    const ctx = canvas.getContext('2d');
    if(ctx){
        ctx.canvas.width  = 0.8 * window.innerWidth;
        ctx.canvas.height =  0.8 *window.innerHeight;
    }
    const startButton = document.getElementById('startSimulation');
    const periodicitySelect = document.getElementById('periodicity') as HTMLSelectElement;
    const barsToLoadInput = document.getElementById('barsToLoad') as HTMLInputElement;

    if (!startButton || !periodicitySelect || !barsToLoadInput) {
        console.error('One or more interactive elements are missing!');
        return;
    }

    let chartProps = new ChartProperties(
        parseInt(barsToLoadInput.value, 10),
        periodicitySelect.value as Periodicity,
        'linear'
    );

    if (startButton) {
        startButton.addEventListener('click', () => {
            isSimulationRunning = !isSimulationRunning;
            startButton.textContent = isSimulationRunning ? 'Stop Simulation' : 'Start Simulation';
    
            if (isSimulationRunning) {
                const barsToLoad = parseInt(barsToLoadInput.value, 10);
                const periodicity = periodicitySelect.value as Periodicity;
    
                chartProps = new ChartProperties(barsToLoad, periodicity, 'linear');
    
                // Reinitialize market simulation or continue with existing data
                candlesticks = simulateMarket(chartProps, appleStock);
                let lastClose = candlesticks.length > 0 ? candlesticks[candlesticks.length - 1].close : appleStock.price;
                currentCandle = new Candlestick(lastClose, Date.now());
    
                drawCandlesticks(candlesticks);  // Draw existing candlesticks
                simulateTrades(appleStock, chartProps);  // Start trading simulation
            } else {
                clearInterval(tradeInterval);  // Stop trading simulation
                clearTimeout(candleTimer);  // Stop candle completion timer
            }
        });
    }
    
    
});