import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { feedsApi } from '../services/api/feedsApi';
import { Button } from './Button';

export const CartPanel = ({ onClose }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [cart, setCart] = useState({});
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCartAndFeeds = async () => {
    try {
      const feedData = await feedsApi.getFeeds();
      if (Array.isArray(feedData)) {
        setFeeds(feedData);
      }
    } catch (e) {
      console.error('Failed to load feeds for cart:', e);
    } finally {
      setLoading(false);
    }

    const savedCart = localStorage.getItem('active_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        setCart({});
      }
    } else {
      setCart({});
    }
  };

  useEffect(() => {
    loadCartAndFeeds();

    const handleSync = () => {
      const savedCart = localStorage.getItem('active_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (e) {}
      } else {
        setCart({});
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('cart_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cart_updated', handleSync);
    };
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('active_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cart_updated'));
  };

  const updateQuantity = (feedId, delta) => {
    const newCart = { ...cart };
    const currentQty = newCart[feedId] || 0;
    const nextQty = currentQty + delta;

    if (nextQty <= 0) {
      delete newCart[feedId];
    } else {
      newCart[feedId] = nextQty;
    }
    saveCart(newCart);
  };

  const removeItem = (feedId) => {
    const newCart = { ...cart };
    delete newCart[feedId];
    saveCart(newCart);
  };

  const clearAll = () => {
    saveCart({});
  };

  const cartEntries = Object.entries(cart).filter(([_, qty]) => qty > 0);

  const getTotalItems = () => {
    return cartEntries.reduce((sum, [_, qty]) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return cartEntries.reduce((sum, [id, qty]) => {
      const feed = feeds.find((f) => f.id === parseInt(id));
      return sum + (feed ? feed.price * qty : 0);
    }, 0);
  };

  const handleCheckout = () => {
    onClose();
    navigate('/order-summary', { state: { cart } });
  };

  const handleBrowseFeeds = () => {
    onClose();
    navigate('/feeds');
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Drawer Panel */}
      <div
        className="relative w-full max-w-md bg-white h-[100dvh] max-h-[100dvh] min-h-0 shadow-2xl flex flex-col z-10 animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-light flex items-center justify-between bg-primary-light/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-text-dark flex items-center justify-center shadow-xs">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-text-dark text-base">{t('cart.title')}</h3>
              <p className="text-[11px] font-semibold text-text-light">
                {getTotalItems()} {t('cart.items')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cartEntries.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors border border-red-200"
              >
                {t('cart.clear')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 text-text-light hover:text-text-dark transition-colors"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-20 text-center text-text-light font-semibold text-sm">
              Loading cart items...
            </div>
          ) : cartEntries.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-20 h-20 bg-amber-100/70 text-amber-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-amber-200">
                <ShoppingCart size={36} />
              </div>
              <div>
                <h4 className="font-extrabold text-text-dark text-lg">{t('cart.empty')}</h4>
                <p className="text-xs text-text-light mt-1 max-w-xs mx-auto leading-relaxed">
                  {t('cart.emptyDesc')}
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleBrowseFeeds}
                className="font-bold shadow-md px-6 text-sm active:scale-95"
              >
                {t('cart.browseFeeds')}
              </Button>
            </div>
          ) : (
            cartEntries.map(([id, qty]) => {
              const feedId = parseInt(id);
              const feed = feeds.find((f) => f.id === feedId);
              const name = feed ? feed.name : `Feed Product #${feedId}`;
              const price = feed ? feed.price : 0;
              const unit = feed ? feed.unit : 'unit';
              const image = feed ? feed.image || feed.image_url : null;

              return (
                <div
                  key={feedId}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-border-light bg-gray-50/70 hover:bg-white hover:shadow-sm transition-all"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl bg-white border border-border-light overflow-hidden flex-shrink-0">
                    {image ? (
                      <img src={image} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl bg-amber-50">🌾</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-extrabold text-text-dark text-xs truncate leading-snug">{name}</h5>
                    <p className="text-primary-dark font-black text-xs mt-0.5">
                      ₹{price} {unit && <span className="text-[10px] text-text-light font-normal">/ {unit}</span>}
                    </p>
                    <p className="text-[11px] font-black text-text-dark mt-0.5">
                      Total: ₹{(price * qty).toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <button
                      onClick={() => removeItem(feedId)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="flex items-center bg-white rounded-lg border border-border-light shadow-xs overflow-hidden">
                      <button
                        onClick={() => updateQuantity(feedId, -1)}
                        className="p-1 px-1.5 hover:bg-gray-100 text-text-dark active:scale-95 transition-all"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-black text-xs min-w-[20px] text-center text-text-dark px-1">
                        {qty}
                      </span>
                      <button
                        onClick={() => updateQuantity(feedId, 1)}
                        className="p-1 px-1.5 hover:bg-gray-100 text-text-dark active:scale-95 transition-all"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        {cartEntries.length > 0 && (
          <div className="shrink-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] border-t border-border-light bg-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-light uppercase tracking-wider">{t('cart.total')}</span>
              <span className="text-2xl font-black text-text-dark">₹{getTotalPrice().toLocaleString()}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckout}
              className="w-full font-bold shadow-md active:scale-95 py-3.5 flex items-center justify-center gap-2 text-base"
            >
              <span>{t('cart.checkout')}</span>
              <ArrowRight size={18} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
