import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { feedsApi } from '../services/api/feedsApi';
import { orderApi } from '../services/api/orderApi';
import { useAuth } from '../context/AuthContext';
import { toastService } from '../services/toastService';
import { ShoppingBag, Loader2, MapPin, CheckCircle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const OrderSummaryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const cart = location.state?.cart || {};

  const [feeds, setFeeds] = useState([]);
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    villageName: '',
    address: '',
  });

  const [errors, setErrors] = useState({});
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if cart is empty
    if (Object.keys(cart).length === 0) {
      toastService.info(t('feeds.cartEmpty') || 'Your cart is empty. Redirecting to store...');
      navigate('/feeds');
      return;
    }

    // Prefill user details from AuthContext or localStorage
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || '',
        phoneNumber: user.phone || '',
        address: user.address || '',
      }));
    }

    // Fetch catalog feeds
    const loadFeeds = async () => {
      setLoadingFeeds(true);
      try {
        const data = await feedsApi.getFeeds();
        setFeeds(data);
      } catch (err) {
        toastService.error('Failed to load feed prices.');
      } finally {
        setLoadingFeeds(false);
      }
    };
    loadFeeds();
  }, [cart, navigate, t, user]);

  const getCartItems = () => {
    return feeds
      .filter(feed => cart[feed.id])
      .map(feed => ({
        id: feed.id,
        name: feed.name,
        price: feed.price,
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
      newErrors.customerName = t('register.fullNameRequired') || 'Customer name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = t('register.phoneRequired') || 'Phone number is required';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = t('register.invalidPhone') || 'Invalid phone number';
    }

    if (!formData.villageName.trim()) {
      newErrors.villageName = t('register.villageRequired') || 'Village name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = t('register.addressRequired') || 'Complete delivery address is required';
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

    // Prevent duplicate submissions while in progress
    if (loadingSubmit) return;

    if (!validateForm()) {
      toastService.error('Please verify delivery details form.');
      return;
    }

    setLoadingSubmit(true);

    try {
      // 1. Submit order to backend
      const result = await orderApi.createOrder({
        items: getCartItems(),
        totalPrice: getTotalPrice(),
        ...formData,
      });

      // Save order ID to local storage for quick tracking
      if (result?.id) {
        try {
          const existing = JSON.parse(localStorage.getItem('my_orders') || '[]');
          const updated = [result.id, ...existing.filter(id => id !== result.id)];
          localStorage.setItem('my_orders', JSON.stringify(updated));
        } catch {}
      }

      // Clear active cart from storage
      localStorage.removeItem('active_cart');

      // 2. Only show "Order Confirmed!" after the backend successfully creates the order
      setSubmitted(true);
      toastService.success(t('orderSummary.successMessage') || 'Order placed successfully!');

      // 3. Keep confirmation screen for exactly 5000ms, then navigate to /home
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 5000);

    } catch (error) {
      console.error('Order creation failed:', error);
      toastService.error(error.message || 'Failed to place order. Please try again.');
      setLoadingSubmit(false);
    }
  };

  const items = getCartItems();

  // Exactly 5000ms Order Confirmation Screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#041D12] via-[#0A2E1F] to-[#041D12] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-emerald-500/30 text-center max-w-md w-full p-8 rounded-3xl shadow-2xl shadow-black/50 animate-fade-in space-y-5">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-4xl border border-emerald-500/40 animate-bounce">
            <CheckCircle size={44} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-2">Order Confirmed!</h1>
            <p className="text-emerald-200/80 text-xs sm:text-sm leading-relaxed">
              {t('orderSummary.successMessage') || 'Your cattle feed order has been received and is being processed for prompt dispatch.'}
            </p>
          </div>
          <div className="bg-emerald-950/60 p-3.5 rounded-2xl text-xs font-bold text-amber-300 border border-emerald-500/20 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>Redirecting to Home in a moment (5s)...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light pb-20">
      <Header showBack onBack={() => navigate('/feeds')} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-extrabold text-text-dark">{t('orderSummary.title') || 'Order Checkout'}</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        {loadingFeeds ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-light">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-semibold text-sm">{t('common.loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details - Left */}
            <div className="lg:col-span-2">
              <Card padding="lg" className="border border-border-light shadow-sm">
                <div className="flex items-center gap-2 border-b border-border-light pb-4 mb-6">
                  <MapPin className="text-primary-dark" size={22} />
                  <h2 className="text-xl font-bold text-text-dark">{t('orderSummary.deliveryDetails') || 'Delivery Details'}</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label={t('orderSummary.fullName') || 'Full Name'}
                    placeholder="Enter customer name"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    error={errors.customerName}
                    required
                  />

                  <Input
                    label={t('orderSummary.phoneNumber') || 'Phone Number'}
                    placeholder="+91 9876543210"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    error={errors.phoneNumber}
                    required
                  />

                  <Input
                    label={t('orderSummary.village') || 'Village / Taluk'}
                    placeholder="e.g., Thendekere"
                    name="villageName"
                    value={formData.villageName}
                    onChange={handleChange}
                    error={errors.villageName}
                    required
                  />

                  <Input
                    label={t('orderSummary.deliveryAddress') || 'Delivery Address'}
                    placeholder="Street, door no, landmarks..."
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
                    className="w-full font-black shadow-md hover:scale-[1.01] transition-transform mt-6 flex items-center justify-center gap-2"
                    disabled={loadingSubmit}
                  >
                    {loadingSubmit ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{t('orderSummary.placingOrder') || 'Processing Order...'}</span>
                      </>
                    ) : (
                      `${t('orderSummary.placeOrderButton') || 'Confirm & Place Order'} (₹${getTotalPrice().toLocaleString()})`
                    )}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Order Items Summary - Right */}
            <div className="lg:col-span-1">
              <Card padding="lg" className="sticky top-20 border border-border-light shadow-sm">
                <div className="flex items-center gap-2 border-b border-border-light pb-4 mb-5">
                  <ShoppingBag className="text-primary-dark" size={20} />
                  <h2 className="text-lg font-bold text-text-dark">{t('orderSummary.orderItems') || 'Order Items'}</h2>
                </div>

                <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="border-b border-border-light pb-3">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-text-dark text-sm leading-tight">{item.name}</p>
                        <span className="bg-primary-light text-text-dark px-2.5 py-0.5 rounded text-xs font-black">
                          ×{item.quantity}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-text-light">
                        <span>₹{item.price} each</span>
                        <span className="font-extrabold text-primary-dark">₹{item.total.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Calc */}
                <div className="border-t-2 border-primary-light pt-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs text-text-light font-bold uppercase">
                    <span>{t('orderSummary.subtotal') || 'Subtotal'}</span>
                    <span>₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-text-light font-bold uppercase">
                    <span>{t('orderSummary.shipping') || 'Delivery'}</span>
                    <span className="text-emerald-600 font-extrabold">{t('orderSummary.free') || 'FREE'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border-light">
                    <span className="text-sm font-black text-text-dark uppercase">{t('orderSummary.grandTotal') || 'Grand Total'}</span>
                    <span className="text-2xl font-black text-primary-dark">₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
export default OrderSummaryPage;
