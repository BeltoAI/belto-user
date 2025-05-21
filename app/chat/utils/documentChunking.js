/**
 * Splits text into overlapping chunks for more effective retrieval
 * @param {string} text - The document text to chunk
 * @param {number} chunkSize - Maximum size of each chunk in characters
 * @param {number} overlap - Number of overlapping characters between chunks
 * @returns {Array} Array of text chunks
 */
export const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  if (!text) return [];
  
  const chunks = [];
  
  // Process text in small batches to be less CPU intensive
  const batchSize = 5000; // Process 5KB at a time
  const totalBatches = Math.ceil(text.length / batchSize);
  
  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const startPos = batchNum * batchSize;
    const endPos = Math.min(startPos + batchSize, text.length);
    let i = startPos;
    
    while (i < endPos && i < text.length) {
      // Calculate end position with respect to chunk size
      let end = Math.min(i + chunkSize, text.length);
      
      // Simple break point detection (avoid complex regex for performance)
      if (end < text.length) {
        // Look only 30 chars ahead max for a period
        for (let j = 0; j < 30 && end + j < text.length; j++) {
          if (text[end + j] === '.' && (end + j + 1 >= text.length || text[end + j + 1] === ' ')) {
            end = end + j + 1;
            break;
          }
        }
      }
      
      chunks.push({
        content: text.substring(i, end).trim(),
        metadata: {
          startChar: i,
          endChar: end
        }
      });
      
      i = end - overlap;
    }
  }
  
  return chunks;
};

/**
 * Process document and create chunks with document metadata
 * @param {string} text - The extracted document text
 * @param {Object} fileInfo - Information about the file
 * @returns {Object} Document with metadata and chunks
 */
export const processDocumentText = (text, fileInfo) => {
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
};