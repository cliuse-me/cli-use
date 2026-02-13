# cli-use

> Build beautiful terminal user interfaces with Ink

A powerful TUI (Terminal User Interface) framework using **Ink** (React for CLIs). Create stunning terminal interfaces with tables, lists, markdown rendering, custom styles, and flex-like layouts.

## 🎯 Overview

`cli-use` lets you build beautiful terminal applications using **Ink** - the most popular React-based TUI framework. Create tables, lists, markdown rendering, custom styles, and flex-like layouts - all with React components you already know.

## ✨ Features

- **🎨 Beautiful Styling** - CSS-like properties for stunning interfaces
- **📊 Tables** - Render beautiful tables with borders, colors, and alignment
- **📝 Lists** - Create interactive lists with selection states and custom enumerators
- **📖 Markdown** - Render markdown with themes
- **📐 Layouts** - Flex-like horizontal/vertical layouts
- **🔧 TypeScript** - Full type safety and excellent IDE support
- **⚡ Cross-Platform** - Works on macOS, Linux, and Windows

## 🚀 Quick Start

```bash
# Install
npm install cli-use

# Run the demo
npm run example:ink-demo
```

## 💡 Examples

### Basic App

```tsx
import React from 'react';
import { render, Box, Text } from 'ink';

const App = () => (
  <Box borderStyle="round" padding={1}>
    <Text bold>Hello from cli-use!</Text>
  </Box>
);

render(<App />);
```

### Interactive Counter

```tsx
import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';

const Counter = () => {
  const [count, setCount] = useState(0);

  useInput((input, key) => {
    if (key.return) setCount(c => c + 1);
  });

  return (
    <Box>
      <Text>Count: {count}</Text>
      <Text dim>Press Enter to increment</Text>
    </Box>
  );
};

render(<Counter />);
```

## 📦 API

### Core Components

- **`Box`** - Container component for layout and styling
- **`Text`** - Text rendering with colors and styles
- **`render()`** - Render Ink apps to terminal
- **`useInput()`** - Handle keyboard input
- **`useApp()`** - App instance management

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

# Run demo
npm run example:ink-demo
```

## 📁 Project Structure

```
cli-use/
├── src/
│   ├── renderer/
│   │   └── terminal.ts          # Terminal handling
│   └── examples/
│   │   └── ink-demo.tsx        # Interactive demo
├── package.json
├── tsconfig.json
└── README.md
```

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT © 2025 cli-use contributors

---

**Built with ❤️ and Ink**
