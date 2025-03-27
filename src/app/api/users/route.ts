import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getUserById, updateUser } from "@/app/utils/users";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (id) {
            const user = await getUserById(id);
            return NextResponse.json(user);
        }
        
        const user = await getCurrentUser();
        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message }, 
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const data = await request.json();
        const { id, ...userData } = data;
        
        if (!id) {
            return NextResponse.json(
                { error: 'ID de usuario no proporcionado' }, 
                { status: 400 }
            );
        }
        
        const updatedUser = await updateUser(id, userData);
        return NextResponse.json(updatedUser);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message }, 
            { status: 500 }
        );
    }
} 