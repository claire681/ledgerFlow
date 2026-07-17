import React from "react";

// T4EmployeeSlips
// Employee copies of the CRA T4 slip (T4 25). The document alternates: a slip page with two
// different employees, then the full bilingual "Report these amounts on your tax return"
// reverse page, repeating after every slip page. Black-and-white CRA header flag with a
// darker divider under the header band. Inline styles only, except one scoped <style> block
// for print rules and the dashed cut-line markers. No new dependencies.
//
// Data shape:
// employer = { name, addr1, addr2, prov, postal, account }
// employees = [{ last, first, init, sin, addr1, addr2, province, postal,
//   b14, b16, b16A, b17, b17A, b18, b20, b22, b24, b26, b44, b46, b50, b52, b55, b56 }]
// Money fields are numbers or null. null renders blank.

const SAMPLE_EMPLOYER = {
  name: "BrightCare Home Healthcare Services Inc.",
  addr1: "8460-106A Avenue NW",
  addr2: "Edmonton",
  prov: "AB",
  postal: "T5H 0S3",
  account: "746043769RP0001",
};

const SAMPLE_EMPLOYEES = [
  { last: "Dela Raiz", first: "Shirley", init: "", sin: "589-404-425", addr1: "9310 211 St NW", addr2: "Edmonton", province: "AB", postal: "T5T 4N8", b14: 736, b16: 31.48, b18: 11.99, b24: 736, b26: 736 },
  { last: "McIsaac", first: "Cheryl", init: "D", sin: "636-342-396", addr1: "49313-RR173", addr2: "Ryley", province: "AB", postal: "T0B 4A0", b14: 3650, b16: 121.75, b18: 59.5, b24: 3650, b26: 3650 },
  { last: "Peterson", first: "Michelle", init: "", sin: "643-230-733", addr1: "50070 Range Road 200", addr2: "Camrose County", province: "AB", postal: "T0B 2M1", b14: 288, b18: 4.7, b24: 288, b26: 288 },
  { last: "Bisson", first: "Tiffany", init: "", sin: "654-279-652", addr1: "265-50418 Range Road 202", addr2: "Beaver County", province: "AB", postal: "T0B 4J2", b14: 360, b16: 12.74, b18: 5.87, b24: 360, b26: 360 },
  { last: "Cavanagh", first: "Jennifer", init: "N", sin: "663-367-746", addr1: "5203 50ave Holden, Alberta", addr2: "Tofield", province: "AB", postal: "T0B 2C0", b14: 576, b16: 1.32, b18: 9.39, b24: 576, b26: 576 },
  { last: "Cardinal", first: "Marilyn", init: "D", sin: "724-430-228", addr1: "Ryley", addr2: "Ryley", province: "AB", postal: "T0B 4A0", b14: 72, b18: 1.17, b24: 72, b26: 72 },
  { last: "ST. PIERRE", first: "Jennifer", init: "", sin: "736-945-262", addr1: "Ryley", addr2: "Ryley", province: "AB", postal: "T0B 4A0", b14: 6552, b16: 294.41, b18: 106.82, b24: 6552, b26: 6552 },
  { last: "Kemanzi", first: "Claire", init: "", sin: "973-066-707", addr1: "8460 106A Avenue NW", addr2: "Edmonton", province: "AB", postal: "T5H 0S4", b14: 2300, b16: 118.01, b18: 37.5, b22: 156.77, b24: 2300, b26: 2300 },
];

const mono = "'Courier New', monospace";

function money(v) {
  if (v == null || v === "") return { d: "", c: "" };
  const [d, c] = Number(v).toFixed(2).split(".");
  return { d, c };
}

const s = {
  slip: { border: "1px solid #000", position: "relative", padding: "6px 8px 7px 20px" },
  vprot: { position: "absolute", left: 0, top: 0, bottom: 0, width: 16, borderRight: "1px solid #000", writingMode: "vertical-rl", transform: "rotate(180deg)", textAlign: "center", fontSize: 7.5, padding: "6px 2px", display: "flex", flexDirection: "column", justifyContent: "space-between" },
  topband: { display: "flex", gap: 0, alignItems: "stretch", marginBottom: 3 },
  empbox: { border: "1px solid #000", padding: "4px 8px", flex: "0 0 38%", minHeight: 44 },
  cap: { fontSize: 7, lineHeight: 1.15, marginBottom: 4 },
  empAddr: { fontFamily: mono, fontSize: 10.5, lineHeight: 1.35 },
  cracell: { flex: "0 0 32%", textAlign: "left", fontSize: 8.5, lineHeight: 1.2, padding: "2px 6px 4px", borderBottom: "1.5px solid #000" },
  crarow1: { display: "flex", gap: 5, alignItems: "flex-start" },
  flag: { flex: "0 0 auto", display: "inline-flex", width: 32, height: 17, border: "0.5px solid #999", background: "linear-gradient(to right,#000 25%,#fff 25%,#fff 75%,#000 75%)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  leaf: { fontSize: 14, lineHeight: 1, filter: "grayscale(1) brightness(0)" },
  craname: { display: "flex", gap: 9, fontSize: 8, lineHeight: 1.25 },
  cranameSpan: { width: 54, display: "inline-block" },
  crarow2: { display: "flex", gap: 8, alignItems: "center", marginTop: 3 },
  yrlbl: { fontSize: 7, lineHeight: 1.1 },
  yrbox: { border: "1px solid #000", display: "inline-block", padding: "2px 12px", fontSize: 12, fontFamily: mono },
  t4title: { flex: 1, textAlign: "right", padding: "2px 0 4px", borderBottom: "1.5px solid #000" },
  t4: { fontSize: 20, fontWeight: "bold" },
  st: { fontSize: 10, fontWeight: "bold" },
  bodyrow: { display: "flex", gap: 3, alignItems: "stretch" },
  leftcol: { flex: "0 0 40%", display: "flex", flexDirection: "column", gap: 2 },
  midcol: { flex: "0 0 15%", display: "flex", flexDirection: "column", gap: 2 },
  rightcol: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  mbox: { display: "flex", flexDirection: "column" },
  mlabel: { textAlign: "center", fontSize: 6.5, lineHeight: 1.05, padding: "1px 2px 0", minHeight: 13, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  mfield: { border: "1px solid #000", display: "flex", alignItems: "stretch", minHeight: 20 },
  mnum: { borderRight: "1px solid #000", fontWeight: "bold", fontSize: 8, padding: "1px 3px", display: "flex", alignItems: "flex-start" },
  mval: { flex: 1, textAlign: "right", fontFamily: mono, fontSize: 11, padding: "1px 4px", display: "flex", alignItems: "center", justifyContent: "flex-end" },
  mcents: { borderLeft: "1px solid #000", width: 22, textAlign: "right", fontFamily: mono, fontSize: 11, padding: "1px 3px", display: "flex", alignItems: "center", justifyContent: "flex-end" },
  tval: { flex: 1, fontFamily: mono, fontSize: 11, padding: "1px 6px", display: "flex", alignItems: "center" },
  mrow: { display: "flex", gap: 3 },
  box54: { border: "1px solid #000", display: "flex", alignItems: "stretch", minHeight: 28 },
  box54n: { borderRight: "1px solid #000", fontWeight: "bold", fontSize: 8.5, padding: "2px 5px", display: "flex", alignItems: "flex-start" },
  box54b: { flex: 1, padding: "2px 7px" },
  box54l: { fontSize: 6.5 },
  box54v: { fontFamily: mono, fontSize: 12, letterSpacing: 1, marginTop: 2 },
  lrow: { display: "flex", gap: 3 },
  exf: { border: "1px solid #000", display: "flex", alignItems: "stretch", minHeight: 32 },
  exfn: { borderRight: "1px solid #000", fontWeight: "bold", fontSize: 8.5, padding: "2px 3px", display: "flex", alignItems: "flex-start" },
  excols: { flex: 1, display: "flex", justifyContent: "space-around", alignItems: "center", textAlign: "center", fontSize: 6, padding: "2px 0" },
  cbx: { border: "1px solid #000", width: 14, height: 11, margin: "2px auto" },
  empname: { border: "1px solid #000", padding: "4px 7px", flex: 1, minHeight: 78, position: "relative" },
  nhdr: { fontSize: 6.5, display: "flex", justifyContent: "space-between", margin: "3px 0" },
  nameline: { border: "1px solid #000", display: "flex", padding: "3px 6px", fontFamily: mono, fontSize: 12, position: "relative" },
  arw: { position: "absolute", left: -11, top: 4, fontSize: 11 },
  ln: { flex: 1 },
  fn: { flex: "0 0 34%" },
  inch: { flex: "0 0 8%", textAlign: "right" },
  addr: { fontFamily: mono, fontSize: 11, marginTop: 10, lineHeight: 1.8 },
  other: { border: "1px solid #000", marginTop: 6, padding: "5px 8px" },
  orow: { display: "flex", gap: 6, marginTop: 3 },
  ocell: { flex: 1, display: "flex", flexDirection: "column" },
  och: { display: "flex", fontSize: 6.5 },
  ochA: { flex: 1, textAlign: "center" },
  ocf: { display: "flex", marginTop: 1 },
  obc: { border: "1px solid #000", width: 34, height: 18 },
  oam: { border: "1px solid #000", borderLeft: "none", flex: 1, height: 18 },
  sfoot: { display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 8.5 },
  // reverse
  rev: { fontSize: 8.5, lineHeight: 1.3 },
  revH: { fontSize: 11, fontWeight: "bold", margin: "4px 0 5px" },
  rtwo: { display: "flex", gap: 22 },
  rc: { flex: 1 },
  ritem: { marginBottom: 4 },
  rbox: { border: "1px solid #000", padding: "5px 7px", margin: "5px 0", display: "flex", justifyContent: "space-between", gap: 10 },
  rl: { flex: 1 },
  rr: { width: 150 },
  donot: { border: "1px solid #000", padding: "7px 9px", marginTop: 8 },
  dcols: { display: "flex", gap: 18, marginTop: 5 },
  dc: { flex: 1 },
  rfoot: { display: "flex", justifyContent: "space-between", fontSize: 8, marginTop: 6 },
};

function Flag() {
  return <span style={s.flag}><span style={s.leaf}>{"\uD83C\uDF41"}</span></span>;
}

function MoneyBox({ label, num, value }) {
  const { d, c } = money(value);
  return (
    <div style={{ ...s.mbox, flex: 1 }}>
      <div style={s.mlabel}>{label}</div>
      <div style={s.mfield}>
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

function OtherRow() {
  const cell = (
    <div style={s.ocell}>
      <div style={s.och}><span style={{ width: 34 }}>Box &ndash; Case</span><span style={s.ochA}>Amount &ndash; Montant</span></div>
      <div style={s.ocf}><span style={s.obc} /><span style={s.oam} /></div>
    </div>
  );
  return <div style={s.orow}>{cell}{cell}{cell}</div>;
}

function Slip({ employer, employee, year }) {
  const e = employee;
  return (
    <div style={s.slip}>
      <div style={s.vprot}>
        <span>Protected B when completed / Protégé B une fois rempli</span>
        <span style={{ fontWeight: "normal" }}>T4 (25)</span>
      </div>

      <div style={s.topband}>
        <div style={s.empbox}>
          <div style={s.cap}>Employer's name &ndash; Nom de l'employeur</div>
          <div style={s.empAddr}>{employer.name}<br />{employer.addr1}<br />{employer.addr2}&nbsp;&nbsp;&nbsp; {employer.prov} &nbsp; {employer.postal}</div>
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
            <div style={s.addr}>{e.addr1}<br />{e.addr2}&nbsp;&nbsp;&nbsp; {e.province} &nbsp; {e.postal}</div>
          </div>
        </div>

        <div style={s.midcol}>
          <TextBox num="45" value="" label={<>Employer-offered dental benefits<br />Prestations dentaires offertes par l'employeur</>} />
          <TextBox num="10" value={e.province} label={<>Province of employment<br />Province d'emploi</>} />
          <TextBox num="29" value="" label={<>Employment code<br />Code d'emploi</>} />
        </div>

        <div style={s.rightcol}>
          <div style={s.mrow}>
            <MoneyBox num="14" value={e.b14} label={<>Employment income &ndash; Revenus d'emploi</>} />
            <MoneyBox num="22" value={e.b22} label={<>Income tax deducted &ndash; Impôt sur le revenu retenu</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="16" value={e.b16} label={<>Employee's CPP contributions &ndash; see over<br />Cotisations de l'employé au RPC &ndash; voir au verso</>} />
            <MoneyBox num="17" value={e.b17} label={<>Employee's QPP contributions &ndash; see over<br />Cotisations de l'employé au RRQ &ndash; voir au verso</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="16A" value={e.b16A} label={<>Employee's second CPP contributions &ndash; see over<br />Deuxièmes cotisations de l'employé au RPC</>} />
            <MoneyBox num="17A" value={e.b17A} label={<>Employee's second QPP contributions &ndash; see over<br />Deuxièmes cotisations de l'employé au RRQ</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="24" value={e.b24} label={<>EI insurable earnings &ndash; Gains assurables d'AE</>} />
            <MoneyBox num="26" value={e.b26} label={<>CPP/QPP pensionable earnings<br />Gains ouvrant droit à pension &ndash; RPC/RRQ</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="18" value={e.b18} label={<>Employee's EI premiums &ndash; Cotisations de l'employé à l'AE</>} />
            <MoneyBox num="44" value={e.b44} label={<>Union dues &ndash; Cotisations syndicales</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="20" value={e.b20} label={<>RPP contributions &ndash; Cotisations à un RPA</>} />
            <MoneyBox num="46" value={e.b46} label={<>Charitable donations &ndash; Dons de bienfaisance</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="52" value={e.b52} label={<>Pension adjustment &ndash; Facteur d'équivalence</>} />
            <MoneyBox num="50" value={e.b50} label={<>RPP or DPSP registration number<br />N° d'agrément d'un RPA ou d'un RPDB</>} />
          </div>
          <div style={s.mrow}>
            <MoneyBox num="55" value={e.b55} label={<>Employee's PPIP premiums &ndash; see over<br />Cotisations de l'employé au RPAP &ndash; voir au verso</>} />
            <MoneyBox num="56" value={e.b56} label={<>PPIP insurable earnings &ndash; Gains assurables du RPAP</>} />
          </div>
        </div>
      </div>

      <div style={s.other}>
        <div style={{ fontSize: 7 }}>Other information (see over) &ndash; Autres renseignements (voir au verso)</div>
        <OtherRow />
        <OtherRow />
      </div>
      <div style={s.sfoot}><span><b>T4 (25)</b></span><span style={{ fontFamily: mono }}>REV &nbsp; OSP</span></div>
    </div>
  );
}

// ---- Reverse page (full, bilingual) ----
const EN_L = [
  ["14", "Employment income – Enter on line 10100."],
  ["16", "Employee's CPP contributions – includes base CPP contributions (Go to canada.ca/line-30800) and first additional CPP contributions (Go to canada.ca/line-22215)."],
  ["16A", "Employee's second CPP contributions – Employee's second additional CPP contributions (CPP2). Go to canada.ca/line-22215."],
  ["17", "Employee's QPP contributions – includes base QPP contributions (Go to canada.ca/line-30800) and first additional QPP contributions (Go to canada.ca/line-22215)."],
  ["17A", "Employee's second QPP contributions – Employee's second additional QPP contributions (QPP2). Go to canada.ca/line-22215."],
  ["18", "Employee's EI premiums – Go to canada.ca/line-31200."],
  ["20", "RPP contributions – Includes past service contributions. Go to canada.ca/line-20700."],
  ["22", "Income tax deducted – Enter on line 43700."],
  ["39", "Security options deduction 110(1)(d) – Enter on line 24900."],
  ["41", "Security options deduction 110(1)(d.1) – Enter on line 24900."],
  ["42", "Employment commissions – Enter on line 10120. This amount is already included in box 14."],
  ["43", "Canadian Armed Forces personnel and police deduction – Enter on line 24400. This amount is already included in box 14."],
  ["44", "Union dues – Enter on line 21200."],
  ["45", "Employer-offered dental benefits – Go to canada.ca/t4-information-employers."],
  ["46", "Charitable donations – Go to canada.ca/t4-information-employers."],
  ["52", "Pension adjustment – Enter on line 20600."],
  ["55", "Provincial parental insurance plan (PPIP) – Residents of Quebec, go to canada.ca/line-31205. Residents of provinces or territories other than Quebec, go to canada.ca/line-31200."],
  ["66", "Eligible retiring allowances – Go to canada.ca/line-13000."],
];
const EN_R_TOP = [
  ["67", "Non-eligible retiring allowances – Go to canada.ca/line-13000."],
  ["74", "Past service contributions for 1989 or earlier years while a contributor – Go to canada.ca/line-20700."],
  ["75", "Past service contributions for 1989 or earlier years while not a contributor – Go to canada.ca/line-20700."],
  ["77", "Workers' compensation benefits repaid to the employer – Enter on line 22900."],
];
const EN_R_MID = [
  ["85", "Employee-paid premiums for private health services plans – Go to canada.ca/line-33099."],
  ["87", "Emergency services volunteer exempt amount – Go to canada.ca/line-10100."],
  ["91", "Security options deduction 110(1)(d) – Enter on line 24900."],
  ["92", "Security options deduction 110(1)(d.1) – Enter on line 24900."],
];
const FR_L = [
  ["14", "Revenus d'emploi – Inscrivez à la ligne 10100."],
  ["16", "Cotisations de l'employé – comprend les cotisations de base au RPC (Allez à canada.ca/ligne-30800) et les premières cotisations supplémentaires au RPC (Allez à canada.ca/ligne-22215)."],
  ["16A", "Deuxièmes cotisations de l'employé au RPC – Deuxièmes cotisations supplémentaires de l'employé au RPC (RPC2). Allez à canada.ca/ligne-22215."],
  ["17", "Cotisations de l'employé au RRQ – comprend les cotisations de base au RRQ (Allez à canada.ca/ligne-30800) et les premières cotisations supplémentaires au RRQ (Allez à canada.ca/ligne-22215)."],
  ["17A", "Deuxièmes cotisations de l'employé au RRQ – Deuxièmes cotisations supplémentaires de l'employé au RRQ (RRQ2). Allez à canada.ca/ligne-22215."],
  ["18", "Cotisations de l'employé à l'AE – Allez à canada.ca/ligne-31200."],
  ["20", "Cotisations à un RPA – Comprend les cotisations pour services passés. Allez à canada.ca/ligne-20700."],
  ["22", "Impôt sur le revenu retenu – Inscrivez à la ligne 43700."],
  ["39", "Déduction pour options d'achat de titres 110(1)d) – Inscrivez à la ligne 24900."],
  ["41", "Déduction pour options d'achat de titres 110(1)d.1) – Inscrivez à la ligne 24900."],
  ["42", "Commissions d'emploi – Inscrivez à la ligne 10120. Ce montant est déjà compris dans la case 14."],
  ["43", "Déduction pour le personnel des Forces armées canadiennes et des forces policières – Inscrivez à la ligne 24400. Ce montant est déjà compris dans la case 14."],
  ["44", "Cotisations syndicales – Inscrivez à la ligne 21200."],
  ["45", "Prestations dentaires offertes par l'employeur – Allez à canada.ca/t4-information-employeurs."],
  ["46", "Dons de bienfaisance – Allez à canada.ca/t4-information-employeurs."],
  ["52", "Facteur d'équivalence – Inscrivez à la ligne 20600."],
  ["55", "Régime provincial d'assurance parentale (RPAP) – Résidents du Québec, allez à canada.ca/ligne-31205. Résidents des autres provinces ou territoires, allez à canada.ca/ligne-31200."],
  ["66", "Allocations de retraite admissibles – Allez à canada.ca/ligne-13000."],
];
const FR_R_TOP = [
  ["67", "Allocations de retraite non admissibles – Allez à canada.ca/ligne-13000."],
  ["74", "Services passés pour 1989 et les années précédentes pendant que l'employé cotisait – Allez à canada.ca/ligne-20700."],
  ["75", "Services passés pour 1989 et les années précédentes pendant que l'employé ne cotisait pas – Allez à canada.ca/ligne-20700."],
  ["77", "Indemnités pour accidents du travail remboursées à l'employeur – Inscrivez à la ligne 22900."],
];
const FR_R_MID = [
  ["85", "Primes versées par l'employé à un régime privé d'assurance-maladie – Allez à canada.ca/ligne-33099."],
  ["87", "Montant exempt d'impôt versé à un volontaire des services d'urgence – Allez à canada.ca/ligne-10100."],
  ["91", "Déduction pour options d'achat de titres 110(1)(d) – Inscrivez à la ligne 24900."],
  ["92", "Déduction pour options d'achat de titres 110(1)(d.1) – Inscrivez à la ligne 24900."],
];

function Items({ list }) {
  return <>{list.map(([n, t]) => <div key={n} style={s.ritem}><b>{n}</b> &ndash; {t}</div>)}</>;
}

function ReversePage() {
  return (
    <div className="t4-page">
      <div style={s.rev}>
        <div style={s.revH}>Report these amounts on your tax return.</div>
        <div style={s.rtwo}>
          <div style={s.rc}><Items list={EN_L} /></div>
          <div style={s.rc}>
            <Items list={EN_R_TOP} />
            <div style={s.rbox}><div style={s.rl}><b>78</b> &ndash; Fishers &ndash; Gross income<br /><b>79</b> &ndash; Fishers &ndash; Net partnership amount<br /><b>80</b> &ndash; Fishers &ndash; Shareperson amount</div><div style={s.rr}>See Form T2121. <b>Do not</b> enter on line 10100.</div></div>
            <div style={s.rbox}><div style={s.rl}><b>81</b> &ndash; Placement or employment agency workers<br /><b>82</b> &ndash; Taxi drivers and drivers of other passenger-carrying vehicles<br /><b>83</b> &ndash; Barbers or hairdressers</div><div style={s.rr}>Gross income. See Form T2125. <b>Do not</b> enter on line 10100.</div></div>
            <Items list={EN_R_MID} />
            <div style={s.rbox}><div style={s.rl}>The Canada Revenue Agency uses the term <b>Indian</b> because it has legal meaning in the Indian Act.<br /><b>69</b> &ndash; Indian Act (exempt income) &ndash; Non-eligible retiring allowances<br /><b>71</b> &ndash; Indian Act (exempt income) &ndash; Employment<br /><b>88</b> &ndash; Indian Act (exempt income) &ndash; Self-employed<br /><b>94</b> &ndash; Indian Act (exempt income) &ndash; RPP contributions<br /><b>95</b> &ndash; Indian Act (exempt income) &ndash; Union dues</div><div style={s.rr}>See Form T90. <b>Do not</b> enter these amounts on line 10100, line 13000 or lines 13499 to 14300.</div></div>
          </div>
        </div>
        <div style={s.donot}>
          <b>Do not report these amounts on your tax return. For Canada Revenue Agency use only.</b> (Amounts in boxes 30, 32, 34, 36, 38, 40, 57, 58, 59, 60, 86 and 90 are already included in box 14.)
          <div style={s.dcols}>
            <div style={s.dc}><Items list={[["30","Board and lodging"],["31","Special work site"],["32","Travel in a prescribed zone"],["33","Medical travel assistance"],["34","Personal use of employer's automobile or motor vehicle"]]} /></div>
            <div style={s.dc}><Items list={[["36","Interest-free and low-interest loans"],["38","Security options benefits"],["40","Other taxable allowances and benefits"],["57","Employment Income – March 15 to May 9, 2020"],["58","Employment Income – May 10 to July 4, 2020"]]} /></div>
            <div style={s.dc}><Items list={[["59","Employment Income – July 5 to August 29, 2020"],["60","Employment Income – August 30 to September 26, 2020"],["86","Security options election"],["90","Security option benefits"]]} /></div>
          </div>
        </div>
        <div style={s.rfoot}><span><b>T4 (25)</b></span><span>Privacy Act, personal information bank numbers CRA PPU 005 and CRA PPU 047</span></div>

        <div className="t4-rcut" />

        <div style={s.revH}>Veuillez déclarer ces montants dans votre déclaration de revenus.</div>
        <div style={s.rtwo}>
          <div style={s.rc}><Items list={FR_L} /></div>
          <div style={s.rc}>
            <Items list={FR_R_TOP} />
            <div style={s.rbox}><div style={s.rl}><b>78</b> &ndash; Pêcheurs &ndash; Revenus bruts<br /><b>79</b> &ndash; Pêcheurs &ndash; Montant net d'un associé de la société de personnes<br /><b>80</b> &ndash; Pêcheurs &ndash; Montant du pêcheur à part</div><div style={s.rr}>Consultez le formulaire T2121. <b>N'inscrivez pas</b> ce montant à la ligne 10100.</div></div>
            <div style={s.rbox}><div style={s.rl}><b>81</b> &ndash; Travailleurs d'agences ou de bureaux de placement<br /><b>82</b> &ndash; Chauffeurs de taxi ou d'un autre véhicule de transport de passagers<br /><b>83</b> &ndash; Barbiers et coiffeurs</div><div style={s.rr}>Revenus bruts. Consultez le formulaire T2125. <b>N'inscrivez pas</b> ce montant à la ligne 10100.</div></div>
            <Items list={FR_R_MID} />
            <div style={s.rbox}><div style={s.rl}>L'Agence du revenu du Canada utilise le terme <b>Indien</b> en raison de sa signification légale dans la Loi sur les Indiens.<br /><b>69</b> &ndash; Loi sur les Indiens (revenu d'emploi exonéré) &ndash; Allocations de retraite non admissibles<br /><b>71</b> &ndash; Loi sur les Indiens (revenu d'emploi exonéré) &ndash; emploi<br /><b>88</b> &ndash; Loi sur les Indiens (revenu d'emploi exonéré) &ndash; travail indépendant<br /><b>94</b> &ndash; Loi sur les Indiens (revenu d'emploi exonéré) &ndash; cotisations à un RPA<br /><b>95</b> &ndash; Loi sur les Indiens (revenu d'emploi exonéré) &ndash; cotisations syndicales</div><div style={s.rr}>Consultez le formulaire T90. <b>N'inscrivez pas</b> ces montants à la ligne 10100, la ligne 13000 ou aux lignes 13499 à 14300.</div></div>
          </div>
        </div>
        <div style={s.donot}>
          <b>Ne déclarez pas ces montants à votre déclaration d'impôt. À l'usage de l'Agence du revenu du Canada seulement.</b> (Les montants des cases 30, 32, 34, 36, 38, 40, 57, 58, 59, 60, 86 et 90 sont déjà inclus à la case 14.)
          <div style={s.dcols}>
            <div style={s.dc}><Items list={[["30","Pension et logement"],["31","Chantier particulier"],["32","Voyages dans une zone visée par règlement"],["33","Aide accordée pour les voyages pour soins médicaux"],["34","Usage personnel de l'automobile ou du véhicule à moteur de l'employeur"]]} /></div>
            <div style={s.dc}><Items list={[["36","Prêts sans intérêt ou à faible intérêt"],["38","Avantages liés aux options d'achat de titres"],["40","Autres allocations et avantages imposables"],["57","Revenus d'emploi – Du 15 mars au 9 mai 2020"],["58","Revenus d'emploi – Du 10 mai au 4 juillet 2020"]]} /></div>
            <div style={s.dc}><Items list={[["59","Revenus d'emploi – Du 5 juillet au 29 août 2020"],["60","Revenus d'emploi – Du 30 août au 26 septembre 2020"],["86","Choix liés aux options d'achat de titres"],["90","Avantages liés aux options d'achat de titres"]]} /></div>
          </div>
        </div>
        <div style={s.rfoot}><span><b>T4 (25)</b></span><span>Loi sur la protection des renseignements personnels, fichiers de renseignements personnels ARC PPU 005 et ARC PPU 047</span></div>
      </div>
    </div>
  );
}

function T4EmployeeSlips({ year = 2026, employer = SAMPLE_EMPLOYER, employees = SAMPLE_EMPLOYEES }) {
  const blocks = [];
  for (let i = 0; i < employees.length; i += 2) {
    blocks.push({ type: "slips", pair: employees.slice(i, i + 2), key: "s" + i });
    blocks.push({ type: "reverse", key: "r" + i });
  }

  return (
    <div style={{ background: "#EDEFF2", fontFamily: "Arial, Helvetica, sans-serif", color: "#000" }}>
      <style>{`
        .t4-page { background:#fff; width:880px; max-width:100%; min-height:1120px; margin:12px auto 24px; padding:30px 32px; box-shadow:0 1px 6px rgba(16,30,40,.16); font-size:9px; }
        @media print {
          @page { size: letter; margin: 0.35in; }

          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }

          .t4-noprint { display: none !important; }

          /* The grey outer wrapper on the T4 pages must NOT constrain height */
          body > div, body > div > div { background: #fff !important; }

          /* Each .t4-page prints as its own sheet */
          .t4-page {
            background: #fff !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            max-width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            page-break-inside: avoid !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .t4-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /* Hide the cut-line scissors marker during print */
          .t4-cutline:after { display: none !important; }
        }
        .t4-cutline { border-top:1px dashed #666; margin:20px 0; position:relative; }
        .t4-cutline:after { content:"\\2702"; position:absolute; left:6px; top:-10px; font-size:14px; background:#fff; padding:0 5px; color:#555; }
        .t4-rcut { border-top:1px dashed #666; margin:14px 0; position:relative; }
        .t4-rcut:after { content:"\\2702"; position:absolute; left:6px; top:-9px; font-size:12px; background:#fff; padding:0 4px; color:#555; }
      `}</style>

      <div className="t4-noprint" style={{ background: "#fff", borderBottom: "1px solid #E3E7EC", padding: "12px 20px", display: "flex", gap: 10, alignItems: "center", position: "sticky", top: 0, zIndex: 5 }}>
        <button
          onClick={() => window.location.href = "/payroll/taxes/filings"}
          style={{
            font: "inherit", fontWeight: 600, fontSize: 14,
            border: "1px solid #E3E7EC", borderRadius: 10, padding: "9px 14px",
            cursor: "pointer", background: "#fff", color: "#0E1A1A",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          {"\u2190"} Back
        </button>
        <button onClick={() => window.print()} style={{ font: "inherit", fontWeight: 600, fontSize: 14, border: "none", borderRadius: 10, padding: "9px 18px", cursor: "pointer", background: "#15A08C", color: "#fff" }}>Print</button>
        <span style={{ color: "#5F6B7A", fontSize: 13, marginLeft: "auto" }}>Employee copies · cut along the dashed line and give to each employee</span>
      </div>

      {blocks.map((b) => b.type === "reverse"
        ? <ReversePage key={b.key} />
        : (
          <div key={b.key} className="t4-page">
            {b.pair.map((emp, j) => (
              <React.Fragment key={j}>
                <Slip employer={employer} employee={emp} year={year} />
                <div className="t4-cutline" />
              </React.Fragment>
            ))}
          </div>
        ))}
    </div>
  );
}

export default T4EmployeeSlips;