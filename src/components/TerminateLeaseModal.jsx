import { useState } from "react";
import { C } from "../constants/colors";
import { iSt, lSt } from "../styles/shared";
import { today } from "../utils/helpers";
import Btn from "./ui/Btn";

const TERMINATION_REASONS = [
  "Non-payment of rent",
  "Breach of tenancy agreement",
  "Property damage",
  "Illegal activity on premises",
  "Nuisance / disturbance to neighbours",
  "Subletting without permission",
  "Mutual agreement",
  "Other",
];

export default function TerminateLeaseModal({ tenantName, onConfirm, onClose }) {
  const [reason,   setReason]   = useState("");
  const [custom,   setCustom]   = useState("");
  const [endDate,  setEndDate]  = useState(today.toISOString().slice(0, 10));
  const [refund,   setRefund]   = useState("");

  const finalReason  = reason === "Other" ? custom.trim() : reason;
  const refundAmount = Number(refund) || 0;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(45,20,20,0.62)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: C.surface, border: `2px solid ${C.rose}88`, borderRadius: 16, padding: 28, width: "90%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>⛔</span>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.rose }}>Terminate Tenancy</div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
          You are terminating the tenancy of <b style={{ color: C.text }}>{tenantName}</b>. Their lease will be marked as <b style={{ color: C.rose }}>Terminated</b>, they will be moved to previous tenants, and their rent will be removed from all totals. This action cannot be undone.
        </div>

        {/* Termination date */}
        <div style={{ marginBottom: 14 }}>
          <label style={lSt}>Termination date</label>
          <input type="date" style={iSt} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        {/* Reason select */}
        <div style={{ marginBottom: reason === "Other" ? 10 : 14 }}>
          <label style={lSt}>Reason for termination *</label>
          <select
            style={iSt}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">— Select a reason —</option>
            {TERMINATION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Custom reason if "Other" */}
        {reason === "Other" && (
          <div style={{ marginBottom: 14 }}>
            <label style={lSt}>Describe the reason *</label>
            <textarea
              style={{ ...iSt, resize: "vertical", minHeight: 70 }}
              placeholder="Provide details…"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>
        )}

        {/* Refund amount */}
        <div style={{ marginBottom: 20 }}>
          <label style={lSt}>Amount refunded to tenant (GHS) <span style={{ color: C.faint, fontWeight: 400 }}>— leave 0 if none</span></label>
          <input
            type="number"
            min="0"
            style={iSt}
            placeholder="e.g. 5000"
            value={refund}
            onChange={(e) => setRefund(e.target.value)}
          />
          {refundAmount > 0 && (
            <div style={{ fontSize: 12, color: C.amber, marginTop: 5 }}>
              GHS {refundAmount.toLocaleString()} will be deducted from the total rent collected figures.
            </div>
          )}
        </div>

        {/* Warning notice */}
        <div style={{ background: C.roseBg, border: `1px solid ${C.rose}44`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.rose, marginBottom: 20, lineHeight: 1.6 }}>
          ⚠ Terminating a tenancy is different from ending a lease. It marks the tenancy as forcibly terminated and the tenant record will show "Terminated" status.
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn
            variant="danger"
            onClick={() => { if (!finalReason) return; onConfirm(finalReason, endDate, refundAmount); }}
            style={{ opacity: finalReason ? 1 : 0.45, background: C.rose, borderColor: C.rose }}
          >
            ⛔ Terminate Tenancy
          </Btn>
        </div>
      </div>
    </div>
  );
}
