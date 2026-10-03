import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components';
import { partnersApi } from '../services/api/partnersApi';
import { useTranslation } from '../i18n/useTranslation';
import { useLocalized } from '../components/PartnerProductCard';
import { Building2, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';

export const PartnerLogo = ({ partner, size = 'w-12 h-12', className = '' }) =>
  partner?.logo_url ? (
    <div className={`${size} rounded-xl bg-white border border-border-light flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden ${className}`}>
      <img
        src={partner.logo_url}
        alt={partner.name || 'Partner Logo'}
        className="w-full h-full object-contain object-center"
        loading="lazy"
      />
    </div>
  ) : (
    <div className={`${size} rounded-xl bg-gradient-to-br from-[#0A2E1F] to-[#14532D] text-amber-300 flex items-center justify-center font-black text-lg shadow-xs shrink-0 ${className}`}>
      {partner?.name?.charAt(0)?.toUpperCase() || 'P'}
    </div>
  );

/** All partners — generic list, nothing here is Cargill-specific. */
export const PartnersPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pick = useLocalized();
  const [partners, setPartners] = useState([]);
  const [state, setState] = useState('loading');

  const load = useCallback(() => {
    setState('loading');
    partnersApi.list().then((d) => { setPartners(d); setState('ok'); }).catch(() => setState('error'));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-bg-light pb-20">
      <Header showBack onBack={() => navigate('/home')} />
      <section className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-black text-text-dark flex items-center gap-2">
          <Building2 size={22} className="text-amber-600" /> {t('partners.title')}
        </h1>
        {state === 'loading' && <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary-dark" /></div>}
        {state === 'error' && (
          <div className="bg-white rounded-2xl border border-border-light p-6 text-center space-y-3">
            <AlertTriangle className="mx-auto text-amber-500" />
            <p className="text-sm text-text-light">{t('partners.loadError')}</p>
            <button onClick={load} className="text-xs font-bold text-primary-dark underline">{t('partners.retry')}</button>
          </div>
        )}
        {state === 'ok' && partners.length === 0 && <p className="text-sm text-text-light text-center py-10">{t('partners.noPartners')}</p>}
        {state === 'ok' && partners.map((p) => (
          <button
            key={p.id}
            id={`partner-card-${p.id}`}
            onClick={() => navigate(`/partners/${p.id}`)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl border border-border-light shadow-sm p-4 text-left hover:shadow-md hover:border-amber-300 transition-all group"
          >
            <PartnerLogo partner={p} />
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-text-dark">{p.name}</h2>
              <p className="text-xs text-text-light break-words">{pick(p, 'tagline')}</p>
              <p className="text-[11px] font-bold text-primary-dark mt-0.5">{p.product_count} {t('partners.productsCount')}</p>
            </div>
            <ChevronRight size={18} className="text-text-light group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </section>
    </div>
  );
};
export default PartnersPage;
