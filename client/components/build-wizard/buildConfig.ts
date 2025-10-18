/**
 * Agent Girl - Modern chat interface for Claude Agent SDK
 * Copyright (C) 2025 KenKai
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { ReactNode } from 'react';

export interface FeatureOption {
  id: string;
  name: string;
  description: string;
  configOptions?: ConfigOption[];
}

export interface ConfigOption {
  id: string;
  label: string;
  type: 'select' | 'toggle';
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
  gradient: string;
  command: string;
  commandFlags?: Record<string, (value: string | boolean | number) => string>;
  features: FeatureOption[];
}

/**
 * Project Templates Configuration
 *
 * Each template defines:
 * - Basic info (name, description, icon, gradient)
 * - Scaffolding command (e.g., npx create-next-app@latest)
 * - Available features (auth, database, styling, etc.)
 * - Configuration options per feature
 */
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'nextjs',
    name: 'Next.js App',
    description: 'Full-stack React framework with App Router',
    icon: null, // Will be set in component
    gradient: 'linear-gradient(90deg, #A8C7FA 0%, #DAEEFF 25%, #ffffff 50%, #DAEEFF 75%, #A8C7FA 100%)',
    command: 'npx create-next-app@latest',
    commandFlags: {
      typescript: () => '--typescript',
      tailwind: () => '--tailwind',
      appRouter: () => '--app',
      srcDir: () => '--src-dir',
      eslint: () => '--eslint',
    },
    features: [
      {
        id: 'auth',
        name: 'Authentication',
        description: 'Add user authentication to your app',
        configOptions: [
          {
            id: 'authProvider',
            label: 'Auth Provider',
            type: 'select',
            options: [
              { value: 'nextauth', label: 'NextAuth.js' },
              { value: 'clerk', label: 'Clerk' },
              { value: 'supabase', label: 'Supabase Auth' },
            ],
            defaultValue: 'nextauth',
          },
        ],
      },
      {
        id: 'database',
        name: 'Database',
        description: 'Connect a database to your app',
        configOptions: [
          {
            id: 'dbType',
            label: 'Database',
            type: 'select',
            options: [
              { value: 'postgresql', label: 'PostgreSQL' },
              { value: 'sqlite', label: 'SQLite' },
              { value: 'mysql', label: 'MySQL' },
            ],
            defaultValue: 'postgresql',
          },
          {
            id: 'orm',
            label: 'ORM',
            type: 'select',
            options: [
              { value: 'prisma', label: 'Prisma' },
              { value: 'drizzle', label: 'Drizzle ORM' },
            ],
            defaultValue: 'prisma',
          },
        ],
      },
      {
        id: 'styling',
        name: 'UI Components',
        description: 'Add pre-built UI component library',
        configOptions: [
          {
            id: 'uiLibrary',
            label: 'Component Library',
            type: 'select',
            options: [
              { value: 'shadcn', label: 'shadcn/ui' },
              { value: 'mui', label: 'Material-UI' },
              { value: 'chakra', label: 'Chakra UI' },
            ],
            defaultValue: 'shadcn',
          },
        ],
      },
      {
        id: 'api',
        name: 'API Layer',
        description: 'Type-safe API integration',
        configOptions: [
          {
            id: 'apiType',
            label: 'API Type',
            type: 'select',
            options: [
              { value: 'trpc', label: 'tRPC' },
              { value: 'rest', label: 'REST API Routes' },
              { value: 'graphql', label: 'GraphQL' },
            ],
            defaultValue: 'trpc',
          },
        ],
      },
      {
        id: 'env-validation',
        name: 'Environment Variables',
        description: 'Type-safe env validation with @t3-oss/env-nextjs',
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, Husky git hooks',
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Complete testing setup',
        configOptions: [
          {
            id: 'testingTools',
            label: 'Testing Tools',
            type: 'select',
            options: [
              { value: 'vitest-playwright', label: 'Vitest + Playwright' },
              { value: 'jest-playwright', label: 'Jest + Playwright' },
              { value: 'vitest-only', label: 'Vitest only' },
            ],
            defaultValue: 'vitest-playwright',
          },
        ],
      },
      {
        id: 'error-tracking',
        name: 'Error Tracking',
        description: 'Sentry for production error monitoring',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Privacy-focused analytics',
        configOptions: [
          {
            id: 'analyticsProvider',
            label: 'Analytics Provider',
            type: 'select',
            options: [
              { value: 'posthog', label: 'PostHog' },
              { value: 'plausible', label: 'Plausible' },
              { value: 'umami', label: 'Umami' },
            ],
            defaultValue: 'posthog',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Vercel deployment configuration',
      },
    ],
  },
  {
    id: 'chrome-wxt',
    name: 'Chrome Extension (WXT)',
    description: 'Modern Chrome extension with React/Vue/Svelte',
    icon: null,
    gradient: 'linear-gradient(90deg, #A8FAC7 0%, #DAFFEE 25%, #ffffff 50%, #DAFFEE 75%, #A8FAC7 100%)',
    command: 'npx wxt@latest init',
    commandFlags: {
      template: (framework: string | boolean | number) => `--template ${String(framework)}`,
      packageManager: (pm: string | boolean | number) => `--pm ${String(pm)}`,
    },
    features: [
      {
        id: 'framework',
        name: 'Framework',
        description: 'Choose your UI framework',
        configOptions: [
          {
            id: 'uiFramework',
            label: 'Framework',
            type: 'select',
            options: [
              { value: 'react', label: 'React' },
              { value: 'vue', label: 'Vue 3' },
              { value: 'svelte', label: 'Svelte' },
              { value: 'vanilla', label: 'Vanilla JS' },
            ],
            defaultValue: 'react',
          },
        ],
      },
      {
        id: 'popup',
        name: 'Popup UI',
        description: 'Extension popup interface',
      },
      {
        id: 'content-script',
        name: 'Content Script',
        description: 'Inject scripts into web pages',
      },
      {
        id: 'background',
        name: 'Background Service',
        description: 'Service worker for background tasks',
      },
      {
        id: 'styling',
        name: 'Styling',
        description: 'CSS framework',
        configOptions: [
          {
            id: 'cssFramework',
            label: 'CSS Framework',
            type: 'select',
            options: [
              { value: 'tailwind', label: 'Tailwind CSS' },
              { value: 'unocss', label: 'UnoCSS' },
              { value: 'css', label: 'Plain CSS' },
            ],
            defaultValue: 'tailwind',
          },
        ],
      },
      {
        id: 'storage',
        name: 'Storage',
        description: 'Chrome storage API wrapper',
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, lint-staged',
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Vitest + Playwright for extension testing',
      },
      {
        id: 'env-config',
        name: 'Environment Config',
        description: 'Type-safe environment variables',
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Chrome Web Store publishing workflow',
      },
    ],
  },
  {
    id: 'chrome-plasmo',
    name: 'Chrome Extension (Plasmo)',
    description: 'TypeScript-first Chrome extension framework',
    icon: null,
    gradient: 'linear-gradient(90deg, #C7FAA8 0%, #EEFFDA 25%, #ffffff 50%, #EEFFDA 75%, #C7FAA8 100%)',
    command: 'pnpm create plasmo',
    features: [
      {
        id: 'popup',
        name: 'Popup UI',
        description: 'Extension popup interface',
      },
      {
        id: 'content-script',
        name: 'Content Script',
        description: 'Inject scripts into web pages',
      },
      {
        id: 'background',
        name: 'Background Service',
        description: 'Service worker for background tasks',
      },
      {
        id: 'storage',
        name: 'Storage API',
        description: 'Chrome storage integration',
      },
      {
        id: 'styling',
        name: 'Styling',
        description: 'Tailwind CSS setup',
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, Husky',
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Vitest for unit and E2E testing',
      },
      {
        id: 'env-config',
        name: 'Environment Config',
        description: 'Type-safe .env.* files',
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Chrome Web Store + automated builds',
      },
    ],
  },
  {
    id: 'vite-react',
    name: 'Vite + React',
    description: 'Lightning-fast React development with Vite',
    icon: null,
    gradient: 'linear-gradient(90deg, #C7A8FA 0%, #DAAEEE 25%, #ffffff 50%, #DAAEEE 75%, #C7A8FA 100%)',
    command: 'npm create vite@latest',
    commandFlags: {
      template: () => '--template react-ts',
    },
    features: [
      {
        id: 'routing',
        name: 'Routing',
        description: 'React Router for navigation',
      },
      {
        id: 'state',
        name: 'State Management',
        description: 'Global state management',
        configOptions: [
          {
            id: 'stateLibrary',
            label: 'State Library',
            type: 'select',
            options: [
              { value: 'zustand', label: 'Zustand' },
              { value: 'redux', label: 'Redux Toolkit' },
              { value: 'jotai', label: 'Jotai' },
            ],
            defaultValue: 'zustand',
          },
        ],
      },
      {
        id: 'styling',
        name: 'Styling',
        description: 'CSS framework',
        configOptions: [
          {
            id: 'cssFramework',
            label: 'CSS Framework',
            type: 'select',
            options: [
              { value: 'tailwind', label: 'Tailwind CSS' },
              { value: 'styled', label: 'Styled Components' },
              { value: 'css-modules', label: 'CSS Modules' },
            ],
            defaultValue: 'tailwind',
          },
        ],
      },
      {
        id: 'ui-library',
        name: 'UI Library',
        description: 'Component library',
        configOptions: [
          {
            id: 'componentLib',
            label: 'Components',
            type: 'select',
            options: [
              { value: 'shadcn', label: 'shadcn/ui' },
              { value: 'mui', label: 'Material-UI' },
              { value: 'none', label: 'None' },
            ],
            defaultValue: 'shadcn',
          },
        ],
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Complete testing setup',
        configOptions: [
          {
            id: 'testingTools',
            label: 'Testing Tools',
            type: 'select',
            options: [
              { value: 'vitest-playwright', label: 'Vitest + Playwright' },
              { value: 'vitest-only', label: 'Vitest only' },
            ],
            defaultValue: 'vitest-playwright',
          },
        ],
      },
      {
        id: 'env-validation',
        name: 'Environment Variables',
        description: 'Type-safe env with Zod',
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, Husky',
      },
      {
        id: 'error-tracking',
        name: 'Error Tracking',
        description: 'Sentry integration',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Privacy-focused analytics',
        configOptions: [
          {
            id: 'analyticsProvider',
            label: 'Analytics',
            type: 'select',
            options: [
              { value: 'posthog', label: 'PostHog' },
              { value: 'plausible', label: 'Plausible' },
              { value: 'umami', label: 'Umami' },
            ],
            defaultValue: 'posthog',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Deploy config',
        configOptions: [
          {
            id: 'deployTarget',
            label: 'Platform',
            type: 'select',
            options: [
              { value: 'vercel', label: 'Vercel' },
              { value: 'netlify', label: 'Netlify' },
              { value: 'cloudflare', label: 'Cloudflare Pages' },
            ],
            defaultValue: 'vercel',
          },
        ],
      },
    ],
  },
];

/**
 * Generate prompt for LLM based on wizard selections
 */
export function generateBuildPrompt(
  template: ProjectTemplate,
  projectName: string,
  selectedFeatures: Set<string>,
  configurations: Record<string, string | boolean | number>
): string {
  const featuresList = Array.from(selectedFeatures)
    .map(fId => {
      const feature = template.features.find(f => f.id === fId);
      if (!feature) return null;

      const configs = feature.configOptions
        ?.map(opt => {
          const value = configurations[opt.id];
          if (value) {
            return `  - ${opt.label}: ${typeof value === 'string' ? value : (value ? 'Yes' : 'No')}`;
          }
          return null;
        })
        .filter(Boolean)
        .join('\n');

      return `- ${feature.name}${configs ? '\n' + configs : ''}`;
    })
    .filter(Boolean)
    .join('\n');

  // Build the scaffolding command
  let command = `${template.command} ${projectName}`;
  if (template.commandFlags) {
    Object.entries(template.commandFlags).forEach(([flag, buildFlag]) => {
      const value = configurations[flag];
      if (value !== undefined && value !== false) {
        command += ` ${buildFlag(value as string | boolean | number)}`;
      }
    });
  }

  // Build research tasks for parallel agent spawning
  const researchTasks = Array.from(selectedFeatures).map(fId => {
    const feature = template.features.find(f => f.id === fId);
    if (!feature) return null;

    // Map features to research queries
    const researchMap: Record<string, string> = {
      'auth': `Latest ${configurations['authProvider'] || 'NextAuth.js'} setup with ${template.name}`,
      'database': `Latest ${configurations['orm'] || 'Prisma'} + ${configurations['dbType'] || 'PostgreSQL'} setup`,
      'styling': `Current ${configurations['uiLibrary'] || 'shadcn/ui'} installation for ${template.name}`,
      'api': `Latest ${configurations['apiType'] || 'tRPC'} setup with ${template.name}`,
      'testing': `Current ${configurations['testingTools'] || 'Vitest + Playwright'} configuration`,
      'code-quality': 'Latest ESLint flat config + Prettier + Husky v9 setup',
      'env-validation': 'Current @t3-oss/env-nextjs or Zod env validation pattern',
      'error-tracking': 'Latest Sentry integration for production',
      'analytics': `Current ${configurations['analyticsProvider'] || 'PostHog'} setup`,
      'deployment': `Latest ${configurations['deployTarget'] || 'Vercel'} deployment config`,
      'framework': `Latest ${configurations['uiFramework'] || 'React'} setup with WXT`,
      'routing': 'Current React Router v6 setup patterns',
      'state': `Latest ${configurations['stateLibrary'] || 'Zustand'} integration patterns`,
    };

    return researchMap[fId];
  }).filter(Boolean);

  return `I want to create a ${template.name} project with the following specifications:

PROJECT NAME: ${projectName}

SELECTED FEATURES:
${featuresList || '(None selected)'}

IMPORTANT: Follow these steps in order:

STEP 1: RESEARCH PHASE (Spawn Parallel build-researcher Agents)
Before building anything, spawn multiple 'build-researcher' agents in parallel to verify the latest setup instructions. These agents are optimized for fast, focused technical research - they only read official docs and return exact commands and configs.

Spawn these build-researcher agents in parallel using the Task tool with subagent_type='build-researcher':

${researchTasks.map((task, i) => `build-researcher Agent ${i + 1}: "${task}" - Get exact setup commands, current stable version, and any breaking changes.`).join('\n')}

build-researcher Agent ${researchTasks.length + 1}: "latest ${template.command} CLI flags and options" - Verify exact command syntax from official docs.

build-researcher Agent ${researchTasks.length + 2}: "professional folder structure for ${template.name} production projects" - Get industry-standard project organization patterns.

CRITICAL: Wait for ALL build-researcher agents to complete before proceeding. Use ONLY the information they provide - do not rely on outdated knowledge.

STEP 2: PROJECT STRUCTURE PLANNING
Based on the research findings, design a professional, scalable folder structure that follows these principles:
- Clear separation of concerns (features, components, utils, config)
- Logical grouping (group by feature, not by type)
- Easy to navigate and maintain
- Follows ${template.name} conventions and best practices
- Ready for production scaling

Create a detailed structure plan showing where each file type belongs (components, hooks, utils, types, tests, config, etc.).

STEP 3: INITIALIZE PROJECT
Run the verified command from research:
\`\`\`bash
${command}
cd ${projectName}
\`\`\`

STEP 4: INSTALL AND CONFIGURE FEATURES
Using the research findings, set up each selected feature with the LATEST verified setup:
${Array.from(selectedFeatures).map(fId => {
  const feature = template.features.find(f => f.id === fId);
  if (!feature) return '';
  return `- Set up ${feature.name}: ${feature.description}`;
}).filter(Boolean).join('\n')}

For each feature:
- Use the exact package versions and commands from research
- Follow the latest configuration patterns found
- Apply the professional folder structure from Step 2
- Place files in their proper locations (no random placement)

STEP 5: CONFIGURATION FILES (Spawn Parallel config-writer Agents)
Spawn config-writer agents in parallel to write modern configuration files. These agents are optimized for writing minimal, production-ready configs using the latest formats.

Spawn these config-writer agents in parallel using Task tool with subagent_type='config-writer':

config-writer Agent 1: "Write tsconfig.json with strict mode and modern compiler options, following project structure from Step 2"
config-writer Agent 2: "Write ESLint flat config (eslint.config.js) with latest format and essential rules only"
config-writer Agent 3: "Write .prettierrc with minimal project-appropriate rules"
config-writer Agent 4: "Write .env.example documenting all required environment variables based on selected features"

These agents will write files directly - no lengthy explanations, just correct modern configs in the right locations.

STEP 6: GIT & HOOKS SETUP
- Set up .gitignore with comprehensive ignores for ${template.name}
- Configure Husky git hooks if code-quality feature selected (use v9 syntax)
- Initialize git repository if not already initialized

STEP 7: VERIFICATION & ERROR FIXING
- Ensure all dependencies installed successfully
- Run type checking (tsc --noEmit)
- Run linting
- Verify dev server starts
- Check that folder structure matches the plan from Step 2

IMPORTANT: If ANY errors occur during setup, immediately spawn a quick-fixer agent:
- Use Task tool with subagent_type='quick-fixer'
- Provide the error message to the agent
- The agent will fix the issue and verify - no lengthy diagnosis needed

STEP 8: SUMMARY
Provide:
1. What was created (with actual version numbers used)
2. The final folder structure (tree view)
3. How to run the project (dev, build, test commands)
4. Next steps for development
5. Any important notes or gotchas discovered during research

CRITICAL: Use ONLY the information from the research agents - do not rely on outdated knowledge. If research finds breaking changes or deprecations, adapt accordingly.`;
}
