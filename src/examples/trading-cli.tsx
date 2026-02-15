import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

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
  textMain: '#ffffff',
  textSub: '#d0d0d0',
  textDim: '#707070',

  // Structure
  headerBar: '#555555',
  border: '#555555',
  commandBar: '#1a1a1a', // Match surrounding
};

const ORDER_BOOK = [
  { bid: '94,123.15', bSize: '1.59', ask: '94,125.41', aSize: '0.45' },
  { bid: '94,122.36', bSize: '1.40', ask: '94,126.07', aSize: '0.24' },
  { bid: '94,120.90', bSize: '1.34', ask: '94,127.29', aSize: '1.25' },
];

const PRICE_DATA = [
  { label: 'LAST', value: '94,135.77', color: LAYERS.textMain },
  { label: '24H%', value: '+1.82%', color: LAYERS.green },
  { label: 'HIGH', value: '94,812.11', color: LAYERS.textMain },
  { label: 'LOW', value: '93,504.77', color: LAYERS.textMain },
  { label: 'VOL', value: '2.25B', color: LAYERS.textMain },
  { label: 'SPREAD', value: '0.10', color: LAYERS.textMain },
];

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

const HeaderSection = () => (
  <Layer color={LAYERS.headerInfo}>
    <LayerHeader title="HEADER" rightLabel="active" />
    <Box flexDirection="column" paddingX={1} paddingY={0} marginTop={1} marginBottom={1}>
      <Text bold color={LAYERS.textMain}>
        [CLI_USE]
      </Text>
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

const PriceOverview = () => {
  const pairs = [];
  for (let i = 0; i < PRICE_DATA.length; i += 2) {
    pairs.push([PRICE_DATA[i], PRICE_DATA[i + 1]]);
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
      {ORDER_BOOK.map((row, i) => (
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

const CommandBar = () => {
  const [command, setCommand] = useState('');

  const handleSubmit = (val: string) => {
    setCommand(''); // Clear on submit for now
    // Logic to handle command would go here
  };

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
      <TextInput
        value={command}
        onChange={setCommand}
        onSubmit={handleSubmit}
        placeholder="Type a command..."
      />
      <Box flexGrow={1} />
      <Text color={LAYERS.textDim}>READY</Text>
    </Box>
  );
};

const App = () => {
  useInput((input, key) => {
    if (key.escape || (input === 'c' && key.ctrl)) {
      process.exit(0);
    }
  });

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor={LAYERS.border}
      backgroundColor="#1a1a1a" // Slightly lighter than pure black
      width={100} // Ensuring a fixed width for the "entire cli" feel, or "100%"
    >
      {/* Top Bar */}
      <Box flexDirection="row" justifyContent="space-between" paddingX={1} marginBottom={1}>
        <Text bold color={LAYERS.textMain}>
          CLI USE VM
        </Text>
        <Text color={LAYERS.textDim}>tty0 • 80x24</Text>
      </Box>

      {/* Layout Grid */}
      <Box flexDirection="column" gap={1}>
        <HeaderSection />

        <CandleChart />

        <Box flexDirection="row" gap={1}>
          <Box width="50%">
            <PriceOverview />
          </Box>
          <Box width="50%">
            <OrderBook />
          </Box>
        </Box>

        {/* New Command Bar */}
        <CommandBar />
      </Box>
    </Box>
  );
};

render(<App />);
