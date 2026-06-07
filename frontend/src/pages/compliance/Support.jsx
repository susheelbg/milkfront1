import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Card, Button } from '../../components';
import { Mail, Globe, Settings, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

export const Support = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header showBack onBack={() => navigate(-1)} />
      <section className="bg-primary py-8 px-4 text-center">
        <h1 className="text-3xl font-bold text-text-dark">{t('compliance.helpSupport')}</h1>
      </section>
      <section className="max-w-md mx-auto px-4 py-8">
        <Card className="flex flex-col gap-6 text-text-dark">
          {/* Support Email */}
          <div className="flex items-center gap-4 p-4 bg-bg-light rounded-xl border border-border-light">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary-dark">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-xs text-text-light font-bold uppercase">{t('compliance.supportEmail')}</p>
              <a href="mailto:support@milkmaatu.com" className="font-extrabold text-sm text-text-dark hover:underline">
                support@milkmaatu.com
              </a>
            </div>
          </div>

          {/* Website */}
          <div className="flex items-center gap-4 p-4 bg-bg-light rounded-xl border border-border-light">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary-dark">
              <Globe size={20} />
            </div>
            <div>
              <p className="text-xs text-text-light font-bold uppercase">{t('compliance.website')}</p>
              <a href="https://milkmaatu.com" target="_blank" rel="noopener noreferrer" className="font-extrabold text-sm text-text-dark hover:underline">
                www.milkmaatu.com
              </a>
            </div>
          </div>

          {/* App Version */}
          <div className="flex items-center gap-4 p-4 bg-bg-light rounded-xl border border-border-light">
            <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-primary-dark">
              <Settings size={20} />
            </div>
            <div>
              <p className="text-xs text-text-light font-bold uppercase">{t('compliance.appVersion')}</p>
              <p className="font-extrabold text-sm text-text-dark">v1.2.0 (Play Store Compliant)</p>
            </div>
          </div>

          <Button variant="primary" onClick={() => navigate(-1)} className="w-full font-bold flex items-center justify-center gap-2">
            <ArrowLeft size={16} />
            {t('common.back')}
          </Button>
        </Card>
      </section>
    </div>
  );
};
