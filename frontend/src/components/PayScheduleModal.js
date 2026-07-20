import React, { useState, useEffect } from "react";

const API = process.env.REACT_APP_API_URL || "https://api.getnovala.com";

function authHeaders() {
    const token = localStorage.getItem("access_token") || localStorage.getItem("token");
    return { "Authorization": "Bearer " + token, "Content-Type": "application/json" };
}

function todayISO() {
    const d = new Date();
    return d.toISOString().split("T")[0];
}

function addDays(iso, days) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
}

function lastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function autoGenerateName(freq, day1, day2, payDayOfWeek) {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    switch (freq) {
        case "weekly":
            return "Weekly - " + (days[payDayOfWeek] || "Fridays");
        case "biweekly":
            return "Bi-weekly - " + (days[payDayOfWeek] || "Fridays");
        case "semimonthly":
            const d1Label = day1 === 15 ? "15th" : (day1 + "th");
            const d2Label = day2 === 31 ? "End of Month" : (day2 + "th");
            return "Semi-monthly - " + d1Label + " and " + d2Label;
        case "monthly":
            return "Monthly - End of Month";
        case "4week":
            return "4-week schedule";
        default:
            return "Custom schedule";
    }
}

function computePreviewDates(freq, firstPayDate, day1, day2, count) {
    const preview = [];
    if (!firstPayDate) return preview;

    if (freq === "weekly") {
        let d = firstPayDate;
        for (let i = 0; i < count; i++) {
            const periodEnd = addDays(d, -1);
            const periodStart = addDays(periodEnd, -6);
            preview.push({ pay_date: d, period_start: periodStart, period_end: periodEnd });
            d = addDays(d, 7);
        }
    } else if (freq === "biweekly") {
        let d = firstPayDate;
        for (let i = 0; i < count; i++) {
            const periodEnd = addDays(d, -1);
            const periodStart = addDays(periodEnd, -13);
            preview.push({ pay_date: d, period_start: periodStart, period_end: periodEnd });
            d = addDays(d, 14);
        }
    } else if (freq === "semimonthly") {
        const startDate = new Date(firstPayDate + "T00:00:00");
        let year = startDate.getFullYear();
        let month = startDate.getMonth() + 1;
        let usedFirst = startDate.getDate() <= 15;
        for (let i = 0; i < count; i++) {
            const last = lastDayOfMonth(year, month);
            const d1 = Math.min(day1 || 15, last);
            const d2 = Math.min(day2 || last, last);
            if (usedFirst) {
                const payStr = year + "-" + String(month).padStart(2, "0") + "-" + String(d1).padStart(2, "0");
                const periodStart = year + "-" + String(month).padStart(2, "0") + "-01";
                const periodEnd = year + "-" + String(month).padStart(2, "0") + "-" + String(d1).padStart(2, "0");
                preview.push({ pay_date: payStr, period_start: periodStart, period_end: periodEnd });
                usedFirst = false;
            } else {
                const payStr = year + "-" + String(month).padStart(2, "0") + "-" + String(d2).padStart(2, "0");
                const periodStart = year + "-" + String(month).padStart(2, "0") + "-" + String(d1 + 1).padStart(2, "0");
                const periodEnd = year + "-" + String(month).padStart(2, "0") + "-" + String(last).padStart(2, "0");
                preview.push({ pay_date: payStr, period_start: periodStart, period_end: periodEnd });
                usedFirst = true;
                month++;
                if (month > 12) { month = 1; year++; }
            }
        }
    } else if (freq === "monthly") {
        let year = new Date(firstPayDate + "T00:00:00").getFullYear();
        let month = new Date(firstPayDate + "T00:00:00").getMonth() + 1;
        for (let i = 0; i < count; i++) {
            const last = lastDayOfMonth(year, month);
            const payStr = year + "-" + String(month).padStart(2, "0") + "-" + String(last).padStart(2, "0");
            const periodStart = year + "-" + String(month).padStart(2, "0") + "-01";
            const periodEnd = year + "-" + String(month).padStart(2, "0") + "-" + String(last).padStart(2, "0");
            preview.push({ pay_date: payStr, period_start: periodStart, period_end: periodEnd });
            month++;
            if (month > 12) { month = 1; year++; }
        }
    }
    return preview;
}

function formatShort(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

const FREQUENCIES = [
    { value: "weekly", label: "Weekly", periods: 52 },
    { value: "biweekly", label: "Bi-weekly", periods: 26 },
    { value: "semimonthly", label: "Semi-monthly", periods: 24 },
    { value: "monthly", label: "Monthly", periods: 12 },
    { value: "4week", label: "4-week", periods: 13 },
    { value: "custom", label: "Custom", periods: null },
];

export default function PayScheduleModal({ schedule, onClose }) {
    const isEdit = !!schedule;

    const [frequency, setFrequency] = useState(schedule?.frequency || "semimonthly");
    const [payDayOfWeek, setPayDayOfWeek] = useState(schedule?.pay_day_of_week ?? 4);
    const [payDay1, setPayDay1] = useState(schedule?.pay_day_1 ?? 15);
    const [payDay2, setPayDay2] = useState(schedule?.pay_day_2 ?? 31);
    const [firstPayDate, setFirstPayDate] = useState(schedule?.first_pay_date || todayISO());
    const [name, setName] = useState(schedule?.name || "");
    const [holidayShift, setHolidayShift] = useState(schedule?.holiday_shift ?? true);
    const [weekendShift, setWeekendShift] = useState(schedule?.weekend_shift ?? true);
    const [autoRunEnabled, setAutoRunEnabled] = useState(schedule?.auto_run_enabled ?? false);
    const [isDefault, setIsDefault] = useState(schedule?.is_default ?? false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!schedule) {
            setName(autoGenerateName(frequency, payDay1, payDay2, payDayOfWeek));
        }
    }, [frequency, payDay1, payDay2, payDayOfWeek, schedule]);

    const preview = computePreviewDates(frequency, firstPayDate, payDay1, payDay2, 6);

    async function handleSave() {
        setError("");
        if (!name.trim()) {
            setError("Please enter a schedule name");
            return;
        }
        if (!firstPayDate) {
            setError("Please pick a first pay date");
            return;
        }

        setSaving(true);
        const firstPreview = preview[0];
        const body = {
            name: name.trim(),
            frequency: frequency,
            pay_day_of_week: (frequency === "weekly" || frequency === "biweekly") ? payDayOfWeek : null,
            pay_day_1: frequency === "semimonthly" ? payDay1 : null,
            pay_day_2: frequency === "semimonthly" ? payDay2 : null,
            first_pay_date: firstPayDate,
            first_period_start: firstPreview?.period_start || firstPayDate,
            first_period_end: firstPreview?.period_end || firstPayDate,
            holiday_shift: holidayShift,
            weekend_shift: weekendShift,
            auto_run_enabled: autoRunEnabled,
            auto_run_days_before: 2,
            is_default: isDefault,
            color: "#15A08C",
        };

        try {
            const url = isEdit
                ? API + "/api/v1/payroll/schedules/" + schedule.id
                : API + "/api/v1/payroll/schedules";
            const method = isEdit ? "PATCH" : "POST";
            const res = await fetch(url, {
                method: method,
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                setError(errData.detail || ("HTTP " + res.status));
                setSaving(false);
                return;
            }
            setSaving(false);
            onClose(true);
        } catch (err) {
            setError("Could not save: " + err.message);
            setSaving(false);
        }
    }

    return (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(14, 26, 26, 0.45)", zIndex: 1000,
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            paddingTop: 40, overflowY: "auto"
        }}>
            <div style={{
                background: "#FFFFFF", borderRadius: 12, maxWidth: 640, width: "90%",
                marginBottom: 40, overflow: "hidden", fontFamily: "Inter, -apple-system, sans-serif"
            }}>
                <div style={{
                    padding: "20px 24px", borderBottom: "1px solid #E5E7EB",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#15A08C", letterSpacing: "0.5px", marginBottom: 4 }}>
                            {isEdit ? "EDIT" : "CREATE NEW"}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: "#000000" }}>
                            {isEdit ? "Edit pay schedule" : "Add pay schedule"}
                        </div>
                    </div>
                    <button onClick={() => onClose(false)} style={{
                        width: 32, height: 32, borderRadius: 8, border: "none",
                        background: "transparent", cursor: "pointer", fontSize: 20, color: "#1A2332"
                    }}>×</button>
                </div>

                <div style={{ padding: 24 }}>

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, color: "#1A2332", marginBottom: 8, fontWeight: 500 }}>Pay frequency</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                            {FREQUENCIES.map(f => (
                                <div
                                    key={f.value}
                                    onClick={() => setFrequency(f.value)}
                                    style={{
                                        border: frequency === f.value ? "2px solid #15A08C" : "1px solid #E5E7EB",
                                        borderRadius: 8, padding: "10px 12px", textAlign: "center",
                                        background: frequency === f.value ? "#E1F5EE" : "#FFFFFF",
                                        cursor: "pointer"
                                    }}
                                >
                                    <div style={{ fontSize: 13, fontWeight: 600, color: frequency === f.value ? "#04342C" : "#000000" }}>{f.label}</div>
                                    <div style={{ fontSize: 11, color: frequency === f.value ? "#0F6E56" : "#1A2332" }}>
                                        {f.periods ? f.periods + " per year" : "You choose"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {frequency === "semimonthly" && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, color: "#1A2332", marginBottom: 8, fontWeight: 500 }}>Pay days</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 12 }}>
                                    <div style={{ fontSize: 11, color: "#1A2332", marginBottom: 4, fontWeight: 500 }}>FIRST RUN</div>
                                    <select value={payDay1} onChange={(e) => setPayDay1(parseInt(e.target.value))}
                                        style={{ fontSize: 14, fontWeight: 600, color: "#000000", border: "none", background: "transparent", width: "100%", cursor: "pointer" }}>
                                        {[10, 15, 20, 25].map(d => <option key={d} value={d}>{d}th of month</option>)}
                                    </select>
                                </div>
                                <div style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 12 }}>
                                    <div style={{ fontSize: 11, color: "#1A2332", marginBottom: 4, fontWeight: 500 }}>SECOND RUN</div>
                                    <select value={payDay2} onChange={(e) => setPayDay2(parseInt(e.target.value))}
                                        style={{ fontSize: 14, fontWeight: 600, color: "#000000", border: "none", background: "transparent", width: "100%", cursor: "pointer" }}>
                                        <option value={25}>25th of month</option>
                                        <option value={30}>30th of month</option>
                                        <option value={31}>Last day of month</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {(frequency === "weekly" || frequency === "biweekly") && (
                        <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, color: "#1A2332", marginBottom: 8, fontWeight: 500 }}>Pay day of week</div>
                            <div style={{ border: "1px solid #E5E7EB", borderRadius: 8, padding: 12 }}>
                                <select value={payDayOfWeek} onChange={(e) => setPayDayOfWeek(parseInt(e.target.value))}
                                    style={{ fontSize: 14, fontWeight: 600, color: "#000000", border: "none", background: "transparent", width: "100%", cursor: "pointer" }}>
                                    <option value={0}>Mondays</option>
                                    <option value={1}>Tuesdays</option>
                                    <option value={2}>Wednesdays</option>
                                    <option value={3}>Thursdays</option>
                                    <option value={4}>Fridays</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, color: "#1A2332", marginBottom: 8, fontWeight: 500 }}>First pay date</div>
                        <input type="date" value={firstPayDate} onChange={(e) => setFirstPayDate(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: "#000000", fontFamily: "inherit" }} />
                        <div style={{ fontSize: 11, color: "#1A2332", marginTop: 4 }}>The first payday for this schedule</div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, color: "#1A2332", marginBottom: 8, fontWeight: 500 }}>Schedule name</div>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                            style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, color: "#000000", fontFamily: "inherit" }} />
                        <div style={{ fontSize: 11, color: "#1A2332", marginTop: 4 }}>Auto-generated. You can customize.</div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, color: "#1A2332", marginBottom: 8, fontWeight: 500 }}>Smart options</div>
                        <div style={{ border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
                            {[
                                { key: "holiday", label: "Holiday handling", desc: "Move to previous business day if pay date is a holiday", value: holidayShift, setter: setHolidayShift },
                                { key: "weekend", label: "Weekend handling", desc: "Move to Friday if pay date falls on weekend", value: weekendShift, setter: setWeekendShift },
                                { key: "autorun", label: "Auto-run payroll", desc: "Automatically run 2 days before pay date", value: autoRunEnabled, setter: setAutoRunEnabled },
                                { key: "default", label: "Set as default", desc: "Auto-assign to new employees", value: isDefault, setter: setIsDefault },
                            ].map((opt, idx, arr) => (
                                <div key={opt.key} style={{
                                    padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between",
                                    borderBottom: idx < arr.length - 1 ? "1px solid #E5E7EB" : "none"
                                }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "#000000" }}>{opt.label}</div>
                                        <div style={{ fontSize: 12, color: "#1A2332" }}>{opt.desc}</div>
                                    </div>
                                    <div onClick={() => opt.setter(!opt.value)} style={{
                                        width: 36, height: 20, background: opt.value ? "#15A08C" : "#D3D1C7",
                                        borderRadius: 20, position: "relative", cursor: "pointer", transition: "background 0.15s"
                                    }}>
                                        <div style={{
                                            width: 16, height: 16, background: "white", borderRadius: "50%",
                                            position: "absolute", top: 2, left: opt.value ? 18 : 2, transition: "left 0.15s"
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {preview.length > 0 && (
                        <div style={{ background: "#E1F5EE", borderRadius: 8, padding: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "#0F6E56", letterSpacing: "0.5px", marginBottom: 8 }}>
                                UPCOMING 6 PAY RUNS PREVIEW
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 12 }}>
                                {preview.map((p, i) => (
                                    <div key={i} style={{ background: "#FFFFFF", borderRadius: 6, padding: "8px 10px" }}>
                                        <div style={{ color: "#04342C", fontWeight: 600 }}>{formatShort(p.pay_date)}</div>
                                        <div style={{ color: "#0F6E56", fontSize: 11 }}>
                                            {formatShort(p.period_start)} to {formatShort(p.period_end)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div style={{ marginTop: 16, padding: 12, background: "#FCEBEB", borderRadius: 8, color: "#791F1F", fontSize: 13 }}>{error}</div>
                    )}

                </div>

                <div style={{ padding: "16px 24px", borderTop: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
                    <button onClick={() => onClose(false)} disabled={saving}
                        style={{ background: "transparent", border: "1px solid #E5E7EB", color: "#000000", fontSize: 14, fontWeight: 600, padding: "10px 16px", borderRadius: 10, cursor: saving ? "not-allowed" : "pointer" }}>
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        style={{ background: "#0E1A1A", color: "white", fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: 10, cursor: saving ? "not-allowed" : "pointer", border: "none", opacity: saving ? 0.6 : 1 }}>
                        {saving ? "Saving..." : (isEdit ? "Save changes" : "Create schedule")}
                    </button>
                </div>
            </div>
        </div>
    );
}