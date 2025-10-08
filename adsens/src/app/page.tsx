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

export default function Home() {
  const [accounts, setAccounts] = useState<AdSenseAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [todayEarnings, setTodayEarnings] = useState<TodayEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Load today earnings when account changes
  useEffect(() => {
    if (selectedAccount) {
      loadTodayEarnings(selectedAccount);
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await adsenseApi.getAccounts();
      setAccounts(accountsData);
      
      // Auto-select first active account
      const activeAccount = accountsData.find(acc => acc.status === 'active');
      if (activeAccount) {
        setSelectedAccount(activeAccount.account_key);
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayEarnings = async (accountKey: string) => {
    try {
      if (accountKey === 'all') {
        // Load combined earnings from all active accounts
        const summary = await adsenseApi.getAllAccountsEarnings();
        setTodayEarnings(normalizeEarningsData(summary));
      } else {
        // Load earnings from specific account
        const earnings = await adsenseApi.getTodayEarnings(accountKey);
        setTodayEarnings(normalizeEarningsData(earnings));
      }
    } catch (err) {
      console.error('Error loading today earnings:', err);
      setTodayEarnings(null);
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

  const formatRPM = (amount: number) => {
    if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadAccounts}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      accounts={accounts}
      selectedAccount={selectedAccount}
      onAccountChange={setSelectedAccount}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            AdSense earnings overview for your accounts
          </p>
        </div>

        {selectedAccount ? (
          <>
            {/* Today's Earnings Card */}
            {todayEarnings && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Today's Earnings</h2>
                  <span className="text-sm text-gray-500">{todayEarnings.date}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(todayEarnings.earnings_micros || 0)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Earnings (IDR)</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatNumber(todayEarnings.clicks || 0)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Clicks</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {formatNumber(todayEarnings.impressions || 0)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">Impressions</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {(todayEarnings.ctr || 0).toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-500 mt-1">CTR</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-600">
                      {formatRPM(todayEarnings.rpm_idr || 0)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">RPM</div>
                  </div>
                </div>

                {todayEarnings.note && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">{todayEarnings.note}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <a
                  href="/today-earnings"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl mb-2">💰</div>
                  <div className="font-medium text-gray-900">Today Earnings</div>
                  <div className="text-sm text-gray-500">View detailed earnings</div>
                </a>
                
                <a
                  href="/domain-analytics"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl mb-2">🌐</div>
                  <div className="font-medium text-gray-900">Domain Analytics</div>
                  <div className="text-sm text-gray-500">Breakdown by domain</div>
                </a>
                
                <a
                  href="/reports"
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-medium text-gray-900">Reports</div>
                  <div className="text-sm text-gray-500">Historical data</div>
                </a>
              </div>
            </div>

            {/* Account Status */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedAccount === 'all' ? 'Semua Akun Aktif' : 'Account Status'}
              </h2>
              <div className="space-y-4">
                {selectedAccount === 'all' ? (
                  // Show all active accounts when "Semua" is selected
                  accounts
                    .filter(acc => acc.status === 'active')
                    .map(account => (
                      <div key={account.account_key} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{account.display_name}</div>
                          <div className="text-sm text-gray-500">{account.account_id}</div>
                          {account.metadata?.website_url && (
                            <div className="text-sm text-gray-400">{account.metadata.website_url}</div>
                          )}
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          active
                        </div>
                      </div>
                    ))
                ) : (
                  // Show selected account when specific account is selected
                  accounts
                    .filter(acc => acc.account_key === selectedAccount)
                    .map(account => (
                      <div key={account.account_key} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{account.display_name}</div>
                          <div className="text-sm text-gray-500">{account.account_id}</div>
                          {account.metadata?.website_url && (
                            <div className="text-sm text-gray-400">{account.metadata.website_url}</div>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          account.status === 'active' ? 'bg-green-100 text-green-800' : 
                          account.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {account.status}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Select an Account</h3>
            <p className="text-gray-500">Choose an AdSense account from the dropdown to view your dashboard</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}