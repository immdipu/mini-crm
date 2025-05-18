import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side API route to proxy requests to Ampersand, bypassing CORS restrictions
 */
export async function POST(request: NextRequest) {
  try {
    // Get parameters from the request body
    const body = await request.json();
    
    if (!body.endpoint || !body.installationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: endpoint and installationId' },
        { status: 400 }
      );
    }

    const { endpoint, installationId, method = 'GET', requestBody, params = {} } = body;
    
    // Extract API keys from environment variables
    const projectId = process.env.NEXT_PUBLIC_AMPERSAND_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_AMPERSAND_API_KEY;

    if (!projectId || !apiKey) {
      return NextResponse.json(
        { error: 'Ampersand API credentials not configured on the server' },
        { status: 500 }
      );
    }

    // Create headers for the Ampersand request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-amp-proxy-version': '1',
      'x-amp-project-id': projectId,
      'x-api-key': apiKey,
      'x-amp-installation-id': installationId,
    };

    // Build URL with query parameters
    const baseUrl = 'https://proxy.withampersand.com';
    const url = new URL(`${baseUrl}${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    console.log('[Server] Making request to:', url.toString());
    console.log('[Server] With method:', method);
    
    // Make the actual request to Ampersand
    const ampResponse = await fetch(url.toString(), {
      method,
      headers,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });

    // Get response as text first (to avoid parsing errors)
    const responseText = await ampResponse.text();
    
    // Try to parse as JSON if possible
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      // If not valid JSON, use the text directly
      responseData = { text: responseText };
    }

    // Return the response with the same status code
    return NextResponse.json(responseData, { 
      status: ampResponse.status,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[Server] Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for checking connection status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider = searchParams.get('provider');
    
    // Check if the provider is connected in localStorage
    // This is just a placeholder as we can't access localStorage from server-side
    // In a real implementation, you'd check a database or another persistent storage
    
    return NextResponse.json({
      connected: false,
      provider
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 