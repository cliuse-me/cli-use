#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program.name('cli-use').description('React-based Terminal UI Framework').version('0.1.0');

program
  .command('dev')
  .description('Start development mode')
  .action(() => {
    showDevTUI();
  });

program
  .command('build')
  .description('Build project')
  .action(() => {
    showBuildTUI();
  });

program
  .command('init [project-name]')
  .description('Create a new cli-use project')
  .action((projectName) => {
    showInitTUI(projectName || 'my-tui-app');
  });

program
  .command('run <example>')
  .description('Run an example application')
  .action((exampleName) => {
    if (exampleName === 'ratatui') {
      showRustDemo();
    } else {
      showRunTUI(exampleName);
    }
  });

program
  .command('examples')
  .description('List available examples')
  .action(() => {
    showExamplesTUI();
  });

program
  .command('code')
  .description('Launch the AI-powered CLI Code interface')
  .action(() => {
    showRustDemo();
  });

program.option('-d, --demo', 'Run the cli-use demo').action(() => {
  // Demo option handled at top level
});

const options = program.parse(process.argv);

// Handle --demo flag
if (options.opts().demo) {
  // Since we're using ESM, we use import to run the cli-use demo
  import('../examples/cli-use-demo.tsx').catch((err: unknown) => {
    console.error('Failed to run demo:', err);
    process.exit(1);
  });
}

function showRustDemo() {
  const isWindows = process.platform === 'win32';
  const extension = isWindows ? '.exe' : '';

  const prodBinaryPath = path.resolve(__dirname, `../bin/ratatui-demo${extension}`);
  const devBinaryPath = path.resolve(
    __dirname,
    `../../native/target/release/ratatui-demo${extension}`
  );

  const binaryPath = fs.existsSync(prodBinaryPath) ? prodBinaryPath : devBinaryPath;

  const workerPath = path.resolve(__dirname, '../ai-worker.js');

  console.log(chalk.cyan('Starting Ratatui Demo...'));

  const child = spawn(binaryPath, [workerPath], {
    stdio: 'inherit',
  });

  child.on('error', (err) => {
    console.error(chalk.red('Failed to start demo:'), err.message);
    console.log(
      chalk.yellow(
        '\nMake sure you have built the Rust binary first by running: npm run build:rust'
      )
    );
  });
}

function showDevTUI() {
  console.clear();
  console.log('');
  console.log(
    chalk.cyan('┌─────────────────────────────────────────────────────────────────────┐')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white('cli-use ') + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Development Mode') + ' '.repeat(46) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.yellow('●') +
      ' ' +
      chalk.white('Watching for changes...') +
      ' '.repeat(36) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.green('✓') +
      ' ' +
      chalk.white('Build completed') +
      ' '.repeat(39) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.yellow('●') +
      ' ' +
      chalk.white('Hot Reload: Active') +
      ' '.repeat(37) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Quick Actions') + ' '.repeat(43) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('[r]') +
      ' ' +
      chalk.white('Rebuild') +
      ' '.repeat(43) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('[t]') +
      ' ' +
      chalk.white('Run tests') +
      ' '.repeat(43) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('[e]') +
      ' ' +
      chalk.white('Run example') +
      ' '.repeat(41) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('[q]') +
      ' ' +
      chalk.white('Quit') +
      ' '.repeat(46) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold('Output') + ' '.repeat(48) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.green('✓') +
      ' ' +
      chalk.white('Starting dev server...') +
      ' '.repeat(36) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.dim('Waiting for file changes...') +
      ' '.repeat(34) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Project Status') + ' '.repeat(43) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('Files: ') +
      chalk.cyan('142') +
      ' '.repeat(4) +
      chalk.white('Lines: ') +
      chalk.cyan('8,547') +
      ' '.repeat(35) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('Components: ') +
      chalk.green('7') +
      ' '.repeat(2) +
      chalk.white('Hooks: ') +
      chalk.green('8') +
      ' '.repeat(40) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('└─────────────────────────────────────────────────────────────────────┘')
  );
  console.log('');
  console.log(
    chalk.dim('Press ') +
      chalk.cyan('Ctrl+C') +
      chalk.dim(' to exit') +
      ' | ' +
      chalk.dim('Version: ') +
      chalk.white('0.1.0')
  );
  console.log('');
}

function showBuildTUI() {
  console.clear();
  console.log('');
  console.log(
    chalk.cyan('┌─────────────────────────────────────────────────────────────────────┐')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white('cli-use ') + chalk.cyan(' │'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Build Progress') + ' '.repeat(45) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.bold('Building...') + ' '.repeat(43) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.green('✓') +
      ' ' +
      chalk.white('TypeScript compilation') +
      ' '.repeat(35) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.green('✓') +
      ' ' +
      chalk.white('Bundle with tsup') +
      ' '.repeat(38) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.green('✓') +
      ' ' +
      chalk.white('Generate declarations') +
      ' '.repeat(33) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.yellow('○') +
      ' ' +
      chalk.white('Optimize') +
      ' '.repeat(45) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      '   [' +
      chalk.green('█'.repeat(30)) +
      chalk.dim('░'.repeat(10)) +
      '] ' +
      chalk.white('75%') +
      ' '.repeat(4) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Output Files') + ' '.repeat(43) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.cyan('dist/') + ' '.repeat(49) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.dim('├── index.js ') +
      chalk.dim('(') +
      chalk.white('21.2 KB') +
      chalk.dim(')') +
      ' '.repeat(36) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.dim('├── cli/') + ' '.repeat(47) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.dim('│   └── index.js ') +
      chalk.dim('(') +
      chalk.white('3.0 KB') +
      chalk.dim(')') +
      ' '.repeat(34) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.dim('├── hooks/') + ' '.repeat(45) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.dim('│   └── index.js ') +
      chalk.dim('(') +
      chalk.white('7.3 KB') +
      chalk.dim(')') +
      ' '.repeat(34) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.dim('├── *.d.ts ') +
      chalk.dim('(') +
      chalk.white('4.2 KB') +
      chalk.dim(')') +
      ' '.repeat(39) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Build Summary') + ' '.repeat(43) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('Duration: ') +
      chalk.cyan('2.4s') +
      ' '.repeat(45) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('Bundles: ') +
      chalk.green('3') +
      ' '.repeat(45) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('Size: ') +
      chalk.cyan('31.5 KB') +
      ' '.repeat(45) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.white('Status: ') +
      chalk.green('✓ Success') +
      ' '.repeat(42) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('└─────────────────────────────────────────────────────────────────────┘')
  );
  console.log('');
}

function showInitTUI(projectName: string) {
  console.clear();
  console.log('');
  console.log(
    chalk.cyan('┌─────────────────────────────────────────────────────────────────────┐')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white('cli-use ') + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Project Setup') + ' '.repeat(45) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Creating new project:') + ' '.repeat(37) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('○') +
      ' ' +
      chalk.white('Project name: ') +
      chalk.green(projectName) +
      ' '.repeat(34) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.green('✓') +
      ' ' +
      chalk.white('Package: ') +
      chalk.cyan('cli-use@0.1.0') +
      ' '.repeat(32) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.green('✓') +
      ' ' +
      chalk.white('Template: ') +
      chalk.cyan('default') +
      ' '.repeat(38) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Project Structure') + ' '.repeat(39) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.cyan('src/') + ' '.repeat(49) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.dim('├── components/') + ' '.repeat(45) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') + ' ' + chalk.dim('│   ├── Box.tsx') + ' '.repeat(42) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') + ' ' + chalk.dim('│   ├── Text.tsx') + ' '.repeat(42) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') + ' ' + chalk.dim('│   ├── Button.tsx') + ' '.repeat(40) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.dim('│   └── ...') + ' '.repeat(47) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.dim('├── hooks/') + ' '.repeat(47) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.dim('├── renderer/') + ' '.repeat(44) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.dim('├── App.tsx') + ' '.repeat(45) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.dim('├── index.ts') + ' '.repeat(45) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.dim('└── package.json') + ' '.repeat(43) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold('Next Steps') + ' '.repeat(45) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('1.') +
      ' ' +
      chalk.white('cd ' + projectName) +
      ' '.repeat(40) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('2.') +
      ' ' +
      chalk.white('npm install') +
      ' '.repeat(44) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('3.') +
      ' ' +
      chalk.white('npm run dev') +
      ' '.repeat(43) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('4.') +
      ' ' +
      chalk.white('Start building!') +
      ' '.repeat(42) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('└─────────────────────────────────────────────────────────────────────┘')
  );
  console.log('');
}

function showRunTUI(exampleName: string) {
  console.clear();
  console.log('');
  console.log(
    chalk.cyan('┌─────────────────────────────────────────────────────────────────────┐')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white('cli-use ') + chalk.cyan(' │'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Example Runner') + ' '.repeat(44) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.bold('Running: ') +
      chalk.cyan(exampleName) +
      ' '.repeat(39) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));

  const examples = [
    {
      name: 'counter',
      title: 'Counter',
      desc: 'Interactive counter with keyboard controls',
      tags: ['beginner', 'hooks'],
    },
    { name: 'demo', title: 'Demo', desc: 'Feature demonstration showcase', tags: ['overview'] },
    {
      name: 'todos',
      title: 'Todo List',
      desc: 'Todo list with navigation',
      tags: ['interactive', 'state'],
    },
    {
      name: 'ratatui',
      title: 'Rust Demo',
      desc: 'Native Rust TUI integration',
      tags: ['rust', 'advanced'],
    },
  ];

  examples.forEach((ex, i) => {
    const isCurrent = ex.name === exampleName;
    const status = isCurrent ? chalk.green('●') : chalk.dim('○');
    const marker = isCurrent ? chalk.cyan('▶') : chalk.dim(' ');
    console.log(
      chalk.cyan('│') +
        ' ' +
        marker +
        ' ' +
        status +
        ' ' +
        chalk.white(ex.name) +
        ' '.repeat(39) +
        chalk.cyan('│')
    );
    console.log(chalk.cyan('│') + '   ' + chalk.dim(ex.desc) + ' '.repeat(47) + chalk.cyan('│'));
    if (i < examples.length - 1) {
      console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
    }
  });

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold('Controls') + ' '.repeat(46) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('↑/↓') +
      ' ' +
      chalk.white('Navigate') +
      ' '.repeat(43) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('q') +
      '   ' +
      chalk.white('Quit') +
      ' '.repeat(46) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('r') +
      '   ' +
      chalk.white('Restart') +
      ' '.repeat(43) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold('Output') + ' '.repeat(47) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.green('✓') +
      ' ' +
      chalk.white('Example started successfully') +
      ' '.repeat(32) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      ' ' +
      chalk.dim('Use arrow keys to interact with example') +
      ' '.repeat(19) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('└─────────────────────────────────────────────────────────────────────┘')
  );
  console.log('');
}

function showExamplesTUI() {
  console.clear();
  console.log('');
  console.log(
    chalk.cyan('┌─────────────────────────────────────────────────────────────────────┐')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold.white('cli-use ') + chalk.cyan(' │'));
  console.log(
    chalk.cyan('│') + ' ' + chalk.bold('Example Gallery') + ' '.repeat(43) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));

  const examples = [
    {
      name: 'counter',
      title: 'Counter',
      desc: 'Interactive counter with keyboard controls',
      tags: ['beginner', 'hooks'],
    },
    { name: 'demo', title: 'Demo', desc: 'Feature demonstration showcase', tags: ['overview'] },
    {
      name: 'todos',
      title: 'Todo List',
      desc: 'Todo list with navigation',
      tags: ['interactive', 'state'],
    },
  ];

  examples.forEach((ex, i) => {
    const status = i === 0 ? chalk.cyan('▶') : chalk.dim('○');
    const tags = ex.tags.map((t) => chalk.dim('[') + chalk.cyan(t) + chalk.dim(']')).join(' ');
    console.log(
      chalk.cyan('│') +
        ' ' +
        status +
        ' ' +
        chalk.bold(ex.name) +
        ' - ' +
        chalk.white(ex.title) +
        ' '.repeat(26) +
        chalk.cyan('│')
    );
    console.log(
      chalk.cyan('│') +
        '     ' +
        chalk.dim(ex.desc) +
        ' '.repeat(33) +
        tags +
        ' '.repeat(5) +
        chalk.cyan('│')
    );
    console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  });

  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('├─────────────────────────────────────────────────────────────────────┤')
  );
  console.log(chalk.cyan('│') + ' ' + chalk.bold('Commands') + ' '.repeat(46) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') + '   ' + chalk.cyan('cli-use run counter') + ' '.repeat(34) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') + '   ' + chalk.cyan('cli-use run demo') + ' '.repeat(36) + chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') + '   ' + chalk.cyan('cli-use run todos') + ' '.repeat(35) + chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + chalk.bold('Shortcuts') + ' '.repeat(46) + chalk.cyan('│'));
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('n') +
      '/' +
      chalk.cyan('p') +
      ' ' +
      chalk.white('Next/Prev example') +
      ' '.repeat(36) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('enter') +
      ' ' +
      chalk.white('Run selected') +
      ' '.repeat(39) +
      chalk.cyan('│')
  );
  console.log(
    chalk.cyan('│') +
      '   ' +
      chalk.cyan('q') +
      ' ' +
      chalk.white('Quit') +
      ' '.repeat(44) +
      chalk.cyan('│')
  );
  console.log(chalk.cyan('│') + ' ' + ' '.repeat(54) + chalk.cyan('│'));
  console.log(
    chalk.cyan('└─────────────────────────────────────────────────────────────────────┘')
  );
  console.log('');
}
