import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';
import { User, Phone, MapPin, Edit3, Save, LogOut, ArrowLeft } from 'lucide-react';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    villageName: '',
  });
  const [loading, setLoading] = useState(false);

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
      toastService.error('Name is required');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authApi.updateProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
      toastService.success('Profile updated successfully!');
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
            {user.role} Account
          </p>
        </div>
      </section>

      {/* Profile Body */}
      <section className="max-w-xl mx-auto px-4 py-8">
        <Card padding="lg">
          <div className="flex justify-between items-center mb-6 border-b border-border-light pb-4">
            <h2 className="text-xl font-bold text-text-dark">Profile Details</h2>
            {user.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="text-xs font-bold text-text-dark bg-primary-light hover:bg-primary px-3 py-1.5 rounded-lg border border-primary-dark transition-all"
              >
                Go to Admin Panel
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Phone (Read Only) */}
            <div className="flex items-center gap-3 bg-bg-light p-3.5 rounded-lg border border-border-light">
              <Phone className="text-text-light" size={20} />
              <div className="flex-1">
                <p className="text-xs text-text-light font-bold uppercase">Mobile Number</p>
                <p className="font-semibold text-text-dark">{user.phone}</p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs text-text-light font-bold uppercase mb-1">Full Name</label>
              {isEditing ? (
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Full Name"
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
              <label className="block text-xs text-text-light font-bold uppercase mb-1">Village Name</label>
              {isEditing ? (
                <Input
                  name="villageName"
                  value={formData.villageName}
                  onChange={handleChange}
                  placeholder="Your Village"
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
              <label className="block text-xs text-text-light font-bold uppercase mb-1">Delivery Address</label>
              {isEditing ? (
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street details, Landmark, City"
                />
              ) : (
                <div className="flex items-center gap-3 bg-bg-light p-3.5 rounded-lg border border-border-light">
                  <MapPin className="text-text-light" size={20} />
                  <p className="font-semibold text-text-dark">{user.address || 'Not provided'}</p>
                </div>
              )}
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
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
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
                  Edit Profile Info
                </Button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-all font-bold text-sm"
              >
                <LogOut size={18} />
                Logout Account
              </button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
};
