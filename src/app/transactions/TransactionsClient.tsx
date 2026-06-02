'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction, Category } from '@/types'
import { formatCurrency } from '@/lib/formatters'
import TransactionModal from '@/components/transactions/TransactionModal'

interface Props {
  transactions: Transaction[]
  categories: Category[]
  householdId: string
}

export default function TransactionsClient({ transactions: initial, categories, householdId }: Props) {
  const [transactions, setTransactions] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('transactions-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `household_id=eq.${householdId}`,
      }, () => {
        supabase
          .from('transactions')
          .select('*, category:categories(*)')
          .eq('household_id', householdId)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(200)
          .then(({ data }) => { if (data) setTransactions(data) })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [householdId, supabase])

  async function handleDelete(id: string) {
    if (!confirm('この取引を削除しますか？')) return
    await supabase.from('transactions').delete().eq('id', id)
  }

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  // Group by date
  const grouped = filtered.reduce((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {} as Record<string, Transaction[]>)

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">収支一覧</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + 記録する
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-4 bg-white">
        {(['all', 'expense', 'income'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'すべて' : f === 'expense' ? '支出' : '収入'}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm shadow-sm border border-gray-100">
          取引がありません
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500">{date}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {txs.map(tx => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: tx.category?.color || '#9ca3af' }}
                    >
                      {tx.category?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {tx.note || tx.category?.name || '未分類'}
                      </p>
                      {tx.note && <p className="text-xs text-gray-400">{tx.category?.name}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
