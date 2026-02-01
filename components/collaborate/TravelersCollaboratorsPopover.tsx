'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, X, UserPlus, Mail, Copy, Check, Loader2, Link as LinkIcon } from 'lucide-react';
import { Traveler } from '@/lib/types/collaborate';

interface Collaborator {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
}

interface TravelersCollaboratorsPopoverProps {
  tripId: string;
  travelers: Traveler[];
  onTravelersChange: (travelers: Traveler[]) => void;
}

export default function TravelersCollaboratorsPopover({
  tripId,
  travelers,
  onTravelersChange,
}: TravelersCollaboratorsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'travelers' | 'collaborators'>('travelers');
  const [showAddTraveler, setShowAddTraveler] = useState(false);
  const [newTraveler, setNewTraveler] = useState({ name: '', age: '', email: '', phone: '' });
  const [addingTraveler, setAddingTraveler] = useState(false);

  // Collaborators state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [showInviteLink, setShowInviteLink] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Fetch collaborators when tab changes
  useEffect(() => {
    if (activeTab === 'collaborators' && isOpen) {
      fetchCollaborators();
    }
  }, [activeTab, isOpen]);

  const fetchCollaborators = async () => {
    setLoadingCollaborators(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/collaborators`);
      if (response.ok) {
        const data = await response.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
    } finally {
      setLoadingCollaborators(false);
    }
  };

  const handleAddTraveler = async () => {
    if (!newTraveler.name || !newTraveler.age) return;

    setAddingTraveler(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/travelers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTraveler.name,
          age: parseInt(newTraveler.age),
          email: newTraveler.email || undefined,
          phone: newTraveler.phone || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onTravelersChange(data.travelers);
        setNewTraveler({ name: '', age: '', email: '', phone: '' });
        setShowAddTraveler(false);
      }
    } catch (error) {
      console.error('Failed to add traveler:', error);
    } finally {
      setAddingTraveler(false);
    }
  };

  const handleRemoveTraveler = async (travelerId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/travelers?travelerId=${travelerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        onTravelersChange(data.travelers);
      }
    } catch (error) {
      console.error('Failed to remove traveler:', error);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;

    setInviting(true);
    setInviteError('');

    try {
      const response = await fetch(`/api/trips/${tripId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteLink(data.inviteLink);
        setShowInviteLink(true);
        setInviteEmail('');
        fetchCollaborators();
      } else {
        setInviteError(data.error || 'Failed to create invite');
      }
    } catch (error) {
      setInviteError('Failed to create invite');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleRemoveCollaborator = async (userId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/collaborators?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCollaborators();
      }
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const adults = travelers.filter(t => !t.is_child);
  const children = travelers.filter(t => t.is_child);

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Users className="w-4 h-4" />
        <span>{travelers.length} traveler{travelers.length !== 1 ? 's' : ''}</span>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('travelers')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'travelers'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Travelers ({travelers.length})
            </button>
            <button
              onClick={() => setActiveTab('collaborators')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'collaborators'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Collaborators ({collaborators.length})
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === 'travelers' ? (
              <>
                {/* Travelers List */}
                {travelers.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {travelers.map((traveler) => (
                      <div
                        key={traveler.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            traveler.is_child
                              ? 'bg-gradient-to-br from-amber-400 to-orange-400'
                              : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                          }`}
                        >
                          {traveler.is_child ? '👶' : getInitials(traveler.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{traveler.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                              {traveler.age}y {traveler.is_child ? '(Child)' : ''}
                            </span>
                          </div>
                          {traveler.email && (
                            <p className="text-xs text-gray-500 truncate">{traveler.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveTraveler(traveler.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4 mb-4">
                    No travelers added yet
                  </p>
                )}

                {/* Add Traveler Form */}
                {showAddTraveler ? (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-xl">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Name *"
                        value={newTraveler.name}
                        onChange={(e) => setNewTraveler({ ...newTraveler, name: e.target.value })}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Age *"
                        value={newTraveler.age}
                        onChange={(e) => setNewTraveler({ ...newTraveler, age: e.target.value })}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email (optional)"
                      value={newTraveler.email}
                      onChange={(e) => setNewTraveler({ ...newTraveler, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={newTraveler.phone}
                      onChange={(e) => setNewTraveler({ ...newTraveler, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddTraveler(false)}
                        className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddTraveler}
                        disabled={!newTraveler.name || !newTraveler.age || addingTraveler}
                        className="flex-1 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {addingTraveler && <Loader2 className="w-4 h-4 animate-spin" />}
                        Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddTraveler(true)}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-400 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Traveler
                  </button>
                )}
              </>
            ) : (
              <>
                {/* Collaborators List */}
                {loadingCollaborators ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {collaborators.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {collaborators.map((collab) => (
                          <div
                            key={collab.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                              {collab.full_name ? getInitials(collab.full_name) : collab.email[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {collab.full_name || collab.email}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  collab.role === 'owner'
                                    ? 'bg-purple-100 text-purple-700'
                                    : collab.role === 'editor'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {collab.role}
                                </span>
                              </div>
                              {collab.full_name && (
                                <p className="text-xs text-gray-500 truncate">{collab.email}</p>
                              )}
                            </div>
                            {collab.role !== 'owner' && (
                              <button
                                onClick={() => handleRemoveCollaborator(collab.user_id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4 mb-4">
                        No collaborators yet
                      </p>
                    )}

                    {/* Invite Form */}
                    {showInviteLink ? (
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <p className="text-sm font-medium text-emerald-800 mb-2">
                          Share this invite link:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={inviteLink}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm bg-white border border-emerald-300 rounded-lg"
                          />
                          <button
                            onClick={handleCopyLink}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <button
                          onClick={() => setShowInviteLink(false)}
                          className="mt-2 text-sm text-emerald-600 hover:underline"
                        >
                          Send another invite
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 bg-gray-50 rounded-xl">
                        <div className="flex gap-2">
                          <input
                            type="email"
                            placeholder="Email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>
                        </div>
                        {inviteError && (
                          <p className="text-sm text-red-600">{inviteError}</p>
                        )}
                        <button
                          onClick={handleInvite}
                          disabled={!inviteEmail || inviting}
                          className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {inviting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LinkIcon className="w-4 h-4" />
                          )}
                          Create Invite Link
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
