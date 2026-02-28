// customer-app/src/App.jsx
import { useState, useEffect, useCallback } from 'react'
import { auth, products, vaultHoldings, orders, storageBilling, goldPrice, deliveryTiers, settings, realtime } from './lib/supabase'

// ── THEME ─────────────────────────────────────────────────────────────────────
const G = {
  gold:       '#c89600',
  goldLight:  '#f0c040',
  goldDim:    '#8a6500',
  goldGlow:   '#c8960033',
  bg:         '#080700',
  surface:    '#100e00',
  surface2:   '#1a1700',
  border:     '#2a2400',
  text:       '#e8e0c8',
  textMuted:  '#7a7060',
  green:      '#4caf50',
  red:        '#e53935',
}

const css = {
  page: {
    fontFamily: "'Georgia', serif",
    background: G.bg,
    minHeight: '100vh',
    color: G.text,
  },
  nav: {
    background: G.surface,
    borderBottom: `1px solid ${G.border}`,
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: 18,
    fontWeight: 900,
    color: G.goldLight,
    letterSpacing: 3,
    fontFamily: "'Georgia', serif",
  },
  navTabs: {
    display: 'flex',
    gap: 4,
  },
  card: {
    background: G.surface,
    border: `1px solid ${G.border}`,
    borderRadius: 12,
    padding: 20,
  },
  btn: {
    padding: '10px 22px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    fontFamily: "'Georgia', serif",
    transition: 'all 0.15s',
  },
  input: {
    background: G.surface2,
    border: `1px solid ${G.border}`,
    borderRadius: 8,
    color: G.text,
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: "'Georgia', serif",
    width: '100%',
    boxSizing: 'border-box',
  },
  label: {
    fontSize: 12,
    color: G.textMuted,
    marginBottom: 6,
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
const fmt = (n) => `£${Number(n).toFixed(2)}`
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })

// ── AUTH SCREENS ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login') // login | register
  const [form, setForm] = useState({ email:'', password:'', fullName:'', phone:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        await auth.signIn(form.email, form.password)
      } else {
        await auth.signUp(form.email, form.password, form.fullName, form.phone)
      }
      const session = await auth.getSession()
      onAuth(session)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ ...css.page, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>⚜️</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:G.goldLight, margin:0, letterSpacing:3 }}>PLUTOX</h1>
          <p style={{ color:G.textMuted, margin:'6px 0 0', fontSize:13, letterSpacing:1 }}>GOLD VAULT</p>
        </div>
        <div style={css.card}>
          <div style={{ display:'flex', marginBottom:24, background:G.surface2, borderRadius:8, padding:4 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ ...css.btn, flex:1, background: mode===m ? G.gold : 'transparent',
                  color: mode===m ? '#000' : G.textMuted, padding:'8px 0' }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <>
              <div style={{ marginBottom:16 }}>
                <label style={css.label}>Full Name</label>
                <input style={css.input} placeholder="Jane Smith" value={form.fullName} onChange={set('fullName')} />
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={css.label}>Phone</label>
                <input style={css.input} placeholder="+44 7700 900000" value={form.phone} onChange={set('phone')} />
              </div>
            </>
          )}

          <div style={{ marginBottom:16 }}>
            <label style={css.label}>Email</label>
            <input style={css.input} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={css.label}>Password</label>
            <input style={css.input} type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>

          {error && <p style={{ color:G.red, fontSize:13, marginBottom:14 }}>{error}</p>}

          <button onClick={submit} disabled={loading}
            style={{ ...css.btn, width:'100%', background:`linear-gradient(135deg,${G.goldDim},${G.gold})`,
              color:'#000', padding:'13px 0', fontSize:15, opacity: loading ? 0.7 : 1 }}>
            {loading ? '…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── GOLD TICKER ───────────────────────────────────────────────────────────────
function GoldTicker() {
  const [price, setPrice] = useState(null)
  useEffect(() => {
    goldPrice.getLatest().then(setPrice).catch(() => {})
  }, [])
  if (!price) return null
  return (
    <div style={{ background:G.goldGlow, border:`1px solid ${G.gold}40`, borderRadius:8,
      padding:'8px 16px', display:'flex', gap:12, alignItems:'center', fontSize:13 }}>
      <span style={{ color:G.goldLight, fontWeight:700 }}>XAU/g</span>
      <span style={{ color:G.text, fontWeight:900, fontSize:16 }}>{fmt(price.price_per_g)}</span>
      <span style={{ color:G.textMuted, fontSize:11 }}>{fmtDate(price.recorded_at)}</span>
    </div>
  )
}

// ── HOLDINGS VIEW ─────────────────────────────────────────────────────────────
function HoldingsView({ customerId }) {
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    vaultHoldings.getMine().then(h => { setHoldings(h); setLoading(false) }).catch(() => setLoading(false))
    const ch = realtime.onVaultChange(customerId, () => {
      vaultHoldings.getMine().then(setHoldings).catch(() => {})
    })
    return () => realtime.unsubscribe(ch)
  }, [customerId])

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading vault…</p>

  if (holdings.length === 0) return (
    <div style={{ ...css.card, textAlign:'center', padding:40 }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🏦</div>
      <p style={{ color:G.textMuted }}>Your vault is empty. Purchase gold to get started.</p>
    </div>
  )

  const totalValue = holdings.reduce((s, h) => s + Number(h.current_value || 0), 0)

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
        {[
          ['Total Items', holdings.length, '📦'],
          ['Portfolio Value', fmt(totalValue), '💰'],
          ['Monthly Storage', fmt(holdings.reduce((s,h)=>s+Number(h.storage_fee),0)), '🏛️'],
        ].map(([label, val, icon]) => (
          <div key={label} style={{ ...css.card, textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:G.goldLight }}>{val}</div>
            <div style={{ fontSize:11, color:G.textMuted, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {holdings.map(h => {
          const product = h.products
          const loc = h.bins?.vaults?.locations
          return (
            <div key={h.id} style={{ ...css.card, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontWeight:700, color:G.goldLight, marginBottom:4 }}>{product?.name}</div>
                <div style={{ fontSize:12, color:G.textMuted }}>
                  Ref: <span style={{ color:G.text }}>{h.plutox_ref}</span>
                  {loc && <> · {loc.name}</>}
                </div>
                <div style={{ fontSize:12, color:G.textMuted, marginTop:2 }}>
                  Acquired {fmtDate(h.acquired_at)} · {product?.weight_g}g · {((product?.purity||0)*100).toFixed(2)}% pure
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:20, fontWeight:900, color:G.goldLight }}>{fmt(h.current_value || 0)}</div>
                <div style={{ fontSize:11, color:G.textMuted }}>storage {fmt(h.storage_fee)}/mo</div>
                <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, marginTop:4, display:'inline-block',
                  background: h.status==='active' ? '#1a3a1a' : '#2a1010',
                  color: h.status==='active' ? G.green : G.red }}>
                  {h.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── BUY VIEW ─────────────────────────────────────────────────────────────────
function BuyView({ customerId }) {
  const [productList, setProductList] = useState([])
  const [price, setPrice] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([products.getActive(), goldPrice.getLatest()]).then(([p, gp]) => {
      setProductList(p); setPrice(gp); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const buy = async () => {
    if (!selected) return
    setBuying(true); setError('')
    try {
      const unitPrice = Number(selected.base_price)
      const order = await orders.createPurchase({
        customer_id:  customerId,
        product_id:   selected.id,
        unit_price:   unitPrice,
        handling_fee: Number(selected.handling_fee),
        delivery_fee: 0,
        total_amount: unitPrice + Number(selected.handling_fee),
        gold_price_g: price?.price_per_g,
        quantity: 1,
      })
      setSuccess(order)
      setSelected(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setBuying(false)
    }
  }

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading products…</p>

  return (
    <div>
      {success && (
        <div style={{ ...css.card, border:`1px solid ${G.green}`, marginBottom:16, display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ fontSize:24 }}>✅</span>
          <div>
            <div style={{ fontWeight:700, color:G.green }}>Purchase complete!</div>
            <div style={{ fontSize:13, color:G.textMuted }}>Order #{success.id.slice(0,8)}… added to your vault.</div>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
        {productList.map(p => {
          const isSelected = selected?.id === p.id
          const marketVal = price ? Number(price.price_per_g) * Number(p.weight_g) * Number(p.purity) : null
          return (
            <div key={p.id} onClick={() => setSelected(isSelected ? null : p)}
              style={{ ...css.card, cursor:'pointer', border: `1px solid ${isSelected ? G.gold : G.border}`,
                boxShadow: isSelected ? `0 0 20px ${G.goldGlow}` : 'none',
                transition: 'all 0.2s' }}>
              <div style={{ fontSize:28, marginBottom:10 }}>🥇</div>
              <div style={{ fontWeight:700, color:G.goldLight, marginBottom:6 }}>{p.name}</div>
              <div style={{ fontSize:12, color:G.textMuted, marginBottom:12 }}>
                {p.weight_g}g · {((p.purity)*100).toFixed(2)}% pure
              </div>
              <div style={{ borderTop:`1px solid ${G.border}`, paddingTop:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:G.textMuted }}>Price</span>
                  <span style={{ fontWeight:700, color:G.text }}>{fmt(p.base_price)}</span>
                </div>
                {marketVal && (
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:G.textMuted }}>Market</span>
                    <span style={{ fontSize:12, color:G.textMuted }}>{fmt(marketVal)}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:G.textMuted }}>Handling</span>
                  <span style={{ fontSize:12, color:G.textMuted }}>{fmt(p.handling_fee)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:G.textMuted }}>Storage/mo</span>
                  <span style={{ fontSize:12, color:G.textMuted }}>{fmt(p.storage_fee)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div style={{ ...css.card, marginTop:20, border:`1px solid ${G.gold}` }}>
          <div style={{ fontWeight:700, color:G.goldLight, marginBottom:12 }}>Confirm Purchase: {selected.name}</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
            {[
              ['Bar price', fmt(selected.base_price)],
              ['Handling', fmt(selected.handling_fee)],
              ['Total', fmt(Number(selected.base_price)+Number(selected.handling_fee))],
            ].map(([l,v]) => (
              <div key={l} style={{ ...css.card, textAlign:'center', padding:12 }}>
                <div style={{ fontSize:16, fontWeight:900, color:G.goldLight }}>{v}</div>
                <div style={{ fontSize:11, color:G.textMuted, marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
          {error && <p style={{ color:G.red, fontSize:13, marginBottom:12 }}>{error}</p>}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={buy} disabled={buying}
              style={{ ...css.btn, background:`linear-gradient(135deg,${G.goldDim},${G.gold})`, color:'#000', flex:1, opacity:buying?0.7:1 }}>
              {buying ? 'Processing…' : 'Confirm Purchase'}
            </button>
            <button onClick={() => { setSelected(null); setError('') }}
              style={{ ...css.btn, background:G.surface2, color:G.textMuted }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ORDERS VIEW ───────────────────────────────────────────────────────────────
function OrdersView() {
  const [myOrders, setMyOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    orders.getMine().then(o => { setMyOrders(o); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading orders…</p>

  if (myOrders.length === 0) return (
    <div style={{ ...css.card, textAlign:'center', padding:40 }}>
      <div style={{ fontSize:40, marginBottom:12 }}>📋</div>
      <p style={{ color:G.textMuted }}>No orders yet.</p>
    </div>
  )

  const typeColor = { purchase:G.goldLight, delivery:'#64b5f6', buyback:G.green }
  const statusColor = { complete:G.green, pending:'#ff9800', cancelled:G.red }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {myOrders.map(o => (
        <div key={o.id} style={{ ...css.card, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontWeight:700, color: typeColor[o.order_type] || G.goldLight, textTransform:'capitalize', marginBottom:4 }}>
              {o.order_type}
            </div>
            <div style={{ fontSize:13, color:G.text }}>{o.products?.name}</div>
            <div style={{ fontSize:12, color:G.textMuted, marginTop:2 }}>{fmtDate(o.created_at)}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:18, fontWeight:900, color:G.goldLight }}>{fmt(o.total_amount)}</div>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, marginTop:4, display:'inline-block',
              background: '#1a1a1a', color: statusColor[o.status] || G.textMuted }}>
              {o.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── BILLING VIEW ─────────────────────────────────────────────────────────────
function BillingView({ customerId, customer }) {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    storageBilling.getMine().then(b => { setBills(b); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const overdueAmount = Number(customer?.overdue_amount || 0)
  const isOverdue = overdueAmount > 0

  if (loading) return <p style={{ color:G.textMuted, textAlign:'center', padding:40 }}>Loading billing…</p>

  const statusColor = { paid:G.green, pending:'#ff9800', failed:G.red, waived:G.textMuted }

  return (
    <div>
      {isOverdue && (
        <div style={{ ...css.card, border:`1px solid ${G.red}`, marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:700, color:G.red, marginBottom:4 }}>⚠️ Outstanding Balance</div>
              <div style={{ fontSize:13, color:G.textMuted }}>
                Account status: <span style={{ color:G.red }}>{customer?.account_status}</span>
                {customer?.grace_period_ends && ` · Grace period ends ${fmtDate(customer.grace_period_ends)}`}
              </div>
            </div>
            <div style={{ fontSize:22, fontWeight:900, color:G.red }}>{fmt(overdueAmount)}</div>
          </div>
        </div>
      )}

      {bills.length === 0 ? (
        <div style={{ ...css.card, textAlign:'center', padding:40 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🧾</div>
          <p style={{ color:G.textMuted }}>No billing records yet.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {bills.map(b => (
            <div key={b.id} style={{ ...css.card, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontWeight:700, color:G.goldLight, marginBottom:4 }}>Storage Fee</div>
                <div style={{ fontSize:13, color:G.text }}>{b.vault_holdings?.products?.name} · {b.vault_holdings?.plutox_ref}</div>
                <div style={{ fontSize:12, color:G.textMuted, marginTop:2 }}>
                  {fmtDate(b.billing_period_start)} – {fmtDate(b.billing_period_end)}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:18, fontWeight:900, color:G.goldLight }}>{fmt(b.amount)}</div>
                <span style={{ fontSize:11, padding:'3px 10px', borderRadius:20, marginTop:4, display:'inline-block',
                  background:'#1a1a1a', color: statusColor[b.status] || G.textMuted }}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ACCOUNT VIEW ──────────────────────────────────────────────────────────────
function AccountView({ customer, onSignOut }) {
  const statusColors = { active: G.green, grace_period: '#ff9800', suspended: G.red }
  const kycColors    = { approved: G.green, pending: '#ff9800', rejected: G.red }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={css.card}>
        <div style={{ fontSize:40, textAlign:'center', marginBottom:12 }}>👤</div>
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:20, fontWeight:700, color:G.goldLight }}>{customer?.full_name}</div>
          <div style={{ fontSize:14, color:G.textMuted, marginTop:4 }}>{customer?.email}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            ['Account Status', customer?.account_status, statusColors],
            ['KYC Status',     customer?.kyc_status,     kycColors],
          ].map(([label, val, colors]) => (
            <div key={label} style={{ ...css.card, textAlign:'center', padding:12 }}>
              <div style={{ fontSize:11, color:G.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{label}</div>
              <span style={{ fontSize:12, padding:'4px 12px', borderRadius:20,
                background:'#1a1a1a', color: (colors)[val] || G.textMuted }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onSignOut}
        style={{ ...css.btn, background:G.surface2, color:G.red, border:`1px solid ${G.red}40`, width:'100%', padding:14 }}>
        Sign Out
      </button>
    </div>
  )
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]   = useState(undefined) // undefined = loading
  const [customer, setCustomer] = useState(null)
  const [tab, setTab]           = useState('vault')

  useEffect(() => {
    auth.getSession().then(s => setSession(s))
    const { data: { subscription } } = auth.onAuthChange(s => setSession(s))
    return () => subscription?.unsubscribe?.()
  }, [])

  useEffect(() => {
    if (!session) { setCustomer(null); return }
    // Fetch customer profile
    import('./lib/supabase').then(({ supabase }) => {
      supabase.from('customers').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setCustomer(data))
    })
    // Re-fetch on account status changes
    const ch = realtime.onAccountStatusChange(session.user.id, () => {
      import('./lib/supabase').then(({ supabase }) => {
        supabase.from('customers').select('*').eq('id', session.user.id).single()
          .then(({ data }) => setCustomer(data))
      })
    })
    return () => realtime.unsubscribe(ch)
  }, [session])

  if (session === undefined) return (
    <div style={{ ...css.page, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:14, color:G.textMuted }}>Loading…</div>
    </div>
  )

  if (!session) return <AuthScreen onAuth={setSession} />

  const tabs = [
    { id:'vault',   label:'My Vault', icon:'🏛️' },
    { id:'buy',     label:'Buy Gold', icon:'🥇' },
    { id:'orders',  label:'Orders',   icon:'📋' },
    { id:'billing', label:'Billing',  icon:'🧾' },
    { id:'account', label:'Account',  icon:'👤' },
  ]

  const userId = session.user.id

  return (
    <div style={css.page}>
      <nav style={css.nav}>
        <div style={css.logo}>⚜️ PLUTOX</div>
        <div style={{ display:'flex', gap:4, overflowX:'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ ...css.btn, background: tab===t.id ? G.goldGlow : 'transparent',
                color: tab===t.id ? G.goldLight : G.textMuted,
                border: `1px solid ${tab===t.id ? G.gold+'40' : 'transparent'}`,
                padding: '6px 14px', fontSize:12 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'20px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div>
            <h2 style={{ margin:0, color:G.goldLight, fontSize:20 }}>
              {tabs.find(t=>t.id===tab)?.icon} {tabs.find(t=>t.id===tab)?.label}
            </h2>
            {customer && <p style={{ margin:'4px 0 0', color:G.textMuted, fontSize:13 }}>Welcome back, {customer.full_name?.split(' ')[0]}</p>}
          </div>
          <GoldTicker />
        </div>

        {tab === 'vault'   && <HoldingsView customerId={userId} />}
        {tab === 'buy'     && <BuyView customerId={userId} />}
        {tab === 'orders'  && <OrdersView />}
        {tab === 'billing' && <BillingView customerId={userId} customer={customer} />}
        {tab === 'account' && <AccountView customer={customer} onSignOut={() => auth.signOut()} />}
      </div>
    </div>
  )
}
