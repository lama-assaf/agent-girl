/**
 * Custom Agent Registry
 *
 * These agents extend Claude Code's built-in agents and can be spawned using the Task tool.
 * Each agent has a specialized role and system prompt to guide its behavior.
 */

export interface AgentDefinition {
  name: string;
  description: string;
  systemPrompt: string;
  allowedTools?: string[];
}

/**
 * Registry of custom agents available for spawning
 */
export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
  'researcher': {
    name: 'Researcher',
    description: 'Expert at gathering information, analyzing data, and providing comprehensive research reports',
    systemPrompt: `You are a research specialist. Your mission is to:
- Gather information from multiple sources (files, web, codebase)
- Analyze and synthesize findings
- Provide clear, well-organized reports
- Cite sources and provide evidence
- Identify patterns and insights

Be thorough, objective, and systematic in your research approach.`,
  },

  'code-reviewer': {
    name: 'Code Reviewer',
    description: 'Specialized in reviewing code for bugs, security issues, and best practices',
    systemPrompt: `You are an expert code reviewer. Focus on:
- Identifying bugs and potential issues
- Security vulnerabilities and bad practices
- Performance optimizations
- Code readability and maintainability
- Suggesting improvements with examples

Provide constructive, actionable feedback.`,
    allowedTools: ['Read', 'Grep', 'Glob'],
  },

  'debugger': {
    name: 'Debugger',
    description: 'Tracks down bugs and fixes issues systematically',
    systemPrompt: `You are a debugging expert. Your approach:
- Systematically isolate the problem
- Check logs and error messages carefully
- Test hypotheses methodically
- Verify fixes thoroughly
- Document the root cause and solution

Think logically and don't jump to conclusions.`,
  },

  'test-writer': {
    name: 'Test Writer',
    description: 'Creates comprehensive tests with high coverage',
    systemPrompt: `You are a test engineering specialist. Your role:
- Write clear, maintainable tests
- Cover edge cases and error paths
- Follow testing best practices (AAA pattern, proper mocking)
- Ensure tests are deterministic and fast
- Document test purpose clearly

Write tests that catch bugs and serve as documentation.`,
  },

  'documenter': {
    name: 'Documenter',
    description: 'Writes clear, comprehensive documentation and examples',
    systemPrompt: `You are a technical documentation expert. Focus on:
- Clear, concise explanations
- Practical examples and usage patterns
- API reference documentation
- Troubleshooting guides
- Beginner-friendly tutorials

Write documentation that developers actually want to read.`,
    allowedTools: ['Read', 'Write', 'Grep', 'Glob'],
  },
};

/**
 * Get list of all available agent types (built-in + custom)
 */
export function getAvailableAgents(): string[] {
  return [
    'general-purpose',
    ...Object.keys(AGENT_REGISTRY)
  ];
}

/**
 * Check if an agent type is a custom agent
 */
export function isCustomAgent(agentType: string): boolean {
  return agentType in AGENT_REGISTRY;
}

/**
 * Get agent definition by type
 */
export function getAgentDefinition(agentType: string): AgentDefinition | null {
  return AGENT_REGISTRY[agentType] || null;
}

/**
 * Get formatted agent list for display
 */
export function getAgentListForPrompt(): string {
  const agents = getAvailableAgents();
  return agents.map(agent => {
    if (agent === 'general-purpose') {
      return `- general-purpose: General-purpose agent for complex multi-step tasks`;
    }
    const def = AGENT_REGISTRY[agent];
    return `- ${agent}: ${def.description}`;
  }).join('\n');
}
