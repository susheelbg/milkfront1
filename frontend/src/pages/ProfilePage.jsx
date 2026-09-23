import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';
import { User, Phone, MapPin, Edit3, Save, Globe, Shield, HelpCircle, FileText, Lock, RotateCcw } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    villageName: '',
  });

  useEffect(() => {
    const profile = authApi.getCurrentUser() || {};
    setFormData({
      name: profile.name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      villageName: profile.villageName || '',
    });
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
      await authApi.updateProfile(formData);
      setIsEditing(false);
      toastService.success(t('profile.updateSuccess') || 'Details saved successfully!');
    } catch (err) {
      toastService.error('Failed to save details.');
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear saved farmer details from this device?')) {
      authApi.clearProfile();
      setFormData({
        name: '',
        phone: '',
        address: '',
        villageName: '',
      });
      toastService.info('Saved details cleared.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-light pb-20">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Profile Header */}
      <section className="bg-primary py-8 px-4 shadow-sm border-b border-primary-dark">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-primary-dark text-2xl text-text-dark font-black">
            {formData.name ? formData.name.charAt(0).toUpperCase() : <User size={28} />}
          </div>
          <div>
            <h1 className="text-xl font-black text-text-dark">
              {formData.name || t('common.farmer') || 'Dairy Farmer'}
            </h1>
            <p className="text-xs text-text-dark/70 font-semibold mt-0.5">
              {formData.phone ? formData.phone : 'Details saved on this device'}
            </p>
          </div>
        </div>
      </section>

      {/* Profile Body */}
      <section className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Personal Details Card */}
        <Card padding="lg" className="border border-border-light shadow-sm">
          <div className="flex justify-between items-center mb-5 border-b border-border-light pb-3">
            <div>
              <h2 className="text-lg font-black text-text-dark">{t('profile.personalDetails') || 'My Farmer Details'}</h2>
              <p className="text-xs text-text-light">Auto-fills your feed orders and Sante cattle listings</p>
            </div>
            {!isEditing && (
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
                  <p className="font-semibold text-sm text-text-dark">{formData.name || 'Not provided'}</p>
                </div>
              )}
            </div>

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
                  <p className="font-semibold text-sm text-text-dark">{formData.phone || 'Not provided'}</p>
                </div>
              )}
            </div>

            {/* Village */}
            <div>
              <label className="block text-xs text-text-light font-bold uppercase mb-1">
                {t('profile.villageName') || 'Village / Town'}
              </label>
              {isEditing ? (
                <Input
                  name="villageName"
                  value={formData.villageName}
                  onChange={handleChange}
                  placeholder={t('register.villagePlaceholder') || 'Enter village name'}
                />
              ) : (
                <div className="flex items-center gap-3 bg-bg-light p-3 rounded-xl border border-border-light">
                  <MapPin className="text-text-light" size={18} />
                  <p className="font-semibold text-sm text-text-dark">{formData.villageName || 'Not provided'}</p>
                </div>
              )}
            </div>

            {/* Delivery Address */}
            <div>
              <label className="block text-xs text-text-light font-bold uppercase mb-1">
                {t('orderSummary.deliveryAddress') || 'Delivery Address'}
              </label>
              {isEditing ? (
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder={t('profile.addressPlaceholder') || 'House number, landmark, taluk'}
                />
              ) : (
                <div className="flex items-center gap-3 bg-bg-light p-3 rounded-xl border border-border-light">
                  <MapPin className="text-text-light" size={18} />
                  <p className="font-semibold text-sm text-text-dark">{formData.address || 'Not provided'}</p>
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

        {/* Management & Legal Links */}
        <Card padding="lg" className="border border-border-light shadow-sm space-y-3">
          <h2 className="text-sm font-black uppercase text-text-light tracking-wider mb-2">
            Quick Links
          </h2>

          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-bg-light transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Lock size={18} className="text-text-light" />
              <span className="text-sm font-bold text-text-dark">Admin Portal</span>
            </div>
            <span className="text-xs text-text-light font-semibold">PIN required →</span>
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

          {formData.name && (
            <div className="border-t border-border-light pt-3 mt-3">
              <button
                type="button"
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset Saved Details from Device</span>
              </button>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};
