import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { authApi } from '../services/api/authApi';
import { ShieldCheck, Heart, Truck, Users, HelpCircle, FileText, Bot, Store, Leaf } from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(authApi.getCurrentUser());
  }, []);

  const upcomingFeatures = [
    { icon: ShieldCheck, label: 'Insurance', description: 'Cattle & farm protection policy' },
    { icon: Truck, label: 'Vet Visit', description: 'Schedule home vet visits' },
    { icon: Users, label: 'Doctor Near Me', description: 'Find nearest veterinary clinic' },
    { icon: HelpCircle, label: 'Expert Advice', description: 'One-on-one expert consultations' },
  ];

  const mainActions = [
    {
      id: 'feeds',
      label: 'Buy Feeds',
      emoji: '🌾',
      bg: 'bg-amber-100',
      border: 'border-amber-200',
      action: () => navigate('/feeds'),
    },
    {
      id: 'sante',
      label: 'Sante',
      emoji: '🐄',
      bg: 'bg-emerald-100',
      border: 'border-emerald-200',
      action: () => navigate('/sante'),
    },
    {
      id: 'ocr',
      label: 'OCR Extract',
      emoji: '📄',
      bg: 'bg-sky-100',
      border: 'border-sky-200',
      action: () => {
        alert('OCR Feature is opening camera. Direct scanner integration is preparing...');
      },
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      emoji: '🤖',
      bg: 'bg-indigo-100',
      border: 'border-indigo-200',
      action: () => {
        alert('AI Assistant: "Namaste! I am your smart cattle guide. How can I help you today?"');
      },
    },
  ];

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header />

      {/* Welcome Title */}
      <section className="bg-white border-b border-border-light py-5 px-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-text-light font-bold uppercase tracking-wider">Namaste</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-text-dark">
            Welcome, {currentUser?.name || 'Farmer'}
          </h2>
        </div>
      </section>

      {/* Top Banner Card */}
      <section className="max-w-4xl mx-auto px-4 pt-6">
        <div className="bg-gradient-to-r from-primary-light via-primary/30 to-amber-100 rounded-2xl border border-primary-dark/30 p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 shadow-sm overflow-hidden relative">
          <div className="flex-1 space-y-2.5">
            <p className="text-xs md:text-sm font-semibold text-text-dark leading-relaxed">
              MilkMaatu is built to help farmers get heavy cattle feed delivered directly from manufacturers to their doorstep, track milk production data, and easily buy or sell cattle through a trusted local platform.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold bg-white text-text-dark py-1 px-2.5 rounded-full border border-primary-dark/40 shadow-xs">
                Built by Susheel
              </span>
            </div>
          </div>
          {/* Avatar Placeholder Area */}
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/70 border border-primary-dark/30 rounded-xl flex items-center justify-center text-3xl select-none flex-shrink-0 shadow-inner">
            🧑‍🌾
          </div>
        </div>
      </section>

      {/* Circular Round Action Buttons Grid */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <h3 className="text-lg font-bold text-text-dark mb-4 px-1">Quick Services</h3>
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
        <h3 className="text-lg font-bold text-text-dark mb-4 px-1">Coming Soon Features</h3>
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
                  Soon
                </span>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Info Stats Banner */}
      <section className="max-w-4xl mx-auto px-4 pt-8">
        <div className="bg-white border border-border-light rounded-xl py-6 px-4">
          <div className="grid grid-cols-3 gap-4 text-center divide-x divide-border-light">
            <div>
              <div className="text-xl md:text-2xl font-black text-text-dark">1000+</div>
              <p className="text-[10px] md:text-xs text-text-light font-bold uppercase mt-1">Active Farmers</p>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-black text-text-dark">500+</div>
              <p className="text-[10px] md:text-xs text-text-light font-bold uppercase mt-1">Transactions</p>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-black text-text-dark">24/7</div>
              <p className="text-[10px] md:text-xs text-text-light font-bold uppercase mt-1">Support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

