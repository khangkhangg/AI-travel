'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  Database,
  Zap,
  LogOut,
  Key,
  MessageSquare,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Server,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface AppSettings {
  deepseekApiKey: string;
  chatEnabled: boolean;
  maxTokens: number;
  systemPrompt: string;
  hasApiKey: boolean;
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  hasSupabaseConfig: boolean;
  // Database
  databaseUrl: string;
  hasDatabaseConfig: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [models, setModels] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  // Supabase & Database
  const [newSupabaseUrl, setNewSupabaseUrl] = useState('');
  const [newSupabaseKey, setNewSupabaseKey] = useState('');
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [newDatabaseUrl, setNewDatabaseUrl] = useState('');
  const [showDatabaseUrl, setShowDatabaseUrl] = useState(false);
  const [testStatus, setTestStatus] = useState<{ type: string; status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ type: '', status: 'idle' });
  const [restartRequired, setRestartRequired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'models') {
        const res = await fetch('/api/admin/models');
        const data = await res.json();
        setModels(data.models || []);
      } else if (activeTab === 'overview') {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        setStats(data);
      } else if (activeTab === 'queries') {
        const res = await fetch('/api/admin/queries?limit=10');
        const data = await res.json();
        setRecentQueries(data.queries || []);
      } else if (activeTab === 'analytics') {
        const res = await fetch('/api/admin/model-performance');
        const data = await res.json();
        setModelPerformance(data.performance || []);
      } else if (activeTab === 'settings') {
        const res = await fetch('/api/admin/settings');
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    try {
      const payload: any = {
        chatEnabled: settings?.chatEnabled,
        maxTokens: settings?.maxTokens,
        systemPrompt: settings?.systemPrompt,
      };

      if (newApiKey) {
        payload.deepseekApiKey = newApiKey;
      }

      if (newSupabaseUrl) {
        payload.supabaseUrl = newSupabaseUrl;
      }

      if (newSupabaseKey) {
        payload.supabaseAnonKey = newSupabaseKey;
      }

      if (newDatabaseUrl) {
        payload.databaseUrl = newDatabaseUrl;
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveStatus('success');
        setNewApiKey('');
        setNewSupabaseUrl('');
        setNewSupabaseKey('');
        setNewDatabaseUrl('');
        fetchData();

        // Check if server restart is required
        if (data.envChanged) {
          setRestartRequired(true);
        }

        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const handleTestConnection = async (type: 'supabase' | 'database') => {
    setTestStatus({ type, status: 'testing' });

    try {
      const payload: any = { type };

      if (type === 'supabase') {
        payload.supabaseUrl = newSupabaseUrl || settings?.supabaseUrl;
        payload.supabaseAnonKey = newSupabaseKey || settings?.supabaseAnonKey;
      } else {
        payload.databaseUrl = newDatabaseUrl || settings?.databaseUrl;
      }

      const res = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setTestStatus({ type, status: 'success', message: data.message });
      } else {
        setTestStatus({ type, status: 'error', message: data.error });
      }

      setTimeout(() => setTestStatus({ type: '', status: 'idle' }), 5000);
    } catch (err: any) {
      setTestStatus({ type, status: 'error', message: err.message });
      setTimeout(() => setTestStatus({ type: '', status: 'idle' }), 5000);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const updateModelStatus = async (modelId: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });
      fetchData();
    } catch (error) {
      console.error('Failed to update model:', error);
    }
  };

  const setDefaultModel = async (modelId: string) => {
    try {
      await fetch(`/api/admin/models/${modelId}/set-default`, {
        method: 'POST',
      });
      fetchData();
    } catch (error) {
      console.error('Failed to set default model:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-6 h-6 text-teal-600" />
              <h1 className="text-2xl font-bold text-gray-900">Super Admin Control Panel</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'overview'
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'models'
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>AI Models</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('queries')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'queries'
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Recent Queries</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Analytics</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'settings'
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers || 0}
                  </span>
                </div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.totalTrips || 0}
                  </span>
                </div>
                <div className="text-sm text-gray-600">Trips Generated</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    ${stats.totalCost?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-8 h-8 text-orange-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.totalTokens?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="text-sm text-gray-600">Tokens Used</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Platform Activity (Last 30 Days)</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Response Time</span>
                  <span className="font-semibold">{stats.avgResponseTime?.toFixed(0) || 0}ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold">{stats.successRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Premium Users</span>
                  <span className="font-semibold">{stats.premiumUsers || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Models Tab */}
        {activeTab === 'models' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">AI Model Configuration</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage which AI models are available for trip generation
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cost/1K Tokens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Default
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {models.map((model) => (
                    <tr key={model.id}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{model.display_name}</div>
                        <div className="text-sm text-gray-500">{model.model_id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {model.provider}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        ${model.cost_per_1k_tokens}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {model.priority}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => updateModelStatus(model.id, !model.is_active)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            model.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {model.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {model.is_default && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDefaultModel(model.id)}
                          disabled={model.is_default}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Set as Default
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Queries Tab */}
        {activeTab === 'queries' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Recent Trip Generations</h3>
              <p className="text-sm text-gray-600 mt-1">
                Last 10 trip generation requests
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {recentQueries.map((query, index) => (
                <div key={index} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900">{query.title}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {query.ai_model_display_name || 'Unknown Model'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>User: {query.user_email}</div>
                        <div>
                          {query.start_date} to {query.end_date} • {query.num_people} people
                          {query.city && ` • ${query.city}`}
                        </div>
                        <div>Travel Type: {query.travel_type?.join(', ')}</div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-gray-900 font-medium">
                        {query.generation_time_ms}ms
                      </div>
                      <div className="text-gray-600">{query.tokens_used} tokens</div>
                      <div className="text-gray-600">${query.total_cost?.toFixed(4)}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        {new Date(query.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Model Performance Comparison</h3>
              <div className="space-y-4">
                {modelPerformance.map((perf: any) => (
                  <div key={perf.model_name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium text-gray-900">{perf.display_name}</div>
                        <div className="text-sm text-gray-600">{perf.provider}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {perf.usage_count} uses
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Avg. Response</div>
                        <div className="font-semibold">{perf.avg_response_time?.toFixed(0)}ms</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Avg. Tokens</div>
                        <div className="font-semibold">{perf.avg_tokens?.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Total Cost</div>
                        <div className="font-semibold">${perf.total_cost?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Avg. Rating</div>
                        <div className="font-semibold">
                          {perf.avg_rating ? `⭐ ${perf.avg_rating.toFixed(1)}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Restart Required Banner */}
            {restartRequired && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">Server Restart Required</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Environment variables have been updated in <code className="bg-amber-100 px-1 rounded">.env</code>.
                    Restart the dev server for changes to take effect:
                  </p>
                  <code className="block mt-2 p-2 bg-amber-100 rounded text-sm text-amber-900 font-mono">
                    Press Ctrl+C then run: npm run dev
                  </code>
                </div>
                <button
                  onClick={() => setRestartRequired(false)}
                  className="text-amber-500 hover:text-amber-700"
                >
                  <span className="sr-only">Dismiss</span>
                  ×
                </button>
              </div>
            )}

            {/* API Configuration */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">API Configuration</h3>
                    <p className="text-sm text-gray-600">Configure your Deepseek API key for AI chat</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Current API Key Status */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    {settings?.hasApiKey ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {settings?.hasApiKey ? 'API Key Configured' : 'No API Key Set'}
                      </p>
                      {settings?.hasApiKey && (
                        <p className="text-sm text-gray-500">{settings.deepseekApiKey}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* New API Key Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {settings?.hasApiKey ? 'Update API Key' : 'Enter API Key'}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Get your API key from{' '}
                    <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                      platform.deepseek.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Supabase Configuration */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Supabase Authentication</h3>
                    <p className="text-sm text-gray-600">Configure Supabase for user authentication</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    {settings?.hasSupabaseConfig ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {settings?.hasSupabaseConfig ? 'Supabase Configured' : 'Supabase Not Configured'}
                      </p>
                      {settings?.supabaseUrl && (
                        <p className="text-sm text-gray-500">{settings.supabaseUrl}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestConnection('supabase')}
                    disabled={testStatus.type === 'supabase' && testStatus.status === 'testing'}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {testStatus.type === 'supabase' && testStatus.status === 'testing' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Test Connection
                  </button>
                </div>

                {/* Test Result */}
                {testStatus.type === 'supabase' && testStatus.status !== 'idle' && testStatus.status !== 'testing' && (
                  <div className={`p-3 rounded-xl flex items-start gap-2 ${
                    testStatus.status === 'success' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                  }`}>
                    {testStatus.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm ${testStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {testStatus.message}
                    </p>
                  </div>
                )}

                {/* Supabase URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supabase URL
                  </label>
                  <input
                    type="text"
                    value={newSupabaseUrl}
                    onChange={(e) => setNewSupabaseUrl(e.target.value)}
                    placeholder={settings?.supabaseUrl || "https://your-project.supabase.co"}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                {/* Supabase Anon Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supabase Anon Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSupabaseKey ? 'text' : 'password'}
                      value={newSupabaseKey}
                      onChange={(e) => setNewSupabaseKey(e.target.value)}
                      placeholder={settings?.supabaseAnonKey || "eyJ..."}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSupabaseKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Get your credentials from{' '}
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                      supabase.com/dashboard
                    </a>
                    {' '}→ Project Settings → API
                  </p>
                </div>
              </div>
            </div>

            {/* Database Configuration */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">PostgreSQL Database</h3>
                    <p className="text-sm text-gray-600">Configure local database for user profiles and app data</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    {settings?.hasDatabaseConfig ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {settings?.hasDatabaseConfig ? 'Database Configured' : 'Database Not Configured'}
                      </p>
                      {settings?.databaseUrl && (
                        <p className="text-sm text-gray-500 font-mono">{settings.databaseUrl}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestConnection('database')}
                    disabled={testStatus.type === 'database' && testStatus.status === 'testing'}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {testStatus.type === 'database' && testStatus.status === 'testing' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Test Connection
                  </button>
                </div>

                {/* Test Result */}
                {testStatus.type === 'database' && testStatus.status !== 'idle' && testStatus.status !== 'testing' && (
                  <div className={`p-3 rounded-xl flex items-start gap-2 ${
                    testStatus.status === 'success' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                  }`}>
                    {testStatus.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm ${testStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {testStatus.message}
                    </p>
                  </div>
                )}

                {/* Database URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Database Connection String
                  </label>
                  <div className="relative">
                    <input
                      type={showDatabaseUrl ? 'text' : 'password'}
                      value={newDatabaseUrl}
                      onChange={(e) => setNewDatabaseUrl(e.target.value)}
                      placeholder="postgresql://user:password@localhost:5432/ai_travel"
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDatabaseUrl(!showDatabaseUrl)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showDatabaseUrl ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Format: postgresql://username:password@host:port/database
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Settings */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Chat Settings</h3>
                    <p className="text-sm text-gray-600">Configure AI chat behavior</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Chat Enabled Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Enable AI Chat</p>
                    <p className="text-sm text-gray-500">Allow users to chat with the AI assistant</p>
                  </div>
                  <button
                    onClick={() => setSettings(s => s ? { ...s, chatEnabled: !s.chatEnabled } : s)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      settings?.chatEnabled ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                        settings?.chatEnabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens per Response
                  </label>
                  <input
                    type="number"
                    value={settings?.maxTokens || 2048}
                    onChange={(e) => setSettings(s => s ? { ...s, maxTokens: parseInt(e.target.value) || 2048 } : s)}
                    min="256"
                    max="8192"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Higher values allow longer responses but cost more (256-8192)
                  </p>
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt
                  </label>
                  <textarea
                    value={settings?.systemPrompt || ''}
                    onChange={(e) => setSettings(s => s ? { ...s, systemPrompt: e.target.value } : s)}
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all resize-none"
                    placeholder="Enter the system prompt for the AI assistant..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    This prompt defines the AI assistant&apos;s behavior and personality
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between">
              <div>
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span>Settings saved successfully!</span>
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>Failed to save settings</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 transition-all shadow-lg"
              >
                <Save className="w-5 h-5" />
                {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
