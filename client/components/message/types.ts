export interface BaseMessage {
  id: string;
  timestamp: string;
  type: 'user' | 'assistant' | 'system';
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  content: string;
  attachments?: FileAttachment[];
}

export interface ToolEdit {
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export interface TodoItem {
  content: string;
  activeForm: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown> & {
    file_path?: string;
    content?: string;
    offset?: number;
    limit?: number;
    old_string?: string;
    new_string?: string;
    replace_all?: boolean;
    edits?: ToolEdit[];
    command?: string;
    description?: string;
    run_in_background?: boolean;
    timeout?: number;
    pattern?: string;
    path?: string;
    glob?: string;
    output_mode?: string;
    '-i'?: boolean;
    '-n'?: boolean;
    multiline?: boolean;
    query?: string;
    allowed_domains?: string[];
    url?: string;
    prompt?: string;
    subagent_type?: string;
    todos?: TodoItem[];
    notebook_path?: string;
    cell_id?: string;
    cell_type?: string;
    edit_mode?: string;
    plan?: string;
  };
}

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export interface ToolResult {
  tool_use_id: string;
  type: 'tool_result';
  content: string;
}

export interface AssistantMessage extends BaseMessage {
  type: 'assistant';
  content: (TextBlock | ToolUseBlock | ThinkingBlock)[];
  metadata?: {
    id: string;
    model: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
      service_tier: string;
    };
  };
}

export interface SystemMessage extends BaseMessage {
  type: 'system';
  content: string;
  metadata?: {
    type: string;
    subtype?: string;
    cwd?: string;
    session_id?: string;
    tools?: string[];
    model?: string;
    mcp_servers?: string[];
    permissionMode?: string;
    slash_commands?: string[];
    apiKeySource?: string;
  };
}

export interface UserToolResultMessage extends BaseMessage {
  type: 'user';
  content: ToolResult[];
  metadata: {
    role: 'user';
    content: ToolResult[];
  };
}

export type Message = UserMessage | AssistantMessage | SystemMessage | UserToolResultMessage;

export interface QueryData {
  slug: string;
  title: string;
  description: string;
  prompt: string;
  status: string;
  createdAt: string;
  messages: Message[];
}