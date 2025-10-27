/**
 * Directory API Routes
 * Handles directory validation and picker endpoints
 */

import { validateDirectory, getDirectoryAccessGuidance } from "../directoryUtils";
import { openDirectoryPicker } from "../directoryPicker";

/**
 * Handle directory-related API routes
 * Returns Response if route was handled, undefined otherwise
 */
export async function handleDirectoryRoutes(req: Request, url: URL): Promise<Response | undefined> {

  // POST /api/validate-directory - Validate directory path
  if (url.pathname === '/api/validate-directory' && req.method === 'POST') {
    const body = await req.json() as { directory: string };

    console.log('🔍 API: Validate directory request:', body.directory);

    const validation = validateDirectory(body.directory);

    return new Response(JSON.stringify({
      valid: validation.valid,
      expanded: validation.expanded,
      error: validation.error,
      suggestion: validation.suggestion
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST /api/pick-directory - Open directory picker dialog
  if (url.pathname === '/api/pick-directory' && req.method === 'POST') {
    console.log('📂 API: Opening directory picker dialog...');

    try {
      const selectedPath = await openDirectoryPicker();

      if (selectedPath) {
        console.log('✅ Directory selected:', selectedPath);
        return new Response(JSON.stringify({
          success: true,
          path: selectedPath
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        console.log('⚠️  Directory picker cancelled');
        return new Response(JSON.stringify({
          success: false,
          cancelled: true
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Directory picker error:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // GET /api/directory-guidance - Get directory access guidance
  if (url.pathname === '/api/directory-guidance' && req.method === 'GET') {
    console.log('💡 API: Getting directory access guidance...');

    try {
      const guidance = getDirectoryAccessGuidance();

      return new Response(JSON.stringify({
        success: true,
        ...guidance
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Directory guidance error:', errorMessage);
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Route not handled by this module
  return undefined;
}
