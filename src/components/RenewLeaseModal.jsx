import { useState } from "react";
import { C } from "../constants/colors";
import { iSt, lSt } from "../styles/shared";
import Btn from "./ui/Btn";

export default function RenewLeaseModal({ tenantName, currentLeaseEnd, currentMonthlyRent, onConfirm, onClose }) {
  const [start,        setStart]        = useState(currentLeaseEnd || "");
  const [end,          setEnd]          = useState("");
  const [monthlyRent,  setMonthlyRent]  = useState(String(currentMonthlyRent || ""));
  const [advMonths,    setAdvMonths]    = useState("");
  const [depPaid,      setDepPaid]      = useState(false);
  const [depAmount,    setDepAmount]    = useState("");
  const [balanceOwed,  setBalanceOwed]  = useState("");

  const rent    = Number(monthlyRent) || 0;
  const adv     = Number(advMonths)   || 0;
  const advAmt  = rent * adv;
  const dep     = Number(depAmount)   || (depPaid ? rent : 0);
  const total   = advAmt + dep;
  const balance = Number(balanceOwed) || 0;

  function submit() {
    if (!start) return;
    onConfirm({
      leaseStart:    start,
      leaseEnd:      end     || undefined,
      monthlyRent:   rent    || undefined,
      advanceMonths: adv     || undefined,
      advanceAmount: advAmt  || undefined,
      depositPaid:   depPaid,
      depositAmount: dep     || undefined,
      balanceOwed:   balance,
    });
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(45,37,32,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, backdropFilter: "blur(3px)", fontFamily: "Georgia,serif" }}
    >
      <div style={{ background: "#fffdf9", borderRadius: 16, padding: "32px 36px", maxWidth: 500, width: "94%", boxShadow: "0 12px 60px rgba(0,0,0,0.18)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 8 }}>🔄 Renew Lease</div>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, marginBottom: 22 }}>
          Renewing <b style={{ color: C.text }}>{tenantName}</b>'s lease. The previous term will be archived. Enter the new lease details below.
        </p>

        {/* Dates */}
        <div style={{ fontSize: 11, color: C.teal, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>New Lease Period</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div>
            <label style={lSt}>Start Date *</label>
            <input type="date" style={iSt} value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label style={lSt}>End Date</label>
            <input type="date" style={iSt} value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        {/* Rent & Advance */}
        <div style={{ fontSize: 11, color: C.teal, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Rent & Advance</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div>
            <label style={lSt}>Monthly Rent (GHS)</label>
            <input type="number" min="0" style={iSt} value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} placeholder="e.g. 2500" />
          </div>
          <div>
            <label style={lSt}>Months Advance Paid</label>
            <input type="number" min="0" style={iSt} value={advMonths} onChange={(e) => setAdvMonths(e.target.value)} placeholder="e.g. 12" />
          </div>
        </div>

        {/* Deposit */}
        <div style={{ fontSize: 11, color: C.teal, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>Security Deposit</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
          <div>
            <label style={lSt}>Deposit Amount (GHS)</label>
            <input type="number" min="0" style={iSt} value={depAmount} onChange={(e) => setDepAmount(e.target.value)} placeholder={rent > 0 ? `e.g. ${rent.toLocaleString()}` : "e.g. 2500"} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
            <input type="checkbox" id="renew-dep" checked={depPaid} onChange={(e) => setDepPaid(e.target.checked)} />
            <label style={{ ...lSt, marginBottom: 0, cursor: "pointer" }} htmlFor="renew-dep">Deposit Paid?</label>
          </div>
        </div>

        {/* Balance */}
        <div style={{ marginBottom: 18 }}>
          <label style={lSt}>Balance Still Owed (GHS) <span style={{ color: C.faint, fontWeight: 400 }}>— amount not yet paid</span></label>
          <input type="number" min="0" style={iSt} value={balanceOwed} onChange={(e) => setBalanceOwed(e.target.value)} placeholder="0 if fully paid" />
        </div>

        {/* Calculation preview */}
        {rent > 0 && (
          <div style={{ background: C.tealBg, border: `1px solid ${C.teal}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: C.teal, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Payment Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 16px", fontSize: 13 }}>
              {adv > 0 && <><span style={{ color: C.muted }}>Advance ({adv} mo × GHS {rent.toLocaleString()})</span><span style={{ fontWeight: 600, textAlign: "right" }}>GHS {advAmt.toLocaleString()}</span></>}
              {dep > 0  && <><span style={{ color: C.muted }}>Security Deposit</span><span style={{ fontWeight: 600, textAlign: "right" }}>{depPaid ? "✓ " : "✗ "}GHS {dep.toLocaleString()}</span></>}
              {(adv > 0 || dep > 0) && <>
                <span style={{ color: C.teal, fontWeight: 700, borderTop: `1px solid ${C.teal}44`, paddingTop: 4 }}>Total Expected</span>
                <span style={{ color: C.teal, fontWeight: 700, textAlign: "right", borderTop: `1px solid ${C.teal}44`, paddingTop: 4 }}>GHS {total.toLocaleString()}</span>
              </>}
              {balance > 0 && <><span style={{ color: C.rose, fontWeight: 700 }}>Balance Owed</span><span style={{ color: C.rose, fontWeight: 700, textAlign: "right" }}>GHS {balance.toLocaleString()}</span></>}
              {balance > 0 && <><span style={{ color: C.sage, fontWeight: 700 }}>Amount Received</span><span style={{ color: C.sage, fontWeight: 700, textAlign: "right" }}>GHS {(total - balance).toLocaleString()}</span></>}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Btn small variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn small onClick={submit} disabled={!start}>Renew Lease</Btn>
        </div>
      </div>
    </div>
  );
}
