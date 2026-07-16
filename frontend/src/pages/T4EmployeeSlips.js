import React, { useState, useEffect } from "react";

// T4EmployeeSlips
// Employee copy of the CRA T4 slip (T4 25). One page per employee containing three
// stacked copies (Copy 2 to attach to federal return, Copy 3 to attach to provincial
// return, Copy 4 for employee's records), then a final page of bilingual employee
// instructions. Fetches real YTD data from GET /payroll/taxes/t4-preview?year=YYYY.
// Same connected grid and black-and-white CRA header flag as the employer slips.

const API_URL = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

const authHeaders = () => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: token ? "Bearer " + token : "",
  };
};

const mono = "'Courier New', monospace";

function money(v) {
  if (v == null || v === "") return { d: "", c: "" };
  const [d, c] = Number(v).toFixed(2).split(".");
  return { d, c };
}

const s = {
  page: { background: "#fff", width: 880, maxWidth: "100%", minHeight: 1120, margin: "12px auto 24px", padding: "22px 26px", boxShadow: "0 1px 6px rgba(16,30,40,.16)", fontSize: 9 },
  slip: { border: "1px solid #000", position: "relative", padding: "6px 8px 7px 20px" },
  copyBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "3px 4px 4px", fontSize: 9 },
  copyLabel: { fontWeight: "bold" },
  copyHint: { fontStyle: "italic" },
  vprot: { position: "absolute", left: 0, top: 0, bottom: 0, width: 16, borderRight: "1px solid #000", writingMode: "vertical-rl", transform: "rotate(180deg)", textAlign: "center", fontSize: 7.5, padding: "6px 2px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  topband: { display: "flex", gap: 0, alignItems: "stretch", marginBottom: 0 },
  empbox: { border: "1px solid #000", padding: "4px 8px", flex: "0 0 40%", minHeight: 56 },
  cap: { fontSize: 7, lineHeight: 1.15, marginBottom: 4 },
  empAddr: { fontFamily: mono, fontSize: 12, lineHeight: 1.7 },
  cracell: { flex: "0 0 24%", textAlign: "left", fontSize: 8, lineHeight: 1.2, padding: "2px 4px 3px", borderBottom: "1px solid #000", borderRight: "1px solid #000" },
  crarow1: { display: "flex", gap: 5, alignItems: "flex-start" },
  flag: { flex: "0 0 auto", display: "inline-flex", width: 32, height: 17, border: "0.5px solid #999", background: "linear-gradient(to right,#000 25%,#fff 25%,#fff 75%,#000 75%)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  flagLeaf: { fontSize: 14, lineHeight: 1, filter: "grayscale(1) brightness(0)" },
  craname: { display: "flex", gap: 9, fontSize: 8, lineHeight: 1.25 },
  cranameSpan: { width: 54, display: "inline-block" },
  crarow2: { display: "flex", gap: 8, alignItems: "center", marginTop: 5 },
  yrlbl: { fontSize: 7, lineHeight: 1.1 },
  yrbox: { border: "1px solid #000", display: "inline-block", padding: "2px 12px", fontSize: 13, fontFamily: mono },
  t4title: { flex: 1, textAlign: "right", padding: "2px 0 3px", borderBottom: "1px solid #000" },
  t4: { fontSize: 22, fontWeight: "bold" },
  st: { fontSize: 10, fontWeight: "bold" },
  bodyrow: { display: "flex", gap: 0, alignItems: "stretch" },
  leftcol: { flex: "0 0 40%", display: "flex", flexDirection: "column", gap: 0 },
  midcol: { flex: "0 0 15%", display: "flex", flexDirection: "column", gap: 0 },
  rightcol: { flex: 1, display: "flex", flexDirection: "column", gap: 0 },
  mbox: { display: "flex", flexDirection: "column" },
  mlabel: { textAlign: "center", fontSize: 6.5, lineHeight: 1.05, padding: "1px 2px 0", minHeight: 13, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  mfield: { border: "1px solid #000", borderTop: "none", display: "flex", alignItems: "stretch", minHeight: 18 },
  mnum: { borderRight: "1px solid #000", fontWeight: "bold", fontSize: 8, padding: "1px 3px", display: "flex", alignItems: "flex-start" },
  mval: { flex: 1, textAlign: "right", fontFamily: mono, fontSize: 11, padding: "1px 4px", display: "flex", alignItems: "center", justifyContent: "flex-end" },
  mcents: { borderLeft: "1px solid #000", width: 22, textAlign: "right", fontFamily: mono, fontSize: 11, padding: "1px 3px", display: "flex", alignItems: "center", justifyContent: "flex-end" },
  tval: { flex: 1, fontFamily: mono, fontSize: 11, padding: "1px 6px", display: "flex", alignItems: "center" },
  mrow: { display: "flex", gap: 0 },
  box54: { border: "1px solid #000", display: "flex", alignItems: "stretch", minHeight: 28 },
  box54n: { borderRight: "1px solid #000", fontWeight: "bold", fontSize: 8.5, padding: "2px 5px", display: "flex", alignItems: "flex-start" },
  box54b: { flex: 1, padding: "2px 7px" },
  box54l: { fontSize: 6.5 },
  box54v: { fontFamily: mono, fontSize: 12, letterSpacing: 1, marginTop: 2 },
  lrow: { display: "flex", gap: 0 },
  exf: { border: "1px solid #000", display: "flex", alignItems: "stretch", minHeight: 32 },
  exfn: { borderRight: "1px solid #000", fontWeight: "bold", fontSize: 8.5, padding: "2px 3px", display: "flex", alignItems: "flex-start" },
  excols: { flex: 1, display: "flex", justifyContent: "space-around", alignItems: "center", textAlign: "center", fontSize: 6, padding: "2px 0" },
  cbx: { border: "1px solid #000", width: 14, height: 11, margin: "2px auto" },
  empname: { border: "1px solid #000", padding: "4px 7px", flex: 1, minHeight: 74, position: "relative" },
  nhdr: { fontSize: 6.5, display: "flex", justifyContent: "space-between", margin: "3px 0" },
  nameline: { border: "1px solid #000", display: "flex", padding: "3px 6px", fontFamily: mono, fontSize: 12, position: "relative" },
  arw: { position: "absolute", left: -11, top: 4, fontSize: 11 },
  ln: { flex: 1 },
  fn: { flex: "0 0 34%" },
  inch: { flex: "0 0 8%", textAlign: "right" },
  addr: { fontFamily: mono, fontSize: 11, marginTop: 8, lineHeight: 1.7 },
  other: { border: "1px solid #000", marginTop: 6, padding: "5px 8px" },
  orow: { display: "flex", gap: 6, marginTop: 3 },
  ocell: { flex: 1, display: "flex", flexDirection: "column" },
  och: { display: "flex", fontSize: 6.5 },
  ochA: { flex: 1, textAlign: "center" },
  ocf: { display: "flex", marginTop: 1 },
  obc: { border: "1px solid #000", width: 34, height: 18 },
  oam: { border: "1px solid #000", borderLeft: "none", flex: 1, height: 18 },
  sfoot: { display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 8.5 },
  instrH: { fontSize: 12, fontWeight: "bold", margin: "0 0 6px" },
  instrH2: { fontSize: 10.5, fontWeight: "bold", margin: "10px 0 4px" },
  instrP: { margin: "0 0 5px", fontSize: 10, lineHeight: 1.4 },
  instrCols: { display: "flex", gap: 34 },
  instrCol: { flex: 1, fontSize: 10, lineHeight: 1.4 },
  instrFoot: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8, fontSize: 9.5, padding: "0 2px" },
  cn: { fontSize: 20, fontWeight: "bold", letterSpacing: -1 },
};

function Flag() {
  return <span style={s.flag}><span style={s.flagLeaf}>{"\uD83C\uDF41"}</span></span>;
}

function MoneyBox({ label, num, value, noLeft }) {
  const { d, c } = money(value);
  const field = noLeft ? { ...s.mfield, borderLeft: "none" } : s.mfield;
  return (
    <div style={{ ...s.mbox, flex: 1 }}>
      <div style={s.mlabel}>{label}</div>
      <div style={field}>
        <span style={s.mnum}>{num}</span>
        <span style={s.mval}>{d}</span>
        <span style={s.mcents}>{c}</span>
      </div>
    </div>
  );
}

function TextBox({ label, num, value, flex }) {
  return (
    <div style={{ ...s.mbox, flex: flex || 1 }}>
      <div style={s.mlabel}>{label}</div>
      <div style={s.mfield}>
        <span style={s.mnum}>{num}</span>
        <span style={s.tval}>{value || ""}</span>
      </div>
    </div>
  );
}

function CutLine() {
  return <div className="t4-cutline" />;
}

function OtherRow() {
  const cell = (
    <div style={s.ocell}>
      <div style={s.och}><span style={{ width: 34 }}>Box &ndash; Case</span><span style={s.ochA}>Amount &ndash; Montant</span></div>
      <div style={s.ocf}><span style={s.obc} /><span style={s.oam} /></div>
    </div>
  );
  return <div style={s.orow}>{cell}{cell}{cell}</div>;
}

const COPIES = [
  { num: 2, hint: "Attach to your federal tax return / Joignez à votre déclaration de revenus fédérale" },
  { num: 3, hint: "Attach to your provincial tax return / Joignez à votre déclaration provinciale" },
  { num: 4, hint: "Keep for your records / À conserver pour vos dossiers" },
];

function Slip({ employer, employee, year, copyNum, copyHint }) {
  const e = employee;
  return (
    <div style={s.slip}>
      <div style={s.copyBar}>
        <span style={s.copyLabel}>Copy {copyNum} &ndash; Copie {copyNum}</span>
        <span style={s.copyHint}>{copyHint}</span>
      </div>
      <div style={s.vprot}>
        <span>Protected B when completed / Protégé B une fois rempli</span>
        <span style={{ fontWeight: "normal" }}>T4 (25)</span>
      </div>

      <div style={s.topband}>
        <div style={s.empbox}>
          <div style={s.cap}>Employer's name &ndash; Nom de l'employeur</div>
          <div style={s.empAddr}>
            {employer.name}<br />{employer.addr1}<br />
            {employer.addr2}&nbsp;&nbsp;&nbsp;&nbsp; {employer.prov} &nbsp; {employer.postal}
          </div>
        </div>

        <div style={s.cracell}>
          <div style={s.crarow1}>
            <Flag />
            <div style={s.craname}>
              <span style={s.cranameSpan}>Canada Revenue Agency</span>
              <span style={s.cranameSpan}>Agence du revenu du Canada</span>
            </div>
          </div>
          <div style={s.crarow2}>
            <span style={s.yrlbl}>Year<br />Année</span>
            <span style={s.yrbox}>{year}</span>
          </div>
        </div>

        <div style={s.t4title}>
          <div style={s.t4}>T4</div>
          <div style={s.st}>Statement of Remuneration Paid</div>
          <div style={{ fontSize: 10 }}>État de la rémunération payée</div>
        </div>
      </div>

      <div style={s.bodyrow}>
        <div style={s.leftcol}>
          <div style={s.box54}>
            <span style={s.box54n}>54</span>
            <div style={s.box54b}>
              <div style={s.box54l}>Employer's account number &ndash; Numéro de compte de l'employeur</div>
              <div style={s.box54v}>{employer.account}</div>
            </div>
          </div>

          <div style={s.lrow}>
            <TextBox flex={1.5} num="12" value={e.sin} label={<>Social insurance number<br />Numéro d'assurance sociale</>} />
            <div style={{ ...s.mbox, flex: 1 }}>
              <div style={s.mlabel}><b>Exempt &ndash; Exemption</b></div>
              <div style={s.exf}>
                <span style={s.exfn}>28</span>
                <div style={s.excols}>
                  <div>CPP/QPP<div style={s.cbx} />RPC/RRQ</div>
                  <div>EI<div style={s.cbx} />AE</div>
                  <div>PPIP<div style={s.cbx} />RPAP</div>
                </div>
              </div>
            </div>
          </div>

          <div style={s.empname}>
            <div style={s.cap}>Employee's name and address &ndash; Nom et adresse de l'employé</div>
            <div style={s.nhdr}>
              <span>Last name (in capital letters) &ndash; Nom de famille (en lettres moulées)</span>
              <span>First name &ndash; Prénom</span>
              <span>Initial &ndash; Initiale</span>
            </div>
            <div style={s.nameline}>
              <span style={s.arw}>&#9654;</span>
              <span style={s.ln}>{e.last}</span>
              <span style={s.fn}>{e.first}</span>
              <span style={s.inch}>{e.init}</span>
            </div>
            <div style={s.addr}>
              {e.addr1}<br />{e.addr2}&nbsp;&nbsp;&nbsp; {e.province} &nbsp; {e.postal}
            </div>
          </div>
        </div>

        <div style={s.midcol}>
          <TextBox num="45" value={e.b45 || ""} label={<>Employer-offered dental benefits<br />Prestations dentaires offertes par l'employeur</>} />
          <TextBox num="10" value={e.province} label={<>Province of employment<br />Province d'emploi</>} />
          <TextBox num="29" value="" label={<>Employment code<br />Code d'emploi</>} />
        </div>

        <div style={s.rightcol}>
          <div style={s.mrow}>
            <MoneyBox num="14" value={e.b14} label={<>Employment income &ndash; Revenus d'emploi</>} />
            <MoneyBox num="22" value={e.b22} noLeft label={<>Income tax deducted &ndash; Impôt sur le revenu retenu</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="16" value={e.b16} label={<>Employee's CPP contributions &ndash; see over<br />Cotisations de l'employé au RPC &ndash; voir au verso</>} />
            <MoneyBox num="17" value={e.b17} noLeft label={<>Employee's QPP contributions &ndash; see over<br />Cotisations de l'employé au RRQ &ndash; voir au verso</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="16A" value={e.b16A} label={<>Employee's second CPP contributions &ndash; see over<br />Deuxièmes cotisations de l'employé au RPC</>} />
            <MoneyBox num="17A" value={e.b17A} noLeft label={<>Employee's second QPP contributions &ndash; see over<br />Deuxièmes cotisations de l'employé au RRQ</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="24" value={e.b24} label={<>EI insurable earnings &ndash; Gains assurables d'AE</>} />
            <MoneyBox num="26" value={e.b26} noLeft label={<>CPP/QPP pensionable earnings<br />Gains ouvrant droit à pension &ndash; RPC/RRQ</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="18" value={e.b18} label={<>Employee's EI premiums &ndash; Cotisations de l'employé à l'AE</>} />
            <MoneyBox num="44" value={e.b44} noLeft label={<>Union dues &ndash; Cotisations syndicales</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="20" value={e.b20} label={<>RPP contributions &ndash; Cotisations à un RPA</>} />
            <MoneyBox num="46" value={e.b46} noLeft label={<>Charitable donations &ndash; Dons de bienfaisance</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="52" value={e.b52} label={<>Pension adjustment &ndash; Facteur d'équivalence</>} />
            <MoneyBox num="50" value={e.b50} noLeft label={<>RPP or DPSP registration number<br />N° d'agrément d'un RPA ou d'un RPDB</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="55" value={e.b55} label={<>Employee's PPIP premiums &ndash; see over<br />Cotisations de l'employé au RPAP &ndash; voir au verso</>} />
            <MoneyBox num="56" value={e.b56} noLeft label={<>PPIP insurable earnings &ndash; Gains assurables du RPAP</>} />
          </div>
        </div>
      </div>

      <div style={s.other}>
        <div style={{ fontSize: 7 }}>Other information (see over) &ndash; Autres renseignements (voir au verso)</div>
        <OtherRow />
        <OtherRow />
      </div>

      <div style={s.sfoot}>
        <span><b>T4 (25)</b></span>
        <span style={{ fontFamily: mono }}>REV &nbsp; OSP</span>
      </div>
    </div>
  );
}

function InstructionsPage() {
  const boxes = [
    ["14", "Employment income – Enter on line 10100 of your tax return. Revenus d'emploi – Inscrivez à la ligne 10100 de votre déclaration."],
    ["16", "Employee's CPP contributions – Enter on line 30800 and line 22215. Cotisations de l'employé au RPC."],
    ["16A", "Employee's second CPP contributions (CPP2). Deuxièmes cotisations de l'employé au RPC (RPC2)."],
    ["17", "Employee's QPP contributions. Cotisations de l'employé au RRQ."],
    ["17A", "Employee's second QPP contributions (QPP2). Deuxièmes cotisations de l'employé au RRQ (RRQ2)."],
    ["18", "Employee's EI premiums – Enter on line 31200. Cotisations de l'employé à l'AE."],
    ["20", "RPP contributions – Enter on line 20700. Cotisations à un RPA."],
    ["22", "Income tax deducted – Enter on line 43700 of your tax return. Impôt sur le revenu retenu – ligne 43700."],
    ["44", "Union dues – Enter on line 21200. Cotisations syndicales – ligne 21200."],
    ["45", "Employer-offered dental benefits. Prestations dentaires offertes par l'employeur."],
    ["46", "Charitable donations – Enter on line 34900. Dons de bienfaisance – ligne 34900."],
    ["52", "Pension adjustment – Enter on line 20600. Facteur d'équivalence – ligne 20600."],
    ["55", "Provincial parental insurance plan (PPIP) premiums. Cotisations au régime provincial d'assurance parentale (RPAP)."],
    ["66", "Eligible retiring allowances – Enter on line 13000. Allocations de retraite admissibles."],
    ["67", "Non-eligible retiring allowances – Enter on line 13000."],
    ["77", "Workers' compensation benefits repaid to the employer – line 22900."],
    ["85", "Employee-paid premiums for private health services plans – line 33099."],
    ["87", "Emergency services volunteer exempt amount – line 10100."],
  ];

  return (
    <div style={s.page}>
      <div style={s.instrCols}>
        <div style={s.instrCol}>
          <div style={s.instrH}>Instructions for the employee</div>
          <p style={s.instrP}>
            This is your T4 slip. Use the amounts shown to fill out your income tax and benefit return.
            If any information is missing or incorrect, contact your employer to get a corrected slip.
          </p>
          <div style={s.instrH2}>What each box means</div>
          {boxes.map(([n, t]) => (
            <div key={n} style={{ marginBottom: 4 }}><b>{n}</b> {t}</div>
          ))}
          <div style={s.instrH2}>Filing your return</div>
          <p style={s.instrP}>
            Report all T4 slips you received in the year on your tax return. Keep your Copy 4 for your
            records. For more information, go to <b>canada.ca/taxes</b> or call <b>1-800-959-8281</b>.
          </p>
        </div>

        <div style={s.instrCol}>
          <div style={s.instrH}>Directives pour l'employé</div>
          <p style={s.instrP}>
            Ceci est votre feuillet T4. Utilisez les montants indiqués pour remplir votre déclaration de
            revenus. Si des renseignements manquent ou sont incorrects, communiquez avec votre employeur
            pour obtenir un feuillet corrigé.
          </p>
          <div style={s.instrH2}>Signification des cases</div>
          <p style={s.instrP}>
            Chaque case du feuillet T4 correspond à une ligne de votre déclaration. Pour connaître les
            détails de chaque case, consultez la liste ci-contre en anglais ainsi que les directives à
            l'endos de votre déclaration.
          </p>
          <div style={s.instrH2}>Produire votre déclaration</div>
          <p style={s.instrP}>
            Déclarez tous les feuillets T4 reçus durant l'année dans votre déclaration de revenus.
            Conservez votre Copie 4 pour vos dossiers. Pour en savoir plus, allez à
            <b> canada.ca/impots</b> ou composez le <b>1-800-959-7383</b>.
          </p>
          <div style={{ fontSize: 9, lineHeight: 1.35, marginTop: 12 }}>
            Les renseignements personnels (y compris le NAS) sont recueillis et utilisés aux fins
            d'appliquer ou d'exécuter la Loi de l'impôt sur le revenu. Consultez le fichier ARC PPU 005
            sur Info Source à <b>canada.ca/arc-info-source</b>.
          </div>
        </div>
      </div>
      <div style={s.instrFoot}>
        <div><b>T4 (25)</b></div>
        <div style={{ fontFamily: mono, fontSize: 12 }}>REV &nbsp;&nbsp; OSP</div>
        <div style={s.cn}>Canada</div>
      </div>
    </div>
  );
}

function T4EmployeeSlips() {
  const currentYear = new Date().getFullYear();
  const [year] = useState(currentYear);
  const [employer, setEmployer] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${API_URL}/api/v1/payroll/taxes/t4-preview?year=${year}`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setEmployer(data.employer || null);
        setEmployees(data.employees || []);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError("Could not load T4 data: " + e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [year]);

  const hasData = !loading && !error && employer && employees.length > 0;

  return (
    <div style={{ background: "#EDEFF2", fontFamily: "Arial, Helvetica, sans-serif", color: "#000" }}>
      <style>{`
        @media print {
          @page { size: letter; margin: 0; }
          .t4-noprint { display: none !important; }
          .t4-page { box-shadow: none; margin: 0; width: 100%; max-width: none; min-height: 100vh; padding: 0.35in; page-break-after: always; }
          .t4-page:last-child { page-break-after: auto; }
        }
        .t4-cutline { border-top: 1px dashed #666; margin: 14px 0; position: relative; }
        .t4-cutline:after { content: "\\2702"; position: absolute; left: 6px; top: -10px; font-size: 14px; background: #fff; padding: 0 5px; color: #555; }
      `}</style>

      <div className="t4-noprint" style={{ background: "#fff", borderBottom: "1px solid #E3E7EC", padding: "12px 20px", display: "flex", gap: 10, alignItems: "center", position: "sticky", top: 0, zIndex: 5 }}>
        <button
          onClick={() => window.print()}
          disabled={!hasData}
          style={{
            font: "inherit", fontWeight: 600, fontSize: 14,
            border: "none", borderRadius: 10, padding: "9px 18px",
            cursor: hasData ? "pointer" : "not-allowed",
            background: hasData ? "#15A08C" : "#9ec8be",
            color: "#fff",
          }}
        >
          Print
        </button>
        <span style={{ color: "#5F6B7A", fontSize: 13, marginLeft: "auto" }}>
          {loading ? "Loading T4 data..." :
           error ? "Error loading T4 data" :
           !hasData ? `No employee data for ${year}` :
           `Employee copies · ${employees.length} employee${employees.length === 1 ? "" : "s"} · give to each employee for their tax return`}
        </span>
      </div>

      {loading && (
        <div className="t4-page" style={{ ...s.page, textAlign: "center", padding: 60, fontSize: 14 }}>
          Loading T4 data for {year}...
        </div>
      )}

      {error && !loading && (
        <div className="t4-page" style={{ ...s.page, padding: 40 }}>
          <div style={{
            background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8,
            padding: "12px 16px", color: "#991B1B", fontSize: 14, fontWeight: 600,
          }}>
            {error}
          </div>
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="t4-page" style={{ ...s.page, textAlign: "center", padding: 60, fontSize: 14 }}>
          No paycheques have been issued for {year} yet. Complete a payroll run before previewing T4 slips.
        </div>
      )}

      {hasData && employees.map((emp) => (
        <div key={emp.id} className="t4-page" style={s.page}>
          {COPIES.map((c, idx) => (
            <React.Fragment key={c.num}>
              <Slip employer={employer} employee={emp} year={year} copyNum={c.num} copyHint={c.hint} />
              {idx < COPIES.length - 1 && <CutLine />}
            </React.Fragment>
          ))}
        </div>
      ))}

      {hasData && <InstructionsPage />}
    </div>
  );
}

export default T4EmployeeSlips;