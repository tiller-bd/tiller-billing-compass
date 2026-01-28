import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAuth();
  if (session instanceof NextResponse) return session;

  try {
    const { id } = await params;
    const targetUserId = parseInt(id);
    const body = await req.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Session contains the user object directly (id, email, role, etc.)
    const currentUserId = session.id;
    const isSuperAdmin = session.role === 'SUPERADMIN';
    const isOwnPassword = currentUserId === targetUserId;

    // Authorization check:
    // - Super admin can change anyone's password
    // - Regular users can only change their own password
    if (!isSuperAdmin && !isOwnPassword) {
      return NextResponse.json(
        { message: 'You can only change your own password' },
        { status: 403 }
      );
    }

    // Hash the new password
    const password_hash = await bcrypt.hash(password, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: targetUserId },
      data: { password_hash }
    });

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { message: 'Failed to change password' },
      { status: 500 }
    );
  }
}
