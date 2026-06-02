'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Household, Profile } from '@/types'

interface Props {
  profile: Profile | null
  household: Household | null
  members: { id: string; display_name: string }[]
}

export default function SettingsClient({ profile, household, members }: Props) {
  const [householdName, setHouseholdName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function createHousehold(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: hh, error: hhError } = await supabase
      .from('households')
      .insert({ name: householdName })
      .select()
      .single()

    if (hhError || !hh) {
      setError('世帯の作成に失敗しました')
      setLoading(false)
      return
    }

    // Update profile
    await supabase.from('profiles').update({ household_id: hh.id }).eq('id', profile!.id)

    // Create default categories
    await supabase.rpc('create_default_categories', { p_household_id: hh.id })

    setSuccess('世帯を作成しました！')
    setTimeout(() => router.refresh(), 1000)
  }

  async function joinHousehold(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: hh } = await supabase
      .from('households')
      .select('id')
      .eq('invite_code', inviteCode.trim())
      .single()

    if (!hh) {
      setError('招待コードが見つかりません')
      setLoading(false)
      return
    }

    const { data: existingMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('household_id', hh.id)

    if (existingMembers && existingMembers.length >= 2) {
      setError('この世帯はすでに2人のメンバーがいます')
      setLoading(false)
      return
    }

    await supabase.from('profiles').update({ household_id: hh.id }).eq('id', profile!.id)
    setSuccess('世帯に参加しました！')
    setTimeout(() => router.refresh(), 1000)
  }

  async function copyInviteCode() {
    if (household?.invite_code) {
      await navigator.clipboard.writeText(household.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!profile) return null

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">設定</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg p-3 mb-4 text-sm">{success}</div>
      )}

      {/* Profile info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">プロフィール</h2>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg">
            {profile.display_name?.[0] || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{profile.display_name}</p>
            <p className="text-sm text-gray-500">あなたのアカウント</p>
          </div>
        </div>
      </div>

      {household ? (
        <>
          {/* Household info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">世帯情報</h2>
            <p className="text-lg font-bold text-gray-900 mb-4">{household.name}</p>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">招待コード（パートナーと共有してください）</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-indigo-700">
                  {household.invite_code}
                </code>
                <button
                  onClick={copyInviteCode}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? 'コピー済み' : 'コピー'}
                </button>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">メンバー ({members.length}/2)</h2>
            <div className="space-y-3">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                    {m.display_name?.[0] || '?'}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{m.display_name}</span>
                  {m.id === profile.id && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">あなた</span>
                  )}
                </div>
              ))}
              {members.length < 2 && (
                <div className="text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
                  招待コードをパートナーに共有して参加してもらいましょう
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Create household */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">新しい世帯を作成</h2>
            <form onSubmit={createHousehold} className="space-y-3">
              <input
                type="text"
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                required
                placeholder="例：田中家"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
              >
                世帯を作成する
              </button>
            </form>
          </div>

          <div className="text-center text-sm text-gray-400">または</div>

          {/* Join household */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">招待コードで参加</h2>
            <form onSubmit={joinHousehold} className="space-y-3">
              <input
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                required
                placeholder="招待コードを入力"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
              >
                参加する
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
