import { useEffect, useRef, useState, type RefObject } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";

export interface UseTerminalResult {
  terminal: Terminal | null;
  fitAddon: FitAddon | null;
  isConnected: boolean;
}

/**
 * Create an xterm.js Terminal, mount it into the given container ref,
 * and connect it to the backend WebSocket at /api/vault/terminal.
 */
export function useTerminal(
  containerRef: RefObject<HTMLDivElement | null>
): UseTerminalResult {
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "var(--font-mono), monospace",
      theme: {
        background: "#0d0e12",
        foreground: "#e3e2e8",
        cursor: "#bbc6e2",
        selectionBackground: "#343439",
        black: "#0d0e12",
        red: "#ffb4ab",
        green: "#a8d5ba",
        yellow: "#ffba38",
        blue: "#bbc6e2",
        magenta: "#ffb4a5",
        cyan: "#78839c",
        white: "#e3e2e8",
        brightBlack: "#44474c",
        brightRed: "#ffb4ab",
        brightGreen: "#a8d5ba",
        brightYellow: "#ffba38",
        brightBlue: "#bbc6e2",
        brightMagenta: "#ffb4a5",
        brightCyan: "#78839c",
        brightWhite: "#e3e2e8",
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(container);

    // Small delay so the container has layout dimensions before fitting
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch {
        // Container may not be visible yet
      }
    });

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect WebSocket
    const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = import.meta.env.DEV ? "localhost:8080" : location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/prototypes/research-workspace/vault/api/vault/terminal`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Send initial dimensions
      const resizePayload = JSON.stringify({
        cols: term.cols,
        rows: term.rows,
      });
      ws.send("\x01" + resizePayload);
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      term.write("\r\n\x1b[33m[Connection closed]\x1b[0m\r\n");
    };

    ws.onerror = () => {
      setIsConnected(false);
      term.write("\r\n\x1b[31m[Connection error]\x1b[0m\r\n");
    };

    // Terminal input -> WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Terminal resize -> WebSocket
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        const resizePayload = JSON.stringify({ cols, rows });
        ws.send("\x01" + resizePayload);
      }
    });

    return () => {
      ws.close();
      term.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      wsRef.current = null;
    };
  }, [containerRef]);

  return {
    terminal: terminalRef.current,
    fitAddon: fitAddonRef.current,
    isConnected,
  };
}
