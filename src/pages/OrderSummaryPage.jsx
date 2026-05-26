import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { feedsData } from '../data/dummyData';
import { orderService } from '../services/dataService';
import { toastService } from '../services/toastService';

export const OrderSummaryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = location.state?.cart || {};

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    villageName: '',
    address: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getCartItems = () => {
    return feedsData
      .filter(feed => cart[feed.id])
      .map(feed => ({
        ...feed,
        quantity: cart[feed.id],
        total: feed.price * cart[feed.id],
      }));
  };

  const getTotalPrice = () => {
    return getCartItems().reduce((sum, item) => sum + item.total, 0);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number';
    }

    if (!formData.villageName.trim()) {
      newErrors.villageName = 'Village name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const order = await orderService.createOrder({
        items: getCartItems(),
        totalPrice: getTotalPrice(),
        ...formData,
      });

      toastService.success('Order placed successfully!');
      setSubmitted(true);

      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (error) {
      toastService.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const items = getCartItems();

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <Card padding="lg" className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Order Confirmed!</h1>
          <p className="text-text-light mb-4">
            Thank you for your order. We will deliver within 24 hours.
          </p>
          <p className="text-sm text-text-light">
            Redirecting to home page...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light pb-20">
      <Header showBack onBack={() => navigate('/feeds')} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-text-dark">Order Summary</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details - Left */}
          <div className="lg:col-span-2">
            {/* Customer Info Form */}
            <Card padding="lg" className="mb-8">
              <h2 className="text-2xl font-bold text-text-dark mb-6">Delivery Details</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  error={errors.customerName}
                  required
                />

                <Input
                  label="Phone Number"
                  placeholder="+91 9876543210"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  error={errors.phoneNumber}
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

                <Input
                  label="Address"
                  placeholder="Complete address with landmarks"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Confirming Order...' : 'Confirm Order'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Order Items Summary - Right */}
          <div className="lg:col-span-1">
            <Card padding="lg" className="sticky top-20">
              <h2 className="text-2xl font-bold text-text-dark mb-6">Order Items</h2>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="border-b border-border-light pb-3">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-text-dark">{item.name}</p>
                      <span className="bg-primary-light text-text-dark px-2 py-1 rounded text-sm font-bold">
                        ×{item.quantity}
                      </span>
                    </div>
                    <p className="text-sm text-text-light mb-1">₹{item.price} each</p>
                    <p className="font-bold text-primary">₹{item.total}</p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t-2 border-primary pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-text-light">Subtotal:</span>
                  <span className="font-medium">₹{getTotalPrice()}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-text-light">Delivery:</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border-light">
                  <span className="text-lg font-bold text-text-dark">Total:</span>
                  <span className="text-2xl font-bold text-primary">₹{getTotalPrice()}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};
