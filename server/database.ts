import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

class SessionDatabase {
  private db: Database;

  constructor(dbPath: string = "./data/sessions.db") {
    this.db = new Database(dbPath, { create: true });
    this.initialize();
  }

  private initialize() {
    // Create sessions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create messages table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster queries
    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_id
      ON messages(session_id)
    `);
  }

  // Session operations
  createSession(title: string = "New Chat"): Session {
    const id = randomUUID();
    const now = new Date().toISOString();

    this.db.run(
      "INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [id, title, now, now]
    );

    return {
      id,
      title,
      created_at: now,
      updated_at: now,
      message_count: 0,
    };
  }

  getSessions(): Session[] {
    const sessions = this.db
      .query<Session, []>(
        `SELECT
          s.id,
          s.title,
          s.created_at,
          s.updated_at,
          COUNT(m.id) as message_count
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        GROUP BY s.id
        ORDER BY s.updated_at DESC`
      )
      .all();

    return sessions;
  }

  getSession(sessionId: string): Session | null {
    const session = this.db
      .query<Session, [string]>(
        `SELECT
          s.id,
          s.title,
          s.created_at,
          s.updated_at,
          COUNT(m.id) as message_count
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        WHERE s.id = ?
        GROUP BY s.id`
      )
      .get(sessionId);

    return session || null;
  }

  deleteSession(sessionId: string): boolean {
    const result = this.db.run("DELETE FROM sessions WHERE id = ?", [sessionId]);
    return result.changes > 0;
  }

  renameSession(sessionId: string, newTitle: string): boolean {
    const now = new Date().toISOString();
    const result = this.db.run(
      "UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?",
      [newTitle, now, sessionId]
    );
    return result.changes > 0;
  }

  // Message operations
  addMessage(
    sessionId: string,
    type: 'user' | 'assistant',
    content: string
  ): SessionMessage {
    const id = randomUUID();
    const timestamp = new Date().toISOString();

    this.db.run(
      "INSERT INTO messages (id, session_id, type, content, timestamp) VALUES (?, ?, ?, ?, ?)",
      [id, sessionId, type, content, timestamp]
    );

    // Auto-generate title from first user message
    if (type === 'user') {
      const session = this.getSession(sessionId);
      if (session && session.title === 'New Chat') {
        // Generate title from first user message (max 60 chars)
        let title = content.trim().substring(0, 60);
        if (content.length > 60) {
          title += '...';
        }
        this.renameSession(sessionId, title);
      }
    }

    // Update session's updated_at
    this.db.run("UPDATE sessions SET updated_at = ? WHERE id = ?", [
      timestamp,
      sessionId,
    ]);

    return {
      id,
      session_id: sessionId,
      type,
      content,
      timestamp,
    };
  }

  getSessionMessages(sessionId: string): SessionMessage[] {
    const messages = this.db
      .query<SessionMessage, [string]>(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC"
      )
      .all(sessionId);

    return messages;
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
export const sessionDb = new SessionDatabase();
