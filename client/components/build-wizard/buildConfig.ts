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
  tooltip?: string; // Beginner-friendly explanation with use cases
  recommended?: boolean; // Show "Recommended" badge
  configOptions?: ConfigOption[];
}

export interface ConfigOption {
  id: string;
  label: string;
  type: 'select' | 'toggle';
  options?: { value: string; label: string; tooltip?: string; recommended?: boolean }[];
  defaultValue?: string | boolean;
  tooltip?: string; // Explain what this config does
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  tooltip?: string; // Explain what this template is for and when to use it
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
    tooltip: 'Build complete web applications with frontend and backend in one project. Perfect for SaaS products, dashboards, e-commerce sites, blogs, portfolios, or any website that needs a database, user accounts, or APIs. Most popular choice for modern web apps. Examples: Notion, TikTok, Twitch use Next.js.',
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
        tooltip: 'Let users create accounts and log in to your app. Use this for apps where users need to save their data, have personalized experiences, or access protected content. Examples: social apps, productivity tools, dashboards.',
        recommended: true,
        configOptions: [
          {
            id: 'authProvider',
            label: 'Auth Provider',
            type: 'select',
            tooltip: 'Choose how users will sign in to your app',
            options: [
              { value: 'nextauth', label: 'NextAuth.js', tooltip: 'Free, fully customizable. Great for apps that need email/password login, Google, GitHub sign-in. Best if you want full control.', recommended: true },
              { value: 'clerk', label: 'Clerk', tooltip: 'Easiest setup with beautiful pre-built UI. Includes user management dashboard. Free tier: 10,000 users. Best for quick launches.' },
              { value: 'supabase', label: 'Supabase Auth', tooltip: 'Free, includes database. Best if you\'re also using Supabase for your database. Supports email, Google, GitHub, and more.' },
            ],
            defaultValue: 'nextauth',
          },
        ],
      },
      {
        id: 'database',
        name: 'Database',
        description: 'Connect a database to your app',
        tooltip: 'Store your app\'s data permanently (user profiles, posts, settings, etc.). Essential for any app that needs to remember information between visits. Without this, data disappears when users close their browser.',
        recommended: true,
        configOptions: [
          {
            id: 'dbType',
            label: 'Database',
            type: 'select',
            tooltip: 'Where your app\'s data will be stored',
            options: [
              { value: 'postgresql', label: 'PostgreSQL', tooltip: 'Most popular for production apps. Free hosting: Supabase, Vercel Postgres, Railway. Best for apps that will scale.', recommended: true },
              { value: 'sqlite', label: 'SQLite', tooltip: 'Simplest option, stores data in a file on your computer. Great for prototypes and learning. No setup needed.' },
              { value: 'mysql', label: 'MySQL', tooltip: 'Popular alternative to PostgreSQL. Use if your host specifically requires MySQL.' },
            ],
            defaultValue: 'postgresql',
          },
          {
            id: 'orm',
            label: 'ORM',
            type: 'select',
            tooltip: 'Tool that lets you work with your database using simple code instead of SQL',
            options: [
              { value: 'prisma', label: 'Prisma', tooltip: 'Easiest to learn, great documentation, visual database editor. Industry standard for Next.js apps.', recommended: true },
              { value: 'drizzle', label: 'Drizzle ORM', tooltip: 'Newer, faster, more TypeScript-friendly. Great if you\'re comfortable with code and want best performance.' },
            ],
            defaultValue: 'prisma',
          },
        ],
      },
      {
        id: 'styling',
        name: 'UI Components',
        description: 'Add pre-built UI component library',
        tooltip: 'Get ready-made components like buttons, forms, dialogs, dropdowns instead of building everything from scratch. Saves weeks of work. Use this to make your app look professional without being a designer.',
        recommended: true,
        configOptions: [
          {
            id: 'uiLibrary',
            label: 'Component Library',
            type: 'select',
            tooltip: 'Choose which set of pre-built components to use',
            options: [
              { value: 'shadcn', label: 'shadcn/ui', tooltip: 'Copy-paste components you own and can fully customize. Free, beautiful, accessible. Best for most apps. You can modify anything.', recommended: true },
              { value: 'mui', label: 'Material-UI', tooltip: 'Google Material Design style. Huge library, very popular. Free with lots of examples. Great for business/admin apps.' },
              { value: 'chakra', label: 'Chakra UI', tooltip: 'Simple, accessible, easy to learn. Good documentation. Best for quick prototypes and learning React.' },
            ],
            defaultValue: 'shadcn',
          },
        ],
      },
      {
        id: 'api',
        name: 'API Layer',
        description: 'Type-safe API integration',
        tooltip: 'Connect your frontend (what users see) to your backend (server/database). Without this, your app can\'t fetch or save data. Use this for any app that needs a backend API.',
        configOptions: [
          {
            id: 'apiType',
            label: 'API Type',
            type: 'select',
            tooltip: 'Choose how your frontend talks to your backend',
            options: [
              { value: 'trpc', label: 'tRPC', tooltip: 'End-to-end type safety. Your IDE autocompletes everything and catches errors before runtime. Best for TypeScript projects. No API documentation needed.', recommended: true },
              { value: 'rest', label: 'REST API Routes', tooltip: 'Traditional API approach. Simple, well-known, works with any client. Best if you need a public API or mobile apps.' },
              { value: 'graphql', label: 'GraphQL', tooltip: 'Flexible queries, fetch only what you need. Best for complex apps with lots of data relationships. Steeper learning curve.' },
            ],
            defaultValue: 'trpc',
          },
        ],
      },
      {
        id: 'ai-integration',
        name: 'AI Integration',
        description: 'Add AI capabilities to your app',
        tooltip: 'Add ChatGPT-like features to your app: chatbots, content generation, text analysis, summaries, translations. Use this to build AI-powered tools, writing assistants, smart search, or automated customer support.',
        configOptions: [
          {
            id: 'aiProvider',
            label: 'AI Provider',
            type: 'select',
            tooltip: 'Choose which AI model will power your app',
            options: [
              { value: 'vercel-ai', label: 'Vercel AI SDK', tooltip: 'Works with OpenAI, Anthropic, Google, and more. Switch providers anytime without changing code. Best for flexibility.', recommended: true },
              { value: 'openai', label: 'OpenAI', tooltip: 'ChatGPT creator. Great for chatbots and content generation. Pricing: $0.0015 per 1K words. Free $5 credit for new accounts.' },
              { value: 'anthropic', label: 'Anthropic Claude', tooltip: 'Best for long documents and complex reasoning. More accurate than ChatGPT for analysis. Pricing: $0.008 per 1K words.' },
            ],
            defaultValue: 'vercel-ai',
          },
        ],
      },
      {
        id: 'payments',
        name: 'Payments',
        description: 'Accept payments and manage subscriptions',
        tooltip: 'Let users pay you with credit cards for one-time purchases or monthly subscriptions. Essential for SaaS, online courses, premium features, memberships, or any app that makes money. Handles checkout, billing, and tax automatically.',
        configOptions: [
          {
            id: 'paymentProvider',
            label: 'Payment Provider',
            type: 'select',
            tooltip: 'Choose which service will handle your payments and money',
            options: [
              { value: 'stripe', label: 'Stripe', tooltip: 'Industry standard, works in 100+ countries. Fees: 2.9% + 30¢ per transaction. Best documentation and features. Used by Amazon, Google, Shopify.', recommended: true },
              { value: 'paddle', label: 'Paddle', tooltip: 'Handles all taxes and compliance for you (SaaS focus). Fees: 5% + 50¢. Best if selling globally and want easy tax handling. Merchant of record.' },
              { value: 'lemonsqueezy', label: 'LemonSqueezy', tooltip: 'Simplest setup, merchant of record handles taxes. Fees: 5% + 50¢. Best for digital products and courses. Quick start for indie devs.' },
            ],
            defaultValue: 'stripe',
          },
        ],
      },
      {
        id: 'email',
        name: 'Email',
        description: 'Send transactional and marketing emails',
        tooltip: 'Send emails from your app: welcome emails, password resets, receipts, notifications, newsletters. Essential for user communication. Without this, users won\'t get confirmation emails or important updates.',
        configOptions: [
          {
            id: 'emailProvider',
            label: 'Email Provider',
            type: 'select',
            tooltip: 'Choose which service will send emails for your app',
            options: [
              { value: 'resend', label: 'Resend', tooltip: 'Modern, simple API with React Email templates. Free: 3,000 emails/month. Then $20/month. Best for startups and modern apps.', recommended: true },
              { value: 'sendgrid', label: 'SendGrid', tooltip: 'Popular enterprise option. Free: 100 emails/day. Paid plans from $15/month. Good for marketing emails and analytics.' },
              { value: 'postmark', label: 'Postmark', tooltip: 'Fastest delivery, best for transactional emails (receipts, passwords). $15/month for 10K emails. Reliable delivery focus.' },
              { value: 'nodemailer', label: 'Nodemailer', tooltip: 'Free but requires your own email server (Gmail, etc.). More complex setup. Use only if you have specific email server requirements.' },
            ],
            defaultValue: 'resend',
          },
        ],
      },
      {
        id: 'file-storage',
        name: 'File Storage',
        description: 'Upload and store user files',
        tooltip: 'Let users upload files: profile pictures, documents, videos, PDFs. Use for apps with user content, portfolios, file sharing, or media platforms. Files are stored in the cloud, not on your server.',
        configOptions: [
          {
            id: 'storageProvider',
            label: 'Storage Provider',
            type: 'select',
            tooltip: 'Choose where user-uploaded files will be stored',
            options: [
              { value: 'uploadthing', label: 'UploadThing', tooltip: 'Easiest setup for Next.js. Free: 2GB storage, 2GB bandwidth/month. Handles file uploads with one line of code. Best for quick starts.', recommended: true },
              { value: 's3', label: 'AWS S3', tooltip: 'Industry standard, unlimited scale. $0.023 per GB/month. Best for large apps with many files. More complex setup but most powerful.' },
              { value: 'r2', label: 'Cloudflare R2', tooltip: 'Like S3 but free bandwidth. $0.015 per GB/month. Best if serving many files to users (downloads, media). Good for cost savings.' },
              { value: 'supabase-storage', label: 'Supabase Storage', tooltip: 'Free 1GB. Best if you\'re already using Supabase for database. Includes image transformations and CDN.' },
            ],
            defaultValue: 'uploadthing',
          },
        ],
      },
      {
        id: 'env-validation',
        name: 'Environment Variables',
        description: 'Type-safe env validation with @t3-oss/env-nextjs',
        tooltip: 'Safely manage secret keys (API keys, database passwords) and configuration. Validates your .env file at build time so you catch missing keys before deployment. Essential for any production app.',
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, Husky git hooks',
        tooltip: 'Automatically format your code and catch common mistakes. Your code stays clean and consistent. Husky runs checks before each commit so bad code never reaches your repo. Great for teams and solo devs.',
        recommended: true,
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Complete testing setup',
        tooltip: 'Write automated tests to catch bugs before users do. Tests run automatically and tell you if something breaks. Essential for professional apps. Saves hours of manual testing.',
        configOptions: [
          {
            id: 'testingTools',
            label: 'Testing Tools',
            type: 'select',
            tooltip: 'Choose your testing framework',
            options: [
              { value: 'vitest-playwright', label: 'Vitest + Playwright', tooltip: 'Unit tests (Vitest) for logic + browser tests (Playwright) for UI. Complete coverage. Best for production apps.', recommended: true },
              { value: 'jest-playwright', label: 'Jest + Playwright', tooltip: 'Same as above but with Jest. Use if your team already knows Jest.' },
              { value: 'vitest-only', label: 'Vitest only', tooltip: 'Unit tests only, no browser testing. Fastest setup. Good for APIs or simple apps.' },
            ],
            defaultValue: 'vitest-playwright',
          },
        ],
      },
      {
        id: 'error-tracking',
        name: 'Error Tracking',
        description: 'Sentry for production error monitoring',
        tooltip: 'Get notified when your app crashes or has errors. See exactly what went wrong, which users are affected, and stack traces. Essential for production apps. Free tier: 5,000 errors/month.',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Privacy-focused analytics',
        tooltip: 'See how many people use your app, which pages they visit, where they\'re from. Privacy-friendly alternatives to Google Analytics. Understand your users without invading privacy.',
        configOptions: [
          {
            id: 'analyticsProvider',
            label: 'Analytics Provider',
            type: 'select',
            tooltip: 'Choose your analytics platform',
            options: [
              { value: 'posthog', label: 'PostHog', tooltip: 'All-in-one: analytics + feature flags + session replay. Free: 1M events/month. Best for product analytics and understanding user behavior.', recommended: true },
              { value: 'plausible', label: 'Plausible', tooltip: 'Simplest, lightweight, privacy-first. €9/month for 10K pageviews. Great for simple traffic tracking. European, GDPR compliant.' },
              { value: 'umami', label: 'Umami', tooltip: 'Free and open source. Self-hosted or cloud. Simple pageview tracking. Best if you want full data ownership.' },
            ],
            defaultValue: 'posthog',
          },
        ],
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Vercel deployment configuration',
        tooltip: 'One-click deploy to Vercel (made by Next.js creators). Free hosting for personal projects. Auto-deploys when you push to GitHub. Perfect for Next.js apps.',
        recommended: true,
      },
    ],
  },
  {
    id: 'chrome-wxt',
    name: 'Chrome Extension (WXT)',
    description: 'Modern Chrome extension with React/Vue/Svelte',
    tooltip: 'Build browser extensions that add features to Chrome (and other browsers). Perfect for productivity tools, ad blockers, price trackers, page modifiers, or any tool that enhances browsing. Extensions appear in your browser toolbar and can interact with any webpage. Examples: Grammarly, Honey, LastPass are Chrome extensions.',
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
        tooltip: 'Pick the JavaScript framework for building your extension\'s UI. React is most popular with best resources. Vue is simpler. Svelte is fastest. Vanilla JS means no framework.',
        recommended: true,
        configOptions: [
          {
            id: 'uiFramework',
            label: 'Framework',
            type: 'select',
            tooltip: 'Choose your UI development framework',
            options: [
              { value: 'react', label: 'React', tooltip: 'Most popular, huge ecosystem, tons of tutorials. Best for complex extensions with lots of UI.', recommended: true },
              { value: 'vue', label: 'Vue 3', tooltip: 'Easier to learn than React, great documentation. Good balance of simplicity and power.' },
              { value: 'svelte', label: 'Svelte', tooltip: 'Fastest performance, smallest bundle size. Less resources but growing community.' },
              { value: 'vanilla', label: 'Vanilla JS', tooltip: 'No framework, just JavaScript. Lightest option. Best for very simple extensions.' },
            ],
            defaultValue: 'react',
          },
        ],
      },
      {
        id: 'popup',
        name: 'Popup UI',
        description: 'Extension popup interface',
        tooltip: 'The small window that opens when users click your extension icon in the toolbar. Essential for most extensions. This is where users interact with your extension\'s main features.',
        recommended: true,
      },
      {
        id: 'content-script',
        name: 'Content Script',
        description: 'Inject scripts into web pages',
        tooltip: 'Run JavaScript code on websites the user visits. Use this to modify web pages, add features to sites, or extract data. Examples: ad blockers, grammar checkers, price trackers.',
      },
      {
        id: 'background',
        name: 'Background Service',
        description: 'Service worker for background tasks',
        tooltip: 'Code that runs in the background even when popup is closed. Use for: listening to browser events, managing extension state, scheduling tasks, handling notifications.',
      },
      {
        id: 'styling',
        name: 'Styling',
        description: 'CSS framework',
        tooltip: 'Choose how to style your extension\'s UI. Tailwind is fastest for building interfaces. UnoCSS is lighter. Plain CSS gives full control.',
        configOptions: [
          {
            id: 'cssFramework',
            label: 'CSS Framework',
            type: 'select',
            tooltip: 'Choose your styling approach',
            options: [
              { value: 'tailwind', label: 'Tailwind CSS', tooltip: 'Utility-first CSS, fastest development. Most popular choice. Great for rapid UI building.', recommended: true },
              { value: 'unocss', label: 'UnoCSS', tooltip: 'Like Tailwind but faster and smaller. Good for extensions where size matters.' },
              { value: 'css', label: 'Plain CSS', tooltip: 'Traditional CSS. Full control, no learning curve. Best if you prefer writing CSS yourself.' },
            ],
            defaultValue: 'tailwind',
          },
        ],
      },
      {
        id: 'storage',
        name: 'Storage',
        description: 'Chrome storage API wrapper',
        tooltip: 'Save extension settings and user data that persists across browser sessions. Essential if your extension needs to remember preferences or store data.',
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, lint-staged',
        tooltip: 'Keep code clean and catch errors before they reach users. Auto-formats code and runs checks before commits. Essential for professional extensions.',
        recommended: true,
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Vitest + Playwright for extension testing',
        tooltip: 'Automated tests for your extension. Catch bugs before users do. Playwright can test your extension in a real browser environment.',
      },
      {
        id: 'env-config',
        name: 'Environment Config',
        description: 'Type-safe environment variables',
        tooltip: 'Manage API keys and configuration safely. Different settings for development vs production. Essential if you\'re using external APIs.',
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Chrome Web Store publishing workflow',
        tooltip: 'Automated workflow for publishing your extension to Chrome Web Store. Includes build optimization and packaging for distribution.',
      },
    ],
  },
  {
    id: 'chrome-plasmo',
    name: 'Chrome Extension (Plasmo)',
    description: 'TypeScript-first Chrome extension framework',
    tooltip: 'Alternative Chrome extension framework focused on TypeScript and developer experience. Great if you want batteries-included setup with less configuration. Similar to WXT but with different conventions. Choose this if you prefer opinionated frameworks that handle setup for you.',
    icon: null,
    gradient: 'linear-gradient(90deg, #C7FAA8 0%, #EEFFDA 25%, #ffffff 50%, #EEFFDA 75%, #C7FAA8 100%)',
    command: 'pnpm create plasmo',
    features: [
      {
        id: 'popup',
        name: 'Popup UI',
        description: 'Extension popup interface',
        tooltip: 'The small window that opens when users click your extension icon in the toolbar. Essential for most extensions. This is where users interact with your extension\'s main features.',
        recommended: true,
      },
      {
        id: 'content-script',
        name: 'Content Script',
        description: 'Inject scripts into web pages',
        tooltip: 'Run JavaScript code on websites the user visits. Use this to modify web pages, add features to sites, or extract data. Examples: ad blockers, grammar checkers, price trackers.',
      },
      {
        id: 'background',
        name: 'Background Service',
        description: 'Service worker for background tasks',
        tooltip: 'Code that runs in the background even when popup is closed. Use for: listening to browser events, managing extension state, scheduling tasks, handling notifications.',
      },
      {
        id: 'storage',
        name: 'Storage API',
        description: 'Chrome storage integration',
        tooltip: 'Save extension settings and user data that persists across browser sessions. Essential if your extension needs to remember preferences or store data.',
      },
      {
        id: 'styling',
        name: 'Styling',
        description: 'Tailwind CSS setup',
        tooltip: 'Pre-configured Tailwind CSS for styling your extension. Utility-first CSS framework for rapid UI development. Build beautiful interfaces quickly.',
        recommended: true,
      },
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'ESLint, Prettier, Husky',
        tooltip: 'Keep code clean and catch errors before they reach users. Auto-formats code and runs checks before commits. Essential for professional extensions.',
        recommended: true,
      },
      {
        id: 'testing',
        name: 'Testing',
        description: 'Vitest for unit and E2E testing',
        tooltip: 'Automated tests for your extension. Catch bugs before users do. Includes both unit tests and end-to-end testing capabilities.',
      },
      {
        id: 'env-config',
        name: 'Environment Config',
        description: 'Type-safe .env.* files',
        tooltip: 'Manage API keys and configuration safely. Different settings for development vs production. Essential if you\'re using external APIs.',
      },
      {
        id: 'deployment',
        name: 'Deployment',
        description: 'Chrome Web Store + automated builds',
        tooltip: 'Automated workflow for publishing your extension to Chrome Web Store. Includes build optimization and packaging for distribution.',
      },
    ],
  },
  {
    id: 'vite-react',
    name: 'Vite + React',
    description: 'Lightning-fast React development with Vite',
    tooltip: 'Build fast single-page applications (SPAs) for frontend-only projects. Perfect for: interactive dashboards, admin panels, portfolio sites, landing pages, or prototypes. Simpler than Next.js - no backend/server code, just frontend. Best for apps that don\'t need a database or user accounts, or when you already have a separate backend API.',
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
        tooltip: 'Add multiple pages/views to your app. Users can navigate between different screens (Home, About, Dashboard, etc.). Essential for any app with more than one page.',
        recommended: true,
      },
      {
        id: 'state',
        name: 'State Management',
        description: 'Global state management',
        tooltip: 'Share data across your entire app. User info, settings, cart items accessible from any component. Essential for medium to large apps where components need to share data.',
        configOptions: [
          {
            id: 'stateLibrary',
            label: 'State Library',
            type: 'select',
            tooltip: 'Choose how to manage app-wide state',
            options: [
              { value: 'zustand', label: 'Zustand', tooltip: 'Simplest, easiest to learn. Small bundle size. Best for most apps. Growing in popularity.', recommended: true },
              { value: 'redux', label: 'Redux Toolkit', tooltip: 'Industry standard, huge ecosystem, tons of jobs use it. More complex but very powerful. Best for large teams.' },
              { value: 'jotai', label: 'Jotai', tooltip: 'Atomic state management, flexible and minimal. Good TypeScript support. Best if you want granular control.' },
            ],
            defaultValue: 'zustand',
          },
        ],
      },
      {
        id: 'styling',
        name: 'Styling',
        description: 'CSS framework',
        tooltip: 'Choose how to style your app. Tailwind is fastest for building interfaces. Styled Components keeps styles with components. CSS Modules prevents style conflicts.',
        recommended: true,
        configOptions: [
          {
            id: 'cssFramework',
            label: 'CSS Framework',
            type: 'select',
            tooltip: 'Choose your styling approach',
            options: [
              { value: 'tailwind', label: 'Tailwind CSS', tooltip: 'Utility-first CSS, fastest development. Most popular choice. Build interfaces rapidly with utility classes.', recommended: true },
              { value: 'styled', label: 'Styled Components', tooltip: 'Write CSS in JavaScript. Scoped styles, dynamic styling. Great for component libraries.' },
              { value: 'css-modules', label: 'CSS Modules', tooltip: 'Traditional CSS with automatic scope. No style conflicts. Good if you prefer writing regular CSS.' },
            ],
            defaultValue: 'tailwind',
          },
        ],
      },
      {
        id: 'ui-library',
        name: 'UI Library',
        description: 'Component library',
        tooltip: 'Get ready-made components like buttons, forms, dialogs instead of building from scratch. Saves weeks of work. Make your app look professional quickly.',
        configOptions: [
          {
            id: 'componentLib',
            label: 'Components',
            type: 'select',
            tooltip: 'Choose your component library',
            options: [
              { value: 'shadcn', label: 'shadcn/ui', tooltip: 'Copy-paste components you own and can fully customize. Free, beautiful, accessible. Best for most apps.', recommended: true },
              { value: 'mui', label: 'Material-UI', tooltip: 'Google Material Design style. Huge library, very popular. Free with lots of examples. Great for business apps.' },
              { value: 'none', label: 'None', tooltip: 'Build everything yourself. Full control but more work. Choose this if you have custom design requirements.' },
            ],
            defaultValue: 'shadcn',
          },
        ],
      },
      {
        id: 'ai-integration',
        name: 'AI Integration',
        description: 'Add AI capabilities to your app',
        tooltip: 'Add ChatGPT-like features to your app: chatbots, content generation, text analysis, summaries, translations. Use this to build AI-powered tools, writing assistants, smart search, or automated customer support.',
        configOptions: [
          {
            id: 'aiProvider',
            label: 'AI Provider',
            type: 'select',
            tooltip: 'Choose which AI model will power your app',
            options: [
              { value: 'vercel-ai', label: 'Vercel AI SDK', tooltip: 'Works with OpenAI, Anthropic, Google, and more. Switch providers anytime without changing code. Best for flexibility.', recommended: true },
              { value: 'openai', label: 'OpenAI', tooltip: 'ChatGPT creator. Great for chatbots and content generation. Pricing: $0.0015 per 1K words. Free $5 credit for new accounts.' },
              { value: 'anthropic', label: 'Anthropic Claude', tooltip: 'Best for long documents and complex reasoning. More accurate than ChatGPT for analysis. Pricing: $0.008 per 1K words.' },
            ],
            defaultValue: 'vercel-ai',
          },
        ],
      },
      {
        id: 'payments',
        name: 'Payments',
        description: 'Accept payments and manage subscriptions',
        tooltip: 'Let users pay you with credit cards for one-time purchases or monthly subscriptions. Essential for SaaS, online courses, premium features, memberships, or any app that makes money. Handles checkout, billing, and tax automatically.',
        configOptions: [
          {
            id: 'paymentProvider',
            label: 'Payment Provider',
            type: 'select',
            tooltip: 'Choose which service will handle your payments and money',
            options: [
              { value: 'stripe', label: 'Stripe', tooltip: 'Industry standard, works in 100+ countries. Fees: 2.9% + 30¢ per transaction. Best documentation and features. Used by Amazon, Google, Shopify.', recommended: true },
              { value: 'paddle', label: 'Paddle', tooltip: 'Handles all taxes and compliance for you (SaaS focus). Fees: 5% + 50¢. Best if selling globally and want easy tax handling. Merchant of record.' },
              { value: 'lemonsqueezy', label: 'LemonSqueezy', tooltip: 'Simplest setup, merchant of record handles taxes. Fees: 5% + 50¢. Best for digital products and courses. Quick start for indie devs.' },
            ],
            defaultValue: 'stripe',
          },
        ],
      },
      {
        id: 'email',
        name: 'Email',
        description: 'Send transactional and marketing emails',
        tooltip: 'Send emails from your app: welcome emails, password resets, receipts, notifications, newsletters. Essential for user communication. Without this, users won\'t get confirmation emails or important updates.',
        configOptions: [
          {
            id: 'emailProvider',
            label: 'Email Provider',
            type: 'select',
            tooltip: 'Choose which service will send emails for your app',
            options: [
              { value: 'resend', label: 'Resend', tooltip: 'Modern, simple API with React Email templates. Free: 3,000 emails/month. Then $20/month. Best for startups and modern apps.', recommended: true },
              { value: 'sendgrid', label: 'SendGrid', tooltip: 'Popular enterprise option. Free: 100 emails/day. Paid plans from $15/month. Good for marketing emails and analytics.' },
              { value: 'postmark', label: 'Postmark', tooltip: 'Fastest delivery, best for transactional emails (receipts, passwords). $15/month for 10K emails. Reliable delivery focus.' },
              { value: 'nodemailer', label: 'Nodemailer', tooltip: 'Free but requires your own email server (Gmail, etc.). More complex setup. Use only if you have specific email server requirements.' },
            ],
            defaultValue: 'resend',
          },
        ],
      },
      {
        id: 'file-storage',
        name: 'File Storage',
        description: 'Upload and store user files',
        tooltip: 'Let users upload files: profile pictures, documents, videos, PDFs. Use for apps with user content, portfolios, file sharing, or media platforms. Files are stored in the cloud, not on your server.',
        configOptions: [
          {
            id: 'storageProvider',
            label: 'Storage Provider',
            type: 'select',
            tooltip: 'Choose where user-uploaded files will be stored',
            options: [
              { value: 'uploadthing', label: 'UploadThing', tooltip: 'Easiest setup. Free: 2GB storage, 2GB bandwidth/month. Handles file uploads with one line of code. Best for quick starts.', recommended: true },
              { value: 's3', label: 'AWS S3', tooltip: 'Industry standard, unlimited scale. $0.023 per GB/month. Best for large apps with many files. More complex setup but most powerful.' },
              { value: 'r2', label: 'Cloudflare R2', tooltip: 'Like S3 but free bandwidth. $0.015 per GB/month. Best if serving many files to users (downloads, media). Good for cost savings.' },
            ],
            defaultValue: 'uploadthing',
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
      'ai-integration': `Latest ${configurations['aiProvider'] || 'Vercel AI SDK'} setup with ${template.name} and best practices`,
      'payments': `Latest ${configurations['paymentProvider'] || 'Stripe'} integration with ${template.name} (webhooks, subscriptions, checkout)`,
      'email': `Latest ${configurations['emailProvider'] || 'Resend'} setup with ${template.name} and React Email templates`,
      'file-storage': `Latest ${configurations['storageProvider'] || 'UploadThing'} integration with ${template.name} (upload, display, delete)`,
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
