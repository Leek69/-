import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionsClient from './TransactionsClient'

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/settings?setup=true')

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('household_id', profile.household_id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200)

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', profile.household_id)

  return (
    <TransactionsClient
      transactions={transactions || []}
      categories={categories || []}
      householdId={profile.household_id}
    />
  )
}
