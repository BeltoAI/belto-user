// app/api/sse/route.js
import { NextResponse } from "next/server";

// Store active connections by document ID
const connections = new Map();

export async function GET(req) {
  const documentId = req.nextUrl.searchParams.get('documentId');
  
  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  // Create response object with appropriate headers for SSE
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Store the connection
  if (!connections.has(documentId)) {
    connections.set(documentId, new Set());
  }
  connections.get(documentId).add(writer);

  // Send initial connection message
  const data = JSON.stringify({ type: 'connected' });
  writer.write(encoder.encode(`data: ${data}\n\n`));

  // Keep the connection alive with a ping every 30 seconds
  const pingInterval = setInterval(() => {
    writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`));
  }, 30000);

  // Clean up when connection is closed
  req.signal.addEventListener('abort', () => {
    clearInterval(pingInterval);
    if (connections.has(documentId)) {
      connections.get(documentId).delete(writer);
      if (connections.get(documentId).size === 0) {
        connections.delete(documentId);
      }
    }
    writer.close();
  });

  // Return the stream response with appropriate headers
  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// Function to broadcast updates to all connected clients for a document
export async function broadcastUpdate(documentId, data) {
  if (!connections.has(documentId)) return;
  
  const message = JSON.stringify(data);
  const encoder = new TextEncoder();
  
  for (const writer of connections.get(documentId)) {
    try {
      writer.write(encoder.encode(`data: ${message}\n\n`));
    } catch (error) {
      console.error('Error broadcasting update:', error);
    }
  }
}