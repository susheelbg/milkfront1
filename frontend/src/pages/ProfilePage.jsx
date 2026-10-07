import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';
import { User, Phone, MapPin, Edit3, Save, Globe, Shield, HelpCircle, FileText, Lock, LogOut, LogIn, Mail, Trash2, AlertTriangle, Loader2, Camera } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const { user, isAuthenticated, signOut, updateProfile, deleteAccount, refreshProfile, isAdmin, isSuperAdmin } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState(null);
  const avatarPreviewUrlRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  useEffect(() => () => {
    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
      toastService.success(t('profile.updateSuccess') || 'Details saved successfully!');
    } catch (err) {
      toastService.error(err.message || 'Failed to save details.');
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toastService.error(t('chat.photoTypeInvalid'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toastService.error(t('chat.photoTooLarge'));
      return;
    }

    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    avatarPreviewUrlRef.current = previewUrl;
    setAvatarDraft({ file, previewUrl });
  };

  const handleAvatarSave = async () => {
    if (!avatarDraft?.file) return;
    setIsAvatarUploading(true);
    try {
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error(t('chat.photoUploadFailed')));
        reader.readAsDataURL(avatarDraft.file);
      });
      const uploaded = await authApi.uploadAvatar(imageData);
      if (!uploaded?.avatar_url) throw new Error(t('chat.photoUploadFailed'));
      await refreshProfile();
      toastService.success(t('profile.avatarSuccess') || 'Avatar updated!');
      URL.revokeObjectURL(avatarDraft.previewUrl);
      avatarPreviewUrlRef.current = null;
      setAvatarDraft(null);
    } catch (error) {
      toastService.error(error.message || t('chat.photoUploadFailed'));
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const cancelAvatarPreview = () => {
    if (avatarDraft?.previewUrl) URL.revokeObjectURL(avatarDraft.previewUrl);
    avatarPreviewUrlRef.current = null;
    setAvatarDraft(null);
  };

  const handleAvatarRemoval = async () => {
    setIsAvatarUploading(true);
    try {
      await authApi.removeAvatar();
      await refreshProfile();
      toastService.success(t('chat.removePhoto'));
    } catch (error) {
      toastService.error(error.message || t('chat.photoUploadFailed'));
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toastService.info('Signed out successfully.');
      navigate('/login', { replace: true });
    } catch (err) {
      toastService.error('Sign out error.');
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount();
      toastService.success(t('profile.deleteAccountSuccess') || 'Your account and all associated data have been permanently deleted.');
      setShowDeleteModal(false);
      navigate('/login', { replace: true });
    } catch (err) {
      toastService.error(err.message || 'Failed to delete account.');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light pb-20">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Profile Header Banner */}
      <section className="bg-gradient-to-r from-[#041D12] via-[#0A2E1F] to-[#041D12] py-8 px-4 shadow-sm text-white">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 overflow-hidden bg-white text-[#0A2E1F] rounded-2xl flex items-center justify-center shadow-lg border-2 border-amber-400 text-2xl font-black">
              {avatarDraft?.previewUrl || user?.avatar_url ? (
                <img src={avatarDraft?.previewUrl || user.avatar_url} alt={t('chat.profilePhoto')} className="w-full h-full object-cover" />
              ) : user?.name ? user.name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : <User size={28} />)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">
                  {user?.name || (isAuthenticated ? 'Dairy Farmer' : 'Guest Farmer')}
                </h1>
                {user?.role && (
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    user.role === 'super_admin'
                      ? 'bg-amber-400 text-[#0A2E1F]'
                      : user.role === 'admin'
                      ? 'bg-emerald-400 text-[#0A2E1F]'
                      : 'bg-white/20 text-white'
                  }`}>
                    {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Farmer'}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
                {user?.email || 'Sign in to access your orders and account'}
              </p>
            </div>
          </div>

          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-2 rounded-xl bg-amber-400 text-[#0A2E1F] font-black text-xs flex items-center gap-1.5 shadow-sm hover:bg-amber-300 transition-all"
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {isAuthenticated && (
          <Card padding="lg" className="border border-border-light shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border-light bg-emerald-50 flex items-center justify-center text-xl font-black text-emerald-900">
                {avatarDraft?.previewUrl || user?.avatar_url ? <img src={avatarDraft?.previewUrl || user.avatar_url} alt={t('chat.profilePhoto')} className="h-full w-full object-cover" /> : (user?.name || 'M').trim().charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black text-text-dark">{t('chat.profilePhoto')}</h2>
                <p className="mt-0.5 text-xs text-text-light">{t('chat.profilePhotoHelp')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-extrabold text-text-dark ${isAvatarUploading ? 'pointer-events-none opacity-60' : ''}`}>
                    {isAvatarUploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                    {t(avatarDraft || user?.avatar_url ? 'chat.replacePhoto' : 'chat.choosePhoto')}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleAvatarChange} disabled={isAvatarUploading} />
                  </label>
                  {avatarDraft ? (
                    <>
                      <button type="button" onClick={handleAvatarSave} disabled={isAvatarUploading} className="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-50">
                        {isAvatarUploading ? t('common.loading') : t('common.save')}
                      </button>
                      <button type="button" onClick={cancelAvatarPreview} disabled={isAvatarUploading} className="rounded-lg border border-border-light px-3 py-2 text-xs font-bold text-text-dark hover:bg-bg-light disabled:opacity-50">
                        {t('common.cancel')}
                      </button>
                    </>
                  ) : user?.avatar_url && (
                    <button type="button" onClick={handleAvatarRemoval} disabled={isAvatarUploading} className="rounded-lg border border-border-light px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">
                      {t('chat.removePhoto')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Unauthenticated Alert Banner */}
        {!isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-amber-900">Sign in to MilkMaatu</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Track your cattle feed orders, post cattle on Sante, and access full features.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 bg-amber-500 text-white font-extrabold text-xs rounded-xl hover:bg-amber-600 transition-colors shadow-xs"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 font-extrabold text-xs rounded-xl hover:bg-amber-100 transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        )}

        {/* Personal Details Card */}
        <Card padding="lg" className="border border-border-light shadow-sm">
          <div className="flex justify-between items-center mb-5 border-b border-border-light pb-3">
            <div>
              <h2 className="text-lg font-black text-text-dark">{t('profile.personalDetails') || 'Profile Details'}</h2>
              <p className="text-xs text-text-light">Auto-fills your feed orders and cattle listings</p>
            </div>
            {isAuthenticated && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-primary-dark bg-primary-light hover:bg-primary px-3 py-1.5 rounded-lg border border-primary-dark/30 transition-all"
              >
                <Edit3 size={14} />
                <span>{t('common.edit') || 'Edit'}</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-text-light font-bold uppercase mb-1">
                {t('profile.fullName') || 'Full Name'}
              </label>
              {isEditing ? (
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('register.fullNamePlaceholder') || 'Enter your name'}
                />
              ) : (
                <div className="flex items-center gap-3 bg-bg-light p-3 rounded-xl border border-border-light">
                  <User className="text-text-light" size={18} />
                  <p className="font-semibold text-sm text-text-dark">{user?.name || formData.name || 'Not provided'}</p>
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            {user?.email && (
              <div>
                <label className="block text-xs text-text-light font-bold uppercase mb-1">
                  Email Address
                </label>
                <div className="flex items-center gap-3 bg-bg-light p-3 rounded-xl border border-border-light">
                  <Mail className="text-text-light" size={18} />
                  <p className="font-semibold text-sm text-text-dark">{user.email}</p>
                </div>
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-xs text-text-light font-bold uppercase mb-1">
                {t('common.phone') || 'Phone Number'}
              </label>
              {isEditing ? (
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
              ) : (
                <div className="flex items-center gap-3 bg-bg-light p-3 rounded-xl border border-border-light">
                  <Phone className="text-text-light" size={18} />
                  <p className="font-semibold text-sm text-text-dark">{user?.phone || formData.phone || 'Not provided'}</p>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-xs text-text-light font-bold uppercase mb-1">
                {t('orderSummary.deliveryAddress') || 'Village / Address'}
              </label>
              {isEditing ? (
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t('profile.addressPlaceholder') || 'Village, taluk, door no...'}
                />
              ) : (
                <div className="flex items-center gap-3 bg-bg-light p-3 rounded-xl border border-border-light">
                  <MapPin className="text-text-light" size={18} />
                  <p className="font-semibold text-sm text-text-dark">{user?.address || formData.address || 'Not provided'}</p>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  <span>{t('common.save') || 'Save Details'}</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="flex-1"
                  onClick={() => setIsEditing(false)}
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
              </div>
            )}
          </form>
        </Card>

        {/* Preferences & Language Card */}
        <Card padding="lg" className="border border-border-light shadow-sm space-y-4">
          <h2 className="text-lg font-black text-text-dark border-b border-border-light pb-3">
            {t('profile.language') || 'Language / ಭಾಷೆ'}
          </h2>

          <div className="flex items-center gap-3 bg-bg-light p-3.5 border border-border-light rounded-xl">
            <Globe className="text-primary-dark" size={20} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text-dark font-extrabold outline-none cursor-pointer"
            >
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="en">English</option>
            </select>
          </div>
        </Card>

        {/* Quick Links Card */}
        <Card padding="lg" className="border border-border-light shadow-sm space-y-3">
          <h2 className="text-sm font-black uppercase text-text-light tracking-wider mb-2">
            Quick Links
          </h2>

          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-amber-700" />
                <span className="text-sm font-black text-amber-900">Admin Dashboard</span>
              </div>
              <span className="text-xs text-amber-700 font-bold">Open Portal →</span>
            </button>
          )}

          <button
            onClick={() => navigate('/orders')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-light transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-text-light" />
              <span className="text-sm font-bold text-text-dark">My Feed Orders</span>
            </div>
            <span className="text-xs text-text-light">→</span>
          </button>

          <button
            onClick={() => navigate('/support')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-light transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <HelpCircle size={18} className="text-text-light" />
              <span className="text-sm font-bold text-text-dark">Support & Help</span>
            </div>
            <span className="text-xs text-text-light">→</span>
          </button>

          <button
            onClick={() => navigate('/privacy-policy')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-light transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-text-light" />
              <span className="text-sm font-bold text-text-dark">Privacy Policy</span>
            </div>
            <span className="text-xs text-text-light">→</span>
          </button>

          <button
            onClick={() => navigate('/terms')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-light transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-text-light" />
              <span className="text-sm font-bold text-text-dark">Terms of Service</span>
            </div>
            <span className="text-xs text-text-light">→</span>
          </button>
        </Card>

        {/* Permanent Account Deletion Option (Red colored letters at bottom) */}
        {isAuthenticated && (
          <Card padding="lg" className="border border-red-200/80 bg-red-50/40 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-600" />
              <span>{t('profile.dangerZone') || 'Danger Zone / Permanent Erasure'}</span>
            </h3>

            <button
              type="button"
              id="btn-delete-account"
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-600 hover:text-red-700 transition-all font-bold text-sm shadow-2xs group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 size={18} className="text-red-600 group-hover:scale-110 transition-transform" />
                <span className="font-extrabold text-red-600 group-hover:text-red-700">
                  {t('profile.deleteAccount') || 'Delete Account permanently'}
                </span>
              </div>
              <span className="text-xs font-black text-red-500 underline">
                {t('profile.deleteAccountAction') || 'Delete Account'}
              </span>
            </button>

            <p className="text-[11px] text-red-600/80 font-medium px-1">
              {t('profile.deleteAccountDesc') || 'Permanently erases your profile, feed orders, and posted cattle listings.'}
            </p>
          </Card>
        )}
      </section>

      {/* Permanent Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <Card className="w-full max-w-sm border-2 border-red-200 shadow-2xl animate-scale-up" padding="lg">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-red-200">
                <Trash2 size={28} />
              </div>

              <h3 className="text-lg font-black text-text-dark">
                {t('profile.deleteAccountConfirmTitle') || 'Delete Account Permanently?'}
              </h3>

              <p className="text-xs text-text-light leading-relaxed font-medium">
                {t('profile.deleteAccountConfirmMessage') ||
                 'Are you sure you want to permanently delete your MilkMaatu account? All your profile details, feed orders, and posted cattle listings will be deleted forever. This action cannot be undone.'}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-left">
                <p className="text-[11px] font-bold text-red-800 flex items-start gap-1.5">
                  <span>⚠️</span>
                  <span>
                    {t('profile.deleteWarningNotice') || 'This will immediately erase your phone number, address, and all Sante market ads.'}
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={deletingAccount}
                  onClick={handleDeleteAccountConfirm}
                  className="w-full bg-red-600 hover:bg-red-700 border-red-600 text-white font-black text-sm py-3 shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
                >
                  {deletingAccount ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Deleting Account...</span>
                    </span>
                  ) : (
                    <span>{t('profile.deleteAccountBtn') || 'Yes, Delete My Account'}</span>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={deletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full font-bold text-xs py-2.5 cursor-pointer"
                >
                  {t('common.cancel') || 'Cancel'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default ProfilePage;
