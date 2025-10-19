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

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Code2, Layers, Chrome, Terminal, HelpCircle, MessageSquare, LayoutDashboard, Lock, CreditCard, Mail, Package, Shield, Database, Activity, FileUp, AlertCircle, BarChart3, FormInput, Server, Zap, Calendar, Layout } from 'lucide-react';

interface FeaturesModalProps {
  onComplete: (prompt: string) => void;
  onClose: () => void;
}

// Tooltip Component (from Build Wizard)
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            backgroundColor: 'rgb(20, 22, 24)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px 16px',
            width: '420px',
            maxWidth: '90vw',
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'rgb(229, 231, 235)',
            zIndex: 10000,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

// Project type definitions
const PROJECT_TYPES = [
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'Full-stack React framework with App Router',
    icon: Layers,
    gradient: 'linear-gradient(90deg, #A8C7FA 0%, #DAEEFF 25%, #ffffff 50%, #DAEEFF 75%, #A8C7FA 100%)',
    featureCount: 13,
  },
  {
    id: 'react',
    name: 'React',
    description: 'SPA with Vite or Create React App',
    icon: Code2,
    gradient: 'linear-gradient(90deg, #c4b5fd 0%, #ddd6fe 25%, #ffffff 50%, #ddd6fe 75%, #c4b5fd 100%)',
    featureCount: 2,
  },
  {
    id: 'python',
    name: 'Python',
    description: 'FastAPI or Django backend',
    icon: Terminal,
    gradient: 'linear-gradient(90deg, #86efac 0%, #bbf7d0 25%, #ffffff 50%, #bbf7d0 75%, #86efac 100%)',
    featureCount: 2,
  },
  {
    id: 'chrome-extension',
    name: 'Chrome Extension',
    description: 'Browser extension with Manifest V3',
    icon: Chrome,
    gradient: 'linear-gradient(90deg, #fde047 0%, #fef08a 25%, #ffffff 50%, #fef08a 75%, #fde047 100%)',
    featureCount: 2,
  },
];

// Feature definitions per project type
const FEATURES_BY_TYPE: Record<string, Array<{
  id: string;
  name: string;
  description: string;
  tags: string[];
  template: string;
  icon: React.ElementType;
  tooltip: string;
  prompt: string;
}>> = {
  nextjs: [
    {
      id: 'ai-chatbot',
      name: 'AI Chatbot',
      description: 'Streaming AI chat with Vercel AI SDK',
      tags: ['AI', 'Chat', 'Streaming'],
      template: 'Vercel AI Chatbot',
      icon: MessageSquare,
      tooltip: 'Uses the official Vercel AI Chatbot template with streaming responses, chat history, and markdown support. No custom implementation needed - just clone the production-ready template.',
      prompt: `Implement AI Chatbot using Vercel's official AI Chatbot template.

IMPORTANT: Use the official, production-ready template - NOT custom code.

STEP 1: Analyze project structure
- Check package.json for existing dependencies and framework
- Identify project structure (app directory, pages directory, src prefix, etc.)
- Note existing routing and component organization patterns
- Verify this is a Next.js project (required for this template)

STEP 2: Clone the official Vercel AI Chatbot template
Run: npx create-next-app ai-chatbot --example https://github.com/vercel/ai-chatbot
This includes:
- Streaming chat UI with markdown support
- Chat history persistence
- Model switching (Claude, GPT, etc.)
- Pre-built components and API routes

STEP 3: Integrate into existing project
- Examine the template's file structure
- Copy API routes to match your project's API route location
- Copy chat components to your components directory
- Copy utilities to your utilities/lib directory
- Follow your project's existing folder organization patterns
- Merge dependencies into package.json without overwriting existing versions

STEP 4: Configure environment variables
- Add AI provider API keys to your environment file (match existing naming convention)
- Update configuration for preferred AI provider

STEP 5: Wire into existing app
- Import ChatInterface component following your import patterns
- Add to desired page/layout following your routing conventions
- Style to match existing design system if present

Expected result: Production-ready AI chat with streaming, history, and markdown rendering.`,
    },
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      description: 'Professional admin panel with shadcn/ui',
      tags: ['Admin', 'Dashboard', 'UI'],
      template: 'shadcn/ui Dashboard',
      icon: LayoutDashboard,
      tooltip: 'Builds a complete admin dashboard using shadcn/ui official blocks - not custom components. Includes stats cards, data tables, user management, and settings panels. All components are production-tested.',
      prompt: `Implement Admin Dashboard using shadcn/ui official dashboard blocks.

IMPORTANT: Use official shadcn/ui blocks - NOT custom implementations.

STEP 1: Analyze project setup
- Read package.json for existing dependencies
- Check if shadcn/ui is initialized (look for components.json)
- Identify your project's routing structure
- Note your component organization pattern

STEP 2: Initialize shadcn/ui if needed
- Run: npx shadcn@latest init
- Follow prompts and choose options that match your project setup

STEP 3: Install dashboard components
Run these commands sequentially:
- npx shadcn@latest add card
- npx shadcn@latest add table
- npx shadcn@latest add chart (if needed)
- npx shadcn@latest add dropdown-menu
- npx shadcn@latest add badge

STEP 4: Use official dashboard blocks
Visit: https://ui.shadcn.com/blocks
Choose blocks for:
- Dashboard overview (stats cards)
- Recent activity table
- User management
- Settings panels

STEP 5: Create admin layout following your project structure
- Analyze existing route structure to determine where admin section should live
- Create admin layout with sidebar following your project's layout patterns
- Create dashboard overview page following your routing conventions
- Add role-based access control if authentication is detected in the project
- Follow your project's existing naming and organization conventions

Expected result: Professional admin dashboard with reusable shadcn/ui components.`,
    },
    {
      id: 'auth-pages',
      name: 'Authentication Pages',
      description: 'Sign in, sign up, and profile pages',
      tags: ['Auth', 'UI', 'Security'],
      template: 'NextAuth Pages',
      icon: Lock,
      tooltip: 'Creates complete auth UI using official NextAuth or Clerk components. Detects what\'s already installed and uses the appropriate pre-built components - no custom forms to maintain.',
      prompt: `Implement Authentication Pages using official NextAuth or Clerk components.

IMPORTANT: Use official UI components from NextAuth/Clerk - NOT custom forms.

STEP 1: Detect existing auth setup
- Check package.json for next-auth or @clerk/nextjs
- Check environment files for NEXTAUTH_SECRET or CLERK_PUBLISHABLE_KEY
- Identify project routing structure

STEP 2A: If using NextAuth (next-auth detected)
- Use official NextAuth UI pages
- Create auth pages following your project's routing conventions
- Use built-in providers UI components
- Create profile page with session data

STEP 2B: If using Clerk (@clerk/nextjs detected)
- Use Clerk's pre-built components: SignIn, SignUp, UserProfile
- Create auth routes following Clerk's catch-all route pattern and your project structure
- Follow your existing routing conventions

STEP 2C: If NO auth detected
- Ask user: "Do you want to use NextAuth or Clerk?"
- Install chosen package
- Set up according to official docs
- Then proceed with Step 2A or 2B

STEP 3: Configure routes and middleware
- Locate or create middleware file following project conventions
- Update middleware for protected routes
- Add redirect logic after sign in
- Handle sign out flow

Expected result: Complete auth UI using official, maintained components.`,
    },
    {
      id: 'stripe-checkout',
      name: 'Stripe Checkout',
      description: 'Payment flow with Stripe integration',
      tags: ['Payments', 'Stripe', 'Checkout'],
      template: 'Stripe Next.js',
      icon: CreditCard,
      tooltip: 'Implements Stripe payments using their official Next.js template. Includes checkout sessions, webhook handling, and success/failure pages. All patterns follow Stripe best practices.',
      prompt: `Implement Stripe Checkout using Stripe's official Next.js template.

IMPORTANT: Use Stripe's official integration - NOT custom implementations.

STEP 1: Analyze project structure
- Read package.json for stripe and @stripe/stripe-js
- If missing: npm install stripe @stripe/stripe-js
- Identify API routes location and pattern
- Note environment file naming convention

STEP 2: Reference Stripe's official Next.js example
Visit: https://github.com/vercel/next.js/tree/canary/examples/with-stripe-typescript
Clone patterns from official example and adapt to your project structure:
- Create checkout session API route in your API directory
- Create webhook handler API route in your API directory
- Create checkout page following your routing conventions
- Create success page following your routing conventions

STEP 3: Set up Stripe products and prices
- Use Stripe Dashboard or CLI to create products
- Copy price IDs to environment variables

STEP 4: Configure environment variables
Add to your environment file (match existing naming pattern):
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

STEP 5: Handle webhooks
- Set up webhook endpoint with Stripe CLI or Dashboard
- Handle payment_intent.succeeded event
- Update database with order/subscription status if database exists

Expected result: Complete payment flow with checkout, success handling, and webhooks.`,
    },
    {
      id: 'email-system',
      name: 'Email System',
      description: 'Transactional emails with Resend',
      tags: ['Email', 'Notifications'],
      template: 'Resend + react-email',
      icon: Mail,
      tooltip: 'Sets up professional email system using Resend (best deliverability) with react-email for beautiful templates. Uses official templates - no HTML email coding required.',
      prompt: `Implement Email System using Resend with react-email templates.

IMPORTANT: Use official Resend + react-email setup - NOT custom email builders.

STEP 1: Analyze project structure
- Read package.json for existing dependencies
- Install if missing: npm install resend react-email
- Identify where utilities/services are stored
- Note API routes location

STEP 2: Initialize react-email
Run: npx react-email init
This creates an emails directory with example templates and preview server.

STEP 3: Use official react-email templates
Choose from official examples at https://react.email/examples:
- Welcome email
- Password reset
- Order confirmation
- Newsletter
Copy and customize for your needs

STEP 4: Create email API route
- Create send-email API route in your API directory following project conventions
- Import Resend client
- Import email templates
- Send with proper error handling

STEP 5: Configure Resend
- Add RESEND_API_KEY to your environment file
- Verify domain in Resend dashboard
- Test with development mode

Expected result: Professional email system with beautiful templates and reliable delivery.`,
    },
    {
      id: 'file-storage',
      name: 'File Upload & Storage',
      description: 'Upload files with UploadThing or S3',
      tags: ['Storage', 'Upload', 'Files'],
      template: 'UploadThing Next.js',
      icon: FileUp,
      tooltip: 'Add file upload capabilities using UploadThing (easiest) or AWS S3 (most powerful). Handles image optimization, file validation, progress indicators, and cloud storage. Perfect for profile pictures, documents, or any user-uploaded content.',
      prompt: `Implement File Upload using UploadThing's official integration.

IMPORTANT: Use UploadThing's official setup - NOT custom S3 implementations.

STEP 1: Analyze project structure
- Read package.json for existing dependencies
- Install if missing: npm install uploadthing @uploadthing/react
- Identify API routes location
- Check if database exists for storing file metadata

STEP 2: Set up UploadThing configuration
Create UploadThing core configuration file in your API directory:
- Configure file types (image, video, pdf, etc.)
- Set max file sizes
- Add file validation rules
- Set up access control if authentication exists

STEP 3: Create upload API route
Create upload handler API route following your project's conventions:
- Import and export UploadThing handlers
- Connect to core configuration
- Handle upload events

STEP 4: Add upload component to UI
- Import UploadButton or UploadDropzone from @uploadthing/react
- Add to desired page following your routing structure
- Configure accepted file types
- Add upload progress indicator

STEP 5: Configure environment variables
Add to your environment file:
- UPLOADTHING_SECRET (from uploadthing.com dashboard)
- UPLOADTHING_APP_ID

STEP 6: Display uploaded files
- Store file URLs in database if available
- Display with appropriate image component (use framework's optimized image component if available)
- Add delete functionality if needed

Expected result: Working file upload with cloud storage, validation, and progress tracking.`,
    },
    {
      id: 'error-tracking',
      name: 'Error Tracking',
      description: 'Monitor production errors with Sentry',
      tags: ['Monitoring', 'Errors', 'Production'],
      template: 'Sentry Next.js',
      icon: AlertCircle,
      tooltip: 'Get notified when your app crashes with Sentry error monitoring. See exactly what went wrong, which users are affected, and get stack traces. Free tier includes 5,000 errors/month. Essential for production apps.',
      prompt: `Implement Error Tracking using Sentry's official SDK.

IMPORTANT: Use Sentry's official wizard - NOT manual setup.

STEP 1: Initialize Sentry for your framework
Run: npx @sentry/wizard@latest -i (wizard will detect your framework)
This automatically:
- Installs appropriate Sentry package
- Creates configuration files
- Updates build config with Sentry plugin
- Prompts for your Sentry DSN

STEP 2: Configure Sentry settings
The wizard creates configs, but customize:
- Set environment (development, staging, production)
- Configure sample rates for errors and traces
- Add release tracking with git commit SHA
- Set up source maps for production

STEP 3: Add custom error boundaries
- Locate or create error boundary components following your framework's conventions
- Use Sentry.captureException in catch blocks throughout your app
- Follow your project's error handling patterns

STEP 4: Configure environment variables
Add to your environment file (wizard should add these):
- SENTRY_DSN
- SENTRY_ORG
- SENTRY_PROJECT
- SENTRY_AUTH_TOKEN (for source maps upload)

STEP 5: Test error tracking
- Throw a test error in development
- Check Sentry dashboard for error report
- Verify stack traces are readable with source maps

Expected result: Production error monitoring with detailed stack traces and alerts.`,
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Privacy-friendly analytics tracking',
      tags: ['Analytics', 'Metrics', 'Privacy'],
      template: 'Vercel Analytics',
      icon: BarChart3,
      tooltip: 'Track page views, user behavior, and performance metrics with privacy-friendly analytics. Choose Vercel Analytics (easiest), PostHog (most features), or Umami (self-hosted). No cookies, no tracking consent needed.',
      prompt: `Implement Analytics using privacy-friendly providers.

IMPORTANT: Use official analytics providers - NOT Google Analytics.

STEP 1: Choose analytics provider
Ask user: "Which analytics do you want?"
- Vercel Analytics (easiest if deploying to Vercel)
- PostHog (best for product analytics + feature flags)
- Umami (open source, self-hostable)

STEP 2: Install and configure chosen provider
Analyze project structure first:
- Identify root layout/app entry point
- Note environment file naming convention

For Vercel Analytics:
- Install: npm install @vercel/analytics
- Add Analytics component to root layout
- No additional config needed - auto-detects deployment

For PostHog:
- Install: npm install posthog-js posthog-node
- Create PostHog provider following your project structure
- Wrap app in provider with project API key
- Add pageview tracking and custom events

For Umami:
- Install: npm install @umami/next
- Add tracking script to root layout
- Self-host or use Umami Cloud

STEP 3: Add environment variables (if needed)
Add to your environment file:
- For PostHog: NEXT_PUBLIC_POSTHOG_KEY
- For Umami: NEXT_PUBLIC_UMAMI_ID

STEP 4: Track custom events (optional)
- Button clicks
- Form submissions
- Feature usage
- Add event tracking where needed following framework patterns

Expected result: Privacy-friendly analytics tracking pageviews and custom events.`,
    },
    {
      id: 'forms-validation',
      name: 'Forms & Validation',
      description: 'React Hook Form with Zod schemas',
      tags: ['Forms', 'Validation', 'UI'],
      template: 'shadcn/ui Form',
      icon: FormInput,
      tooltip: 'Build forms with automatic validation using React Hook Form + Zod. Prevents users from submitting bad data. Essential for login forms, contact forms, settings pages. Uses shadcn/ui form components for beautiful, accessible forms.',
      prompt: `Implement Forms with Validation using React Hook Form + Zod.

IMPORTANT: Use UI library form components if available - NOT custom form implementations.

STEP 1: Analyze project structure
- Read package.json for existing dependencies
- Install if missing: npm install react-hook-form @hookform/resolvers zod
- Check if shadcn/ui or other UI library is initialized
- Identify where components are stored

STEP 2: Install form components (if using shadcn/ui)
Run: npx shadcn@latest add form
This installs Form, FormField, FormItem, FormLabel, FormControl, FormMessage components.

STEP 3: Create Zod validation schema
Define schema for your form fields with appropriate validation rules.

STEP 4: Build form following project patterns
- Use useForm with zodResolver
- Follow your component structure patterns
- Use UI library form components if available
- Handle form submission with type-safe data

STEP 5: Add form to desired page
Identify appropriate location for the form:
- Contact form
- Settings/profile update
- Newsletter signup
- Feedback form
- Login/register (if not using auth provider)
Follow your routing and page conventions.

STEP 6: Add loading states and error handling
- Show loading spinner during submission
- Display success/error notifications (use existing toast/notification system if present)
- Disable form during submission

Expected result: Beautiful, accessible forms with client-side validation and error messages.`,
    },
    {
      id: 'api-routes',
      name: 'Protected API Routes',
      description: 'Secure API endpoints with rate limiting',
      tags: ['API', 'Backend', 'Security'],
      template: 'Next.js API Routes',
      icon: Server,
      tooltip: 'Create secure backend API endpoints for your app. Without this, your frontend can\'t communicate with your backend. Includes rate limiting to prevent abuse. Essential for any app that needs server-side logic or database access.',
      prompt: `Implement Protected API Routes with Rate Limiting.

IMPORTANT: Follow your framework's API route conventions.

STEP 1: Analyze existing setup
- Read package.json for auth and database packages
- Check if authentication is already configured
- Verify database connection exists
- Identify API routes location and pattern

STEP 2: Set up rate limiting with Upstash
Install: npm install @upstash/ratelimit @upstash/redis
Create rate limiting utility in your utilities/lib directory:
- Configure Redis connection
- Set rate limits (e.g., 10 requests per 10 seconds)
- Export ratelimit instance

STEP 3: Create protected API route pattern
Create example API route following your project's conventions:
- Check authentication (if auth exists in project)
- Apply rate limiting
- Validate request data with Zod
- Perform database operations (if database exists)
- Return JSON response with proper error handling

STEP 4: Add middleware for authentication
If authentication detected in project:
- Import auth session handler
- Check if user is authenticated
- Return 401 if not authenticated
- Attach user info to request

STEP 5: Create example CRUD endpoints
Create API routes following your project's routing patterns:
- List endpoint (with pagination)
- Create endpoint
- Get single item endpoint
- Update endpoint
- Delete endpoint

STEP 6: Configure environment variables
Add to your environment file:
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
(Free tier: 10,000 requests/day)

Expected result: Secure API endpoints with rate limiting and proper error handling.`,
    },
    {
      id: 'background-jobs',
      name: 'Background Jobs',
      description: 'Async tasks with Upstash QStash',
      tags: ['Jobs', 'Queue', 'Async'],
      template: 'Upstash QStash',
      icon: Zap,
      tooltip: 'Run long tasks in the background without blocking users. Perfect for sending bulk emails, processing videos, generating reports, AI tasks. Tasks continue even if user closes browser. Prevents timeouts on slow operations.',
      prompt: `Implement Background Jobs using Upstash QStash.

IMPORTANT: Use Upstash QStash official SDK - NOT custom queue implementations.

STEP 1: Analyze project structure
- Install: npm install @upstash/qstash
- Identify where utilities/services are stored
- Note API routes location

STEP 2: Set up QStash client
Create QStash client in your utilities/lib directory:
- Import Client from @upstash/qstash
- Initialize with QSTASH_TOKEN
- Export qstash instance

STEP 3: Create job handler API route
Create job handler API route following your project's conventions:
- Verify request is from QStash (signature verification)
- Parse job payload
- Execute job logic
- Return 200 on success for retry logic

STEP 4: Create job publisher function
Create job publisher utility in your utilities directory:
- Function to publish jobs to QStash
- Accepts job name and payload
- Returns job ID for tracking

STEP 5: Add common background jobs
Examples based on your project needs:
- Send welcome email after signup
- Process uploaded images/videos
- Generate PDF reports
- Run AI processing tasks
- Send scheduled notifications

STEP 6: Configure environment variables
Add to your environment file:
- QSTASH_TOKEN
- QSTASH_CURRENT_SIGNING_KEY
- QSTASH_NEXT_SIGNING_KEY
(Get from Upstash console)

STEP 7: Test job execution
- Trigger a job from your app
- Check QStash dashboard for job status
- Verify job handler receives and processes correctly
- Test retry logic for failures

Expected result: Background job system that runs async tasks reliably with retries.`,
    },
    {
      id: 'booking-calendar',
      name: 'Booking & Calendar',
      description: 'Schedule appointments with Cal.com',
      tags: ['Booking', 'Calendar', 'Scheduling'],
      template: 'Cal.com Embed',
      icon: Calendar,
      tooltip: 'Let users book time with you for appointments, consultations, meetings. Perfect for coaches, consultants, service businesses, SaaS demos. Handles time zones, availability, reminders automatically. Like Calendly but open-source.',
      prompt: `Implement Booking System using Cal.com.

IMPORTANT: Use Cal.com's official embed or API - NOT custom calendar implementations.

STEP 1: Choose Cal.com integration type
Ask user: "How do you want to integrate Cal.com?"
- Embed (easiest - just add iframe, no backend needed)
- Self-hosted (full control, requires Docker)
- API integration (most flexible, requires Cal.com API)

STEP 2A: If Embed chosen (recommended)
- Create Cal.com account at cal.com
- Create event type (e.g., "30 min consultation")
- Get embed code from Cal.com dashboard
- Identify where to add booking page in your routing structure
- Create booking page following your project's conventions
- Add Cal.com embed code to the page

STEP 2B: If API integration chosen
Install: npm install @calcom/api
- Set up Cal.com API key
- Create booking form with custom UI following your component patterns
- Use API to check availability
- Create bookings programmatically

STEP 3: Add email confirmations
- Cal.com automatically sends confirmation emails
- Customize email templates in Cal.com dashboard
- Add calendar invites (.ics files)

STEP 4: Configure calendar sync
- Connect Google Calendar, Outlook, or iCal
- Sync availability automatically
- Prevent double-bookings

STEP 5: Add to navigation
- Add booking link to your navigation/header/footer following your layout patterns
- Create dedicated booking page in appropriate location
- Add booking CTA to relevant pages

Expected result: Professional booking system with automatic scheduling and email confirmations.`,
    },
    {
      id: 'landing-page',
      name: 'Landing Page Components',
      description: 'Pre-built marketing sections',
      tags: ['Marketing', 'Landing', 'UI'],
      template: 'shadcn/ui Blocks',
      icon: Layout,
      tooltip: 'Get ready-made sections for your marketing pages: hero sections, pricing tables, testimonials, feature grids, CTAs, FAQs. Saves days of work. Perfect for SaaS landing pages, product launches, portfolios. Copy-paste and customize.',
      prompt: `Implement Landing Page using UI component blocks.

IMPORTANT: Use official UI library blocks if available - NOT custom landing page builders.

STEP 1: Analyze project setup
- Check if shadcn/ui or other UI library is initialized
- If using shadcn/ui and not initialized: npx shadcn@latest init
- Identify your routing structure for landing page

STEP 2: Browse available UI blocks (if using shadcn/ui)
Visit: https://ui.shadcn.com/blocks
Available blocks:
- Hero sections (multiple variants)
- Feature sections (grid, cards, list)
- Pricing tables (monthly/yearly toggle)
- Testimonials (carousel, grid)
- FAQ sections (accordion)
- CTA sections (various styles)
- Stats/metrics sections
- Newsletter signup forms

STEP 3: Install required components
If using shadcn/ui, install:
- npx shadcn@latest add card
- npx shadcn@latest add button
- npx shadcn@latest add accordion
- npx shadcn@latest add tabs
- npx shadcn@latest add badge

STEP 4: Create landing page structure
Identify appropriate location in your routing structure:
- Hero section (with CTA)
- Features section (3-column grid)
- Pricing section (if relevant)
- Testimonials section
- FAQ section
- Final CTA section

STEP 5: Copy and customize blocks
If using shadcn/ui:
- Visit ui.shadcn.com/blocks
- Click "View Code" on desired blocks
- Copy and paste into your page
- Customize text, images, colors
Otherwise, build sections following your component patterns.

STEP 6: Optimize for SEO
- Add proper meta tags following framework conventions
- Use semantic HTML
- Add alt text to images
- Optimize Core Web Vitals

Expected result: Professional landing page with modern design using production-ready components.`,
    },
  ],
  react: [
    {
      id: 'component-library',
      name: 'Component Library',
      description: 'shadcn/ui components for React',
      tags: ['UI', 'Components'],
      template: 'shadcn/ui React',
      icon: Package,
      tooltip: 'Initializes shadcn/ui specifically for React (non-Next.js). Works with both Vite and CRA. Get copy-paste components with full TypeScript support and dark mode out of the box.',
      prompt: `Implement Component Library using shadcn/ui for React.

IMPORTANT: Use official shadcn/ui React setup - NOT random component libraries.

STEP 1: Analyze project structure
- Read package.json to detect build tool (Vite vs Create React App)
- Check if React 18+ is installed
- Check if shadcn/ui is already initialized (look for components.json)
- Check if Tailwind CSS is configured (look for tailwind.config.js/ts)
- Identify your component organization pattern (src/components vs components)
- Note your app entry point location (main.tsx, index.tsx, App.tsx, etc.)

STEP 2: Install dependencies if missing
For Vite projects:
- If no Tailwind: npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
- Ensure vite.config dependencies are present

For CRA projects:
- If no Tailwind: npm install -D tailwindcss && npx tailwindcss init
- Configure CRACO if needed for Tailwind support

STEP 3: Initialize shadcn/ui for React
If components.json doesn't exist:
Run: npx shadcn@latest init
When prompted:
- Choose your detected build tool (Vite or CRA)
- Choose your CSS approach (Tailwind recommended)
- Set components directory following your existing pattern
- Configure path aliases to match your setup

STEP 4: Install essential components
Run sequentially:
- npx shadcn@latest add button
- npx shadcn@latest add card
- npx shadcn@latest add dialog
- npx shadcn@latest add form
- npx shadcn@latest add input
- npx shadcn@latest add select

STEP 5: Set up theming
- Locate or create your global CSS file (App.css, index.css, globals.css, etc.)
- Add CSS variables for theming following shadcn's CSS variable pattern
- Add dark mode support if needed:
  - Create theme provider component in your components directory
  - Wrap app in provider at your entry point following your project structure

STEP 6: Verify installation
- Import a component (e.g., Button) in your App component
- Test that styling and functionality work
- Verify dark mode toggle if implemented

Expected result: Full component library ready to use with copy-paste components and theme support.`,
    },
    {
      id: 'auth-clerk',
      name: 'Clerk Authentication',
      description: 'Complete auth UI with Clerk',
      tags: ['Auth', 'Security'],
      template: 'Clerk React',
      icon: Shield,
      tooltip: 'Adds complete authentication using Clerk\'s official React components. Get social logins, user management, and beautiful UI with zero backend work. Perfect for React SPAs.',
      prompt: `Implement Authentication using Clerk's official React components.

IMPORTANT: Use Clerk's official components - NOT custom auth forms.

STEP 1: Analyze project setup
- Read package.json to check if @clerk/clerk-react is installed
- Identify your app entry point (main.tsx, index.tsx, App.tsx, etc.)
- Check if routing library is installed (react-router-dom, wouter, etc.)
- Note your environment variable prefix (VITE_ for Vite, REACT_APP_ for CRA)
- Identify your component organization pattern

STEP 2: Install Clerk if missing
Run: npm install @clerk/clerk-react

STEP 3: Configure Clerk provider
Locate your app entry point (the file that renders the root component):
- Import ClerkProvider from @clerk/clerk-react
- Wrap your root component with ClerkProvider
- Add publishable key from environment variable using your detected prefix:
  - Vite: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  - CRA: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY

STEP 4: Set up Clerk components
Import Clerk's pre-built components:
- SignIn component for sign in UI
- SignUp component for sign up UI
- UserButton component for user menu
- SignedIn and SignedOut components for conditional rendering

STEP 5: Create auth routes
Analyze your routing setup:

If using React Router:
- Create sign-in route following your route organization pattern
- Create sign-up route following your route organization pattern
- Add SignIn component to sign-in route
- Add SignUp component to sign-up route

If using Wouter or other routing library:
- Follow that library's route creation pattern
- Create appropriate routes for sign-in and sign-up

If NO routing library detected:
- Create auth pages as separate components in your components directory
- Add navigation logic following your existing patterns

STEP 6: Add protected route logic
If routing library detected:
- Create protected route wrapper component
- Use useAuth() hook from Clerk to check authentication
- Redirect to sign-in if not authenticated
- Wrap protected routes with this component

STEP 7: Configure environment variables
Add to your environment file (match existing naming convention):
For Vite (.env):
- VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

For CRA (.env):
- REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_...

STEP 8: Add user menu to navigation
- Locate your navigation/header component
- Import UserButton from @clerk/clerk-react
- Add UserButton component following your layout patterns
- Use SignedIn/SignedOut for conditional rendering

Expected result: Complete auth system with social logins, user management, and beautiful UI with zero backend work.`,
    },
  ],
  python: [
    {
      id: 'fastapi-sqlalchemy',
      name: 'FastAPI + SQLAlchemy',
      description: 'REST API with database ORM',
      tags: ['API', 'Database', 'ORM'],
      template: 'FastAPI SQLAlchemy',
      icon: Database,
      tooltip: 'Creates production-ready REST API following FastAPI\'s official SQL tutorial. Includes proper session management, migrations with Alembic, and CRUD operations following best practices.',
      prompt: `Implement FastAPI with SQLAlchemy using official patterns.

IMPORTANT: Follow official FastAPI SQL tutorial - NOT custom implementations.

STEP 1: Analyze project structure
- Read requirements.txt or pyproject.toml for existing dependencies
- Identify project organization pattern (flat structure, /app directory, /src directory, etc.)
- Check if using async or sync SQLAlchemy
- Note where modules are typically stored (root level, subdirectories, etc.)
- Look for existing database configuration files

STEP 2: Install dependencies if missing
- pip install fastapi[all]
- pip install sqlalchemy
- pip install alembic

STEP 3: Follow FastAPI SQL tutorial structure
Reference: https://fastapi.tiangolo.com/tutorial/sql-databases/
Create modules following your project's organization pattern:
- Database module (DB session and engine configuration)
- Models module (SQLAlchemy ORM models)
- Schemas module (Pydantic validation schemas)
- CRUD module (database operations)
- Main application file (FastAPI app initialization)

STEP 4: Set up database configuration
Create database module in your project structure:
- Configure SQLAlchemy engine and session
- Add async support if project uses async patterns
- Configure connection pooling
- Set database URL from environment variables

STEP 5: Create models and migrations
Create models module following your project organization:
- Define SQLAlchemy models with appropriate relationships
- Initialize Alembic: alembic init alembic
- Configure alembic.ini with your database URL
- Create first migration: alembic revision --autogenerate -m "Initial migration"
- Apply migration: alembic upgrade head

STEP 6: Create CRUD endpoints
Create API routes following your project structure:
- GET /items - list with pagination
- POST /items - create new item
- GET /items/{id} - retrieve single item
- PUT /items/{id} - update item
- DELETE /items/{id} - delete item
- Use dependency injection for database sessions
- Add proper error handling and status codes

STEP 7: Add environment configuration
Create or update environment file:
- DATABASE_URL (e.g., sqlite:///./app.db or postgresql://...)
- Configure connection pooling parameters if needed

Expected result: Production-ready REST API with SQLAlchemy ORM following FastAPI best practices and your project's organization.`,
    },
    {
      id: 'fastapi-auth',
      name: 'JWT Authentication',
      description: 'Secure auth with OAuth2 pattern',
      tags: ['Auth', 'Security', 'JWT'],
      template: 'FastAPI Auth',
      icon: Lock,
      tooltip: 'Implements secure JWT authentication using FastAPI\'s official OAuth2 security tutorial. Includes password hashing with bcrypt, token generation, and protected endpoints.',
      prompt: `Implement authentication using official FastAPI OAuth2 pattern.

IMPORTANT: Follow FastAPI security docs - NOT custom JWT implementations.

STEP 1: Analyze project structure
- Check requirements.txt or pyproject.toml for existing dependencies
- Identify where modules are organized (flat, /app, /src, etc.)
- Check if database/ORM is already configured
- Note existing patterns for utilities and security modules

STEP 2: Install dependencies if missing
- pip install python-jose[cryptography]
- pip install passlib[bcrypt]
- pip install python-multipart

STEP 3: Follow FastAPI Security tutorial
Reference: https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/
Create modules following your project organization:
- Security module (password hashing, JWT token creation/verification)
- Authentication module (login endpoints, OAuth2 scheme)
- User model (if not already exists in your models)

STEP 4: Create security utilities
Create security module in your project structure:
- Password hashing with passlib and bcrypt
- JWT token creation with python-jose
- JWT token verification and decoding
- OAuth2PasswordBearer dependency for token extraction

STEP 5: Implement User model and database integration
If database exists in project:
- Add User model with hashed_password field to your models module
- Create user table migration with Alembic
- Add user CRUD operations to appropriate module

If no database:
- Create in-memory user store for development
- Document that production needs database integration

STEP 6: Create authentication endpoints
Create auth routes following your project's API structure:
- POST /token - login endpoint, returns JWT access token
- POST /register - user registration with password hashing
- GET /users/me - get current authenticated user (protected endpoint)
- Use OAuth2PasswordRequestForm for login

STEP 7: Add authentication dependency
Create reusable authentication dependency:
- get_current_user function that verifies JWT token
- Extracts user from token payload
- Returns user or raises 401 Unauthorized
- Add to protected routes with Depends(get_current_user)

STEP 8: Configure environment variables
Add to environment file:
- SECRET_KEY (generate with: openssl rand -hex 32)
- ALGORITHM (e.g., HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES (e.g., 30)

STEP 9: Protect existing routes
- Add get_current_user dependency to routes that need authentication
- Add optional authentication where needed
- Implement role-based access control if required

Expected result: Secure JWT authentication system following FastAPI OAuth2 patterns, integrated with your project structure.`,
    },
  ],
  'chrome-extension': [
    {
      id: 'react-popup',
      name: 'React Popup Extension',
      description: 'Chrome extension with React popup',
      tags: ['React', 'Popup', 'UI'],
      template: 'Chrome Extension React',
      icon: Chrome,
      tooltip: 'Creates a Chrome extension popup using React and Manifest V3. Properly configured for extension APIs with chrome.storage, chrome.tabs, and proper build setup.',
      prompt: `Create Chrome Extension with React popup using official Manifest V3.

IMPORTANT: Use Manifest V3 official structure - NOT deprecated Manifest V2.

STEP 1: Analyze project structure
- Check package.json for existing dependencies and build tools
- Detect if using WXT framework, Plasmo, or vanilla setup
- Identify build configuration (Vite, Webpack, or other bundler)
- Note project organization patterns and directory structure
- Verify Chrome Extension requirements are present

STEP 2: Set up extension framework following project conventions
If WXT detected:
- Use WXT's built-in React support and conventions
- Follow WXT's directory structure for popup
- Leverage WXT's auto-generated manifest

If Plasmo detected:
- Use Plasmo's popup component conventions
- Follow Plasmo's file-based routing patterns
- Leverage Plasmo's auto-configuration

If vanilla setup:
- Create public/assets directory for manifest and icons following extension conventions
- Create popup directory in your source folder
- Set up build configuration for extension output
- Configure bundler to output popup.html

STEP 3: Create Manifest V3 configuration
Follow official Manifest V3 spec in appropriate location:
- manifest_version: 3 (required)
- action with default_popup pointing to popup HTML
- permissions array (storage, activeTab as needed)
- background service_worker if needed
- Adapt paths to match your build output structure

STEP 4: Build React popup component
- Create popup entry point following your project structure
- Keep bundle size small (target under 1MB)
- Use Chrome Extension APIs appropriately
- Add chrome.storage for data persistence
- Add chrome.tabs for tab interaction if needed
- Add chrome.runtime for messaging if needed

STEP 5: Configure build process
Adapt to your build setup:
- Configure bundler output for extension format
- Ensure popup.html is generated correctly
- Set up icon assets in appropriate directory
- Configure source maps for development

STEP 6: Test extension
- Build project using your build command
- Load unpacked extension in chrome://extensions
- Enable Developer mode
- Test popup functionality
- Verify Chrome APIs work correctly

Expected result: Working Chrome extension with React popup following Manifest V3 standards.`,
    },
    {
      id: 'content-script',
      name: 'Content Script Injection',
      description: 'Inject scripts into web pages',
      tags: ['Content Script', 'Injection'],
      template: 'Content Scripts V3',
      icon: Activity,
      tooltip: 'Implements content script injection using Manifest V3 content_scripts declaration. Properly isolated from page JavaScript with shadow DOM support for UI injection.',
      prompt: `Implement Content Script injection using Manifest V3.

IMPORTANT: Use Manifest V3 content_scripts - NOT deprecated executeScript.

STEP 1: Analyze project structure
- Check if using WXT framework, Plasmo, or vanilla Chrome extension setup
- Identify existing build configuration and bundler
- Note how other extension components are organized
- Check manifest configuration location
- Verify project's script compilation setup

STEP 2: Configure content script in manifest
Locate manifest configuration (manifest.json or framework config):
- Add content_scripts declaration
- Configure matches patterns for target URLs (all_urls or specific domains)
- Set js and css file paths matching your build output
- Configure run_at timing (document_start, document_end, or document_idle)
- Set world property if needed (ISOLATED or MAIN)

STEP 3: Create content script file
Create content script in appropriate source directory:
- Runs in isolated JavaScript environment by default
- Has full access to page DOM
- Cannot access page JavaScript variables directly
- Configure TypeScript if project uses it
- Follow your project's file naming conventions

STEP 4: Implement messaging between content and background
Set up bidirectional communication:
- Use chrome.runtime.sendMessage for content to background
- Use chrome.tabs.sendMessage for background to content
- Add proper error handling for disconnected contexts
- Handle async message responses correctly

STEP 5: Add UI injection if needed
For injecting custom UI elements:
- Create shadow DOM for style isolation
- Attach shadow root to prevent CSS conflicts
- Inject custom elements or components
- Handle dynamic content loading
- Clean up on page unload

STEP 6: Configure required permissions
Update manifest permissions as needed:
- activeTab for current tab access
- scripting for dynamic injection API
- host_permissions for specific domains
- Match patterns for automatic injection

STEP 7: Build and test
- Build project using your build command
- Reload extension in chrome://extensions
- Test content script injection on target pages
- Verify messaging works correctly
- Check developer console for errors

Expected result: Content script properly injecting into web pages with Manifest V3 compliance.`,
    },
  ],
};

export function FeaturesModal({ onComplete, onClose }: FeaturesModalProps) {
  const [step, setStep] = useState<'project-type' | 'feature-selection'>('project-type');
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  const handleProjectTypeSelect = (typeId: string) => {
    setSelectedProjectType(typeId);
    setSelectedFeature(null); // Reset feature selection
    setStep('feature-selection');
  };

  const handleBack = () => {
    setStep('project-type');
    setSelectedFeature(null);
  };

  const handleFeatureSelect = (featureId: string) => {
    // Toggle selection (click again to deselect)
    setSelectedFeature(prev => prev === featureId ? null : featureId);
  };

  const handleGenerate = () => {
    if (!selectedProjectType || !selectedFeature) return;

    const features = FEATURES_BY_TYPE[selectedProjectType];
    const feature = features?.find(f => f.id === selectedFeature);

    if (!feature) return;

    onComplete(feature.prompt);
  };

  const currentFeatures = selectedProjectType ? FEATURES_BY_TYPE[selectedProjectType] || [] : [];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1152px', // max-w-6xl = 72rem = 1152px (same as Build Wizard)
          height: '90vh',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgb(20, 22, 24)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px',
            borderRadius: '8px',
            color: 'white',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background-color 200ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          aria-label="Close modal"
        >
          <X style={{ width: '20px', height: '20px' }} />
        </button>

        {/* Spacer for close button */}
        <div style={{ height: '60px', flexShrink: 0 }} />

        {/* Step Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingBottom: '80px', // Space for fixed buttons
          }}
        >
          {step === 'project-type' ? (
            /* Project Type Selection - Build Wizard Style */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '20px 32px',
            }}>
              {/* Header */}
              <div style={{
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                }}>
                  <Package style={{ width: '32px', height: '32px', color: 'rgba(255, 255, 255, 0.8)' }} />
                </div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px',
                }}>
                  What&apos;s your tech stack?
                </h2>
                <p style={{
                  color: 'rgb(156, 163, 175)',
                  fontSize: '14px',
                }}>
                  Select your project type to see available features
                </p>
              </div>

              {/* Template Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  width: '100%',
                  maxWidth: '700px',
                }}
              >
                {PROJECT_TYPES.map((type, index) => {
                  const Icon = type.icon;
                  const isHovered = hoveredType === type.id;

                  return (
                    <button
                      key={type.id}
                      onClick={() => handleProjectTypeSelect(type.id)}
                      onMouseEnter={() => setHoveredType(type.id)}
                      onMouseLeave={() => setHoveredType(null)}
                      className="promptCard waterfall"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px',
                        borderRadius: '10px',
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        animationDelay: `${index * 80}ms`,
                        backgroundColor: 'rgb(38, 40, 42)',
                        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                        boxShadow: isHovered
                          ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'all 300ms',
                        position: 'relative',
                        zIndex: isHovered ? 10001 : 1,
                      }}
                    >
                      {/* Icon with gradient background */}
                      <div
                        style={{
                          marginBottom: '10px',
                          padding: '8px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 'fit-content',
                          backgroundImage: type.gradient,
                          backgroundSize: '200% auto',
                          ...(isHovered ? {
                            animationName: 'shimmer',
                            animationDuration: '3s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                          } : {}),
                        }}
                      >
                        <div style={{ color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon style={{ width: '20px', height: '20px' }} />
                        </div>
                      </div>

                      {/* Template Name */}
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'white',
                        marginBottom: '4px',
                      }}>
                        {type.name}
                      </h3>

                      {/* Description */}
                      <p style={{
                        color: 'rgb(156, 163, 175)',
                        fontSize: '13px',
                        lineHeight: '1.5',
                      }}>
                        {type.description}
                      </p>

                      {/* Feature Count Badge */}
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{
                          fontSize: '11px',
                          color: 'rgb(107, 114, 128)',
                        }}>
                          {type.featureCount} feature{type.featureCount !== 1 ? 's' : ''}
                        </span>
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            ...(isHovered ? {
                              backgroundImage: type.gradient,
                              backgroundSize: '200% auto',
                            } : {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            }),
                            color: isHovered ? '#000000' : 'rgb(156, 163, 175)',
                            transition: 'all 0.3s',
                          }}
                        >
                          Select
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Helper Text */}
              <p style={{
                marginTop: '16px',
                fontSize: '12px',
                color: 'rgb(107, 114, 128)',
                textAlign: 'center',
                maxWidth: '448px',
              }}>
                Each feature uses official templates and best-in-class tools.
                <br />
                Select your stack to see available features.
              </p>
            </div>
          ) : (
            /* Feature Selection */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              padding: '20px 32px',
            }}>
              {/* Header */}
              <div style={{
                marginBottom: '24px',
                textAlign: 'center',
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '8px',
                }}>
                  Choose a Feature
                </h2>
                <p style={{
                  color: 'rgb(156, 163, 175)',
                  fontSize: '14px',
                }}>
                  Select one feature to implement using best-in-class tools
                </p>
              </div>

              {/* Features Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px',
                width: '100%',
                maxWidth: '700px',
                margin: '0 auto 32px',
              }}>
                {currentFeatures.map((feature) => {
                  const FeatureIcon = feature.icon;
                  const isSelected = selectedFeature === feature.id;

                  return (
                    <button
                      key={feature.id}
                      onClick={() => handleFeatureSelect(feature.id)}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        border: '2px solid',
                        borderColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                        backgroundColor: isSelected ? 'rgba(168, 199, 250, 0.1)' : 'rgb(38, 40, 42)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 200ms',
                      }}
                    >
                      {/* Icon and Title Row */}
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '8px' }}>
                        <div
                          style={{
                            flexShrink: 0,
                            padding: '6px',
                            borderRadius: '6px',
                            backgroundColor: isSelected ? 'rgb(168, 199, 250)' : 'rgba(255, 255, 255, 0.1)',
                            color: isSelected ? 'rgb(20, 22, 24)' : 'rgb(156, 163, 175)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FeatureIcon style={{ width: '20px', height: '20px' }} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
                              {feature.name}
                            </div>
                            <Tooltip text={feature.tooltip}>
                              <HelpCircle
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  color: 'rgb(107, 114, 128)',
                                  cursor: 'help',
                                  flexShrink: 0,
                                }}
                              />
                            </Tooltip>
                          </div>

                          {/* Template Badge */}
                          <div style={{ fontSize: '11px', color: 'rgb(156, 163, 175)' }}>
                            {feature.template}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <div style={{ fontSize: '12px', color: 'rgb(209, 213, 219)', marginBottom: '12px', lineHeight: '1.5' }}>
                        {feature.description}
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {feature.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(168, 199, 250, 0.15)',
                              color: 'rgb(168, 199, 250)',
                              fontWeight: 500,
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Action Buttons */}
        {step === 'feature-selection' && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px 32px',
              backgroundColor: 'rgb(20, 22, 24)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
            }}
          >
            <button
              onClick={handleBack}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'transparent',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ← Back
            </button>

            {selectedFeature && (
              <div style={{ fontSize: '13px', color: 'rgb(156, 163, 175)' }}>
                1 feature selected
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedFeature}
              className={selectedFeature ? 'send-button-active' : ''}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: selectedFeature ? 'pointer' : 'not-allowed',
                transition: 'all 200ms',
                ...(selectedFeature
                  ? {}
                  : {
                      backgroundColor: 'rgb(75, 85, 99)',
                      color: 'rgba(255, 255, 255, 0.4)',
                      border: 'none',
                    }),
              }}
            >
              Generate Implementation
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
