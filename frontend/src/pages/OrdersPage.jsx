import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Card, Button } from '../components';
import { orderApi } from '../services/api/orderApi';
import { authApi } from '../services/api/authApi';
import { ShoppingBag, Tag, IndianRupee, Loader2, Package } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const OrdersPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const data = await orderApi.getMyOrders();
        setOrders(data || []);
      } catch (err) {
        console.error('Failed to fetch user orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg-light pb-20">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4 shadow-sm border-b border-primary-dark">
        <div className="max-w-4xl mx-auto text-left">
          <p className="text-xs text-text-light font-bold uppercase tracking-wider">
            {t('common.namaste') || 'Namaste'}
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-dark flex items-center gap-2 mt-1">
            <Package className="text-text-dark stroke-[2.5px]" size={28} />
            {t('common.myOrders') || 'My Orders'}
          </h1>
        </div>
      </section>

      {/* Orders Body */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <Card padding="lg" className="border border-border-light shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-border-light pb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-text-dark" size={24} />
              <h2 className="text-xl font-bold text-text-dark">{t('orderSummary.orderItems') || 'Ordered Items'}</h2>
            </div>
            <span className="text-xs font-semibold bg-primary text-text-dark px-2.5 py-1 rounded-full border border-primary-dark shadow-sm">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>

          {loadingOrders ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-light">
              <Loader2 className="animate-spin rounded-full h-10 w-10 text-primary-dark mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider">{t('common.loading') || 'Loading...'}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-4 bg-bg-light rounded-2xl border border-dashed border-border-light flex flex-col items-center">
              <ShoppingBag className="text-text-light mb-4" size={48} />
              <h3 className="font-bold text-text-dark text-lg mb-1">No Orders Placed Yet</h3>
              <p className="text-xs text-text-light max-w-sm mb-6 leading-relaxed">
                Explore the feeds catalog and buy quality nutritional supplements for your cattle!
              </p>
              <Button variant="primary" size="md" onClick={() => navigate('/feeds')} className="font-bold">
                Browse Feeds Catalog
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-bg-light border border-border-light rounded-xl p-5 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                >
                  {/* Order Header / Status */}
                  <div className="flex justify-between items-start gap-4 mb-4 border-b border-border-light border-dashed pb-3">
                    <div>
                      <p className="text-xs font-bold text-text-dark font-mono uppercase tracking-wider">
                        Order: {order.id}
                      </p>
                      <p className="text-[10px] text-text-light font-medium mt-1">
                        Placed on {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm border ${
                      order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : order.status === 'dispatched'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : order.status === 'delivered'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {order.status || 'pending'}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 mb-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 text-text-dark font-semibold">
                          <Tag size={14} className="text-text-light" />
                          <span>{item.feed?.title || item.feed?.name || 'Feed Product'}</span>
                          <span className="text-text-light font-bold">x {item.quantity}</span>
                        </div>
                        <span className="font-extrabold text-text-dark flex items-center">
                          <IndianRupee size={12} className="mt-[1px]" />
                          {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Total / Address info */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end bg-white/70 p-3.5 rounded-lg border border-border-light border-dashed text-xs gap-3">
                    <div className="text-[10px] text-text-light leading-relaxed max-w-full sm:max-w-[70%]">
                      <p className="font-bold uppercase tracking-wide mb-1">{t('orderSummary.deliveryAddress') || 'Delivery Address'}</p>
                      <p className="font-semibold text-text-dark leading-relaxed break-words">{order.delivery_address || order.village_name || 'Home Village'}</p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-2.5 sm:pt-0">
                      <p className="text-[10px] text-text-light font-bold uppercase tracking-wide mb-1">{t('orderSummary.grandTotal') || 'Grand Total'}</p>
                      <p className="font-black text-base text-emerald-600 flex items-center sm:justify-end">
                        <IndianRupee size={14} className="mt-[2px] stroke-[2.5px]" />
                        {order.total_amount?.toLocaleString() || order.totalPrice?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
};
