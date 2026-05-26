import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { ShoppingCart, Truck, BarChart3, Activity, Heart, Users } from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();

  const upcomingFeatures = [
    { icon: BarChart3, label: 'OCR', description: 'Automatic data extraction' },
    { icon: Activity, label: 'AI Assistant', description: 'Smart farming guide' },
    { icon: Heart, label: 'Insurance', description: 'Farm protection' },
    { icon: Truck, label: 'Vet', description: 'Veterinary services' },
    { icon: Users, label: 'Doctor Near Me', description: 'Find nearest vet' },
    { icon: ShoppingCart, label: 'Guidance', description: 'Expert advice' },
  ];

  return (
    <div className="min-h-screen bg-bg-light">
      <Header />

      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark py-8 px-4 md:py-12">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-dark mb-2">
            Welcome to MilkMaatu
          </h1>
          <p className="text-lg text-text-dark opacity-90">
            Your complete dairy farming solution
          </p>
        </div>
      </section>

      {/* Main Actions */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Buy Feeds Card */}
          <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => navigate('/feeds')}
            hover
            padding="lg"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🌾</div>
              <h2 className="text-3xl font-bold text-text-dark mb-3">Buy Feeds</h2>
              <p className="text-text-light mb-6">
                Purchase premium quality dairy feeds and supplements for your cattle
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/feeds')}
                className="w-full"
              >
                Browse Feeds →
              </Button>
            </div>
          </Card>

          {/* Sante Card */}
          <Card
            className="hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => navigate('/sante')}
            hover
            padding="lg"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🐄</div>
              <h2 className="text-3xl font-bold text-text-dark mb-3">Sante</h2>
              <p className="text-text-light mb-6">
                Buy and sell cattle through our Sante marketplace with verified sellers
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/sante')}
                className="w-full"
              >
                Explore Sante →
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Upcoming Features Section */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-3">
              Coming Soon
            </h2>
            <p className="text-text-light text-lg">
              Exciting new features are on the way to enhance your farming experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  padding="md"
                  className="text-center opacity-60 cursor-not-allowed hover:shadow-none transition-all"
                >
                  <Icon className="w-12 h-12 mx-auto text-primary mb-3" />
                  <h3 className="text-xl font-bold text-text-dark mb-2">
                    {feature.label}
                  </h3>
                  <p className="text-text-light text-sm">
                    {feature.description}
                  </p>
                  <div className="mt-4 inline-block bg-primary-light text-text-dark px-3 py-1 rounded-full text-xs font-semibold">
                    Coming Soon
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-bg-light py-12 px-4 border-t border-border-light">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <p className="text-text-light">Active Farmers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-text-light">Daily Transactions</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <p className="text-text-light">Customer Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
