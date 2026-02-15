import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import os from 'node:os';

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

const writeTradeLog = (trades: any[]) => {
  const header = 'TIMESTAMP,ACTION,ASSET,PRICE,AMOUNT,STATUS\n';
  const rows = trades
    .map((t) => `${t.timestamp},${t.action},${t.asset},${t.price},${t.amount},${t.status}`)
    .join('\n');
  fs.writeFileSync('trades.csv', header + rows);
};

// --- UI Components ---

// Updated Layer: Uses backgroundColor prop (now supported)
const Layer = ({ children, height, width, color }: any) => (
  <Box
    flexDirection="column"
    height={height}
    width={width}
    flexGrow={1}
    borderStyle="round"
    borderColor={LAYERS.border}
    backgroundColor={color}
  >
    {children}
  </Box>
);

// Updated LayerHeader: Uses backgroundColor
const LayerHeader = ({ title, rightLabel }: { title: string; rightLabel?: string }) => (
  <Box
    flexDirection="row"
    justifyContent="space-between"
    paddingX={1}
    paddingY={0}
    borderBottom
    borderStyle="single"
    borderColor={LAYERS.headerBar}
    backgroundColor={LAYERS.headerInfo}
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
  <Layer color={LAYERS.headerInfo}>
    <LayerHeader title="HEADER" rightLabel="active" />
    <Box flexDirection="column" paddingX={1} paddingY={0} marginTop={1} marginBottom={1}>
      <Box flexDirection="row" justifyContent="space-between">
        <Text bold color={LAYERS.textMain}>
          [CLI_USE]
        </Text>
        {/* Agent Status Widget */}
        {agentStatus !== 'idle' && (
          <Box>
            <Text color={agentStatus === 'EXECUTING' ? LAYERS.yellow : LAYERS.green} bold>
              [ ● Agent: {agentStatus} ]
            </Text>
            {tradeStats && tradeStats.count > 0 && (
              <Text color={LAYERS.textMain}>
                {' '}
                Trades: {tradeStats.count} | Vol: {tradeStats.vol.toFixed(2)} BTC
              </Text>
            )}
          </Box>
        )}
      </Box>
      <Box flexDirection="row" marginTop={1} gap={2}>
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

const ChartBar = ({ height, color, align }: any) => {
  // Robust rendering using text blocks
  const lines = Array.from({ length: height });
  const Bar = (
    <Box flexDirection="column">
      {lines.map((_, i) => (
        <Text key={i} color={color}>
          ██
        </Text>
      ))}
    </Box>
  );
  const Wick = (
    <Box width={2} height={1} justifyContent="center">
      <Text color={color}>│</Text>
    </Box>
  );

  return (
    <Box flexDirection="column" alignItems="center" marginX={1}>
      {align === 'bottom' ? (
        <>
          {Wick}
          {Bar}
        </>
      ) : (
        <>
          {Bar}
          {Wick}
        </>
      )}
    </Box>
  );
};

const CandleChart = () => {
  const leftHeights = [3, 5, 2, 6, 4, 3, 5, 2];
  const rightHeights = [4, 2, 5, 3, 6, 5, 4, 6];

  return (
    <Layer color={LAYERS.chart}>
      <LayerHeader title="CANDLE CHART" rightLabel="candles" />
      <Box flexDirection="row" height={12} paddingY={1} justifyContent="center" alignItems="center">
        {/* Bearish Side */}
        <Box width="45%" alignItems="flex-end" justifyContent="space-around" flexDirection="row">
          {leftHeights.map((h, i) => (
            <ChartBar key={i} height={h} color={LAYERS.red} align="bottom" />
          ))}
        </Box>

        {/* Center Gap/Line */}
        <Box
          width="10%"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          height="100%"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <Text key={i} color={LAYERS.border}>
              │
            </Text>
          ))}
        </Box>

        {/* Bullish Side */}
        <Box width="45%" alignItems="flex-start" justifyContent="space-around" flexDirection="row">
          {rightHeights.map((h, i) => (
            <ChartBar key={i} height={h} color={LAYERS.green} align="top" />
          ))}
        </Box>
      </Box>
      <Box flexDirection="row" justifyContent="space-between" paddingX={2} marginTop={-1}>
        <Text color={LAYERS.cyan}>LOW</Text>
        <Text color={LAYERS.cyan}>HIGH</Text>
      </Box>
    </Layer>
  );
};

const PriceOverview = ({ price }: { price: number }) => {
  const formattedPrice = price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Dynamic data based on price prop
  const priceData = [
    { label: 'LAST', value: formattedPrice, color: LAYERS.textMain },
    { label: '24H%', value: INITIAL_PRICE_DATA.change, color: LAYERS.green },
    { label: 'HIGH', value: INITIAL_PRICE_DATA.high, color: LAYERS.textMain },
    { label: 'LOW', value: INITIAL_PRICE_DATA.low, color: LAYERS.textMain },
    { label: 'VOL', value: INITIAL_PRICE_DATA.vol, color: LAYERS.textMain },
    { label: 'SPREAD', value: INITIAL_PRICE_DATA.spread, color: LAYERS.textMain },
  ];

  const pairs = [];
  for (let i = 0; i < priceData.length; i += 2) {
    pairs.push([priceData[i], priceData[i + 1]]);
  }

  return (
    <Layer color={LAYERS.priceTable}>
      <LayerHeader title="PRICE OVERVIEW" rightLabel="table" />
      <Box flexDirection="column" paddingX={1}>
        {pairs.map((pair, rowIndex) => (
          <Box
            key={rowIndex}
            flexDirection="row"
            marginBottom={0}
            borderBottom={rowIndex < pairs.length - 1}
            borderStyle="single"
            borderColor={LAYERS.border}
          >
            {pair.map((item, colIndex) =>
              item ? (
                <Box
                  key={colIndex}
                  width="50%"
                  flexDirection="row"
                  justifyContent="space-between"
                  paddingRight={colIndex === 0 ? 1 : 0}
                  paddingLeft={colIndex === 1 ? 1 : 0}
                  borderRight={colIndex === 0}
                  borderStyle="single"
                  borderColor={LAYERS.border}
                >
                  <Text color={LAYERS.textSub} bold>
                    {item.label}
                  </Text>
                  <Text color={item.color} bold>
                    {item.value}
                  </Text>
                </Box>
              ) : null
            )}
          </Box>
        ))}
      </Box>
    </Layer>
  );
};

const OrderBook = () => (
  <Layer color={LAYERS.orderBook}>
    <LayerHeader title="ORDER BOOK" rightLabel="depth" />

    {/* Header Row */}
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

    {/* Data Rows */}
    <Box flexDirection="column" paddingX={1}>
      {INITIAL_ORDER_BOOK.map((row, i) => (
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

// --- Main App ---

export const TradingApp = () => {
  // ... existing App component body
  return <Box>{/* ... */}</Box>;
};

import { fileURLToPath } from 'url';

// Only run if executing directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  render(<TradingApp />);
}
