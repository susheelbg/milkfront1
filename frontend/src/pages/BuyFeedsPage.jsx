import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { feedsApi } from '../services/api/feedsApi';
import { Plus, Minus, ShoppingCart, Loader2, ChevronLeft, ChevronRight, X, Zap } from 'lucide-react';
import { toastService } from '../services/toastService';
import { useTranslation } from '../i18n/useTranslation';

export const BuyFeedsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

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

  useEffect(() => {
    if (feeds.length > 0 && location.state?.selectedFeedId) {
      const target = feeds.find(f => f.id === parseInt(location.state.selectedFeedId));
      if (target) setSelectedFeed(target);
    }
  }, [feeds, location.state]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setTouchStart(null);
  }, [selectedFeed?.id]);

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

  const handleBuyNow = (feedId) => {
    const currentQty = cart[feedId] || 0;
    const updatedCart = {
      ...cart,
      [feedId]: currentQty > 0 ? currentQty : 1,
    };
    setCart(updatedCart);
    saveCartToStorage(updatedCart);
    setSelectedFeed(null);
    navigate('/order-summary', { state: { cart: updatedCart } });
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

  const selectedImages = selectedFeed
    ? [
        selectedFeed.image || selectedFeed.image_url,
        selectedFeed.image2 || selectedFeed.image_url_2,
      ].filter(Boolean)
    : [];

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
          <div className="text-center py-16 bg-white border border-border-light rounded-3xl max-w-md mx-auto p-8 shadow-xs">
            <div className="w-16 h-16 bg-primary-light/50 text-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <ShoppingCart className="w-8 h-8 text-primary-dark" />
            </div>
            <h3 className="text-lg font-black text-text-dark mb-1">No feeds available yet</h3>
            <p className="text-text-light text-xs max-w-xs mx-auto leading-relaxed">
              New cattle feeds will appear here when the administrator adds them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {feeds.map(feed => {
              const qty = cart[feed.id] || 0;
              const hasMultipleImages = Boolean(feed.image2 || feed.image_url_2);
              return (
                <Card key={feed.id} className="flex flex-col overflow-hidden border border-border-light" padding="0">
                  {/* Tappable image area → opens detail sheet */}
                  <button
                    onClick={() => setSelectedFeed(feed)}
                    className="w-full text-left"
                    aria-label={`View ${feed.name} details`}
                  >
                    <div className="aspect-[4/5] w-full bg-gray-100 overflow-hidden relative">
                      <img src={feed.image || feed.image_url} alt={feed.name} className="w-full h-full object-cover" />
                      {feed.category && (
                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs text-text-dark text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border border-border-light shadow-xs">
                          {feed.category}
                        </span>
                      )}
                      {hasMultipleImages && (
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold py-0.5 px-1.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                          📷 2 photos
                        </span>
                      )}
                    </div>
                    {/* Name */}
                    <div className="px-2.5 pt-2.5 pb-1">
                      <h3 className="text-xs font-extrabold text-text-dark leading-snug line-clamp-2">{feed.name}</h3>
                      <p className="text-primary-dark font-black text-sm mt-0.5">
                        ₹{feed.price}
                        {feed.unit && (
                          <span className="text-[10px] text-text-light font-bold"> / {feed.unit}</span>
                        )}
                      </p>
                    </div>
                  </button>

                  {/* Add & Buy action row */}
                  <div className="px-2.5 pb-2.5 flex flex-col gap-1.5">
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
                      <div className="flex gap-1.5">
                        <Button variant="primary" size="sm" onClick={() => addToCart(feed.id)} className="flex-1 font-bold shadow-xs active:scale-95 text-xs">
                          + {t('feeds.addToCart')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBuyNow(feed.id)} className="font-bold shadow-xs active:scale-95 text-xs border-primary-dark text-primary-dark px-2 bg-primary-light/40">
                          ⚡ Buy
                        </Button>
                      </div>
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Sheet container */}
          <div
            className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col animate-slide-up overflow-hidden md:max-w-2xl md:mx-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Top header handle + Close button */}
            <div className="relative flex items-center justify-center px-5 pt-3 pb-2 border-b border-border-light/60 flex-shrink-0 bg-white">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
              <button
                onClick={() => setSelectedFeed(null)}
                className="absolute right-4 top-2 text-text-light hover:text-text-dark bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
                aria-label="Close detail view"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body (Image + Details + Other Products) */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-5">
              {/* Product Info Row */}
              <div className="flex gap-4">
                {/* Product Image / Swipeable Carousel */}
                {selectedImages.length > 1 ? (
                  <div className="relative w-32 h-40 rounded-2xl overflow-hidden shadow-md flex-shrink-0 bg-gray-100 group">
                    <div
                      className="flex w-full h-full transition-transform duration-300 ease-out"
                      style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                      onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
                      onTouchEnd={(e) => {
                        if (touchStart === null) return;
                        const touchEnd = e.changedTouches[0].clientX;
                        const diff = touchStart - touchEnd;
                        if (diff > 30 && currentImageIndex < selectedImages.length - 1) {
                          setCurrentImageIndex(prev => prev + 1);
                        } else if (diff < -30 && currentImageIndex > 0) {
                          setCurrentImageIndex(prev => prev - 1);
                        }
                        setTouchStart(null);
                      }}
                    >
                      {selectedImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`${selectedFeed.name} ${idx + 1}`}
                          className="w-full h-full object-cover flex-shrink-0"
                        />
                      ))}
                    </div>

                    {currentImageIndex > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(prev => prev - 1);
                        }}
                        className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                        aria-label="Previous Image"
                      >
                        <ChevronLeft size={16} />
                      </button>
                    )}
                    {currentImageIndex < selectedImages.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(prev => prev + 1);
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors z-10"
                        aria-label="Next Image"
                      >
                        <ChevronRight size={16} />
                      </button>
                    )}

                    <div className="absolute bottom-2 left-0 right-0 flex justify-center items-center gap-1.5 z-10 pointer-events-none">
                      {selectedImages.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentImageIndex ? 'w-4 bg-white shadow-md' : 'w-1.5 bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <img
                    src={selectedImages[0] || selectedFeed.image || selectedFeed.image_url}
                    alt={selectedFeed.name}
                    className="w-28 h-36 object-cover rounded-2xl flex-shrink-0 shadow-md border border-border-light"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {selectedFeed.category && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                      {selectedFeed.category}
                    </span>
                  )}
                  <h2 className="text-lg font-extrabold text-text-dark mt-2 leading-snug">{selectedFeed.name}</h2>
                  <p className="text-2xl font-black text-primary-dark mt-1">
                    ₹{selectedFeed.price}
                    {selectedFeed.unit && (
                      <span className="text-xs text-text-light font-bold"> / {selectedFeed.unit}</span>
                    )}
                  </p>
                  {selectedImages.length > 1 && (
                    <p className="text-[11px] font-semibold text-primary-dark mt-2 flex items-center gap-1">
                      Swipe left/right to view photos ({currentImageIndex + 1}/{selectedImages.length})
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-black text-text-dark uppercase tracking-wider mb-1">About this product</h4>
                <p className="text-sm text-text-light leading-relaxed">{selectedFeed.description || 'High quality cattle feed for maximum milk yield and health.'}</p>
              </div>

              {/* ── Other Products Section (Scroll down to see other products) ────── */}
              {feeds.filter(f => f.id !== selectedFeed.id).length > 0 && (
                <div className="pt-3 border-t border-border-light">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-text-dark uppercase tracking-wider">
                      Other Products You Might Like
                    </h4>
                    <span className="text-[10px] font-semibold text-text-light uppercase tracking-wider">
                      {feeds.filter(f => f.id !== selectedFeed.id).length} available
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {feeds.filter(f => f.id !== selectedFeed.id).map(otherFeed => (
                      <div
                        key={otherFeed.id}
                        onClick={() => setSelectedFeed(otherFeed)}
                        className="bg-gray-50/80 border border-border-light rounded-xl p-2.5 cursor-pointer hover:border-primary-dark/40 active:scale-95 transition-all flex flex-col justify-between"
                      >
                        <div className="aspect-[4/5] w-full bg-white rounded-lg overflow-hidden mb-2 border border-border-light/60">
                          <img
                            src={otherFeed.image || otherFeed.image_url}
                            alt={otherFeed.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-dark line-clamp-2 leading-tight">{otherFeed.name}</p>
                          <p className="text-xs font-black text-primary-dark mt-1">₹{otherFeed.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sticky Add To Cart & Buy Now Footer (Always 100% visible on mobile) ── */}
            <div className="p-4 bg-white border-t border-border-light shadow-lg flex-shrink-0 z-20">
              <div className="flex items-center gap-2">
                {/* Quantity selector or Add to Cart */}
                {(cart[selectedFeed.id] || 0) > 0 ? (
                  <div className="flex items-center justify-between gap-3 bg-primary-light rounded-2xl border border-primary-dark/30 p-1.5 px-3 flex-1">
                    <button onClick={() => removeFromCart(selectedFeed.id)} className="p-2 hover:bg-primary-dark/20 rounded-xl active:scale-95 transition-all bg-white shadow-xs">
                      <Minus size={16} />
                    </button>
                    <span className="text-base font-extrabold text-text-dark min-w-[24px] text-center">{cart[selectedFeed.id]}</span>
                    <button onClick={() => addToCart(selectedFeed.id)} className="p-2 hover:bg-primary-dark/20 rounded-xl active:scale-95 transition-all bg-white shadow-xs">
                      <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => addToCart(selectedFeed.id)}
                    className="flex-1 font-extrabold shadow-xs active:scale-95 py-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 border-2 border-primary-dark text-primary-dark bg-primary-light/40 hover:bg-primary-light"
                  >
                    <ShoppingCart size={16} />
                    <span>+ Add to Cart</span>
                  </Button>
                )}

                {/* Instant Buy Now Button */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleBuyNow(selectedFeed.id)}
                  className="flex-1 font-extrabold shadow-md active:scale-95 py-3 text-xs sm:text-sm flex items-center justify-center gap-1.5 bg-primary-dark text-text-dark hover:bg-primary-dark/90"
                >
                  <Zap size={16} className="fill-current text-text-dark" />
                  <span>Buy Now — ₹{selectedFeed.price}</span>
                </Button>
              </div>
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
