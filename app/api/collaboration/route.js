import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Collaboration from "@/models/Collaboration";
import Class from '@/models/Class';

export async function POST(req) {
    try {
        await dbConnect();
        const { email, groupName, members, classId } = await req.json();

        const collaboration = new Collaboration({
            createdBy: email,
            groupName,
            members,
            classId
        });

        await collaboration.save();

        return NextResponse.json({
            message: "Collaboration created successfully",
            data: collaboration
        }, { status: 201 });


    } catch (error) {
        return NextResponse.json({
            message: "Error creating collaboration",
            error: error.message
        }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();
        const email = req.nextUrl.searchParams.get('email');

        const collaborations = await Collaboration.find({
            $or: [
                { createdBy: email },
                { members: email }
            ]
        });

        return NextResponse.json({
            message: "Collaborations fetched successfully",
            data: collaborations
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({
            message: "Error fetching collaborations",
            error: error.message
        }, { status: 500 });
    }
}
