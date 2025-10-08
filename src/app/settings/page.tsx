'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { adsenseApi } from '@/lib/api';
import { AdSenseAccount } from '@/types/adsense';

interface NewAccount {
  account_key: string;
  display_name: string;
  account_id: string;
  description: string;
  website_url: string;
  category: string;
  file: File | null;
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<AdSenseAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  const [newAccount, setNewAccount] = useState<NewAccount>({
    account_key: '',
    display_name: '',
    account_id: '',
    description: '',
    website_url: '',
    category: '',
    file: null
  });

  useEffect(() => {
    loadAccounts();
  }, []);

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
      setMessage({ type: 'error', text: 'Failed to load accounts' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAccount({ ...newAccount, file });
    }
  };

  const handleInputChange = (field: keyof NewAccount, value: string) => {
    setNewAccount({ ...newAccount, [field]: value });
  };

  const uploadAccount = async () => {
    if (!newAccount.file || !newAccount.account_key || !newAccount.display_name) {
      setMessage({ type: 'error', text: 'Please fill in required fields and select a file' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('account_key', newAccount.account_key);
      formData.append('display_name', newAccount.display_name);
      formData.append('file', newAccount.file);
      
      if (newAccount.account_id) formData.append('account_id', newAccount.account_id);
      if (newAccount.description) formData.append('description', newAccount.description);
      if (newAccount.website_url) formData.append('website_url', newAccount.website_url);
      if (newAccount.category) formData.append('category', newAccount.category);

      const response = await fetch('http://localhost:8000/api/accounts/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setShowAddForm(false);
        setNewAccount({
          account_key: '',
          display_name: '',
          account_id: '',
          description: '',
          website_url: '',
          category: '',
          file: null
        });
        
        // If OAuth URL is provided, show it to user
        if (result.oauth_url) {
          setMessage({ 
            type: 'info', 
            text: `Account uploaded successfully! Please complete OAuth authorization: ${result.oauth_url}` 
          });
        }
        
        // Reload accounts
        await loadAccounts();
      } else {
        setMessage({ type: 'error', text: result.message || 'Upload failed' });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setMessage({ type: 'error', text: 'Failed to upload account. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const connectAccount = async (accountKey: string) => {
    try {
      setMessage({ type: 'info', text: 'Initiating OAuth connection...' });
      const result = await adsenseApi.connectAccount(accountKey);
      
      if (result.oauth_url) {
        setMessage({ 
          type: 'info', 
          text: `Please visit this URL to authorize: ${result.oauth_url}` 
        });
        // Open URL in new tab
        window.open(result.oauth_url, '_blank');
      } else {
        setMessage({ type: 'success', text: result.message });
      }
    } catch (err) {
      console.error('Connection error:', err);
      setMessage({ type: 'error', text: 'Failed to connect account' });
    }
  };

  const validateAccount = async (accountKey: string) => {
    try {
      setMessage({ type: 'info', text: 'Validating account...' });
      const response = await fetch(`http://localhost:8000/api/accounts/${accountKey}/validate`);
      const result = await response.json();
      
      if (result.valid) {
        setMessage({ type: 'success', text: `Account validated successfully! Publisher ID: ${result.publisher_id}` });
        await loadAccounts(); // Refresh accounts
      } else {
        setMessage({ type: 'error', text: result.error || 'Account validation failed' });
      }
    } catch (err) {
      console.error('Validation error:', err);
      setMessage({ type: 'error', text: 'Failed to validate account' });
    }
  };

  const removeAccount = async (accountKey: string) => {
    if (!confirm(`Are you sure you want to remove account "${accountKey}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/accounts/${accountKey}?confirm=true`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        await loadAccounts(); // Refresh accounts
      } else {
        setMessage({ type: 'error', text: result.detail || 'Failed to remove account' });
      }
    } catch (err) {
      console.error('Remove error:', err);
      setMessage({ type: 'error', text: 'Failed to remove account' });
    }
  };

  return (
    <DashboardLayout
      accounts={accounts}
      selectedAccount={selectedAccount}
      onAccountChange={setSelectedAccount}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your AdSense accounts and API connections
            </p>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            {showAddForm ? 'Cancel' : 'Add Account'}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <p className="text-sm">{message.text}</p>
            {message.text.includes('http') && (
              <button
                onClick={() => {
                  const url = message.text.match(/https?:\/\/[^\s]+/)?.[0];
                  if (url) window.open(url, '_blank');
                }}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Open OAuth URL
              </button>
            )}
          </div>
        )}

        {/* Add Account Form */}
        {showAddForm && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New AdSense Account</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Key * (unique identifier)
                </label>
                <input
                  type="text"
                  value={newAccount.account_key}
                  onChange={(e) => handleInputChange('account_key', e.target.value)}
                  placeholder="e.g., mysite"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name * (human-readable)
                </label>
                <input
                  type="text"
                  value={newAccount.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="e.g., MySite.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publisher ID (optional)
                </label>
                <input
                  type="text"
                  value={newAccount.account_id}
                  onChange={(e) => handleInputChange('account_id', e.target.value)}
                  placeholder="e.g., pub-1234567890123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={newAccount.website_url}
                  onChange={(e) => handleInputChange('website_url', e.target.value)}
                  placeholder="e.g., https://mysite.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newAccount.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select category</option>
                  <option value="education">Education</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="technology">Technology</option>
                  <option value="news">News</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="business">Business</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={newAccount.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secrets JSON File *
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Download from Google Cloud Console → APIs & Services → Credentials
              </p>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={uploadAccount}
                disabled={uploading}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Account'}
              </button>
              
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Existing Accounts */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Accounts</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No accounts configured</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Publisher ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.account_key} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {account.display_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {account.account_key}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {account.account_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          account.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => connectAccount(account.account_key)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Connect
                        </button>
                        <button
                          onClick={() => validateAccount(account.account_key)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Validate
                        </button>
                        <button
                          onClick={() => removeAccount(account.account_key)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Setup Instructions</h2>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900">1. Get Client Secrets</h3>
              <p>Go to Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">2. Upload Account</h3>
              <p>Fill in the form above and upload your client secrets JSON file</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">3. Complete OAuth</h3>
              <p>Click "Connect" and authorize access to your AdSense account</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900">4. Validate</h3>
              <p>Click "Validate" to verify the connection is working properly</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}