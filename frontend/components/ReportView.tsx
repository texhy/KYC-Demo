"use client";

import type { VerificationReport } from "@/lib/types";

function consistencyMark(v?: boolean | null) {
  if (v === true) return <span className="ok">✓ consistent</span>;
  if (v === false) return <span className="no">✕ mismatch</span>;
  return <span className="unk">— unknown</span>;
}

export default function ReportView({ report }: { report: VerificationReport }) {
  return (
    <div>
      <div className="section-title">Summary</div>
      <div className="card">{report.summary}</div>

      {report.red_flags.length > 0 && (
        <>
          <div className="section-title">Red Flags</div>
          <div className="card">
            {report.red_flags.map((f, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <span className={`badge ${f.severity}`}>{f.severity}</span>{" "}
                <strong>{f.title}</strong>
                <div className="lane-sub">{f.detail}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {report.consistency_checks.length > 0 && (
        <>
          <div className="section-title">Consistency Checks</div>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Result</th>
                  <th>Detail</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {report.consistency_checks.map((c, i) => (
                  <tr key={i}>
                    <td>{c.check}</td>
                    <td>{consistencyMark(c.consistent)}</td>
                    <td>{c.detail}</td>
                    <td>
                      <span className={`badge ${c.severity}`}>{c.severity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {report.findings.length > 0 && (
        <>
          <div className="section-title">Findings</div>
          {report.findings.map((f, i) => (
            <div className="card" key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{f.title}</strong>
                <span className="badge low">{f.category} · {f.confidence}</span>
              </div>
              <div className="lane-sub" style={{ marginTop: 6 }}>{f.detail}</div>
              {f.citations.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {f.citations.map((c, j) => (
                    <div className="cite" key={j}>
                      {c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.url}</a> : "(no url)"} — {c.claim}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {report.open_questions.length > 0 && (
        <>
          <div className="section-title">Open Questions for the Underwriter</div>
          <div className="card">
            <ul className="q">
              {report.open_questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
