// admin-app/src/App.jsx
import { useState, useEffect } from 'react'
import { supabase, customers, products, settings, deliveryTiers, vaultLocations, vaultHoldings, orders, storageBilling, analytics, realtime } from './lib/supabase'

// ── THEME ─────────────────────────────────────────────────────────────────────
const G = {
  gold:      '#c89600',
  goldLight: '#f0c040',
  goldDim:   '#8a6500',
  goldGlow:  '#c8960022',
  bg:        '#060606',
  surface:   '#0e0e0e',
  surface2:  '#181818',
  border:    '#252525',
  text:      '#d8d8d8',
  textMuted: '#666',
  green:     '#4caf50',
  red:       '#e53935',
  blue:      '#42a5f5',
  orange:    '#ff9800',
}

const css = {
  page:    { fontFamily:"'Courier New', monospace", background:G.bg, minHeight:'100vh', color:G.text },
  nav:     { background:G.surface, borderBottom:`1px solid ${G.border}`, padding:'0 24px', display:'flex',
              alignItems:'center', justifyContent:'space-between', height:56, position:'sticky', top:0, zIndex:100 },
  card:    { background:G.surface, border:`1px solid ${G.border}`, borderRadius:8, padding:16 },
  btn:     { padding:'8px 18px', borderRadius:6, border:'none', cursor:'pointer', fontWeight:700,
              fontSize:12, fontFamily:"'Courier New', monospace", transition:'all 0.15s' },
  input:   { background:G.surface2, border:`1px solid ${G.border}`, borderRadius:6, color:G.text,
              padding:'8px 12px', fontSize:13, fontFamily:"'Courier New', monospace", width:'100%', boxSizing:'border-box' },
  label:   { fontSize:11, color:G.textMuted, marginBottom:5, display:'block', textTransform:'uppercase', letterSpacing:1 },
  th:      { padding:'10px 14px', fontSize:11, color:G.textMuted, textTransform:'uppercase', letterSpacing:1,
              borderBottom:`1px solid ${G.border}`, textAlign:'left', background:G.surface2 },
  td:      { padding:'10px 14px', fontSize:13, borderBottom:`1px solid ${G.border}20`, verticalAlign:'middle' },
}

const fmt      = n => `£${Number(n).toFixed(2)}`
const fmtDate  = d => new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
const fmtNum   = n => Number(n).toLocaleString()

// ── AUTH ──────────────────────────────────────────────────────────────────────
function AdminLogin({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      const { data, error: e } = await supabase.auth.signInWithPassword({ email, password })
      if (e) throw e
      onAuth(data.session)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...css.page, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:360 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:32, marginBottom:6 }}>🛡️</div>
          <h1 style={{ fontSize:20, fontWeight:900, color:G.goldLight, margin:0, letterSpacing:4 }}>PLUTOX ADMIN</h1>
          <p style={{ color:G.textMuted, margin:'6px 0 0', fontSize:11, letterSpacing:2 }}>SECURE ACCESS</p>
        </div>
        <div style={css.card}>
          <div style={{ marginBottom:14 }}>
            <label style={css.label}>Email</label>
            <input style={css.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@plutox.com" />
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={css.label}>Password</label>
            <input style={css.input} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p style={{ color:G.red, fontSize:12, marginBottom:12 }}>{error}</p>}
          <button onClick={submit} disabled={loading}
            style={{ ...css.btn, width:'100%', padding:'11px 0', fontSize:13,
              background:`linear-gradient(135deg,${G.goldDim},${G.gold})`, color:'#000', opacity:loading?0.7:1 }}>
            {loading ? '…' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ ...css.card }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:11, color:G.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{label}</div>
          <div style={{ fontSize:24, fontWeight:900, color: color || G.goldLight }}>{value}</div>
          {sub && <div style={{ fontSize:11, color:G.textMuted, marginTop:4 }}>{sub}</div>}
        </div>
        <div style={{ fontSize:28 }}>{icon}</div>
      </div>
    </div>
  )
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const [revenue, setRevenue] = useState(null)
  const [vault, setVault]     = useState(null)
  const [recentOrders, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analytics.getRevenue(),
      analytics.getVaultSummary(),
      orders.getAll({ status:'complete' }).then(o => o.slice(0,5)),
    ]).then(([rev, v, ord]) => {
      setRevenue(rev); setVault(v); setRecent(ord); setLoading(false)
    }).catch(() => setLoading(false))

    const ch = realtime.onNewOrder(() => {
      analytics.getRevenue().then(setRevenue)
      orders.getAll({ status:'complete' }).then(o => setRecent(o.slice(0,5)))
    })
    return () => realtime.unsubscribe(ch)
  }, [])

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading dashboard…</p>

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard icon="💰" label="Total Revenue"   value={fmt(revenue?.total || 0)} sub="All time" />
        <StatCard icon="⚙️"  label="Handling Fees"  value={fmt(revenue?.handling || 0)} color={G.blue} />
        <StatCard icon="🏛️" label="Storage Fees"   value={fmt(revenue?.storage || 0)} color={G.green} />
        <StatCard icon="📦" label="Active Holdings" value={fmtNum(vault?.activeBars || 0)} sub={`of ${vault?.totalBars || 0} total`} color={G.orange} />
        <StatCard icon="💎" label="Vault Value"     value={fmt(vault?.totalValue || 0)} color={G.goldLight} />
        <StatCard icon="📅" label="Monthly Storage" value={fmt(vault?.monthlyStorage || 0)} color={G.textMuted} />
      </div>

      {recentOrders.length > 0 && (
        <div style={css.card}>
          <div style={{ fontSize:12, fontWeight:700, color:G.goldLight, marginBottom:14, letterSpacing:2 }}>RECENT ORDERS</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Customer','Product','Type','Amount','Date'].map(h => (
                  <th key={h} style={css.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td style={css.td}>{o.customers?.full_name}</td>
                  <td style={css.td}>{o.products?.name}</td>
                  <td style={css.td}><span style={{ color:G.goldLight, textTransform:'capitalize' }}>{o.order_type}</span></td>
                  <td style={css.td}>{fmt(o.total_amount)}</td>
                  <td style={css.td}>{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── CUSTOMERS VIEW ────────────────────────────────────────────────────────────
function CustomersView() {
  const [list, setList]     = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    customers.getAll().then(c => { setList(c); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const updateKyc = async (id, status) => {
    setUpdating(id)
    try {
      const updated = await customers.updateKyc(id, status)
      setList(l => l.map(c => c.id===id ? { ...c, kyc_status: updated.kyc_status } : c))
    } finally { setUpdating(null) }
  }

  const filtered = list.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const kycColor     = { approved:G.green, pending:G.orange, rejected:G.red }
  const accountColor = { active:G.green, grace_period:G.orange, suspended:G.red }

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading customers…</p>

  return (
    <div>
      <div style={{ marginBottom:14 }}>
        <input style={css.input} placeholder="Search customers…" value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      <div style={{ ...css.card, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
          <thead>
            <tr>{['Name','Email','KYC','Account','Holdings','Overdue','Actions'].map(h=><th key={h} style={css.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const activeHoldings = (c.vault_holdings||[]).filter(h=>h.status==='active').length
              return (
                <tr key={c.id}>
                  <td style={css.td}><span style={{ fontWeight:700 }}>{c.full_name}</span></td>
                  <td style={css.td}><span style={{ color:G.textMuted }}>{c.email}</span></td>
                  <td style={css.td}>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#1a1a1a', color:kycColor[c.kyc_status]||G.textMuted }}>
                      {c.kyc_status}
                    </span>
                  </td>
                  <td style={css.td}>
                    <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#1a1a1a', color:accountColor[c.account_status]||G.textMuted }}>
                      {c.account_status}
                    </span>
                  </td>
                  <td style={{ ...css.td, textAlign:'center' }}>{activeHoldings}</td>
                  <td style={{ ...css.td, color: Number(c.overdue_amount)>0 ? G.red : G.textMuted }}>
                    {Number(c.overdue_amount)>0 ? fmt(c.overdue_amount) : '—'}
                  </td>
                  <td style={css.td}>
                    <div style={{ display:'flex', gap:6 }}>
                      {c.kyc_status !== 'approved' && (
                        <button onClick={() => updateKyc(c.id,'approved')} disabled={updating===c.id}
                          style={{ ...css.btn, background:'#1a3a1a', color:G.green, padding:'4px 10px' }}>
                          Approve
                        </button>
                      )}
                      {c.kyc_status !== 'rejected' && (
                        <button onClick={() => updateKyc(c.id,'rejected')} disabled={updating===c.id}
                          style={{ ...css.btn, background:'#3a1a1a', color:G.red, padding:'4px 10px' }}>
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ color:G.textMuted, textAlign:'center', padding:20 }}>No customers found.</p>}
      </div>
    </div>
  )
}

// ── PRODUCTS VIEW ─────────────────────────────────────────────────────────────
function ProductsView() {
  const [list, setList]     = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | 'new' | product object
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    products.getAll().then(p => { setList(p); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  const startEdit = (p) => { setEditing(p || 'new'); setForm(p || { name:'',weight_g:'',purity:'0.9999',base_price:'',storage_fee:'',handling_fee:'',is_active:true }) }

  const save = async () => {
    setSaving(true)
    try {
      if (editing === 'new') {
        const p = await products.add(form)
        setList(l => [...l, p])
      } else {
        const p = await products.update(editing.id, form)
        setList(l => l.map(x => x.id===editing.id ? p : x))
      }
      setEditing(null)
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return
    await products.remove(id)
    setList(l => l.filter(p => p.id!==id))
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value }))

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading products…</p>

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
        <button onClick={() => startEdit(null)} style={{ ...css.btn, background:`linear-gradient(135deg,${G.goldDim},${G.gold})`, color:'#000' }}>
          + Add Product
        </button>
      </div>

      {editing && (
        <div style={{ ...css.card, border:`1px solid ${G.gold}`, marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:G.goldLight, marginBottom:14, letterSpacing:2 }}>
            {editing==='new' ? 'NEW PRODUCT' : 'EDIT PRODUCT'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
            {[['name','Name','text'],['weight_g','Weight (g)','number'],['purity','Purity','number'],
              ['base_price','Base Price £','number'],['storage_fee','Storage Fee £','number'],['handling_fee','Handling Fee £','number']].map(([k,l,t]) => (
              <div key={k}>
                <label style={css.label}>{l}</label>
                <input style={css.input} type={t} value={form[k]||''} onChange={set(k)} />
              </div>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:20 }}>
              <input type="checkbox" checked={!!form.is_active} onChange={set('is_active')} id="is_active" />
              <label htmlFor="is_active" style={{ ...css.label, margin:0 }}>Active</label>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <button onClick={save} disabled={saving}
              style={{ ...css.btn, background:`linear-gradient(135deg,${G.goldDim},${G.gold})`, color:'#000', opacity:saving?0.7:1 }}>
              {saving ? 'Saving…' : 'Save Product'}
            </button>
            <button onClick={() => setEditing(null)} style={{ ...css.btn, background:G.surface2, color:G.textMuted }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ ...css.card, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:600 }}>
          <thead>
            <tr>{['Name','Weight','Purity','Price','Storage/mo','Handling','Status','Actions'].map(h=><th key={h} style={css.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td style={{ ...css.td, fontWeight:700 }}>{p.name}</td>
                <td style={css.td}>{p.weight_g}g</td>
                <td style={css.td}>{(p.purity*100).toFixed(2)}%</td>
                <td style={css.td}>{fmt(p.base_price)}</td>
                <td style={css.td}>{fmt(p.storage_fee)}</td>
                <td style={css.td}>{fmt(p.handling_fee)}</td>
                <td style={css.td}>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#1a1a1a',
                    color: p.is_active ? G.green : G.textMuted }}>
                    {p.is_active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td style={css.td}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => startEdit(p)} style={{ ...css.btn, background:G.surface2, color:G.goldLight, padding:'4px 10px' }}>Edit</button>
                    <button onClick={() => remove(p.id)} style={{ ...css.btn, background:'#3a1a1a', color:G.red, padding:'4px 10px' }}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── ORDERS VIEW ───────────────────────────────────────────────────────────────
function OrdersView() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ type:'', status:'' })

  useEffect(() => {
    orders.getAll(filter).then(o => { setList(o); setLoading(false) }).catch(()=>setLoading(false))
  }, [filter])

  const typeColor   = { purchase:G.goldLight, delivery:G.blue, buyback:G.green }
  const statusColor = { complete:G.green, pending:G.orange, cancelled:G.red }

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading orders…</p>

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
        {[['type',['','purchase','delivery','buyback']],['status',['','pending','complete','cancelled']]].map(([k,opts]) => (
          <select key={k} value={filter[k]} onChange={e=>setFilter(f=>({...f,[k]:e.target.value}))}
            style={{ ...css.input, width:'auto', minWidth:140 }}>
            {opts.map(o => <option key={o} value={o}>{o || `All ${k}s`}</option>)}
          </select>
        ))}
      </div>

      <div style={{ ...css.card, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
          <thead>
            <tr>{['Customer','Product','Type','Status','Unit Price','Handling','Delivery','Total','Date'].map(h=><th key={h} style={css.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map(o => (
              <tr key={o.id}>
                <td style={css.td}>{o.customers?.full_name}</td>
                <td style={css.td}>{o.products?.name}</td>
                <td style={css.td}><span style={{ color:typeColor[o.order_type]||G.textMuted, textTransform:'capitalize' }}>{o.order_type}</span></td>
                <td style={css.td}><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#1a1a1a', color:statusColor[o.status]||G.textMuted }}>{o.status}</span></td>
                <td style={css.td}>{fmt(o.unit_price)}</td>
                <td style={css.td}>{fmt(o.handling_fee)}</td>
                <td style={css.td}>{fmt(o.delivery_fee)}</td>
                <td style={{ ...css.td, fontWeight:700, color:G.goldLight }}>{fmt(o.total_amount)}</td>
                <td style={{ ...css.td, color:G.textMuted }}>{fmtDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p style={{ color:G.textMuted, textAlign:'center', padding:20 }}>No orders found.</p>}
      </div>
    </div>
  )
}

// ── HOLDINGS VIEW ─────────────────────────────────────────────────────────────
function HoldingsView() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    vaultHoldings.getAll().then(h => { setList(h); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  const statusColor = { active:G.green, delivered:G.blue, sold:G.textMuted }

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading holdings…</p>

  return (
    <div style={{ ...css.card, overflow:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
        <thead>
          <tr>{['Ref','Customer','Product','Location','Status','Purchase Price','Current Value','Storage/mo','Acquired'].map(h=><th key={h} style={css.th}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {list.map(h => {
            const loc = h.bins?.vaults?.locations
            return (
              <tr key={h.id}>
                <td style={{ ...css.td, fontFamily:'monospace', fontSize:11, color:G.goldLight }}>{h.plutox_ref}</td>
                <td style={css.td}>{h.customers?.full_name}</td>
                <td style={css.td}>{h.products?.name}</td>
                <td style={{ ...css.td, color:G.textMuted }}>{loc ? `${loc.code} / ${h.bins?.vaults?.code} / ${h.bins?.code}` : '—'}</td>
                <td style={css.td}><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#1a1a1a', color:statusColor[h.status]||G.textMuted }}>{h.status}</span></td>
                <td style={css.td}>{fmt(h.purchase_price)}</td>
                <td style={{ ...css.td, color:G.goldLight }}>{fmt(h.current_value||0)}</td>
                <td style={css.td}>{fmt(h.storage_fee)}</td>
                <td style={{ ...css.td, color:G.textMuted }}>{fmtDate(h.acquired_at)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {list.length === 0 && <p style={{ color:G.textMuted, textAlign:'center', padding:20 }}>No holdings found.</p>}
    </div>
  )
}

// ── BILLING VIEW ─────────────────────────────────────────────────────────────
function BillingView() {
  const [list, setList]   = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    storageBilling.getAll(filter ? { status:filter } : {}).then(b => { setList(b); setLoading(false) }).catch(()=>setLoading(false))
  }, [filter])

  const statusColor = { paid:G.green, pending:G.orange, failed:G.red, waived:G.textMuted }
  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading billing…</p>

  return (
    <div>
      <div style={{ marginBottom:14 }}>
        <select value={filter} onChange={e=>setFilter(e.target.value)} style={{ ...css.input, width:'auto', minWidth:160 }}>
          {['','pending','paid','failed','waived'].map(s=><option key={s} value={s}>{s||'All statuses'}</option>)}
        </select>
      </div>
      <div style={{ ...css.card, overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
          <thead>
            <tr>{['Customer','Holding Ref','Product','Amount','Status','Period','Paid At'].map(h=><th key={h} style={css.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {list.map(b => (
              <tr key={b.id}>
                <td style={css.td}>{b.customers?.full_name}</td>
                <td style={{ ...css.td, fontFamily:'monospace', fontSize:11, color:G.goldLight }}>{b.vault_holdings?.plutox_ref}</td>
                <td style={css.td}>{b.vault_holdings?.products?.name}</td>
                <td style={{ ...css.td, fontWeight:700 }}>{fmt(b.amount)}</td>
                <td style={css.td}><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#1a1a1a', color:statusColor[b.status]||G.textMuted }}>{b.status}</span></td>
                <td style={{ ...css.td, color:G.textMuted }}>{fmtDate(b.billing_period_start)} – {fmtDate(b.billing_period_end)}</td>
                <td style={{ ...css.td, color:G.textMuted }}>{b.paid_at ? fmtDate(b.paid_at) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p style={{ color:G.textMuted, textAlign:'center', padding:20 }}>No billing records found.</p>}
      </div>
    </div>
  )
}

// ── SETTINGS VIEW ─────────────────────────────────────────────────────────────
function SettingsView() {
  const [sett, setSett] = useState({})
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    Promise.all([settings.getAll(), deliveryTiers.getAll()]).then(([s,t]) => {
      setSett(s); setTiers(t); setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const saveSetting = async (key, value) => {
    setSaving(key)
    try {
      await settings.update(key, value)
    } finally { setSaving(null) }
  }

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading settings…</p>

  const settingLabels = {
    storage_fee_rate:  'Storage Fee Rate (%)',
    handling_fee_flat: 'Handling Fee Flat (£)',
    grace_period_days: 'Grace Period (days)',
    company_name:      'Company Name',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={css.card}>
        <div style={{ fontSize:12, fontWeight:700, color:G.goldLight, marginBottom:16, letterSpacing:2 }}>PLATFORM SETTINGS</div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {Object.entries(sett).filter(([k]) => settingLabels[k]).map(([key, val]) => (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:12 }}>
              <label style={{ ...css.label, margin:0, flex:1, minWidth:200 }}>{settingLabels[key]}</label>
              <input style={{ ...css.input, width:'auto', flex:1, maxWidth:240 }}
                defaultValue={val}
                onBlur={e => saveSetting(key, e.target.value)} />
              {saving===key && <span style={{ fontSize:11, color:G.textMuted }}>saving…</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={css.card}>
        <div style={{ fontSize:12, fontWeight:700, color:G.goldLight, marginBottom:14, letterSpacing:2 }}>DELIVERY FEE TIERS</div>
        <div style={{ ...css.card, overflow:'auto', padding:0, border:'none' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Label','Min Weight (g)','Max Weight (g)','Fee','Sort'].map(h=><th key={h} style={css.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {tiers.map(t => (
                <tr key={t.id}>
                  <td style={css.td}>{t.label}</td>
                  <td style={css.td}>{t.min_weight_g}g</td>
                  <td style={css.td}>{t.max_weight_g ? `${t.max_weight_g}g` : '∞'}</td>
                  <td style={{ ...css.td, color:G.goldLight }}>{fmt(t.fee)}</td>
                  <td style={{ ...css.td, color:G.textMuted }}>{t.sort_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(undefined)
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => setSession(s))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ ...css.page, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:12, color:G.textMuted }}>Loading…</div>
    </div>
  )

  if (!session) return <AdminLogin onAuth={setSession} />

  const tabs = [
    { id:'dashboard', label:'Dashboard', icon:'📊' },
    { id:'customers', label:'Customers', icon:'👥' },
    { id:'products',  label:'Products',  icon:'🥇' },
    { id:'holdings',  label:'Holdings',  icon:'🏛️' },
    { id:'orders',    label:'Orders',    icon:'📋' },
    { id:'billing',   label:'Billing',   icon:'🧾' },
    { id:'settings',  label:'Settings',  icon:'⚙️'  },
  ]

  return (
    <div style={css.page}>
      <nav style={css.nav}>
        <div style={{ fontSize:14, fontWeight:900, color:G.goldLight, letterSpacing:3 }}>🛡️ PLUTOX ADMIN</div>
        <div style={{ display:'flex', gap:2, overflowX:'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ ...css.btn, background: tab===t.id ? G.goldGlow : 'transparent',
                color: tab===t.id ? G.goldLight : G.textMuted,
                border: `1px solid ${tab===t.id ? G.gold+'40' : 'transparent'}`,
                padding:'5px 12px', fontSize:11 }}>
              {t.icon} {t.label}
            </button>
          ))}
          <button onClick={() => supabase.auth.signOut()}
            style={{ ...css.btn, background:'transparent', color:G.red, padding:'5px 12px', fontSize:11, marginLeft:8 }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ marginBottom:18 }}>
          <h2 style={{ margin:0, color:G.goldLight, fontSize:16, letterSpacing:2 }}>
            {tabs.find(t=>t.id===tab)?.icon} {tabs.find(t=>t.id===tab)?.label?.toUpperCase()}
          </h2>
        </div>

        {tab === 'dashboard' && <Dashboard />}
        {tab === 'customers' && <CustomersView />}
        {tab === 'products'  && <ProductsView />}
        {tab === 'holdings'  && <HoldingsView />}
        {tab === 'orders'    && <OrdersView />}
        {tab === 'billing'   && <BillingView />}
        {tab === 'settings'  && <SettingsView />}
      </div>
    </div>
  )
}
