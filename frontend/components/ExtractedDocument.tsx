"use client";

import type { ApplicationData, IdData } from "@/lib/types";

function FieldTable({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-slate-100">
        {rows.map(([label, v], i) => (
          <tr key={i} className="align-top">
            <th className="w-2/5 whitespace-nowrap py-2 pr-4 text-left font-medium text-slate-400">{label}</th>
            <td className="py-2 text-slate-700">{v ? v : <span className="text-slate-300">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {title && <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h3>}
      {children}
    </div>
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
    <div className="space-y-6">
      {application && (
        <>
          <Card title="Company">
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
          </Card>

          {application.owners?.length > 0 && (
            <Card title="Owners">
              <div className="space-y-4">
                {application.owners.map((o, i) => (
                  <div key={i} className={i > 0 ? "border-t border-slate-100 pt-4" : ""}>
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
              </div>
            </Card>
          )}

          {application.banking_references?.length > 0 && (
            <Card title="Banking References">
              <div className="space-y-4">
                {application.banking_references.map((b, i) => (
                  <div key={i} className={i > 0 ? "border-t border-slate-100 pt-4" : ""}>
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
              </div>
            </Card>
          )}

          {application.trade_references?.length > 0 && (
            <Card title="Trade References">
              <div className="space-y-4">
                {application.trade_references.map((t, i) => (
                  <div key={i} className={i > 0 ? "border-t border-slate-100 pt-4" : ""}>
                    <FieldTable
                      rows={[
                        ["Company name", t.company_name],
                        ["Telephone / Contact", t.telephone_and_contact],
                      ]}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Financing">
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
          </Card>
        </>
      )}

      {id && (
        <Card title="Supporting ID">
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
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
              <strong className="text-sm text-amber-800">Tampering signals</strong>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-700">
                {id.tampering_signals.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {id.authenticity_notes && (
            <p className="mt-3 text-sm text-slate-500">{id.authenticity_notes}</p>
          )}
        </Card>
      )}
    </div>
  );
}
