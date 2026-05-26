import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { cattleService } from '../services/dataService';
import { toastService } from '../services/toastService';
import { Upload, X } from 'lucide-react';

export const SanteSellPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
      newErrors.animalName = 'Animal name is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.age || parseInt(formData.age) <= 0) {
      newErrors.age = 'Valid age is required';
    }

    if (!formData.milkCapacity.trim()) {
      newErrors.milkCapacity = 'Milk capacity is required';
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Invalid phone number';
    }

    if (!formData.villageName.trim()) {
      newErrors.villageName = 'Village name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.imagePreview) {
      newErrors.image = 'Image is required';
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
      await cattleService.createPost({
        animalName: formData.animalName,
        price: parseInt(formData.price),
        age: parseInt(formData.age),
        milkCapacity: formData.milkCapacity,
        contactNumber: formData.contactNumber,
        villageName: formData.villageName,
        santeName: santeName,
        description: formData.description,
        image: formData.imagePreview || 'https://images.unsplash.com/photo-1546521858-7ce4593f159b?w=500&h=400&fit=crop',
      });

      toastService.success('Cattle posted successfully!');
      
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
          <h1 className="text-3xl font-bold text-text-dark mb-1">Sell Cattle</h1>
          <p className="text-text-dark opacity-90">{santeName}</p>
        </div>
      </section>

      {/* Form Section */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-text-dark">Post Your Cattle</h2>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-text-dark mb-2">
                Animal Photo <span className="text-red-500">*</span>
              </label>

              {formData.imagePreview ? (
                <div className="relative w-full max-w-xs">
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
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
                <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-border-light rounded-lg hover:border-primary cursor-pointer transition-colors bg-bg-light">
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-primary mb-2" />
                    <span className="text-sm text-text-dark font-medium">Click to upload photo</span>
                    <span className="text-xs text-text-light">JPG, PNG up to 5MB</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
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
                label="Animal Name"
                placeholder="e.g., Jersey Cow, Holstein"
                name="animalName"
                value={formData.animalName}
                onChange={handleChange}
                error={errors.animalName}
                required
              />

              <Input
                label="Age (years)"
                type="number"
                placeholder="e.g., 5"
                name="age"
                value={formData.age}
                onChange={handleChange}
                error={errors.age}
                required
              />

              <Input
                label="Price (₹)"
                type="number"
                placeholder="e.g., 65000"
                name="price"
                value={formData.price}
                onChange={handleChange}
                error={errors.price}
                required
              />

              <Input
                label="Milk Capacity"
                placeholder="e.g., 20L/day"
                name="milkCapacity"
                value={formData.milkCapacity}
                onChange={handleChange}
                error={errors.milkCapacity}
                required
              />
            </div>

            {/* Contact and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Number"
                placeholder="+91 9876543210"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                error={errors.contactNumber}
                required
              />

              <Input
                label="Village Name"
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
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Describe the cattle's health, breed details, vaccination status, etc."
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
                <span className="font-bold">📌 Note:</span> Your post will be visible for 24 hours. Repost to keep it active in the marketplace.
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
              {loading ? 'Posting Cattle...' : 'Post to Sante'}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
};
