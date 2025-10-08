'use client';

import { useState, useEffect } from 'react';
import { AdSenseAccount } from '@/types/adsense';

interface AccountSelectorProps {
  accounts: AdSenseAccount[];
  selectedAccount: string | null;
  onAccountChange: (accountKey: string) => void;
  loading?: boolean;
}

export default function AccountSelector({ 
  accounts, 
  selectedAccount, 
  onAccountChange, 
  loading = false 
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAccountSelect = (accountKey: string) => {
    onAccountChange(accountKey);
    setIsOpen(false);
  };

  const selectedAccountData = selectedAccount === 'all' ? null : accounts.find(acc => acc.account_key === selectedAccount);
  const activeAccountsCount = accounts.filter(acc => acc.status === 'active').length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="w-full md:w-auto flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            selectedAccount === 'all' ? 'bg-blue-400' :
            selectedAccountData?.status === 'active' ? 'bg-green-400' : 
            selectedAccountData?.status === 'inactive' ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
          <div className="text-left">
            <div className="font-medium text-gray-900">
              {selectedAccount === 'all' ? 'Semua Akun' : 
               selectedAccountData ? selectedAccountData.display_name : 'Select Account'}
            </div>
            {selectedAccount === 'all' ? (
              <div className="text-sm text-gray-500">
                {activeAccountsCount} akun aktif
              </div>
            ) : selectedAccountData && (
              <div className="text-sm text-gray-500">
                {selectedAccountData.account_id}
              </div>
            )}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full md:w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="py-1">
            {/* Option "Semua" */}
            <button
              onClick={() => handleAccountSelect('all')}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 ${
                selectedAccount === 'all' ? 'bg-primary-50 border-r-2 border-primary-500' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-full mr-3 bg-blue-400" />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Semua Akun</div>
                <div className="text-sm text-gray-500">Gabungan dari {activeAccountsCount} akun aktif</div>
              </div>
              <div className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                Total
              </div>
            </button>
            
            {/* Separator */}
            <div className="border-t border-gray-200 my-1"></div>
            
            {/* Individual accounts */}
            {accounts.map((account) => (
              <button
                key={account.account_key}
                onClick={() => handleAccountSelect(account.account_key)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 ${
                  selectedAccount === account.account_key ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                }`}
              >
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  account.status === 'active' ? 'bg-green-400' : 
                  account.status === 'inactive' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{account.display_name}</div>
                  <div className="text-sm text-gray-500">{account.account_id}</div>
                  {account.metadata?.website_url && (
                    <div className="text-xs text-gray-400">{account.metadata.website_url}</div>
                  )}
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  account.status === 'active' ? 'bg-green-100 text-green-800' : 
                  account.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {account.status}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}