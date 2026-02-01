import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUser } from '@/lib/auth/supabase';
import { CostBreakdown, Settlement } from '@/lib/types/collaborate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tripId } = await params;
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all activities with costs
    const activitiesResult = await query(
      `SELECT id, estimated_cost, payer_id, is_split
       FROM itinerary_items
       WHERE trip_id = $1 AND estimated_cost IS NOT NULL AND estimated_cost > 0`,
      [tripId]
    );

    // Get travelers
    const travelersResult = await query(
      `SELECT id, name FROM trip_travelers WHERE trip_id = $1`,
      [tripId]
    );

    // Also get travelers from generated_content if trip_travelers is empty
    let travelers = travelersResult.rows;
    if (travelers.length === 0) {
      const tripResult = await query(
        `SELECT generated_content FROM trips WHERE id = $1`,
        [tripId]
      );
      const generatedContent = tripResult.rows[0]?.generated_content;
      if (generatedContent?.travelers) {
        travelers = generatedContent.travelers.map((t: any, i: number) => ({
          id: t.id || `traveler-${i}`,
          name: t.name,
        }));
      }
    }

    if (travelers.length === 0) {
      return NextResponse.json({
        total: 0,
        perPerson: 0,
        paidBy: [],
        settlements: [],
      });
    }

    const activities = activitiesResult.rows;
    const numTravelers = travelers.length;

    // Calculate totals
    let total = 0;
    const paidByMap: Record<string, number> = {};

    // Initialize paidBy for each traveler
    travelers.forEach((t: any) => {
      paidByMap[t.id] = 0;
    });

    for (const activity of activities) {
      const cost = parseFloat(activity.estimated_cost) || 0;
      total += cost;

      if (activity.is_split || !activity.payer_id) {
        // Split costs - divide among all travelers
        const perPersonCost = cost / numTravelers;
        travelers.forEach((t: any) => {
          paidByMap[t.id] = (paidByMap[t.id] || 0) + perPersonCost;
        });
      } else {
        // Single payer
        paidByMap[activity.payer_id] = (paidByMap[activity.payer_id] || 0) + cost;
      }
    }

    const perPerson = total / numTravelers;

    // Calculate balances (positive = owed money, negative = owes money)
    const balances: Record<string, number> = {};
    travelers.forEach((t: any) => {
      balances[t.id] = (paidByMap[t.id] || 0) - perPerson;
    });

    // Calculate settlements (who owes whom)
    const settlements: Settlement[] = [];
    const debtors = travelers.filter((t: any) => balances[t.id] < -0.01).map((t: any) => ({
      ...t,
      balance: balances[t.id],
    }));
    const creditors = travelers.filter((t: any) => balances[t.id] > 0.01).map((t: any) => ({
      ...t,
      balance: balances[t.id],
    }));

    // Simple settlement algorithm
    let debtorIdx = 0;
    let creditorIdx = 0;

    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
      const debtor = debtors[debtorIdx];
      const creditor = creditors[creditorIdx];

      const debtAmount = Math.abs(debtor.balance);
      const creditAmount = creditor.balance;
      const settleAmount = Math.min(debtAmount, creditAmount);

      if (settleAmount > 0.01) {
        settlements.push({
          id: `${debtor.id}-${creditor.id}`,
          fromUserId: debtor.id,
          fromUserName: debtor.name,
          toUserId: creditor.id,
          toUserName: creditor.name,
          amount: Math.round(settleAmount * 100) / 100,
          isSettled: false,
        });
      }

      debtor.balance += settleAmount;
      creditor.balance -= settleAmount;

      if (Math.abs(debtor.balance) < 0.01) debtorIdx++;
      if (creditor.balance < 0.01) creditorIdx++;
    }

    // Check for existing settlements and mark them
    const existingSettlements = await query(
      `SELECT from_user_id, to_user_id, is_settled
       FROM cost_settlements
       WHERE trip_id = $1`,
      [tripId]
    );

    for (const settlement of settlements) {
      const existing = existingSettlements.rows.find(
        (s: any) =>
          s.from_user_id === settlement.fromUserId &&
          s.to_user_id === settlement.toUserId
      );
      if (existing) {
        settlement.isSettled = existing.is_settled;
      }
    }

    const costBreakdown: CostBreakdown = {
      total: Math.round(total * 100) / 100,
      perPerson: Math.round(perPerson * 100) / 100,
      paidBy: travelers.map((t: any) => ({
        travelerId: t.id,
        travelerName: t.name,
        amount: Math.round((paidByMap[t.id] || 0) * 100) / 100,
      })),
      settlements,
    };

    return NextResponse.json(costBreakdown);
  } catch (error) {
    console.error('Failed to calculate costs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate costs' },
      { status: 500 }
    );
  }
}
