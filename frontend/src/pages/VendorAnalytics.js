import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingDown, Store, ShoppingCart, Calendar,
  Tag, BarChart2, PieChart as PieIcon, Users,
  DollarSign, Activity,
} from 'lucide-react';
import { L, card, page, topBar, badge } from '../styles/light';
import { useAI } from '../hooks/useAI';

const COLORS = ['#0AB98A','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#06B6D4'];

export default function VendorAnalytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState(null);

  const { setPageContext } = useAI();

  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('/api/v1/transactions/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const vendorMap = transactions.reduce((acc, t) => {
    const v = t.vendor || 'Unknown';
    if (!acc[v]) acc[v] = {
      vendor: v, total: 0, count: 0, transactions: [],
      category: t.category || t.ml_category || 'Uncategorized',
      lastDate: t.txn_date || '',
    };
    acc[v].total += Math.abs(t.amount);
    acc[v].count += 1;
    acc[v].transactions.push(t);
    if ((t.txn_date || '') > acc[v].lastDate) acc[v].lastDate = t.txn_date || '';
    return acc;
  }, {});

  const vendors    = Object.values(vendorMap).sort((a, b) => b.total - a.total);
  const topVendors = vendors.slice(0, 8);
  const totalSpend = vendors.reduce((s, v) => s + v.total, 0);

  const catMap  = transactions.reduce((acc, t) => {
    const c = t.category || t.ml_category || 'Uncategorized';
    acc[c]  = (acc[c] || 0) + Math.abs(t.amount);
    return acc;
  }, {});
  const catData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const fmt = n => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;

  useEffect(() => {
  setPageContext('vendors', {
    page:          'vendors',
    total_vendors: transactions.length,
  });
}, [transactions]);
  return (
    <div style={page}>

      <div style={topBar}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>
            Vendor Analytics
          </div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>
            See where your money goes
          </div>
        </div>
      </div>

      <div style={{ padding:'24px 28px' }}>

        {loading && (
          <div style={{ textAlign:'center', padding:40, color:L.textMuted }}>
            Loading...
          </div>
        )}

        {!loading && transactions.length === 0 && (
          <div style={{ ...card, padding:60, textAlign:'center' }}>
            <div style={{
              width:60, height:60, borderRadius:16,
              background:L.accentSoft, border:`1px solid ${L.accentBorder}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 16px',
            }}>
              <BarChart2 size={26} color={L.accent} />
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:L.text, marginBottom:6 }}>
              No transaction data yet
            </div>
            <div style={{ fontSize:13, color:L.textMuted }}>
              Upload documents to see vendor analytics
            </div>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <>
            {/* Summary cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
              {[
                { label:'Total Vendors',  value:vendors.length,                                      color:L.accent, icon:<Users size={16} />       },
                { label:'Total Spending', value:fmt(totalSpend),                                     color:L.red,    icon:<TrendingDown size={16} /> },
                { label:'Avg per Vendor', value:fmt(vendors.length ? totalSpend/vendors.length : 0), color:L.gold,   icon:<DollarSign size={16} />   },
                { label:'Top Vendor',     value:topVendors[0]?.vendor||'—',                          color:L.blue,   icon:<Store size={16} />        },
              ].map(c => (
                <div key={c.label} style={{ ...card, padding:'18px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                      {c.label}
                    </div>
                    <span style={{ color:c.color, opacity:0.6 }}>{c.icon}</span>
                  </div>
                  <div style={{
                    fontSize: c.label==='Top Vendor' ? 15 : 24, fontWeight:700, color:c.color,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>
                    {c.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, marginBottom:20 }}>

              {/* Bar chart */}
              <div style={{ ...card, padding:'22px 24px' }}>
                <div style={{ fontSize:14, fontWeight:700, color:L.text, marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                  <BarChart2 size={15} color={L.accent} />
                  Top Vendors by Spending
                </div>
                <div style={{ fontSize:12, color:L.textMuted, marginBottom:16 }}>
                  Highest spend vendors
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topVendors} margin={{ top:4, right:4, left:-16, bottom:60 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke={L.borderLight} vertical={false} />
                    <XAxis dataKey="vendor" tick={{ fill:L.textMuted, fontSize:10 }}
                      angle={-35} textAnchor="end" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:L.textMuted, fontSize:10 }}
                      axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background:'#fff', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, fontSize:12, boxShadow:L.shadowMd }}
                      formatter={v => [fmt(v), 'Spent']}
                    />
                    <Bar dataKey="total" fill={L.accent} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div style={{ ...card, padding:'22px 24px' }}>
                <div style={{ fontSize:14, fontWeight:700, color:L.text, marginBottom:4, display:'flex', alignItems:'center', gap:8 }}>
                  <PieIcon size={15} color={L.accent} />
                  Spending by Category
                </div>
                <div style={{ fontSize:12, color:L.textMuted, marginBottom:16 }}>Category breakdown</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background:'#fff', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, fontSize:11 }}
                      formatter={v => [fmt(v)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
                  {catData.slice(0, 4).map((c, i) => (
                    <div key={c.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:2, flexShrink:0, background:COLORS[i % COLORS.length] }} />
                      <span style={{ fontSize:11, color:L.textSub, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {c.name}
                      </span>
                      <span style={{ fontSize:11, fontWeight:600, color:L.text, fontFamily:L.fontMono }}>
                        {fmt(c.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vendor table */}
            <div style={{ ...card, overflow:'hidden' }}>
              <div style={{ padding:'16px 20px', borderBottom:`1px solid ${L.borderLight}`, display:'flex', alignItems:'center', gap:8 }}>
                <Store size={15} color={L.accent} />
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>All Vendors</div>
              </div>
              <div style={{
                display:'grid', gridTemplateColumns:'1fr 120px 80px 160px 120px',
                padding:'8px 20px', borderBottom:`1px solid ${L.borderLight}`, background:L.pageBg,
              }}>
                {[
                  { label:'VENDOR',      icon:<Store size={9} />       },
                  { label:'TOTAL SPENT', icon:<DollarSign size={9} />  },
                  { label:'ORDERS',      icon:<ShoppingCart size={9} /> },
                  { label:'CATEGORY',    icon:<Tag size={9} />          },
                  { label:'LAST ORDER',  icon:<Calendar size={9} />     },
                ].map(h => (
                  <div key={h.label} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em', display:'flex', alignItems:'center', gap:4 }}>
                    {h.icon}{h.label}
                  </div>
                ))}
              </div>

              {vendors.map((v, i) => (
                <div key={v.vendor}>
                  <div
                    onClick={() => setSelected(selected === v.vendor ? null : v.vendor)}
                    style={{
                      display:'grid', gridTemplateColumns:'1fr 120px 80px 160px 120px',
                      padding:'13px 20px', cursor:'pointer',
                      borderBottom:`1px solid ${L.borderLight}`,
                      transition:'background 0.1s', alignItems:'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = L.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:32, height:32, borderRadius:8,
                        background:`${COLORS[i % COLORS.length]}15`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:13, fontWeight:700, color:COLORS[i % COLORS.length], flexShrink:0,
                      }}>
                        {v.vendor.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:L.text }}>{v.vendor}</div>
                        <div style={{ fontSize:10, color:L.textMuted }}>
                          {v.count} transaction{v.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize:13, fontWeight:700, color:L.red, fontFamily:L.fontMono, display:'flex', alignItems:'center', gap:4 }}>
                      <TrendingDown size={11} />
                      {fmt(v.total)}
                    </div>

                    <div style={{ fontSize:13, color:L.textSub, display:'flex', alignItems:'center', gap:4 }}>
                      <ShoppingCart size={11} color={L.textFaint} />
                      {v.count}
                    </div>

                    <div>
                      <span style={badge(L.blue, L.blueSoft, L.blueBorder)}>
                        {v.category}
                      </span>
                    </div>

                    <div style={{ fontSize:11, color:L.textMuted, fontFamily:L.fontMono, display:'flex', alignItems:'center', gap:4 }}>
                      <Calendar size={10} color={L.textFaint} />
                      {v.lastDate || '—'}
                    </div>
                  </div>

                  {selected === v.vendor && (
                    <div style={{
                      padding:'14px 20px 14px 62px',
                      background:L.accentSoft,
                      borderBottom:`1px solid ${L.accentBorder}`,
                    }}>
                      <div style={{ fontSize:11, fontWeight:700, color:L.accent, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                        <Activity size={12} />
                        Transaction History
                      </div>
                      {v.transactions.map(t => (
                        <div key={t.id} style={{
                          display:'flex', gap:16, alignItems:'center',
                          padding:'6px 0', borderBottom:`1px solid ${L.accentBorder}`,
                          fontSize:12,
                        }}>
                          <span style={{ color:L.textMuted, fontFamily:L.fontMono, width:90, display:'flex', alignItems:'center', gap:4 }}>
                            <Calendar size={10} />{t.txn_date || '—'}
                          </span>
                          <span style={{ color:L.red, fontWeight:700, fontFamily:L.fontMono, display:'flex', alignItems:'center', gap:4 }}>
                            <DollarSign size={11} />{Math.abs(t.amount).toLocaleString()}
                          </span>
                          <span style={{ color:L.textMuted, display:'flex', alignItems:'center', gap:4 }}>
                            <Tag size={10} />{t.category || t.ml_category || 'Uncategorized'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}