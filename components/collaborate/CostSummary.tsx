'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, DollarSign, Users, ArrowRight, Check } from 'lucide-react';
import { CostBreakdown, Traveler, Settlement } from '@/lib/types/collaborate';

interface CostSummaryProps {
  costBreakdown: CostBreakdown | null;
  travelers: Traveler[];
  onSettle: (settlementId: string) => void;
}

export default function CostSummary({
  costBreakdown,
  travelers,
  onSettle,
}: CostSummaryProps) {
  const [expanded, setExpanded] = useState(false);

  if (!costBreakdown) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">Cost Summary</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">No costs yet</p>
      </div>
    );
  }

  const { total, perPerson, paidBy, settlements } = costBreakdown;
  const pendingSettlements = settlements.filter(s => !s.isSettled);
  const settledSettlements = settlements.filter(s => s.isSettled);

  return (
    <div className="bg-white">
      {/* Header - Always Visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-900">${total.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Total trip cost</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-medium text-gray-700">${perPerson.toFixed(2)}</p>
            <p className="text-xs text-gray-500">per person</p>
          </div>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
          {/* Who Paid What */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Who Paid
            </h4>
            <div className="space-y-2">
              {paidBy.map((payment) => (
                <div
                  key={payment.travelerId}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{payment.travelerName}</span>
                  <span className="font-medium text-gray-900">
                    ${payment.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Settlements Needed */}
          {pendingSettlements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Settle Up
              </h4>
              <div className="space-y-2">
                {pendingSettlements.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between py-2 px-3 bg-amber-50 rounded-lg border border-amber-200"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-900">
                        {settlement.fromUserName}
                      </span>
                      <ArrowRight className="w-4 h-4 text-amber-600" />
                      <span className="font-medium text-gray-900">
                        {settlement.toUserName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-700">
                        ${settlement.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onSettle(settlement.id)}
                        className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                        title="Mark as settled"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settled */}
          {settledSettlements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Settled
              </h4>
              <div className="space-y-2">
                {settledSettlements.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg opacity-60"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{settlement.fromUserName}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span>{settlement.toUserName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">
                        ${settlement.amount.toFixed(2)}
                      </span>
                      <Check className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Settled Message */}
          {settlements.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">All costs are split equally</p>
            </div>
          )}

          {pendingSettlements.length === 0 && settledSettlements.length > 0 && (
            <div className="text-center py-2 text-emerald-600 text-sm font-medium">
              All settled up!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
