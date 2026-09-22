import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { authApi } from '../services/api/authApi';
import { feedsApi } from '../services/api/feedsApi';
import { ShieldCheck, Truck, Users, HelpCircle, ChevronDown, ShoppingBag } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);
  const [feeds, setFeeds] = useState([]);
  const [upcomingOpen, setUpcomingOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(authApi.getCurrentUser());

    // Load feeds for the recommendation ticker
    feedsApi.getFeeds()
      .then(data => { if (Array.isArray(data)) setFeeds(data); })
      .catch(() => {}); // silent fail — ticker is non-critical
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

  // Duplicate feed list so the marquee loops seamlessly
  const tickerFeeds = feeds.length > 0 ? [...feeds, ...feeds] : [];

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

      {/* ── Recommended Feeds Ticker (above Quick Services) ─────────── */}
      {feeds.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pt-6 pb-2">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-lg font-bold text-text-dark">{t('home.recommendedFeeds')}</h3>
            <button
              onClick={() => navigate('/feeds')}
              className="text-xs font-bold text-primary-dark hover:underline flex items-center gap-1 transition-colors"
            >
              {t('home.viewAll')}
            </button>
          </div>

          {/* Ticker container — overflow-hidden prevents horizontal scroll */}
          <div className="overflow-hidden rounded-2xl border border-border-light bg-gradient-to-r from-amber-50 via-white to-amber-50 shadow-sm py-3">
            <div className="flex animate-marquee gap-4 px-4" style={{ width: 'max-content' }}>
              {tickerFeeds.map((feed, idx) => (
                <button
                  key={`${feed.id}-${idx}`}
                  onClick={() => navigate('/feeds')}
                  aria-label={feed.name}
                  className="flex-shrink-0 flex items-center gap-3 bg-white rounded-xl border border-amber-200/70 shadow-sm px-4 py-3 hover:shadow-md hover:border-primary-dark/40 active:scale-95 transition-all duration-200 w-52 text-left"
                >
                  {/* Feed image or emoji fallback */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-amber-100 border border-amber-200 flex-shrink-0">
                    {feed.image ? (
                      <img
                        src={feed.image}
                        alt={feed.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🌾</div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-text-dark truncate leading-tight">{feed.name}</p>
                    {feed.category && (
                      <p className="text-[10px] text-text-light font-semibold uppercase tracking-wider mt-0.5 truncate">{feed.category}</p>
                    )}
                    <p className="text-sm font-black text-primary-dark mt-1">₹{feed.price}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

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

      {/* ── Coming Soon — Collapsible ────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        {/* Collapsible heading */}
        <button
          onClick={() => setUpcomingOpen(prev => !prev)}
          aria-expanded={upcomingOpen}
          aria-controls="upcoming-features-panel"
          className="flex items-center justify-between w-full px-1 mb-4 group"
        >
          <h3 className="text-lg font-bold text-text-dark">{t('home.comingSoon')}</h3>
          <ChevronDown
            size={20}
            className={`text-text-light transition-transform duration-300 group-hover:text-primary-dark ${upcomingOpen ? 'rotate-0' : '-rotate-90'}`}
          />
        </button>

        {/* Collapsible content with smooth transition */}
        <div
          id="upcoming-features-panel"
          className={`grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-hidden transition-all duration-300 ${
            upcomingOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
        >
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

      {/* ── About MilkMaatu by Susheel (moved lower) ─────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pt-4 pb-2">
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
