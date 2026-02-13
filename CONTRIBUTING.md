# Contributing to cli-use

Thank you for your interest in contributing to cli-use! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/cli-use.git
cd cli-use

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm run test:unit
```

## 📁 Project Structure

```
cli-use/
├── src/
│   ├── renderer/       # Terminal rendering engine
│   ├── reconciler/     # React reconciler integration
│   ├── components/     # UI components
│   ├── hooks/         # React hooks
│   ├── utils/         # Utility functions
│   ├── constants/     # Constants and enums
│   ├── examples/      # Example applications
│   └── index.ts       # Main entry point
├── package.json
└── README.md
```

## 🧪 Testing

We use Vitest for testing and MSW (Mock Service Worker) for mocking external services.

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

## 📝 Code Style

We use ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

## 🤝 Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### PR Guidelines

- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Follow the existing code style

## 🐛 Bug Reports

When reporting bugs, please include:

- Node.js version
- Operating system
- Terminal emulator
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages (if any)

## 💡 Feature Requests

We welcome feature requests! Please:

- Check existing issues first
- Describe the use case clearly
- Provide examples if possible
- Consider if it fits the project scope

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
