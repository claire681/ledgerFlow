import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Phone, Globe } from "lucide-react";

const TEAL = "#0F9599";
const TEAL_DARK = "#0B7377";
const INK = "#0E1A1A";
const SUB = "#5B6B6B";
const BORDER = "#DDE5E5";
// Landing-page dark teal — NOT pure black. TODO: swap for the exact landing-page footer token.
const FOOTER_DARK = "#0B3D3D";
const BG_PROMO = "#F1F5F5";
const CONTENT_MAX = 1200;

// Real flag SVGs from flagcdn.com — emoji flags don't render on Windows.
const NAV_LOCALES = [
  { code: "en-AU", flagSrc: "https://flagcdn.com/au.svg", label: "Australia" },
  { code: "en-CA", flagSrc: "https://flagcdn.com/ca.svg", label: "Canada (English)" },
  { code: "fr-CA", flagSrc: "https://flagcdn.com/ca.svg", label: "Canada (French)" },
  { code: "en-US", flagSrc: "https://flagcdn.com/us.svg", label: "United States" },
  { code: "en-GB", flagSrc: "https://flagcdn.com/gb.svg", label: "United Kingdom" },
  { code: "en-SG", flagSrc: "https://flagcdn.com/sg.svg", label: "Singapore" },
  { code: "en-ZA", flagSrc: "https://flagcdn.com/za.svg", label: "South Africa" },
  { code: "en-IE", flagSrc: "https://flagcdn.com/ie.svg", label: "Ireland" },
  { code: "global-en", flagSrc: null, label: "Global (English)" },
  { code: "global-es", flagSrc: null, label: "Global (Spanish)" },
];

const FOOTER_LOCALES = [
  { code: "en-AU", flagSrc: "https://flagcdn.com/au.svg", label: "Australia" },
  { code: "pt-BR", flagSrc: "https://flagcdn.com/br.svg", label: "Brasil" },
  { code: "en-CA", flagSrc: "https://flagcdn.com/ca.svg", label: "Canada (English)" },
  { code: "fr-CA", flagSrc: "https://flagcdn.com/ca.svg", label: "Canada (French)" },
  { code: "fr-FR", flagSrc: "https://flagcdn.com/fr.svg", label: "France" },
  { code: "en-IN", flagSrc: "https://flagcdn.com/in.svg", label: "India" },
  { code: "en-GB", flagSrc: "https://flagcdn.com/gb.svg", label: "United Kingdom" },
  { code: "en-ZA", flagSrc: "https://flagcdn.com/za.svg", label: "South Africa" },
  { code: "en-SG", flagSrc: "https://flagcdn.com/sg.svg", label: "Singapore" },
  { code: "other", flagSrc: null, label: "Other Countries" },
];

const RELATED_LINKS = [
  "Get started with Novala Payroll",
  "Set up time tracking",
  "Set up pay schedules",
  "Set up voluntary deductions",
];

const linkStyle = { color: TEAL, textDecoration: "none", fontWeight: 600 };
const ulStyle = { margin: "8px 0", paddingLeft: 22, lineHeight: 1.8 };
const olStyle = { margin: "8px 0", paddingLeft: 22, lineHeight: 1.8 };

function LocaleIcon({ locale, large }) {
  if (locale.flagSrc) {
    const dims = large ? { width: 28, height: 20 } : { width: 24, height: 16 };
    return (
      <img src={locale.flagSrc} alt={locale.label} style={{
        ...dims, objectFit: "cover", borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.1)",
        display: "block", flexShrink: 0,
      }} />
    );
  }
  // Globe icon for "Global (English/Spanish)" and "Other Countries"
  const size = large ? 22 : 18;
  return <Globe size={size} strokeWidth={1.8} style={{ flexShrink: 0, color: SUB }} />;
}

function NavMenu({ label }) {
  return (
    <button style={{
      background: "none", border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 4,
      color: INK, fontWeight: 500, fontSize: 14,
      fontFamily: "inherit", padding: "6px 8px",
    }}>
      {label}
      <ChevronDown size={14} strokeWidth={2} />
    </button>
  );
}

function LocaleRow({ locale, isSelected, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12,
      width: "100%", padding: "10px 14px", minHeight: 42,
      background: isSelected ? "#F1F5F5" : "#fff",
      border: "none", cursor: "pointer",
      fontSize: 14, color: INK, fontFamily: "inherit", textAlign: "left",
    }}
    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#F9FAFA"; }}
    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#fff"; }}
    >
      <LocaleIcon locale={locale} large />
      <span>{locale.label}</span>
    </button>
  );
}

function Section({ id, title, children }) {
  return (
    <div id={id} style={{marginBottom: 36}}>
      <h2 style={{margin: "0 0 14px 0", fontSize: 22, fontWeight: 700, color: INK, letterSpacing: "-0.005em"}}>
        {title}
      </h2>
      <div style={{fontSize: 15, lineHeight: 1.65, color: INK}}>{children}</div>
    </div>
  );
}

function FooterCol({ title, items }) {
  return (
    <div>
      <h4 style={{margin: "0 0 14px 0", fontSize: 14, fontWeight: 700, color: "#fff"}}>{title}</h4>
      <ul style={{margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10}}>
        {items.map((it, i) => (
          <li key={i}>
            <a href="#" style={{color: "rgba(255,255,255,0.78)", textDecoration: "none", fontSize: 14}}>{it}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HelpAutoPayroll() {
  const [locale, setLocale] = useState("en-CA");
  const [showNavLocale, setShowNavLocale] = useState(false);
  const [showFooterLocale, setShowFooterLocale] = useState(false);
  const [search, setSearch] = useState("");
  const navLocaleRef = useRef(null);
  const footerLocaleRef = useRef(null);

  const currentNavLocale = NAV_LOCALES.find(l => l.code === locale) || NAV_LOCALES[1];
  const currentFooterLocale = FOOTER_LOCALES.find(l => l.code === locale) || FOOTER_LOCALES[2];

  useEffect(() => {
    const handler = (e) => {
      if (navLocaleRef.current && !navLocaleRef.current.contains(e.target)) setShowNavLocale(false);
      if (footerLocaleRef.current && !footerLocaleRef.current.contains(e.target)) setShowFooterLocale(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectLocale = (code) => {
    setLocale(code);
    setShowNavLocale(false);
    setShowFooterLocale(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#fff",
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      color: INK,
    }}>
      {/* Top utility row */}
      <div style={{borderBottom: `1px solid ${BORDER}`, padding: "12px 32px"}}>
        <div style={{
          maxWidth: CONTENT_MAX, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14,
        }}>
          <a href="/" style={{textDecoration: "none", display: "inline-flex", alignItems: "center"}}>
            <span style={{color: "#0F9599", fontWeight: 800, fontSize: 24, letterSpacing: "-0.015em", fontFamily: "inherit"}}>Novala</span>
          </a>
          <div style={{display: "flex", alignItems: "center", gap: 24}}>
            <a href="/pricing" style={{color: INK, textDecoration: "none", fontWeight: 500}}>Plans & Pricing</a>
            <a href="/support" style={{color: INK, textDecoration: "none", fontWeight: 500}}>Support</a>
            <span style={{color: SUB, display: "flex", alignItems: "center", gap: 6}}>
              <Phone size={14} strokeWidth={2} />
              <span>1-800-NOVALA</span>
            </span>
            <a href="/login" style={{
              padding: "8px 18px", borderRadius: 8,
              background: "#fff", color: TEAL, border: `1.5px solid ${TEAL}`,
              fontWeight: 600, fontSize: 14, textDecoration: "none",
            }}>Sign In</a>
          </div>
        </div>
      </div>

      {/* Support nav row */}
      <div style={{borderBottom: `1px solid ${BORDER}`, padding: "16px 32px", position: "sticky", top: 0, zIndex: 40, background: "#fff"}}>
        <div style={{
          maxWidth: CONTENT_MAX, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{display: "flex", alignItems: "center", gap: 24}}>
            <h2 style={{margin: 0, fontSize: 18, fontWeight: 700}}>Novala Support</h2>
            <NavMenu label="Get Started" />
            <NavMenu label="Topics" />
            <NavMenu label="Training" />
            <NavMenu label="Community" />
            <NavMenu label="Resources" />
          </div>

          <div ref={navLocaleRef} style={{position: "relative"}}>
            <button onClick={() => setShowNavLocale(s => !s)} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "transparent", border: "none",
              padding: "4px 6px", borderRadius: 4, cursor: "pointer",
              fontFamily: "inherit", color: INK,
            }}>
              <LocaleIcon locale={currentNavLocale} />
              <ChevronDown size={14} strokeWidth={2} />
            </button>
            {showNavLocale && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0,
                background: "#fff", border: `1px solid ${BORDER}`,
                borderRadius: 10, minWidth: 240,
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.18)",
                zIndex: 50, overflow: "hidden",
              }}>
                {NAV_LOCALES.map(l => (
                  <LocaleRow key={l.code} locale={l} isSelected={l.code === locale} onClick={() => selectLocale(l.code)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Promo strip — message left, button right */}
      <div style={{background: BG_PROMO, padding: "20px 32px"}}>
        <div style={{
          maxWidth: CONTENT_MAX, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 24, fontSize: 15,
        }}>
          <span style={{color: INK}}>Explore our Novala training videos and learn at your own pace</span>
          <button style={{
            padding: "10px 22px", borderRadius: 8,
            background: TEAL, color: "#fff", border: "none",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
            fontFamily: "inherit", flexShrink: 0,
            boxShadow: "0 6px 14px -6px rgba(15,149,153,0.6)",
          }}>Master Novala today</button>
        </div>
      </div>

      {/* Search band — NO heading, LEFT-aligned search box (~half width) per QB reference */}
      <div style={{
        background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
        padding: "56px 32px",
      }}>
        <div style={{maxWidth: CONTENT_MAX, margin: "0 auto"}}>
          <div style={{
            display: "flex", width: "100%", maxWidth: 560,
            background: "#fff", borderRadius: 12, overflow: "hidden",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)",
          }}>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions, keywords or topics"
              style={{
                flex: 1, padding: "14px 18px", border: "none", outline: "none",
                fontSize: 15, fontFamily: "inherit", color: INK,
              }}
            />
            <button style={{
              padding: "0 24px", background: TEAL, color: "#fff",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Search size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Article body + sidebar */}
      <div style={{
        maxWidth: CONTENT_MAX, margin: "0 auto",
        padding: "48px 32px 80px",
        display: "grid", gridTemplateColumns: "1fr 280px", gap: 60,
      }}>
        <article>
          <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 18}}>
            <div style={{
              width: 32, height: 32, borderRadius: 999,
              background: TEAL, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13,
            }}>N</div>
            <span style={{color: SUB, fontSize: 13, fontWeight: 600}}>Novala Help</span>
          </div>

          <h1 style={{margin: "0 0 12px 0", fontSize: 32, fontWeight: 700, letterSpacing: "-0.01em"}}>
            Set up and manage your Auto Payroll
          </h1>
          <div style={{color: SUB, fontSize: 14, marginBottom: 28}}>
            by Novala · 👍 0 · Updated a few days ago
          </div>

          <p style={{fontSize: 16, lineHeight: 1.65, color: INK, marginBottom: 18}}>
            Novala Payroll saves time by automatically creating pay (cheques or direct deposits) for
            salaried and hourly employees who work a set number of hours. Auto Payroll works for
            employees paid by direct deposit or paper cheque.
          </p>

          <p style={{fontSize: 15, color: INK, marginBottom: 8, fontWeight: 600}}>We'll show you how to:</p>
          <ul style={{margin: "0 0 32px 0", paddingLeft: 22, lineHeight: 1.9}}>
            <li><a href="#need" style={linkStyle}>What you'll need</a></li>
            <li><a href="#one-time" style={linkStyle}>Make a one-time change to an upcoming auto paycheque</a></li>
            <li><a href="#manual" style={linkStyle}>Pay an employee manually for one pay period</a></li>
          </ul>

          <Section id="need" title="What you'll need">
            <p>Before setting up Auto Payroll, finish initial payroll setup and run your first payroll.</p>
            <p>Employees must be eligible:</p>
            <ul style={ulStyle}>
              <li>Have an <strong>active</strong> status.</li>
              <li>Be paid a <strong>fixed salary</strong> OR be <strong>hourly with default hours set</strong>.</li>
              <li>Be <strong>assigned to a pay schedule</strong>.</li>
              <li>Have <strong>complete TD1 tax info</strong> in their profile.</li>
            </ul>
            <p>Auto Payroll is <strong>not</strong> available for commission-only, inactive, or hourly employees with varying hours each pay period.</p>
          </Section>

          <Section title="Set default hours for hourly employees">
            <p>For hourly employees who work the same hours each day, set default hours to make them eligible:</p>
            <ol style={olStyle}>
              <li>Go to Payroll → <strong>Employees</strong>.</li>
              <li>Select the employee.</li>
              <li>From <strong>Base pay</strong>, select <strong>Start</strong> or <strong>Edit</strong>.</li>
              <li>Enter <strong>Hours per day</strong> and <strong>Days per week</strong>.</li>
              <li>Select <strong>Save</strong>.</li>
            </ol>
          </Section>

          <Section title="Add or remove eligible employees from Auto Payroll">
            <p style={{fontStyle: "italic", color: SUB}}>(Must be the Primary Admin to manage Auto Payroll settings.)</p>
            <ol style={olStyle}>
              <li>Go to <strong>Settings</strong> → <strong>Payroll settings</strong>.</li>
              <li>In the <strong>Auto Payroll</strong> section, select the <strong>edit (pencil)</strong> icon.</li>
              <li>Select <strong>Select employees for Auto Payroll</strong> and choose the employees to enroll.</li>
              <li>Select <strong>Save changes</strong>.</li>
              <li>Review the confirmation (total employees + key Auto Payroll dates).</li>
              <li>Select <strong>Done</strong>.</li>
            </ol>
            <p style={{background: "#F1F5F5", padding: "12px 16px", borderRadius: 8, fontSize: 14, marginTop: 14}}>
              Once enrolled, you'll get an email with the upcoming payday details <strong>2 business days before</strong> Auto Payroll processes, and a second email <strong>after</strong> it processes.
            </p>
          </Section>

          <Section id="one-time" title="Make a one-time change to an upcoming auto paycheque">
            <p>Changes must be made <strong>3 business days before the cheque date, by 8 PM ET</strong>.</p>
            <ol style={olStyle}>
              <li>Go to Payroll → <strong>Employees</strong>.</li>
              <li>Select <strong>Run payroll</strong> (if multiple pay schedules, pick one and <strong>Continue</strong>).</li>
              <li>Select <strong>Make updates to upcoming pay period</strong>.</li>
              <li>In the <strong>Actions</strong> column, select the <strong>more (⋮)</strong> icon → <strong>Edit paycheque</strong>.</li>
              <li>Edit the payroll items, then <strong>Save</strong>.</li>
              <li>Select <strong>Save & preview Auto Payroll</strong>, then <strong>Save Auto Payroll</strong>.</li>
            </ol>
          </Section>

          <Section id="manual" title="Pay an employee manually for one pay period">
            <p>Pauses Auto Payroll for a single period; it resumes next scheduled run.</p>
            <ol style={olStyle}>
              <li>Go to Payroll → <strong>Employees</strong>.</li>
              <li>Select <strong>Run payroll</strong> (if multiple pay schedules, pick one and <strong>Continue</strong>).</li>
              <li>Select <strong>Pay manually this period</strong> on the employees to pay manually.</li>
              <li>Enter <strong>Pay date</strong> and edit any pay items.</li>
              <li>Select <strong>Preview payroll</strong>, then pick an account from the <strong>Chart of account ▾</strong> dropdown.</li>
              <li>Select <strong>Submit payroll</strong>.</li>
            </ol>
          </Section>

          <Section title="Results">
            <p>Once Auto Payroll is set up, you'll get an email two business days before payday with the upcoming pay-run details, and a confirmation email after it processes.</p>
          </Section>

          <Section title="Related links">
            <ul style={{...ulStyle, lineHeight: 2}}>
              <li><a href="#" style={linkStyle}>Get started with Novala Payroll</a></li>
              <li><a href="#" style={linkStyle}>Add a new employee to Novala Payroll</a></li>
              <li><a href="#" style={linkStyle}>Set up and manage payroll schedules</a></li>
            </ul>
          </Section>
        </article>

        <aside>
          <h3 style={{margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: INK}}>More like this</h3>
          <div style={{display: "flex", flexDirection: "column", gap: 18}}>
            {RELATED_LINKS.map((link, i) => (
              <div key={i}>
                <a href="#" style={{...linkStyle, fontSize: 14, display: "block", marginBottom: 4}}>{link}</a>
                <div style={{fontSize: 12, color: SUB}}>by Novala</div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Footer — landing-page dark teal */}
      <footer style={{background: FOOTER_DARK, color: "#fff", padding: "48px 32px 32px"}}>
        <div style={{maxWidth: CONTENT_MAX, margin: "0 auto"}}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 40, marginBottom: 32,
          }}>
            <FooterCol title="Product" items={["Features", "Pricing", "Security", "Integrations"]} />
            <FooterCol title="Company" items={["About", "Blog", "Careers", "Contact"]} />
            <FooterCol title="Resources" items={["Help Center", "Community", "Training", "Status"]} />
            <FooterCol title="Legal" items={["Privacy", "Terms", "Cookies"]} />
          </div>

          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 24,
            display: "flex", justifyContent: "space-between", flexWrap: "wrap",
            gap: 16, fontSize: 13, color: "rgba(255,255,255,0.78)",
          }}>
            <div>© 2026 Novala · BrightCare Home Healthcare Services Inc.</div>

            <div ref={footerLocaleRef} style={{position: "relative"}}>
              <button onClick={() => setShowFooterLocale(s => !s)} style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "transparent", color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "6px 12px", borderRadius: 6,
                cursor: "pointer", fontFamily: "inherit", fontSize: 13,
              }}>
                <LocaleIcon locale={currentFooterLocale} />
                <span>Select a Country</span>
                <ChevronDown size={14} strokeWidth={2} />
              </button>
              {showFooterLocale && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 6px)", right: 0,
                  background: "#fff", border: `1px solid ${BORDER}`,
                  borderRadius: 10, minWidth: 240,
                  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.25)",
                  zIndex: 50, overflow: "hidden",
                }}>
                  {FOOTER_LOCALES.map(l => (
                    <LocaleRow key={l.code} locale={l} isSelected={l.code === locale} onClick={() => selectLocale(l.code)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
