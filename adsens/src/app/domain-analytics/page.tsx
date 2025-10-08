'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AdSenseAccount, DomainBreakdownResponse } from '@/types/adsense';
import { adsenseApi } from '@/lib/api';

export default function DomainAnalyticsPage() {
  const [accounts, setAccounts] = useState<AdSenseAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [domainData, setDomainData] = useState<DomainBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom' | 'range'>('today');
  const [customDate, setCustomDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadDomainData();
    }
  }, [selectedAccount, dateFilter, customDate, startDate, endDate, domainFilter]);

  const loadAccounts = async () => {
    try {
      const accountsData = await adsenseApi.getAccounts();
      setAccounts(accountsData);
      const activeAccount = accountsData.find(acc => acc.status === 'active');
      if (activeAccount) {
        setSelectedAccount(activeAccount.account_key);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDomainData = async () => {
    if (!selectedAccount) return;
    
    // Validate date range
    if (dateFilter === 'range' && (!startDate || !endDate)) {
      console.error('Start date and end date are required for range filter');
      return;
    }
    
    try {
      setLoading(true);
      
      if (selectedAccount === 'all') {
        // For "all accounts", we'll combine data from all active accounts
        const activeAccounts = accounts.filter(acc => acc.status === 'active');
        let combinedDomains: any[] = [];
        let totalEarnings = 0;
        let totalClicks = 0;
        let totalImpressions = 0;
        let totalPageViews = 0;
        
        for (const account of activeAccounts) {
          try {
            const accountData = await adsenseApi.getDomainEarnings(
              account.account_key,
              domainFilter || undefined,
              dateFilter,
              dateFilter === 'custom' ? customDate : undefined,
              dateFilter === 'range' ? startDate : undefined,
              dateFilter === 'range' ? endDate : undefined
            );
            
            combinedDomains = combinedDomains.concat(accountData.domains);
            totalEarnings += accountData.summary.total_earnings_micros;
            totalClicks += accountData.summary.total_clicks;
            totalImpressions += accountData.summary.total_impressions;
            totalPageViews += accountData.summary.total_page_views;
          } catch (err) {
            console.warn(`Error loading domain data for account ${account.account_key}:`, err);
          }
        }
        
        // Group domains by name and sum their values
        const domainMap = new Map();
        combinedDomains.forEach(domain => {
          if (domainMap.has(domain.domain)) {
            const existing = domainMap.get(domain.domain);
            domainMap.set(domain.domain, {
              ...existing,
              earnings_idr: (existing.earnings_idr || 0) + (domain.earnings_idr || 0),
              earnings_micros: existing.earnings_micros + domain.earnings_micros,
              clicks: existing.clicks + domain.clicks,
              impressions: existing.impressions + domain.impressions,
              page_views: existing.page_views + domain.page_views,
              ctr: existing.impressions + domain.impressions > 0 ? 
                   ((existing.clicks + domain.clicks) / (existing.impressions + domain.impressions) * 100) : 0
            });
          } else {
            domainMap.set(domain.domain, { ...domain });
          }
        });
        
        const combinedData = {
          date: new Date().toISOString().split('T')[0],
          account_key: 'all',
          account_id: 'combined',
          domain_filter: domainFilter,
          domains: Array.from(domainMap.values()),
          summary: {
            total_domains: domainMap.size,
            total_earnings_idr: totalEarnings,
            total_earnings_micros: totalEarnings,
            total_clicks: totalClicks,
            total_impressions: totalImpressions,
            total_page_views: totalPageViews,
            overall_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0,
            overall_cpm_idr: totalImpressions > 0 ? (totalEarnings / totalImpressions * 1000) : 0
          }
        };
        
        setDomainData(combinedData);
      } else {
        const data = await adsenseApi.getDomainEarnings(
          selectedAccount,
          domainFilter || undefined,
          dateFilter,
          dateFilter === 'custom' ? customDate : undefined,
          dateFilter === 'range' ? startDate : undefined,
          dateFilter === 'range' ? endDate : undefined
        );
        setDomainData(data);
      }
    } catch (err) {
      console.error('Error loading domain data:', err);
      setDomainData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const formatRPM = (rpm: number) => {
    if (rpm >= 1000) {
      return `Rp ${(rpm / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rpm);
  };

  return (
    <DashboardLayout
      accounts={accounts}
      selectedAccount={selectedAccount}
      onAccountChange={setSelectedAccount}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Domain Analytics</h1>
          <p className="mt-2 text-gray-600">
            Earnings breakdown by domain and subdomain
          </p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Filter
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'today' | 'yesterday' | 'custom' | 'range')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="custom">Custom Date</option>
                <option value="range">Date Range</option>
              </select>
            </div>
            
            {dateFilter === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Date
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
            
            {dateFilter === 'range' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain Filter
              </label>
              <input
                type="text"
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                placeholder="Filter by domain name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : domainData ? (
          <>
            {/* Summary */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(domainData.summary.total_earnings_micros || 0)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Total Earnings</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {domainData.summary.total_domains}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Domains</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {formatNumber(domainData.summary.total_impressions)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Total Impressions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {(domainData.summary.overall_ctr || 0).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Overall CTR</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">
                    {formatRPM(domainData.summary.overall_rpm_idr ?? 
                      (domainData.summary.total_impressions > 0 ? 
                        (domainData.summary.total_earnings_micros / domainData.summary.total_impressions * 1000) : 0))}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Overall RPM</div>
                </div>
              </div>
            </div>

            {/* Domain Breakdown */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Domain Breakdown
                {domainData.domain_filter && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (filtered by: {domainData.domain_filter})
                  </span>
                )}
              </h2>
              
              {domainData.domains.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Domain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Earnings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clicks
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Impressions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CTR
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CPM
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          RPM
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {domainData.domains.map((domain, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {domain.domain}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-green-600 font-medium">
                              {formatCurrency(domain.earnings_micros || 0)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatNumber(domain.earnings_micros || 0)} micros
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(domain.clicks)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(domain.impressions)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (domain.ctr || 0) >= 2 ? 'bg-green-100 text-green-800' :
                              (domain.ctr || 0) >= 1 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {(domain.ctr || 0).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(domain.cpm_idr || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (domain.rpm_idr || 0) >= 300 ? 'bg-green-100 text-green-800' :
                              (domain.rpm_idr || 0) >= 200 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {formatRPM(domain.rpm_idr || 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🌐</div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No Domains Found</h3>
                  <p className="text-gray-500">
                    No domain data available for the selected filters.
                  </p>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">
                    {selectedAccount === 'all' ? 'Accounts' : 'Account ID'}
                  </div>
                  <div className="font-medium">
                    {selectedAccount === 'all' ? 
                      `${accounts.filter(acc => acc.status === 'active').length} akun aktif` : 
                      domainData.account_id}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium">{domainData.date}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Domains</div>
                  <div className="font-medium">{domainData.summary.total_domains}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🌐</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              No domain analytics data found for the selected account and date.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}