'use client';

import { useState, useEffect } from 'react';
import { Palette, Check, Loader2 } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const ALL_THEMES: Theme[] = [
  { id: 'journey', name: 'JOURNEY', description: 'Dark theme with giant typography and Zune-inspired bold stats', preview: 'bg-zinc-900' },
  { id: 'explorer', name: 'EXPLORER', description: 'Two-column layout with sticky sidebar map', preview: 'bg-stone-100' },
  { id: 'dreamy-passport', name: 'DREAMY PASSPORT', description: 'Soft scrapbook aesthetic with passport stamps and Polaroid trip cards', preview: 'bg-gradient-to-br from-purple-200 to-pink-200' },
  { id: 'wanderlust-diary', name: 'WANDERLUST DIARY', description: 'Bold editorial magazine style with hot pink accents and marquee ticker', preview: 'bg-gradient-to-br from-pink-500 to-rose-400' },
  { id: 'cyberdeck', name: 'CYBERDECK', description: 'Hacker terminal aesthetic with green-on-black and Matrix vibes', preview: 'bg-gradient-to-br from-black to-green-900' },
  { id: 'hologram', name: 'HOLOGRAM', description: 'Sci-fi interface with cyan/magenta neon and rotating HUD elements', preview: 'bg-gradient-to-br from-purple-900 to-cyan-900' },
  { id: 'drifter', name: 'DRIFTER', description: 'Casual scrapbook style with Polaroids, sticky notes, and IDGAF energy', preview: 'bg-gradient-to-br from-amber-100 to-yellow-200' },
];

interface AppearancePanelProps {
  currentTheme: string;
  onThemeChange: (theme: string) => Promise<void>;
}

export default function AppearancePanel({ currentTheme, onThemeChange }: AppearancePanelProps) {
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site-settings?key=available_profile_themes')
      .then(res => res.json())
      .then(data => {
        setAvailableThemes(data.value || ['journey', 'explorer', 'dreamy-passport', 'wanderlust-diary', 'cyberdeck', 'hologram', 'drifter']);
      })
      .catch(() => setAvailableThemes(['journey', 'explorer', 'dreamy-passport', 'wanderlust-diary', 'cyberdeck', 'hologram', 'drifter']))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSelectedTheme(currentTheme);
  }, [currentTheme]);

  const handleSave = async () => {
    if (selectedTheme === currentTheme) return;
    setSaving(true);
    try {
      await onThemeChange(selectedTheme);
    } finally {
      setSaving(false);
    }
  };

  const themes = ALL_THEMES.filter(t => availableThemes.includes(t.id));

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Palette className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Profile Theme</p>
              <p className="text-sm text-gray-500">Choose how your public profile looks</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : themes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No themes available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    selectedTheme === theme.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-16 rounded-lg mb-3 ${theme.preview}`} />
                  <div className="font-semibold text-gray-900">{theme.name}</div>
                  <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
                  {selectedTheme === theme.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedTheme !== currentTheme && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-purple-500 text-white font-medium rounded-xl hover:bg-purple-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save Theme'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
