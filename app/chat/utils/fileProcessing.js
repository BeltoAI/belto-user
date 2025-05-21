import * as pdfjsLib from 'pdfjs-dist/webpack';
import mammoth from 'mammoth';

const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// Helper function to convert file to Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); // Get only the Base64 part
    reader.onerror = (error) => reject(error);
  });
};

// Robust chunkText function for fallback (main thread)
const chunkTextDirectly = (text, chunkSize = 1000, overlap = 200) => {
  if (!text || text.length === 0) return [];

  const chunks = [];
  let currentIndex = 0;
  const textLength = text.length;
  let iterations = 0;

  while (currentIndex < textLength) {
    iterations++;
    if (iterations > textLength / Math.max(1, chunkSize - overlap) + 100 && iterations > 1000) {
        console.error('[MainThread Chunking] Excessive iterations, breaking loop.');
        break;
    }

    let end = Math.min(currentIndex + chunkSize, textLength);

    if (end < textLength) {
      let adjustedEnd = -1;
      for (let j = Math.min(end + 50, textLength - 1); j >= Math.max(0, end - 50, currentIndex + 1); j--) {
        if ('.!?'.includes(text[j])) {
          if ((j + 1 < textLength && text[j + 1] === ' ') || j + 1 === textLength) {
            adjustedEnd = j + 1;
            break;
          }
        }
      }
      if (adjustedEnd !== -1 && adjustedEnd > currentIndex) {
        end = adjustedEnd;
      }
    }

    const chunkContent = text.substring(currentIndex, end).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        content: chunkContent,
        metadata: { startChar: currentIndex, endChar: end }
      });
    }
    
    if (end === textLength) {
      break; 
    }

    const prevIndex = currentIndex;
    currentIndex = end - overlap;
    if (currentIndex < 0) currentIndex = 0;

    if (currentIndex <= prevIndex && end < textLength) {
        currentIndex = prevIndex + Math.max(1, chunkSize - overlap);
        if (currentIndex >= end && end < textLength) {
             currentIndex = end;
        }
        if (currentIndex <= prevIndex) {
            break;
        }
    }
  }
  return chunks;
};

// Fallback document processing on the main thread
const processDocumentFallback = (text, fileInfo) => {
  const documentId = Date.now().toString(36) + Math.random().toString(36).substring(2);
  const chunks = chunkTextDirectly(text, fileInfo.chunkSize || 1000, fileInfo.overlap || 200);
  
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
};

export const extractTextFromPdf = async (file) => {
  try {
    const file_base64 = await fileToBase64(file);
    const response = await fetch(`/api/belto-proxy/process_pdf_base64`, { // MODIFIED
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': process.env.NEXT_PUBLIC_BELTO_API_KEY || '123456789012345'
      },
      body: JSON.stringify({
        file_base64,
      })
    });

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorDetails;
      } catch (jsonError) {
        // Ignore if parsing error details fails, stick with statusText
      }
      throw new Error(`Textractor API PDF Error: ${response.status} ${errorDetails}`);
    }

    const result = await response.json();
    if (!result.text || !result.text.trim()) throw new Error('No text content found in PDF by API');
    console.log('Text extracted from PDF via API successfully.');
    return result.text.trim();
  } catch (error) {
    console.error('PDF extraction error (API):', error.message);
    console.warn('API PDF extraction failed. Falling back to client-side pdfjsLib.');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let textContent = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(item => item.str).join(' ') + '\n';
      }
      if (!textContent.trim()) {
        console.error('Client-side PDF extraction (pdfjsLib) also failed to find text.');
        throw new Error('Client-side PDF extraction (pdfjsLib) also failed to find text.');
      }
      console.log('Text extracted from PDF via client-side fallback (pdfjsLib).');
      return textContent.trim();
    } catch (fallbackError) {
      console.error('PDF extraction fallback error (pdfjsLib):', fallbackError.message);
      throw new Error(`Could not extract text from PDF (API and fallback failed): ${fallbackError.message}`);
    }
  }
};

export const extractTextFromDocx = async (file) => {
  try {
    const file_base64 = await fileToBase64(file);
    const response = await fetch(`/api/belto-proxy/process_docx_base64`, { // MODIFIED
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': process.env.NEXT_PUBLIC_BELTO_API_KEY || '123456789012345'
      },
      body: JSON.stringify({
        file_base64,
      })
    });

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorDetails;
      } catch (jsonError) {
        // Ignore
      }
      throw new Error(`Textractor API DOCX Error: ${response.status} ${errorDetails}`);
    }

    const result = await response.json();
    if (!result.text || !result.text.trim()) throw new Error('No text content found in DOCX by API');
    console.log('Text extracted from DOCX via API successfully.');
    return result.text.trim();
  } catch (error) {
    console.error('DOCX extraction error (API):', error.message);
    console.warn('API DOCX extraction failed. Falling back to client-side mammoth.js.');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const textContent = result.value;
      if (!textContent || !textContent.trim()) {
        console.error('Client-side DOCX extraction (mammoth) also failed to find text.');
        throw new Error('Client-side DOCX extraction (mammoth) also failed to find text.');
      }
      console.log('Text extracted from DOCX via client-side fallback (mammoth.js).');
      return textContent.trim();
    } catch (fallbackError) {
      console.error('DOCX extraction fallback error (mammoth.js):', fallbackError.message);
      throw new Error(`Failed to extract text from DOCX (API and fallback failed): ${fallbackError.message}`);
    }
  }
};

export const processFiles = async (files, setAttachmentCallback, toast) => {
  const allowedTypes = {
    'application/pdf': extractTextFromPdf,
    'application/msword': extractTextFromDocx,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extractTextFromDocx,
    'text/plain': (file) => file.text()
  };

  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxTextLength = 250000; 

  if (!files || files.length === 0) return [];
  const file = files[0];
  const loadingToastId = toast.loading(`Processing ${file.name}...`);

  try {
    if (!allowedTypes[file.type]) throw new Error(`Unsupported file type: ${file.type}.`);
    if (file.size > maxFileSize) throw new Error('File size exceeds 10MB limit.');

    toast.update(loadingToastId, { render: `Extracting text from ${file.name}...`, isLoading: true });
    const text = await allowedTypes[file.type](file);
    
    if (!text || !text.trim()) throw new Error('No text content could be extracted from the file.');
    
    let finalText = text;
    if (text.length > maxTextLength) {
      finalText = text.substring(0, maxTextLength);
      toast.update(loadingToastId, {
        render: `Text too large. Processing first ${Math.round(maxTextLength/1000)}KB.`,
        type: 'warning', isLoading: true,
      });
    }

    const initialProcessedFile = { name: file.name, content: finalText, type: file.type };

    toast.update(loadingToastId, { render: `Chunking document for RAG...`, isLoading: true });

    let processedDocument;
    let usedFallback = false;

    try {
      if (window.Worker) {
        processedDocument = await new Promise((resolve, reject) => {
          const worker = new Worker('/documentChunker.js'); 
          let lastToastProgress = 0;
          const workerTimeout = setTimeout(() => {
            worker.terminate();
            reject(new Error('Chunking timed out (60 seconds).'));
          }, 60000); 

          worker.onmessage = (event) => {
            const data = event.data;
            if (data.type === 'progress' && data.progress > lastToastProgress) {
              toast.update(loadingToastId, { render: `Chunking document... (${data.progress}%)`, isLoading: true });
              lastToastProgress = data.progress;
            } else if (data.type === 'complete') {
              clearTimeout(workerTimeout);
              resolve(data.processedDocument);
              worker.terminate();
            } else if (data.type === 'error') {
              clearTimeout(workerTimeout);
              reject(new Error(data.error || 'Unknown worker error.'));
              worker.terminate();
            }
          };
          worker.onerror = (error) => {
            clearTimeout(workerTimeout);
            reject(new Error(`Worker script error: ${error.message || 'Failed to load/run chunker.'}`));
            worker.terminate();
          };
          worker.postMessage({
            action: 'process',
            text: finalText,
            fileInfo: { name: file.name, type: file.type, chunkSize: 1000, overlap: 200 }
          });
        });
      } else {
        throw new Error('Web Workers not supported, using fallback.');
      }
    } catch (error) {
      console.warn("Worker processing failed, using fallback:", error.message);
      usedFallback = true;
      toast.update(loadingToastId, { render: `Chunking (fallback)...`, isLoading: true });
      await new Promise(resolve => setTimeout(resolve, 50)); 
      processedDocument = processDocumentFallback(finalText, { name: file.name, type: file.type, chunkSize: 1000, overlap: 200 });
    }
    
    if (processedDocument) {
      processedDocument.ragReady = false; // Initialize ragReady status
      if (processedDocument.chunks && processedDocument.chunks.length > 0) {
        toast.update(loadingToastId, { render: `Generating embeddings...`, isLoading: true });
        let embeddingsSucceeded = false;
        try {
          const chunksToEmbed = processedDocument.chunks.map(chunk => chunk.content);
          const embeddingsResponse = await fetch(`/api/belto-proxy/embed`, { // MODIFIED
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.NEXT_PUBLIC_BELTO_EMBEDDINGS_API_KEY || '123456789012345'
            },
            body: JSON.stringify({ text: chunksToEmbed })
          });

          if (!embeddingsResponse.ok) {
            let errorText = embeddingsResponse.statusText;
            try {
              const errorData = await embeddingsResponse.json();
              errorText = errorData.error || errorText;
            } catch (e) {
              console.warn("Could not parse error response as JSON from embeddings API:", e);
            }
            throw new Error(`Embeddings API Error: ${embeddingsResponse.status} ${errorText}`);
          }

          const embeddingsResult = await embeddingsResponse.json();
          if (embeddingsResult.embeddings && embeddingsResult.embeddings.length === processedDocument.chunks.length) {
            processedDocument.chunks.forEach((chunk, index) => {
              chunk.embedding = embeddingsResult.embeddings[index];
            });
            embeddingsSucceeded = true;
          } else {
            throw new Error('Mismatch in returned embeddings count or embeddings data missing.');
          }
        } catch (embeddingError) {
          console.error("Error generating embeddings:", embeddingError);
          toast.update(loadingToastId, {
            render: `Embeddings error: ${embeddingError.message}. Proceeding without.`,
            type: 'warning', isLoading: true, autoClose: 4000 
          });
        }
        processedDocument.ragReady = embeddingsSucceeded &&
          processedDocument.chunks.every(chunk => chunk.embedding && chunk.embedding.length > 0);
      } else {
        console.warn("Document processed but no chunks were generated. RAG will not be ready.");
      }
    }

    const enhancedFile = {
      ...initialProcessedFile,
      document: processedDocument,
      ragReady: processedDocument ? processedDocument.ragReady : false
    };
    setAttachmentCallback([enhancedFile]);

    // ---- BEGIN ADDED CODE ----
    if (processedDocument && processedDocument.chunks && processedDocument.chunks.length > 0) {
      // Send the processed document to the backend to be saved
      try {
        toast.update(loadingToastId, { render: `Saving document to database...`, isLoading: true });
        const saveResponse = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: file.name, // Original file name
            type: file.type, // Original file type
            document: processedDocument, // The processed document object with chunks and embeddings
          }),
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(errorData.error || `Failed to save document: ${saveResponse.statusText}`);
        }
        const saveData = await saveResponse.json();
        console.log('Document saved successfully:', saveData);
        toast.update(loadingToastId, { render: `Document saved! ${saveData.chunksSaved} chunks.`, isLoading: true });
      } catch (saveError) {
        console.error("Error saving document to backend:", saveError);
        toast.update(loadingToastId, {
          render: `Error saving document: ${saveError.message}`,
          type: 'error',
          isLoading: true, // Keep loading indicator for a moment
          autoClose: 4000,
        });
        // Decide if you want to proceed with a non-saved document or mark ragReady as false
        // For now, we let the original ragReady status persist but notify the user of save failure.
      }
    }
    // ---- END ADDED CODE ----

    let finalMessage;
    let finalType = 'warning';

    if (processedDocument) {
      const numChunks = processedDocument.totalChunks || (processedDocument.chunks ? processedDocument.chunks.length : 0);
      finalMessage = `${usedFallback ? 'Fallback chunking complete' : 'Chunking complete'}: ${numChunks} chunks.`;

      if (numChunks > 0) {
        if (processedDocument.ragReady) {
          finalMessage += ' Embeddings generated successfully.';
          finalType = 'success';
        } else {
          finalMessage += ' Embeddings failed or skipped.';
          finalType = 'warning';
        }
      } else {
        finalMessage += ' No chunks were generated to embed.';
        finalType = 'warning';
      }
    } else {
      finalMessage = `Document processing failed before chunking or chunking yielded no document.`;
      finalType = 'error';
    }

    toast.update(loadingToastId, {
      render: finalMessage,
      type: finalType,
      isLoading: false,
      autoClose: 3000
    });

    return [enhancedFile];
  } catch (error) {
    console.error(`Error in processFiles for ${file.name}:`, error);
    toast.update(loadingToastId, {
      render: `Error: ${error.message}`,
      type: 'error',
      isLoading: false,
      autoClose: 5000
    });
    setAttachmentCallback([{ 
        name: file.name, 
        error: error.message, 
        document: null,
        ragReady: false 
    }]);
    return [];
  }
};