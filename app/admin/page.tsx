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
  Mail,
  Palette,
  Ban,
  UserCheck,
  Edit2,
  Trash2,
  Search,
  MoreVertical,
  Calendar,
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
  // AI URL Parsing
  aiUrlParsingEnabled: boolean;
  // Email
  emailProvider: string;
  emailFrom: string;
  emailFromName: string;
  emailApiKey: string;
  hasEmailConfig: boolean;
  // SMTP specific
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  // SES specific
  awsSesRegion: string;
  awsAccessKeyId: string;
  awsSecretKey: string;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  status: 'active' | 'banned';
  created_at: string;
  trip_count: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [models, setModels] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);
  // User management state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userActionMenu, setUserActionMenu] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [userSaveStatus, setUserSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
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
  // Email settings state
  const [emailProvider, setEmailProvider] = useState('disabled');
  const [emailFrom, setEmailFrom] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailApiKey, setEmailApiKey] = useState('');
  const [showEmailApiKey, setShowEmailApiKey] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [awsSesRegion, setAwsSesRegion] = useState('us-east-1');
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretKey, setAwsSecretKey] = useState('');
  const [showAwsSecretKey, setShowAwsSecretKey] = useState(false);
  // Test email
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [emailTestStatus, setEmailTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' });
  // Profile Design
  const [profileDesign, setProfileDesign] = useState<'journey' | 'explorer' | 'wanderer'>('journey');
  const [profileDesignSaveStatus, setProfileDesignSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const router = useRouter();

  const PROFILE_DESIGNS = [
    { id: 'journey' as const, name: 'JOURNEY', description: 'Dark theme with giant typography and Zune-inspired bold stats', preview: 'bg-zinc-900' },
    { id: 'explorer' as const, name: 'EXPLORER', description: 'Two-column layout with sticky sidebar map', preview: 'bg-stone-100' },
    { id: 'wanderer' as const, name: 'WANDERER', description: 'Full-bleed gradient hero with horizontal scrolling cards', preview: 'bg-gradient-to-br from-emerald-500 to-cyan-500' },
  ];

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
      } else if (activeTab === 'users') {
        setUsersLoading(true);
        try {
          const res = await fetch('/api/admin/users');
          if (res.ok) {
            const data = await res.json();
            setUsers(data.users || []);
          }
        } finally {
          setUsersLoading(false);
        }
      } else if (activeTab === 'settings') {
        const res = await fetch('/api/admin/settings');
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        setSettings(data);
        // Populate email settings
        if (data.emailProvider) setEmailProvider(data.emailProvider);
        if (data.emailFrom) setEmailFrom(data.emailFrom);
        if (data.emailFromName) setEmailFromName(data.emailFromName);
        if (data.smtpHost) setSmtpHost(data.smtpHost);
        if (data.smtpPort) setSmtpPort(String(data.smtpPort));
        if (data.smtpSecure) setSmtpSecure(data.smtpSecure);
        if (data.awsSesRegion) setAwsSesRegion(data.awsSesRegion);

        // Fetch profile design setting from site-settings
        try {
          const designRes = await fetch('/api/admin/site-settings?key=profile_design');
          if (designRes.ok) {
            const designData = await designRes.json();
            if (designData.value) {
              setProfileDesign(designData.value);
            }
          }
        } catch (e) {
          // Default to 'journey' if not found
        }
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
        aiUrlParsingEnabled: settings?.aiUrlParsingEnabled,
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

      // Email settings
      payload.emailProvider = emailProvider;
      if (emailFrom) payload.emailFrom = emailFrom;
      if (emailFromName) payload.emailFromName = emailFromName;
      if (emailApiKey) payload.emailApiKey = emailApiKey;
      if (smtpHost) payload.smtpHost = smtpHost;
      if (smtpPort) payload.smtpPort = parseInt(smtpPort);
      if (smtpUser) payload.smtpUser = smtpUser;
      if (smtpPass) payload.smtpPass = smtpPass;
      payload.smtpSecure = smtpSecure;
      if (awsSesRegion) payload.awsSesRegion = awsSesRegion;
      if (awsAccessKeyId) payload.awsAccessKeyId = awsAccessKeyId;
      if (awsSecretKey) payload.awsSecretKey = awsSecretKey;

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

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      setEmailTestStatus({ status: 'error', message: 'Please enter a test email address' });
      setTimeout(() => setEmailTestStatus({ status: 'idle' }), 3000);
      return;
    }

    setEmailTestStatus({ status: 'testing' });

    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: emailProvider,
          emailFrom: emailFrom || settings?.emailFrom,
          emailFromName: emailFromName || settings?.emailFromName,
          emailApiKey: emailApiKey || settings?.emailApiKey,
          smtpHost: smtpHost || settings?.smtpHost,
          smtpPort: parseInt(smtpPort) || settings?.smtpPort,
          smtpUser: smtpUser || settings?.smtpUser,
          smtpPass: smtpPass || settings?.smtpPass,
          smtpSecure: smtpSecure,
          awsSesRegion: awsSesRegion || settings?.awsSesRegion,
          awsAccessKeyId: awsAccessKeyId,
          awsSecretKey: awsSecretKey,
          testEmail: testEmailAddress,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setEmailTestStatus({ status: 'success', message: data.message });
      } else {
        setEmailTestStatus({ status: 'error', message: data.error });
      }

      setTimeout(() => setEmailTestStatus({ status: 'idle' }), 5000);
    } catch (err: any) {
      setEmailTestStatus({ status: 'error', message: err.message });
      setTimeout(() => setEmailTestStatus({ status: 'idle' }), 5000);
    }
  };

  const handleSaveProfileDesign = async () => {
    setProfileDesignSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'profile_design', value: profileDesign }),
      });

      if (res.ok) {
        setProfileDesignSaveStatus('success');
        setTimeout(() => setProfileDesignSaveStatus('idle'), 3000);
      } else {
        setProfileDesignSaveStatus('error');
        setTimeout(() => setProfileDesignSaveStatus('idle'), 3000);
      }
    } catch {
      setProfileDesignSaveStatus('error');
      setTimeout(() => setProfileDesignSaveStatus('idle'), 3000);
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

  // User management functions
  const handleBanUser = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'banned' }),
      });
      fetchData();
      setUserActionMenu(null);
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      fetchData();
      setUserActionMenu(null);
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setUserSaveStatus('saving');
    try {
      const payload: any = {
        full_name: editingUser.full_name,
        username: editingUser.username,
      };
      if (newPassword) {
        payload.password = newPassword;
      }
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setUserSaveStatus('success');
        setTimeout(() => {
          setUserSaveStatus('idle');
          setEditingUser(null);
          setNewPassword('');
          fetchData();
        }, 1500);
      } else {
        setUserSaveStatus('error');
      }
    } catch {
      setUserSaveStatus('error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    try {
      await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      fetchData();
      setUserActionMenu(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Google Calendar Toggle Component
  const GoogleCalendarToggle = () => {
    const [enabled, setEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      const fetchSetting = async () => {
        try {
          const res = await fetch('/api/admin/site-settings?key=google_calendar_booking_enabled');
          if (res.ok) {
            const data = await res.json();
            setEnabled(data.value === 'true');
          }
        } catch (e) {
          console.error('Failed to fetch Google Calendar setting:', e);
        } finally {
          setLoading(false);
        }
      };
      fetchSetting();
    }, []);

    const handleToggle = async () => {
      setSaving(true);
      try {
        const newValue = !enabled;
        const res = await fetch('/api/admin/site-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'google_calendar_booking_enabled', value: String(newValue) }),
        });
        if (res.ok) {
          setEnabled(newValue);
        }
      } catch (e) {
        console.error('Failed to save Google Calendar setting:', e);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">Google Calendar Direct Booking</p>
          <p className="text-sm text-gray-500">
            Allow guides to add their Google Calendar embed code for direct booking
          </p>
        </div>
        {loading ? (
          <div className="w-14 h-8 rounded-full bg-gray-200 animate-pulse" />
        ) : (
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
              enabled ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            {saving ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
            ) : (
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                  enabled ? 'left-7' : 'left-1'
                }`}
              />
            )}
          </button>
        )}
      </div>
    );
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
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'users'
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Users</span>
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

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">User Management</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                </div>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trips</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                  <span className="text-white font-medium">{(user.full_name || 'U')[0].toUpperCase()}</span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{user.full_name || 'Unnamed User'}</p>
                                {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === 'banned'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {user.status === 'banned' ? 'Banned' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{user.trip_count || 0}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="relative">
                              <button
                                onClick={() => setUserActionMenu(userActionMenu === user.id ? null : user.id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                              </button>
                              {userActionMenu === user.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                  <button
                                    onClick={() => { setEditingUser(user); setUserActionMenu(null); }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    Edit User
                                  </button>
                                  {user.status === 'banned' ? (
                                    <button
                                      onClick={() => handleActivateUser(user.id)}
                                      className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                      Activate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBanUser(user.id)}
                                      className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                    >
                                      <Ban className="w-4 h-4" />
                                      Ban User
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete User
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                            {userSearch ? 'No users found matching your search.' : 'No users yet.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Edit User Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold">Edit User</h3>
                    <p className="text-sm text-gray-500">{editingUser.email}</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editingUser.full_name || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={editingUser.username || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                  <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      {userSaveStatus === 'success' && (
                        <span className="text-green-600 text-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Saved!
                        </span>
                      )}
                      {userSaveStatus === 'error' && (
                        <span className="text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" /> Failed to save
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setEditingUser(null); setNewPassword(''); setUserSaveStatus('idle'); }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateUser}
                        disabled={userSaveStatus === 'saving'}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {userSaveStatus === 'saving' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

            {/* Email Configuration */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Email Configuration</h3>
                    <p className="text-sm text-gray-600">Configure email provider for invite notifications</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="flex items-center gap-3">
                    {settings?.hasEmailConfig ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {settings?.hasEmailConfig
                          ? `Email Configured (${settings.emailProvider})`
                          : 'Email Not Configured'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {settings?.hasEmailConfig
                          ? 'Invite emails will be sent automatically'
                          : 'Share links will be used instead of email invites'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Provider Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Provider
                  </label>
                  <select
                    value={emailProvider}
                    onChange={(e) => setEmailProvider(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  >
                    <option value="disabled">Disabled (Share links only)</option>
                    <option value="resend">Resend (100/day free)</option>
                    <option value="sendgrid">SendGrid (100/day free)</option>
                    <option value="ses">AWS SES (62K/month if on EC2)</option>
                    <option value="smtp">SMTP (Custom mail server)</option>
                  </select>
                </div>

                {/* From Email */}
                {emailProvider !== 'disabled' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Email
                        </label>
                        <input
                          type="email"
                          value={emailFrom}
                          onChange={(e) => setEmailFrom(e.target.value)}
                          placeholder="invites@yourdomain.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          From Name
                        </label>
                        <input
                          type="text"
                          value={emailFromName}
                          onChange={(e) => setEmailFromName(e.target.value)}
                          placeholder="AI Travel"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Resend/SendGrid API Key */}
                {(emailProvider === 'resend' || emailProvider === 'sendgrid') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showEmailApiKey ? 'text' : 'password'}
                        value={emailApiKey}
                        onChange={(e) => setEmailApiKey(e.target.value)}
                        placeholder={emailProvider === 'resend' ? 're_...' : 'SG...'}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailApiKey(!showEmailApiKey)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showEmailApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Get your API key from{' '}
                      <a
                        href={emailProvider === 'resend' ? 'https://resend.com/api-keys' : 'https://app.sendgrid.com/settings/api_keys'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:underline"
                      >
                        {emailProvider === 'resend' ? 'resend.com' : 'sendgrid.com'}
                      </a>
                    </p>
                  </div>
                )}

                {/* AWS SES Configuration */}
                {emailProvider === 'ses' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AWS Region
                      </label>
                      <select
                        value={awsSesRegion}
                        onChange={(e) => setAwsSesRegion(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      >
                        <option value="us-east-1">US East (N. Virginia)</option>
                        <option value="us-west-2">US West (Oregon)</option>
                        <option value="eu-west-1">EU (Ireland)</option>
                        <option value="eu-central-1">EU (Frankfurt)</option>
                        <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                        <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AWS Access Key ID
                      </label>
                      <input
                        type="text"
                        value={awsAccessKeyId}
                        onChange={(e) => setAwsAccessKeyId(e.target.value)}
                        placeholder="AKIA..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AWS Secret Access Key
                      </label>
                      <div className="relative">
                        <input
                          type={showAwsSecretKey ? 'text' : 'password'}
                          value={awsSecretKey}
                          onChange={(e) => setAwsSecretKey(e.target.value)}
                          placeholder="Your secret key..."
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAwsSecretKey(!showAwsSecretKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showAwsSecretKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* SMTP Configuration */}
                {emailProvider === 'smtp' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          placeholder="587"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Username
                        </label>
                        <input
                          type="text"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Password
                        </label>
                        <div className="relative">
                          <input
                            type={showSmtpPass ? 'text' : 'password'}
                            value={smtpPass}
                            onChange={(e) => setSmtpPass(e.target.value)}
                            placeholder="App password..."
                            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSmtpPass(!showSmtpPass)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSmtpPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Use TLS/SSL</p>
                        <p className="text-sm text-gray-500">Enable for port 465 (SSL) or 587 (TLS)</p>
                      </div>
                      <button
                        onClick={() => setSmtpSecure(!smtpSecure)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          smtpSecure ? 'bg-pink-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                            smtpSecure ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}

                {/* Test Email Section */}
                {emailProvider !== 'disabled' && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Test Configuration</h4>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder="Enter your email to test"
                        className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                      />
                      <button
                        onClick={handleTestEmail}
                        disabled={emailTestStatus.status === 'testing'}
                        className="px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {emailTestStatus.status === 'testing' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4" />
                            Send Test
                          </>
                        )}
                      </button>
                    </div>
                    {/* Test Result */}
                    {emailTestStatus.status !== 'idle' && emailTestStatus.status !== 'testing' && (
                      <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 ${
                        emailTestStatus.status === 'success' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                      }`}>
                        {emailTestStatus.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <p className={`text-sm ${emailTestStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                          {emailTestStatus.message}
                        </p>
                      </div>
                    )}
                  </div>
                )}
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

                {/* AI URL Parsing Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Enable AI URL Parsing</p>
                    <p className="text-sm text-gray-500">Use AI to extract place info from non-Google URLs (costs tokens)</p>
                  </div>
                  <button
                    onClick={() => setSettings(s => s ? { ...s, aiUrlParsingEnabled: !s.aiUrlParsingEnabled } : s)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      settings?.aiUrlParsingEnabled ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                        settings?.aiUrlParsingEnabled ? 'left-7' : 'left-1'
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

            {/* Guide Features */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Guide Features</h3>
                    <p className="text-sm text-gray-600">Configure features for guide mode and bookings</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Google Calendar Integration Toggle */}
                <GoogleCalendarToggle />
              </div>
            </div>

            {/* Profile Design */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Profile Page Design</h3>
                    <p className="text-sm text-gray-600">Choose the design theme for public user profiles</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PROFILE_DESIGNS.map((design) => (
                    <button
                      key={design.id}
                      onClick={() => setProfileDesign(design.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                        profileDesign === design.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Preview swatch */}
                      <div className={`w-full h-16 rounded-lg mb-3 ${design.preview}`} />
                      <div className="font-semibold text-gray-900">{design.name}</div>
                      <p className="text-xs text-gray-500 mt-1">{design.description}</p>
                      {profileDesign === design.id && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle className="w-5 h-5 text-amber-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Save Profile Design Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    {profileDesignSaveStatus === 'success' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Design saved!</span>
                      </div>
                    )}
                    {profileDesignSaveStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Failed to save</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSaveProfileDesign}
                    disabled={profileDesignSaveStatus === 'saving'}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    {profileDesignSaveStatus === 'saving' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Design
                      </>
                    )}
                  </button>
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
