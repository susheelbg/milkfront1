import React, { useState } from 'react';
import { LOGO_URL_NAV, LOGO_URL, BRAND_FALLBACK } from '../services/branding';

/**
 * MilkMaatu Logo Component
 * Renders the official brand logo with:
 *  - Cloudinary CDN delivery (optimised per use-case)
 *  - Graceful text fallback ("Milkಮಾತು") if image fails
 *  - Responsive via className props
 */
export const Logo = ({
  size = 'nav',       // 'nav' | 'full'
  className = '',
  imgClassName = '',
  fallbackClassName = '',
  alt = 'MilkMaatu',
  onClick = null,
  style = {},
}) => {
  const [imgError, setImgError] = useState(false);

  const src = size === 'full' ? LOGO_URL : LOGO_URL_NAV;

  if (imgError) {
    return (
      <span
        className={`font-black tracking-tight text-text-dark ${fallbackClassName} ${className}`}
        style={style}
        onClick={onClick}
      >
        {BRAND_FALLBACK}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain select-none ${imgClassName} ${className}`}
      style={style}
      onError={() => setImgError(true)}
      onClick={onClick}
      draggable={false}
      loading="eager"
    />
  );
};
