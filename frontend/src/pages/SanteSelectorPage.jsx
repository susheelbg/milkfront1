import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';

export const SanteSelectorPage = () => {
  const navigate = useNavigate();
  const [selectedSante, setSelectedSante] = useState(null);

  const santes = [
    {
      id: 1,
      name: 'KRS Sante',
      range: '20 KM',
      description: 'Large cattle marketplace',
    },
    {
      id: 2,
      name: 'Thendekere Sante',
      range: '20 KM',
      description: 'Local cattle trading hub',
    },
  ];

  const handleProceed = (santeName) => {
    setSelectedSante(santeName);
    navigate('/sante-action', { state: { santeName } });
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page Header */}
      <section className="bg-primary py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-text-dark mb-3">Choose Your Sante</h1>
          <p className="text-lg text-text-dark opacity-90">
            Select your preferred marketplace to buy or sell cattle
          </p>
        </div>
      </section>

      {/* Sante Cards */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {santes.map(sante => (
            <Card
              key={sante.id}
              padding="lg"
              hover
              className="text-center cursor-pointer transition-all"
              onClick={() => handleProceed(sante.name)}
            >
              <div className="text-5xl mb-4">🐄</div>
              <h2 className="text-2xl font-bold text-text-dark mb-2">{sante.name}</h2>
              <p className="text-text-light mb-2">{sante.description}</p>
              <div className="bg-primary-light rounded-lg p-3 mb-6">
                <p className="text-sm text-text-dark font-semibold">Coverage Range</p>
                <p className="text-2xl font-bold text-primary">{sante.range}</p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => handleProceed(sante.name)}
              >
                Select Sante →
              </Button>
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Card padding="md" className="bg-blue-50 border-2 border-blue-200">
          <p className="text-text-dark text-center">
            <span className="font-bold">📍 Coverage:</span> Each Sante covers a 20 KM range for efficient local trading
          </p>
        </Card>
      </section>
    </div>
  );
};
