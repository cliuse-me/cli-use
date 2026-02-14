import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';

// --- Constants ---
const CLAUDE_ORANGE = '#D97757';
const DARK_BG = '#151515';
const INPUT_BG = '#303030';
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

// --- Components ---

const Splash = ({ input, onEnter }: { input: string; onEnter: () => void }) => {
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
      <Box
        width="100%"
        borderStyle="single"
        borderColor="gray"
        paddingX={1}
        marginBottom={1}
        // Ink doesn't support background color on Box directly in the same way as Ratatui's block styles usually
        // But we can approximate the look.
      >
        <Text color="white" bold>
          {'>'} {input}_
        </Text>
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

const Chat = ({ messages, input }: { messages: any[]; input: string }) => {
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
      <Box borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
        <Text color="white" bold>
          {'>'} {input}_
        </Text>
      </Box>
    </Box>
  );
};

const App = () => {
  const [mode, setMode] = useState<'splash' | 'chat'>('splash');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<any[]>([
    { type: 'system', symbol: '*', content: 'Welcome to CLI CODE.' },
    { type: 'system', symbol: '*', content: 'I am ready to assist. Type anything to chat.' },
  ]);

  useInput((keyInput, key) => {
    if (key.escape || (key.ctrl && keyInput === 'c')) {
      process.exit(0);
    }

    if (key.return) {
      if (mode === 'splash') {
        setMode('chat');
        if (input.trim()) {
          // Submit initial message
          addMessage('user', '>', input);
          addMessage('thinking', '⏺', 'Processing...');
          setTimeout(() => {
            addMessage('output', '⎿', 'This is a simulated response in the cli-use demo.');
          }, 1000);
          setInput('');
        }
      } else {
        if (input.trim()) {
          addMessage('user', '>', input);
          addMessage('thinking', '⏺', 'Processing...');
          setTimeout(() => {
            addMessage('output', '⎿', 'This is a simulated response in the cli-use demo.');
          }, 1000);
          setInput('');
        }
      }
      return;
    }

    if (key.delete || key.backspace) {
      setInput((prev) => prev.slice(0, -1));
    } else {
      setInput((prev) => prev + keyInput);
    }
  });

  const addMessage = (type: string, symbol: string, content: string) => {
    setMessages((prev) => [...prev, { type, symbol, content }]);
  };

  return (
    <Box flexDirection="column" minHeight={20}>
      {mode === 'splash' ? (
        <Splash input={input} onEnter={() => setMode('chat')} />
      ) : (
        <Chat messages={messages} input={input} />
      )}
    </Box>
  );
};

render(<App />);
