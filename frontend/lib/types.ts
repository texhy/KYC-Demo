export type AgentEvent = {
  type:
    | "stage"
    | "agent_start"
    | "agent_done"
    | "reasoning"
    | "tool_call"
    | "tool_result"
    | "finding"
    | "extraction"
    | "research"
    | "report"
    | "error"
    | "done";
  agent?: "A" | "B" | "C" | "extractor" | "system" | null;
  message?: string | null;
  data?: Record<string, any> | null;
};

export type ResearchSource = {
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
};

export type Owner = {
  name?: string | null;
  home_address?: string | null;
  city_state_zip?: string | null;
  telephone?: string | null;
  ssn?: string | null;
  dob?: string | null;
  drivers_license?: string | null;
  percent_ownership?: string | null;
};

export type BankingReference = {
  name?: string | null;
  address?: string | null;
  telephone_and_contact?: string | null;
  account_number?: string | null;
};

export type TradeReference = {
  company_name?: string | null;
  telephone_and_contact?: string | null;
};

export type ApplicationData = {
  company_name?: string | null;
  dba?: string | null;
  state_of_incorporation?: string | null;
  fed_tax_id?: string | null;
  dnb_number?: string | null;
  business_address?: string | null;
  city_state_zip?: string | null;
  telephone_fax?: string | null;
  cell_phone?: string | null;
  website?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  business_type?: string | null;
  equipment_location?: string | null;
  time_in_business?: string | null;
  date_incorporated?: string | null;
  state_filed?: string | null;
  owners: Owner[];
  banking_references: BankingReference[];
  trade_references: TradeReference[];
  vendor_name?: string | null;
  amount_to_be_financed?: string | null;
  equipment_description?: string | null;
  finance_terms?: string | null;
  signature_title?: string | null;
  signature_date?: string | null;
};

export type IdData = {
  document_type?: string | null;
  issuing_authority?: string | null;
  full_name?: string | null;
  address?: string | null;
  dob?: string | null;
  id_number?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  sex?: string | null;
  tampering_signals: string[];
  authenticity_notes?: string | null;
};

export type Citation = { claim: string; url?: string | null; snippet?: string | null };

export type Finding = {
  title: string;
  detail: string;
  category: string;
  confidence: string;
  citations: Citation[];
};

export type CrossCheck = {
  check: string;
  consistent?: boolean | null;
  detail: string;
  severity: string;
};

export type RedFlag = { title: string; detail: string; severity: string };

export type VerificationReport = {
  summary: string;
  findings: Finding[];
  consistency_checks: CrossCheck[];
  red_flags: RedFlag[];
  open_questions: string[];
};

export type EvaluationStatus = "running" | "done" | "error";

export type EvaluationSummary = {
  id: string;
  status: EvaluationStatus;
  company_name?: string | null;
  loan_amount?: string | null;
  incorporation_state?: string | null;
  pdf_filename?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
  error?: string | null;
  has_pdf?: boolean;
  has_id?: boolean;
  id_mime?: string | null;
};

export type EvaluationList = {
  items: EvaluationSummary[];
  total: number;
  limit: number;
  offset: number;
};

export type EvaluationRecord = EvaluationSummary & {
  report?: VerificationReport | null;
  application?: ApplicationData | null;
  id?: IdData | null;
  research?: { sources?: ResearchSource[]; cost?: number; maps_url?: string } | null;
  events: AgentEvent[];
};
