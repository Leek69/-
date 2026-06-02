'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction, Category } from '@/types'
import { formatCurrency, getMonthLabel } from '@/lib/formatters'
import TransactionModal from '@/components/transactions/TransactionModal'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts'

interface Props {
  transactions: Transaction[]
  categories: Category[]
  householdId: string
  year: number
  month: number
}

export default function DashboardClient({
  transactions: initial,
  categories,
  householdId,
  year,
  month,
}: Props) {
  const [transactions, setTransactions] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          // Refetch on any change
          const startDate = `${year}-${String(month).padStart(2, '0')}-01`
          const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
          supabase
            .from('transactions')
            .select('*, category:categories(*)')
            .eq('household_id', householdId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false })
            .then(({ data }) => {
              if (data) setTransactions(data)
            })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [householdId, year, month, supabase])

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  // Category breakdown for expenses
  const categoryBreakdown = categories
    .filter(c => c.type === 'expense')
    .map(cat => ({
      name: cat.name,
      value: transactions
        .filter(t => t.category_id === cat.id && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0),
      color: cat.color,
    }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {getMonthLabel(year, month)}の家計
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <span>+</span> 記録する
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">収入</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(income)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">支出</p>
          <p className="text-xl font-bold text-red-500 mt-1">{formatCurrency(expense)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">残高</p>
          <p className={`text-xl font-bold mt-1 ${balance >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Pie chart */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">支出の内訳</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend formatter={v => v} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category list */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">カテゴリ別支出</h2>
          <div className="space-y-2">
            {categoryBreakdown.slice(0, 6).map(cat => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{formatCurrency(cat.value)}</span>
              </div>
            ))}
            {categoryBreakdown.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">支出がまだありません</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">最近の取引</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {transactions.slice(0, 10).map(tx => (
            <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
                  style={{ backgroundColor: tx.category?.color || '#9ca3af' }}
                >
                  {tx.category?.name?.[0] || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {tx.note || tx.category?.name || '未分類'}
                  </p>
                  <p className="text-xs text-gray-400">{tx.date} · {tx.category?.name}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              今月の取引はまだありません
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TransactionModal
          categories={categories}
          householdId={householdId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
