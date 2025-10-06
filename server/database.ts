import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { getDefaultWorkingDirectory, expandPath, validateDirectory } from "./directoryUtils";

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  working_directory: string;
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

    // Migration: Add working_directory column if it doesn't exist
    this.migrateWorkingDirectory();
  }

  private migrateWorkingDirectory() {
    try {
      // Check if working_directory column exists
      const columns = this.db.query<{ name: string }, []>(
        "PRAGMA table_info(sessions)"
      ).all();

      const hasWorkingDirectory = columns.some(col => col.name === 'working_directory');

      if (!hasWorkingDirectory) {
        console.log('📦 Migrating database: Adding working_directory column');

        // Add the column
        this.db.run(`
          ALTER TABLE sessions
          ADD COLUMN working_directory TEXT NOT NULL DEFAULT ''
        `);

        // Update existing sessions with default directory
        const defaultDir = getDefaultWorkingDirectory();
        console.log('📦 Setting default working directory for existing sessions:', defaultDir);

        this.db.run(
          "UPDATE sessions SET working_directory = ? WHERE working_directory = ''",
          [defaultDir]
        );

        console.log('✅ Database migration completed successfully');
      } else {
        console.log('✅ working_directory column already exists');
      }
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    }
  }

  // Session operations
  createSession(title: string = "New Chat", workingDirectory?: string): Session {
    const id = randomUUID();
    const now = new Date().toISOString();

    let finalWorkingDir: string;

    if (workingDirectory) {
      // User provided a custom directory
      const expandedPath = expandPath(workingDirectory);
      const validation = validateDirectory(expandedPath);

      if (!validation.valid) {
        console.warn('⚠️  Invalid working directory provided:', validation.error);
        // Fall back to auto-generated chat folder
        finalWorkingDir = this.createChatDirectory(id);
      } else {
        finalWorkingDir = expandedPath;
      }
    } else {
      // Auto-generate chat folder: ~/Documents/agent-girl/chat-{short-id}/
      finalWorkingDir = this.createChatDirectory(id);
    }

    console.log('📁 Creating session with working directory:', finalWorkingDir);

    this.db.run(
      "INSERT INTO sessions (id, title, created_at, updated_at, working_directory) VALUES (?, ?, ?, ?, ?)",
      [id, title, now, now, finalWorkingDir]
    );

    return {
      id,
      title,
      created_at: now,
      updated_at: now,
      message_count: 0,
      working_directory: finalWorkingDir,
    };
  }

  private createChatDirectory(sessionId: string): string {
    // Create unique chat folder: ~/Documents/agent-girl/chat-{first-8-chars}/
    const shortId = sessionId.substring(0, 8);
    const baseDir = getDefaultWorkingDirectory();
    const chatDir = path.join(baseDir, `chat-${shortId}`);

    try {
      if (!fs.existsSync(chatDir)) {
        fs.mkdirSync(chatDir, { recursive: true });
        console.log('✅ Created chat directory:', chatDir);
      } else {
        console.log('📁 Chat directory already exists:', chatDir);
      }
    } catch (error) {
      console.error('❌ Failed to create chat directory:', error);
      // Fall back to base directory if creation fails
      return baseDir;
    }

    return chatDir;
  }

  getSessions(): Session[] {
    const sessions = this.db
      .query<Session, []>(
        `SELECT
          s.id,
          s.title,
          s.created_at,
          s.updated_at,
          s.working_directory,
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
          s.working_directory,
          COUNT(m.id) as message_count
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        WHERE s.id = ?
        GROUP BY s.id`
      )
      .get(sessionId);

    return session || null;
  }

  updateWorkingDirectory(sessionId: string, directory: string): boolean {
    try {
      // Expand and validate path
      const expandedPath = expandPath(directory);
      const validation = validateDirectory(expandedPath);

      if (!validation.valid) {
        console.error('❌ Invalid working directory:', validation.error);
        return false;
      }

      console.log('📁 Updating working directory:', {
        session: sessionId,
        directory: expandedPath
      });

      const result = this.db.run(
        "UPDATE sessions SET working_directory = ?, updated_at = ? WHERE id = ?",
        [expandedPath, new Date().toISOString(), sessionId]
      );

      const success = result.changes > 0;
      if (success) {
        console.log('✅ Working directory updated successfully');
      } else {
        console.warn('⚠️  No session found to update');
      }

      return success;
    } catch (error) {
      console.error('❌ Failed to update working directory:', error);
      return false;
    }
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

  renameFolderAndSession(sessionId: string, newFolderName: string): { success: boolean; error?: string; newPath?: string } {
    try {
      // Validate folder name (max 15 chars, lowercase + dashes only)
      if (newFolderName.length > 15) {
        return { success: false, error: 'Folder name must be 15 characters or less' };
      }
      if (!/^[a-z0-9-]+$/.test(newFolderName)) {
        return { success: false, error: 'Only lowercase letters, numbers, and dashes allowed' };
      }

      // Get current session
      const session = this.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      const oldPath = session.working_directory;
      const baseDir = getDefaultWorkingDirectory();
      const newPath = path.join(baseDir, newFolderName);

      // Check if new path already exists
      if (fs.existsSync(newPath) && newPath !== oldPath) {
        return { success: false, error: 'Folder name already exists' };
      }

      // Rename the directory
      if (oldPath !== newPath) {
        fs.renameSync(oldPath, newPath);
        console.log('✅ Renamed folder:', { from: oldPath, to: newPath });
      }

      // Update database
      const now = new Date().toISOString();
      const result = this.db.run(
        "UPDATE sessions SET title = ?, working_directory = ?, updated_at = ? WHERE id = ?",
        [newFolderName, newPath, now, sessionId]
      );

      if (result.changes > 0) {
        console.log('✅ Updated session in database');
        return { success: true, newPath };
      } else {
        // Rollback folder rename if database update failed
        if (oldPath !== newPath && fs.existsSync(newPath)) {
          fs.renameSync(newPath, oldPath);
        }
        return { success: false, error: 'Failed to update database' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to rename folder:', errorMessage);
      return { success: false, error: errorMessage };
    }
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
