import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { cattleApi } from '../services/api/cattleApi';
import { reportApi } from '../services/api/reportApi';
import { Search, Filter, Phone, Calendar, Loader2, Clock, ShieldAlert } from 'lucide-react';
import { toastService } from '../services/toastService';
import { useTranslation } from '../i18n/useTranslation';

const CattleCountdown = ({ expiresAt }) => {
  const { t } = useTranslation();
  const calculateTimeLeft = () => {
    const difference = +new Date(expiresAt) - +new Date();
    let timeLeft = { hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const pad = (num) => String(num).padStart(2, '0');
  const totalSeconds = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  const isCritical = totalSeconds < 3600 * 3; // Highlight in red/pulse if less than 3 hours left

  return (
    <div className={`absolute top-3 left-3 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-md backdrop-blur-md transition-all ${
      isCritical 
        ? 'bg-red-600/90 text-white border-red-500 animate-pulse' 
        : 'bg-black/75 text-white border-white/20'
    }`}>
      <Clock size={11} className={isCritical ? 'text-white' : 'text-primary'} />
      <span>
        {t('sante.deletesIn') || "Deletes in"}: {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m
      </span>
    </div>
  );
};

export const SanteBuyPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const santeName = 'Sante';

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 150000 });
  const [showFilter, setShowFilter] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCattleId, setReportingCattleId] = useState(null);
  const [reportReason, setReportReason] = useState('spam');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {

    const fetchPosts = async () => {
      setLoading(true);
      try {
        const data = await cattleApi.getCattleListings(santeName);
        setPosts(data);
      } catch (err) {
        toastService.error('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [santeName, navigate]);

  // Filter posts dynamically in client
  const filteredPosts = useMemo(() => {
    let filtered = [...posts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        post =>
          post.animalName.toLowerCase().includes(query) ||
          post.villageName.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query)
      );
    }

    filtered = filtered.filter(
      post => post.price >= priceRange.min && post.price <= priceRange.max
    );

    return filtered;
  }, [posts, searchQuery, priceRange]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportingCattleId) return;

    setSubmittingReport(true);
    try {
      await reportApi.reportListing(reportingCattleId, reportReason);
      toastService.success(t('compliance.reportSuccess') || 'Listing reported successfully.');
      setShowReportModal(false);
      setReportingCattleId(null);
      setReportReason('spam');
    } catch (err) {
      toastService.error(err.message || 'Failed to file report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  if (!santeName) return null;

  return (
    <div className="min-h-screen bg-bg-light pb-12">
      <Header showBack onBack={() => navigate('/sante')} />

      {/* Page Header */}
      <section className="bg-primary py-8 px-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-text-dark mb-1">{t('sante.buyCattle')}</h1>
            <p className="text-text-dark opacity-90">{santeName}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/sante-sell', { state: { santeName } })}
          >
            + {t('sante.sellCattle')}
          </Button>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white border-b border-border-light sticky top-14 z-30 py-4 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-3 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3.5 top-3.5 text-text-light" />
              <input
                type="text"
                placeholder={t('sante.searchCattle')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-border-light focus:border-primary focus:outline-none text-sm transition-all"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                showFilter
                  ? 'bg-text-dark text-white border-text-dark'
                  : 'bg-white text-text-dark border-border-light hover:border-text-dark'
              }`}
            >
              <Filter size={16} />
              Filter
            </button>
          </div>

          {/* Filter Panel */}
          {showFilter && (
            <div className="mt-4 p-4 bg-bg-light rounded-xl border border-border-light animate-slide-up">
              <h4 className="text-xs font-bold text-text-light uppercase tracking-wider mb-3">{t('admin.price') || 'Price'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-sm text-text-dark font-bold mb-1.5">
                    <span>Min Price</span>
                    <span>₹{priceRange.min.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150000"
                    step="5000"
                    value={priceRange.min}
                    onChange={(e) =>
                      setPriceRange(prev => ({
                        ...prev,
                        min: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-primary-dark"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-text-dark font-bold mb-1.5">
                    <span>Max Price</span>
                    <span>₹{priceRange.max.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="150000"
                    step="5000"
                    value={priceRange.max}
                    onChange={(e) =>
                      setPriceRange(prev => ({
                        ...prev,
                        max: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-primary-dark"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Posts Grid */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-light">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="font-semibold text-sm">{t('common.loading')}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-border-light rounded-2xl p-6">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-text-dark mb-2">{t('sante.noCattle')}</h2>
            <p className="text-text-light text-sm mb-6">
              Try adjusting your filters.
            </p>
            <Button variant="primary" onClick={() => { setSearchQuery(''); setPriceRange({ min: 0, max: 150000 }); }}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <Card key={post.id} padding="0" hover className="overflow-hidden flex flex-col border border-border-light">
                {/* Image */}
                <div className="relative aspect-[16/9] w-full bg-gray-100 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.animalName}
                    className="w-full h-full object-cover"
                  />
                  <CattleCountdown expiresAt={post.expiresAt} />
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-lg font-black text-text-dark">
                      {post.animalName}
                    </h3>
                    <span className="bg-primary-light text-text-dark px-2.5 py-1 rounded-lg text-xs font-bold border border-primary-dark/20">
                      {post.age} {t('sante.years')}
                    </span>
                  </div>

                  <p className="text-text-light text-xs font-bold uppercase mb-3 tracking-wide">{post.villageName}</p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-bg-light p-2.5 rounded-lg border border-border-light text-center">
                      <p className="text-text-light text-[10px] font-bold uppercase">{t('sante.milkYield')}</p>
                      <p className="font-extrabold text-sm text-text-dark">{post.milkCapacity}</p>
                    </div>
                    <div className="bg-primary-light/40 p-2.5 rounded-lg border border-primary-dark/10 text-center">
                      <p className="text-text-light text-[10px] font-bold uppercase">{t('feeds.price')}</p>
                      <p className="font-extrabold text-sm text-primary-dark">₹{post.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <p className="text-text-light text-sm mb-5 flex-1 line-clamp-3 italic">
                    "{post.description}"
                  </p>

                  {/* Contact Button */}
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => {
                      alert(
                        `📞 ${t('sante.seller')}\n\nName: Seller at ${post.villageName}\nPhone: ${post.contactNumber}`
                      );
                    }}
                  >
                    <Phone size={16} />
                    {t('sante.callSeller')} ({post.contactNumber})
                  </Button>

                  {/* Compliance Report Listing Button */}
                  <button
                    onClick={() => {
                      setReportingCattleId(post.id);
                      setShowReportModal(true);
                    }}
                    className="mt-3 text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center justify-center gap-1 mx-auto underline"
                  >
                    <ShieldAlert size={14} />
                    {t('compliance.reportListing')}
                  </button>

                  {/* Posted Date */}
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-text-light text-[10px] font-bold uppercase">
                    <Calendar size={12} />
                    <span>{t('sante.posted')}: {new Date(post.postedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Info Banner */}
      <section className="max-w-6xl mx-auto px-4 mt-4">
        <div className="bg-yellow-50 border-2 border-yellow-100 rounded-xl py-4 px-4 text-center">
          <p className="text-text-dark text-xs font-semibold">
            📌 {t('sante.days24Hours')}
          </p>
        </div>
      </section>
      {/* Report Listing Modal Dialog */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-sm border border-border-light shadow-2xl animate-scale-up" padding="lg">
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-lg font-bold text-text-dark">
                  {t('compliance.reportListing')}
                </h3>
                <p className="text-xs text-text-light mt-1">
                  {t('compliance.selectReason')}
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { value: 'spam', label: t('compliance.spam') || 'Spam' },
                  { value: 'fake', label: t('compliance.fake') || 'Fake Listing' },
                  { value: 'offensive', label: t('compliance.offensive') || 'Offensive' },
                  { value: 'fraud', label: t('compliance.fraud') || 'Fraud / Scam' }
                ].map((reason) => (
                  <label key={reason.value} className="flex items-center gap-2.5 p-3 rounded-lg border border-border-light hover:bg-bg-light cursor-pointer select-none text-xs font-bold text-text-dark">
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.value}
                      checked={reportReason === reason.value}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary"
                    />
                    <span>{reason.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1 bg-red-500 hover:bg-red-600 border-red-500 text-white font-bold text-xs"
                  disabled={submittingReport}
                >
                  {submittingReport ? t('common.loading') : t('compliance.reportBtn')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="flex-1 font-bold text-xs"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportingCattleId(null);
                    setReportReason('spam');
                  }}
                  disabled={submittingReport}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
