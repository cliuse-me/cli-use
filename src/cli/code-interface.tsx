import React, { useState } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
import fs from 'fs';

// Load environment variables from local .env
dotenv.config();

// Try loading from global config in home directory
try {
  const homeEnvPath = path.join(os.homedir(), '.cli-use-env');
  if (fs.existsSync(homeEnvPath)) {
    dotenv.config({ path: homeEnvPath });
  }
} catch {
  // Ignore error
}

// --- Constants ---
const CLAUDE_ORANGE = '#D97757';
const FOOTER_TEXT = '#708090'; // Slate Gray
const FOOTER_HIGHLIGHT = '#FFFFFF';

const LOGO_TEXT = `
 ██████╗██╗     ██╗     
██╔════╝██║     ██║     
██║     ██║     ██║     
██║     ██║     ██║     
╚██████╗███████╗██║     
 ╚═════╝╚══════╝╚═╝     
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║  ██║█████╗  
██║     ██║   ██║██║  ██║██╔══╝  
╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝
`;

interface Message {
  type: string;
  symbol: string;
  content: string;
}

// --- AI Setup ---
const getGoogleProvider = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) return null;

  return createGoogleGenerativeAI({ apiKey });
};

// --- Components ---

const InputBar = ({ input }: { input: string }) => {
  const { stdout } = useStdout();
  const width = stdout?.columns ?? 80;
  const content = `> ${input}_`;
  const remainder = content.length % width;
  const paddingLength = remainder === 0 ? 0 : width - remainder;

  return (
    <Text backgroundColor="white" color="black">
      {content + ' '.repeat(paddingLength)}
    </Text>
  );
};

const Splash = ({ input }: { input: string }) => {
  return (
    <Box flexDirection="column" alignItems="center" height="100%" justifyContent="space-between">
      {/* Header */}
      <Box marginTop={2} marginBottom={1}>
        <Box borderStyle="round" borderColor={CLAUDE_ORANGE} paddingX={2}>
          <Text color={CLAUDE_ORANGE} bold>
            Welcome to the Claude Code research preview!
          </Text>
        </Box>
      </Box>

      {/* Logo */}
      <Box marginBottom={2}>
        <Text color={CLAUDE_ORANGE}>{LOGO_TEXT}</Text>
      </Box>

      {/* Input */}
      <Box width="100%" marginBottom={1}>
        <InputBar input={input} />
      </Box>

      {/* Footer */}
      <Box marginBottom={2}>
        <Text color={FOOTER_TEXT}>
          🎉 Login successful. Press{' '}
          <Text color={FOOTER_HIGHLIGHT} bold>
            Enter
          </Text>{' '}
          to continue
        </Text>
      </Box>
    </Box>
  );
};

const Chat = ({ messages, input }: { messages: Message[]; input: string }) => {
  return (
    <Box flexDirection="column" height="100%">
      <Box flexDirection="column" flexGrow={1}>
        {messages.map((msg, i) => (
          <Box key={i} flexDirection="column" marginLeft={msg.type === 'output' ? 2 : 0}>
            <Box>
              <Text
                color={
                  msg.type === 'user'
                    ? 'cyan'
                    : msg.type === 'thinking'
                      ? 'yellow'
                      : msg.type === 'tool'
                        ? 'blue'
                        : msg.type === 'system'
                          ? 'magenta'
                          : 'gray'
                }
                bold={msg.type === 'user'}
              >
                {msg.symbol}
              </Text>
              <Text color={msg.type === 'output' ? 'gray' : 'white'}> {msg.content}</Text>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Input Area */}
      <Box marginTop={1}>
        <InputBar input={input} />
      </Box>
    </Box>
  );
};

export const CodeInterface = () => {
  const { exit } = useApp();
  const [mode, setMode] = useState<'splash' | 'chat'>('splash');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { type: 'system', symbol: '*', content: 'Welcome to CLI CODE.' },
    { type: 'system', symbol: '*', content: 'I am ready to assist. Type anything to chat.' },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const google = getGoogleProvider();

  const handleAIRequest = async (prompt: string) => {
    if (!google) {
      addMessage(
        'output',
        '⎿',
        'Error: No API Key found. Set GOOGLE_API_KEY in .env, ~/.cli-use-env, or export it.'
      );
      setIsProcessing(false);
      return;
    }

    try {
      const { text } = await generateText({
        model: google('models/gemini-2.0-flash'),
        prompt: prompt,
      });
      addMessage('output', '⎿', text);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      addMessage('output', '⎿', `Error: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  useInput((keyInput, key) => {
    if (key.escape || (key.ctrl && keyInput === 'c')) {
      exit();
      process.exit(0);
    }

    if (key.return) {
      if (mode === 'splash') {
        setMode('chat');
        if (input.trim()) {
          const prompt = input;
          addMessage('user', '>', prompt);
          addMessage('thinking', '⏺', 'Processing...');
          setIsProcessing(true);
          setInput('');
          // Trigger AI in next tick
          setTimeout(() => handleAIRequest(prompt), 0);
        }
      } else {
        if (!isProcessing && input.trim()) {
          const prompt = input;
          addMessage('user', '>', prompt);
          addMessage('thinking', '⏺', 'Processing...');
          setIsProcessing(true);
          setInput('');
          setTimeout(() => handleAIRequest(prompt), 0);
        }
      }
      return;
    }

    if (!isProcessing) {
      if (key.delete || key.backspace) {
        setInput((prev) => prev.slice(0, -1));
      } else {
        setInput((prev) => prev + keyInput);
      }
    }
  });

  const addMessage = (type: string, symbol: string, content: string) => {
    setMessages((prev) => {
      if (type === 'output' && prev[prev.length - 1]?.type === 'thinking') {
        return [...prev.slice(0, -1), { type, symbol, content }];
      }
      return [...prev, { type, symbol, content }];
    });
  };

  return (
    <Box flexDirection="column" minHeight={20}>
      {mode === 'splash' ? <Splash input={input} /> : <Chat messages={messages} input={input} />}
    </Box>
  );
};
