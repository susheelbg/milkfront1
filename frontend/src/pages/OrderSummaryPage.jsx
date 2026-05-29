import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header, Button, Input, Card } from '../components';
import { feedsApi } from '../services/api/feedsApi';
import { orderApi } from '../services/api/orderApi';
import { authApi } from '../services/api/authApi';
import { toastService } from '../services/toastService';
import { ShoppingBag, Loader2, MapPin } from 'lucide-react';

export const OrderSummaryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
      toastService.info('Your cart is empty. Redirecting to store...');
      navigate('/feeds');
      return;
    }

    // Prefill user details
    const user = authApi.getCurrentUser();
    if (user) {
      setFormData({
        customerName: user.name || '',
        phoneNumber: user.phone || '',
        villageName: user.villageName || '',
        address: user.address || '',
      });
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
  }, [cart, navigate]);

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
      newErrors.address = 'Complete delivery address is required';
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
      toastService.error('Please verify delivery details form.');
      return;
    }

    setLoadingSubmit(true);

    try {
      await orderApi.createOrder({
        items: getCartItems(),
        totalPrice: getTotalPrice(),
        ...formData,
      });

      toastService.success('Order placed successfully!');
      
      // Clear active cart
      localStorage.removeItem('active_cart');
      setSubmitted(true);

      setTimeout(() => {
        navigate('/home');
      }, 2500);
    } catch (error) {
      toastService.error('Failed to place order. Please try again.');
    } finally {
      setLoadingSubmit(false);
    }
  };

  const items = getCartItems();

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
        <Card padding="lg" className="text-center max-w-md border border-emerald-200 shadow-xl animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
            ✓
          </div>
          <h1 className="text-2xl font-black text-emerald-800 mb-2">Order Confirmed!</h1>
          <p className="text-text-light text-sm mb-6 leading-relaxed">
            Your cattle feeds order was registered successfully. Fast doorstep delivery is preparing.
          </p>
          <div className="bg-white/80 p-3 rounded-lg text-xs font-bold text-text-dark border border-emerald-200">
            Auto redirecting back to home page...
          </div>
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
          <h1 className="text-3xl font-extrabold text-text-dark">Order Checkout</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        {loadingFeeds ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-light">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-semibold text-sm">Building invoice details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Details - Left */}
            <div className="lg:col-span-2">
              <Card padding="lg" className="border border-border-light shadow-sm">
                <div className="flex items-center gap-2 border-b border-border-light pb-4 mb-6">
                  <MapPin className="text-primary-dark" size={22} />
                  <h2 className="text-xl font-bold text-text-dark">Delivery Address</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Farmer Full Name"
                    placeholder="Enter your full name"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    error={errors.customerName}
                    required
                  />

                  <Input
                    label="WhatsApp Mobile Number"
                    placeholder="+91 9876543210"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    error={errors.phoneNumber}
                    required
                  />

                  <Input
                    label="Village Name"
                    placeholder="e.g., Thendekere"
                    name="villageName"
                    value={formData.villageName}
                    onChange={handleChange}
                    error={errors.villageName}
                    required
                  />

                  <Input
                    label="Detailed Address"
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
                    className="w-full font-bold shadow-md hover:scale-[1.01] transition-transform mt-6"
                    disabled={loadingSubmit}
                  >
                    {loadingSubmit ? 'Placing Order...' : `Confirm & Place Order (₹${getTotalPrice().toLocaleString()})`}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Order Items Summary - Right */}
            <div className="lg:col-span-1">
              <Card padding="lg" className="sticky top-20 border border-border-light shadow-sm">
                <div className="flex items-center gap-2 border-b border-border-light pb-4 mb-5">
                  <ShoppingBag className="text-primary-dark" size={20} />
                  <h2 className="text-lg font-bold text-text-dark">Invoice Items</h2>
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
                    <span>Feed Subtotal</span>
                    <span>₹{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-text-light font-bold uppercase">
                    <span>Doorstep Shipping</span>
                    <span className="text-emerald-600 font-extrabold">FREE DELIVERY</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border-light">
                    <span className="text-sm font-black text-text-dark uppercase">Grand Total</span>
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

