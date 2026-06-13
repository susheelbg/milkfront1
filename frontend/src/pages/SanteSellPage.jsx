import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { cattleApi } from '../services/api/cattleApi';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';
import { Camera, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const SanteSellPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const santeName = location.state?.santeName;

  const [formData, setFormData] = useState({
    animalName: '',
    price: '',
    age: '',
    milkCapacity: '',
    contactNumber: '',
    villageName: '',
    description: '',
    image: null,
    imagePreview: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Prefill user details
    const user = authApi.getCurrentUser();
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactNumber: user.phone || '',
        villageName: user.villageName || '',
      }));
    }
  }, []);

  if (!santeName) {
    navigate('/sante');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: null,
      imagePreview: null,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.animalName.trim()) {
      newErrors.animalName = t('sante.errBreed') || 'Animal name is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = t('sante.errPrice') || 'Price must be greater than 0';
    }

    if (!formData.age || parseInt(formData.age) <= 0) {
      newErrors.age = t('sante.errAge') || 'Valid age is required';
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = t('register.phoneRequired') || 'Contact number is required';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.contactNumber)) {
      newErrors.contactNumber = t('register.invalidPhone') || 'Invalid phone number';
    }

    if (!formData.villageName.trim()) {
      newErrors.villageName = t('register.villageRequired') || 'Village name is required';
    }

    if (!formData.imagePreview) {
      newErrors.image = t('sante.errPhoto') || 'Image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await cattleApi.createCattleListing({
        animalName: formData.animalName,
        price: parseInt(formData.price),
        age: parseInt(formData.age),
        milkCapacity: formData.milkCapacity,
        contactNumber: formData.contactNumber,
        villageName: formData.villageName,
        santeName: santeName,
        description: formData.description,
        image: formData.imagePreview || 'https://images.unsplash.com/photo-1546521858-7ce4593f159b?w=640&h=360&fit=crop',
      });

      toastService.success(t('sante.deleteSuccess') ? t('common.success') : 'Cattle posted successfully!');
      
      setTimeout(() => {
        navigate('/sante-buy', { state: { santeName } });
      }, 1500);
    } catch (error) {
      toastService.error('Failed to post cattle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header showBack onBack={() => navigate('/sante-action', { state: { santeName } })} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-text-dark mb-1">{t('sante.sellCattle')}</h1>
          <p className="text-text-dark opacity-90">{santeName}</p>
        </div>
      </section>

      {/* Form Section */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-text-dark">{t('sante.postAd')}</h2>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">
                {t('sante.photoUpload')} <span className="text-red-500">*</span>
              </label>

              {formData.imagePreview ? (
                <div className="relative w-full max-w-md aspect-[16/9] overflow-hidden rounded-lg">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full px-4 py-10 border-2 border-dashed border-primary hover:bg-primary-light/30 rounded-lg cursor-pointer transition-colors bg-bg-light text-center">
                  <div className="flex flex-col items-center">
                    <Camera className="w-10 h-10 text-primary-dark mb-3 animate-bounce-slow" />
                    <span className="text-base text-text-dark font-bold">{t('sante.photoUpload')}</span>
                    <span className="text-xs text-text-light mt-1">{t('sante.cameraRequired')}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
              {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
            </div>

            {/* Animal Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('sante.breedLabel')}
                placeholder={t('sante.breedPlaceholder')}
                name="animalName"
                value={formData.animalName}
                onChange={handleChange}
                error={errors.animalName}
                required
              />

              <Input
                label={t('sante.ageLabel')}
                type="number"
                placeholder="e.g., 5"
                name="age"
                value={formData.age}
                onChange={handleChange}
                error={errors.age}
                required
              />

              <Input
                label={t('sante.priceLabel')}
                type="number"
                placeholder={t('sante.pricePlaceholder')}
                name="price"
                value={formData.price}
                onChange={handleChange}
                error={errors.price}
                required
              />

              <Input
                label={t('sante.milkYield')}
                placeholder={t('sante.milkYieldPlaceholder')}
                name="milkCapacity"
                value={formData.milkCapacity}
                onChange={handleChange}
                error={errors.milkCapacity}
              />
            </div>

            {/* Contact and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('orderSummary.phoneNumber')}
                placeholder="+91 9876543210"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                error={errors.contactNumber}
                required
              />

              <Input
                label={t('orderSummary.village')}
                placeholder="Your village"
                name="villageName"
                value={formData.villageName}
                onChange={handleChange}
                error={errors.villageName}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">
                {t('sante.description')}
              </label>
              <textarea
                placeholder={t('sante.descriptionPlaceholder')}
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2.5 rounded-lg border-2 border-border-light focus:border-primary focus:outline-none resize-none"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-text-dark text-sm">
                <span className="font-bold">📌 {t('sante.days24Hours')}</span>
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? t('sante.submitting') : t('sante.submitAdButton')}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
};
