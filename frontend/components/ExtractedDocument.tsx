"use client";

import type { ApplicationData, IdData } from "@/lib/types";

function val(v?: string | null) {
  if (v === null || v === undefined || v === "") return <span className="lane-sub">—</span>;
  return <>{v}</>;
}

function FieldTable({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <table>
      <tbody>
        {rows.map(([label, v], i) => (
          <tr key={i}>
            <th style={{ width: "40%", whiteSpace: "nowrap" }}>{label}</th>
            <td>{val(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ExtractedDocument({
  application,
  id,
}: {
  application?: ApplicationData | null;
  id?: IdData | null;
}) {
  if (!application && !id) return null;

  return (
    <div>
      <div className="section-title" style={{ marginTop: 0 }}>Extracted from PDF Application</div>

      {application && (
        <>
          <div className="card">
            <FieldTable
              rows={[
                ["Company name", application.company_name],
                ["DBA", application.dba],
                ["Business type", application.business_type],
                ["State of incorporation", application.state_of_incorporation],
                ["Fed Tax ID", application.fed_tax_id],
                ["D&B number", application.dnb_number],
                ["Business address", application.business_address],
                ["City / State / ZIP", application.city_state_zip],
                ["Telephone / Fax", application.telephone_fax],
                ["Cell phone", application.cell_phone],
                ["Website", application.website],
                ["Contact name", application.contact_name],
                ["Contact email", application.contact_email],
                ["Equipment location", application.equipment_location],
                ["Time in business", application.time_in_business],
                ["Date incorporated", application.date_incorporated],
                ["State filed", application.state_filed],
              ]}
            />
          </div>

          {application.owners?.length > 0 && (
            <>
              <div className="section-title">Owners</div>
              {application.owners.map((o, i) => (
                <div className="card" key={i} style={{ marginBottom: 12 }}>
                  <FieldTable
                    rows={[
                      ["Name", o.name],
                      ["Home address", o.home_address],
                      ["City / State / ZIP", o.city_state_zip],
                      ["Telephone", o.telephone],
                      ["SSN", o.ssn],
                      ["Date of birth", o.dob],
                      ["Driver's license", o.drivers_license],
                      ["% ownership", o.percent_ownership],
                    ]}
                  />
                </div>
              ))}
            </>
          )}

          {application.banking_references?.length > 0 && (
            <>
              <div className="section-title">Banking References</div>
              {application.banking_references.map((b, i) => (
                <div className="card" key={i} style={{ marginBottom: 12 }}>
                  <FieldTable
                    rows={[
                      ["Name", b.name],
                      ["Address", b.address],
                      ["Telephone / Contact", b.telephone_and_contact],
                      ["Account number", b.account_number],
                    ]}
                  />
                </div>
              ))}
            </>
          )}

          {application.trade_references?.length > 0 && (
            <>
              <div className="section-title">Trade References</div>
              {application.trade_references.map((t, i) => (
                <div className="card" key={i} style={{ marginBottom: 12 }}>
                  <FieldTable
                    rows={[
                      ["Company name", t.company_name],
                      ["Telephone / Contact", t.telephone_and_contact],
                    ]}
                  />
                </div>
              ))}
            </>
          )}

          <div className="section-title">Financing</div>
          <div className="card">
            <FieldTable
              rows={[
                ["Vendor name", application.vendor_name],
                ["Amount to be financed", application.amount_to_be_financed],
                ["Equipment description", application.equipment_description],
                ["Finance terms", application.finance_terms],
                ["Signature title", application.signature_title],
                ["Signature date", application.signature_date],
              ]}
            />
          </div>
        </>
      )}

      {id && (
        <>
          <div className="section-title">Extracted from Supporting ID</div>
          <div className="card">
            <FieldTable
              rows={[
                ["Document type", id.document_type],
                ["Issuing authority", id.issuing_authority],
                ["Full name", id.full_name],
                ["Address", id.address],
                ["Date of birth", id.dob],
                ["ID number", id.id_number],
                ["Issue date", id.issue_date],
                ["Expiry date", id.expiry_date],
                ["Sex", id.sex],
              ]}
            />
            {id.tampering_signals?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>Tampering signals</strong>
                <ul className="q">
                  {id.tampering_signals.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {id.authenticity_notes && (
              <div className="lane-sub" style={{ marginTop: 8 }}>{id.authenticity_notes}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
