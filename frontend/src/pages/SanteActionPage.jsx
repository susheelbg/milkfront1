import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { ShoppingCart, Upload } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const SanteActionPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const santeName = 'Sante';

  return (
    <div className="min-h-screen bg-bg-light">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-text-dark mb-2">{santeName}</h1>
          <p className="text-text-dark opacity-90">{t('sante.postAd')}</p>
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
            <h2 className="text-3xl font-bold text-text-dark mb-3">{t('sante.buyCattle')}</h2>
            <p className="text-text-light mb-6">
              {t('sante.subtitle')}
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/sante-buy', { state: { santeName } })}
            >
              {t('sante.buyCattle')} →
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
            <h2 className="text-3xl font-bold text-text-dark mb-3">{t('sante.sellCattle')}</h2>
            <p className="text-text-light mb-6">
              {t('sante.postAd')}
            </p>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/sante-sell', { state: { santeName } })}
            >
              {t('sante.sellCattle')} →
            </Button>
          </Card>
        </div>

        {/* Info */}
        <div className="mt-12 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-text-dark font-semibold">
            ⏰ {t('sante.days24Hours')}
          </p>
        </div>
      </section>
    </div>
  );
};
