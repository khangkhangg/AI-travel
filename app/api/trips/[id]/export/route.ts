import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/supabase';
import { query } from '@/lib/db';
import { createEvents, EventAttributes } from 'ics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'ical';

    // Get trip details
    const tripResult = await query(
      `SELECT t.*, u.email, u.full_name
       FROM trips t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const trip = tripResult.rows[0];

    // Check access
    const isOwner = user && trip.user_id === user.id;
    const isCollaborator = user ? (await query(
      'SELECT id FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2',
      [id, user.id]
    )).rows.length > 0 : false;
    const isPublic = trip.visibility === 'public';

    if (!isPublic && !isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get itinerary items
    const itemsResult = await query(
      `SELECT * FROM itinerary_items
       WHERE trip_id = $1
       ORDER BY day_number, order_index`,
      [id]
    );

    const items = itemsResult.rows;

    if (format === 'ical' || format === 'gcal') {
      // Generate iCalendar format
      const events: EventAttributes[] = [];

      items.forEach((item: any) => {
        const startDate = new Date(trip.start_date);
        startDate.setDate(startDate.getDate() + (item.day_number - 1));

        // Parse time if available
        let hour = 9;
        let minute = 0;
        if (item.time_slot) {
          const timeMatch = item.time_slot.match(/(\d+):(\d+)/);
          if (timeMatch) {
            hour = parseInt(timeMatch[1]);
            minute = parseInt(timeMatch[2]);
          }
        }

        startDate.setHours(hour, minute);
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + (item.estimated_duration_minutes || 60));

        events.push({
          start: [
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            startDate.getDate(),
            startDate.getHours(),
            startDate.getMinutes()
          ],
          end: [
            endDate.getFullYear(),
            endDate.getMonth() + 1,
            endDate.getDate(),
            endDate.getHours(),
            endDate.getMinutes()
          ],
          title: item.title,
          description: [
            item.description || '',
            item.location_name ? `Location: ${item.location_name}` : '',
            item.location_address ? `Address: ${item.location_address}` : '',
            item.estimated_cost ? `Cost: $${item.estimated_cost}` : '',
            item.notes || ''
          ].filter(Boolean).join('\n'),
          location: item.location_address || item.location_name || '',
          url: item.google_place_id ? `https://www.google.com/maps/place/?q=place_id:${item.google_place_id}` : '',
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
          organizer: { name: trip.full_name || trip.email, email: trip.email }
        });
      });

      const { error, value } = createEvents(events);

      if (error) {
        console.error('ICS generation error:', error);
        return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
      }

      // Update export flag
      await query('UPDATE trips SET is_exported = true WHERE id = $1', [id]);

      return new NextResponse(value, {
        headers: {
          'Content-Type': 'text/calendar',
          'Content-Disposition': `attachment; filename="${trip.title || 'trip'}.ics"`
        }
      });
    } else if (format === 'json') {
      // JSON export
      return NextResponse.json({
        trip: {
          ...trip,
          items
        }
      });
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Failed to export trip:', error);
    return NextResponse.json(
      { error: 'Failed to export trip' },
      { status: 500 }
    );
  }
}
