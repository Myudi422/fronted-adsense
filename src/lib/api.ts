import axios from 'axios';
import { AdSenseAccount, TodayEarnings, DomainBreakdownResponse, MultiAccountSummary } from '@/types/adsense';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 30000,
});

export const adsenseApi = {
  // Account management
  getAccounts: async (): Promise<AdSenseAccount[]> => {
    const response = await api.get('/accounts');
    return response.data;
  },

  getAccount: async (accountKey: string): Promise<AdSenseAccount> => {
    const response = await api.get(`/accounts/${accountKey}`);
    return response.data;
  },

  // Earnings data
  getTodayEarnings: async (
    accountKey: string,
    dateFilter?: 'today' | 'yesterday' | 'custom' | 'range',
    customDate?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TodayEarnings> => {
    const params = new URLSearchParams();
    if (dateFilter) params.append('date_filter', dateFilter);
    if (customDate) params.append('custom_date', customDate);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    // Debug logging for range requests
    if (dateFilter === 'range') {
      console.log('Date range request for earnings:', { accountKey, startDate, endDate, params: params.toString() });
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required for range filter');
      }
    }
    
    const response = await api.get(`/today-earnings/${accountKey}?${params}`);
    return response.data;
  },

  // Get combined earnings from all active accounts
  getAllAccountsEarnings: async (
    dateFilter?: 'today' | 'yesterday' | 'custom' | 'range',
    customDate?: string,
    startDate?: string,
    endDate?: string
  ): Promise<MultiAccountSummary> => {
    const params = new URLSearchParams();
    if (dateFilter) params.append('date_filter', dateFilter);
    if (customDate) params.append('custom_date', customDate);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    // Debug logging for range requests
    if (dateFilter === 'range') {
      console.log('Date range request for summary:', { startDate, endDate, params: params.toString() });
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required for range filter');
      }
    }
    
    const response = await api.get(`/summary?${params}`);
    return response.data;
  },

  getDomainEarnings: async (
    accountKey: string,
    domainFilter?: string,
    dateFilter?: 'today' | 'yesterday' | 'custom' | 'range',
    customDate?: string,
    startDate?: string,
    endDate?: string
  ): Promise<DomainBreakdownResponse> => {
    const params = new URLSearchParams();
    if (domainFilter) params.append('domain', domainFilter);
    if (dateFilter) params.append('date_filter', dateFilter);
    if (customDate) params.append('custom_date', customDate);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    // Debug logging for range requests
    if (dateFilter === 'range') {
      console.log('Date range request:', { accountKey, startDate, endDate, params: params.toString() });
      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required for range filter');
      }
    }
    
    const response = await api.get(`/domain-earnings/${accountKey}?${params}`);
    return response.data;
  },

  // Account connection
  connectAccount: async (accountKey: string) => {
    const response = await api.get(`/accounts/${accountKey}/connect`);
    return response.data;
  },

  // Multi-account summary
  getSummary: async () => {
    const response = await api.get('/summary');
    return response.data;
  },
};

export default api;