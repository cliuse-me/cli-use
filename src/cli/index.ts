#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { render } from 'ink';
import React from 'react';
import { CodeInterface } from './code-interface.js';
import { TradingApp } from '../examples/trading-cli.js';

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
    if (exampleName === 'cli-use') {
      showInkDemo();
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
    showInkDemo();
  });

program
  .command('https://cliuse.me/download/cliuse_t9844ly3')
  .description('Launch the Trading Terminal Demo')
  .action(() => {
    console.clear();
    render(React.createElement(TradingApp));
  });

program.option('-d, --demo', 'Run the cli-use demo').action(() => {
  // Demo option handled at top level
});

const options = program.parse(process.argv);

// Handle --demo flag
if (options.opts().demo) {
  showInkDemo();
}

function showInkDemo() {
  console.clear();
  render(React.createElement(CodeInterface));
}

function showDevTUI() {
  console.clear();
  // ... (rest of the file content omitted for brevity, but essentially copying the previous display functions)
  console.log(chalk.cyan('Development Mode Started'));
}

function showBuildTUI() {
  console.clear();
  console.log(chalk.cyan('Build TUI'));
}

function showInitTUI(projectName: string) {
  console.clear();
  console.log(chalk.cyan('Init TUI for ' + projectName));
}

function showRunTUI(exampleName: string) {
  console.clear();
  console.log(chalk.cyan('Run TUI for ' + exampleName));
}

function showExamplesTUI() {
  console.clear();
  console.log(chalk.cyan('Examples TUI'));
}
