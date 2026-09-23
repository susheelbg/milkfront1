import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components';
import { newsApi } from '../services/api/newsApi';
import { Loader2, AlertTriangle, Newspaper, ExternalLink, Bell } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'ಎಲ್ಲಾ' },
  { key: 'cattle_health', label: 'ಹಸುಗಳ ಆರೋಗ್ಯ' },
  { key: 'cattle_feed', label: 'ಪಶು ಆಹಾರ' },
  { key: 'milk_price', label: 'ಹಾಲಿನ ಬೆಲೆ' },
  { key: 'milk_production', label: 'ಹಾಲು ಉತ್ಪಾದನೆ' },
  { key: 'government_scheme', label: 'ಸರ್ಕಾರಿ ಯೋಜನೆ' },
  { key: 'vaccination', label: 'ಲಸಿಕೆ' },
  { key: 'disease_alert', label: 'ರೋಗ ಎಚ್ಚರಿಕೆ' },
  { key: 'dairy_business', label: 'ಡೈರಿ ವ್ಯಾಪಾರ' },
  { key: 'dairy_technology', label: 'ತಂತ್ರಜ್ಞಾನ' },
  { key: 'weather_advisory', label: 'ಹವಾಮಾನ' },
  { key: 'farmer_advisory', label: 'ರೈತ ಸಲಹೆ' },
  { key: 'general_dairy', label: 'ಹೈನುಗಾರಿಕೆ' },
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('kn-IN', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return '';
  }
}

function NewsCard({ article }) {
  return (
    <div className="bg-white rounded-xl border border-border-light shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      {/* Alert badge */}
      {article.is_alert && (
        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full w-fit">
          <Bell size={9} /> ಮಹತ್ವದ ಸಂದೇಶ
        </span>
      )}

      {/* Category badge */}
      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full w-fit">
        {article.category_kn}
      </span>

      {/* Original Kannada headline */}
      <h3 className="text-sm font-extrabold text-text-dark leading-snug flex-1">
        {article.kannada_title}
      </h3>

      {/* Source + date */}
      <div className="flex items-center justify-between pt-2 border-t border-border-light">
        <div>
          <p className="text-[10px] font-bold text-text-light uppercase tracking-wider">
            {article.source_name}
          </p>
          {article.published_at && (
            <p className="text-[10px] text-text-light/70">{formatDate(article.published_at)}</p>
          )}
        </div>
        {/* Direct link to original publisher */}
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary-dark bg-primary-light px-3 py-1.5 rounded-lg border border-primary-dark/20 hover:bg-primary/30 active:scale-95 transition-all"
        >
          ಸಂಪೂರ್ಣ ಸುದ್ದಿ ಓದಿ <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

export const DairyNewsPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (cat, pg) => {
    setLoading(true);
    setError(false);
    try {
      const data = await newsApi.getAll({ category: cat, page: pg, limit: 12 });
      setArticles(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(category, page); }, [category, page, load]);

  const handleCategory = (cat) => { setCategory(cat); setPage(1); };
  const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen bg-bg-light pb-28">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page header */}
      <section className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border-b border-border-light py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <Newspaper className="text-amber-600" size={24} />
            <h1 className="text-2xl font-extrabold text-text-dark">📰 ರೈತರ ಸುದ್ದಿ</h1>
          </div>
          <p className="text-xs text-text-light font-semibold">
            ರೈತರಿಗೆ ಉಪಯುಕ್ತವಾದ ಇತ್ತೀಚಿನ ಸುದ್ದಿ • ಮೂಲ ತಾಣಕ್ಕೆ ನೇರ ಲಿಂಕ್
          </p>
        </div>
      </section>

      {/* Category filter tabs */}
      <section className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategory(cat.key)}
              className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-200 ${
                category === cat.key
                  ? 'bg-primary-dark text-white border-primary-dark shadow-sm'
                  : 'bg-white text-text-light border-border-light hover:border-primary-dark hover:text-primary-dark'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* News grid */}
      <section className="max-w-4xl mx-auto px-4 pb-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-light">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-3" />
            <p className="text-sm font-semibold">ಸುದ್ದಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white border border-border-light rounded-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-text-dark font-bold text-sm">ಸುದ್ದಿಗಳನ್ನು ಈಗ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ.</p>
            <p className="text-text-light text-xs mt-1">ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 bg-white border border-border-light rounded-2xl">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-text-dark font-bold text-sm">
              ಈಗ ಯಾವುದೇ ಹೊಸ ಹೈನುಗಾರಿಕೆ ಸುದ್ದಿಗಳು ಲಭ್ಯವಿಲ್ಲ.
            </p>
            <p className="text-xs text-text-light mt-1">ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-bold bg-white border border-border-light rounded-xl hover:border-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ← ಹಿಂದೆ
                </button>
                <span className="text-sm font-bold text-text-light">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-bold bg-white border border-border-light rounded-xl hover:border-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ಮುಂದೆ →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
