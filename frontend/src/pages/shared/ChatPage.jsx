import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import chatService from '../../services/chatService';

const CONVERSATION_POLL_MS = 8000;
const MESSAGE_POLL_MS = 4000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const formatTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const formatFullTime = (value) =>
  value
    ? new Date(value).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const Avatar = ({ name, src, size = 'w-10 h-10' }) =>
  src ? (
    <img src={src} alt={name} className={`${size} rounded-lg object-cover border border-slate-200 shrink-0`} />
  ) : (
    <div className={`${size} rounded-lg bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0`}>
      {name ? name[0].toUpperCase() : '?'}
    </div>
  );

const ChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = Number(searchParams.get('c')) || null;

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');

  const [messages, setMessages] = useState([]);
  const [otherReadUpTo, setOtherReadUpTo] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState('');

  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const bottomRef = useRef(null);
  const listRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastIdRef = useRef(0);
  const stickToBottomRef = useRef(true);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // ----- Conversation list (polling) -----
  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      setConversations(res?.data || []);
      setListError('');
    } catch (err) {
      setListError(err.response?.data?.message || 'Gagal memuat daftar percakapan.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const timer = setInterval(() => {
      if (!document.hidden) fetchConversations();
    }, CONVERSATION_POLL_MS);
    return () => clearInterval(timer);
  }, [fetchConversations]);

  // ----- Messages of the active conversation -----
  useEffect(() => {
    lastIdRef.current = 0;
    stickToBottomRef.current = true;
    setMessages([]);
    setOtherReadUpTo(0);
    setChatError('');
    setSendError('');
    setText('');
    setFile(null);

    if (!activeId) return undefined;

    let active = true;

    const load = async (initial) => {
      try {
        const res = await chatService.getMessages(activeId, initial ? 0 : lastIdRef.current);
        if (!active) return;
        const incoming = res?.data?.messages || [];
        setOtherReadUpTo(res?.data?.other_read_up_to_id || 0);
        if (incoming.length > 0) {
          lastIdRef.current = incoming[incoming.length - 1].id;
          setMessages((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const fresh = incoming.filter((m) => !known.has(m.id));
            return initial ? incoming : [...prev, ...fresh];
          });
          if (!initial) fetchConversations();
        }
        setChatError('');
      } catch (err) {
        if (!active) return;
        if (initial) {
          setChatError(err.response?.data?.message || 'Gagal memuat pesan.');
        }
      } finally {
        if (active && initial) setLoadingMessages(false);
      }
    };

    setLoadingMessages(true);
    load(true).then(() => fetchConversations());

    const timer = setInterval(() => {
      if (!document.hidden) load(false);
    }, MESSAGE_POLL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [activeId, fetchConversations]);

  // ----- Auto scroll -----
  useEffect(() => {
    if (stickToBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: 'end' });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const openConversation = (id) => {
    setSearchParams({ c: String(id) });
  };

  const closeConversation = () => {
    setSearchParams({});
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;
    if (selected.size > MAX_FILE_SIZE) {
      setSendError('Ukuran lampiran maksimal 10MB.');
      return;
    }
    setSendError('');
    setFile(selected);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if ((!body && !file) || sending || !activeId) return;

    setSending(true);
    setSendError('');
    try {
      const res = await chatService.sendMessage(activeId, { body, attachment: file });
      const created = res?.data;
      if (created) {
        stickToBottomRef.current = true;
        lastIdRef.current = Math.max(lastIdRef.current, created.id);
        setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
      }
      setText('');
      setFile(null);
      fetchConversations();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : null;
      setSendError(firstError || err.response?.data?.message || 'Gagal mengirim pesan.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7">
        <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-semibold block mb-1.5">
          Komunikasi
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-1">Pesan</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Berkomunikasi langsung terkait lamaran kerja, termasuk mengirim berkas pendukung.
        </p>
      </div>

      {/* Chat Workspace */}
      <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-17rem)] min-h-[480px]">
        {/* Conversation List */}
        <aside
          className={`md:col-span-4 lg:col-span-4 border-r border-slate-200/90 flex flex-col min-h-0 ${
            activeId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Percakapan ({conversations.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingList ? (
              <p className="p-5 text-xs text-slate-400">Memuat percakapan...</p>
            ) : listError ? (
              <p className="p-5 text-xs text-rose-600">{listError}</p>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-semibold text-slate-800">Belum ada percakapan</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Mulai chat dari halaman detail lamaran (tombol &quot;Chat&quot;).
                </p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openConversation(c.id)}
                  className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors ${
                    c.id === activeId ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <Avatar name={c.counterpart_name} src={c.counterpart_avatar} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">{c.counterpart_name}</p>
                      <span className="text-[11px] text-slate-400 shrink-0">{formatTime(c.last_message_at)}</span>
                    </div>
                    <p className="text-[11px] font-medium text-blue-700 truncate">{c.job_title}</p>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{c.last_message || 'Belum ada pesan'}</p>
                      {c.unread_count > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat Window */}
        <section className={`md:col-span-8 lg:col-span-8 flex flex-col min-h-0 ${activeId ? 'flex' : 'hidden md:flex'}`}>
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-sm font-bold text-slate-900">Pilih percakapan</p>
                <p className="text-xs text-slate-500 mt-1">Pilih salah satu percakapan di sebelah kiri untuk mulai membaca dan membalas.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeConversation}
                  className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Kembali ke daftar percakapan"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <Avatar
                  name={activeConversation?.counterpart_name}
                  src={activeConversation?.counterpart_avatar}
                  size="w-9 h-9"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {activeConversation?.counterpart_name || 'Percakapan'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeConversation?.job_title ? `Lamaran: ${activeConversation.job_title}` : ''}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={listRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/60"
              >
                {loadingMessages ? (
                  <p className="text-xs text-slate-400 text-center pt-6">Memuat pesan...</p>
                ) : chatError ? (
                  <p className="text-xs text-rose-600 text-center pt-6">{chatError}</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center pt-6">Belum ada pesan. Mulai percakapan dengan menulis pesan di bawah.</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-xl px-3.5 py-2.5 text-sm ${
                          m.is_mine
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200/90 text-slate-800'
                        }`}
                      >
                        {m.attachment && (
                          <div className="mb-1.5">
                            {m.attachment.is_image && m.attachment.url ? (
                              <a href={m.attachment.url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={m.attachment.url}
                                  alt={m.attachment.name}
                                  className="max-h-48 rounded-lg border border-white/20 object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                href={m.attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold underline-offset-2 hover:underline ${
                                  m.is_mine ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                <span className="truncate">{m.attachment.name}</span>
                              </a>
                            )}
                          </div>
                        )}
                        {m.body && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>}
                        <p className={`text-[10px] mt-1 text-right ${m.is_mine ? 'text-slate-300' : 'text-slate-400'}`}>
                          {formatFullTime(m.created_at)}
                          {m.is_mine && (otherReadUpTo >= m.id || m.read_at) ? ' · Dibaca' : ''}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="border-t border-slate-100 p-3 space-y-2">
                {sendError && <p className="text-xs text-rose-600">{sendError}</p>}

                {file && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-slate-100 text-xs text-slate-700">
                    <span className="truncate font-semibold">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-slate-400 hover:text-rose-600 font-bold shrink-0"
                      aria-label="Hapus lampiran"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
                    title="Lampirkan berkas (maks 10MB)"
                    aria-label="Lampirkan berkas"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>

                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    maxLength={2000}
                    placeholder="Tulis pesan... (Enter untuk kirim, Shift+Enter baris baru)"
                    className="flex-1 resize-none max-h-32 px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 placeholder:text-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={sending || (!text.trim() && !file)}
                    className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    {sending ? 'Mengirim...' : 'Kirim'}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
