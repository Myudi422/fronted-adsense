'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { AdSenseAccount, TodayEarnings, MultiAccountSummary } from '@/types/adsense';
import { adsenseApi } from '@/lib/api';

// Helper function to normalize earnings data
const normalizeEarningsData = (data: TodayEarnings | MultiAccountSummary): TodayEarnings => {
  if ('total_earnings_idr' in data) {
    // MultiAccountSummary - use micros as IDR since micros = IDR 1:1
    return {
      date: data.date,
      account_key: 'all',
      account_id: 'combined',
      earnings_idr: data.total_earnings_micros || data.total_earnings_idr,
      earnings_micros: data.total_earnings_micros || data.total_earnings_idr,
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
  // Already TodayEarnings
  return data as TodayEarnings;
};

export default function TodayEarningsPage() {
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
    
    // Validate date range
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Today's Earnings</h1>
            <p className="mt-2 text-gray-600">
              Detailed earnings data for your selected account
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
            {/* Main Metrics */}
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {formatCurrency(earnings.earnings_micros || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Earnings (IDR)</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatNumber(earnings.earnings_micros || 0)} micros
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {formatNumber(earnings.clicks || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Clicks</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {formatNumber(earnings.impressions || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Impressions</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">
                    {formatNumber(earnings.page_views || 0)}
                  </div>
                  <div className="text-sm text-gray-500">Page Views</div>
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Click-Through Rate</h3>
                <div className="text-3xl font-bold text-indigo-600">
                  {(earnings.ctr || 0).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {earnings.clicks || 0} clicks / {formatNumber(earnings.impressions || 0)} impressions
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CPM (Cost Per Mille)</h3>
                <div className="text-3xl font-bold text-pink-600">
                  {formatCurrency(earnings.cpm_idr || 0)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Revenue per 1,000 impressions
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">RPM (Revenue Per Mille)</h3>
                <div className="text-3xl font-bold text-teal-600">
                  {formatRPM(earnings.rpm_idr || 0)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Revenue per 1,000 page views
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
                <div>
                  <div className="text-sm text-gray-500">Data Age</div>
                  <div className="font-medium">
                    {(earnings.data_age_days || 0) === 0 ? 'Today' : 
                     (earnings.data_age_days || 0) === 1 ? 'Yesterday' : 
                     `${earnings.data_age_days || 0} days ago`}
                  </div>
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
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              No earnings data found for the selected date. Try a different date or check your account connection.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}