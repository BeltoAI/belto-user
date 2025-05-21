// Web Worker for document processing

// Implement the text chunking function within the worker
function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text) return [];
  
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    // Send progress updates
    if (i % 50000 === 0) {
      self.postMessage({
        type: 'progress',
        progress: Math.min(100, Math.round((i / text.length) * 100))
      });
    }
    
    // Calculate end position with overlap
    let end = Math.min(i + chunkSize, text.length);
    
    // Find a good breaking point (sentence or paragraph)
    if (end < text.length) {
      const nextBreak = text.substring(end - 50, end + 50).search(/[.!?]\s/);
      if (nextBreak > 0) {
        end = end - 50 + nextBreak + 2; // +2 to include the punctuation and space
      }
    }
    
    // Add the chunk
    chunks.push({
      content: text.substring(i, end).trim(),
      metadata: {
        startChar: i,
        endChar: end
      }
    });
    
    // Move to next chunk position, considering overlap
    i = end - overlap;
  }
  
  return chunks;
}

// Process document and create chunks with document metadata
function processDocumentText(text, fileInfo) {
  if (!text || !text.trim()) {
    throw new Error('No content to process');
  }
  
  // Generate a document ID
  const documentId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  // Create chunks
  const chunks = chunkText(text);
  
  // Create document object with metadata
  return {
    id: documentId,
    filename: fileInfo.name,
    type: fileInfo.type,
    createdAt: new Date().toISOString(),
    totalChunks: chunks.length,
    fullText: text,
    chunks: chunks.map((chunk, index) => ({
      id: `${documentId}-chunk-${index}`,
      index,
      ...chunk,
      metadata: {
        ...chunk.metadata,
        source: fileInfo.name,
        chunkIndex: index,
        totalChunks: chunks.length
      }
    }))
  };
}

// Listen for messages from main thread
self.onmessage = function(e) {
  try {
    const { text, fileInfo } = e.data;
    
    // Send initial progress
    self.postMessage({
      type: 'progress',
      progress: 0,
      message: `Starting document processing...`
    });
    
    // Process the document text
    const processedDocument = processDocumentText(text, fileInfo);
    
    // Send the result back to the main thread
    self.postMessage({
      type: 'complete',
      processedDocument
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};