import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CategoriesClient from './CategoriesClient'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.household_id) redirect('/settings?setup=true')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', profile.household_id)
    .order('type')
    .order('name')

  return (
    <CategoriesClient
      categories={categories || []}
      householdId={profile.household_id}
    />
  )
}
