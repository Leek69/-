'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types'
import { useRouter } from 'next/navigation'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#6b7280',
]

interface Props {
  categories: Category[]
  householdId: string
}

export default function CategoriesClient({ categories: initial, householdId }: Props) {
  const [categories, setCategories] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const expenseCategories = categories.filter(c => c.type === 'expense')
  const incomeCategories = categories.filter(c => c.type === 'income')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('categories')
      .insert({ household_id: householdId, name: name.trim(), type, color, icon: 'tag' })
      .select()
      .single()

    if (!error && data) {
      setCategories(prev => [...prev, data])
      setName('')
      setShowForm(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('このカテゴリを削除しますか？\n（このカテゴリの取引は「未分類」になります）')) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  function CategoryGroup({ title, items }: { title: string; items: Category[] }) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map(cat => (
            <div key={cat.id} className="px-4 py-3 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-medium text-gray-800">{cat.name}</span>
              </div>
              <button
                onClick={() => handleDelete(cat.id)}
                className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm"
              >
                ✕
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="px-4 py-4 text-center text-gray-400 text-sm">なし</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">カテゴリ管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + 追加
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">新しいカテゴリ</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  type === 'expense' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  type === 'income' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-gray-200 text-gray-600'
                }`}
              >
                収入
              </button>
            </div>

            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="カテゴリ名"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">カラー</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <CategoryGroup title="支出カテゴリ" items={expenseCategories} />
        <CategoryGroup title="収入カテゴリ" items={incomeCategories} />
      </div>
    </div>
  )
}
