export type TransactionType = 'income' | 'expense'

export interface Household {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export interface Profile {
  id: string
  household_id: string | null
  display_name: string
  created_at: string
}

export interface Category {
  id: string
  household_id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  created_at: string
}

export interface Transaction {
  id: string
  household_id: string
  user_id: string
  category_id: string | null
  amount: number
  type: TransactionType
  note: string | null
  date: string
  created_at: string
  category?: Category
  profile?: Profile
}

export interface MonthlySummary {
  income: number
  expense: number
  balance: number
}
