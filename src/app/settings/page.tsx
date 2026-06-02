import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let household = null
  let members: { id: string; display_name: string }[] = []

  if (profile?.household_id) {
    const { data: hh } = await supabase
      .from('households')
      .select('*')
      .eq('id', profile.household_id)
      .single()
    household = hh

    const { data: profileMembers } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('household_id', profile.household_id)
    members = profileMembers || []
  }

  return (
    <SettingsClient
      profile={profile}
      household={household}
      members={members}
    />
  )
}
