#!/bin/bash
# Test script for updated AI endpoints using cURL commands
# Based on the provided endpoint specifications

echo "🚀 Testing Updated AI Endpoints"
echo "================================"

# Test the AI Proxy status endpoint
echo ""
echo "📊 Testing AI Proxy Status..."
curl -s http://localhost:3000/api/ai-proxy | jq '.' || echo "Status endpoint test failed"

# Test RAG API health
echo ""
echo "🏥 Testing RAG API Health..."
curl -s http://localhost:3000/api/embeddings?action=health | jq '.' || echo "RAG health test failed"

# Test simple AI chat through proxy
echo ""
echo "💬 Testing AI Chat through Proxy..."
curl -s -X POST http://localhost:3000/api/ai-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, who are you? Keep it brief.",
    "aiConfig": {
      "temperature": 0.7,
      "maxTokens": 100
    }
  }' | jq -r '.response' || echo "AI chat test failed"

# Test embeddings generation
echo ""
echo "🔍 Testing Embeddings Generation..."
curl -s -X POST http://localhost:3000/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text":["Belto builds an AI Virtual TA.","Testing embeddings."]}' | jq '.' || echo "Embeddings test failed"

# Test direct endpoint (Llama 3.1 8B) - may fail if not accessible
echo ""
echo "🤖 Testing Direct Llama 3.1 8B Endpoint (may fail if not accessible)..."
curl -s -X POST http://bel2ai.duckdns.org:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "local",
    "messages": [
      {"role": "system", "content": "You are BELTO AI, an educational assistant. Keep answers clear and brief."},
      {"role": "user", "content": "Say hello in one sentence."}
    ],
    "max_tokens": 50,
    "temperature": 0.7
  }' | jq -r '.choices[0].message.content' 2>/dev/null || echo "Direct endpoint test failed (expected if not accessible)"

# Test direct RAG API (may fail if not accessible)
echo ""
echo "🔗 Testing Direct RAG API (may fail if not accessible)..."
curl -s http://ragging.duckdns.org:5005/health 2>/dev/null || echo "Direct RAG API test failed (expected if not accessible)"

echo ""
echo "✅ Endpoint tests completed!"
echo "Note: Direct endpoint tests may fail if external services are not accessible during development."
