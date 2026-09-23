import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { feedsApi } from '../services/api/feedsApi';
import { Plus, Minus, ShoppingCart, Loader2, AlertTriangle } from 'lucide-react';
import { toastService } from '../services/toastService';
import { useTranslation } from '../i18n/useTranslation';

export const BuyFeedsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [selectedFeed, setSelectedFeed] = useState(null);

  useEffect(() => {
    const loadFeeds = async () => {
      setLoading(true);
      try {
        const data = await feedsApi.getFeeds();
        setFeeds(data);
      } catch (err) {
        toastService.error('Failed to load feeds inventory.');
      } finally {
        setLoading(false);
      }
    };
    loadFeeds();

    // Recover existing cart if any
    const savedCart = localStorage.getItem('active_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {}
    }
  }, []);

  const saveCartToStorage = (newCart) => {
    localStorage.setItem('active_cart', JSON.stringify(newCart));
  };

  const addToCart = (feedId) => {
    setCart(prev => {
      const updated = {
        ...prev,
        [feedId]: (prev[feedId] || 0) + 1,
      };
      saveCartToStorage(updated);
      return updated;
    });
  };

  const removeFromCart = (feedId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[feedId] > 1) {
        newCart[feedId]--;
      } else {
        delete newCart[feedId];
      }
      saveCartToStorage(newCart);
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const feed = feeds.find(f => f.id === parseInt(id));
      return sum + (feed ? feed.price * qty : 0);
    }, 0);
  };

  const handleCheckout = () => {
    if (getTotalItems() === 0) {
      toastService.info('Please add items to your cart first.');
      return;
    }
    navigate('/order-summary', { state: { cart } });
  };

  return (
    <div className="min-h-screen bg-bg-light pb-24">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold text-text-dark mb-1">{t('feeds.title')}</h1>
          <p className="text-text-dark opacity-90 text-sm font-semibold">
            {t('feeds.subtitle')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-light">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-semibold text-sm">{t('common.loading')}</p>
          </div>
        ) : feeds.length === 0 ? (
          <div className="text-center py-16 bg-white border border-border-light rounded-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-text-dark mb-1">{t('feeds.noProducts')}</h3>
            <p className="text-text-light text-sm">{t('feeds.noProducts')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {feeds.map(feed => {
              const qty = cart[feed.id] || 0;
              return (
                <Card key={feed.id} className="flex flex-col overflow-hidden border border-border-light" padding="0">
                  {/* Tappable image area → opens detail sheet */}
                  <button
                    onClick={() => setSelectedFeed(feed)}
                    className="w-full text-left"
                    aria-label={`View ${feed.name} details`}
                  >
                    <div className="aspect-[4/5] w-full bg-gray-100 overflow-hidden relative">
                      <img src={feed.image} alt={feed.name} className="w-full h-full object-cover" />
                      {feed.category && (
                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs text-text-dark text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border border-border-light shadow-xs">
                          {feed.category}
                        </span>
                      )}
                    </div>
                    {/* Name */}
                    <div className="px-2.5 pt-2.5 pb-1">
                      <h3 className="text-xs font-extrabold text-text-dark leading-snug line-clamp-2">{feed.name}</h3>
                      <p className="text-primary-dark font-black text-sm mt-0.5">₹{feed.price}<span className="text-[10px] text-text-light font-bold"> /kg</span></p>
                    </div>
                  </button>

                  {/* Add button row */}
                  <div className="px-2.5 pb-2.5">
                    {qty > 0 ? (
                      <div className="flex items-center justify-between bg-primary-light rounded-xl border border-primary-dark/30 overflow-hidden">
                        <button onClick={() => removeFromCart(feed.id)} className="p-2 hover:bg-primary-dark/20 active:scale-95 transition-all" title="Remove">
                          <Minus size={14} />
                        </button>
                        <span className="font-extrabold text-text-dark text-sm min-w-[24px] text-center">{qty}</span>
                        <button onClick={() => addToCart(feed.id)} className="p-2 hover:bg-primary-dark/20 active:scale-95 transition-all" title="Add">
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => addToCart(feed.id)} className="w-full font-bold shadow-xs active:scale-95 text-xs">
                        + {t('feeds.addToCart')}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Feed Detail Bottom Sheet ───────────────────────────── */}
      {selectedFeed && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setSelectedFeed(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex gap-4 p-5">
              {/* Image */}
              <img
                src={selectedFeed.image}
                alt={selectedFeed.name}
                className="w-28 h-36 object-cover rounded-2xl flex-shrink-0 shadow-md"
              />
              {/* Info */}
              <div className="flex-1 min-w-0">
                {selectedFeed.category && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    {selectedFeed.category}
                  </span>
                )}
                <h2 className="text-lg font-extrabold text-text-dark mt-2 leading-snug">{selectedFeed.name}</h2>
                <p className="text-2xl font-black text-primary-dark mt-1">
                  ₹{selectedFeed.price}
                  <span className="text-xs text-text-light font-bold"> /kg</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="px-5 pb-2">
              <h4 className="text-xs font-black text-text-dark uppercase tracking-wider mb-1.5">About this product</h4>
              <p className="text-sm text-text-light leading-relaxed">{selectedFeed.description}</p>
            </div>

            {/* Add to cart */}
            <div className="px-5 pt-3 pb-8 border-t border-border-light mt-3">
              {(cart[selectedFeed.id] || 0) > 0 ? (
                <div className="flex items-center justify-center gap-6 bg-primary-light rounded-2xl border border-primary-dark/30 py-3">
                  <button onClick={() => removeFromCart(selectedFeed.id)} className="p-2 hover:bg-primary-dark/20 rounded-xl active:scale-95 transition-all">
                    <Minus size={20} />
                  </button>
                  <span className="text-xl font-extrabold text-text-dark min-w-[32px] text-center">{cart[selectedFeed.id]}</span>
                  <button onClick={() => addToCart(selectedFeed.id)} className="p-2 hover:bg-primary-dark/20 rounded-xl active:scale-95 transition-all">
                    <Plus size={20} />
                  </button>
                </div>
              ) : (
                <Button variant="primary" size="lg" onClick={() => addToCart(selectedFeed.id)} className="w-full font-bold shadow-md active:scale-95">
                  + {t('feeds.addToCart')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Cart Footer */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+60px)] md:bottom-[76px] left-0 right-0 bg-white/95 backdrop-blur-md border-t border-primary-dark/30 shadow-2xl z-40 animate-slide-up md:max-w-2xl md:mx-auto md:rounded-xl md:border md:shadow-lg transition-all duration-300">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-light rounded-xl border border-primary-dark/35 flex items-center justify-center relative">
                <ShoppingCart className="text-text-dark" size={20} />
                <span className="absolute -top-1.5 -right-1.5 bg-text-dark text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center border border-white">
                  {getTotalItems()}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-text-light font-bold uppercase tracking-wider">{t('feeds.cart')}</p>
                <p className="text-xl font-black text-text-dark">₹{getTotalPrice().toLocaleString()}</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckout}
              className="px-6 font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              <span>{t('feeds.checkout')}</span>
              <span>→</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
