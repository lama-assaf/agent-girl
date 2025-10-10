/**
 * SessionStreamManager - Manages per-session SDK streams for multi-turn conversations
 * Based on Microsoft VSCode and chatcode patterns
 */

import type { SDKUserMessage } from "@anthropic-ai/claude-agent-sdk/sdkTypes";
import type { Query } from "@anthropic-ai/claude-agent-sdk";
import type { ServerWebSocket } from "bun";
import { AsyncQueue } from "./utils/AsyncQueue";

interface SessionStream {
  messageQueue: AsyncQueue<string>;
  sdkQuery: Query | null;
  abortController: AbortController;
  sessionId: string;
  createdAt: number;
  lastActivityAt: number;
  activeWebSocket: ServerWebSocket<any> | null;
}

export class SessionStreamManager {
  private streams = new Map<string, SessionStream>();
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CONCURRENT_SESSIONS = 100;
  private cleanupInterval: Timer | null = null;

  constructor() {
    // Start cleanup interval for idle sessions
    this.startCleanupInterval();
  }

  /**
   * Get or create AsyncIterable stream for a session
   */
  getOrCreateStream(sessionId: string): AsyncIterable<SDKUserMessage> {
    if (!this.streams.has(sessionId)) {
      // Check session limit
      if (this.streams.size >= this.MAX_CONCURRENT_SESSIONS) {
        console.warn(`⚠️ Max sessions (${this.MAX_CONCURRENT_SESSIONS}) reached, cleaning up oldest`);
        this.cleanupOldestSession();
      }

      const messageQueue = new AsyncQueue<string>();
      const abortController = new AbortController();

      this.streams.set(sessionId, {
        messageQueue,
        sdkQuery: null,
        abortController,
        sessionId,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
        activeWebSocket: null,
      });

      console.log(`🟢 Stream created: ${sessionId.substring(0, 8)}`);
    }

    return this.createMessageIterator(sessionId);
  }

  /**
   * Send message to session stream
   */
  sendMessage(sessionId: string, content: string): void {
    const stream = this.streams.get(sessionId);
    if (!stream) {
      throw new Error(`Session stream not found: ${sessionId}`);
    }

    stream.lastActivityAt = Date.now();
    stream.messageQueue.enqueue(content);
    console.log(`📬 Message queued: ${sessionId.substring(0, 8)} (queue size: ${stream.messageQueue.size})`);
  }

  /**
   * Register SDK query for session
   */
  registerQuery(sessionId: string, query: Query): void {
    const stream = this.streams.get(sessionId);
    if (stream) {
      stream.sdkQuery = query;
      console.log(`🔗 SDK query registered: ${sessionId.substring(0, 8)}`);
    }
  }

  /**
   * Update active WebSocket for session (on reconnection or first connect)
   */
  updateWebSocket(sessionId: string, ws: ServerWebSocket<any>): void {
    const stream = this.streams.get(sessionId);
    if (stream) {
      const wasNull = stream.activeWebSocket === null;
      stream.activeWebSocket = ws;
      if (wasNull) {
        console.log(`🔌 WebSocket connected: ${sessionId.substring(0, 8)}`);
      } else {
        console.log(`🔄 WebSocket reconnected: ${sessionId.substring(0, 8)}`);
      }
    }
  }

  /**
   * Get active WebSocket for session
   */
  getWebSocket(sessionId: string): ServerWebSocket<any> | null {
    return this.streams.get(sessionId)?.activeWebSocket || null;
  }

  /**
   * Safe send to WebSocket (checks readyState)
   */
  safeSend(sessionId: string, data: string): boolean {
    const stream = this.streams.get(sessionId);
    if (!stream || !stream.activeWebSocket) {
      return false;
    }

    try {
      // Check if WebSocket is open
      if (stream.activeWebSocket.readyState === 1) { // 1 = OPEN
        stream.activeWebSocket.send(data);
        return true;
      } else {
        // Silently skip - WebSocket closed/closing is normal (user switched tabs, etc.)
        return false;
      }
    } catch (error) {
      console.error(`❌ WebSocket send error: ${sessionId.substring(0, 8)}`, error);
      return false;
    }
  }

  /**
   * Clean up session stream
   */
  cleanupSession(sessionId: string, reason: string = 'manual'): void {
    const stream = this.streams.get(sessionId);
    if (!stream) return;

    console.log(`🗑️ Stream cleanup: ${sessionId.substring(0, 8)} (reason: ${reason})`);

    // Abort SDK subprocess
    stream.abortController.abort();

    // Complete message queue (stops iteration)
    stream.messageQueue.complete();

    // Remove from registry
    this.streams.delete(sessionId);
  }

  /**
   * Check if session has active stream
   */
  hasStream(sessionId: string): boolean {
    return this.streams.has(sessionId);
  }

  /**
   * Get session count
   */
  get sessionCount(): number {
    return this.streams.size;
  }

  /**
   * Create async iterator for session messages
   */
  private async *createMessageIterator(sessionId: string): AsyncIterable<SDKUserMessage> {
    const stream = this.streams.get(sessionId);
    if (!stream) {
      throw new Error(`Session stream not found: ${sessionId}`);
    }

    try {
      for await (const content of stream.messageQueue) {
        stream.lastActivityAt = Date.now();

        console.log(`📤 Message yielded: ${sessionId.substring(0, 8)}`);

        yield {
          type: 'user',
          message: {
            role: 'user',
            content: content,
          },
          session_id: sessionId,
          parent_tool_use_id: null,
        };
      }
    } catch (error) {
      console.error(`❌ Stream error: ${sessionId.substring(0, 8)}`, error);
      this.cleanupSession(sessionId, 'error');
    }
  }

  /**
   * Start cleanup interval for idle sessions
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [sessionId, stream] of Array.from(this.streams.entries())) {
        const idleTime = now - stream.lastActivityAt;
        if (idleTime > this.SESSION_TIMEOUT_MS) {
          console.log(`⏱️ Session timeout: ${sessionId.substring(0, 8)} (idle: ${Math.floor(idleTime / 1000)}s)`);
          this.cleanupSession(sessionId, 'timeout');
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Clean up oldest session by creation time
   */
  private cleanupOldestSession(): void {
    let oldestSessionId: string | null = null;
    let oldestTime = Infinity;

    for (const [sessionId, stream] of Array.from(this.streams.entries())) {
      if (stream.createdAt < oldestTime) {
        oldestTime = stream.createdAt;
        oldestSessionId = sessionId;
      }
    }

    if (oldestSessionId) {
      this.cleanupSession(oldestSessionId, 'max_sessions_reached');
    }
  }

  /**
   * Shutdown all sessions (for graceful server shutdown)
   */
  shutdown(): void {
    console.log(`🛑 Shutting down ${this.streams.size} session streams`);

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    for (const sessionId of Array.from(this.streams.keys())) {
      this.cleanupSession(sessionId, 'server_shutdown');
    }
  }
}

// Singleton instance
export const sessionStreamManager = new SessionStreamManager();
