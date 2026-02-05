# Edit Mode Menu Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the "Saved" button with an "Edit" dropdown menu that provides navigation to different trip editing modes.

**Architecture:** After user saves an itinerary, the Save button transitions to "Saved" (green) for 5 seconds, then transforms into an "Edit ▼" dropdown button. The dropdown contains three options: "Edit with AI" (informational, current page), "Collaborate" (navigates to `/trips/[id]/collaborate`), and "View Suggestions" (navigates to `/trips/[id]`).

**Tech Stack:** React, Next.js Router, Tailwind CSS, Lucide React icons

---

## Task 1: Add Required Imports and State

**Files:**
- Modify: `components/landing/ItineraryDisplay.tsx:1-45`

**Step 1: Add new imports**

Add `useRouter` from Next.js and `Bot` icon from Lucide:

```typescript
// At line 3, add useRouter import
import { useRouter } from 'next/navigation';

// At line 40 (in the lucide-react imports), add Bot icon
import {
  // ... existing imports ...
  Bot,
} from 'lucide-react';
```

**Step 2: Add state for Edit menu**

Add these state variables after line 169 (after `expandedHotelDay`):

```typescript
const [showEditMenu, setShowEditMenu] = useState(false);
const [showSavedState, setShowSavedState] = useState(false);
const editMenuRef = useRef<HTMLDivElement>(null);
const router = useRouter();
```

**Step 3: Verify changes compile**

Run: `npm run build 2>&1 | head -50`
Expected: No errors related to the new imports

**Step 4: Commit**

```bash
git add components/landing/ItineraryDisplay.tsx
git commit -m "feat(edit-menu): add imports and state for Edit dropdown menu"
```

---

## Task 2: Add Timer Effect for Saved → Edit Transition

**Files:**
- Modify: `components/landing/ItineraryDisplay.tsx` (after the scroll detection useEffect around line 184)

**Step 1: Add the transition effect**

Insert this effect after the scroll detection useEffect:

```typescript
// Timer to transition from "Saved" to "Edit" button after 5 seconds
useEffect(() => {
  if (isSaved && !hasUnsavedChanges) {
    setShowSavedState(true);
    const timer = setTimeout(() => {
      setShowSavedState(false);
    }, 5000);
    return () => clearTimeout(timer);
  } else {
    setShowSavedState(false);
  }
}, [isSaved, hasUnsavedChanges]);
```

**Step 2: Add click-outside handler for Edit menu**

Insert this effect after the timer effect:

```typescript
// Close Edit menu when clicking outside
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (editMenuRef.current && !editMenuRef.current.contains(event.target as Node)) {
      setShowEditMenu(false);
    }
  };

  if (showEditMenu) {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }
}, [showEditMenu]);
```

**Step 3: Verify changes compile**

Run: `npm run build 2>&1 | head -50`
Expected: No errors related to the new effects

**Step 4: Commit**

```bash
git add components/landing/ItineraryDisplay.tsx
git commit -m "feat(edit-menu): add timer effect for Saved to Edit transition"
```

---

## Task 3: Add tripId Prop to ItineraryDisplay

**Files:**
- Modify: `components/landing/ItineraryDisplay.tsx` (interface and props)

**Step 1: Add tripId to props interface**

At line 94 (in `ItineraryDisplayProps` interface), add:

```typescript
interface ItineraryDisplayProps {
  // ... existing props ...
  tripId?: string; // Add after marketplaceSettings
}
```

**Step 2: Add tripId to destructured props**

At line 148 (in the component function parameters), add `tripId`:

```typescript
export default function ItineraryDisplay({
  // ... existing props ...
  marketplaceSettings,
  onUpdateVisibility,
  tripId, // Add this
}: ItineraryDisplayProps) {
```

**Step 3: Verify changes compile**

Run: `npm run build 2>&1 | head -50`
Expected: No errors

**Step 4: Commit**

```bash
git add components/landing/ItineraryDisplay.tsx
git commit -m "feat(edit-menu): add tripId prop for navigation"
```

---

## Task 4: Replace Save/Saved Button with Edit Menu

**Files:**
- Modify: `components/landing/ItineraryDisplay.tsx:575-600` (the Save button section)

**Step 1: Replace the Save button logic**

Replace the entire Save button (lines 578-599) with this new logic:

```typescript
{/* Save/Saved/Edit Button */}
{isSaved && !hasUnsavedChanges ? (
  showSavedState ? (
    // Saved state (green, shows for 5 seconds)
    <button
      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/90 text-white rounded-full transition-all font-medium text-sm border border-green-400/50 cursor-default"
    >
      <Check className="w-3.5 h-3.5" />
      Saved
    </button>
  ) : (
    // Edit dropdown button (appears after 5 seconds)
    <div className="relative" ref={editMenuRef}>
      <button
        onClick={() => setShowEditMenu(!showEditMenu)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-medium text-sm border ${
          showEditMenu
            ? 'bg-white text-teal-700 border-white shadow-lg'
            : 'bg-white/90 text-teal-700 hover:bg-white border-white/50'
        }`}
      >
        <Edit3 className="w-3.5 h-3.5" />
        Edit
        <ChevronDown className={`w-3 h-3 transition-transform ${showEditMenu ? 'rotate-180' : ''}`} />
      </button>

      {/* Edit Dropdown Menu */}
      {showEditMenu && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Edit with AI - Informational (current page) */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Edit with AI</p>
                <p className="text-xs text-gray-500 mt-0.5">Continue chatting with AI to refine your trip</p>
                <p className="text-[10px] text-teal-600 mt-1 font-medium">Currently on this page</p>
              </div>
            </div>
          </div>

          {/* Collaborate Option */}
          <button
            onClick={() => {
              setShowEditMenu(false);
              if (tripId) router.push(`/trips/${tripId}/collaborate`);
            }}
            disabled={!tripId}
            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Collaborate</p>
                <p className="text-xs text-gray-500 mt-0.5">Plan together with friends and family</p>
              </div>
            </div>
          </button>

          {/* View Suggestions Option */}
          <button
            onClick={() => {
              setShowEditMenu(false);
              if (tripId) router.push(`/trips/${tripId}`);
            }}
            disabled={!tripId}
            className="w-full px-4 py-3 text-left hover:bg-amber-50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                <Eye className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">View Suggestions</p>
                <p className="text-xs text-gray-500 mt-0.5">See bids and suggestions from local guides</p>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
) : (
  // Save button (unsaved state)
  <button
    onClick={handleSaveClick}
    disabled={isSaving}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 text-teal-700 rounded-full hover:bg-white disabled:opacity-50 transition-all font-medium text-sm border border-white/50"
  >
    <Save className="w-3.5 h-3.5" />
    {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Save'}
  </button>
)}
```

**Step 2: Verify changes compile**

Run: `npm run build 2>&1 | head -50`
Expected: No errors

**Step 3: Commit**

```bash
git add components/landing/ItineraryDisplay.tsx
git commit -m "feat(edit-menu): implement Edit dropdown with navigation options"
```

---

## Task 5: Pass tripId from ChatPanel to ItineraryDisplay

**Files:**
- Modify: `components/landing/ChatPanel.tsx` (where ItineraryDisplay is rendered)

**Step 1: Find where ItineraryDisplay is rendered**

Search for `<ItineraryDisplay` in ChatPanel.tsx and add the tripId prop:

```typescript
<ItineraryDisplay
  // ... existing props ...
  tripId={savedTripId} // Add this prop (savedTripId should exist from save response)
/>
```

**Step 2: Verify tripId state exists**

Check that `savedTripId` state exists in ChatPanel. If not, add it:

```typescript
const [savedTripId, setSavedTripId] = useState<string | null>(null);
```

And update it when saving:

```typescript
// In the save handler, after successful save:
if (response.ok) {
  const data = await response.json();
  setSavedTripId(data.id); // or data.tripId depending on API response
  // ... existing code ...
}
```

**Step 3: Verify changes compile**

Run: `npm run build 2>&1 | head -50`
Expected: No errors

**Step 4: Commit**

```bash
git add components/landing/ChatPanel.tsx
git commit -m "feat(edit-menu): pass tripId to ItineraryDisplay for navigation"
```

---

## Task 6: Add Animation Styles

**Files:**
- Check if animation utilities exist in Tailwind config or add inline styles

**Step 1: Verify Tailwind animation classes work**

The dropdown uses `animate-in fade-in slide-in-from-top-2`. If these don't exist, replace with:

```typescript
className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
style={{
  animation: 'fadeIn 0.15s ease-out',
}}
```

And add keyframes to global CSS if needed:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 2: Test in browser**

Run: `npm run dev`
Expected: Dropdown animates smoothly when opened

**Step 3: Commit if changes were made**

```bash
git add -A
git commit -m "feat(edit-menu): add dropdown animation styles"
```

---

## Task 7: Manual Testing

**Files:**
- None (testing only)

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test the flow**

1. Open the app and chat with AI to generate an itinerary
2. Click "Save" button
3. Verify button changes to green "Saved" with checkmark
4. Wait 5 seconds
5. Verify button changes to "Edit ▼"
6. Click "Edit ▼" to open dropdown
7. Verify dropdown shows:
   - "Edit with AI" (gray background, "Currently on this page" label)
   - "Collaborate" (clickable, blue hover)
   - "View Suggestions" (clickable, amber hover)
8. Click outside dropdown to close it
9. Click "Collaborate" - verify it navigates to `/trips/[id]/collaborate`
10. Go back, click "View Suggestions" - verify it navigates to `/trips/[id]`

**Step 3: Test edge cases**

1. Make changes after saving - verify "Save Changes" button appears
2. Save again - verify "Saved" → "Edit" transition works
3. Before saving (no tripId) - verify dropdown options are disabled

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(edit-menu): address issues found in manual testing"
```

---

## Task 8: Final Verification and Cleanup

**Files:**
- All modified files

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run linter**

Run: `npm run lint`
Expected: No linting errors

**Step 3: Review all changes**

Run: `git diff main --stat`
Expected: Only expected files modified

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(edit-menu): complete Edit dropdown menu implementation

- Add Edit dropdown button that replaces Saved button after 5 seconds
- Edit with AI: informational text showing current page
- Collaborate: navigates to /trips/[id]/collaborate
- View Suggestions: navigates to /trips/[id]
- Smooth animations and click-outside handling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary

**Files Modified:**
- `components/landing/ItineraryDisplay.tsx` - Main implementation
- `components/landing/ChatPanel.tsx` - Pass tripId prop

**Key Implementation Details:**
1. `showSavedState` controls the 5-second "Saved" display
2. `showEditMenu` controls dropdown visibility
3. `editMenuRef` enables click-outside detection
4. `tripId` prop enables navigation to other trip pages
5. Dropdown is non-interactive for "Edit with AI" (current page indicator)
6. Collaborate and View Suggestions are clickable navigation buttons

**Navigation Targets:**
- Edit with AI: Current page (no navigation)
- Collaborate: `/trips/[id]/collaborate`
- View Suggestions: `/trips/[id]`
