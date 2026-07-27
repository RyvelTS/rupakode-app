import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import { getContext, getAllowedHosts, getTrustProxyHeaders } from '@netlify/angular-runtime/app-engine';

const angularAppEngine = new AngularAppEngine({
  allowedHosts: ['localhost', 'rupakode.netlify.app', ...getAllowedHosts()],
  trustProxyHeaders: getTrustProxyHeaders(),
});

export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const context = getContext();

  // Example API endpoints can be defined here.
  // Uncomment and define endpoints as necessary.
  // const pathname = new URL(request.url).pathname;
  // if (pathname === '/api/hello') {
  //   return Response.json({ message: 'Hello from the API' });
  // }

  const result = await angularAppEngine.handle(request, context);
  return result || new Response('Not found', { status: 404 });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
