import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Button, Card } from '../components';
import { aiApi } from '../services/api/aiApi';
import { Send, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { toastService } from '../services/toastService';
import { useTranslation } from '../i18n/useTranslation';

export const NandiniAIPage = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize and translate welcome message on language change
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: t('nandini.emptyChat'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [language]);

  const suggestions = [
    t('nandini.sug1'),
    t('nandini.sug2'),
    t('nandini.sug3'),
    t('nandini.sug4'),
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const data = await aiApi.askNandini(text.trim(), language);
      
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      toastService.error(err.message || t('common.error'));
      const errorMsg = {
        id: `error-${Date.now()}`,
        sender: 'bot',
        text: t('nandini.errorMsg') || 'Sorry, failed to get a response.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-bg-light pb-12 flex flex-col">
      <Header showBack onBack={() => navigate('/home')} />

      {/* Page Header banner */}
      <section className="bg-primary py-6 px-4 border-b border-primary-dark/20 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-text-dark flex items-center gap-2">
              🧠✨ {t('nandini.title')}
            </h1>
            <p className="text-text-dark/95 text-xs md:text-sm font-bold mt-1">
              {t('nandini.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/70 text-text-dark px-3 py-1 rounded-full border border-border-light shadow-xs flex items-center gap-1.5">
              <Sparkles size={10} className="text-amber-500" /> Live Assistant
            </span>
          </div>
        </div>
      </section>

      {/* Main chat window container */}
      <section className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col">
        <div className="bg-white border border-border-light rounded-2xl shadow-md overflow-hidden flex flex-col flex-1 min-h-[500px]">
          
          {/* Top banner warning */}
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-start gap-2.5">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-[11px] md:text-xs text-amber-800 font-semibold leading-relaxed">
              {t('compliance.aiDisclaimer')}
            </p>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-primary text-text-dark font-semibold rounded-tr-none'
                      : msg.isError 
                        ? 'bg-red-50 text-red-800 border border-red-100 rounded-tl-none'
                        : 'bg-white text-text-dark border border-border-light rounded-tl-none'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">🧠 {t('nandini.title')}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[9px] text-text-light font-medium mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-text-light bg-white border border-border-light rounded-xl px-4 py-3 shadow-xs self-start max-w-[200px] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-primary-dark" />
                <span className="text-xs font-semibold">{t('nandini.thinking') || 'Thinking...'}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions block */}
          {messages.length === 1 && !loading && (
            <div className="px-4 py-3 border-t border-border-light bg-white">
              <p className="text-xs text-text-light font-bold mb-2">{t('nandini.startWith')}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sug)}
                    className="text-xs font-semibold text-text-dark bg-primary-light hover:bg-primary-dark/30 border border-primary-dark/20 px-3 py-1.5 rounded-full transition-all active:scale-95 text-left"
                  >
                    💡 {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input text-bar */}
          <div className="p-4 border-t border-border-light bg-white flex items-center gap-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('nandini.placeholder')}
              className="flex-1 text-sm bg-bg-light border border-border-light focus:border-primary-dark outline-none rounded-xl px-4 py-3.5 transition-all text-text-dark font-medium placeholder-text-light/70 shadow-inner"
              disabled={loading}
            />
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleSend()}
              className="h-12 w-12 rounded-xl flex items-center justify-center p-0 shadow-md active:scale-95 shrink-0"
              disabled={loading || !inputText.trim()}
            >
              <Send size={18} />
            </Button>
          </div>

        </div>
      </section>
    </div>
  );
};
