import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { ShoppingCart, Upload } from 'lucide-react';

export const SanteActionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const santeName = location.state?.santeName;

  if (!santeName) {
    navigate('/sante');
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <Header showBack onBack={() => navigate('/sante')} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-text-dark mb-2">{santeName}</h1>
          <p className="text-text-dark opacity-90">What would you like to do?</p>
        </div>
      </section>

      {/* Action Cards */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Buy Card */}
          <Card
            padding="lg"
            hover
            className="text-center cursor-pointer transition-all"
            onClick={() => navigate('/sante-buy', { state: { santeName } })}
          >
            <ShoppingCart className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold text-text-dark mb-3">Buy Cattle</h2>
            <p className="text-text-light mb-6">
              Browse and purchase healthy cattle from verified sellers in your Sante
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/sante-buy', { state: { santeName } })}
            >
              View Listings →
            </Button>
          </Card>

          {/* Sell Card */}
          <Card
            padding="lg"
            hover
            className="text-center cursor-pointer transition-all"
            onClick={() => navigate('/sante-sell', { state: { santeName } })}
          >
            <Upload className="w-16 h-16 mx-auto text-primary mb-4" />
            <h2 className="text-3xl font-bold text-text-dark mb-3">Sell Cattle</h2>
            <p className="text-text-light mb-6">
              Post your cattle for sale and reach interested buyers in your area
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/sante-sell', { state: { santeName } })}
            >
              Create Listing →
            </Button>
          </Card>
        </div>

        {/* Info */}
        <div className="mt-12 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-text-dark">
            <span className="font-bold">⏰ Listing Duration:</span> Posts automatically delete after 24 hours. 
            Repost to keep your listing active!
          </p>
        </div>
      </section>
    </div>
  );
};
