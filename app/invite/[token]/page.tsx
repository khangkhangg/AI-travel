'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/auth/supabase-browser';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface InviteData {
  valid: boolean;
  expired: boolean;
  alreadyAccepted: boolean;
  tripTitle?: string;
  tripCity?: string;
  role?: string;
  inviterEmail?: string;
  email?: string;
}

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    params.then(p => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    const checkInviteAndUser = async () => {
      try {
        // Get current user
        const supabase = createBrowserSupabaseClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Validate the invite
        const response = await fetch(`/api/invite/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setInviteData({ valid: false, expired: false, alreadyAccepted: false });
          setError(data.error || 'Invalid invite link');
        } else {
          setInviteData(data);
        }
      } catch (err) {
        console.error('Error checking invite:', err);
        setError('Failed to validate invite');
      } finally {
        setLoading(false);
      }
    };

    checkInviteAndUser();
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!token) return;

    setAccepting(true);
    try {
      const response = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to accept invite');
        return;
      }

      setSuccess(true);

      // Redirect to the trip after a short delay
      setTimeout(() => {
        router.push(`/trips/${data.tripId}/collaborate`);
      }, 1500);
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  const handleSignIn = () => {
    // Redirect to sign in with return URL
    const returnUrl = encodeURIComponent(`/invite/${token}`);
    router.push(`/login?returnUrl=${returnUrl}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Validating invite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invite Accepted!</h2>
            <p className="text-gray-600">Redirecting to the trip...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !inviteData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invite</h2>
            <p className="text-gray-600 text-center mb-6">
              {error || 'This invite link is invalid or has been revoked.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (inviteData.expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invite Expired</h2>
            <p className="text-gray-600 text-center mb-6">
              This invite link has expired. Please ask the trip owner to send a new invite.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (inviteData.alreadyAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Already Accepted</h2>
            <p className="text-gray-600 text-center mb-6">
              You've already accepted this invite!
            </p>
            <button
              onClick={() => router.push('/my-trips')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              View My Trips
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Valid invite - show accept UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 text-center border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">You're Invited!</h1>
          <p className="text-gray-500 mt-1">
            You've been invited to collaborate on a trip
          </p>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Trip</span>
              <span className="font-medium text-gray-900">{inviteData.tripTitle || 'Untitled Trip'}</span>
            </div>
            {inviteData.tripCity && (
              <div className="flex justify-between">
                <span className="text-gray-500">Destination</span>
                <span className="font-medium text-gray-900">{inviteData.tripCity}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Your Role</span>
              <span className="font-medium text-gray-900 capitalize">{inviteData.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Invited as</span>
              <span className="font-medium text-gray-900">{inviteData.email}</span>
            </div>
          </div>

          {!user ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600 text-sm">
                Sign in to accept this invite
              </p>
              <button
                onClick={handleSignIn}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign In to Accept
              </button>
            </div>
          ) : user.email !== inviteData.email ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  This invite was sent to <strong>{inviteData.email}</strong>, but you're signed in as <strong>{user.email}</strong>.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Sign In with Different Account
              </button>
            </div>
          ) : (
            <button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                'Accept Invite'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
