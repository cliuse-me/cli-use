# Full-Styled Demo Options for macOS

## The Problem

The `charsm` library (used for styled rendering) **does not support macOS** because it requires native dependencies that aren't compiled for macOS yet.

## Solutions

### Option 1: Use cli-use (Recommended) ⭐

**cli-use** is a React-based TUI library that works on all platforms including macOS.

**Installation:**

```bash
npm install cli-use
```

**Why it's great:**

- ✅ Cross-platform (macOS, Linux, Windows)
- ✅ React-based (matches your project's architecture)
- ✅ Actively maintained
- ✅ TypeScript support
- ✅ Rich component library (Box, Text, Flex, etc.)
- ✅ Hooks (useInput, useApp, useStdout)

**Resources:**

- npm: `npm install cli-use`

**Example:**

```tsx
import React from 'react';
import { render, Box, Text } from 'cli-use';

const App = () => (
  <Box borderStyle="round" padding={1}>
    <Text bold>Hello from cli-use!</Text>
  </Box>
);

render(<App />);
```

### Option 2: Use Blessed

**Blessed** is a mature curses-like library for Node.js that works on macOS.

**Installation:**

```bash
npm install blessed
```

**Resources:**

- GitHub: https://github.com/chjj/blessed
- npm: `npm install blessed`

### Option 3: Wait for Charsm macOS Support

The charsm library is actively developed. Check for updates:

- https://github.com/SfundoMhlungu/charsm

## Recommendation

For **cli-use**, I recommend using **React** because:

1. **Your project already uses React** - No architecture change needed
2. **Mature ecosystem**
3. **Active maintenance** - Regular updates and good community
4. **TypeScript-first** - Built with TS from the ground up
5. **Cross-platform** - Works identically on macOS, Linux, Windows

### Quick Comparison

| Feature             | cli-use | Blessed | Charsm |
| ------------------- | ------- | ------- | ------ |
| macOS Support       | ✅      | ✅      | ❌     |
| React-based         | ✅      | ❌      | ❌     |
| TypeScript          | ✅      | ✅      | ✅     |
| Actively Maintained | ✅      | ✅      | ✅     |
| WebAssembly         | ❌      | ❌      | ✅     |

## Next Steps

To add full-styled demo support for macOS:

1. **Add cli-use-based examples:**

   ```bash
   npm run demo:cli-use      # Full showcase
   ```

2. **Keep charsm for Linux/Windows:**
   - Charsm provides beautiful styling with WebAssembly performance
   - Can use React for macOS, Charsm for Linux/Windows
   - Runtime detection to choose renderer

3. **Example implementation:**
   See ALTERNATIVES_EXAMPLE.md for a working React demo
