// Web worker for document chunking with robust loop termination

console.log('[Worker] documentChunker.js loaded');

self.addEventListener('error', function(e) {
  console.error('[Worker] Unhandled Error:', e.filename, e.lineno, e.message);
  self.postMessage({
    type: 'error',
    error: `Worker script error: ${e.message}`
  });
});

function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.length === 0) {
    console.log('[Worker] Empty text received.');
    return [];
  }

  console.log(`[Worker] Starting chunkText. Text length: ${text.length}, chunkSize: ${chunkSize}, overlap: ${overlap}`);
  const chunks = [];
  let currentIndex = 0;
  const textLength = text.length;
  let iterations = 0; // Safety counter for debugging

  while (currentIndex < textLength) {
    iterations++;
    if (iterations > textLength / Math.max(1, chunkSize - overlap) + 100 && iterations > 1000) { // Safety break for runaway loops
        console.error('[Worker] Excessive iterations, breaking loop. currentIndex:', currentIndex, 'textLength:', textLength);
        self.postMessage({ type: 'error', error: 'Chunking loop took too many iterations.' });
        break;
    }

    let end = Math.min(currentIndex + chunkSize, textLength);

    // Optional: Sentence boundary adjustment.
    // If issues persist, try commenting this section out first.
    if (end < textLength) {
      let adjustedEnd = -1;
      // Look for a period, question mark, or exclamation mark followed by a space or end of text
      for (let j = Math.min(end + 50, textLength - 1); j >= Math.max(0, end - 50, currentIndex + 1); j--) {
        if ('.!?'.includes(text[j])) {
          if ((j + 1 < textLength && text[j + 1] === ' ') || j + 1 === textLength) {
            adjustedEnd = j + 1;
            break;
          }
        }
      }
      if (adjustedEnd !== -1 && adjustedEnd > currentIndex) { // Ensure adjustedEnd is valid and after current
        end = adjustedEnd;
      }
    }
    // End of optional sentence boundary adjustment

    const chunkContent = text.substring(currentIndex, end).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        metadata: { startChar: currentIndex, endChar: end }
      });
    }
    
    // CRITICAL FIX: If this chunk reaches the end of the text, we are done.
    if (end === textLength) {
      console.log('[Worker] Reached end of text. Breaking loop. Chunks:', chunks.length);
      break;
    }

    const prevIndex = currentIndex;
    currentIndex = end - overlap;

    if (currentIndex < 0) currentIndex = 0;

    // Additional safety: if currentIndex does not advance, break to prevent infinite loop.
    if (currentIndex <= prevIndex && end < textLength) {
        console.warn('[Worker] currentIndex did not advance. Breaking loop to prevent infinite repetition. Prev:', prevIndex, 'Curr:', currentIndex, 'End:', end);
        // Force advancement or break
        currentIndex = prevIndex + Math.max(1, chunkSize - overlap); // Try to jump forward
        if (currentIndex >= end && end < textLength) { // If jump is too much, just take next full chunk from end
             currentIndex = end;
        }
        if (currentIndex <= prevIndex) { // If still stuck, break
            break;
        }
    }
  }
  console.log(`[Worker] chunkText finished. Total chunks: ${chunks.length}. Iterations: ${iterations}`);
  return chunks;
}

function processDocument(text, fileInfo) {
  const documentId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  self.postMessage({ type: 'progress', progress: 0, message: 'Starting document chunking...' });
  
  const chunks = chunkText(text, fileInfo.chunkSize, fileInfo.overlap);
  
  return {
    id: documentId,
    filename: fileInfo.name,
    type: fileInfo.type,
    createdAt: new Date().toISOString(),
    totalChunks: chunks.length,
    textPreview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
    textLength: text.length,
    chunks: chunks.map((chunk, index) => ({
      id: `${documentId}-chunk-${index}`,
      index,
      ...chunk,
      metadata: { ...chunk.metadata, source: fileInfo.name, chunkIndex: index, totalChunks: chunks.length }
    }))
  };
}

self.onmessage = function(e) {
  try {
    const { text, fileInfo, action } = e.data;
    console.log(`[Worker] Received action: ${action} for file: ${fileInfo ? fileInfo.name : 'N/A'}`);
    
    if (action === 'process') {
      const result = processDocument(text, fileInfo);
      self.postMessage({ type: 'complete', processedDocument: result });
    } else {
      self.postMessage({ type: 'error', error: `Unknown worker action: ${action}` });
    }
  } catch (error) {
    console.error('[Worker] Error in onmessage:', error.message, error.stack);
    self.postMessage({ type: 'error', error: error.message || 'Unknown error in worker onmessage' });
  }
};