import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CollaborativeDocument from "@/models/CollaborativeDocument";
import Collaboration from "@/models/Collaboration";
import { broadcastUpdate } from '../sse/route';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        
        // Verify user is part of collaboration
        const collaboration = await Collaboration.findById(body.collaborationId);
        if (!collaboration || 
            (collaboration.createdBy !== body.userEmail && 
             !collaboration.members.includes(body.userEmail))) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const document = await CollaborativeDocument.create({
            title: body.title,
            content: body.content,
            collaborationId: body.collaborationId,
            createdBy: body.userEmail,
            lastEditedBy: body.userEmail
        });

        return NextResponse.json({
            message: "Document created successfully",
            data: document
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({
            message: "Error creating document",
            error: error.message
        }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();
        const collaborationId = req.nextUrl.searchParams.get('collaborationId');
        const userEmail = req.nextUrl.searchParams.get('email');

        // Verify user is part of collaboration
        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration || 
            (collaboration.createdBy !== userEmail && 
             !collaboration.members.includes(userEmail))) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const documents = await CollaborativeDocument.find({ collaborationId });

        return NextResponse.json({
            message: "Documents fetched successfully",
            data: documents
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({
            message: "Error fetching documents",
            error: error.message
        }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await dbConnect();
        const body = await req.json();

        // Verify user is part of collaboration
        const document = await CollaborativeDocument.findById(body.documentId);
        if (!document) {
            return NextResponse.json({ message: "Document not found" }, { status: 404 });
        }

        const collaboration = await Collaboration.findById(document.collaborationId);
        if (!collaboration || 
            (collaboration.createdBy !== body.userEmail && 
             !collaboration.members.includes(body.userEmail))) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const updatedDocument = await CollaborativeDocument.findByIdAndUpdate(
            body.documentId,
            {
                content: body.content,
                lastEditedBy: body.userEmail,
                lastEditedAt: new Date()
            },
            { new: true }
        );

        // Broadcast update to all connected clients
        await broadcastUpdate(body.documentId, {
            type: 'update',
            content: body.content,
            lastEditedBy: body.userEmail,
            lastEditedAt: new Date()
        });

        return NextResponse.json({
            message: "Document updated successfully",
            data: updatedDocument
        });
    } catch (error) {
        return NextResponse.json({
            message: "Error updating document",
            error: error.message
        }, { status: 500 });
    }
}