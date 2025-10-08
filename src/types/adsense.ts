export interface AdSenseAccount {
  account_key: string;
  account_id: string;
  display_name: string;
  description: string;
  status: 'active' | 'inactive' | 'error';
  metadata: {
    website_url?: string;
    category?: string;
    notes?: string;
  };
}

export interface TodayEarnings {
  date: string;
  account_key: string;
  account_id: string;
  earnings_idr: number;
  earnings_micros: number;
  clicks: number;
  impressions: number;
  page_views: number;
  ctr: number;
  page_ctr?: number;
  cpm_idr: number;
  rpm_idr: number;
  cpc_idr?: number;
  impressions_per_page?: number;
  earnings_per_page_idr?: number;
  data_age_days: number;
  note?: string;
}

export interface DomainEarnings {
  domain: string;
  earnings_idr: number;
  earnings_micros: number;
  clicks: number;
  impressions: number;
  page_views: number;
  ctr: number;
  page_ctr?: number;
  cpm_idr: number;
  rpm_idr: number;
  cpc_idr?: number;
  impressions_per_page?: number;
  earnings_per_page_idr?: number;
}

export interface DomainBreakdownResponse {
  date: string;
  account_key: string;
  account_id: string;
  domain_filter?: string;
  domains: DomainEarnings[];
  summary: {
    total_domains: number;
    total_earnings_idr: number;
    total_earnings_micros: number;
    total_clicks: number;
    total_impressions: number;
    total_page_views: number;
    overall_ctr: number;
    overall_page_ctr?: number;
    overall_cpm_idr: number;
    overall_rpm_idr?: number;
    overall_cpc_idr?: number;
    overall_impressions_per_page?: number;
    overall_earnings_per_page_idr?: number;
  };
}

export interface AccountSummary {
  account_key: string;
  account_id: string;
  display_name: string;
  status: string;
  earnings_idr: number;
  clicks: number;
  impressions: number;
  page_views: number;
  rpm_idr: number;
}

export interface MultiAccountSummary {
  date: string;
  total_accounts: number;
  total_earnings_idr: number;
  total_earnings_micros: number;
  total_clicks: number;
  total_impressions: number;
  total_page_views: number;
  overall_ctr: number;
  overall_cpm_idr: number;
  overall_rpm_idr: number;
  accounts: AccountSummary[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}