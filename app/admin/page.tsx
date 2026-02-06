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
  Star,
  Plus,
  X,
  GripVertical,
  ExternalLink,
  Pin,
  ScanEye,
  Briefcase,
  Building2,
  FileCheck,
  FileX,
  MapPin,
} from 'lucide-react';

import { INTEREST_CATEGORIES } from '@/lib/types/user';

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
  // Packages Tab (Chatbox)
  packagesTabEnabled: boolean;
  // Trip Details Section (Chatbox)
  tripDetailsEnabled: boolean;
  // Landing Page Sections
  tripCategoriesEnabled: boolean;
  popularDestinationsEnabled: boolean;
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
  const [queriesAiOnly, setQueriesAiOnly] = useState(false);
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
  // Featured Creators
  const [featuredCreators, setFeaturedCreators] = useState<Record<string, any[]>>({});
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [showAddFeaturedModal, setShowAddFeaturedModal] = useState(false);
  const [addFeaturedCategory, setAddFeaturedCategory] = useState('');
  const [creatorSearch, setCreatorSearch] = useState('');
  const [creatorSearchResults, setCreatorSearchResults] = useState<any[]>([]);
  const [searchingCreators, setSearchingCreators] = useState(false);
  const [featuredSaveStatus, setFeaturedSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [addFeaturedUntil, setAddFeaturedUntil] = useState('');
  // eKYC AI Verification
  const [ekycEnabled, setEkycEnabled] = useState(false);
  const [ekycModel, setEkycModel] = useState('deepseek-vl2');
  const [visionModels, setVisionModels] = useState<any[]>([]);
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [showDeepseekApiKey, setShowDeepseekApiKey] = useState(false);
  const [alibabaApiKey, setAlibabaApiKey] = useState('');
  const [showAlibabaApiKey, setShowAlibabaApiKey] = useState(false);
  const [zhipuApiKey, setZhipuApiKey] = useState('');
  const [showZhipuApiKey, setShowZhipuApiKey] = useState(false);
  const [ekycKeyTestStatus, setEkycKeyTestStatus] = useState<{ provider: string; status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ provider: '', status: 'idle' });
  const [ekycSaveStatus, setEkycSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  // Business Management
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessStats, setBusinessStats] = useState<any>(null);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [businessSearch, setBusinessSearch] = useState('');
  const [businessFilter, setBusinessFilter] = useState<'all' | 'active' | 'inactive' | 'verified' | 'pending'>('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [businessDetailLoading, setBusinessDetailLoading] = useState(false);
  const [businessActionMenu, setBusinessActionMenu] = useState<string | null>(null);
  const [businessEditMode, setBusinessEditMode] = useState(false);
  const [businessEditForm, setBusinessEditForm] = useState<any>({});
  const [businessConfirmModal, setBusinessConfirmModal] = useState<{
    type: 'activate' | 'deactivate' | 'delete' | 'verify' | 'unverify' | null;
    loading: boolean;
  }>({ type: null, loading: false });
  const [documentPreview, setDocumentPreview] = useState<{ url: string; type: string } | null>(null);
  const [rejectDocModal, setRejectDocModal] = useState<{ docType: string; reason: string; loading: boolean } | null>(null);
  const [uploadingFile, setUploadingFile] = useState<{ type: string; progress: boolean } | null>(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [adminInfo, setAdminInfo] = useState<{ username: string; displayName: string; email: string } | null>(null);
  const [changePasswordModal, setChangePasswordModal] = useState<{
    open: boolean;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    loading: boolean;
    error: string | null;
  }>({ open: false, currentPassword: '', newPassword: '', confirmPassword: '', loading: false, error: null });
  const [profileInfoModal, setProfileInfoModal] = useState<{
    open: boolean;
    displayName: string;
    email: string;
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({ open: false, displayName: '', email: '', loading: false, error: null, success: false });
  const router = useRouter();

  const PROFILE_DESIGNS = [
    { id: 'journey' as const, name: 'JOURNEY', description: 'Dark theme with giant typography and Zune-inspired bold stats', preview: 'bg-zinc-900' },
    { id: 'explorer' as const, name: 'EXPLORER', description: 'Two-column layout with sticky sidebar map', preview: 'bg-stone-100' },
    { id: 'wanderer' as const, name: 'WANDERER', description: 'Full-bleed gradient hero with horizontal scrolling cards', preview: 'bg-gradient-to-br from-emerald-500 to-cyan-500' },
  ];

  // Fetch admin info on mount
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const res = await fetch('/api/admin/login');
        if (res.ok) {
          const data = await res.json();
          setAdminInfo(data);
        }
      } catch {
        // Ignore errors
      }
    };
    fetchAdminInfo();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, businessSearch, businessFilter, businessTypeFilter, queriesAiOnly]);

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
        const res = await fetch(`/api/admin/queries?limit=20${queriesAiOnly ? '&aiOnly=true' : ''}`);
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
      } else if (activeTab === 'featured') {
        setFeaturedLoading(true);
        try {
          const res = await fetch('/api/admin/featured-creators');
          if (res.ok) {
            const data = await res.json();
            setFeaturedCreators(data.byCategory || {});
          }
        } finally {
          setFeaturedLoading(false);
        }
      } else if (activeTab === 'businesses') {
        setBusinessesLoading(true);
        try {
          const params = new URLSearchParams();
          if (businessSearch) params.set('search', businessSearch);
          if (businessFilter !== 'all') params.set('status', businessFilter);
          if (businessTypeFilter) params.set('type', businessTypeFilter);
          const res = await fetch(`/api/admin/businesses?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            setBusinesses(data.businesses || []);
            setBusinessStats(data.stats);
          }
        } finally {
          setBusinessesLoading(false);
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

        // Fetch eKYC settings
        try {
          const ekycEnabledRes = await fetch('/api/admin/site-settings?key=ekyc_enabled');
          if (ekycEnabledRes.ok) {
            const ekycData = await ekycEnabledRes.json();
            setEkycEnabled(ekycData.value === 'true' || ekycData.value === '"true"');
          }
          const ekycModelRes = await fetch('/api/admin/site-settings?key=ekyc_model');
          if (ekycModelRes.ok) {
            const modelData = await ekycModelRes.json();
            if (modelData.value) {
              setEkycModel(modelData.value.replace(/"/g, ''));
            }
          }
          // Fetch vision models
          const modelsRes = await fetch('/api/admin/models/vision');
          if (modelsRes.ok) {
            const modelsData = await modelsRes.json();
            setVisionModels(modelsData.models || []);
          }
        } catch (e) {
          console.error('Failed to fetch eKYC settings:', e);
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
        packagesTabEnabled: settings?.packagesTabEnabled,
        tripDetailsEnabled: settings?.tripDetailsEnabled,
        tripCategoriesEnabled: settings?.tripCategoriesEnabled,
        popularDestinationsEnabled: settings?.popularDestinationsEnabled,
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
            {/* Admin User Menu */}
            <div className="relative">
              <button
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
                  {adminInfo?.displayName
                    ? adminInfo.displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'SA'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">{adminInfo?.displayName || 'Super Admin'}</div>
                  <div className="text-xs text-gray-500">Administrator</div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {adminMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAdminMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{adminInfo?.displayName || 'Super Admin'}</div>
                      <div className="text-sm text-gray-500">{adminInfo?.email || ''}</div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          // Navigate to profile if exists
                          router.push('/profile');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Users className="w-4 h-4 text-gray-400" />
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          setProfileInfoModal({
                            open: true,
                            displayName: adminInfo?.displayName || '',
                            email: adminInfo?.email || '',
                            loading: false,
                            error: null,
                            success: false,
                          });
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          setChangePasswordModal({
                            open: true,
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                            loading: false,
                            error: null,
                          });
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Key className="w-4 h-4 text-gray-400" />
                        Change Password
                      </button>
                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          // Show settings or edit info
                          setActiveTab('settings');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                      >
                        <Settings className="w-4 h-4 text-gray-400" />
                        Admin Settings
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => {
                          setAdminMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
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
              onClick={() => setActiveTab('featured')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'featured'
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Featured</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('businesses')}
              className={`px-6 py-4 font-medium transition ${
                activeTab === 'businesses'
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Businesses</span>
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
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_users?.toLocaleString() || 0}</p>
                    <p className="text-xs text-green-600 mt-1">+{stats.users_today || 0} today</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500 opacity-80" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Trips</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_trips?.toLocaleString() || 0}</p>
                    <p className="text-xs text-green-600 mt-1">+{stats.trips_today || 0} today</p>
                  </div>
                  <Activity className="w-10 h-10 text-green-500 opacity-80" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">AI Cost (Total)</p>
                    <p className="text-2xl font-bold text-gray-900">${parseFloat(stats.total_cost || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">${parseFloat(stats.cost_this_month || 0).toFixed(2)} this month</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-purple-500 opacity-80" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tokens Used</p>
                    <p className="text-2xl font-bold text-gray-900">{parseInt(stats.total_tokens || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">{parseInt(stats.tokens_this_month || 0).toLocaleString()} this month</p>
                  </div>
                  <Zap className="w-10 h-10 text-orange-500 opacity-80" />
                </div>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-500">Active Users (7d)</p>
                <p className="text-xl font-bold text-gray-900">{stats.active_users || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-500">AI Generated</p>
                <p className="text-xl font-bold text-gray-900">{stats.ai_generated_trips || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-xl font-bold text-gray-900">{parseInt(stats.total_views || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-500">Total Clones</p>
                <p className="text-xl font-bold text-gray-900">{parseInt(stats.total_clones || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-500">Featured Creators</p>
                <p className="text-xl font-bold text-gray-900">{stats.featured_creators_count || 0}</p>
              </div>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Performance Metrics */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600" />
                  Performance (30 Days)
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg Response Time</span>
                    <span className="font-semibold">{parseFloat(stats.avg_response_time || 0).toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Success Rate</span>
                    <span className="font-semibold text-green-600">{parseFloat(stats.success_rate || 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Premium Users</span>
                    <span className="font-semibold">{stats.premium_users || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Users This Week</span>
                    <span className="font-semibold">{stats.users_this_week || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Trips This Week</span>
                    <span className="font-semibold">{stats.trips_this_week || 0}</span>
                  </div>
                </div>
              </div>

              {/* Business Stats */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Business Partners
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Businesses</span>
                    <span className="font-semibold">{stats.total_businesses || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Verified (eKYC)</span>
                    <span className="font-semibold text-green-600">{stats.verified_businesses || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Active</span>
                    <span className="font-semibold">{stats.active_businesses || 0}</span>
                  </div>
                  {stats.total_businesses > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Verification Rate</span>
                        <span className="font-medium">
                          {((stats.verified_businesses || 0) / stats.total_businesses * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Destinations */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-600" />
                  Top Destinations
                </h3>
                {stats.topDestinations && stats.topDestinations.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topDestinations.map((dest: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-600 truncate flex-1">{dest.city}</span>
                        <span className="font-semibold text-sm bg-gray-100 px-2 py-0.5 rounded">
                          {dest.trip_count} trips
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No destination data yet</p>
                )}
              </div>
            </div>

            {/* AI Model Usage */}
            {stats.modelUsage && stats.modelUsage.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-600" />
                  AI Model Usage
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 font-medium">Model</th>
                        <th className="pb-3 font-medium">Provider</th>
                        <th className="pb-3 font-medium text-right">Uses</th>
                        <th className="pb-3 font-medium text-right">Tokens</th>
                        <th className="pb-3 font-medium text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.modelUsage.map((model: any, index: number) => (
                        <tr key={index} className="text-sm">
                          <td className="py-3 font-medium text-gray-900">{model.display_name}</td>
                          <td className="py-3 text-gray-600 capitalize">{model.provider}</td>
                          <td className="py-3 text-right">{model.usage_count}</td>
                          <td className="py-3 text-right">{parseInt(model.tokens_used || 0).toLocaleString()}</td>
                          <td className="py-3 text-right">${parseFloat(model.total_cost || 0).toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            {stats.activityTimeline && stats.activityTimeline.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  Activity (Last 7 Days)
                </h3>
                <div className="grid grid-cols-7 gap-2">
                  {stats.activityTimeline.slice().reverse().map((day: any, index: number) => {
                    const maxTrips = Math.max(...stats.activityTimeline.map((d: any) => parseInt(d.trips) || 1));
                    const height = Math.max(20, (parseInt(day.trips) / maxTrips) * 100);
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div className="w-full flex flex-col items-center justify-end h-24">
                          <div
                            className="w-full bg-gradient-to-t from-teal-500 to-emerald-400 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-xs font-medium text-gray-700">{day.trips}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Recent Trip Generations</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {queriesAiOnly ? 'AI-generated trips only' : 'All trips (including manual)'}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-600">AI Only</span>
                  <button
                    type="button"
                    onClick={() => setQueriesAiOnly(!queriesAiOnly)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      queriesAiOnly ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        queriesAiOnly ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentQueries.length === 0 ? (
                <div className="p-12 text-center">
                  <Database className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">
                    {queriesAiOnly
                      ? 'No AI-generated trips found'
                      : 'No trip generations yet'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {queriesAiOnly
                      ? 'Try disabling the AI Only filter to see all trips'
                      : 'Trips will appear here once generated'}
                  </p>
                </div>
              ) : (
                recentQueries.map((query, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">{query.title}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            query.ai_model_display_name
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {query.ai_model_display_name || 'Manual Creation'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>User: {query.user_email || 'Unknown'}</div>
                          <div>
                            {query.start_date} to {query.end_date}
                            {query.num_people && ` • ${query.num_people} people`}
                            {query.city && ` • ${query.city}`}
                          </div>
                          {query.travel_type && query.travel_type.length > 0 && (
                            <div>Travel Type: {query.travel_type.join(', ')}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {query.ai_model_display_name ? (
                          <>
                            <div className="text-gray-900 font-medium">
                              {query.generation_time_ms ? `${query.generation_time_ms}ms` : '-'}
                            </div>
                            <div className="text-gray-600">
                              {query.tokens_used ? `${query.tokens_used.toLocaleString()} tokens` : '-'}
                            </div>
                            <div className="text-gray-600">
                              {query.total_cost ? `$${query.total_cost.toFixed(4)}` : '-'}
                            </div>
                          </>
                        ) : (
                          <div className="text-gray-400 text-xs">No AI metrics</div>
                        )}
                        <div className="text-gray-500 text-xs mt-1">
                          {new Date(query.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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

        {/* Featured Creators Tab */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Featured Creators Management</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage which creators are featured on the /creators page by category
                  </p>
                </div>
                <button
                  onClick={() => setShowAddFeaturedModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Featured
                </button>
              </div>
            </div>

            {featuredLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Category Sections */}
                {Object.entries(INTEREST_CATEGORIES).map(([categoryId, category]) => {
                  const creators = featuredCreators[categoryId] || [];
                  return (
                    <div key={categoryId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.emoji}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{category.label}</h4>
                            <p className="text-sm text-gray-500">{creators.length} featured creators</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setAddFeaturedCategory(categoryId);
                            setShowAddFeaturedModal(true);
                          }}
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      {creators.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p>No featured creators in this category</p>
                          <p className="text-xs mt-1">Algorithmic suggestions will be shown instead</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {creators.map((creator: any, index: number) => (
                            <div
                              key={creator.id}
                              className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="text-gray-300 cursor-move">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                {creator.avatar_url ? (
                                  <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                    <span className="text-white font-medium">{(creator.full_name || 'U')[0].toUpperCase()}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900 truncate">{creator.full_name || 'Unknown'}</p>
                                  {creator.username && (
                                    <span className="text-sm text-gray-500">@{creator.username}</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">{creator.location || 'No location'}</p>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{creator.itinerary_count || 0} itineraries</span>
                                <span>•</span>
                                <span>{creator.total_clones || 0} clones</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/profile/${creator.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={async () => {
                                    await fetch(`/api/admin/featured-creators/${creator.featured_id}`, {
                                      method: 'DELETE',
                                    });
                                    fetchData();
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Preview Button */}
                <div className="flex justify-center">
                  <a
                    href="/creators"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Preview /creators Page
                  </a>
                </div>
              </>
            )}

            {/* Add Featured Modal */}
            {showAddFeaturedModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Add Featured Creator</h3>
                      <p className="text-sm text-gray-500">Search for a creator to feature</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddFeaturedModal(false);
                        setCreatorSearch('');
                        setCreatorSearchResults([]);
                        setAddFeaturedCategory('');
                        setAddFeaturedUntil('');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                    {/* Category Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={addFeaturedCategory}
                        onChange={(e) => setAddFeaturedCategory(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">Select a category...</option>
                        {Object.entries(INTEREST_CATEGORIES).map(([id, cat]) => (
                          <option key={id} value={id}>{cat.emoji} {cat.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Featured Until Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Featured Until <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={addFeaturedUntil}
                        onChange={(e) => setAddFeaturedUntil(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        placeholder="Select end date"
                        title="Featured until date"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <p className="mt-1 text-xs text-gray-500">Leave empty for permanent featuring</p>
                    </div>

                    {/* Creator Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search Creators</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={creatorSearch}
                          onChange={async (e) => {
                            setCreatorSearch(e.target.value);
                            if (e.target.value.length >= 2) {
                              setSearchingCreators(true);
                              try {
                                const res = await fetch(`/api/creators?search=${encodeURIComponent(e.target.value)}&limit=10`);
                                if (res.ok) {
                                  const data = await res.json();
                                  setCreatorSearchResults(data.creators || []);
                                }
                              } finally {
                                setSearchingCreators(false);
                              }
                            } else {
                              setCreatorSearchResults([]);
                            }
                          }}
                          placeholder="Search by name or username..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                        {searchingCreators && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                        )}
                      </div>
                    </div>

                    {/* Search Results */}
                    {creatorSearchResults.length > 0 && (
                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
                        {creatorSearchResults.map((creator: any) => (
                          <button
                            key={creator.id}
                            onClick={async () => {
                              if (!addFeaturedCategory) {
                                alert('Please select a category first');
                                return;
                              }
                              setFeaturedSaveStatus('saving');
                              try {
                                const res = await fetch('/api/admin/featured-creators', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    userId: creator.id,
                                    category: addFeaturedCategory,
                                    featuredUntil: addFeaturedUntil || null,
                                  }),
                                });
                                if (res.ok) {
                                  setFeaturedSaveStatus('success');
                                  setShowAddFeaturedModal(false);
                                  setCreatorSearch('');
                                  setCreatorSearchResults([]);
                                  setAddFeaturedCategory('');
                                  setAddFeaturedUntil('');
                                  fetchData();
                                } else {
                                  const data = await res.json();
                                  alert(data.error || 'Failed to add featured creator');
                                  setFeaturedSaveStatus('error');
                                }
                              } catch {
                                setFeaturedSaveStatus('error');
                              }
                            }}
                            disabled={featuredSaveStatus === 'saving'}
                            className="w-full p-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors text-left disabled:opacity-50"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {creator.avatarUrl ? (
                                <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                  <span className="text-white font-medium">{(creator.fullName || 'U')[0].toUpperCase()}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{creator.fullName || 'Unknown'}</p>
                              {creator.username && (
                                <p className="text-sm text-gray-500">@{creator.username}</p>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {creator.stats?.itineraryCount || 0} itineraries
                            </div>
                            <Plus className="w-5 h-5 text-emerald-600" />
                          </button>
                        ))}
                      </div>
                    )}

                    {creatorSearch.length >= 2 && creatorSearchResults.length === 0 && !searchingCreators && (
                      <div className="text-center py-6 text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No creators found matching &quot;{creatorSearch}&quot;</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Businesses Tab */}
        {activeTab === 'businesses' && (
          <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Business Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage registered businesses, verification status, and eKYC documents</p>
                </div>
                <button
                  onClick={() => fetchData()}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {/* Stats Cards */}
              {businessStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                      <Building2 className="w-4 h-4" />
                      Total
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{businessStats.total || 0}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                      <CheckCircle className="w-4 h-4" />
                      Active
                    </div>
                    <div className="text-2xl font-bold text-green-700">{businessStats.active || 0}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
                      <Ban className="w-4 h-4" />
                      Inactive
                    </div>
                    <div className="text-2xl font-bold text-red-700">{businessStats.inactive || 0}</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                      <FileCheck className="w-4 h-4" />
                      Verified
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{businessStats.verified || 0}</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
                      <ScanEye className="w-4 h-4" />
                      Pending eKYC
                    </div>
                    <div className="text-2xl font-bold text-amber-700">{businessStats.pendingVerification || 0}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[250px]">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search businesses..."
                      value={businessSearch}
                      onChange={(e) => setBusinessSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <select
                  value={businessFilter}
                  onChange={(e) => setBusinessFilter(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="verified">eKYC Verified</option>
                  <option value="pending">Pending Verification</option>
                </select>

                {/* Type Filter */}
                <select
                  value={businessTypeFilter}
                  onChange={(e) => setBusinessTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Types</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="hotel">Hotel</option>
                  <option value="tour_operator">Tour Operator</option>
                  <option value="attraction">Attraction</option>
                  <option value="transportation">Transportation</option>
                  <option value="retail">Retail</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Business List */}
            <div className="bg-white rounded-lg shadow-sm">
              {businessesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
              ) : businesses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No businesses found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">eKYC</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {businesses.map((business) => (
                      <tr
                        key={business.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={async (e) => {
                          // Don't open panel if clicking on action menu
                          if ((e.target as HTMLElement).closest('.action-menu-container')) return;
                          setBusinessDetailLoading(true);
                          try {
                            const res = await fetch(`/api/admin/businesses/${business.id}`);
                            if (res.ok) {
                              const data = await res.json();
                              setSelectedBusiness({ ...data.business, documents: data.documents });
                            }
                          } finally {
                            setBusinessDetailLoading(false);
                          }
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {business.logoUrl ? (
                              <img src={business.logoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{business.name}</div>
                              {business.location && (
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {business.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{business.ownerName || 'N/A'}</div>
                            <div className="text-gray-500">{business.ownerEmail || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                            {business.businessType?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            business.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {business.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {business.ekycVerified ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <FileCheck className="w-4 h-4" />
                              Verified
                            </span>
                          ) : business.hasDocuments ? (
                            <span className="flex items-center gap-1 text-amber-600 text-sm">
                              <ScanEye className="w-4 h-4" />
                              Pending
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Not Started</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(business.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right action-menu-container">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBusinessActionMenu(businessActionMenu === business.id ? null : business.id);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                            {businessActionMenu === business.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <button
                                  onClick={async () => {
                                    setBusinessActionMenu(null);
                                    setBusinessDetailLoading(true);
                                    try {
                                      const res = await fetch(`/api/admin/businesses/${business.id}`);
                                      if (res.ok) {
                                        const data = await res.json();
                                        setSelectedBusiness({ ...data.business, documents: data.documents });
                                      }
                                    } finally {
                                      setBusinessDetailLoading(false);
                                    }
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </button>
                                <button
                                  onClick={async () => {
                                    setBusinessActionMenu(null);
                                    const action = business.isActive ? 'deactivate' : 'activate';
                                    if (confirm(`Are you sure you want to ${action} this business?`)) {
                                      const res = await fetch(`/api/admin/businesses/${business.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ isActive: !business.isActive }),
                                      });
                                      if (res.ok) {
                                        fetchData();
                                      }
                                    }
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  {business.isActive ? (
                                    <>
                                      <Ban className="w-4 h-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      Activate
                                    </>
                                  )}
                                </button>
                                {business.hasDocuments && !business.ekycVerified && (
                                  <button
                                    onClick={async () => {
                                      setBusinessActionMenu(null);
                                      setBusinessDetailLoading(true);
                                      try {
                                        const res = await fetch(`/api/admin/businesses/${business.id}`);
                                        if (res.ok) {
                                          const data = await res.json();
                                          setSelectedBusiness({ ...data.business, documents: data.documents });
                                        }
                                      } finally {
                                        setBusinessDetailLoading(false);
                                      }
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                  >
                                    <ScanEye className="w-4 h-4" />
                                    Review Documents
                                  </button>
                                )}
                                <hr className="my-1" />
                                <button
                                  onClick={async () => {
                                    setBusinessActionMenu(null);
                                    if (confirm('Are you sure you want to permanently delete this business? This action cannot be undone.')) {
                                      const res = await fetch(`/api/admin/businesses/${business.id}`, {
                                        method: 'DELETE',
                                      });
                                      if (res.ok) {
                                        fetchData();
                                      }
                                    }
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete Business
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Business Detail Slide-in Panel */}
            {selectedBusiness && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 bg-black/30 z-40"
                  onClick={() => {
                    if (!businessConfirmModal.type) {
                      setSelectedBusiness(null);
                      setBusinessEditMode(false);
                    }
                  }}
                />
                {/* Slide-in Panel */}
                <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-auto">
                  {/* Confirmation Modal Overlay */}
                  {businessConfirmModal.type && (
                    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
                        <div className="text-center">
                          {businessConfirmModal.type === 'delete' ? (
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                              <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                          ) : businessConfirmModal.type === 'deactivate' ? (
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                              <Ban className="w-6 h-6 text-amber-600" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                          )}
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {businessConfirmModal.type === 'delete' && 'Delete Business'}
                            {businessConfirmModal.type === 'activate' && 'Activate Business'}
                            {businessConfirmModal.type === 'deactivate' && 'Deactivate Business'}
                            {businessConfirmModal.type === 'verify' && 'Verify eKYC'}
                            {businessConfirmModal.type === 'unverify' && 'Unverify eKYC'}
                          </h3>
                          <p className="text-gray-600 text-sm mb-6">
                            {businessConfirmModal.type === 'delete' && 'This action cannot be undone. All data associated with this business will be permanently removed.'}
                            {businessConfirmModal.type === 'activate' && 'This will make the business visible and active on the platform.'}
                            {businessConfirmModal.type === 'deactivate' && 'This will hide the business from the platform. Users will not be able to find or interact with it.'}
                            {businessConfirmModal.type === 'verify' && 'This will mark the business as eKYC verified. Make sure you have reviewed all documents.'}
                            {businessConfirmModal.type === 'unverify' && 'This will remove the eKYC verification status from this business.'}
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => setBusinessConfirmModal({ type: null, loading: false })}
                              disabled={businessConfirmModal.loading}
                              className="flex-1 py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                setBusinessConfirmModal(prev => ({ ...prev, loading: true }));
                                try {
                                  if (businessConfirmModal.type === 'delete') {
                                    const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      setSelectedBusiness(null);
                                      setBusinessEditMode(false);
                                      fetchData();
                                    }
                                  } else if (businessConfirmModal.type === 'activate' || businessConfirmModal.type === 'deactivate') {
                                    const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ isActive: businessConfirmModal.type === 'activate' }),
                                    });
                                    if (res.ok) {
                                      const refreshRes = await fetch(`/api/admin/businesses/${selectedBusiness.id}`);
                                      if (refreshRes.ok) {
                                        const refreshData = await refreshRes.json();
                                        setSelectedBusiness({ ...refreshData.business, documents: refreshData.documents });
                                      }
                                      fetchData();
                                    }
                                  } else if (businessConfirmModal.type === 'verify' || businessConfirmModal.type === 'unverify') {
                                    const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ ekycVerified: businessConfirmModal.type === 'verify' }),
                                    });
                                    if (res.ok) {
                                      const refreshRes = await fetch(`/api/admin/businesses/${selectedBusiness.id}`);
                                      if (refreshRes.ok) {
                                        const refreshData = await refreshRes.json();
                                        setSelectedBusiness({ ...refreshData.business, documents: refreshData.documents });
                                      }
                                      fetchData();
                                    }
                                  }
                                } finally {
                                  setBusinessConfirmModal({ type: null, loading: false });
                                }
                              }}
                              disabled={businessConfirmModal.loading}
                              className={`flex-1 py-2 px-4 rounded-lg font-medium text-white transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                                businessConfirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                                businessConfirmModal.type === 'deactivate' ? 'bg-amber-600 hover:bg-amber-700' :
                                'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {businessConfirmModal.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                              Confirm
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Panel Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                      {selectedBusiness.logoUrl ? (
                        <img src={selectedBusiness.logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{selectedBusiness.name || 'Unnamed Business'}</h3>
                        <p className="text-sm text-gray-500 capitalize">{selectedBusiness.businessType?.replace('_', ' ') || 'Unknown Type'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!businessEditMode && (
                        <button
                          onClick={() => {
                            setBusinessEditMode(true);
                            setBusinessEditForm({
                              name: selectedBusiness.name || '',
                              description: selectedBusiness.description || '',
                              businessType: selectedBusiness.businessType || '',
                              location: selectedBusiness.location || '',
                              phone: selectedBusiness.phone || '',
                              website: selectedBusiness.website || '',
                            });
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition"
                          title="Edit Business"
                        >
                          <Edit2 className="w-5 h-5 text-gray-500" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedBusiness(null);
                          setBusinessEditMode(false);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Edit Mode Form */}
                    {businessEditMode ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900">Edit Business Information</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setBusinessEditMode(false)}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    businessName: businessEditForm.name,
                                    description: businessEditForm.description,
                                    businessType: businessEditForm.businessType,
                                  }),
                                });
                                if (res.ok) {
                                  const refreshRes = await fetch(`/api/admin/businesses/${selectedBusiness.id}`);
                                  if (refreshRes.ok) {
                                    const refreshData = await refreshRes.json();
                                    setSelectedBusiness({ ...refreshData.business, documents: refreshData.documents });
                                  }
                                  setBusinessEditMode(false);
                                  fetchData();
                                }
                              }}
                              className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition flex items-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                            <input
                              type="text"
                              value={businessEditForm.name}
                              onChange={(e) => setBusinessEditForm({ ...businessEditForm, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                            <select
                              value={businessEditForm.businessType}
                              onChange={(e) => setBusinessEditForm({ ...businessEditForm, businessType: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              <option value="">Select Type</option>
                              <option value="guide">Guide</option>
                              <option value="hotel">Hotel</option>
                              <option value="transport">Transport</option>
                              <option value="experience">Experience</option>
                              <option value="restaurant">Restaurant</option>
                              <option value="tour_operator">Tour Operator</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={businessEditForm.description}
                              onChange={(e) => setBusinessEditForm({ ...businessEditForm, description: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>

                        {/* File Uploads Section */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-900">Upload Files</h4>

                          {/* Logo Upload */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Business Logo</label>
                            <div className="flex items-center gap-4">
                              {selectedBusiness.logoUrl ? (
                                <img src={selectedBusiness.logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                                  <Building2 className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setUploadingFile({ type: 'logo', progress: true });
                                    try {
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      formData.append('type', 'logo');
                                      const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}/upload`, {
                                        method: 'POST',
                                        body: formData,
                                      });
                                      if (res.ok) {
                                        const refreshRes = await fetch(`/api/admin/businesses/${selectedBusiness.id}`);
                                        if (refreshRes.ok) {
                                          const refreshData = await refreshRes.json();
                                          setSelectedBusiness({ ...refreshData.business, documents: refreshData.documents });
                                        }
                                        fetchData();
                                      } else {
                                        const err = await res.json();
                                        alert(err.error || 'Upload failed');
                                      }
                                    } finally {
                                      setUploadingFile(null);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="hidden"
                                  id="logo-upload"
                                />
                                <label
                                  htmlFor="logo-upload"
                                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer transition ${
                                    uploadingFile?.type === 'logo'
                                      ? 'bg-gray-200 text-gray-500'
                                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {uploadingFile?.type === 'logo' ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4" />
                                      Upload Logo
                                    </>
                                  )}
                                </label>
                                <p className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP. Max 10MB</p>
                              </div>
                            </div>
                          </div>

                          {/* Verification Documents */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <label className="block text-sm font-medium text-gray-700 mb-3">Verification Documents</label>
                            <div className="space-y-3">
                              {/* Business License */}
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-blue-50">
                                    <FileCheck className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">Business License</div>
                                    <div className="text-xs text-gray-500">
                                      {selectedBusiness.documents?.find((d: any) => d.documentType === 'business_license')
                                        ? 'Uploaded'
                                        : 'Not uploaded'}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingFile({ type: 'business_license', progress: true });
                                      try {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        formData.append('type', 'business_license');
                                        const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}/upload`, {
                                          method: 'POST',
                                          body: formData,
                                        });
                                        if (res.ok) {
                                          const refreshRes = await fetch(`/api/admin/businesses/${selectedBusiness.id}`);
                                          if (refreshRes.ok) {
                                            const refreshData = await refreshRes.json();
                                            setSelectedBusiness({ ...refreshData.business, documents: refreshData.documents });
                                          }
                                          fetchData();
                                        } else {
                                          const err = await res.json();
                                          alert(err.error || 'Upload failed');
                                        }
                                      } finally {
                                        setUploadingFile(null);
                                        e.target.value = '';
                                      }
                                    }}
                                    className="hidden"
                                    id="license-upload"
                                  />
                                  <label
                                    htmlFor="license-upload"
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition ${
                                      uploadingFile?.type === 'business_license'
                                        ? 'bg-gray-200 text-gray-500'
                                        : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                                    }`}
                                  >
                                    {uploadingFile?.type === 'business_license' ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-4 h-4" />
                                        Upload
                                      </>
                                    )}
                                  </label>
                                </div>
                              </div>

                              {/* Owner ID */}
                              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-purple-50">
                                    <Users className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">Owner ID</div>
                                    <div className="text-xs text-gray-500">
                                      {selectedBusiness.documents?.find((d: any) => d.documentType === 'owner_id')
                                        ? 'Uploaded'
                                        : 'Not uploaded'}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingFile({ type: 'owner_id', progress: true });
                                      try {
                                        const formData = new FormData();
                                        formData.append('file', file);
                                        formData.append('type', 'owner_id');
                                        const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}/upload`, {
                                          method: 'POST',
                                          body: formData,
                                        });
                                        if (res.ok) {
                                          const refreshRes = await fetch(`/api/admin/businesses/${selectedBusiness.id}`);
                                          if (refreshRes.ok) {
                                            const refreshData = await refreshRes.json();
                                            setSelectedBusiness({ ...refreshData.business, documents: refreshData.documents });
                                          }
                                          fetchData();
                                        } else {
                                          const err = await res.json();
                                          alert(err.error || 'Upload failed');
                                        }
                                      } finally {
                                        setUploadingFile(null);
                                        e.target.value = '';
                                      }
                                    }}
                                    className="hidden"
                                    id="ownerid-upload"
                                  />
                                  <label
                                    htmlFor="ownerid-upload"
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition ${
                                      uploadingFile?.type === 'owner_id'
                                        ? 'bg-gray-200 text-gray-500'
                                        : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                                    }`}
                                  >
                                    {uploadingFile?.type === 'owner_id' ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-4 h-4" />
                                        Upload
                                      </>
                                    )}
                                  </label>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Accepted: JPEG, PNG, WebP, PDF. Max 10MB each</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Quick Actions */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => setBusinessConfirmModal({
                              type: selectedBusiness.isActive ? 'deactivate' : 'activate',
                              loading: false
                            })}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                              selectedBusiness.isActive
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {selectedBusiness.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setBusinessConfirmModal({ type: 'delete', loading: false })}
                            className="py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                            title="Delete Business"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Status Cards with eKYC Toggle */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-4 rounded-lg ${selectedBusiness.isActive ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="text-sm text-gray-600 mb-1">Account Status</div>
                            <div className={`font-semibold ${selectedBusiness.isActive ? 'text-green-700' : 'text-red-700'}`}>
                              {selectedBusiness.isActive ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg ${selectedBusiness.ekycVerified ? 'bg-green-50' : 'bg-amber-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm text-gray-600 mb-1">eKYC Status</div>
                                <div className={`font-semibold ${selectedBusiness.ekycVerified ? 'text-green-700' : 'text-amber-700'}`}>
                                  {selectedBusiness.ekycVerified ? 'Verified' : 'Pending'}
                                </div>
                              </div>
                              {/* eKYC Toggle */}
                              <button
                                onClick={() => setBusinessConfirmModal({
                                  type: selectedBusiness.ekycVerified ? 'unverify' : 'verify',
                                  loading: false
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  selectedBusiness.ekycVerified ? 'bg-green-600' : 'bg-gray-300'
                                }`}
                                title={selectedBusiness.ekycVerified ? 'Click to unverify' : 'Click to verify'}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    selectedBusiness.ekycVerified ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Business Info */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-500">Business Information</h4>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              <span>{selectedBusiness.name || 'N/A'}</span>
                            </div>
                            {selectedBusiness.handle && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-gray-400 w-4 h-4 flex items-center justify-center text-sm">@</span>
                                <span>{selectedBusiness.handle}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-700">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{selectedBusiness.location || 'No location'}</span>
                            </div>
                            {selectedBusiness.phone && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <span className="text-gray-400 w-4 h-4 flex items-center justify-center text-sm">📞</span>
                                <span>{selectedBusiness.phone}</span>
                              </div>
                            )}
                            {selectedBusiness.website && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline truncate">
                                  {selectedBusiness.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Owner Info */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-500">Owner Information</h4>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span>{selectedBusiness.ownerName || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{selectedBusiness.ownerEmail || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Created Date */}
                        <div className="text-sm text-gray-500">
                          Created: {selectedBusiness.createdAt ? new Date(selectedBusiness.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>

                        {/* Description */}
                        {selectedBusiness.description && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                            <p className="text-gray-700">{selectedBusiness.description}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Verification Documents */}
                    {selectedBusiness.documents && selectedBusiness.documents.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Verification Documents</h4>
                        <div className="space-y-4">
                          {selectedBusiness.documents.map((doc: any) => (
                            <div key={doc.id} className="border border-gray-200 rounded-lg overflow-hidden">
                              {/* Document Image Preview */}
                              {doc.documentUrl && (
                                <div
                                  className="relative bg-gray-100 cursor-pointer group"
                                  onClick={() => setDocumentPreview({ url: doc.documentUrl, type: doc.documentType })}
                                >
                                  <img
                                    src={doc.documentUrl}
                                    alt={doc.documentType}
                                    className="w-full h-48 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition bg-white/90 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">
                                      Click to enlarge
                                    </div>
                                  </div>
                                  {/* Status Badge */}
                                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                                    doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {doc.status === 'approved' ? 'Approved' :
                                     doc.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                                  </div>
                                </div>
                              )}

                              {/* Document Info & Actions */}
                              <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      doc.status === 'approved' ? 'bg-green-100' :
                                      doc.status === 'rejected' ? 'bg-red-100' :
                                      'bg-amber-100'
                                    }`}>
                                      {doc.status === 'approved' ? (
                                        <FileCheck className="w-5 h-5 text-green-600" />
                                      ) : doc.status === 'rejected' ? (
                                        <FileX className="w-5 h-5 text-red-600" />
                                      ) : (
                                        <ScanEye className="w-5 h-5 text-amber-600" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900 capitalize">
                                        {doc.documentType.replace('_', ' ')}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                  <a
                                    href={doc.documentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                                    title="Open in new tab"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>

                                {/* Action Buttons for Pending Documents */}
                                {doc.status === 'pending' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={async () => {
                                        const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}/verify`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            documentType: doc.documentType,
                                            action: 'approve',
                                          }),
                                        });
                                        if (res.ok) {
                                          const refreshRes = await fetch(`/api/admin/businesses/${selectedBusiness.id}`);
                                          if (refreshRes.ok) {
                                            const refreshData = await refreshRes.json();
                                            setSelectedBusiness({ ...refreshData.business, documents: refreshData.documents });
                                          }
                                          fetchData();
                                        }
                                      }}
                                      className="flex-1 py-2 px-4 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => setRejectDocModal({ docType: doc.documentType, reason: '', loading: false })}
                                      className="flex-1 py-2 px-4 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                                    >
                                      <FileX className="w-4 h-4" />
                                      Reject
                                    </button>
                                  </div>
                                )}

                                {/* Rejection Reason Display */}
                                {doc.status === 'rejected' && doc.rejectionReason && (
                                  <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                                    <span className="font-medium">Rejection Reason:</span> {doc.rejectionReason}
                                  </div>
                                )}

                                {/* AI Analysis Display */}
                                {doc.aiAnalysis && (
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                    <div className="text-sm font-medium text-blue-700 mb-1">AI Analysis</div>
                                    <div className="text-sm text-blue-600">
                                      Confidence: {(doc.aiAnalysis.confidence * 100).toFixed(0)}%
                                    </div>
                                    {doc.aiAnalysis.extractedData && (
                                      <div className="mt-2 text-xs text-gray-600">
                                        {Object.entries(doc.aiAnalysis.extractedData).map(([key, value]) => (
                                          <div key={key} className="flex">
                                            <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                            <span className="ml-2">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Document Preview Modal */}
                  {documentPreview && (
                    <div
                      className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                      onClick={() => setDocumentPreview(null)}
                    >
                      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setDocumentPreview(null)}
                          className="absolute -top-12 right-0 p-2 text-white hover:bg-white/20 rounded-lg transition"
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <div className="text-white text-center mb-2 capitalize">
                          {documentPreview.type.replace('_', ' ')}
                        </div>
                        <img
                          src={documentPreview.url}
                          alt={documentPreview.type}
                          className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        />
                        <a
                          href={documentPreview.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 flex items-center justify-center gap-2 text-white hover:text-teal-300 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason Modal */}
                  {rejectDocModal && (
                    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <FileX className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Reject Document</h3>
                            <p className="text-sm text-gray-500 capitalize">{rejectDocModal.docType.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for rejection <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={rejectDocModal.reason}
                            onChange={(e) => setRejectDocModal({ ...rejectDocModal, reason: e.target.value })}
                            placeholder="Please provide a clear reason for rejecting this document..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setRejectDocModal(null)}
                            disabled={rejectDocModal.loading}
                            className="flex-1 py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              if (!rejectDocModal.reason.trim()) return;
                              setRejectDocModal({ ...rejectDocModal, loading: true });
                              try {
                                const res = await fetch(`/api/admin/businesses/${selectedBusiness.id}/verify`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    documentType: rejectDocModal.docType,
                                    action: 'reject',
                                    rejectionReason: rejectDocModal.reason,
                                  }),
                                });
                                if (res.ok) {
                                  const refreshRes = await fetch(`/api/admin/businesses/${selectedBusiness.id}`);
                                  if (refreshRes.ok) {
                                    const refreshData = await refreshRes.json();
                                    setSelectedBusiness({ ...refreshData.business, documents: refreshData.documents });
                                  }
                                  fetchData();
                                  setRejectDocModal(null);
                                }
                              } catch {
                                setRejectDocModal({ ...rejectDocModal, loading: false });
                              }
                            }}
                            disabled={rejectDocModal.loading || !rejectDocModal.reason.trim()}
                            className="flex-1 py-2 px-4 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {rejectDocModal.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Reject Document
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
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

                {/* Packages Tab Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Show Packages Tab</p>
                    <p className="text-sm text-gray-500">Display the Packages tab in the Chatbox for travel packages</p>
                  </div>
                  <button
                    onClick={() => setSettings(s => s ? { ...s, packagesTabEnabled: !s.packagesTabEnabled } : s)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      settings?.packagesTabEnabled ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                        settings?.packagesTabEnabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Trip Details Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Show Trip Details</p>
                    <p className="text-sm text-gray-500">Display the Trip details section in the Chatbox (destination, dates, budget tags)</p>
                  </div>
                  <button
                    onClick={() => setSettings(s => s ? { ...s, tripDetailsEnabled: !s.tripDetailsEnabled } : s)}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      settings?.tripDetailsEnabled !== false ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                        settings?.tripDetailsEnabled !== false ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Landing Page Sections */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Landing Page Sections</p>

                  {/* Trip Categories Toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-gray-900">Show Trip Categories</p>
                      <p className="text-sm text-gray-500">Display the Trip Categories section on the landing page</p>
                    </div>
                    <button
                      onClick={() => setSettings(s => s ? { ...s, tripCategoriesEnabled: !s.tripCategoriesEnabled } : s)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings?.tripCategoriesEnabled !== false ? 'bg-teal-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                          settings?.tripCategoriesEnabled !== false ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Popular Destinations Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Show Popular Destinations</p>
                      <p className="text-sm text-gray-500">Display the Popular Destinations section on the landing page</p>
                    </div>
                    <button
                      onClick={() => setSettings(s => s ? { ...s, popularDestinationsEnabled: !s.popularDestinationsEnabled } : s)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings?.popularDestinationsEnabled !== false ? 'bg-teal-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                          settings?.popularDestinationsEnabled !== false ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
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

            {/* eKYC AI Verification */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <ScanEye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">AI Document Verification (eKYC)</h3>
                    <p className="text-sm text-gray-600">Use AI vision models to verify business documents</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* eKYC Enable Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Enable AI Document Verification</p>
                    <p className="text-sm text-gray-500">
                      Automatically analyze uploaded business documents using AI vision models
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      const newValue = !ekycEnabled;
                      setEkycEnabled(newValue);
                      await fetch('/api/admin/site-settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: 'ekyc_enabled', value: String(newValue) }),
                      });
                    }}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      ekycEnabled ? 'bg-cyan-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                        ekycEnabled ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {ekycEnabled && (
                  <>
                    {/* Vision Model Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vision AI Model
                      </label>
                      <select
                        value={ekycModel}
                        onChange={async (e) => {
                          setEkycModel(e.target.value);
                          await fetch('/api/admin/site-settings', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ key: 'ekyc_model', value: e.target.value }),
                          });
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      >
                        <option value="deepseek-vl2">DeepSeek VL2 via SiliconFlow - Cheapest (~¥0.99/M tokens)</option>
                        <option value="qwen-vl-plus">Qwen-VL Plus (Alibaba) - Good balance (~$0.58/M tokens)</option>
                        <option value="glm-4v">GLM-4V (Zhipu) - Premium (~$1.40/M tokens)</option>
                      </select>
                      <p className="mt-2 text-sm text-gray-500">
                        All models can analyze ID documents and business licenses
                      </p>
                    </div>

                    {/* API Keys Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">Vision AI API Keys</h4>
                      <div className="space-y-4">
                        {/* SiliconFlow API Key (for DeepSeek VL2) */}
                        <div className={`p-4 rounded-xl border ${ekycModel === 'deepseek-vl2' ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">SiliconFlow (DeepSeek VL2)</span>
                              {ekycModel === 'deepseek-vl2' && (
                                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">Active</span>
                              )}
                            </div>
                            <button
                              onClick={async () => {
                                setEkycKeyTestStatus({ provider: 'siliconflow', status: 'testing' });
                                try {
                                  const res = await fetch('/api/admin/test-vision-key', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ provider: 'siliconflow', apiKey: deepseekApiKey }),
                                  });
                                  const data = await res.json();
                                  setEkycKeyTestStatus({
                                    provider: 'siliconflow',
                                    status: data.success ? 'success' : 'error',
                                    message: data.message,
                                  });
                                } catch (e: any) {
                                  setEkycKeyTestStatus({ provider: 'siliconflow', status: 'error', message: e.message });
                                }
                                setTimeout(() => setEkycKeyTestStatus({ provider: '', status: 'idle' }), 5000);
                              }}
                              disabled={!deepseekApiKey || ekycKeyTestStatus.provider === 'siliconflow' && ekycKeyTestStatus.status === 'testing'}
                              className="text-sm text-cyan-600 hover:text-cyan-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {ekycKeyTestStatus.provider === 'siliconflow' && ekycKeyTestStatus.status === 'testing' ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Testing...</>
                              ) : (
                                <><RefreshCw className="w-3 h-3" /> Test Key</>
                              )}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showDeepseekApiKey ? 'text' : 'password'}
                              value={deepseekApiKey}
                              onChange={(e) => setDeepseekApiKey(e.target.value)}
                              placeholder="sk-..."
                              className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowDeepseekApiKey(!showDeepseekApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showDeepseekApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {ekycKeyTestStatus.provider === 'siliconflow' && ekycKeyTestStatus.status !== 'idle' && ekycKeyTestStatus.status !== 'testing' && (
                            <p className={`mt-2 text-xs flex items-center gap-1 ${ekycKeyTestStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                              {ekycKeyTestStatus.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {ekycKeyTestStatus.message}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Get your key from <a href="https://siliconflow.cn" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">siliconflow.cn</a> (hosts DeepSeek VL2)
                          </p>
                        </div>

                        {/* Alibaba (Qwen) API Key */}
                        <div className={`p-4 rounded-xl border ${ekycModel === 'qwen-vl-plus' ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">Alibaba (Qwen-VL)</span>
                              {ekycModel === 'qwen-vl-plus' && (
                                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">Active</span>
                              )}
                            </div>
                            <button
                              onClick={async () => {
                                setEkycKeyTestStatus({ provider: 'alibaba', status: 'testing' });
                                try {
                                  const res = await fetch('/api/admin/test-vision-key', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ provider: 'alibaba', apiKey: alibabaApiKey }),
                                  });
                                  const data = await res.json();
                                  setEkycKeyTestStatus({
                                    provider: 'alibaba',
                                    status: data.success ? 'success' : 'error',
                                    message: data.message,
                                  });
                                } catch (e: any) {
                                  setEkycKeyTestStatus({ provider: 'alibaba', status: 'error', message: e.message });
                                }
                                setTimeout(() => setEkycKeyTestStatus({ provider: '', status: 'idle' }), 5000);
                              }}
                              disabled={!alibabaApiKey || ekycKeyTestStatus.provider === 'alibaba' && ekycKeyTestStatus.status === 'testing'}
                              className="text-sm text-cyan-600 hover:text-cyan-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {ekycKeyTestStatus.provider === 'alibaba' && ekycKeyTestStatus.status === 'testing' ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Testing...</>
                              ) : (
                                <><RefreshCw className="w-3 h-3" /> Test Key</>
                              )}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showAlibabaApiKey ? 'text' : 'password'}
                              value={alibabaApiKey}
                              onChange={(e) => setAlibabaApiKey(e.target.value)}
                              placeholder="sk-..."
                              className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAlibabaApiKey(!showAlibabaApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showAlibabaApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {ekycKeyTestStatus.provider === 'alibaba' && ekycKeyTestStatus.status !== 'idle' && ekycKeyTestStatus.status !== 'testing' && (
                            <p className={`mt-2 text-xs flex items-center gap-1 ${ekycKeyTestStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                              {ekycKeyTestStatus.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {ekycKeyTestStatus.message}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Get your key from <a href="https://dashscope.console.aliyun.com" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">dashscope.console.aliyun.com</a>
                          </p>
                        </div>

                        {/* Zhipu (GLM-4V) API Key */}
                        <div className={`p-4 rounded-xl border ${ekycModel === 'glm-4v' ? 'border-cyan-300 bg-cyan-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">Zhipu (GLM-4V)</span>
                              {ekycModel === 'glm-4v' && (
                                <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">Active</span>
                              )}
                            </div>
                            <button
                              onClick={async () => {
                                setEkycKeyTestStatus({ provider: 'zhipu', status: 'testing' });
                                try {
                                  const res = await fetch('/api/admin/test-vision-key', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ provider: 'zhipu', apiKey: zhipuApiKey }),
                                  });
                                  const data = await res.json();
                                  setEkycKeyTestStatus({
                                    provider: 'zhipu',
                                    status: data.success ? 'success' : 'error',
                                    message: data.message,
                                  });
                                } catch (e: any) {
                                  setEkycKeyTestStatus({ provider: 'zhipu', status: 'error', message: e.message });
                                }
                                setTimeout(() => setEkycKeyTestStatus({ provider: '', status: 'idle' }), 5000);
                              }}
                              disabled={!zhipuApiKey || ekycKeyTestStatus.provider === 'zhipu' && ekycKeyTestStatus.status === 'testing'}
                              className="text-sm text-cyan-600 hover:text-cyan-700 disabled:opacity-50 flex items-center gap-1"
                            >
                              {ekycKeyTestStatus.provider === 'zhipu' && ekycKeyTestStatus.status === 'testing' ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Testing...</>
                              ) : (
                                <><RefreshCw className="w-3 h-3" /> Test Key</>
                              )}
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showZhipuApiKey ? 'text' : 'password'}
                              value={zhipuApiKey}
                              onChange={(e) => setZhipuApiKey(e.target.value)}
                              placeholder="..."
                              className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                            />
                            <button
                              type="button"
                              onClick={() => setShowZhipuApiKey(!showZhipuApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showZhipuApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {ekycKeyTestStatus.provider === 'zhipu' && ekycKeyTestStatus.status !== 'idle' && ekycKeyTestStatus.status !== 'testing' && (
                            <p className={`mt-2 text-xs flex items-center gap-1 ${ekycKeyTestStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                              {ekycKeyTestStatus.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {ekycKeyTestStatus.message}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Get your key from <a href="https://open.bigmodel.cn" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">open.bigmodel.cn</a>
                          </p>
                        </div>
                      </div>

                      {/* Save API Keys Button */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
                        <div>
                          {ekycSaveStatus === 'success' && (
                            <span className="text-green-600 text-sm flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> API keys saved!
                            </span>
                          )}
                          {ekycSaveStatus === 'error' && (
                            <span className="text-red-600 text-sm flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" /> Failed to save
                            </span>
                          )}
                        </div>
                        <button
                          onClick={async () => {
                            setEkycSaveStatus('saving');
                            try {
                              const res = await fetch('/api/admin/settings', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  deepseekApiKey: deepseekApiKey || undefined,
                                  alibabaApiKey: alibabaApiKey || undefined,
                                  zhipuApiKey: zhipuApiKey || undefined,
                                }),
                              });
                              if (res.ok) {
                                setEkycSaveStatus('success');
                                setDeepseekApiKey('');
                                setAlibabaApiKey('');
                                setZhipuApiKey('');
                              } else {
                                setEkycSaveStatus('error');
                              }
                            } catch {
                              setEkycSaveStatus('error');
                            }
                            setTimeout(() => setEkycSaveStatus('idle'), 3000);
                          }}
                          disabled={ekycSaveStatus === 'saving' || (!deepseekApiKey && !alibabaApiKey && !zhipuApiKey)}
                          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white font-medium rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                        >
                          {ekycSaveStatus === 'saving' ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                          ) : (
                            <><Save className="w-4 h-4" /> Save API Keys</>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
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

      {/* Change Password Modal */}
      {changePasswordModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setChangePasswordModal({ ...changePasswordModal, open: false })}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              </div>
              <button
                onClick={() => setChangePasswordModal({ ...changePasswordModal, open: false })}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {changePasswordModal.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{changePasswordModal.error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={changePasswordModal.currentPassword}
                  onChange={(e) => setChangePasswordModal({
                    ...changePasswordModal,
                    currentPassword: e.target.value,
                    error: null,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={changePasswordModal.newPassword}
                  onChange={(e) => setChangePasswordModal({
                    ...changePasswordModal,
                    newPassword: e.target.value,
                    error: null,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={changePasswordModal.confirmPassword}
                  onChange={(e) => setChangePasswordModal({
                    ...changePasswordModal,
                    confirmPassword: e.target.value,
                    error: null,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setChangePasswordModal({ ...changePasswordModal, open: false })}
                disabled={changePasswordModal.loading}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Validation
                  if (!changePasswordModal.currentPassword) {
                    setChangePasswordModal({ ...changePasswordModal, error: 'Please enter your current password' });
                    return;
                  }
                  if (!changePasswordModal.newPassword) {
                    setChangePasswordModal({ ...changePasswordModal, error: 'Please enter a new password' });
                    return;
                  }
                  if (changePasswordModal.newPassword.length < 6) {
                    setChangePasswordModal({ ...changePasswordModal, error: 'New password must be at least 6 characters' });
                    return;
                  }
                  if (changePasswordModal.newPassword !== changePasswordModal.confirmPassword) {
                    setChangePasswordModal({ ...changePasswordModal, error: 'Passwords do not match' });
                    return;
                  }

                  setChangePasswordModal({ ...changePasswordModal, loading: true, error: null });

                  try {
                    const res = await fetch('/api/admin/login', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        currentPassword: changePasswordModal.currentPassword,
                        newPassword: changePasswordModal.newPassword,
                      }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                      setChangePasswordModal({
                        ...changePasswordModal,
                        loading: false,
                        error: data.error || 'Failed to change password',
                      });
                      return;
                    }

                    // Success - close modal and show success message
                    setChangePasswordModal({
                      open: false,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                      loading: false,
                      error: null,
                    });

                    // Update admin info if returned
                    if (data.admin) {
                      setAdminInfo(data.admin);
                    }
                  } catch {
                    setChangePasswordModal({
                      ...changePasswordModal,
                      loading: false,
                      error: 'An error occurred. Please try again.',
                    });
                  }
                }}
                disabled={changePasswordModal.loading}
                className="flex-1 py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {changePasswordModal.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {changePasswordModal.loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Info Modal */}
      {profileInfoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setProfileInfoModal({ ...profileInfoModal, open: false })}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setProfileInfoModal({ ...profileInfoModal, open: false })}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {profileInfoModal.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{profileInfoModal.error}</span>
              </div>
            )}

            {profileInfoModal.success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Profile updated successfully!</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileInfoModal.displayName}
                  onChange={(e) => setProfileInfoModal({
                    ...profileInfoModal,
                    displayName: e.target.value,
                    error: null,
                    success: false,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileInfoModal.email}
                  onChange={(e) => setProfileInfoModal({
                    ...profileInfoModal,
                    email: e.target.value,
                    error: null,
                    success: false,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter email address"
                />
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={adminInfo?.username || ''}
                  disabled
                  placeholder="Username"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setProfileInfoModal({ ...profileInfoModal, open: false })}
                disabled={profileInfoModal.loading}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  // Validation
                  if (!profileInfoModal.displayName.trim()) {
                    setProfileInfoModal({ ...profileInfoModal, error: 'Display name is required' });
                    return;
                  }
                  if (!profileInfoModal.email.trim()) {
                    setProfileInfoModal({ ...profileInfoModal, error: 'Email is required' });
                    return;
                  }
                  // Basic email validation
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileInfoModal.email)) {
                    setProfileInfoModal({ ...profileInfoModal, error: 'Please enter a valid email address' });
                    return;
                  }

                  setProfileInfoModal({ ...profileInfoModal, loading: true, error: null, success: false });

                  try {
                    const res = await fetch('/api/admin/login', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        displayName: profileInfoModal.displayName.trim(),
                        email: profileInfoModal.email.trim(),
                      }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                      setProfileInfoModal({
                        ...profileInfoModal,
                        loading: false,
                        error: data.error || 'Failed to update profile',
                      });
                      return;
                    }

                    // Update admin info
                    if (data.admin) {
                      setAdminInfo(data.admin);
                    }

                    // Show success message
                    setProfileInfoModal({
                      ...profileInfoModal,
                      loading: false,
                      error: null,
                      success: true,
                    });

                    // Auto-close after 1.5 seconds
                    setTimeout(() => {
                      setProfileInfoModal({
                        open: false,
                        displayName: '',
                        email: '',
                        loading: false,
                        error: null,
                        success: false,
                      });
                    }, 1500);
                  } catch {
                    setProfileInfoModal({
                      ...profileInfoModal,
                      loading: false,
                      error: 'An error occurred. Please try again.',
                    });
                  }
                }}
                disabled={profileInfoModal.loading}
                className="flex-1 py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {profileInfoModal.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {profileInfoModal.loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
