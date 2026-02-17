import React, { useState, useEffect, useRef, useCallback } from 'react';
import { render, Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import fs from 'node:fs';

import { exec } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'url';
import { JSONFilePreset } from 'lowdb/node';
import { getBitcoinPrediction, getAgentStrategy, OrderPlan } from './ai-utils';

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbInstance: any = null;

const getDb = async () => {
  if (!dbInstance) {
    dbInstance = await JSONFilePreset<Data>('trading-db.json', defaultData);
  }
  return dbInstance;
};

const logError = (msg: string) => {
  try {
    fs.appendFileSync('error.log', new Date().toISOString() + ' ' + msg + '\n');
  } catch {
    // ignore
  }
};

const savePrice = async (price: number, type: 'REAL' | 'SIMULATED') => {
  try {
    const db = await getDb();
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

const getLatestRealPrice = async (): Promise<number | null> => {
  try {
    const db = await getDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const realPrices = db.data.market_data.filter((p: any) => p.type === 'REAL');
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
  commandBar: '#44475a', // Dracula Current Line
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
  // Calculate metrics
  let totalInvested = 0;
  trades.forEach((t) => {
    totalInvested += parseFloat(t.price) * parseFloat(t.qty);
  });

  // Simulate profit (0.5% - 2.5%)
  const profitMargin = Math.random() * 0.02 + 0.005;
  const totalProfit = totalInvested * profitMargin;
  const finalReturns = totalInvested + totalProfit;

  const summary = [
    `INITIAL_INVESTED,${totalInvested.toFixed(2)}`,
    `FINAL_RETURNS,${finalReturns.toFixed(2)}`,
    `TOTAL_PROFIT,${totalProfit.toFixed(2)}`,
    '',
  ].join('\n');

  const header = 'TIMESTAMP,ACTION,ASSET,PRICE,AMOUNT,STATUS\n';
  const rows = trades
    .map((t) => {
      const side = t.isBuyerMaker ? 'SELL' : 'BUY';
      return `${new Date(t.time).toISOString()},${side},BTC,${t.price},${t.qty},FILLED`;
    })
    .join('\n');
  fs.writeFileSync('trades.csv', summary + header + rows);
};

// --- UI Components ---

// Updated Layer: Uses borderStyle="single" instead of background
const Layer = ({
  children,
  height,
  width,
  title,
  paddingX = 1,
}: {
  children: React.ReactNode;
  height?: number;
  width?: string | number;
  title?: string;
  paddingX?: number;
}) => (
  <Box
    flexDirection="column"
    height={height}
    width={width}
    flexGrow={1}
    borderStyle="single"
    borderColor={LAYERS.border}
    paddingX={paddingX}
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
  const isTicker = (d: unknown): d is TickerData =>
    !!d && typeof d === 'object' && 'lastPrice' in d;

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
      <Box flexDirection="column" width="100%" marginTop={1}>
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

const CommandBar = ({
  onCommand,
  status = 'idle',
  focused = false,
  placeholder,
}: {
  onCommand: (cmd: string) => void;
  status?: string;
  focused?: boolean;
  placeholder?: string;
}) => {
  const [command, setCommand] = useState('');

  const handleSubmit = (value: string) => {
    onCommand(value);
    setCommand('');
  };

  return (
    <Box flexDirection="row" width="100%" alignItems="center">
      <Box
        flexGrow={1}
        borderStyle="round"
        borderColor={focused ? LAYERS.accent : LAYERS.border}
        backgroundColor="#2a2a2a"
        paddingX={1}
      >
        <Text color="white" bold>
          {status === 'EXECUTING' ? '!' : '>'}{' '}
        </Text>
        <Text color="white" bold>
          <TextInput
            value={command}
            onChange={setCommand}
            onSubmit={handleSubmit}
            placeholder={placeholder || 'Talk to AI...'}
            focus={focused}
          />
        </Text>
      </Box>
      <Box marginLeft={1}>
        <Text color={status === 'idle' ? LAYERS.textDim : LAYERS.green}>
          {status === 'idle' ? '' : status}
        </Text>
      </Box>
    </Box>
  );
};

const MarketTrades = ({ trades }: { trades?: TradeData[] | null }) => {
  const recentTrades = trades ? trades.slice(0, 10) : [];

  return (
    <Layer>
      <LayerHeader title="MARKET TRADES" rightLabel="recent" />
      <Box flexDirection="column" width="100%" marginTop={1}>
        <Box flexDirection="row" paddingX={1}>
          <Box width="30%">
            <Text color={LAYERS.textSub} bold>
              PRICE
            </Text>
          </Box>
          <Box width="30%" alignItems="flex-end">
            <Text color={LAYERS.textSub} bold>
              SIZE
            </Text>
          </Box>
          <Box width="40%" alignItems="flex-end">
            <Text color={LAYERS.textSub} bold>
              TIME
            </Text>
          </Box>
        </Box>
        {recentTrades.map((t, i) => (
          <Box key={i} flexDirection="row" paddingX={1}>
            <Box width="30%">
              <Text color={t.isBuyerMaker ? LAYERS.red : LAYERS.green}>
                {parseFloat(t.price).toFixed(2)}
              </Text>
            </Box>
            <Box width="30%" alignItems="flex-end">
              <Text color={LAYERS.textMain}>{parseFloat(t.qty).toFixed(4)}</Text>
            </Box>
            <Box width="40%" alignItems="flex-end">
              <Text color={LAYERS.textDim}>{new Date(t.time).toLocaleTimeString()}</Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Layer>
  );
};

interface AIPredictionPanelProps {
  title: string;
  content: string | null;
  isLoading: boolean;
  progress?: number;
  orderPlan?: OrderPlan[];
  selectionItems?: { label: string; value: string }[];
  onSelect: (item: { label: string; value: string }) => void;
}

const AIPredictionPanel = ({
  title,
  content,
  isLoading,
  progress,
  orderPlan,
  selectionItems,
  onSelect,
}: AIPredictionPanelProps) => {
  return (
    <Layer>
      <LayerHeader title={title.toUpperCase()} rightLabel={isLoading ? 'processing' : 'ready'} />
      <Box flexDirection="column" padding={1}>
        {content && (
          <Box marginBottom={1}>
            <Text color={LAYERS.textMain}>{content}</Text>
          </Box>
        )}

        {isLoading && progress !== undefined ? (
          <Box flexDirection="column" marginBottom={1}>
            <Text color={LAYERS.textDim}>Running analysis...</Text>
            <Box width="100%" marginTop={1}>
              <Text color={LAYERS.green}>
                {'█'.repeat(Math.floor((progress / 100) * 40))}
                {'░'.repeat(40 - Math.floor((progress / 100) * 40))} {Math.floor(progress)}%
              </Text>
            </Box>
          </Box>
        ) : isLoading ? (
          <Box flexDirection="row" marginBottom={1}>
            <Text color={LAYERS.green}>
              <Spinner type="dots" />
            </Text>
            <Text color={LAYERS.textDim}> Analyzing market data...</Text>
          </Box>
        ) : null}

        {!isLoading && selectionItems && selectionItems.length > 0 && (
          <Box flexDirection="column" gap={1}>
            <SelectInput items={selectionItems} onSelect={onSelect} />
          </Box>
        )}

        {orderPlan && orderPlan.length > 0 && (
          <Box
            flexDirection="column"
            marginTop={1}
            borderStyle="round"
            borderColor={LAYERS.border}
            padding={1}
          >
            <Text bold color={LAYERS.textMain}>
              EXECUTING STRATEGY:
            </Text>
            {orderPlan.map((step, i) => (
              <Box key={i} flexDirection="row" justifyContent="space-between" marginTop={1}>
                <Text color={step.side === 'BUY' ? LAYERS.green : LAYERS.red} bold>
                  {step.side}
                </Text>
                <Text color={LAYERS.textMain}>
                  ${step.amountUSD} @ {step.price}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Layer>
  );
};

const DEPLOYMENT_STEPS = [
  'Building & Bundling Artifacts',
  'Optimizing Execution Engine',
  'Deploying to Edge Network',
  'Verifying Global Propagation',
];

const DeploymentOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'uploading' | 'deploying'>('uploading');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  // Upload Phase
  useEffect(() => {
    if (phase === 'uploading') {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(() => setPhase('deploying'), 500);
            return 100;
          }
          return Math.min(prev + Math.random() * 8, 100);
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [phase]);

  // Deployment Phase
  useEffect(() => {
    if (phase === 'deploying') {
      if (currentStep < DEPLOYMENT_STEPS.length) {
        const timer = setInterval(() => {
          setStepProgress((prev) => {
            if (prev >= 100) {
              clearInterval(timer);
              setCurrentStep((s) => s + 1);
              return 0;
            }
            return prev + 5;
          });
        }, 50);
        return () => clearInterval(timer);
      } else {
        setTimeout(onComplete, 1500);
      }
    }
  }, [phase, currentStep, onComplete]);

  // Progress bar helper
  const progressBarWidth = 40;
  const filledWidth = Math.floor((progress / 100) * progressBarWidth);
  const emptyWidth = progressBarWidth - filledWidth;
  const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

  if (phase === 'uploading') {
    return (
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height={24}
        width={80}
        borderStyle="double"
        borderColor={LAYERS.cyan}
      >
        <Text bold color={LAYERS.cyan}>
          UPLOADING STRATEGY
        </Text>
        <Box marginTop={2} flexDirection="column" alignItems="center">
          <Text color={LAYERS.green}>{progressBar}</Text>
          <Box marginTop={1}>
            <Text color={LAYERS.textMain}>{progress.toFixed(0)}% Uploaded</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height={24}
      width={80}
      borderStyle="double"
      borderColor={LAYERS.cyan}
    >
      <Text bold color={LAYERS.cyan}>
        DEPLOYING TO CLI-USE CLOUD
      </Text>
      <Box marginTop={1} marginBottom={1}>
        <Text color={LAYERS.cyan}>
          <Spinner type="earth" />
        </Text>
      </Box>
      <Box flexDirection="column" paddingX={2} width="100%">
        {DEPLOYMENT_STEPS.map((s, i) => {
          let icon = '  ';
          let color = LAYERS.textDim;
          let subBar = null;

          if (i < currentStep) {
            icon = '✔ ';
            color = LAYERS.green;
          } else if (i === currentStep) {
            icon = '➜ ';
            color = LAYERS.textMain;
            const barW = 20;
            const filled = Math.floor((stepProgress / 100) * barW);
            const empty = barW - filled;
            const barStr = '█'.repeat(filled) + '░'.repeat(empty);
            subBar = (
              <Box marginLeft={2}>
                <Text color={LAYERS.textSub}>[{barStr}]</Text>
              </Box>
            );
          }

          return (
            <Box key={i} flexDirection="column" marginBottom={1}>
              <Text color={color}>
                {icon} {s}
              </Text>
              {subBar}
            </Box>
          );
        })}
        {currentStep >= DEPLOYMENT_STEPS.length && (
          <Box marginTop={1} justifyContent="center">
            <Text color={LAYERS.green} bold>
              Strategy is Live!
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export const TradingDashboard = () => {
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, MONITORING, EXECUTING
  const [marketData, setMarketData] = useState<TickerData | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [trades, setTrades] = useState<TradeData[] | null>(null);
  const [tradeStats, setTradeStats] = useState({ count: 0, vol: 0 });

  const [isSelectingAgent, setIsSelectingAgent] = useState(true);

  const agentOptions = [
    { label: '1. @quant/volatility-master ($0.10/min)', value: 'volatility' },
    { label: '2. @crypto/sentiment-whale ($0.05/min)', value: 'sentiment' },
    { label: '3. @local/my-trained-model [Training...]', value: 'local' },
  ];

  const [panelState, setPanelState] = useState<{
    title: string;
    content: string | null;
    isLoading: boolean;
    progress?: number;
    orderPlan?: OrderPlan[];
    selectionItems?: { label: string; value: string }[];
  }>({
    title: 'AGENT MARKETPLACE',
    content: 'Selection of the best agents to make bitcoin strategies:',
    isLoading: false,
    selectionItems: agentOptions,
  });

  const [isDeploying, setIsDeploying] = useState(false);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const marketDataRef = useRef<TickerData | null>(null);
  const strategyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    marketDataRef.current = marketData;
  }, [marketData]);

  // Cleanup strategy interval on unmount
  useEffect(() => {
    return () => {
      if (strategyIntervalRef.current) clearInterval(strategyIntervalRef.current);
    };
  }, []);

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
      const lastReal = await getLatestRealPrice();

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

  const handleAgentSelect = (item: { label: string; value: string }) => {
    setIsSelectingAgent(false);

    // Extract agent handle from label (e.g., "1. @quant/volatility-master ($0.10/min)" -> "@quant/volatility-master")
    const agentNameMatch = item.label.match(new RegExp('(@[\\w/-]+)'));
    const agentName = agentNameMatch ? agentNameMatch[0] : item.label;

    setActiveAgent(agentName);

    setPanelState({
      title: 'AGENT MARKETPLACE',
      content: `Agent Selected: ${agentName}\n\nWaiting for command...`,
      isLoading: false,
      selectionItems: undefined,
    });
  };

  const runAgentStrategy = async (agentName?: string) => {
    const title = agentName ? `AGENT: ${agentName}` : 'AGENTS STRATEGY';

    // Clear any previous panel state & show loading
    setPanelState({
      title: title,
      content: null,
      isLoading: true,
    });

    // Fetch AI Strategy (simpler model)
    const currentPrice = marketDataRef.current?.lastPrice || '94000';
    const { text: strategyText, action: strategyAction } = await getAgentStrategy(currentPrice);

    // Update panel with strategy
    setPanelState({
      title: title,
      content: `Strategy: ${strategyText}\n\nAgent is initializing...`,
      isLoading: false,
    });

    setAgentStatus('MONITORING');
    // setTradeStats({ count: 0, vol: 0 }); // Keep stats accumulating
    const tradesList: TradeData[] = [];
    let count = 0;

    // T+4s: Simulate Price Drop (Extended monitoring phase)
    setTimeout(() => {
      // For simulation, we might want to force a drop in the displayed price
      // But our volatility loop will overwrite it.
      // For this demo, let's just let the agent "react" to the current price.
    }, 4000);

    // T+5s: Execute (Start execution phase)
    setTimeout(() => {
      setAgentStatus('EXECUTING');

      setPanelState({
        title: title,
        content: `Strategy: ${strategyText}\n\nAgent is testing the strategy...`,
        isLoading: true,
        progress: 0,
      });

      // Run for 5 seconds (50 ticks * 100ms) to complete 10s total duration
      const interval = setInterval(() => {
        strategyIntervalRef.current = interval;
        count++;
        const currentProgress = Math.min((count / 50) * 100, 100);

        if (count < 50) {
          setPanelState({
            title: title,
            content: `Strategy: ${strategyText}\n\nAgent is testing the strategy...`,
            isLoading: true,
            progress: currentProgress,
          });
        } else {
          clearInterval(interval);
          setAgentStatus('MONITORING');
          setPanelState({
            title: title,
            content: `Strategy: ${strategyText}\n\nExecution Complete. +${(Math.random() * 5 + 2).toFixed(2)}% PnL`,
            isLoading: false,
            // progress: 100, // Hide progress bar
          });
        }

        const currentRefPrice = marketDataRef.current
          ? parseFloat(marketDataRef.current.lastPrice)
          : INITIAL_PRICE_DATA.last;

        // Dynamic price logic based on strategy action
        // BUY: Ladder down (Buy the dip)
        // SELL: Scale out up (Sell into strength)
        const priceOffset = strategyAction === 'SELL' ? count * 0.5 : -count * 0.5;
        const executionPrice = (currentRefPrice + priceOffset).toFixed(2);

        const newTrade: TradeData = {
          id: Date.now() + count,
          time: Date.now(),
          isBuyerMaker: strategyAction === 'SELL', // true=SELL, false=BUY
          qty: '0.05',
          price: executionPrice,
        };
        tradesList.push(newTrade);

        setTradeStats((prev) => ({
          count: prev.count + 1,
          vol: prev.vol + 0.05,
        }));

        if (count >= 50) {
          clearInterval(interval);
          strategyIntervalRef.current = null;
          setAgentStatus('FINALIZING');
          writeTradeLog(tradesList);
          openFile('trades.csv');

          // Show success message only after completion
          setPanelState({
            title: title,
            content: `Strategy: ${strategyText}\n\nStrategy succesfully tested. Ready to deploy.`,
            isLoading: false,
            progress: 100,
          });

          setTimeout(() => {
            setAgentStatus('idle');
          }, 2000);
        }
      }, 100);
    }, 5000);
  };

  const handleCommand = async (cmd: string) => {
    // 1. Global Commands take precedence
    if (cmd.includes('deploy')) {
      setIsDeploying(true);
      return;
    }

    if (cmd.includes('agent') || cmd.includes('strategy')) {
      // If we already have an active agent, just run the strategy
      // unless the user explicitly asks to "select" or "change"
      if (activeAgent && !cmd.includes('select') && !cmd.includes('change')) {
        runAgentStrategy(activeAgent);
        return;
      }

      setActiveAgent(null); // Clear context
      setIsSelectingAgent(true);
      setPanelState({
        title: 'AGENT MARKETPLACE',
        content: 'Selection of the best agents to make bitcoin strategies:',
        isLoading: false,
        selectionItems: agentOptions,
      });
      return;
    }

    if (cmd.includes('predict')) {
      // setActiveAgent(null); // Optional: keep context or clear it? Clearing for clean slate.
      setIsSelectingAgent(false);
      setPanelState({ title: 'AI PREDICTION', content: null, isLoading: true });
      const result = await getBitcoinPrediction();
      setPanelState({
        title: 'AI PREDICTION',
        content: result.text,
        isLoading: false,
        orderPlan: result.orderPlan,
      });
      return;
    }

    if (cmd.includes('train') || cmd.includes('sandbox')) {
      setActiveAgent(null);
      setIsSelectingAgent(false);
      setPanelState({
        title: 'AGENT FOUNDRY',
        content: null,
        isLoading: true,
      });
      // Simulation of training process
      let epoch = 0;
      const trainingInterval = setInterval(() => {
        epoch++;
        const progress = (epoch / 20) * 100;
        setPanelState({
          title: 'TRAINING AGENT [SANDBOX]',
          content: `Running Synthetic Scenario: "Flash Crash 2024"\nEpoch: ${epoch}/20\nReward Function: +${(100 + epoch * 2.5).toFixed(1)}%`,
          isLoading: true,
          progress: progress,
        });

        if (epoch >= 20) {
          clearInterval(trainingInterval);
          setPanelState({
            title: 'TRAINING COMPLETE',
            content: `Agent Weights Optimized.\nValidation Score: 98.4%\n\nReady to publish to Marketplace.`,
            isLoading: false,
            progress: 100,
          });
        }
      }, 200);
      return;
    }

    // 2. Context-specific commands (Active Agent)
    // Only if no global command matched
    if (activeAgent) {
      runAgentStrategy(activeAgent);
      return;
    }
  };

  const onDeployComplete = useCallback(() => {
    setIsDeploying(false);
    setPanelState({
      title: 'AI PREDICTION',
      content: null,
      isLoading: false,
    });
  }, []);

  if (isDeploying) {
    return (
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height={30}
        width="100%"
      >
        <DeploymentOverlay onComplete={onDeployComplete} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%" borderStyle="single" borderColor="white">
      {/* Top Bar */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1} marginBottom={1}>
        <Text bold color={LAYERS.textMain}>
          CLI USE VM
        </Text>
        <Box>
          <Text color={LAYERS.green} bold>
            {' '}
            [SANDBOX ACTIVE]{' '}
          </Text>
          <Text color={LAYERS.textDim}> • tty0 • 80x24</Text>
        </Box>
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
          <AIPredictionPanel
            title={panelState.title}
            content={panelState.content}
            isLoading={panelState.isLoading}
            progress={panelState.progress}
            orderPlan={panelState.orderPlan}
            selectionItems={panelState.selectionItems}
            onSelect={handleAgentSelect}
          />
        </Box>

        {/* New Command Bar */}
        <Box marginTop={1}>
          <CommandBar
            onCommand={handleCommand}
            status={agentStatus}
            focused={!isSelectingAgent}
            placeholder={activeAgent ? `Message ${activeAgent}...` : undefined}
          />
        </Box>

        <Box marginTop={1} justifyContent="center">
          <Text color={LAYERS.textDim}>Press Ctrl+C to exit</Text>
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
  render(<TradingApp />, { alternateBuffer: true });
}
