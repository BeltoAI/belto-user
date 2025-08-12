import { NextResponse } from 'next/server';

// Import the endpoint stats from the main AI proxy file
// Note: In a production environment, you might want to store this in a shared state management solution
const endpoints = [
  'https://670902dce12f.ngrok-free.app/completion', // DeepSeek 8B (Double 3060) - FASTEST
  'https://17f2-71-84-65-200.ngrok-free.app/secure-chat', // DeepSeek 8B (Single 3060) - VERY FAST
  'http://belto.myftp.biz:9999/v1/chat/completions' // Backup endpoint
];

export async function GET() {
  try {
    // This is a simple status endpoint that doesn't expose internal stats
    // but provides basic health information
    
    const status = {
      totalEndpoints: endpoints.length,
      timestamp: new Date().toISOString(),
      status: 'operational',
      endpoints: endpoints.map((url, index) => ({
        id: index + 1,
        url: url.replace(/^https?:\/\//, '').split('/')[0], // Hide full URL for security
        status: 'unknown' // We don't expose internal stats for security
      }))
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting AI proxy status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get status',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
