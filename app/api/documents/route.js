import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import DocumentChunk from '@/models/DocumentChunk';
import Document from '@/models/Document'; // Ensure this model exists and is correctly defined

export async function POST(req) {
  try {
    await connectDB();
    const { name, type, document } = await req.json(); // Structure from fileProcessing.js

    if (!document || !document.id || !document.chunks || !document.filename) {
      return NextResponse.json({ error: 'Invalid document data: Missing document ID, chunks, or filename.' }, { status: 400 });
    }

    if (!document.chunks.every(chunk => chunk.embedding && Array.isArray(chunk.embedding) && chunk.embedding.length > 0)) {
      return NextResponse.json({ error: 'Invalid document data: Some chunks are missing embeddings or embeddings are empty.' }, { status: 400 });
    }

    // Optional: Create or update a parent Document entry
    let parentDoc = await Document.findOneAndUpdate(
      { documentId: document.id }, // document.id is the unique ID generated client-side
      {
        documentId: document.id,
        filename: document.filename,
        filetype: document.type || type,
        totalChunks: document.chunks.length,
        textPreview: document.textPreview,
        status: 'processed',
        lastUpdatedAt: new Date(),
        // userId: userId, // If you associate documents with users, get userId from session or request
      },
      { upsert: true, new: true, runValidators: true }
    );

    const chunksToSave = document.chunks.map(chunk => ({
      documentId: document.id, // Client-generated unique ID for the document
      originalFilename: document.filename,
      chunkIndex: chunk.index,
      content: chunk.content,
      embedding: chunk.embedding, // Vector from Belto Embeddings API
      metadata: chunk.metadata,
      docModelId: parentDoc._id // MongoDB ObjectId of the parent Document in your DB
    }));

    // Efficiently insert many chunks
    await DocumentChunk.insertMany(chunksToSave);

    return NextResponse.json({
      message: 'Document and chunks processed and saved successfully',
      documentId: document.id,
      parentDocumentMongoId: parentDoc._id,
      chunksSaved: chunksToSave.length
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving document and chunks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save document and chunks' },
      { status: 500 }
    );
  }
}
