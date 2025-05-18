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
 * Uses a server-side proxy route to bypass CORS restrictions
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
  
  try {
    console.log(`Making Ampersand API request to ${endpoint} via proxy`);
    
    // Call our own server-side proxy route instead of Ampersand directly
    const response = await fetch('/api/ampersand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        installationId,
        method,
        requestBody: body,
        params,
      }),
    });

    // Log response status
    console.log(`Proxy response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to parse error response
      let errorMessage: string;
      try {
        const errorData = await response.json();
        console.log('Error response:', errorData);
        errorMessage = errorData.error || errorData.message || `HTTP Error ${response.status}`;
      } catch {
        // If we can't parse JSON, use text
        errorMessage = await response.text();
      }
      
      throw new Error(`Ampersand API error (${response.status}): ${errorMessage}`);
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('API call failed:', endpoint, error);
    throw error;
  }
}; 