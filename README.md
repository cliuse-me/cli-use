# cli-use

> Build terminal user interfaces with React

A React-based TUI (Terminal User Interface) framework inspired by [Ratatui](https://ratatui.rs), bringing component-driven architecture to terminal applications.

## 🎯 Overview

`cli-use` lets you build rich terminal applications using React patterns you already know. Component-based architecture, hooks for state management, and declarative UI - all running in the terminal.

## ✨ Features

- **React Components** - Build UIs with React components and JSX
- **Hooks** - useState, useEffect, useInput, useFocus, and more
- **Flexible Layouts** - Box, Flex, and Grid components for layouts
- **TypeScript** - Full type safety and excellent IDE support
- **React Reconciler** - Custom renderer optimized for terminal output
- **Input Handling** - Keyboard and mouse input capture
- **Performance** - Differential rendering and efficient updates

## 🚀 Quick Start

```bash
# Install
npm install cli-use

# Create a new app
mkdir my-tui-app
cd my-tui-app
npm init -y
npm install cli-use react

# Run an example
npm run example:counter
```

## 💡 Example

```tsx
import React, { useState } from 'react';
import { render, Box, Text, Button, useInput, useKey } from 'cli-use';

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  useKey('q', () => process.exit(0));
  useKey('up', () => setCount(c => c + 1));
  useKey('down', () => setCount(c => c - 1));

  return (
    <Box x={5} y={3}>
      <Text x={0} y={0} style={{ bold: true, fg: 2 }}>
        Counter Example
      </Text>
      <Text x={0} y={2} style={{ fg: 7 }}>
        Count: {count}
      </Text>
      <Text x={0} y={4} style={{ fg: 8 }}>
        Press ↑/↓ to change, q to quit
      </Text>
    </Box>
  );
};

render(<App />);
```

## 📦 Components

### Layout Components

- **`Box`** - Basic container with positioning
- **`Flex`** - Flexbox-like layout
- **`Grid`** - Grid layout system

### Display Components

- **`Text`** - Text rendering with styling
- **`Button`** - Clickable button
- **`Input`** - Text input field
- **`Progress`** - Progress bar

## 🪝 Hooks

- **`useInput`** - Capture keyboard input
- **`useKey`** - Listen for specific keys
- **`useFocus`** - Manage focus state
- **`useApp`** - Application lifecycle management
- **`useStdout`** - Terminal operations
- **`useInterval`** / **`useTimeout`** - Timers
- **`useList`** - List navigation
- **`useAppState`** - State machine for loading/success/error

## 🎨 Styling

```tsx
<Text style={{
  fg: 2,      // ANSI color (0-255)
  bg: 7,
  bold: true,
  dim: false,
  italic: true,
  underline: false
}}>
  Styled text
</Text>
```

## 🧰 Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test:unit

# Type check
npm run typecheck

# Run examples
npm run example:counter
npm run example:demo
npm run example:todos
```

## 📁 Project Structure

```
cli-use/
├── src/
│   ├── renderer/       # Terminal rendering engine
│   ├── reconciler/     # React reconciler integration
│   ├── components/     # UI components
│   ├── hooks/         # React hooks
│   ├── examples/      # Example apps
│   └── index.ts       # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT © 2025 cli-use contributors

## 🙏 Acknowledgments

- Inspired by [Ratatui](https://ratatui.rs) - the amazing Rust TUI library
- Built with [React Reconciler](https://www.npmjs.com/package/react-reconciler)
- Drawing inspiration from [Ink](https://github.com/vadimdemedes/ink)

---

**Note:** This project is currently in early development. The core architecture is in place, but full rendering capabilities are still being implemented. See the examples for the current state and what's possible.
