import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { useTranslation } from '../i18n/useTranslation';

export const SanteSelectorPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedSante, setSelectedSante] = useState(null);

  const santes = [
    {
      id: 1,
      name: t('sante.krsSante'),
      range: '20 KM',
      description: t('sante.subtitle'),
    },
    {
      id: 2,
      name: t('sante.thendekereSante'),
      range: '20 KM',
      description: t('sante.subtitle'),
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
          <h1 className="text-4xl font-bold text-text-dark mb-3">{t('sante.title')}</h1>
          <p className="text-lg text-text-dark opacity-90">
            {t('sante.subtitle')}
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
                <p className="text-sm text-text-dark font-semibold">{t('sante.santeRadius')}</p>
                <p className="text-2xl font-bold text-primary">{sante.range}</p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => handleProceed(sante.name)}
              >
                {sante.name} →
              </Button>
            </Card>
          ))}
        </div>

        {/* Info Box */}
        <Card padding="md" className="bg-blue-50 border-2 border-blue-200">
          <p className="text-text-dark text-center font-bold">
            📍 {t('sante.days24Hours')}
          </p>
        </Card>
      </section>
    </div>
  );
};
