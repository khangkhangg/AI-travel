import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - List comments for an itinerary
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    const { searchParams } = new URL(request.url);
    const dayNumber = searchParams.get('dayNumber');
    const activityIndex = searchParams.get('activityIndex');

    // Check access to itinerary
    const itineraryResult = await query(
      `SELECT user_id, visibility FROM itineraries WHERE id = $1`,
      [id]
    );

    if (itineraryResult.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const itinerary = itineraryResult.rows[0];
    const isOwner = user?.id === itinerary.user_id;

    // Check collaborator status for private itineraries
    if (itinerary.visibility === 'private' && !isOwner) {
      if (!user) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const collabCheck = await query(
        `SELECT id FROM itinerary_collaborators WHERE itinerary_id = $1 AND user_id = $2`,
        [id, user.id]
      );
      if (collabCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Build query for comments
    let sql = `
      SELECT
        c.*,
        u.full_name,
        u.avatar_url
      FROM itinerary_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.itinerary_id = $1
    `;
    const sqlParams: any[] = [id];
    let paramIndex = 2;

    if (dayNumber !== null) {
      sql += ` AND c.day_number = $${paramIndex++}`;
      sqlParams.push(parseInt(dayNumber));
    }
    if (activityIndex !== null) {
      sql += ` AND c.activity_index = $${paramIndex++}`;
      sqlParams.push(parseInt(activityIndex));
    }

    sql += ` ORDER BY c.created_at ASC`;

    const result = await query(sql, sqlParams);

    // Organize comments into threads (parent/replies)
    const commentsMap = new Map();
    const rootComments: any[] = [];

    result.rows.forEach((row) => {
      const comment = {
        id: row.id,
        itineraryId: row.itinerary_id,
        userId: row.user_id,
        parentId: row.parent_id,
        dayNumber: row.day_number,
        activityIndex: row.activity_index,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          id: row.user_id,
          fullName: row.full_name,
          avatarUrl: row.avatar_url,
        },
        replies: [],
      };
      commentsMap.set(row.id, comment);
    });

    // Build thread structure
    commentsMap.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentsMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return NextResponse.json({ comments: rootComments });
  } catch (error: any) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Add a comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check access to itinerary
    const itineraryResult = await query(
      `SELECT user_id, visibility FROM itineraries WHERE id = $1`,
      [id]
    );

    if (itineraryResult.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
    }

    const itinerary = itineraryResult.rows[0];
    const isOwner = user.id === itinerary.user_id;

    // For private itineraries, only owner and collaborators can comment
    if (itinerary.visibility === 'private' && !isOwner) {
      const collabCheck = await query(
        `SELECT id FROM itinerary_collaborators WHERE itinerary_id = $1 AND user_id = $2`,
        [id, user.id]
      );
      if (collabCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { content, parentId, dayNumber, activityIndex } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // If replying, verify parent exists
    if (parentId) {
      const parentCheck = await query(
        `SELECT id FROM itinerary_comments WHERE id = $1 AND itinerary_id = $2`,
        [parentId, id]
      );
      if (parentCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    }

    const result = await query(
      `INSERT INTO itinerary_comments (itinerary_id, user_id, parent_id, day_number, activity_index, content)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, user.id, parentId || null, dayNumber || null, activityIndex || null, content.trim()]
    );

    const row = result.rows[0];

    // Fetch user info
    const userResult = await query(
      `SELECT full_name, avatar_url FROM users WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json({
      comment: {
        id: row.id,
        itineraryId: row.itinerary_id,
        userId: row.user_id,
        parentId: row.parent_id,
        dayNumber: row.day_number,
        activityIndex: row.activity_index,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          id: user.id,
          fullName: userResult.rows[0]?.full_name,
          avatarUrl: userResult.rows[0]?.avatar_url,
        },
        replies: [],
      },
      message: 'Comment added successfully',
    });
  } catch (error: any) {
    console.error('Failed to add comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a comment (author or owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 });
    }

    // Check if user is comment author or itinerary owner
    const checkResult = await query(
      `SELECT c.user_id as comment_author, i.user_id as itinerary_owner
       FROM itinerary_comments c
       JOIN itineraries i ON c.itinerary_id = i.id
       WHERE c.id = $1 AND c.itinerary_id = $2`,
      [commentId, id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const { comment_author, itinerary_owner } = checkResult.rows[0];
    if (user.id !== comment_author && user.id !== itinerary_owner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await query(`DELETE FROM itinerary_comments WHERE id = $1`, [commentId]);

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
