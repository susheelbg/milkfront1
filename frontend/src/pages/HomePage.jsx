import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { authApi } from '../services/api/authApi';
import { ShieldCheck, Heart, Truck, Users, HelpCircle } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(authApi.getCurrentUser());
  }, []);

  const upcomingFeatures = [
    { icon: ShieldCheck, label: t('home.insurance'), description: t('home.insuranceDesc') },
    { icon: Truck, label: t('home.vetVisit'), description: t('home.vetVisitDesc') },
    { icon: Users, label: t('home.doctorNearMe'), description: t('home.doctorNearMeDesc') },
    { icon: HelpCircle, label: t('home.expertAdvice'), description: t('home.expertAdviceDesc') },
  ];

  const mainActions = [
    {
      id: 'feeds',
      label: t('home.buyFeeds'),
      emoji: '🌾',
      bg: 'bg-amber-100',
      border: 'border-amber-200',
      action: () => navigate('/feeds'),
    },
    {
      id: 'sante',
      label: t('home.sante'),
      emoji: '🐄',
      bg: 'bg-emerald-100',
      border: 'border-emerald-200',
      action: () => navigate('/sante'),
    },
    {
      id: 'ocr',
      label: t('home.ocrExtract'),
      emoji: '📄',
      bg: 'bg-sky-100',
      border: 'border-sky-200',
      action: () => {
        alert(t('home.ocrAlert') || 'Milk Record feature is preparing...');
      },
    },
    {
      id: 'ai',
      label: t('home.nandiniAi'),
      emoji: '🧠✨',
      bg: 'bg-indigo-100',
      border: 'border-indigo-200',
      action: () => {
        navigate('/nandini-ai');
      },
    },
  ];

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header />

      {/* Welcome Title */}
      <section className="bg-white border-b border-border-light py-5 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-text-light font-bold uppercase tracking-wider">{t('common.namaste')}</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-dark">
            {t('common.welcome')}, {currentUser?.name || t('common.farmer')}
          </h2>
        </div>
      </section>

      {/* Top Banner Card (Left Pic, Right Content) */}
      <section className="max-w-4xl mx-auto px-4 pt-6">
        <div className="bg-gradient-to-r from-primary-light via-primary/30 to-amber-100 rounded-2xl border border-primary-dark/30 p-5 flex flex-row items-center gap-4 md:gap-6 shadow-sm overflow-hidden relative">
          {/* Left Side: Portrait Photo */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 border-primary-dark/40 overflow-hidden shadow-sm flex-shrink-0 bg-white">
            <img 
              src="https://res.cloudinary.com/drj9c8kpj/image/upload/v1780207723/milkmaatu_sante/gzgmvhcns8fo8uaf25sq.png" 
              alt="Susheel" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Side: Text Content */}
          <div className="flex-1 space-y-1.5 text-left">
            <p className="text-sm font-black text-text-dark tracking-tight">
              Susheel
            </p>
            <p className="text-xs md:text-sm font-semibold text-text-dark/90 leading-relaxed">
              {t('home.welcomeMessage')}
            </p>
          </div>
        </div>
      </section>

      {/* Circular Round Action Buttons Grid */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <h3 className="text-lg font-bold text-text-dark mb-4 px-1">{t('home.quickServices')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {mainActions.map((act) => (
            <Card
              key={act.id}
              onClick={act.action}
              padding="md"
              className="flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md transition-all active:scale-95 duration-200 border-2 border-border-light hover:border-primary-dark"
            >
              <div className={`w-16 h-16 ${act.bg} rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner border border-transparent`}>
                {act.emoji}
              </div>
              <span className="text-sm font-bold text-text-dark tracking-tight">
                {act.label}
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        <h3 className="text-lg font-bold text-text-dark mb-4 px-1">{t('home.comingSoon')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {upcomingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                padding="md"
                className="flex items-center gap-4 bg-white/70 border border-border-light hover:shadow-none"
              >
                <div className="bg-primary-light p-3 rounded-xl border border-primary-dark/20 text-text-dark">
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-text-dark text-sm">{feature.label}</h4>
                  <p className="text-xs text-text-light">{feature.description}</p>
                </div>
                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 py-1 px-2 rounded-full uppercase border border-gray-200">
                  {t('home.soon')}
                </span>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Legal Footer Links */}
      <footer className="max-w-4xl mx-auto px-4 pt-12 pb-6 text-center">
        <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-extrabold text-text-light border-t border-border-light pt-6 mb-4">
          <button onClick={() => navigate('/support')} className="hover:text-primary-dark transition-colors">
            {t('compliance.helpSupport')}
          </button>
          <span className="text-border-light">•</span>
          <button onClick={() => navigate('/privacy-policy')} className="hover:text-primary-dark transition-colors">
            {t('compliance.privacyPolicy')}
          </button>
          <span className="text-border-light">•</span>
          <button onClick={() => navigate('/terms')} className="hover:text-primary-dark transition-colors">
            {t('compliance.termsAndConditions')}
          </button>
        </div>
        <p className="text-[10px] text-text-light/60 font-bold uppercase tracking-wider">
          © 2026 MilkMaatu Dairy Tech Private Limited. All rights reserved.
        </p>
        <p className="text-[10px] text-text-light/60 font-bold uppercase tracking-wider mt-1">
          MilkMaatu is a product and brand of MilkMaatu Dairy Tech Private Limited.
        </p>
      </footer>
    </div>
  );
};


