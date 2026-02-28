import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

export const customers = {
  async getAll() {
    const { data, error } = await supabase.from('customers').select('*, vault_holdings(id,current_value,storage_fee,status)').order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async updateKyc(id, status) {
    const { data, error } = await supabase.from('customers').update({ kyc_status: status }).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async updateAccountStatus(id, status, gracePeriodEnds, overdueAmount) {
    const { data, error } = await supabase.from('customers').update({ account_status: status, grace_period_ends: gracePeriodEnds, overdue_amount: overdueAmount }).eq('id', id).select().single()
    if (error) throw error
    return data
  }
}

export const products = {
  async getAll() {
    const { data, error } = await supabase.from('products').select('*').order('weight_g')
    if (error) throw error
    return data
  },
  async add(p) {
    const { data, error } = await supabase.from('products').insert(p).select().single()
    if (error) throw error
    return data
  },
  async update(id, u) {
    const { data, error } = await supabase.from('products').update(u).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async remove(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  }
}

export const settings = {
  async getAll() {
    const { data, error } = await supabase.from('platform_settings').select('*')
    if (error) throw error
    return Object.fromEntries(data.map(s => [s.key, s.value]))
  },
  async update(key, value) {
    const { data, error } = await supabase.from('platform_settings').update({ value: String(value), updated_at: new Date().toISOString() }).eq('key', key).select().single()
    if (error) throw error
    return data
  }
}

export const deliveryTiers = {
  async getAll() {
    const { data, error } = await supabase.from('delivery_fee_tiers').select('*').order('sort_order')
    if (error) throw error
    return data
  },
  async add(t) {
    const { data, error } = await supabase.from('delivery_fee_tiers').insert(t).select().single()
    if (error) throw error
    return data
  },
  async update(id, u) {
    const { data, error } = await supabase.from('delivery_fee_tiers').update(u).eq('id', id).select().single()
    if (error) throw error
    return data
  },
  async remove(id) {
    const { error } = await supabase.from('delivery_fee_tiers').delete().eq('id', id)
    if (error) throw error
  }
}

export const vaultLocations = {
  async getHierarchy() {
    const [l, v, b] = await Promise.all([
      supabase.from('locations').select('*').order('code'),
      supabase.from('vaults').select('*').order('code'),
      supabase.from('bins').select('*').order('code'),
    ])
    return { locations: l.data, vaults: v.data, bins: b.data }
  },
  async addLocation(d) { const { data, error } = await supabase.from('locations').insert(d).select().single(); if (error) throw error; return data },
  async addVault(d)    { const { data, error } = await supabase.from('vaults').insert(d).select().single();    if (error) throw error; return data },
  async addBin(d)      { const { data, error } = await supabase.from('bins').insert(d).select().single();      if (error) throw error; return data },
  async updateLocation(id, d) { const { data, error } = await supabase.from('locations').update(d).eq('id', id).select().single(); if (error) throw error; return data },
  async updateVault(id, d)    { const { data, error } = await supabase.from('vaults').update(d).eq('id', id).select().single();    if (error) throw error; return data },
  async updateBin(id, d)      { const { data, error } = await supabase.from('bins').update(d).eq('id', id).select().single();      if (error) throw error; return data },
  async removeLocation(id) { await supabase.from('locations').delete().eq('id', id) },
  async removeVault(id)    { await supabase.from('vaults').delete().eq('id', id) },
  async removeBin(id)      { await supabase.from('bins').delete().eq('id', id) }
}

export const vaultHoldings = {
  async getAll() {
    const { data, error } = await supabase.from('vault_holdings').select('*, customers(full_name,email), products(name,weight_g,purity), bins(code, vaults(code, locations(code,name)))').order('acquired_at', { ascending: false })
    if (error) throw error
    return data
  },
  async log(payload) {
    const { data, error } = await supabase.from('vault_holdings').insert(payload).select().single()
    if (error) throw error
    return data
  },
  async updateStatus(id, status) {
    const { data, error } = await supabase.from('vault_holdings').update({ status }).eq('id', id).select().single()
    if (error) throw error
    return data
  }
}

export const orders = {
  async getAll({ status, type, from, to } = {}) {
    let q = supabase.from('orders').select('*, customers(full_name,email), products(name,weight_g)').order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    if (type)   q = q.eq('order_type', type)
    if (from)   q = q.gte('created_at', from)
    if (to)     q = q.lte('created_at', to)
    const { data, error } = await q
    if (error) throw error
    return data
  }
}

export const storageBilling = {
  async getAll({ status } = {}) {
    let q = supabase.from('storage_billing').select('*, customers(full_name,email), vault_holdings(plutox_ref, products(name))').order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) throw error
    return data
  }
}

export const analytics = {
  async getRevenue({ from, to } = {}) {
    let q = supabase.from('orders').select('handling_fee,delivery_fee,created_at').eq('status', 'complete')
    if (from) q = q.gte('created_at', from)
    if (to)   q = q.lte('created_at', to)
    const { data, error } = await q
    if (error) throw error
    const handling = data.reduce((s, o) => s + Number(o.handling_fee), 0)
    const delivery = data.reduce((s, o) => s + Number(o.delivery_fee), 0)
    const { data: storage } = await supabase.from('storage_billing').select('amount').eq('status', 'paid')
    const storageTotal = (storage || []).reduce((s, r) => s + Number(r.amount), 0)
    return { handling, delivery, storage: storageTotal, total: handling + delivery + storageTotal }
  },
  async getVaultSummary() {
    const { data, error } = await supabase.from('vault_holdings').select('current_value,storage_fee,status')
    if (error) throw error
    return {
      totalBars:      data.length,
      activeBars:     data.filter(h => h.status === 'active').length,
      totalValue:     data.reduce((s, h) => s + Number(h.current_value || 0), 0),
      monthlyStorage: data.filter(h => h.status === 'active').reduce((s, h) => s + Number(h.storage_fee), 0)
    }
  }
}

export const realtime = {
  onNewOrder(cb) {
    return supabase.channel('orders').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, cb).subscribe()
  },
  unsubscribe(channel) { supabase.removeChannel(channel) }
}