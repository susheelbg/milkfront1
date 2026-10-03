import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components';
import { partnersApi } from '../services/api/partnersApi';
import { useTranslation } from '../i18n/useTranslation';
import { PartnerProductCard, useLocalized } from '../components/PartnerProductCard';
import { PartnerLogo } from './PartnersPage';
import { Loader2, AlertTriangle } from 'lucide-react';

/** A partner's product catalog (e.g. Cargill). Reads only MilkMaatu's database. */
export const PartnerProductsPage = () => {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pick = useLocalized();
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');

  const load = useCallback(() => {
    setState('loading');
    partnersApi.products(partnerId).then((d) => { setData(d); setState('ok'); }).catch(() => setState('error'));
  }, [partnerId]);
  useEffect(() => { load(); }, [load]);

  const partner = data?.partner;
  const products = data?.products || [];

  return (
    <div className="min-h-screen bg-bg-light pb-20">
      <Header showBack onBack={() => navigate('/partners')} />
      <section className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {state === 'loading' && <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary-dark" /></div>}
        {state === 'error' && (
          <div className="bg-white rounded-2xl border border-border-light p-6 text-center space-y-3">
            <AlertTriangle className="mx-auto text-amber-500" />
            <p className="text-sm text-text-light">{t('partners.loadError')}</p>
            <button onClick={load} className="text-xs font-bold text-primary-dark underline">{t('partners.retry')}</button>
          </div>
        )}
        {state === 'ok' && partner && (
          <>
            <div className="flex items-center gap-3">
              <PartnerLogo partner={partner} size="w-14 h-14" />
              <div className="min-w-0">
                <h1 className="text-xl font-black text-text-dark">{partner.name}</h1>
                <p className="text-xs font-semibold text-text-light break-words">{pick(partner, 'tagline')}</p>
              </div>
            </div>
            {products.length === 0 ? (
              <p className="text-sm text-text-light text-center py-10">{t('partners.noProducts')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <PartnerProductCard key={p.id} product={p} onOpen={(prod) => navigate(`/partners/${partnerId}/products/${prod.id}`)} />
                ))}
              </div>
            )}
            <p className="text-[11px] text-text-light text-center px-4">{t('partners.disclaimer')}</p>
          </>
        )}
      </section>
    </div>
  );
};
export default PartnerProductsPage;
