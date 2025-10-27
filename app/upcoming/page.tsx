'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type UpcomingItem = {
  id: string;
  type: 'income' | 'expense' | 'loan';
  name: string;
  lender?: string;
  amount: number;
  balance?: number;
  hasBonus?: boolean;
  bonusIncluded?: boolean;
  baseAmount?: number;
  bonusAmount?: number;
  dueDate: Date | null;
  frequency: string;
  source: 'transaction' | 'loan';
};

export default function UpcomingPayments() {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const response = await fetch('/api/upcoming', {
        headers: { 'x-user-id': '1' },
      });

      if (!response.ok) throw new Error('Failed to fetch upcoming payments');

      const data = await response.json();
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date set';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';
    
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${dayOfWeek}, ${formatted}`;
  };

  const getDaysUntil = (date: Date | null) => {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);
    const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      case 'loan':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income':
        return 'Income';
      case 'expense':
        return 'Expense';
      case 'loan':
        return 'Loan Payment';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading upcoming payments...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Payments</h1>
          <p className="text-gray-600 mt-2">View all upcoming income and expenses in chronological order</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No upcoming payments scheduled</p>
            <Link href="/add-transaction" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
              Add a transaction
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const daysUntil = getDaysUntil(item.dueDate);
              const isOverdue = daysUntil !== null && daysUntil < 0;
              const isDueSoon = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                    isOverdue
                      ? 'border-red-500'
                      : isDueSoon
                      ? 'border-yellow-500'
                      : 'border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(item.type)}`}>
                          {getTypeLabel(item.type)}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{item.frequency}</span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      
                      {item.lender && (
                        <p className="text-sm text-gray-600">Lender: {item.lender}</p>
                      )}
                      
                      {item.hasBonus && item.bonusIncluded && (
                        <p className="text-sm text-green-600 mt-1">
                          ⭐ Bonus included: ${item.baseAmount?.toFixed(2)} base + ${item.bonusAmount?.toFixed(2)} bonus
                        </p>
                      )}
                      
                      {item.balance && (
                        <p className="text-sm text-gray-600 mt-1">Balance: ${item.balance.toFixed(2)}</p>
                      )}
                      
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Due: </span>
                        {formatDate(item.dueDate)}
                        {daysUntil !== null && (
                          <span className={`ml-2 ${isOverdue ? 'text-red-600 font-semibold' : isDueSoon ? 'text-yellow-600 font-semibold' : ''}`}>
                            {isOverdue ? `${Math.abs(daysUntil)} days overdue` : `(in ${daysUntil} days)`}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold ${
                        item.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
