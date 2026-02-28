import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

export const auth = {
  async signUp(email, password, fullName, phone) {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, phone } } })
    if (error) throw error
    await supabase.from('customers').insert({ id: data.user.id, full_name: fullName, email, phone })
    return data
  },
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },
  onAuthChange(cb) {
    return supabase.auth.onAuthStateChange((_e, session) => cb(session))
  }
}

export const products = {
  async getActive() {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('weight_g')
    if (error) throw error
    return data
  }
}

export const vaultHoldings = {
  async getMine() {
    const { data, error } = await supabase
      .from('vault_holdings')
      .select('*, products(name,weight_g,purity), bins(code, vaults(code, locations(code,name)))')
      .eq('status', 'active')
      .order('acquired_at', { ascending: false })
    if (error) throw error
    return data
  }
}

export const orders = {
  async getMine() {
    const { data, error } = await supabase.from('orders').select('*, products(name,weight_g)').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async createPurchase(payload) {
    const { data, error } = await supabase.from('orders').insert({ ...payload, order_type: 'purchase', status: 'complete' }).select().single()
    if (error) throw error
    return data
  }
}

export const storageBilling = {
  async getMine() {
    const { data, error } = await supabase.from('storage_billing').select('*, vault_holdings(plutox_ref, products(name))').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async clearBalance(customerId) {
    const { error } = await supabase.from('customers').update({ account_status: 'active', grace_period_ends: null, overdue_amount: 0 }).eq('id', customerId)
    if (error) throw error
  }
}

export const goldPrice = {
  async getLatest() {
    const { data, error } = await supabase.from('gold_price_history').select('price_per_g, recorded_at').order('recorded_at', { ascending: false }).limit(1).single()
    if (error) throw error
    return data
  }
}

export const deliveryTiers = {
  async getAll() {
    const { data, error } = await supabase.from('delivery_fee_tiers').select('*').order('sort_order')
    if (error) throw error
    return data
  }
}

export const settings = {
  async getAll() {
    const { data, error } = await supabase.from('platform_settings').select('*')
    if (error) throw error
    return Object.fromEntries(data.map(s => [s.key, s.value]))
  }
}

export const realtime = {
  onAccountStatusChange(customerId, cb) {
    return supabase.channel('customers').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers', filter: `id=eq.${customerId}` }, cb).subscribe()
  },
  onVaultChange(customerId, cb) {
    return supabase.channel('vault_holdings').on('postgres_changes', { event: '*', schema: 'public', table: 'vault_holdings', filter: `customer_id=eq.${customerId}` }, cb).subscribe()
  },
  unsubscribe(channel) { supabase.removeChannel(channel) }
}