import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';

const Counter = () => {
  const [count, setCount] = useState(0);

  useInput((input, key) => {
    if (key.escape || key.ctrl('c')) {
      process.exit(0);
    }
    if (key.return) {
      setCount(c => c + 1);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box borderStyle="double" borderColor="cyan" padding={1} marginBottom={1}>
        <Text bold color="magenta">
          ✨ cli-use Demo - Beautiful Terminal UIs (Ink)
        </Text>
      </Box>

      <Box borderStyle="single" borderColor="blue" padding={1} marginBottom={1}>
        <Box flexDirection="column" gap={1}>
          <Text bold>Features:</Text>
          <Text>• Cross-platform (macOS, Linux, Windows)</Text>
          <Text>• React-based components</Text>
          <Text>• Beautiful styling out of the box</Text>
          <Text>• TypeScript support</Text>
        </Box>
      </Box>

      <Box borderStyle="round" borderColor="green" padding={1} marginBottom={1}>
        <Box flexDirection="column" alignItems="center" gap={1}>
          <Text bold color="green">🔢 Interactive Counter</Text>
          <Text>Count: {count}</Text>
          <Text dim>Press Enter to increment, ESC to exit</Text>
        </Box>
      </Box>

      <Box>
        <Text dim color="gray">
          Built with ❤️  for beautiful terminal interfaces
        </Text>
      </Box>
    </Box>
  );
};

render(<Counter />);
