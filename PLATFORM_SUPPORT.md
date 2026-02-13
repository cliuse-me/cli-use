# Platform Support

## ⚠️ Platform Compatibility

**Important:** The styling engine currently only supports:
- Linux ✅
- Windows ✅

**macOS (darwin) is NOT currently supported.** ❌

The styling engine uses native dependencies (FFI/N-API) that are platform-specific and don't yet have macOS binaries compiled.

## Options for macOS Users

### Option 1: Use Alternative Styling Libraries

For macOS users, consider these alternatives:

#### Ink + Ink styling
```bash
npm install ink @chalkistecie/color
```

#### Blessed/Contrib
```bash
npm install blessed blessed-contrib
```

#### Terminal-Kit
```bash
npm install terminal-kit
```

### Option 2: Run in Docker or Linux VM

You can run styled examples in a Linux container:

```bash
# Using Docker
docker run -it --rm node:20 bash
# Then install and run your app
```

### Option 3: Wait for macOS Support

The underlying styling package is actively developed. Check for updates for macOS support.

## Current Status

The styled renderer integration in cli-use is **ready to use** on Linux and Windows systems. All examples are set up and will work on supported platforms.

### Available Examples

Once on a supported platform, you can run:

```bash
npm run example:demo      # Full showcase
npm run example:counter   # Interactive counter
npm run example:todos     # Interactive todo list
```

## Platform Detection

To detect the platform in your code:

```typescript
import { createRendererWithPresets } from 'cli-use';

async function main() {
  if (process.platform === 'darwin') {
    console.log('Styled renderer is not available on macOS yet.');
    console.log('Please use Linux or Windows, or choose an alternative.');
    process.exit(1);
  }

  const renderer = await createRendererWithPresets();
  // ... your code
}
```

## Contributing

If you'd like to help add macOS support to the styling engine, please consider contributing to the upstream project.
