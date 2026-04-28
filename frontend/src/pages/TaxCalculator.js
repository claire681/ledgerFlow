import React, { useState, useEffect, useMemo } from 'react';
import {
  Download, Calculator, Info, CheckCircle,
  AlertTriangle, TrendingDown, TrendingUp,
  DollarSign, Percent, Globe, ChevronDown,
  PiggyBank, Receipt, Shield,
} from 'lucide-react';
import { L, card, page, topBar } from '../styles/light';
import { useAI } from '../hooks/useAI';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TAX_RATES } from '../data/taxRates';
import { calculateTax } from '../utils/taxEngine';

const DEDUCTIBLES = [
  { key:'rent',         label:'Office Rent',              desc:'Physical office or coworking space',    mealsCap:false },
  { key:'software',     label:'Software & Subscriptions', desc:'SaaS tools, apps, licenses',            mealsCap:false },
  { key:'hardware',     label:'Hardware & Equipment',     desc:'Computers, peripherals, gear',          mealsCap:false },
  { key:'marketing',    label:'Marketing & Advertising',  desc:'Ads, campaigns, branding',              mealsCap:false },
  { key:'travel',       label:'Business Travel',          desc:'Flights, hotels, business trips',       mealsCap:false },
  { key:'meals',        label:'Business Meals (50%)',     desc:'Only 50% of meals are deductible',      mealsCap:true  },
  { key:'salaries',     label:'Salaries & Wages',         desc:'Employee compensation',                 mealsCap:false },
  { key:'insurance',    label:'Insurance Premiums',       desc:'Business and liability insurance',      mealsCap:false },
  { key:'legal',        label:'Legal & Professional',     desc:'Lawyers, accountants, consultants',     mealsCap:false },
  { key:'training',     label:'Training & Education',     desc:'Courses, conferences, certifications',  mealsCap:false },
  { key:'utilities',    label:'Utilities',                desc:'Internet, electricity, phone',          mealsCap:false },
  { key:'depreciation', label:'Depreciation',             desc:'Asset depreciation allowance',          mealsCap:false },
];

function fmtCurrency(amount, currencyCode) {
  const n         = parseFloat(amount) || 0;
  const formatted = Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `- ${currencyCode} ${formatted}` : `${currencyCode} ${formatted}`;
}

function fmtPct(rate) { return `${(rate * 100).toFixed(1)}%`; }

const countryOptions = Object.entries(TAX_RATES)
  .map(([code, data]) => ({ code, ...data }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function TaxCalculator() {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedState,   setSelectedState]   = useState('CA');
  const [search,          setSearch]          = useState('');
  const [showDrop,        setShowDrop]        = useState(false);
  const [revenue,         setRevenue]         = useState('');
  const [customRate,      setCustomRate]      = useState('');
  const [useCustom,       setUseCustom]       = useState(false);
  const [includeVAT,      setIncludeVAT]      = useState(true);
  const [deductibles,     setDeductibles]     = useState({});

  const { setPageContext } = useAI();

  const countryData  = TAX_RATES[selectedCountry];
  const currencyCode = countryData?.currency || 'USD';
  const hasState     = countryData?.hasState || false;

  const stateOptions = useMemo(() => {
    if (!(hasState && countryData?.states)) return [];
    return Object.entries(countryData.states)
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hasState, countryData]);

  const countrySalesTax = countryData?.salesTax || 0;
  const vatAvailable    = countrySalesTax > 0 ||
    (hasState && selectedState && countryData?.states?.[selectedState]?.salesTax > 0);

  useEffect(() => {
    if (!vatAvailable) setIncludeVAT(false);
    else setIncludeVAT(true);
  }, [vatAvailable]);

  useEffect(() => {
    if (hasState && stateOptions.length > 0) setSelectedState(stateOptions[0].code);
    else setSelectedState('');
  }, [hasState, stateOptions]);

  const totalDeductible = Object.entries(deductibles).reduce((sum, [key, val]) => {
    const v = parseFloat(val) || 0;
    const d = DEDUCTIBLES.find(d => d.key === key);
    return sum + (d?.mealsCap ? v * 0.5 : v);
  }, 0);

  const result = calculateTax({
    revenue:       parseFloat(revenue) || 0,
    deductions:    totalDeductible,
    countryData,
    stateCode:     selectedState,
    useCustomRate: useCustom,
    customRate,
    includeVAT,
  });

  const fmt = (n) => fmtCurrency(n, currencyCode);

  useEffect(() => {
  setPageContext('tax', {
    page:     'tax',
    country:  countryData?.name,
    currency: currencyCode,
    revenue:  parseFloat(revenue) || 0,
  });
}, [revenue, selectedCountry]);
  const filtered = countryOptions.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.currency.toLowerCase().includes(search.toLowerCase())
  );

  const exportPDF = () => {
    const doc       = new jsPDF();
    const country   = countryData?.name || '';
    const stateName = result.stateName ? ` — ${result.stateName}` : '';
    const dateStr   = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

    doc.setFontSize(22); doc.setTextColor(10, 185, 138);
    doc.text('LedgerFlow', 14, 18);
    doc.setFontSize(13); doc.setTextColor(100);
    doc.text('Tax Estimation Report', 14, 26);
    doc.setFontSize(10);
    doc.text(`Country: ${country}${stateName}`, 14, 38);
    doc.text(`Currency: ${currencyCode}`, 14, 45);
    doc.text(`Report Date: ${dateStr}`, 14, 52);
    doc.text(`Tax Year: ${new Date().getFullYear()}`, 14, 59);
    doc.text(useCustom ? `Tax Rate: Custom ${parseFloat(customRate).toFixed(1)}%` : `Tax Rate: ${fmtPct(result.federalRate)} federal${result.stateRate > 0 ? ` + ${fmtPct(result.stateRate)} state` : ''}`, 14, 66);

    const tableRows = [
      ['Annual Revenue',                                         fmt(parseFloat(revenue)||0)           ],
      ['Total Deductibles',                                      `- ${fmt(totalDeductible)}`           ],
      ['Taxable Income',                                         fmt(result.taxableIncome)             ],
      [`Federal Corporate Tax (${fmtPct(result.federalRate)})`, fmt(result.federalTax)                ],
    ];
    if (result.stateRate > 0 && !useCustom) tableRows.push([`${result.stateName} Tax (${fmtPct(result.stateRate)})`, fmt(result.stateTax)]);
    tableRows.push(
      ['Total Corporate Tax',                            fmt(result.corporateTax)               ],
      [includeVAT ? `VAT / Sales Tax (${fmtPct(result.salesTaxRate)})` : 'VAT / Sales Tax (Not included)', fmt(result.vatTax)],
      ['Total Tax Liability',                            fmt(result.totalTax)                   ],
      ['Net Profit After Tax',                           fmt(result.netProfit)                  ],
      ['Effective Tax Rate',                             `${result.effectiveRate.toFixed(1)}%`  ],
      ['Potential Tax Saved via Deductions',             fmt(result.taxSaved)                   ],
    );

    autoTable(doc, {
      startY: 76, head: [['Item', 'Amount']], body: tableRows,
      styles: { fontSize:10, cellPadding:5 },
      headStyles: { fillColor:[10,185,138], textColor:255, fontStyle:'bold' },
      alternateRowStyles: { fillColor:[248,250,252] },
      columnStyles: { 1: { halign:'right', fontStyle:'bold' } },
    });

    const dedRows = Object.entries(deductibles).filter(([,v]) => parseFloat(v) > 0).map(([key,val]) => {
      const d = DEDUCTIBLES.find(d => d.key === key);
      const v = parseFloat(val) || 0;
      return [d?.label || key, fmt(d?.mealsCap ? v * 0.5 : v), d?.mealsCap ? '50% rule applied' : ''];
    });
    if (dedRows.length > 0) {
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11); doc.setTextColor(15, 23, 42);
      doc.text('Deductibles Breakdown', 14, finalY);
      autoTable(doc, { startY: finalY + 4, head: [['Deductible', 'Adjusted Amount', 'Note']], body: dedRows, styles: { fontSize:9, cellPadding:4 }, headStyles: { fillColor:[59,130,246], textColor:255 }, alternateRowStyles: { fillColor:[248,250,252] } });
    }

    const disclaimerY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text('DISCLAIMER: This report is for estimation purposes only and does not constitute tax advice.', 14, disclaimerY);
    doc.text('Always consult a qualified tax professional for accurate filing.', 14, disclaimerY + 5);
    doc.save(`LedgerFlow_Tax_${selectedCountry}_${new Date().getFullYear()}.pdf`);
  };

  return (
    <div style={page} onClick={() => setShowDrop(false)}>

      {/* Top bar */}
      <div style={topBar}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:L.text, letterSpacing:'-0.02em' }}>
            Tax Calculator
          </div>
          <div style={{ fontSize:12, color:L.textMuted, marginTop:2 }}>
            Estimate corporate tax for {countryData?.name}
            {result.stateName ? ` — ${result.stateName}` : ''}
          </div>
        </div>
        <button onClick={exportPDF} style={{
          display:'flex', alignItems:'center', gap:7,
          padding:'9px 18px', borderRadius:L.radiusSm,
          background:L.accent, color:'#fff', border:'none',
          cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:L.font,
        }}>
          <Download size={14} />
          Export PDF
        </button>
      </div>

      <div style={{ padding:'24px 28px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 400px', gap:20 }}>

          {/* LEFT COLUMN */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Country selector */}
            <div style={{ ...card, padding:22 }}>
              <div style={{ fontSize:13, fontWeight:700, color:L.text, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <Globe size={15} color={L.accent} />
                Select Country
              </div>

              <div style={{ position:'relative' }} onClick={e => e.stopPropagation()}>
                <div
                  onClick={() => setShowDrop(!showDrop)}
                  style={{
                    display:'flex', alignItems:'center', gap:12,
                    padding:'11px 14px', background:'#FFFFFF',
                    border:`1px solid ${showDrop ? L.accentBorder : L.border}`,
                    borderRadius:L.radiusSm, cursor:'pointer', transition:'all 0.15s',
                  }}
                >
                  <div style={{
                    width:32, height:32, borderRadius:8,
                    background:L.accentSoft, border:`1px solid ${L.accentBorder}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0,
                  }}>
                    <Globe size={16} color={L.accent} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:L.text }}>{countryData?.name}</div>
                    <div style={{ fontSize:11, color:L.textMuted }}>
                      Corp: {fmtPct(countryData?.corporateTax || 0)} · VAT: {vatAvailable ? fmtPct(countryData?.salesTax || 0) : 'None'} · {currencyCode}
                    </div>
                  </div>
                  <ChevronDown size={14} color={L.textFaint} style={{ transform: showDrop ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
                </div>

                {showDrop && (
                  <div style={{
                    position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:200,
                    background:'#FFFFFF', border:`1px solid ${L.border}`,
                    borderRadius:L.radiusSm, boxShadow:L.shadowMd,
                    maxHeight:320, display:'flex', flexDirection:'column',
                  }}>
                    <div style={{ padding:8 }}>
                      <input
                        autoFocus
                        placeholder="Search by country, code, or currency..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                          width:'100%', padding:'8px 12px',
                          background:L.pageBg, border:`1px solid ${L.border}`,
                          borderRadius:L.radiusSm, color:L.text,
                          fontSize:12, fontFamily:L.font,
                          outline:'none', boxSizing:'border-box',
                        }}
                      />
                    </div>
                    <div style={{ overflowY:'auto', flex:1 }}>
                      {filtered.map(c => (
                        <div
                          key={c.code}
                          onClick={() => { setSelectedCountry(c.code); setSearch(''); setShowDrop(false); }}
                          style={{
                            display:'flex', alignItems:'center', gap:12,
                            padding:'9px 14px', cursor:'pointer',
                            background: c.code === selectedCountry ? L.accentSoft : 'transparent',
                            transition:'background 0.1s',
                          }}
                          onMouseEnter={e => { if (c.code !== selectedCountry) e.currentTarget.style.background = L.pageBg; }}
                          onMouseLeave={e => { e.currentTarget.style.background = c.code === selectedCountry ? L.accentSoft : 'transparent'; }}
                        >
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:500, color:L.text }}>{c.name}</div>
                            <div style={{ fontSize:10, color:L.textMuted }}>
                              {fmtPct(c.corporateTax)} corp · {c.salesTax > 0 ? `${fmtPct(c.salesTax)} VAT` : 'No VAT'} · {c.currency}{c.hasState ? ' · Has regions' : ''}
                            </div>
                          </div>
                          {c.code === selectedCountry && <CheckCircle size={13} color={L.accent} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {hasState && stateOptions.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>
                    {selectedCountry === 'CA' ? 'Province' : 'State'}
                  </div>
                  <select
                    value={selectedState}
                    onChange={e => setSelectedState(e.target.value)}
                    style={{ width:'100%', padding:'9px 12px', background:'#FFFFFF', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, color:L.text, fontSize:13, fontFamily:L.font, outline:'none', cursor:'pointer' }}
                  >
                    {stateOptions.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.name} — +{fmtPct(s.extraTax)} corp{s.salesTax > 0 ? ` · ${fmtPct(s.salesTax)} sales tax` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedState && countryData?.states?.[selectedState] && (
                    <div style={{ marginTop:8, padding:'8px 12px', borderRadius:L.radiusSm, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, fontSize:11, color:L.accent }}>
                      Total rate in {result.stateName}: <strong>{fmtPct((countryData.corporateTax||0) + (countryData.states[selectedState]?.extraTax||0))}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Revenue + options */}
            <div style={{ ...card, padding:22 }}>
              <div style={{ fontSize:13, fontWeight:700, color:L.text, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <DollarSign size={15} color={L.accent} />
                Annual Revenue
              </div>
              <div style={{ display:'flex', alignItems:'center', background:'#FFFFFF', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', background:L.pageBg, borderRight:`1px solid ${L.border}`, fontSize:12, fontWeight:700, color:L.textMuted, letterSpacing:'0.05em', flexShrink:0 }}>
                  {currencyCode}
                </div>
                <input type="number" min="0" placeholder="0.00" value={revenue}
                  onKeyDown={e => { if (!/[\d.]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) e.preventDefault(); }}
                  onChange={e => setRevenue(e.target.value)}
                  style={{ flex:1, padding:'10px 14px', background:'transparent', border:'none', color:L.text, fontSize:16, fontWeight:700, fontFamily:L.fontMono, outline:'none' }}
                />
              </div>

              <div style={{ marginTop:14, padding:'14px', background:L.pageBg, borderRadius:L.radiusSm, border:`1px solid ${L.border}`, display:'flex', flexDirection:'column', gap:12 }}>
                <label style={{ display:'flex', alignItems:'center', gap:10, cursor: vatAvailable ? 'pointer' : 'not-allowed', opacity: vatAvailable ? 1 : 0.4 }}>
                  <input type="checkbox" checked={includeVAT} disabled={!vatAvailable} onChange={e => setIncludeVAT(e.target.checked)} style={{ width:15, height:15, accentColor:L.accent }} />
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:L.textSub, display:'flex', alignItems:'center', gap:5 }}>
                      <Percent size={11} /> Include VAT / Sales Tax
                    </div>
                    <div style={{ fontSize:10, color:L.textMuted }}>{vatAvailable ? `${fmtPct(result.salesTaxRate)} applies` : 'No VAT for this country'}</div>
                  </div>
                </label>

                <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                  <input type="checkbox" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} style={{ width:15, height:15, accentColor:L.accent }} />
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:L.textSub, display:'flex', alignItems:'center', gap:5 }}>
                      <Shield size={11} /> Override with custom tax rate
                    </div>
                    <div style={{ fontSize:10, color:L.textMuted }}>Replaces all corporate tax rates</div>
                  </div>
                </label>

                {useCustom && (
                  <div style={{ display:'flex', alignItems:'center', background:'#FFFFFF', border:`1px solid ${L.accentBorder}`, borderRadius:L.radiusSm, overflow:'hidden' }}>
                    <input type="number" min="0" max="100" placeholder={((countryData?.corporateTax||0)*100).toFixed(1)} value={customRate}
                      onKeyDown={e => { if (!/[\d.]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) e.preventDefault(); }}
                      onChange={e => setCustomRate(e.target.value)}
                      style={{ flex:1, padding:'9px 12px', background:'transparent', border:'none', color:L.text, fontSize:14, fontFamily:L.fontMono, outline:'none' }}
                    />
                    <div style={{ padding:'9px 14px', background:L.accentSoft, borderLeft:`1px solid ${L.accentBorder}`, fontSize:13, fontWeight:700, color:L.accent }}>%</div>
                  </div>
                )}
              </div>
            </div>

            {/* Deductibles */}
            <div style={{ ...card, padding:22 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:L.text, display:'flex', alignItems:'center', gap:8 }}>
                    <Receipt size={15} color={L.accent} /> Tax Deductibles
                  </div>
                  <div style={{ fontSize:11, color:L.textMuted, marginTop:2 }}>Reduces your taxable income</div>
                </div>
                {totalDeductible > 0 && (
                  <div style={{ padding:'4px 12px', borderRadius:20, background:L.accentSoft, border:`1px solid ${L.accentBorder}`, fontSize:12, fontWeight:700, color:L.accent }}>
                    {fmt(totalDeductible)}
                  </div>
                )}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {DEDUCTIBLES.map(d => (
                  <div key={d.key} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}` }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:L.text }}>{d.label}</div>
                      <div style={{ fontSize:10, color:L.textMuted }}>{d.desc}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', background:'#FFFFFF', border:`1px solid ${L.border}`, borderRadius:L.radiusSm, overflow:'hidden', width:160 }}>
                      <div style={{ padding:'7px 8px', background:L.pageBg, borderRight:`1px solid ${L.border}`, fontSize:10, fontWeight:700, color:L.textMuted, letterSpacing:'0.04em', flexShrink:0 }}>
                        {currencyCode}
                      </div>
                      <input type="number" min="0" placeholder="0" value={deductibles[d.key] || ''}
                        onKeyDown={e => { if (!/[\d.]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) e.preventDefault(); }}
                        onChange={e => setDeductibles(prev => ({ ...prev, [d.key]: e.target.value }))}
                        style={{ flex:1, padding:'7px 8px', background:'transparent', border:'none', color:L.text, fontSize:12, fontFamily:L.fontMono, outline:'none', textAlign:'right' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Tax Summary */}
            <div style={{ ...card, borderTop:`3px solid ${L.accent}`, padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
                <Calculator size={16} color={L.accent} />
                <div style={{ fontSize:14, fontWeight:700, color:L.text }}>Tax Summary</div>
              </div>

              {[
                { label:'Annual Revenue',    value:fmt(parseFloat(revenue)||0), color:L.text,   bold:false },
                { label:'Total Deductibles', value:`− ${fmt(totalDeductible)}`, color:L.accent, bold:false },
                { label:'Taxable Income',    value:fmt(result.taxableIncome),   color:L.text,   bold:true  },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${L.borderLight}` }}>
                  <span style={{ fontSize:13, color:L.textMuted }}>{row.label}</span>
                  <span style={{ fontSize: row.bold ? 16 : 13, fontWeight: row.bold ? 700 : 600, color:row.color, fontFamily:L.fontMono }}>{row.value}</span>
                </div>
              ))}

              <div style={{ margin:'16px 0', padding:'14px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}` }}>
                <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:12 }}>
                  Tax Breakdown
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${L.borderLight}` }}>
                  <span style={{ fontSize:12, color:L.textMuted, display:'flex', alignItems:'center', gap:5 }}>
                    <TrendingDown size={11} /> Federal Corporate Tax ({fmtPct(result.federalRate)})
                  </span>
                  <span style={{ fontSize:13, fontWeight:700, color:L.red, fontFamily:L.fontMono }}>{fmt(result.federalTax)}</span>
                </div>

                {result.stateRate > 0 && !useCustom && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${L.borderLight}` }}>
                    <span style={{ fontSize:12, color:L.textMuted }}>{result.stateName} Tax ({fmtPct(result.stateRate)})</span>
                    <span style={{ fontSize:13, fontWeight:700, color:L.red, fontFamily:L.fontMono }}>{fmt(result.stateTax)}</span>
                  </div>
                )}

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${L.borderLight}` }}>
                  <span style={{ fontSize:12, color:L.textMuted }}>
                    {includeVAT && vatAvailable ? `VAT / Sales Tax (${fmtPct(result.salesTaxRate)})` : 'VAT / Sales Tax'}
                  </span>
                  <span style={{ fontSize:13, fontWeight:700, color: includeVAT && vatAvailable ? L.gold : L.textFaint, fontFamily:L.fontMono }}>
                    {includeVAT && vatAvailable ? fmt(result.vatTax) : 'Not included'}
                  </span>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0 0' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:L.text }}>Total Tax Liability</span>
                  <span style={{ fontSize:18, fontWeight:800, color:L.red, fontFamily:L.fontMono }}>{fmt(result.totalTax)}</span>
                </div>
              </div>

              <div style={{
                padding:'16px', borderRadius:L.radiusSm,
                background: result.netProfit >= 0 ? L.accentSoft : L.redSoft,
                border:`1px solid ${result.netProfit >= 0 ? L.accentBorder : L.redBorder}`,
                display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14,
              }}>
                <span style={{ fontSize:13, fontWeight:600, color: result.netProfit >= 0 ? L.accent : L.red, display:'flex', alignItems:'center', gap:6 }}>
                  {result.netProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  Net Profit After Tax
                </span>
                <span style={{ fontSize:20, fontWeight:800, color: result.netProfit >= 0 ? L.accent : L.red, fontFamily:L.fontMono }}>{fmt(result.netProfit)}</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { label:'Effective Rate', value:`${result.effectiveRate.toFixed(1)}%`, color:L.red,    icon:<Percent size={13} /> },
                  { label:'Tax Saved',      value:fmt(result.taxSaved),                  color:L.accent, icon:<PiggyBank size={13} /> },
                ].map(m => (
                  <div key={m.label} style={{ padding:'12px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, textAlign:'center' }}>
                    <div style={{ fontSize:9, fontWeight:700, color:L.textFaint, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{m.label}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:m.color, fontFamily:L.fontMono, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                      {m.icon}{m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Country Info */}
            <div style={{ ...card, padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <Info size={14} color={L.textMuted} />
                <div style={{ fontSize:13, fontWeight:700, color:L.text }}>{countryData?.name} Tax Info</div>
              </div>
              {[
                { label:'Federal Corporate Tax', value:fmtPct(useCustom ? (parseFloat(customRate)||0)/100 : (countryData?.corporateTax||0)), color:L.red },
                ...(result.stateRate > 0 && !useCustom ? [{ label:`${result.stateName} Tax`, value:fmtPct(result.stateRate), color:L.red }] : []),
                { label:'VAT / Sales Tax', value: vatAvailable ? fmtPct(result.salesTaxRate) : 'None', color:L.gold },
                { label:'Currency',  value:currencyCode, color:L.blue    },
                { label:'Tax Year',  value:'Jan — Dec',  color:L.textSub },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:`1px solid ${L.borderLight}` }}>
                  <span style={{ fontSize:12, color:L.textMuted }}>{row.label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:row.color }}>{row.value}</span>
                </div>
              ))}
              {countryData?.note && (
                <div style={{ marginTop:12, padding:'10px 12px', borderRadius:L.radiusSm, background:L.pageBg, border:`1px solid ${L.border}`, fontSize:11, color:L.textMuted, lineHeight:1.6, display:'flex', alignItems:'flex-start', gap:6 }}>
                  <Info size={12} color={L.textMuted} style={{ flexShrink:0, marginTop:1 }} />
                  {countryData.note}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div style={{ padding:'14px 16px', borderRadius:L.radiusSm, background:L.goldSoft, border:`1px solid ${L.goldBorder}`, display:'flex', gap:10, alignItems:'flex-start' }}>
              <AlertTriangle size={14} color={L.gold} style={{ flexShrink:0, marginTop:1 }} />
              <div style={{ fontSize:11, color:L.gold, lineHeight:1.6 }}>
                <strong>Disclaimer:</strong> These figures are estimates only. Tax laws are complex and change frequently. Always consult a qualified tax professional for accurate filing.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
