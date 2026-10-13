import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from '../context/HistoryContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LogOut, 
  History, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  Lock,
  Sparkles,
  Edit3,
  Save,
  X,
  Camera,
  RefreshCw,
  User as UserIcon,
  Phone,
  Mail,
  AtSign,
  Upload
} from 'lucide-react';

// Preset avatar options for quick profile customization
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
];

export const ProfilePage: React.FC = () => {
  const { currentUser, logout, updateProfile } = useAuth();
  const { stats } = useHistory();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editUserId, setEditUserId] = useState(currentUser?.userId || currentUser?.id || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editPhotoUrl, setEditPhotoUrl] = useState(currentUser?.photoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Sync state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditUserId(currentUser.userId || currentUser.id || '');
      setEditPhone(currentUser.phone || '');
      setEditPhotoUrl(currentUser.photoUrl || '');
    }
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    showToast('You have been logged out securely.', 'info');
    navigate('/login', { replace: true });
  };

  const handleStartEdit = () => {
    setEditName(currentUser?.name || '');
    setEditUserId(currentUser?.userId || currentUser?.id || '');
    setEditPhone(currentUser?.phone || '');
    setEditPhotoUrl(currentUser?.photoUrl || '');
    setEditError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditName(currentUser?.name || '');
    setEditUserId(currentUser?.userId || currentUser?.id || '');
    setEditPhone(currentUser?.phone || '');
    setEditPhotoUrl(currentUser?.photoUrl || '');
    setEditError('');
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');

    const cleanName = editName.trim();
    const cleanUserId = editUserId.trim();

    if (!cleanName) {
      setEditError('Display Name cannot be empty.');
      return;
    }

    if (!cleanUserId) {
      setEditError('User ID (Handle) cannot be empty.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUserId)) {
      setEditError('User ID must be 3-30 characters long and contain only letters, numbers, underscores, or hyphens.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProfile({
        name: cleanName,
        userId: cleanUserId,
        phone: editPhone.trim() || undefined,
        photoUrl: editPhotoUrl.trim() || undefined,
      });
      setIsSaving(false);

      if (!result.success) {
        setEditError(result.error || 'Failed to save changes.');
        showToast(result.error || 'Update failed', 'error');
        return;
      }

      showToast('Profile and username updated successfully in Firestore!', 'success');
      setIsEditing(false);
    } catch (err: any) {
      setIsSaving(false);
      setEditError(err.message || 'An error occurred while saving.');
    }
  };

  // Handle local file upload converting to data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setEditPhotoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const name = currentUser?.name || 'Puneeth';
  const email = currentUser?.email || 'puneeth@example.com';
  const phone = currentUser?.phone || 'Not provided';
  const userId = currentUser?.userId || currentUser?.id || 'puneeth123';
  const photoUrl = currentUser?.photoUrl;
  const memberSince = currentUser?.createdAt 
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Aug 2026';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-white">
            Account Profile & Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your verified credentials, customizable handle, and investigation metrics.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-bold shadow-glow-cyan transition-all hover:scale-105 active:scale-95 self-start sm:self-auto cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* User Hero Identity Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow Background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {!isEditing ? (
          /* View Mode */
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {/* Avatar with Glow */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-brand-600 via-cyan-500 to-indigo-500 p-1 shadow-glow-cyan">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name}
                    className="w-full h-full rounded-[22px] object-cover bg-slate-950"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full rounded-[22px] bg-slate-950 items-center justify-center font-display font-black text-3xl sm:text-4xl text-white uppercase ${
                    photoUrl ? 'hidden' : 'flex'
                  }`}
                >
                  {name.charAt(0)}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-slate-950 border-2 border-slate-950" title="Verified Security Status">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            {/* User Details */}
            <div className="space-y-2 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {name}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold self-center sm:self-auto">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Verified Investigator
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-400">
                User ID: <span className="font-mono text-cyan-300 font-bold">{userId}</span>
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-300 font-mono">
                <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-cyan-400 font-bold">@</span>
                  {email}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                  <span className="text-brand-400 font-bold">📞</span>
                  {phone}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Joined {memberSince}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Edit Profile Mode Form */
          <form onSubmit={handleSaveProfile} className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Edit Profile Details
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Update your display identity and contact details in Firestore
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Cancel Editing"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error message */}
            {editError && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Profile Photo Customizer */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Profile Photo (Optional)</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Live Preview Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-cyan-500 to-indigo-500 p-0.5 shrink-0 shadow-glow-cyan">
                  {editPhotoUrl ? (
                    <img
                      src={editPhotoUrl}
                      alt="Preview"
                      className="w-full h-full rounded-[14px] object-cover bg-slate-950"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full rounded-[14px] bg-slate-950 items-center justify-center font-display font-black text-2xl text-white uppercase ${
                      editPhotoUrl ? 'hidden' : 'flex'
                    }`}
                  >
                    {(editName || name).charAt(0)}
                  </div>
                </div>

                <div className="space-y-2 flex-1 w-full">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editPhotoUrl}
                      onChange={(e) => setEditPhotoUrl(e.target.value)}
                      placeholder="Paste Image URL (e.g. https://...)"
                      className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold font-mono transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border border-slate-700">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Preset Avatar Selection */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400 font-mono">Quick Presets:</span>
                    <div className="flex items-center gap-1.5">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditPhotoUrl(preset)}
                          className={`w-6 h-6 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                            editPhotoUrl === preset ? 'border-cyan-400 ring-2 ring-cyan-500/50 scale-110' : 'border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {editPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditPhotoUrl('')}
                          className="text-[10px] text-slate-400 hover:text-rose-400 font-mono ml-1 underline cursor-pointer"
                        >
                          Reset to Initial
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Display Name (Editable) */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 font-mono">
                  Display Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter your display name"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Your public display name shown across investigations.
                </p>
              </div>

              {/* 2. User ID (Editable Handle) */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 font-mono flex items-center justify-between">
                  <span>User ID (Handle) <span className="text-cyan-400">*</span></span>
                  <span className="text-[10px] text-cyan-400 font-normal">Customizable</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editUserId}
                    onChange={(e) => setEditUserId(e.target.value)}
                    placeholder="e.g. puneeth123"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-cyan-300 font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Unique handle across investigations (3–30 characters, letters/numbers/_-).
                </p>
              </div>

              {/* 3. Authenticated Email (Read-only / Protected) */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 font-mono flex items-center justify-between">
                  <span>Authenticated Email</span>
                  <span className="text-[10px] text-emerald-400 font-normal flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Security Locked
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-300 font-mono cursor-not-allowed opacity-90"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Protected primary account login address.
                </p>
              </div>

              {/* 4. Phone Number (Editable / Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 font-mono">
                  Phone Number <span className="text-slate-500">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Optional contact for verification alerts.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-bold font-mono transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-cyan-500 to-brand-500 text-white text-xs sm:text-sm font-bold shadow-glow-cyan hover:shadow-glow-brand transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Investigation Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Scans</span>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-white">
            {stats.totalScans}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Lifetime verifications
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 space-y-1 bg-emerald-950/20">
          <div className="text-xs text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real Verified</span>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-300">
            {stats.realCount}
          </div>
          <div className="text-[11px] text-emerald-400/80 font-medium">
            100/100 Authenticated
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-rose-500/30 space-y-1 bg-rose-950/20">
          <div className="text-xs text-rose-400 font-mono flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Fakes Detected</span>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-rose-300">
            {stats.fakeCount}
          </div>
          <div className="text-[11px] text-rose-400/80 font-medium">
            0/100 Disinformation
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-brand-400" />
            <span>Trust Rating</span>
          </div>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-cyan-300">
            {stats.trustRating}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Forensic confidence
          </div>
        </div>
      </div>

      {/* Security & Password Authentication Overview */}
      <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          <span>Security & Authentication Model</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="font-bold text-xs text-slate-200 font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Identity & Handle Persistence</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your User ID (<span className="text-cyan-300 font-mono">{userId}</span>) and profile customizations are linked to your internal Firebase UID and synchronized across devices.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="font-bold text-xs text-slate-200 font-mono flex items-center gap-2">
              <History className="w-4 h-4 text-brand-400" />
              <span>Private Forensic History</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your forensic scans and investigation analytics are securely partitioned under <span className="text-slate-300 font-mono">{email}</span> in Firestore.
            </p>
          </div>
        </div>
      </div>

      {/* Logout Action Card */}
      <div className="glass-card rounded-3xl p-6 border border-rose-500/20 bg-rose-950/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="font-bold text-sm text-white">
            End Active Session
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Logging out clears your active session. Your profile and scan history will remain securely preserved in Firestore.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout of VerifyAI</span>
        </button>
      </div>
    </div>
  );
};

