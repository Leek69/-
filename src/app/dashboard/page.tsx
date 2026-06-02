import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) {
    redirect('/settings?setup=true')
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('household_id', profile.household_id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', profile.household_id)

  return (
    <DashboardClient
      transactions={transactions || []}
      categories={categories || []}
      householdId={profile.household_id}
      year={year}
      month={month}
    />
  )
}
