import React, { useState, useEffect } from 'react';
import { L, card, page, topBar, badge } from '../styles/light';
import { useAI } from '../hooks/useAI';

const CURRENCIES = [
  { code:'USD', name:'US Dollar',          symbol:'$',   flag:'🇺🇸' },
  { code:'EUR', name:'Euro',               symbol:'€',   flag:'🇪🇺' },
  { code:'GBP', name:'British Pound',      symbol:'£',   flag:'🇬🇧' },
  { code:'CAD', name:'Canadian Dollar',    symbol:'CA$', flag:'🇨🇦' },
  { code:'AUD', name:'Australian Dollar',  symbol:'A$',  flag:'🇦🇺' },
  { code:'JPY', name:'Japanese Yen',       symbol:'¥',   flag:'🇯🇵' },
  { code:'CNY', name:'Chinese Yuan',       symbol:'¥',   flag:'🇨🇳' },
  { code:'INR', name:'Indian Rupee',       symbol:'₹',   flag:'🇮🇳' },
  { code:'BRL', name:'Brazilian Real',     symbol:'R$',  flag:'🇧🇷' },
  { code:'MXN', name:'Mexican Peso',       symbol:'MX$', flag:'🇲🇽' },
  { code:'ZAR', name:'South African Rand', symbol:'R',   flag:'🇿🇦' },
  { code:'NGN', name:'Nigerian Naira',     symbol:'₦',   flag:'🇳🇬' },
  { code:'KES', name:'Kenyan Shilling',    symbol:'KSh', flag:'🇰🇪' },
  { code:'GHS', name:'Ghanaian Cedi',      symbol:'GH₵', flag:'🇬🇭' },
  { code:'EGP', name:'Egyptian Pound',     symbol:'E£',  flag:'🇪🇬' },
  { code:'AED', name:'UAE Dirham',         symbol:'د.إ', flag:'🇦🇪' },
  { code:'SAR', name:'Saudi Riyal',        symbol:'﷼',   flag:'🇸🇦' },
  { code:'SGD', name:'Singapore Dollar',   symbol:'S$',  flag:'🇸🇬' },
  { code:'CHF', name:'Swiss Franc',        symbol:'Fr',  flag:'🇨🇭' },
  { code:'SEK', name:'Swedish Krona',      symbol:'kr',  flag:'🇸🇪' },
  { code:'TRY', name:'Turkish Lira',       symbol:'₺',   flag:'🇹🇷' },
  { code:'KRW', name:'South Korean Won',   symbol:'₩',   flag:'🇰🇷' },
  { code:'IDR', name:'Indonesian Rupiah',  symbol:'Rp',  flag:'🇮🇩' },
  { code:'MYR', name:'Malaysian Ringgit',  symbol:'RM',  flag:'🇲🇾' },
  { code:'THB', name:'Thai Baht',          symbol:'฿',   flag:'🇹🇭' },
  { code:'PHP', name:'Philippine Peso',    symbol:'₱',   flag:'🇵🇭' },
  { code:'PKR', name:'Pakistani Rupee',    symbol:'₨',   flag:'🇵🇰' },
  { code:'VND', name:'Vietnamese Dong',    symbol:'₫',   flag:'🇻🇳' },
  { code:'CLP', name:'Chilean Peso',       symbol:'CL$', flag:'🇨🇱' },
  { code:'ARS', name:'Argentine Peso',     symbol:'AR$', flag:'🇦🇷' },
  { code:'UAH', name:'Ukrainian Hryvnia',  symbol:'₴',   flag:'🇺🇦' },
  { code:'ILS', name:'Israeli Shekel',     symbol:'₪',   flag:'🇮🇱' },
  { code:'MAD', name:'Moroccan Dirham',    symbol:'MAD', flag:'🇲🇦' },
  { code:'TZS', name:'Tanzanian Shilling', symbol:'TSh', flag:'🇹🇿' },
  { code:'UGX', name:'Ugandan Shilling',   symbol:'USh', flag:'🇺🇬' },
  { code:'ETB', name:'Ethiopian Birr',     symbol:'Br',  flag:'🇪🇹' },
];

const OFFLINE = { USD:1,EUR:0.92,GBP:0.79,CAD:1.36,AUD:1.53,JPY:149.5,CNY:7.24,INR:83.1,BRL:4.97,MXN:17.2,ZAR:18.6,NGN:1580,KES:129,GHS:12.1,EGP:30.9,AED:3.67,SAR:3.75,SGD:1.34,CHF:0.89,SEK:10.4,TRY:30.5,KRW:1325,IDR:15600,MYR:4.65,THB:35.1,PHP:56.8,PKR:279,VND:24300,CLP:891,ARS:350,UAH:37.5,ILS:3.75,MAD:10.1,TZS:2500,UGX:3750,ETB:56 };
const POPULAR = ['USD','EUR','GBP','CAD','NGN','KES','ZAR','GHS','INR','AED'];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Currency() {
  const [amount,       setAmount]       = useState('1000');
  const [from,         setFrom]         = useState('USD');
  const [to,           setTo]           = useState('EUR');
  const [rates,        setRates]        = useState(OFFLINE);
  const [loading,      setLoading]      = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState('');
  const [transactions, setTransactions] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [fromSearch,   setFromSearch]   = useState('');
  const [toSearch,     setToSearch]     = useState('');
  const [showFrom,     setShowFrom]     = useState(false);
  const [showTo,       setShowTo]       = useState(false);

  const { setPageContext } = useAI();
  const isMobile = useIsMobile();

  useEffect(() => { setPageContext('currency', { page: 'currency' }); }, []);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(d => { if (d.rates) { setRates(d.rates); setLastUpdated(new Date().toLocaleTimeString()); }})
      .catch(() => setLastUpdated('Offline rates'))
      .finally(() => setLoading(false));

    fetch('https://api.getnovala.com/api/v1/transactions/', {
      headers: { Authorization:`Bearer ${localStorage.getItem('token')}` },
    }).then(r => r.json()).then(d => setTransactions(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const convert  = (amt, f, t) => { if (!rates[f] || !rates[t]) return 0; return (amt / rates[f]) * rates[t]; };
  const converted = convert(parseFloat(amount) || 0, from, to);
  const rate      = rates[to] && rates[from] ? rates[to] / rates[from] : 0;
  const getInfo   = code => CURRENCIES.find(c => c.code === code) || { code, name: code, symbol: code, flag: '🌐' };
  const fromInfo  = getInfo(from);
  const toInfo    = getInfo(to);
  const filtFrom  = CURRENCIES.filter(c => c.code.toLowerCase().includes(fromSearch.toLowerCase()) || c.name.toLowerCase().includes(fromSearch.toLowerCase()));
  const filtTo    = CURRENCIES.filter(c => c.code.toLowerCase().includes(toSearch.toLowerCase())   || c.name.toLowerCase().includes(toSearch.toLowerCase()));
  const totalBase = transactions.reduce((s, t) => s + convert(Math.abs(t.amount), t.currency || 'USD', baseCurrency), 0);

  const DropDown = ({ value, search, setSearch, show, setShow, filtered, onSelect }) => {
    const info = getInfo(value);
    return (
      <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
        <div onClick={() => setShow(!show)}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', background:'#FFFFFF', border:`1px solid ${show ? L.accentBorder : L.border}`, borderRadius:L.radiusSm, cursor:'pointer' }}>
          <span style={{ fontSize:20 }}>{info.flag}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:L.text }}>{info.code}</div>
            <div style={{ fontSize:11, color:L.textMuted }}>{info.name}</div>
          </div>
          <span style={{ color:L.textFaint, fontSize:12 }}>▼</span>
        </div>
        {show && (
          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#FFFFFF', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, zIndex:100, marginTop:4, boxShadow:L.shadowMd, maxHeight:280, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:8 }}>
              <input autoFocus placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width:'100%', padding:'7px 10px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:12, fontFamily:L.font, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {filtered.map(c => (
                <div key={c.code} onClick={() => { onSelect(c.code); setSearch(''); setShow(false); }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer', background:c.code === value ? L.accentSoft : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = L.pageBg}
                  onMouseLeave={e => e.currentTarget.style.background = c.code === value ? L.accentSoft : 'transparent'}>
                  <span style={{ fontSize:18 }}>{c.flag}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:L.text }}>{c.code}</div>
                    <div style={{ fontSize:10, color:L.textMuted }}>{c.name}</div>
                  </div>
                  <div style={{ marginLeft:'auto', fontSize:11, color:L.textFaint }}>{c.symbol}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const pad = isMobile ? '16px' : '24px 28px';

  return (
    <div style={page} onClick={() => { setShowFrom(false); setShowTo(false); }}>

      {/* Top bar */}
      <div style={{
        ...topBar,
        flexDirection: isMobile ? 'column' : 'row',
        alignItems:    isMobile ? 'flex-start' : 'center',
        gap:           isMobile ? 10 : 0,
        padding:       isMobile ? '16px' : undefined,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>
            Currency Exchange
          </div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>
            Live rates · {loading ? 'Loading...' : `Updated ${lastUpdated}`}
          </div>
        </div>
        <div style={{ padding:'4px 12px', borderRadius:20, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, fontSize:11, color:L.accent, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
          {loading ? '⏳ Loading...' : '🟢 Live rates'}
        </div>
      </div>

      <div style={{ padding: pad }}>

        {/* Converter card */}
        <div style={{ ...card, padding: isMobile ? 16 : 28, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:L.text, marginBottom:16 }}>Currency Converter</div>

          {/* Amount input */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Amount</div>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              style={{ width:'100%', padding: isMobile ? '12px 14px' : '14px 16px', background:L.pageBg, border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize: isMobile ? 20 : 24, fontWeight:700, fontFamily:L.fontMono, outline:'none', boxSizing:'border-box' }}/>
          </div>

          {/* From / Swap / To — stack on mobile */}
          {isMobile ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>From</div>
                <DropDown value={from} search={fromSearch} setSearch={setFromSearch} show={showFrom} setShow={setShowFrom} filtered={filtFrom} onSelect={setFrom}/>
              </div>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <button onClick={() => { setFrom(to); setTo(from); }}
                  style={{ width:40, height:40, borderRadius:10, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  ⇅
                </button>
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>To</div>
                <DropDown value={to} search={toSearch} setSearch={setToSearch} show={showTo} setShow={setShowTo} filtered={filtTo} onSelect={setTo}/>
              </div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 48px 1fr', gap:12, alignItems:'center', marginBottom:24 }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>From</div>
                <DropDown value={from} search={fromSearch} setSearch={setFromSearch} show={showFrom} setShow={setShowFrom} filtered={filtFrom} onSelect={setFrom}/>
              </div>
              <div style={{ paddingTop:24, textAlign:'center' }}>
                <button onClick={() => { setFrom(to); setTo(from); }}
                  style={{ width:40, height:40, borderRadius:10, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, color:L.accent, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  ⇄
                </button>
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>To</div>
                <DropDown value={to} search={toSearch} setSearch={setToSearch} show={showTo} setShow={setShowTo} filtered={filtTo} onSelect={setTo}/>
              </div>
            </div>
          )}

          {/* Result */}
          <div style={{ padding: isMobile ? 16 : 22, borderRadius:L.radius, background:`linear-gradient(135deg, ${L.accentSoft} 0%, rgba(59,130,246,0.04) 100%)`, border:`1px solid ${L.accentBorder}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, color:L.textMuted, marginBottom:6 }}>
                {fromInfo.flag} {amount || 0} {fromInfo.name} =
              </div>
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight:800, color:L.accent, fontFamily:L.fontMono, letterSpacing:'-0.02em', overflow:'hidden', textOverflow:'ellipsis' }}>
                {toInfo.symbol}{converted.toLocaleString('en', { maximumFractionDigits:2 })}
              </div>
              <div style={{ fontSize:11, color:L.textMuted, marginTop:6 }}>
                1 {from} = {rate.toFixed(4)} {to}
              </div>
            </div>
            <div style={{ fontSize: isMobile ? 36 : 48, flexShrink:0, marginLeft:12 }}>{toInfo.flag}</div>
          </div>
        </div>

        {/* Quick convert — 2 cols on mobile, auto on desktop */}
        <div style={{ ...card, padding: isMobile ? 16 : 20, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:L.text, marginBottom:12 }}>
            Quick Convert — 1 {from} to popular currencies
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(140px,1fr))', gap:10 }}>
            {POPULAR.filter(c => c !== from).map(code => {
              const r    = rates[code] && rates[from] ? (rates[code] / rates[from]) : 0;
              const info = getInfo(code);
              return (
                <div key={code} onClick={() => setTo(code)} style={{ padding: isMobile ? '10px 12px' : '12px 14px', borderRadius:L.radiusSm, cursor:'pointer', background:to === code ? L.accentSoft : '#FFFFFF', border:`1px solid ${to === code ? L.accentBorder : L.border}`, transition:'all 0.15s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <span style={{ fontSize:16 }}>{info.flag}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:to === code ? L.accent : L.text }}>{code}</span>
                  </div>
                  <div style={{ fontSize: isMobile ? 13 : 14, fontWeight:700, color:to === code ? L.accent : L.textSub, fontFamily:L.fontMono }}>
                    {r.toLocaleString('en', { maximumFractionDigits:2 })}
                  </div>
                  <div style={{ fontSize:10, color:L.textFaint }}>{info.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transactions table */}
        <div style={{ ...card, overflow:'hidden' }}>
          <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Your Transactions</div>
              <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>All converted to {baseCurrency}</div>
            </div>
            <select value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)}
              style={{ padding:'7px 12px', background:'#FFFFFF', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:12, fontFamily:L.font, outline:'none', cursor:'pointer' }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
          </div>

          <div style={{ padding: isMobile ? '10px 16px' : '12px 20px', background:L.pageBg, borderBottom:`1px solid ${L.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, color:L.textMuted }}>Total in {baseCurrency}</span>
            <span style={{ fontSize: isMobile ? 16 : 18, fontWeight:700, color:L.red, fontFamily:L.fontMono }}>
              {getInfo(baseCurrency).symbol}{totalBase.toLocaleString('en', { maximumFractionDigits:2 })}
            </span>
          </div>

          {/* Table header — hidden on mobile */}
          {!isMobile && (
            <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 120px 130px 80px', padding:'8px 20px', borderBottom:`1px solid ${L.border}`, background:L.pageBg }}>
              {['DATE','VENDOR','ORIGINAL','CONVERTED','CCY'].map(h => (
                <div key={h} style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.12em' }}>{h}</div>
              ))}
            </div>
          )}

          {transactions.length === 0 && (
            <div style={{ padding:40, textAlign:'center', color:L.textMuted, fontSize:13 }}>
              No transactions yet — upload documents to create transactions
            </div>
          )}

          {transactions.map((t, i) => {
            const conv  = convert(Math.abs(t.amount), t.currency || 'USD', baseCurrency);
            const bInfo = getInfo(baseCurrency);
            return isMobile ? (
              // Mobile — simplified card layout
              <div key={t.id} style={{ padding:'12px 16px', borderBottom: i < transactions.length - 1 ? `1px solid ${L.border}` : 'none' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:L.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:8 }}>{t.vendor || '—'}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:L.red, fontFamily:L.fontMono, flexShrink:0 }}>${Math.abs(t.amount).toLocaleString()}</div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:11, color:L.textMuted }}>{t.txn_date || '—'} · {t.currency || 'USD'}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:L.accent, fontFamily:L.fontMono }}>{bInfo.symbol}{conv.toLocaleString('en', { maximumFractionDigits:2 })}</div>
                </div>
              </div>
            ) : (
              // Desktop — full grid layout
              <div key={t.id} style={{ display:'grid', gridTemplateColumns:'100px 1fr 120px 130px 80px', padding:'12px 20px', borderBottom: i < transactions.length - 1 ? `1px solid ${L.border}` : 'none', alignItems:'center' }}
                onMouseEnter={e => e.currentTarget.style.background = L.pageBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ fontSize:11, color:L.textMuted, fontFamily:L.fontMono }}>{t.txn_date || '—'}</div>
                <div style={{ fontSize:13, fontWeight:600, color:L.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.vendor || '—'}</div>
                <div style={{ fontSize:12, fontWeight:700, color:L.red, fontFamily:L.fontMono }}>${Math.abs(t.amount).toLocaleString()}</div>
                <div style={{ fontSize:12, fontWeight:700, color:L.accent, fontFamily:L.fontMono }}>{bInfo.symbol}{conv.toLocaleString('en', { maximumFractionDigits:2 })}</div>
                <div><span style={badge(L.blue, L.blueSoft, L.blueBorder)}>{t.currency || 'USD'}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
