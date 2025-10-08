'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { adsenseApi } from '@/lib/api';
import { AdSenseAccount, TodayEarnings, MultiAccountSummary } from '@/types/adsense';

// Helper function to normalize earnings data
const normalizeEarningsData = (data: TodayEarnings | MultiAccountSummary): TodayEarnings => {
  if ('total_earnings_idr' in data) {
    // MultiAccountSummary
    return {
      date: data.date,
      account_key: 'all',
      account_id: 'combined',
      earnings_idr: data.total_earnings_idr,
      earnings_micros: data.total_earnings_micros,
      clicks: data.total_clicks,
      impressions: data.total_impressions,
      page_views: data.total_page_views,
      ctr: data.overall_ctr,
      cpm_idr: data.overall_cpm_idr,
      rpm_idr: data.overall_rpm_idr,
      data_age_days: 0,
      note: `Combined data from ${data.total_accounts} accounts`
    };
  }
  return data as TodayEarnings;
};

export default function CTRPage() {
  const [accounts, setAccounts] = useState<AdSenseAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<TodayEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'custom' | 'range'>('today');
  const [customDate, setCustomDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadEarnings();
    }
  }, [selectedAccount, dateFilter, customDate, startDate, endDate]);

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

  const loadEarnings = async () => {
    if (!selectedAccount) return;
    
    if (dateFilter === 'range' && (!startDate || !endDate)) {
      console.error('Start date and end date are required for range filter');
      return;
    }
    
    try {
      setLoading(true);
      if (selectedAccount === 'all') {
        const earningsData = await adsenseApi.getAllAccountsEarnings(
          dateFilter,
          dateFilter === 'custom' ? customDate : undefined,
          dateFilter === 'range' ? startDate : undefined,
          dateFilter === 'range' ? endDate : undefined
        );
        setEarnings(normalizeEarningsData(earningsData));
      } else {
        const earningsData = await adsenseApi.getTodayEarnings(
          selectedAccount,
          dateFilter,
          dateFilter === 'custom' ? customDate : undefined,
          dateFilter === 'range' ? startDate : undefined,
          dateFilter === 'range' ? endDate : undefined
        );
        setEarnings(normalizeEarningsData(earningsData));
      }
    } catch (err) {
      console.error('Error loading earnings:', err);
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  const getCTRCategory = (ctr: number) => {
    if (ctr >= 2.0) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (ctr >= 1.0) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (ctr >= 0.5) return { label: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { label: 'Below Average', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  return (
    <DashboardLayout
      accounts={accounts}
      selectedAccount={selectedAccount}
      onAccountChange={setSelectedAccount}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CTR Analytics</h1>
            <p className="mt-2 text-gray-600">
              Click-through rate performance analysis
            </p>
          </div>
          
          {/* Date Filter */}
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as 'today' | 'yesterday' | 'custom' | 'range')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Custom Date</option>
              <option value="range">Date Range</option>
            </select>
            
            {dateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
            
            {dateFilter === 'range' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : earnings ? (
          <>
            {/* Main CTR Metric */}
            <div className="card">
              <div className="text-center">
                <div className="text-6xl font-bold text-indigo-600 mb-4">
                  {(earnings.ctr || 0).toFixed(2)}%
                </div>
                <div className="text-lg text-gray-600 mb-2">Click-Through Rate</div>
                <div className="text-sm text-gray-500 mb-4">
                  {formatNumber(earnings.clicks || 0)} clicks out of {formatNumber(earnings.impressions || 0)} impressions
                </div>
                
                {/* CTR Category Badge */}
                {earnings.ctr !== undefined && (
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCTRCategory(earnings.ctr).bgColor} ${getCTRCategory(earnings.ctr).color}`}>
                    {getCTRCategory(earnings.ctr).label}
                  </div>
                )}
              </div>
            </div>

            {/* Supporting Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatNumber(earnings.clicks || 0)}
                </div>
                <div className="text-sm text-gray-500">Total Clicks</div>
              </div>
              
              <div className="card text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatNumber(earnings.impressions || 0)}
                </div>
                <div className="text-sm text-gray-500">Total Impressions</div>
              </div>
              
              <div className="card text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {formatNumber(earnings.page_views || 0)}
                </div>
                <div className="text-sm text-gray-500">Page Views</div>
              </div>
            </div>

            {/* CTR Analysis */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CTR Performance Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Current CTR:</span>
                  <span className={`font-medium ${getCTRCategory(earnings.ctr || 0).color}`}>
                    {(earnings.ctr || 0).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Clicks per 1000 impressions:</span>
                  <span className="font-medium">
                    {earnings.impressions > 0 ? 
                      ((earnings.clicks || 0) / (earnings.impressions || 1) * 1000).toFixed(1) : 
                      '0'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Impressions per page view:</span>
                  <span className="font-medium">
                    {earnings.page_views > 0 ? 
                      ((earnings.impressions || 0) / (earnings.page_views || 1)).toFixed(1) : 
                      '0'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Clicks per page view:</span>
                  <span className="font-medium">
                    {earnings.page_views > 0 ? 
                      ((earnings.clicks || 0) / (earnings.page_views || 1)).toFixed(3) : 
                      '0'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* CTR Benchmarks */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">CTR Benchmarks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">&lt; 0.5%</div>
                  <div className="text-sm text-red-600">Below Average</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">0.5% - 1.0%</div>
                  <div className="text-sm text-yellow-600">Average</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">1.0% - 2.0%</div>
                  <div className="text-sm text-blue-600">Good</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">&gt; 2.0%</div>
                  <div className="text-sm text-green-600">Excellent</div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Account ID</div>
                  <div className="font-medium">{earnings.account_id || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="font-medium">{earnings.date || 'N/A'}</div>
                </div>
              </div>
              
              {earnings.note && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">{earnings.note}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="card text-center py-12">
            <div className="text-gray-500">
              <p className="text-lg mb-2">No CTR data available</p>
              <p className="text-sm">Try selecting a different date or account.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}