export interface AmpersandApiOptions {
  installationId: string;
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Make an authenticated call to the Ampersand Proxy API
 */
export const callAmpersandApi = async <T = unknown>({
  installationId,
  endpoint,
  method = 'GET',
  body,
  params = {},
}: AmpersandApiOptions): Promise<T> => {
  if (!isBrowser) {
    throw new Error('API calls can only be made in the browser');
  }
  
  const projectId = process.env.NEXT_PUBLIC_AMPERSAND_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_AMPERSAND_API_KEY;

  if (!projectId || !apiKey) {
    throw new Error('Ampersand API credentials are not configured');
  }

  // Set up headers for Ampersand proxy API
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-amp-proxy-version': '1',
    'x-amp-project-id': projectId,
    'x-api-key': apiKey,
    'x-amp-installation-id': installationId,
  };

  // Build URL with query parameters
  const url = new URL(`https://proxy.withampersand.com${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  // Make the API request
  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ampersand API error (${response.status}): ${errorText}`);
  }

  return response.json();
}; 