import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader2, MessageCircle, Mic, Pause, Play, Send, Square, Trash2, X } from 'lucide-react';
import { Button, Card, Header } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import { supabase } from '../lib/supabase';
import { chatApi } from '../services/api/chatApi';
import { toastService } from '../services/toastService';

const PAGE_SIZE = 30;
const MAX_VOICE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_RECORDING_MS = 90_000;

const formatDuration = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;

const UserAvatar = ({ name, url, size = 'md' }) => (
  <div className={`shrink-0 overflow-hidden rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-extrabold ${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}`}>
    {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : (name || 'M').trim().charAt(0).toUpperCase()}
  </div>
);

const VoicePlayer = ({ path, t }) => {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    let active = true;
    supabase.storage.from('chat-voice').createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.signedUrl) setFailed(true);
        else setUrl(data.signedUrl);
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [path]);

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  }, []);

  const togglePlayback = async () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  if (failed) return <p className="text-xs text-red-700">{t('chat.failedToUpload')}</p>;
  if (!url) return <span className="inline-flex items-center gap-2 text-xs text-text-light"><Loader2 size={14} className="animate-spin" />{t('common.loading')}</span>;

  return (
    <div className="flex w-full max-w-xs items-center gap-2">
      <button
        type="button"
        onClick={togglePlayback}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white shadow-sm"
        aria-label={isPlaying ? t('common.pause') || 'Pause' : t('common.play') || 'Play'}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
          <div
            className="h-full rounded-full bg-emerald-700 transition-all duration-150"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] text-text-light">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
      <audio
        ref={audioRef}
        preload="none"
        controlsList="nodownload noplaybackrate nofullscreen"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(event) => setDuration(event.target.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.target.currentTime || 0)}
        src={url}
        className="hidden"
      />
    </div>
  );
};

const ChatImageMessage = ({ path, onOpen }) => {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!path) return undefined;
    supabase.storage.from('chat-images').createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.signedUrl) setFailed(true);
        else setUrl(data.signedUrl);
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [path]);

  if (failed) return <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">Image unavailable</div>;
  if (!url) return <div className="flex h-40 w-52 items-center justify-center rounded-xl bg-emerald-50 text-xs text-text-light"><Loader2 size={16} className="animate-spin" /></div>;

  return (
    <button type="button" onClick={() => onOpen(url)} className="block overflow-hidden rounded-xl border border-emerald-100 bg-white">
      <img src={url} alt="Shared chat photo" className="max-h-64 w-full max-w-xs object-cover" />
    </button>
  );
};

export const CommunityChatPage = () => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [expandedImage, setExpandedImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [viewportBounds, setViewportBounds] = useState(() => ({
    height: window.visualViewport?.height || window.innerHeight,
    top: window.visualViewport?.offsetTop || 0,
  }));
  const imageInputRef = useRef(null);
  const scrollRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingStartedRef = useRef(0);
  const maxDurationTimeoutRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const recordPressActiveRef = useRef(false);
  const loadingOlderRef = useRef(false);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    const updateViewportBounds = () => {
      setViewportBounds({
        height: visualViewport?.height || window.innerHeight,
        top: visualViewport?.offsetTop || 0,
      });
    };

    visualViewport?.addEventListener('resize', updateViewportBounds);
    visualViewport?.addEventListener('scroll', updateViewportBounds);
    window.addEventListener('resize', updateViewportBounds);
    updateViewportBounds();

    return () => {
      visualViewport?.removeEventListener('resize', updateViewportBounds);
      visualViewport?.removeEventListener('scroll', updateViewportBounds);
      window.removeEventListener('resize', updateViewportBounds);
    };
  }, []);

  const refreshNewest = useCallback(async () => {
    const response = await chatApi.getMessages({ limit: PAGE_SIZE });
    const page = response?.items ? response : response?.data;
    if (page?.items) {
      setMessages(current => {
        const newestIds = new Set(page.items.map(item => item.id));
        return [...page.items, ...current.filter(item => !newestIds.has(item.id))];
      });
      setHasMore(page.has_more);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return undefined;
    if (!isAuthenticated || !user?.id) {
      navigate('/login', { replace: true, state: { from: { pathname: '/chat' } } });
      return undefined;
    }

    let active = true;
    const loadInitial = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await chatApi.getMessages({ limit: PAGE_SIZE });
        if (!active) return;
        const page = response?.items ? response : response?.data;
        setMessages(page?.items || []);
        setHasMore(Boolean(page?.has_more));
      } catch {
        if (active) setError(t('chat.loadFailed'));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadInitial();
    const channel = supabase
      .channel('milkmaatu-community-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, payload => {
        if (payload.eventType === 'DELETE' && payload.old?.id) {
          setMessages(current => current.filter(message => message.id !== payload.old.id));
        } else {
          refreshNewest().catch(() => setError(t('chat.loadFailed')));
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [authLoading, isAuthenticated, user?.id, navigate, refreshNewest, t]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (pendingScrollRef.current) {
      const { height, top } = pendingScrollRef.current;
      container.scrollTop = container.scrollHeight - height + top;
      pendingScrollRef.current = null;
    } else if (!isLoadingOlder) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - recordingStartedRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => {
    window.clearTimeout(maxDurationTimeoutRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (voiceDraft?.url) URL.revokeObjectURL(voiceDraft.url);
  }, [voiceDraft]);

  const loadOlder = async () => {
    if (loadingOlderRef.current || !hasMore || messages.length === 0) return;
    const oldest = messages[messages.length - 1];
    const container = scrollRef.current;
    if (!oldest || !container) return;
    pendingScrollRef.current = { height: container.scrollHeight, top: container.scrollTop };
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    try {
      const response = await chatApi.getMessages({
        limit: PAGE_SIZE,
        before: oldest.created_at,
        beforeId: oldest.id,
      });
      const page = response?.items ? response : response?.data;
      if (page?.items?.length) {
        setMessages(current => [...current, ...page.items]);
        setHasMore(Boolean(page.has_more));
      } else {
        setHasMore(false);
      }
    } catch {
      pendingScrollRef.current = null;
      setError(t('chat.loadFailed'));
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  };

  const handleScroll = (event) => {
    if (event.currentTarget.scrollTop < 48) loadOlder();
  };

  const sendText = async (event) => {
    event?.preventDefault();
    const content = text.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setError('');
    try {
      const response = await chatApi.sendMessage({ message_type: 'text', content });
      const message = response?.id ? response : response?.data;
      if (message?.id) setMessages(current => [message, ...current.filter(item => item.id !== message.id)]);
      setText('');
    } catch (sendError) {
      const detail = sendError?.message;
      setError(detail && !detail.startsWith('HTTP error!') ? detail : t('chat.failedToSend'));
    } finally {
      setIsSending(false);
    }
  };

  const stopRecording = () => {
    window.clearTimeout(maxDurationTimeoutRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const startRecording = async (event) => {
    event.preventDefault();
    if (recording || voiceDraft) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError(t('chat.voiceUnsupported'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!recordPressActiveRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      const supportedTypes = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/aac', 'audio/ogg;codecs=opus', 'audio/webm'];
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (dataEvent) => {
        if (dataEvent.data?.size) chunksRef.current.push(dataEvent.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        const duration = Math.min(90, Math.round((Date.now() - recordingStartedRef.current) / 1000));
        if (blob.size > MAX_VOICE_SIZE) {
          setError(t('chat.voiceTooLarge'));
        } else if (blob.size) {
          setVoiceDraft({ blob, type: type.split(';')[0], duration, url: URL.createObjectURL(blob) });
        }
        setRecording(false);
      };
      recordingStartedRef.current = Date.now();
      setRecordingSeconds(0);
      setRecording(true);
      recorder.start(250);
      maxDurationTimeoutRef.current = window.setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch {
      setError(t('chat.microphonePermission'));
    }
  };

  const cancelVoiceDraft = () => {
    if (voiceDraft?.url) URL.revokeObjectURL(voiceDraft.url);
    setVoiceDraft(null);
    setError('');
  };

  const sendVoice = async () => {
    if (!voiceDraft || isUploadingVoice || !user?.id) return;
    setIsUploadingVoice(true);
    setError('');
    const extensionByType = {
      'audio/webm': 'webm',
      'audio/mp4': 'mp4',
      'audio/aac': 'aac',
      'audio/ogg': 'ogg',
      'audio/3gpp': '3gp',
    };
    const fileType = extensionByType[voiceDraft.type];
    if (!fileType) {
      setError(t('chat.voiceUnsupported'));
      setIsUploadingVoice(false);
      return;
    }
    const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const voicePath = `${user.id}/${uniqueId}.${fileType}`;
    try {
      const { error: uploadError } = await supabase.storage.from('chat-voice').upload(voicePath, voiceDraft.blob, {
        contentType: voiceDraft.type,
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const response = await chatApi.sendMessage({ message_type: 'voice', voice_path: voicePath });
      const message = response?.id ? response : response?.data;
      if (message?.id) setMessages(current => [message, ...current.filter(item => item.id !== message.id)]);
      cancelVoiceDraft();
    } catch {
      await supabase.storage.from('chat-voice').remove([voicePath]).catch(() => {});
      setError(t('chat.failedToUpload'));
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const handlePhotoSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('chat.photoTypeInvalid'));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError(t('chat.photoTooLarge'));
      return;
    }

    if (!user?.id) return;
    setUploadingImage(true);
    setError('');

    const extensionByType = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const imagePath = `${user.id}/${uniqueId}.${extensionByType[file.type]}`;

    try {
      const { error: uploadError } = await supabase.storage.from('chat-images').upload(imagePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const response = await chatApi.sendMessage({ message_type: 'image', image_path: imagePath });
      const message = response?.id ? response : response?.data;
      if (message?.id) setMessages(current => [message, ...current.filter(item => item.id !== message.id)]);
      toastService.success(t('chat.messageSent') || 'Photo shared');
    } catch (photoError) {
      await supabase.storage.from('chat-images').remove([imagePath]).catch(() => {});
      setError(photoError?.message || t('chat.photoUploadFailed'));
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm(t('chat.confirmDelete'))) return;
    try {
      await chatApi.deleteMessage(message.id);
      setMessages(current => current.filter(item => item.id !== message.id));
      toastService.success(t('chat.messageDeleted'));
    } catch {
      toastService.error(t('chat.failedToSend'));
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!reportTarget || !reportReason.trim()) return;
    try {
      await chatApi.reportMessage(reportTarget.id, reportReason.trim());
      toastService.success(t('chat.reportSent'));
      setReportTarget(null);
      setReportReason('');
    } catch (reportError) {
      toastService.error(reportError.message || t('chat.failedToSend'));
    }
  };

  const locale = language === 'kn' ? 'kn-IN' : 'en-IN';
  const chronologicalMessages = [...messages].reverse();
  const endRecordPress = () => {
    recordPressActiveRef.current = false;
    stopRecording();
  };

  return (
    <div
      className="fixed inset-x-0 z-10 overflow-hidden bg-[#f7f8f4]"
      style={{ top: `${viewportBounds.top}px`, height: `${viewportBounds.height}px` }}
    >
      <div className="hidden md:block">
        <Header showBack onBack={() => navigate('/home')} />
      </div>
      <main className="mx-auto flex h-full w-full flex-col overflow-hidden bg-[#f7f8f4] md:h-[calc(100%-72px)]">
        <Card padding="none" className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 shadow-none">
          <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-border-light bg-white px-4 py-3">
            <button type="button" onClick={() => navigate('/home')} aria-label={t('common.back')} className="rounded-lg p-2 text-text-light hover:bg-bg-light md:hidden">
              <ArrowLeft size={18} />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900"><MessageCircle size={21} /></div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold text-text-dark">{t('chat.maatuKate')}</h1>
              <p className="text-xs text-text-light">{t('chat.homeDescription')}</p>
            </div>
          </header>

          <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto bg-[#f7f8f4] px-3 py-4 sm:px-5">
            {hasMore && (
              <div className="mb-3 text-center">
                <button type="button" onClick={loadOlder} disabled={isLoadingOlder} className="text-xs font-bold text-emerald-800 hover:underline disabled:opacity-50">
                  {isLoadingOlder ? t('common.loading') : t('chat.olderMessages')}
                </button>
              </div>
            )}
            {isLoading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-text-light"><Loader2 size={18} className="animate-spin" />{t('common.loading')}</div>
            ) : error && messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-text-light">
                <p>{error}</p><Button variant="secondary" size="sm" onClick={() => refreshNewest().catch(() => setError(t('chat.loadFailed')))}>{t('chat.retry')}</Button>
              </div>
            ) : chronologicalMessages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"><MessageCircle size={27} /></div>
                <p className="font-bold text-text-dark">{t('chat.noMessages')}</p>
                <p className="mt-1 text-sm text-text-light">{t('chat.startConversation')}</p>
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {chronologicalMessages.map(message => {
                  const ownMessage = message.user_id === user?.id;
                  return (
                    <article key={message.id} className={`flex items-end gap-2 ${ownMessage ? 'flex-row-reverse' : ''}`}>
                      <UserAvatar name={message.display_name} url={message.avatar_url} size="sm" />
                      <div className={`max-w-[86%] min-w-0 sm:max-w-[74%] ${ownMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                        <p className="mb-1 px-1 text-[11px] font-bold text-text-light">{ownMessage ? t('chat.you') : message.display_name}</p>
                        <div className={`w-full rounded-2xl border px-3 py-2.5 shadow-sm ${ownMessage ? 'rounded-br-sm border-emerald-200 bg-emerald-50' : 'rounded-bl-sm border-border-light bg-white'}`}>
                          {message.message_type === 'text' ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-dark">{message.content}</p>
                          ) : message.message_type === 'voice' ? (
                            <VoicePlayer path={message.voice_path} t={t} />
                          ) : (
                            <ChatImageMessage path={message.image_path} onOpen={setExpandedImage} />
                          )}
                          <time className="mt-1.5 block text-right text-[10px] text-text-light">
                            {new Date(message.created_at).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}
                          </time>
                        </div>
                        <details className="group relative mt-0.5">
                          <summary className="list-none cursor-pointer px-2 py-1 text-lg leading-none text-text-light hover:text-text-dark" aria-label={t('chat.messageActions')}>⋮</summary>
                          <div className={`absolute top-7 z-10 min-w-28 rounded-lg border border-border-light bg-white p-1 shadow-lg ${ownMessage ? 'right-0' : 'left-0'}`}>
                            {ownMessage ? (
                              <button type="button" onClick={() => deleteMessage(message)} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 size={14} />{t('chat.delete')}</button>
                            ) : (
                              <button type="button" onClick={() => { setReportTarget(message); setReportReason(''); }} className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs font-bold text-text-dark hover:bg-bg-light">{t('chat.report')}</button>
                            )}
                          </div>
                        </details>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="z-20 shrink-0 border-t border-border-light bg-white px-2 py-2 sm:px-3" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
            {(recording || voiceDraft) && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-2 py-2">
                {recording ? (
                  <>
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />
                    <span className="flex-1 text-sm font-bold text-text-dark">{t('chat.recording')}... {formatDuration(recordingSeconds)}</span>
                    <button type="button" onClick={stopRecording} className="rounded-lg p-2 text-red-700 hover:bg-red-100" aria-label={t('chat.stopRecording')}><Square size={17} /></button>
                  </>
                ) : (
                  <>
                    <span className="shrink-0 text-sm font-bold text-text-dark">🎤 {t('chat.voiceMessage')} · {formatDuration(voiceDraft.duration)}</span>
                    <audio controls preload="metadata" controlsList="nodownload noplaybackrate nofullscreen" src={voiceDraft.url} className="h-9 min-w-0 flex-1" />
                    <button type="button" onClick={cancelVoiceDraft} disabled={isUploadingVoice} className="rounded-lg p-2 text-text-light hover:bg-white" aria-label={t('chat.cancel')}><X size={17} /></button>
                    <Button type="button" variant="primary" size="sm" disabled={isUploadingVoice} onClick={sendVoice}>
                      {isUploadingVoice ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </Button>
                  </>
                )}
              </div>
            )}

            {error && messages.length > 0 && <p role="alert" className="mb-2 text-xs font-semibold text-red-700">{error}</p>}
            {!voiceDraft && !recording && (
              <div className="flex items-end gap-2">
                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage || isSending || isUploadingVoice}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-light bg-bg-light text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                  aria-label={t('chat.choosePhoto') || 'Add photo'}
                  title={t('chat.choosePhoto') || 'Add photo'}
                >
                  {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                </button>
                <textarea
                  value={text}
                  onChange={event => setText(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendText(event);
                    }
                  }}
                  placeholder={t('chat.typeMessage')}
                  maxLength={2000}
                  rows={1}
                  className="max-h-28 min-h-11 min-w-0 flex-1 resize-none rounded-xl border border-border-light bg-white px-3.5 py-3 text-sm text-text-dark outline-none focus:border-emerald-700"
                  aria-label={t('chat.typeMessage')}
                />
                <button
                  type="button"
                  onPointerDown={event => { recordPressActiveRef.current = true; startRecording(event); }}
                  onPointerUp={endRecordPress}
                  onPointerCancel={endRecordPress}
                  onPointerLeave={event => { if (recording && event.buttons === 0) endRecordPress(); }}
                  disabled={isSending || isUploadingVoice || uploadingImage}
                  className="flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-xl border border-border-light bg-bg-light text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                  aria-label={t('chat.holdToRecord')}
                  title={t('chat.holdToRecord')}
                >
                  <Mic size={18} />
                </button>
                <button type="button" onClick={sendText} disabled={!text.trim() || isSending || uploadingImage} aria-label={t('chat.send')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-45">
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            )}
          </div>
        </Card>
      </main>

      {expandedImage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4" onClick={() => setExpandedImage('')}>
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" onClick={() => setExpandedImage('')} aria-label="Close image">
            <X size={20} />
          </button>
          <img src={expandedImage} alt="Expanded chat photo" className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
        </div>
      )}

      {reportTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <Card role="dialog" aria-modal="true" aria-labelledby="chat-report-title" padding="lg" className="w-full max-w-sm border border-border-light shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="chat-report-title" className="text-base font-extrabold text-text-dark">{t('chat.report')}</h2>
                <p className="mt-1 text-xs text-text-light">{t('chat.reportReason')}</p>
              </div>
              <button type="button" onClick={() => setReportTarget(null)} aria-label={t('chat.cancel')} className="rounded p-1 text-text-light hover:bg-bg-light"><X size={18} /></button>
            </div>
            <form onSubmit={submitReport} className="mt-4 space-y-4">
              <textarea value={reportReason} onChange={event => setReportReason(event.target.value)} maxLength={500} rows={3} required className="w-full rounded-lg border border-border-light p-3 text-sm outline-none focus:border-emerald-700" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setReportTarget(null)}>{t('chat.cancel')}</Button>
                <Button type="submit" variant="primary" size="sm" disabled={!reportReason.trim()}>{t('chat.report')}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
