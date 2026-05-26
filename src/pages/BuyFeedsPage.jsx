import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { feedsData } from '../data/dummyData';
import { Plus, Minus } from 'lucide-react';

export const BuyFeedsPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({});

  const addToCart = (feedId) => {
    setCart(prev => ({
      ...prev,
      [feedId]: (prev[feedId] || 0) + 1,
    }));
  };

  const removeFromCart = (feedId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[feedId] > 1) {
        newCart[feedId]--;
      } else {
        delete newCart[feedId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const handleCheckout = () => {
    if (getTotalItems() === 0) {
      alert('Please add items to your cart');
      return;
    }
    navigate('/order-summary', { state: { cart } });
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-text-dark mb-2">Buy Feeds</h1>
          <p className="text-text-dark opacity-90">
            Premium quality feeds and supplements for your cattle
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedsData.map(feed => (
            <Card key={feed.id} className="flex flex-col hover" hover padding="0">
              {/* Image */}
              <img
                src={feed.image}
                alt={feed.name}
                className="w-full h-40 object-cover rounded-t-xl"
              />

              {/* Content */}
              <div className="flex-1 p-4 flex flex-col">
                <h3 className="text-xl font-bold text-text-dark mb-1">{feed.name}</h3>
                <p className="text-sm text-text-light mb-3">{feed.description}</p>

                {/* Price */}
                <div className="mb-4 mt-auto">
                  <p className="text-3xl font-bold text-primary">₹{feed.price}</p>
                  <p className="text-xs text-text-light">per unit</p>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-3 mb-4 bg-bg-light p-3 rounded-lg">
                  <button
                    onClick={() => removeFromCart(feed.id)}
                    className="text-primary hover:opacity-70 transition-opacity"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="flex-1 text-center font-bold text-text-dark">
                    {cart[feed.id] || 0}
                  </span>
                  <button
                    onClick={() => addToCart(feed.id)}
                    className="text-primary hover:opacity-70 transition-opacity"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => addToCart(feed.id)}
                >
                  Add to Cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Checkout Footer */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-text-light text-sm">Total Items</p>
              <p className="text-2xl font-bold text-text-dark">{getTotalItems()}</p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCheckout}
              className="px-8"
            >
              Proceed to Order →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
