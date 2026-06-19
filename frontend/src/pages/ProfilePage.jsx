import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';
import { User, Phone, MapPin, Edit3, Save, LogOut, Globe, ShieldAlert, Trash2 } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    villageName: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    setFormData({
      name: currentUser.name || '',
      address: currentUser.address || '',
      villageName: currentUser.villageName || '',
    });
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toastService.error(t('profile.fullName') + ' is required');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authApi.updateProfile({
        ...formData,
        language: language, // preserve current language
      });
      setUser(updatedUser);
      setIsEditing(false);
      toastService.success(t('profile.updateSuccess') || 'Profile updated successfully!');
    } catch (err) {
      toastService.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    toastService.success('Logged out successfully.');
    navigate('/login');
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deletePassword) {
      toastService.error('Password is required to confirm deletion');
      return;
    }

    setDeleting(true);
    try {
      await authApi.deleteAccount(deletePassword);
      toastService.success(t('compliance.successTitle') || 'Your account has been deleted.');
      authApi.logout();
      navigate('/login');
    } catch (err) {
      toastService.error(err.message || 'Incorrect password verification.');
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Profile Header */}
      <section className="bg-primary py-12 px-4 shadow-inner">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Avatar Placeholder */}
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md border-4 border-primary-dark mb-4 text-4xl text-text-dark font-bold relative group">
            {user.name ? user.name.charAt(0).toUpperCase() : 'F'}
            <div className="absolute inset-0 bg-black bg-opacity-20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-xs text-white font-semibold">Live Camera</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-dark">{user.name}</h1>
          <p className="text-sm bg-text-dark text-white px-3 py-1 rounded-full mt-2 inline-block font-semibold capitalize">
            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? t('common.admin') : t('common.farmer')}
          </p>

        </div>
      </section>

      {/* Profile Body */}
      <section className="max-w-xl mx-auto px-4 py-8">
        <div>
          {/* Profile Card */}
          <div>
            <Card padding="lg">
              <div className="flex justify-between items-center mb-6 border-b border-border-light pb-4">
                <h2 className="text-xl font-bold text-text-dark">{t('profile.personalDetails')}</h2>
                {['admin', 'super_admin'].includes(user.role) && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="text-xs font-bold text-text-dark bg-primary-light hover:bg-primary px-3 py-1.5 rounded-lg border border-primary-dark transition-all"
                  >
                    {t('admin.dashboard')}
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Phone (Read Only) */}
                <div className="flex items-center gap-3 bg-bg-light p-3.5 rounded-lg border border-border-light">
                  <Phone className="text-text-light" size={20} />
                  <div className="flex-1">
                    <p className="text-xs text-text-light font-bold uppercase">{t('common.phone')}</p>
                    <p className="font-semibold text-text-dark">{user.phone}</p>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs text-text-light font-bold uppercase mb-1">{t('profile.fullName')}</label>
                  {isEditing ? (
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('register.fullNamePlaceholder')}
                      required
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-bg-light p-3.5 rounded-lg border border-border-light">
                      <User className="text-text-light" size={20} />
                      <p className="font-semibold text-text-dark">{user.name || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                {/* Village */}
                <div>
                  <label className="block text-xs text-text-light font-bold uppercase mb-1">{t('profile.villageName')}</label>
                  {isEditing ? (
                    <Input
                      name="villageName"
                      value={formData.villageName}
                      onChange={handleChange}
                      placeholder={t('register.villagePlaceholder')}
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-bg-light p-3.5 rounded-lg border border-border-light">
                      <MapPin className="text-text-light" size={20} />
                      <p className="font-semibold text-text-dark">{user.villageName || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs text-text-light font-bold uppercase mb-1">{t('orderSummary.deliveryAddress')}</label>
                  {isEditing ? (
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder={t('profile.addressPlaceholder')}
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-bg-light p-3.5 rounded-lg border border-border-light">
                      <MapPin className="text-text-light" size={20} />
                      <p className="font-semibold text-text-dark">{user.address || 'Not provided'}</p>
                    </div>
                  )}
                </div>

                {/* Language Settings Dropdown */}
                <div>
                  <label className="block text-xs text-text-light font-bold uppercase mb-1">{t('profile.language')}</label>
                  <div className="flex items-center gap-3 bg-bg-light p-3 border border-border-light rounded-lg">
                    <Globe className="text-text-light" size={20} />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-text-dark font-bold outline-none cursor-pointer"
                    >
                      <option value="kn">ಕನ್ನಡ</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-4 space-y-3">
                  {isEditing ? (
                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        className="flex-1 flex items-center justify-center gap-2"
                        disabled={loading}
                      >
                        <Save size={18} />
                        {loading ? t('profile.updating') : t('common.save')}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        className="flex-1"
                        onClick={() => setIsEditing(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 size={18} />
                      {t('common.edit')}
                    </Button>
                  )}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-all font-bold text-sm"
                  >
                    <LogOut size={18} />
                    {t('common.logout')}
                  </button>

                  <div className="border-t border-border-light pt-4">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all font-bold text-xs"
                    >
                      <Trash2 size={15} />
                      {t('compliance.deleteAccount')}
                    </button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>
      {/* Delete Account Modal Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-sm border border-red-100 shadow-2xl animate-scale-up" padding="lg">
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-lg font-bold text-text-dark">
                  {t('compliance.deleteAccount')}
                </h3>
                <p className="text-xs text-text-light mt-1.5 leading-relaxed">
                  {t('compliance.deleteConfirmation')}
                </p>
              </div>

              <Input
                label={t('compliance.enterPassword')}
                type="password"
                placeholder={t('login.passwordPlaceholder')}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1 bg-red-500 hover:bg-red-600 border-red-500 text-white font-bold text-xs"
                  disabled={deleting}
                >
                  {deleting ? t('profile.updating') : t('compliance.confirmDelete')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="flex-1 font-bold text-xs"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  disabled={deleting}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
