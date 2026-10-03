import React from 'react';
import { Package, Milk, ChevronRight } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

/** Pick the Kannada value when the app is in Kannada (fallback to English), else English. */
export const useLocalized = () => {
  const { language } = useTranslation();
  return (obj, base) => {
    if (!obj) return null;
    if (language === 'kn') return obj[`${base}_kn`] || obj[`${base}_en`] || null;
    return obj[`${base}_en`] || null;
  };
};

/** Animal type: translated if it is a known code, otherwise shown as stored. */
export const useAnimalLabel = () => {
  const { t } = useTranslation();
  return (code) => {
    if (!code) return null;
    const tr = t(`partners.animal.${code}`);
    return tr && typeof tr === 'string' ? tr : code;
  };
};

/** Milk range is language-neutral data; Kannada variant is used when present. */
export const useMilkRange = () => {
  const { language } = useTranslation();
  return (p) => (language === 'kn' && p.milk_production_range_kn) || p.milk_production_range || null;
};

/** Product image from Supabase Storage, or a branded placeholder while approval is pending. */
export const ProductImage = ({ src, alt, className = '', iconSize = 40 }) => {
  const { t } = useTranslation();
  if (src) {
    return (
      <div className={`bg-white flex items-center justify-center overflow-hidden ${className}`}>
        <img src={src} alt={alt} loading="lazy" className="w-full h-full object-contain" />
      </div>
    );
  }
  return (
    <div className={`bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex flex-col items-center justify-center gap-1.5 text-primary-dark/60 ${className}`}>
      <Package size={iconSize} strokeWidth={1.5} />
      <span className="text-[10px] font-bold uppercase tracking-wide">{t('partners.imagePending')}</span>
    </div>
  );
};

export const PartnerProductCard = ({ product, onOpen }) => {
  const { t } = useTranslation();
  const animal = useAnimalLabel()(product.animal_type);
  const range = useMilkRange()(product);

  return (
    <button
      type="button"
      id={`partner-product-card-${product.id}`}
      onClick={() => onOpen(product)}
      className="w-full text-left bg-white rounded-2xl border border-border-light shadow-sm hover:shadow-md hover:border-amber-300 active:scale-[0.99] transition-all overflow-hidden group"
    >
      <ProductImage src={product.image_url} alt={product.name} className="h-36 w-full border-b border-border-light" />
      <div className="p-3.5 space-y-2">
        <div>
          <h3 className="text-base font-black text-text-dark break-words">{product.name}</h3>
          {product.brand && <p className="text-xs font-semibold text-text-light">{product.brand}</p>}
        </div>
        <div className="space-y-1">
          {animal && (
            <p className="text-xs font-bold text-text-dark flex items-center gap-1.5">
              <span aria-hidden>🐄</span><span className="break-words">{animal}</span>
            </p>
          )}
          {range && (
            <p className="text-xs font-bold text-text-dark flex items-start gap-1.5">
              <Milk size={13} className="text-primary-dark mt-0.5 shrink-0" /><span className="break-words">{range}</span>
            </p>
          )}
        </div>
        <div className="pt-1 flex items-center justify-between text-xs font-extrabold text-primary-dark group-hover:text-amber-700 transition-colors">
          <span>{t('partners.viewDetails')}</span>
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
};
