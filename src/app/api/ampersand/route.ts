import { NextRequest, NextResponse } from 'next/server';

// This endpoint will serve as the proxy for Ampersand API calls
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { action, target, params } = payload;
    
    // Use Ampersand proxy API
    const response = await fetch(`https://api.withampersand.com/v1/${target}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AMPERSAND_API_KEY || ''}`
      },
      body: JSON.stringify({
        action,
        ...params
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Failed to process request', details: errorData },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Ampersand proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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