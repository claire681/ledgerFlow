import React, { useState, useEffect } from "react";

// T4Summary
// CRA T4 Summary (T4 SUM 25). Page 1 is the form inside one outer box; page 2 is the
// bilingual CRA instructions. Black-and-white CRA header flag, connected grid, the
// do-not-use area with numbered boxes, the Difference branch to Overpayment / Balance due.
// Fetches real YTD data from GET /payroll/taxes/t4-sum-preview?year=YYYY

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
  formbox: { border: "1.5px solid #000", padding: "14px 16px" },

  hdr: { display: "flex", alignItems: "flex-start", gap: 16 },
  flag: { display: "inline-flex", width: 32, height: 17, border: "0.5px solid #999", background: "linear-gradient(to right,#000 25%,#fff 25%,#fff 75%,#000 75%)", alignItems: "center", justifyContent: "center", overflow: "hidden", flex: "0 0 auto" },
  leaf: { fontSize: 14, lineHeight: 1, filter: "grayscale(1) brightness(0)" },
  crarow: { display: "flex", gap: 8, alignItems: "flex-start", fontSize: 8.5, lineHeight: 1.2 },
  craN: { width: 66, display: "inline-block" },
  yrrow: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 },
  yrtext: { fontSize: 8, lineHeight: 1.25 },
  yrbox: { border: "1px solid #000", padding: "2px 10px", fontSize: 18, fontWeight: "bold" },
  yr26: { fontWeight: "normal", textDecoration: "underline", paddingLeft: 4 },
  formno: { border: "1px solid #000", padding: "4px 9px", fontWeight: "bold", fontSize: 13, marginTop: 2 },
  htitle: { textAlign: "center", fontSize: 10, lineHeight: 1.3, marginTop: 2 },
  big: { fontSize: 22, fontWeight: "bold", verticalAlign: "middle" },
  smt: { fontSize: 10, textAlign: "left", display: "inline-block", verticalAlign: "middle", marginLeft: 4 },
  hprot: { marginLeft: "auto", textAlign: "right", fontSize: 11, lineHeight: 1.35 },

  body: { display: "flex", gap: 12, marginTop: 14, alignItems: "flex-start" },
  colL: { width: "32%", display: "flex", flexDirection: "column", gap: 0 },
  colM: { flex: 1, display: "flex", flexDirection: "column", gap: 0 },
  colR: { width: 172 },
  instr: { border: "1px solid #000", padding: "9px 11px", fontSize: 10, lineHeight: 1.35, marginBottom: 14 },

  fb: { display: "flex", flexDirection: "column" },
  lbl: { textAlign: "center", fontSize: 8, lineHeight: 1.15, padding: "2px 2px", minHeight: 14, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  field: { border: "1px solid #000", display: "flex", alignItems: "stretch", minHeight: 26 },
  bn: { borderRight: "1px solid #000", fontWeight: "bold", fontSize: 9, padding: "2px 4px", display: "flex", alignItems: "flex-start" },
  val: { flex: 1, textAlign: "right", fontFamily: mono, fontSize: 13, padding: "3px 6px", display: "flex", alignItems: "center", justifyContent: "flex-end" },
  valCtr: { justifyContent: "center" },
  cents: { borderLeft: "1px solid #000", width: 34, textAlign: "right", fontFamily: mono, fontSize: 13, padding: "3px 4px", display: "flex", alignItems: "center", justifyContent: "flex-end" },
  centsSh: { background: "#D9D9D9" },

  acctbox: { border: "1px solid #000", padding: "7px 9px" },
  acctlbl: { fontSize: 8, marginBottom: 3 },
  acctinner: { border: "1px solid #000", padding: "5px 8px", fontFamily: mono, fontSize: 13, letterSpacing: 1 },
  empaddr: { fontFamily: mono, fontSize: 13, lineHeight: 1.9, marginTop: 6 },

  note2: { display: "flex", gap: 24, fontSize: 8, lineHeight: 1.3, marginTop: 5, paddingLeft: 2 },

  dnu: { border: "1px solid #000", padding: "8px 9px", fontSize: 9, minHeight: "100%" },
  dnuH: { textAlign: "center", fontWeight: "bold", marginBottom: 10, lineHeight: 1.25 },
  grp: { marginBottom: 10 },
  cap: { fontSize: 8, textAlign: "center", lineHeight: 1.15, marginBottom: 3 },
  numbox: { border: "1px solid #000", fontWeight: "bold", fontSize: 10, padding: "0 4px", minWidth: 22, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  cell: { border: "1px solid #000", borderLeft: "none", width: 28, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11 },

  diffrow: { display: "flex", marginTop: 8 },
  diffbox: { width: 210 },

  branch: { position: "relative", height: 30 },
  bbar: { position: "absolute", top: 14, left: "11%", width: "42%", borderTop: "1px solid #000" },
  bstem: { position: "absolute", top: 0, left: "53%", height: 14, borderLeft: "1px solid #000" },
  barmL: { position: "absolute", top: 14, left: "11%", height: 12, borderLeft: "1px solid #000" },
  barmR: { position: "absolute", top: 14, left: "53%", height: 12, borderLeft: "1px solid #000" },
  barwL: { position: "absolute", top: 22, left: "calc(11% - 5px)", fontSize: 12, lineHeight: 1 },
  barwR: { position: "absolute", top: 22, left: "calc(53% - 5px)", fontSize: 12, lineHeight: 1 },

  row3: { display: "flex", gap: 14, marginTop: 2 },
  c84: { width: "32%" },
  c86: { flex: 1 },
  cint: { width: 210 },

  sinrow: { borderTop: "1px solid #000", borderBottom: "1px solid #000", padding: "8px 2px", marginTop: 10 },
  sintop: { textAlign: "center", fontSize: 8.5 },
  sinbody: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4 },

  contactrow: { display: "flex", gap: 12, marginTop: 10, alignItems: "flex-end" },
  cert: { borderTop: "1px solid #000", borderBottom: "1px solid #000", marginTop: 10, padding: "8px 2px" },
  certT: { textAlign: "center", fontWeight: "bold", marginBottom: 6 },
  sigrow: { display: "flex", gap: 14, marginTop: 26 },
  sig: { flex: 1, borderTop: "1px solid #000", paddingTop: 3, textAlign: "center", fontSize: 8.5 },

  foot: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8, fontSize: 9.5, padding: "0 2px" },
  cn: { fontSize: 20, fontWeight: "bold", letterSpacing: -1 },

  p2: { display: "flex", gap: 34 },
  c2: { flex: 1, fontSize: 10.5, lineHeight: 1.4 },
};

function Flag() {
  return <span style={s.flag}><span style={s.leaf}>{"\uD83C\uDF41"}</span></span>;
}

function MoneyField({ num, label, value, shaded, centerVal }) {
  const { d, c } = money(value);
  return (
    <div style={s.fb}>
      <div style={s.lbl}>{label}</div>
      <div style={s.field}>
        {num ? <span style={s.bn}>{num}</span> : null}
        {centerVal
          ? <span style={{ ...s.val, ...s.valCtr }}>{d}</span>
          : <><span style={s.val}>{d}</span><span style={shaded ? { ...s.cents, ...s.centsSh } : s.cents}>{c}</span></>}
      </div>
    </div>
  );
}

function DigitCells({ n }) {
  const cells = [];
  for (let i = 0; i < n; i++) {
    cells.push(<span key={i} style={{ border: "1px solid #000", borderLeft: i === 0 ? "1px solid #000" : "none", width: 13, height: 20, display: "inline-block" }} />);
  }
  return <span style={{ display: "inline-flex" }}>{cells}</span>;
}

function Page1({ year, employer, summary, contact }) {
  return (
    <div className="t4-page">
      <div style={s.formbox}>
        <div style={s.hdr}>
          <div>
            <div style={s.crarow}>
              <Flag />
              <span style={s.craN}>Canada Revenue Agency</span>
              <span style={s.craN}>Agence du revenu du Canada</span>
            </div>
            <div style={s.yrrow}>
              <span style={s.yrtext}>For the year ending December 31,<br />Pour l'année se terminant le 31 décembre</span>
              <span style={s.yrbox}>20<span style={s.yr26}>{String(year).slice(-2)}</span></span>
            </div>
          </div>
          <div style={s.formno}>0505</div>
          <div style={s.htitle}>
            <div><span style={s.big}>T4</span><span style={s.smt}>Summary<br />Sommaire</span></div>
            <div style={{ fontWeight: "bold", marginTop: 3 }}>Summary of Remuneration Paid</div>
            <div style={{ fontWeight: "bold" }}>Sommaire de la rémunération payée</div>
          </div>
          <div style={s.hprot}><b>Protected B</b> when completed<br /><b>Protégé B</b> une fois rempli</div>
        </div>

        <div style={s.body}>
          <div style={s.colL}>
            <div style={s.instr}>
              <p style={{ margin: "0 0 9px" }}>You have to file your T4 information return on or before the last day of <b>February</b>. See the information on page 2.</p>
              <p style={{ margin: 0 }}>Vous devez produire votre déclaration de renseignements T4 au plus tard le dernier jour de <b>février</b>. Lisez les renseignements à la page 2.</p>
            </div>
            <MoneyField num="88" centerVal value={summary.slips} label={<>Total number of T4 slips filed<br />Nombre total de feuillets T4 produits</>} />
            <MoneyField num="14" value={summary.b14} label={<>Employment income &ndash; Revenus d'emploi</>} />
            <MoneyField num="20" value={summary.b20} shaded label={<>Registered pension plan (RPP) contributions<br />Cotisations à un régime de pension agréé (RPA)</>} />
            <MoneyField num="52" value={summary.b52} shaded label={<>Pension adjustment &ndash; Facteur d'équivalence</>} />
          </div>

          <div style={s.colM}>
            <div style={s.acctbox}>
              <div style={s.acctlbl}>Employer's account number (15 characters) &ndash; Numéro de compte de l'employeur (15 caractères)</div>
              <div style={s.acctinner}>{employer.account}</div>
              <div style={{ ...s.acctlbl, marginTop: 6 }}>Name and address of employer &ndash; Nom et adresse de l'employeur</div>
              <div style={s.empaddr}>{employer.name}<br />{employer.addr1}<br />{employer.addr2}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {employer.prov} &nbsp;&nbsp; {employer.postal}</div>
            </div>
            <MoneyField num="16" value={summary.b16} label={<>Employees' CPP contributions<br />Cotisations des employés au RPC</>} />
            <MoneyField num="16A" value={summary.b16A} label={<>Employee's second CPP contributions<br />Deuxièmes cotisations de l'employé au RPC</>} />
            <MoneyField num="27" value={summary.b27} label={<>Employer's CPP contributions<br />Cotisations de l'employeur au RPC</>} />
            <MoneyField num="27A" value={summary.b27A} label={<>Employer's second CPP contributions<br />Deuxièmes cotisations de l'employeur au RPC</>} />
            <MoneyField num="18" value={summary.b18} label={<>Employees' EI premiums &ndash; Cotisations des employés à l'AE</>} />
            <MoneyField num="19" value={summary.b19} label={<>Employer's EI premiums &ndash; Cotisations de l'employeur à l'AE</>} />
            <MoneyField num="22" value={summary.b22} label={<>Income tax deducted &ndash; Impôt sur le revenu retenu</>} />
            <MoneyField num="80" value={summary.b80} label={<>Total deductions reported (16+16A+27+27A+18+19+22)<br />Total des retenues déclarées (16+16A+27+27A+18+19+22)</>} />
            <MoneyField num="82" value={summary.b82} label={<><b>Minus:</b> remittances &ndash; <b>Moins :</b> versements</>} />
            <div style={s.note2}>
              <span style={{ flex: 1 }}>Generally, we do not charge or refund a difference of $2 or less.</span>
              <span style={{ flex: 1 }}>Généralement, une différence de 2 $ ou moins n'est ni exigée ni remboursée.</span>
            </div>
          </div>

          <div style={s.colR}>
            <div style={s.dnu}>
              <div style={s.dnuH}>Do not use this area<br />N'inscrivez rien ici</div>
              <div style={s.grp}>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <div style={{ flex: 1, textAlign: "center", fontSize: 8, lineHeight: 1.15 }}>Last to current<br />Précédente à courante</div>
                  <div style={{ width: 56, textAlign: "center", fontSize: 8, lineHeight: 1.15 }}>Other<br />Autre</div>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", marginTop: 2 }}>
                  <span style={s.numbox}>90</span><span style={s.cell}>1</span><span style={s.cell}>2</span>
                  <span style={{ flex: 1 }} /><span style={{ ...s.cell, borderLeft: "1px solid #000" }}>3</span>
                </div>
              </div>
              <div style={s.grp}>
                <div style={{ ...s.cap, textAlign: "left" }}>Pro forma</div>
                <div style={{ display: "flex", alignItems: "flex-end" }}><span style={s.numbox}>91</span><span style={s.cell}>1</span><span style={s.cell}>2</span></div>
              </div>
              <div style={s.grp}>
                <div style={s.cap}>Date</div>
                <div style={{ display: "flex", alignItems: "flex-end" }}><span style={s.numbox}>93</span><span style={{ flex: 1, border: "1px solid #000", borderLeft: "none", height: 26 }} /></div>
              </div>
              <div style={{ display: "flex", gap: 18, marginBottom: 10 }}>
                <div><div style={s.cap}>PD15-1</div><div style={{ display: "flex" }}><span style={s.numbox}>94</span><span style={{ ...s.cell, width: 32 }} /></div></div>
                <div><div style={s.cap}>POF / PSF</div><div style={{ display: "flex" }}><span style={s.numbox}>96</span><span style={{ ...s.cell, width: 32 }} /></div></div>
              </div>
              <div style={{ display: "flex", gap: 18, marginBottom: 10 }}>
                <div><div style={s.cap}>NLFP / APPT</div><div style={{ display: "flex" }}><span style={s.numbox}>97</span><span style={{ ...s.cell, width: 32 }} /></div></div>
                <div><div style={s.cap}>NMEFP / APPEO</div><div style={{ display: "flex" }}><span style={s.numbox}>98</span><span style={{ ...s.cell, width: 32 }} /></div></div>
              </div>
              <div style={{ borderTop: "1px solid #000", paddingTop: 5 }}>Memo &ndash; Note</div>
              <div style={{ borderTop: "1px solid #000", marginTop: 22, paddingTop: 5 }}>Prepared by &ndash; Établi par</div>
              <div style={{ borderTop: "1px solid #000", marginTop: 22, paddingTop: 5 }}>Date</div>
            </div>
          </div>
        </div>

        <div style={s.diffrow}>
          <div style={{ width: "32%" }} />
          <div style={s.diffbox}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 2 }}>
              <span style={{ width: 2, height: 20, background: "#000" }} />
              <span style={{ fontSize: 14, lineHeight: 0, marginTop: -4 }}>&#9660;</span>
            </div>
            <div style={s.lbl}>Difference &ndash; Différence</div>
            <div style={s.field}>{(() => { const { d, c } = money(summary.difference); return <><span style={s.val}>{d}</span><span style={s.cents}>{c}</span></>; })()}</div>
          </div>
        </div>

        <div style={s.branch}>
          <div style={s.bbar} /><div style={s.bstem} /><div style={s.barmL} /><div style={s.barmR} />
          <div style={s.barwL}>&#9660;</div><div style={s.barwR}>&#9660;</div>
        </div>

        <div style={s.row3}>
          <div style={s.c84}><MoneyField num="84" value={summary.b84} label={<>Overpayment &ndash; Paiement en trop</>} /></div>
          <div style={s.c86}><MoneyField num="86" value={summary.b86} label={<>Balance due &ndash; Solde dû</>} /></div>
          <div style={s.cint}>
            <div style={s.lbl}>Internal use only &ndash; Pour usage interne</div>
            <div style={s.field}><span style={s.val} /></div>
          </div>
        </div>

        <div style={s.sinrow}>
          <div style={s.sintop}>SIN of the proprietor(s) or principal owner(s) &ndash; NAS du ou des propriétaires</div>
          <div style={s.sinbody}>
            <div style={{ fontSize: 8.5, maxWidth: 340 }}>Canadian-controlled private corporations or unincorporated employers<br />Sociétés privées sous contrôle canadien ou employeurs non constitués</div>
            <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={s.numbox}>74</span><DigitCells n={9} /></span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={s.numbox}>75</span><DigitCells n={9} /></span>
            </div>
          </div>
        </div>

        <div style={s.contactrow}>
          <div style={{ flex: 1 }}>
            <div style={{ ...s.lbl, textAlign: "left", justifyContent: "flex-start" }}>Person to contact about this return<br />Personne avec qui communiquer au sujet de cette déclaration</div>
            <div style={s.field}><span style={s.bn}>76</span><span style={{ ...s.val, justifyContent: "flex-start", textAlign: "left" }}>{contact.name}</span></div>
          </div>
          <div style={{ width: 80 }}>
            <div style={s.lbl}>Area code<br />Indicatif régional</div>
            <div style={s.field}><span style={s.bn}>78</span><span style={{ ...s.val, ...s.valCtr }}>{contact.areaCode}</span></div>
          </div>
          <div style={{ width: 150 }}>
            <div style={s.lbl}>Telephone number<br />Numéro de téléphone</div>
            <div style={s.field}><span style={{ ...s.val, ...s.valCtr }}>{contact.phone}</span></div>
          </div>
          <div style={{ width: 96 }}>
            <div style={s.lbl}>Extension<br />Poste</div>
            <div style={s.field}><span style={s.val}>{contact.ext}</span></div>
          </div>
        </div>

        <div style={s.cert}>
          <div style={s.certT}>Certification &ndash; Attestation</div>
          <div style={{ fontSize: 9.5, lineHeight: 1.35, padding: "0 4px" }}>I certify that the information given on this T4 information return and on related slips is correct and complete.<br />J'atteste que les renseignements fournis dans cette déclaration de renseignements T4 et sur tous les feuillets connexes sont exacts et complets.</div>
          <div style={s.sigrow}>
            <div style={s.sig}>Date</div>
            <div style={s.sig}>Signature of authorized person &ndash; Signature d'une personne autorisée</div>
            <div style={s.sig}>Position or office &ndash; Titre ou poste</div>
          </div>
        </div>
      </div>

      <div style={s.foot}>
        <div>
          See the privacy notice at the bottom of next page.<br />
          Consultez l'avis de confidentialité au bas de la page suivante.<br />
          <b style={{ fontSize: 11 }}>T4 SUM (25)</b>
        </div>
        <div style={{ fontFamily: mono, fontSize: 12 }}>REV &nbsp;&nbsp; OSP</div>
        <div style={s.cn}>Canada</div>
      </div>
    </div>
  );
}

function Page2() {
  return (
    <div className="t4-page">
      <div style={s.p2}>
        <div style={s.c2}>
          <div style={{ fontWeight: "bold" }}>If you file your T4 information return electronically, do not fill out this T4 Summary.</div>
          <h3 style={{ fontSize: 13, margin: "16px 0 6px" }}>Mandatory electronic filing</h3>
          <div>You must file electronically if you have more than 5 information returns of the same type.</div>
          <div style={{ marginTop: 6 }}>You may choose one of the following electronic filing formats:</div>
          <ul><li>Internet file transfer (XML)</li><li>Web Forms</li></ul>
          <div>For more information about filing electronically, go to <b>canada.ca/filing-info-returns</b>.</div>
          <div style={{ marginTop: 6 }}>You can also file your information returns online using the "File a return" service. Go to:</div>
          <ul>
            <li>My Business Account at <b>canada.ca/cra-sign-in-services</b>, if you are the business owner</li>
            <li>Represent a Client at <b>canada.ca/cra-sign-in-services</b>, if you are an authorized representative or employee</li>
          </ul>
          <h3 style={{ fontSize: 13, margin: "16px 0 6px" }}>Filing on paper</h3>
          <div>Fill out this form using the instructions at <b>canada.ca/taxes-slips</b>.</div>
          <div style={{ marginTop: 6 }}>The employer's name and payroll program account number have to be the same as shown on your statement of account.</div>
          <div style={{ marginTop: 6 }}>To get our forms and publications, go to <b>canada.ca/cra-forms</b> or call <b>1-800-959-5525</b>.</div>
          <div style={{ marginTop: 6 }}>Send this T4 Summary and the related T4 slips to:</div>
          <div style={{ margin: "6px 0 6px 20px", lineHeight: 1.4 }}>Jonquière TC<br />T4 Program<br />Post Office Box 1300 LCD Jonquière<br />Jonquière QC&nbsp;&nbsp;G7S 0L5</div>
          <h3 style={{ fontSize: 13, margin: "16px 0 6px" }}>Make a payment</h3>
          <div>Make your payment using:</div>
          <ul>
            <li>your Canadian bank or credit union's online banking, mobile app, or telephone service</li>
            <li>the CRA's My Payment service at <b>canada.ca/cra-my-payment</b> with your activated debit card from a participating Canadian bank or credit union with a Visa Debit or Debit Mastercard logo (does not include credit cards)</li>
            <li>pre-authorized debit (PAD) at <b>canada.ca/cra-sign-in-services</b> which lets you set up payments, pay an amount due, and view or modify your account history</li>
            <li>the "Proceed to pay" button on the "View and pay account balance" page within My Business Account</li>
            <li>your credit card, Interac e-Transfer, or PayPal through one of the third-party service providers for a fee</li>
          </ul>
          <div>For more information, go to <b>canada.ca/payments</b>.</div>
          <div style={{ fontSize: 9, lineHeight: 1.35, marginTop: 12 }}>Personal information (including the SIN) is collected and used to administer or enforce the Income Tax Act and related programs and activities. The information collected may be disclosed to other federal, provincial, territorial, aboriginal, or foreign government institutions to the extent authorized by law. Under the Privacy Act, individuals have a right of protection, access to and correction of their personal information, and to file a complaint with the Privacy Commissioner of Canada. Refer to Personal Information Bank CRA PPU 047 on Info Source at <b>canada.ca/cra-info-source</b>.</div>
        </div>
        <div style={s.c2}>
          <div style={{ fontWeight: "bold" }}>Si vous produisez votre déclaration de renseignements T4 électroniquement, ne remplissez pas ce formulaire.</div>
          <h3 style={{ fontSize: 13, margin: "16px 0 6px" }}>Production obligatoire par voie électronique</h3>
          <div>Vous devez produire par voie électronique si vous avez plus de 5 déclarations de renseignements du même type.</div>
          <div style={{ marginTop: 6 }}>Vous pouvez choisir une des méthodes de production électronique suivantes :</div>
          <ul><li>Le transfert de fichiers par Internet (XML)</li><li>Les formulaires Web</li></ul>
          <div>Pour en savoir plus sur la production par voie électronique, allez à <b>canada.ca/declarations-renseignements</b>.</div>
          <div style={{ marginTop: 6 }}>Vous pouvez aussi produire vos déclarations de renseignements en ligne au moyen du service « Produire une déclaration » à :</div>
          <ul>
            <li>Mon dossier d'entreprise en allant à <b>canada.ca/arc-services-ouverture-session</b>, si vous êtes le propriétaire de l'entreprise;</li>
            <li>Représenter un client en allant à <b>canada.ca/arc-services-ouverture-session</b>, si vous êtes un représentant ou un employé autorisé.</li>
          </ul>
          <h3 style={{ fontSize: 13, margin: "16px 0 6px" }}>Production sur papier</h3>
          <div>Remplissez ce formulaire selon les directives indiquées à <b>canada.ca/impots-feuillets</b>.</div>
          <div style={{ marginTop: 6 }}>Le nom et le numéro de compte de programme de retenues sur la paie doivent être les mêmes que ceux qui figurent sur votre relevé de compte.</div>
          <div style={{ marginTop: 6 }}>Pour obtenir nos formulaires et publications, allez à <b>canada.ca/arc-formulaires</b> ou composez le <b>1-800-959-7775</b>.</div>
          <div style={{ marginTop: 6 }}>Envoyez ce sommaire et les feuillets T4 connexes au :</div>
          <div style={{ margin: "6px 0 6px 20px", lineHeight: 1.4 }}>CF de Jonquière<br />Programme T4<br />Case postale 1300, PDF Jonquière<br />Jonquière QC&nbsp;&nbsp;G7S 0L5</div>
          <h3 style={{ fontSize: 13, margin: "16px 0 6px" }}>Faire un paiement</h3>
          <div>Effectuez votre paiement en utilisant :</div>
          <ul>
            <li>les services bancaires en ligne, l'application mobile ou les services téléphoniques de votre banque canadienne ou de votre caisse de crédit canadienne;</li>
            <li>le service Mon paiement de l'ARC à <b>canada.ca/mon-paiement-arc</b> avec votre carte de débit activée portant un logo Visa Débit ou Mastercard Débit;</li>
            <li>le débit préautorisé (DPA) à <b>canada.ca/arc-services-ouverture-session</b> qui vous permet d'établir des paiements, de payer un montant dû et de consulter ou modifier votre compte;</li>
            <li>le bouton « Procéder à un paiement » dans la page « Voir et payer le solde du compte » de Mon dossier d'entreprise;</li>
            <li>votre carte de crédit, Virement Interac ou PayPal auprès de l'un des tiers fournisseurs de services, moyennant des frais.</li>
          </ul>
          <div>Pour en savoir plus, allez à <b>canada.ca/paiements</b>.</div>
          <div style={{ fontSize: 9, lineHeight: 1.35, marginTop: 12 }}>Les renseignements personnels (y compris le NAS) sont recueillis et utilisés aux fins d'appliquer ou d'exécuter la Loi de l'impôt sur le revenu et des programmes et activités connexes. Les renseignements recueillis peuvent être communiqués à une autre institution gouvernementale dans la mesure où le droit l'autorise. Selon la Loi sur la protection des renseignements personnels, les particuliers ont le droit à la protection, à l'accès et à la correction de leurs renseignements personnels, et de déposer une plainte auprès du Commissaire à la protection de la vie privée du Canada. Consultez le fichier ARC PPU 047 sur Info Source à <b>canada.ca/arc-info-source</b>.</div>
        </div>
      </div>
    </div>
  );
}

function T4Summary() {
  const currentYear = new Date().getFullYear();
  const [year] = useState(currentYear);
  const [employer, setEmployer] = useState(null);
  const [summary, setSummary] = useState(null);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`${API_URL}/api/v1/payroll/taxes/t4-sum-preview?year=${year}`, {
      headers: authHeaders(),
    })
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setEmployer(data.employer || null);
        setSummary(data.summary || null);
        setContact(data.contact || null);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError("Could not load T4 Summary data: " + e.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [year]);

  const hasData = !loading && !error && employer && summary && contact;

  return (
    <div style={{ background: "#EDEFF2", fontFamily: "Arial, Helvetica, sans-serif", color: "#000" }}>
      <style>{`
        .t4-page { background:#fff; width:900px; max-width:100%; min-height:1160px; margin:24px auto; padding:26px 28px; box-shadow:0 1px 6px rgba(16,30,40,.16); font-size:10px; }
        @media print {
          @page { size: letter; margin: 0; }
          .t4-noprint { display: none !important; }
          .t4-page { box-shadow: none; margin: 0; width: 100%; max-width: none; min-height: 0; padding: 0.4in; page-break-after: always; }
          .t4-page:last-child { page-break-after: auto; }
        }
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
          {loading ? "Loading T4 Summary data..." :
           error ? "Error loading T4 Summary" :
           `T4 Summary preview for ${year}, 2 pages. Print or Save as PDF.`}
        </span>
      </div>

      {loading && (
        <div className="t4-page" style={{ textAlign: "center", padding: 60, fontSize: 14 }}>
          Loading T4 Summary data for {year}...
        </div>
      )}

      {error && !loading && (
        <div className="t4-page" style={{ padding: 40 }}>
          <div style={{
            background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8,
            padding: "12px 16px", color: "#991B1B", fontSize: 14, fontWeight: 600,
          }}>
            {error}
          </div>
        </div>
      )}

      {hasData && <Page1 year={year} employer={employer} summary={summary} contact={contact} />}
      {hasData && <Page2 />}
    </div>
  );
}

export default T4Summary;