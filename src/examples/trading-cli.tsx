import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'url';
import { JSONFilePreset } from 'lowdb/node';
import { getBitcoinPrediction } from './ai-utils';

// --- API & Types ---

interface TickerData {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string; // Base volume
  quoteVolume: string; // Quote volume (USDT)
}

interface OrderBookData {
  bids: [string, string][];
  asks: [string, string][];
}

interface TradeData {
  id: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
}

const formatVolume = (vol: string | number) => {
  const v = typeof vol === 'string' ? parseFloat(vol) : vol;
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(2);
};

// --- Database Setup (Lowdb) ---
type PriceRecord = { price: number; type: 'REAL' | 'SIMULATED'; timestamp: number };
type Data = { market_data: PriceRecord[] };
const defaultData: Data = { market_data: [] };

// Using JSONFilePreset ensures type safety and auto-creation
// We initialize it inside a function or lazily to avoid top-level await issues in some environments,
// but for this CLI app, we can initialize it. However, since lowdb is ESM, let's keep it simple.
// Note: In a real app, you might want to handle the db path more carefully.
const db = await JSONFilePreset<Data>('trading-db.json', defaultData);

const logError = (msg: string) => {
  try {
    fs.appendFileSync('error.log', new Date().toISOString() + ' ' + msg + '\n');
  } catch {
    // ignore
  }
};

const savePrice = async (price: number, type: 'REAL' | 'SIMULATED') => {
  try {
    db.data.market_data.push({ price, type, timestamp: Date.now() });
    // Keep only last 1000 records to prevent file bloat
    if (db.data.market_data.length > 1000) {
      db.data.market_data = db.data.market_data.slice(-1000);
    }
    await db.write();
  } catch (err) {
    logError(`Save error: ${err}`);
  }
};

const getLatestRealPrice = (): number | null => {
  try {
    const realPrices = db.data.market_data.filter((p) => p.type === 'REAL');
    if (realPrices.length === 0) return null;
    return realPrices[realPrices.length - 1].price;
  } catch (err) {
    logError(`Get price error: ${err}`);
    return null;
  }
};

const fetchBinanceData = async (): Promise<{
  ticker: TickerData;
  depth: OrderBookData;
  trades: TradeData[];
} | null> => {
  try {
    const [tickerRes, depthRes, tradesRes] = await Promise.all([
      fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
      fetch('https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=5'),
      fetch('https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=5'),
    ]);

    if (!tickerRes.ok || !depthRes.ok || !tradesRes.ok) {
      logError(`Fetch failed: ${tickerRes.status} ${depthRes.status} ${tradesRes.status}`);
      return null;
    }

    const ticker = (await tickerRes.json()) as TickerData;
    const depth = (await depthRes.json()) as OrderBookData;
    const trades = (await tradesRes.json()) as TradeData[];

    return { ticker, depth, trades };
  } catch (err) {
    logError(`Fetch error: ${err}`);
    return null;
  }
};

// --- Palette Definition ---
// Using different shades of dark to create "layers"
const LAYERS = {
  headerInfo: '#282a36',
  chart: '#101010',
  priceTable: '#1c1c1c',
  orderBook: '#222222',

  // Accents
  green: '#50fa7b',
  red: '#ff5555',
  accent: '#bd93f9',
  cyan: '#8be9fd',
  yellow: '#f1fa8c',
  orange: '#ffb86c',
  textMain: '#ffffff',
  textSub: '#d0d0d0',
  textDim: '#707070',

  // Structure
  headerBar: '#555555',
  border: '#555555',
  commandBar: '#1a1a1a', // Match surrounding
};

const INITIAL_ORDER_BOOK = [
  { bid: '94,123.15', bSize: '1.59', ask: '94,125.41', aSize: '0.45' },
  { bid: '94,122.36', bSize: '1.40', ask: '94,126.07', aSize: '0.24' },
  { bid: '94,120.90', bSize: '1.34', ask: '94,127.29', aSize: '1.25' },
];

const INITIAL_PRICE_DATA = {
  last: 94135.77,
  change: '+1.82%',
  high: '94,812.11',
  low: '93,504.77',
  vol: '2.25B',
  spread: '0.10',
};

// --- Helper Functions ---
const openFile = (filePath: string) => {
  const platform = os.platform();
  let command = '';

  // Use Quick Look on macOS for an instant "Pop-up" preview
  if (platform === 'darwin') command = `qlmanage -p "${filePath}" >/dev/null 2>&1`;
  else if (platform === 'win32')
    command = `explorer "${filePath}"`; // Default open on Windows
  else command = `xdg-open "${filePath}"`; // Default on Linux

  exec(command, (err) => {
    if (err) console.error('Failed to open file:', err);
  });
};

const writeTradeLog = (trades: TradeData[]) => {
  const header = 'TIMESTAMP,ACTION,ASSET,PRICE,AMOUNT,STATUS\n';
  const rows = trades
    .map((t) => `${new Date(t.time).toISOString()},BUY,BTC,${t.price},${t.qty},FILLED`)
    .join('\n');
  fs.writeFileSync('trades.csv', header + rows);
};

// --- UI Components ---

// Updated Layer: Uses borderStyle="single" instead of background
const Layer = ({
  children,
  height,
  width,
  title,
}: {
  children: React.ReactNode;
  height?: number;
  width?: string | number;
  title?: string;
}) => (
  <Box
    flexDirection="column"
    height={height}
    width={width}
    flexGrow={1}
    borderStyle="single"
    borderColor={LAYERS.border}
    paddingX={1}
  >
    {title && (
      <Box marginTop={-1} marginLeft={1} paddingX={1}>
        <Text bold color={LAYERS.accent}>
          {title}
        </Text>
      </Box>
    )}
    {children}
  </Box>
);

// Updated LayerHeader: (Inline replacement for compatibility or simple text)
const LayerHeader = ({ title, rightLabel }: { title: string; rightLabel?: string }) => (
  <Box
    flexDirection="row"
    justifyContent="space-between"
    paddingX={1}
    paddingY={0}
    borderBottom
    borderStyle="single"
    borderColor={LAYERS.border}
  >
    <Text bold color={LAYERS.accent}>
      {title}
    </Text>
    {rightLabel && <Text color={LAYERS.textSub}>{rightLabel}</Text>}
  </Box>
);

// --- Sections ---

const HeaderSection = ({
  agentStatus,
  tradeStats,
}: {
  agentStatus: string;
  tradeStats?: { count: number; vol: number };
}) => (
  <Layer title="HEADER">
    <Box flexDirection="column" paddingY={0} marginBottom={0}>
      <Box flexDirection="row" justifyContent="space-between">
        <Text bold color={LAYERS.textMain}>
          [CLI_USE]
        </Text>
        {agentStatus !== 'idle' && (
          <Box>
            <Text
              color={agentStatus === 'EXECUTING' ? LAYERS.yellow : LAYERS.green}
              bold
            >{`[ ● Agent: ${agentStatus} ]`}</Text>
            {tradeStats && tradeStats.count > 0 && (
              <Text
                color={LAYERS.textMain}
              >{` Trades: ${tradeStats.count} | Vol: ${(tradeStats.vol * 100).toFixed(0)}%`}</Text>
            )}
          </Box>
        )}
      </Box>
      <Box flexDirection="row" marginTop={0} gap={2}>
        <Box marginRight={2}>
          <Text color={LAYERS.textDim}>MARKET: </Text>
          <Text color={LAYERS.textMain} bold>
            BTC/USDT
          </Text>
        </Box>
        <Box marginRight={2}>
          <Text color={LAYERS.textDim}>TF: </Text>
          <Text color={LAYERS.textMain} bold>
            1h
          </Text>
        </Box>
        <Box>
          <Text color={LAYERS.textDim}>RANGE: </Text>
          <Text color={LAYERS.textMain} bold>
            last_24h
          </Text>
        </Box>
      </Box>
    </Box>
  </Layer>
);

const InfoBox = ({
  label,
  value,
  color,
  width = '100%',
}: {
  label: string;
  value: string;
  color?: string;
  width?: string | number;
}) => (
  <Box
    borderStyle="single"
    borderColor={LAYERS.border}
    flexDirection="row"
    justifyContent="space-between"
    paddingX={1}
    width={width}
  >
    <Text color={LAYERS.textDim}>{label}</Text>
    <Text color={color || LAYERS.textMain} bold>
      {value}
    </Text>
  </Box>
);

const PriceOverview = ({ data }: { data: TickerData | typeof INITIAL_PRICE_DATA | null }) => {
  // Normalize data structure
  const isTicker = (d: any): d is TickerData => d && 'lastPrice' in d;

  // Fallback to initial data if null
  const safeData = data || INITIAL_PRICE_DATA;

  let price: number;
  let change: string;
  let high: string;
  let low: string;
  let vol: string;
  let spread: string;

  if (isTicker(safeData)) {
    price = parseFloat(safeData.lastPrice);
    change = parseFloat(safeData.priceChangePercent).toFixed(2) + '%';
    high = parseFloat(safeData.highPrice).toLocaleString('en-US', { minimumFractionDigits: 2 });
    low = parseFloat(safeData.lowPrice).toLocaleString('en-US', { minimumFractionDigits: 2 });
    vol = formatVolume(safeData.quoteVolume);
    spread = '0.01';
  } else {
    // It is INITIAL_PRICE_DATA
    const d = safeData as typeof INITIAL_PRICE_DATA;
    price = d.last;
    change = d.change;
    high = d.high;
    low = d.low;
    vol = d.vol;
    spread = d.spread;
  }

  const formattedPrice = price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Layer title="PRICE OVERVIEW">
      <Box flexDirection="column" gap={0}>
        {/* Row 1 */}
        <Box flexDirection="row" gap={1}>
          <InfoBox label="LAST" value={formattedPrice} color={LAYERS.textMain} width="50%" />
          <InfoBox
            label="24H%"
            value={change}
            color={change.startsWith('-') ? LAYERS.red : LAYERS.green}
            width="50%"
          />
        </Box>

        <Box height={1} />

        {/* Row 2 */}
        <Box flexDirection="row" gap={1}>
          <InfoBox label="HIGH" value={high} width="50%" />
          <InfoBox label="LOW" value={low} width="50%" />
        </Box>

        <Box height={1} />

        {/* Row 3 */}
        <Box flexDirection="row" gap={1}>
          <InfoBox label="VOL" value={vol} width="50%" />
          <InfoBox label="SPREAD" value={spread} width="50%" />
        </Box>
      </Box>
    </Layer>
  );
};

const OrderBook = ({ depth }: { depth?: OrderBookData | null }) => {
  const bids = depth
    ? depth.bids.slice(0, 3).map(([price, size]) => ({
        bid: parseFloat(price).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        bSize: parseFloat(size).toFixed(2),
      }))
    : INITIAL_ORDER_BOOK.map((d) => ({ bid: d.bid, bSize: d.bSize }));

  const asks = depth
    ? depth.asks.slice(0, 3).map(([price, size]) => ({
        ask: parseFloat(price).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        aSize: parseFloat(size).toFixed(2),
      }))
    : INITIAL_ORDER_BOOK.map((d) => ({ ask: d.ask, aSize: d.aSize }));

  const rows = bids.map((bid, i) => ({ ...bid, ...asks[i] }));

  return (
    <Layer>
      <LayerHeader title="ORDER BOOK" rightLabel="depth" />
      <Box
        flexDirection="row"
        paddingX={1}
        borderBottom
        borderStyle="single"
        borderColor={LAYERS.border}
      >
        <Box width="25%">
          <Text color={LAYERS.textSub} bold>
            BID
          </Text>
        </Box>
        <Box width="25%" alignItems="flex-end">
          <Text color={LAYERS.textSub} bold>
            SIZE
          </Text>
        </Box>
        <Box width="25%" paddingLeft={1}>
          <Text color={LAYERS.textSub} bold>
            ASK
          </Text>
        </Box>
        <Box width="25%" alignItems="flex-end">
          <Text color={LAYERS.textSub} bold>
            SIZE
          </Text>
        </Box>
      </Box>
      <Box flexDirection="column" paddingX={0}>
        {rows.map((row, i) => (
          <Box key={i} flexDirection="row">
            <Box width="25%">
              <Text color={LAYERS.green}>{row.bid}</Text>
            </Box>
            <Box width="25%" alignItems="flex-end">
              <Text color={LAYERS.textMain}>{row.bSize}</Text>
            </Box>
            <Box width="25%" paddingLeft={1}>
              <Text color={LAYERS.red}>{row.ask}</Text>
            </Box>
            <Box width="25%" alignItems="flex-end">
              <Text color={LAYERS.textMain}>{row.aSize}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Layer>
  );
};

const MarketTrades = ({ trades }: { trades?: TradeData[] | null }) => {
  return (
    <Layer>
      <LayerHeader title="MARKET TRADES" rightLabel="recent" />
      <Box
        flexDirection="row"
        paddingX={1}
        borderBottom
        borderStyle="single"
        borderColor={LAYERS.border}
      >
        <Box width="30%">
          <Text color={LAYERS.textSub} bold>
            TIME
          </Text>
        </Box>
        <Box width="40%" alignItems="flex-end">
          <Text color={LAYERS.textSub} bold>
            PRICE
          </Text>
        </Box>
        <Box width="30%" alignItems="flex-end">
          <Text color={LAYERS.textSub} bold>
            QTY
          </Text>
        </Box>
      </Box>
      <Box flexDirection="column" paddingX={0}>
        {trades && trades.length > 0 ? (
          trades.slice(0, 5).map((t, i) => (
            <Box key={i} flexDirection="row">
              <Box width="30%">
                <Text color={LAYERS.textDim}>
                  {new Date(t.time).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Text>
              </Box>
              <Box width="40%" alignItems="flex-end">
                <Text color={t.isBuyerMaker ? LAYERS.red : LAYERS.green}>
                  {parseFloat(t.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </Box>
              <Box width="30%" alignItems="flex-end">
                <Text color={LAYERS.textMain}>{parseFloat(t.qty).toFixed(4)}</Text>
              </Box>
            </Box>
          ))
        ) : (
          <Box>
            <Text color={LAYERS.textDim}>Waiting for trades...</Text>
          </Box>
        )}
      </Box>
    </Layer>
  );
};

// --- Main App ---

const AIPredictionPanel = ({
  prediction,
  isLoading,
}: {
  prediction: string | null;
  isLoading: boolean;
}) => {
  if (!prediction && !isLoading) return null;

  return (
    <Layer title="AI PREDICTION">
      <Box paddingX={0} paddingY={0}>
        {isLoading ? (
          <Text color={LAYERS.cyan}>
            <Text color={LAYERS.cyan} bold>
              ⟳
            </Text>{' '}
            Analyzing market data with Gemini Pro...
          </Text>
        ) : (
          <Text color={LAYERS.cyan}>{prediction}</Text>
        )}
      </Box>
    </Layer>
  );
};

const CommandBar = ({
  onCommand,
  status,
}: {
  onCommand: (cmd: string) => void;
  status: string;
}) => {
  const [command, setCommand] = useState('');

  const handleSubmit = (val: string) => {
    onCommand(val);
    setCommand('');
  };

  const commandColor =
    command.startsWith('agents') || command.startsWith('agent')
      ? LAYERS.yellow
      : command.startsWith('ai')
        ? LAYERS.cyan
        : command.startsWith('predict')
          ? LAYERS.orange
          : undefined;

  return (
    <Box
      flexDirection="row"
      paddingX={1}
      paddingY={0}
      borderStyle="round"
      borderColor={LAYERS.border}
      backgroundColor={LAYERS.commandBar}
      width="100%"
    >
      <Text color={LAYERS.accent}>➜ </Text>
      <Text color={commandColor}>
        <TextInput
          value={command}
          onChange={setCommand}
          onSubmit={handleSubmit}
          placeholder="Type 'agent' or 'predict'..."
        />
      </Text>
      <Box flexGrow={1} />
      <Text color={status === 'idle' ? LAYERS.textDim : LAYERS.green}>
        {status === 'idle' ? 'READY' : status}
      </Text>
    </Box>
  );
};

export const TradingDashboard = () => {
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, MONITORING, EXECUTING
  const [marketData, setMarketData] = useState<TickerData | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [trades, setTrades] = useState<TradeData[] | null>(null);
  const [tradeStats, setTradeStats] = useState({ count: 0, vol: 0 });
  const [aiPrediction, setAiPrediction] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useInput((input, key) => {
    if (key.escape || (input === 'c' && key.ctrl)) {
      process.exit(0);
    }
  });

  // --- Data Fetching Logic ---

  // 1. API Polling Loop (1.5s)
  useEffect(() => {
    const pollAPI = async () => {
      const data = await fetchBinanceData();
      if (data) {
        setOrderBook(data.depth);
        setTrades(data.trades);
        // Save REAL price to DB for volatility calculation
        await savePrice(parseFloat(data.ticker.lastPrice), 'REAL');
        // Also ensure marketData is set at least once so we have base data
        setMarketData((prev) => (prev ? prev : data.ticker));
      }
    };

    // Initial fetch
    pollAPI();

    const interval = setInterval(pollAPI, 1500);
    return () => clearInterval(interval);
  }, []);

  // 2. UI/Volatility Update Loop (0.5s)
  useEffect(() => {
    const updateUI = async () => {
      const lastReal = getLatestRealPrice();

      if (lastReal) {
        // Add random volatility (+/- 0.05%)
        const volatility = (Math.random() - 0.5) * 0.001;
        const simulatedPrice = lastReal * (1 + volatility);

        // Save simulated price (optional, mostly for history logging if needed)
        await savePrice(simulatedPrice, 'SIMULATED');

        // Update Market Data State with new price, preserving other fields if available
        setMarketData((prev) => {
          if (prev) {
            return {
              ...prev,
              lastPrice: simulatedPrice.toString(),
            };
          }

          return {
            lastPrice: simulatedPrice.toString(),
            priceChangePercent: '0.00',
            highPrice: (simulatedPrice * 1.02).toString(),
            lowPrice: (simulatedPrice * 0.98).toString(),
            volume: '1000',
            quoteVolume: '100000000',
          };
        });
      }
    };

    const interval = setInterval(updateUI, 500);
    return () => clearInterval(interval);
  }, []);

  const runAgentStrategy = () => {
    setAgentStatus('MONITORING');
    setTradeStats({ count: 0, vol: 0 });
    const tradesList: TradeData[] = [];
    let count = 0;

    const currentPrice = marketData ? parseFloat(marketData.lastPrice) : INITIAL_PRICE_DATA.last;

    // T+2s: Simulate Price Drop
    setTimeout(() => {
      // For simulation, we might want to force a drop in the displayed price
      // But our volatility loop will overwrite it.
      // For this demo, let's just let the agent "react" to the current price.
    }, 2000);

    // T+3s: Execute
    setTimeout(() => {
      setAgentStatus('EXECUTING');

      const interval = setInterval(() => {
        count++;
        const newTrade: TradeData = {
          id: Date.now() + count,
          time: Date.now(),
          isBuyerMaker: false, // Buy = false isBuyerMaker (taker buy)
          qty: '0.05',
          price: (currentPrice - count * 0.5).toString(),
        };
        tradesList.push(newTrade);

        setTradeStats((prev) => ({
          count: prev.count + 1,
          vol: prev.vol + 0.05,
        }));

        if (count >= 10) {
          clearInterval(interval);
          setAgentStatus('FINALIZING');
          writeTradeLog(tradesList);
          openFile('trades.csv');

          setTimeout(() => {
            setAgentStatus('idle');
          }, 2000);
        }
      }, 100);
    }, 3000);
  };

  const handleCommand = async (cmd: string) => {
    if (cmd.includes('agent') || cmd.includes('strategy')) {
      runAgentStrategy();
    } else if (cmd.includes('predict')) {
      setIsAiLoading(true);
      setAiPrediction(null);
      const result = await getBitcoinPrediction();
      setAiPrediction(result);
      setIsAiLoading(false);
    }
  };

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor={LAYERS.border}
      width={100}
    >
      {/* Top Bar */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1} marginBottom={1}>
        <Text bold color={LAYERS.textMain}>
          CLI USE VM
        </Text>
        <Text color={LAYERS.textDim}>tty0 • 80x24</Text>
      </Box>

      {/* Layout Grid */}
      <Box flexDirection="column" gap={0}>
        <HeaderSection agentStatus={agentStatus} tradeStats={tradeStats} />

        {/* Top Section: Price & OrderBook */}
        <Box flexDirection="row" gap={1} marginTop={1}>
          <Box width="45%">
            <PriceOverview data={marketData} />
          </Box>
          <Box width="55%">
            <OrderBook depth={orderBook} />
          </Box>
        </Box>

        {/* Bottom Section: Market Trades */}
        <Box marginTop={1}>
          <MarketTrades trades={trades} />
        </Box>

        {/* AI Prediction Section */}
        <Box marginTop={1}>
          <AIPredictionPanel prediction={aiPrediction} isLoading={isAiLoading} />
        </Box>

        {/* New Command Bar */}
        <Box marginTop={1}>
          <CommandBar onCommand={handleCommand} status={agentStatus} />
        </Box>
      </Box>
    </Box>
  );
};

// --- Loading Screen ---
const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Resolving package...');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 500); // Small delay before switching
          return 100;
        }

        // Random increments
        const increment = Math.random() * 15;
        const newProgress = Math.min(prev + increment, 100);

        // Update status based on progress
        if (newProgress > 10 && newProgress < 40) setStatus('Downloading cliuse_f59tdodr...');
        else if (newProgress >= 40 && newProgress < 70) setStatus('Verifying signature...');
        else if (newProgress >= 70 && newProgress < 90) setStatus('Installing dependencies...');
        else if (newProgress >= 90) setStatus('Starting...');

        return newProgress;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onComplete]);

  const progressBarWidth = 40;
  const filledWidth = Math.floor((progress / 100) * progressBarWidth);
  const emptyWidth = progressBarWidth - filledWidth;
  const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height={20}
      width={80}
      borderStyle="round"
      borderColor={LAYERS.border}
    >
      <Text bold color={LAYERS.accent}>
        CLI-USE PACKAGE MANAGER
      </Text>
      <Box marginTop={1}>
        <Text color={LAYERS.textDim}>Installing remote package...</Text>
      </Box>

      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Text color={LAYERS.green}>{progressBar}</Text>
        <Box marginTop={1}>
          <Text color={LAYERS.textMain}>
            {progress.toFixed(0)}% - {status}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};

export const TradingApp = () => {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return <TradingDashboard />;
};

// Only run if executing directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  render(<TradingApp />);
}
