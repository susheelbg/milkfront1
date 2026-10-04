import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components';
import { partnersApi } from '../services/api/partnersApi';
import { useTranslation } from '../i18n/useTranslation';
import { ProductImage, useLocalized, useAnimalLabel, useMilkRange } from '../components/PartnerProductCard';
import { Loader2, AlertTriangle, Milk, Info } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-border-light shadow-sm p-4 space-y-1.5">
    <h2 className="text-[11px] font-black uppercase tracking-wider text-text-light">{title}</h2>
    {children}
  </div>
);

/** Full product information, straight from MilkMaatu's database. */
export const PartnerProductDetailPage = () => {
  const { partnerId, productId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const pick = useLocalized();
  const animalLabel = useAnimalLabel();
  const rangeOf = useMilkRange();
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');

  const load = useCallback(() => {
    setState('loading');
    partnersApi.product(productId).then((d) => { setData(d); setState('ok'); }).catch(() => setState('error'));
  }, [productId]);
  useEffect(() => { load(); }, [load]);

  const p = data?.product;
  const partner = data?.partner;
  const nutrition = p?.nutrition_data || {};
  const form = nutrition.form ? (language === 'kn' ? nutrition.form.kn || nutrition.form.en : nutrition.form.en) : null;
  const rows = Object.entries(nutrition).filter(([k, v]) => k !== 'form' && v && typeof v === 'object' && v.value !== undefined);

  // Values (numbers, units, %) are never translated — only the label and min/max word are.
  const nutrientLabel = (key) => {
    const tr = t(`partners.nutrient.${key}`);
    return typeof tr === 'string' ? tr : key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };
  const nutrientValue = (v) => `${v.value}${v.unit ? (v.unit === '%' ? '%' : ` ${v.unit}`) : ''}`;

  const use = p && pick(p, 'recommended_use');
  const feeding = p && pick(p, 'feeding_instructions');
  const description = p && pick(p, 'description');
  const animal = p && animalLabel(p.animal_type);
  const range = p && rangeOf(p);

  return (
    <div className="min-h-screen bg-bg-light pb-20">
      <Header showBack onBack={() => navigate(`/partners/${partnerId}`)} />
      <section className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {state === 'loading' && <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary-dark" /></div>}
        {state === 'error' && (
          <div className="bg-white rounded-2xl border border-border-light p-6 text-center space-y-3">
            <AlertTriangle className="mx-auto text-amber-500" />
            <p className="text-sm text-text-light">{t('partners.loadError')}</p>
            <button onClick={load} className="text-xs font-bold text-primary-dark underline">{t('partners.retry')}</button>
          </div>
        )}
        {state === 'ok' && p && (
          <>
            <ProductImage src={p.image_url} alt={p.name} iconSize={56} className="w-full h-60 rounded-2xl border border-border-light shadow-sm" />

            <div>
              <h1 className="text-2xl font-black text-text-dark break-words">{p.name}</h1>
              <p className="text-sm font-semibold text-text-light">{t('partners.manufacturedBy')} {partner?.name || p.brand}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {animal && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3">
                  <p className="text-[10px] font-black uppercase text-emerald-800/70">{t('partners.suitableFor')}</p>
                  <p className="text-sm font-black text-emerald-900 mt-0.5 break-words">🐄 {animal}</p>
                </div>
              )}
              {range && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                  <p className="text-[10px] font-black uppercase text-amber-800/70">{t('partners.milkProduction')}</p>
                  <p className="text-sm font-black text-amber-900 mt-0.5 flex items-start gap-1">
                    <Milk size={14} className="mt-0.5 shrink-0" /><span className="break-words">{range}</span>
                  </p>
                </div>
              )}
            </div>

            {description && <Section title={t('partners.about')}><p className="text-sm text-text-dark break-words">{description}</p></Section>}

            <Section title={t('partners.recommendedUse')}>
              <p className={`text-sm break-words ${use ? 'text-text-dark' : 'text-text-light italic'}`}>{use || t('partners.notProvided')}</p>
            </Section>

            <Section title={t('partners.feeding')}>
              <p className={`text-sm break-words ${feeding ? 'text-text-dark' : 'text-text-light italic'}`}>{feeding || t('partners.notProvided')}</p>
            </Section>

            {(rows.length > 0 || form) && (
              <Section title={t('partners.nutrition')}>
                <div className="divide-y divide-border-light">
                  {form && (
                    <div className="flex justify-between gap-3 py-2 text-sm">
                      <span className="text-text-light font-semibold">{t('partners.form')}</span>
                      <span className="font-black text-text-dark text-right break-words">{form}</span>
                    </div>
                  )}
                  {rows.map(([key, v]) => (
                    <div key={key} className="flex justify-between gap-3 py-2 text-sm">
                      <span className="text-text-light font-semibold">
                        {nutrientLabel(key)}{v.limit ? ` (${t(`partners.${v.limit}`)})` : ''}
                      </span>
                      <span className="font-black text-text-dark text-right">{nutrientValue(v)}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <div className="flex gap-2 items-start text-[11px] text-text-light px-1">
              <Info size={14} className="shrink-0 mt-0.5" />
              <p>{t('partners.disclaimer')}</p>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
export default PartnerProductDetailPage;
