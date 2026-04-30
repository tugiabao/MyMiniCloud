import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Volume2, Languages, Loader2, Info, ChevronRight, Mic2, LogOut, Save, History as HistoryIcon, BookOpen, Trash2, Cpu, Zap, Pause, RefreshCw } from 'lucide-react';
import keycloak from './lib/keycloak';
import { GoogleGenAI, Modality } from "@google/genai";
import { playPCM } from './lib/audioPlayer';

const DEFAULT_TEXT = "";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [ipa, setIpa] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [analysis, setAnalysis] = useState<{ word: string, tip: string, ipa?: string }[]>([]);
  const [recording, setRecording] = useState(false);
  const [feedback, setFeedback] = useState<{ score: number, comment: string, errors: string[], rawTranscription?: string } | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [nativeTranscript, setNativeTranscript] = useState('');
  const nativeTranscriptRef = useRef('');
  // Thay thế Gemini Voice bằng Native Voice
  const [nativeVoices, setNativeVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'reading' | 'history'>('reading');
  const [evaluationMode, setEvaluationMode] = useState<'ai' | 'native'>('ai');
  const evaluationModeRef = useRef<'ai' | 'native'>('ai');
  const [isPlayingLast, setIsPlayingLast] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingHistoryKey, setPlayingHistoryKey] = useState<string | null>(null);

  useEffect(() => {
    evaluationModeRef.current = evaluationMode;
  }, [evaluationMode]);

  const [history, setHistory] = useState<any[]>([]);

  // Lấy userId và Username từ Keycloak
  const userId = keycloak.tokenParsed?.sub || 'anonymous';
  const username = keycloak.tokenParsed?.preferred_username || 'User';

  // DRAFT PERSISTENCE: Lưu và tải bản nháp theo từng User
  useEffect(() => {
    const savedDraft = localStorage.getItem(`pronounce_draft_${userId}`);
    if (savedDraft) {
      setText(savedDraft);
    } else {
      setText(DEFAULT_TEXT);
    }
    // Khi đổi User, reset các trạng thái khác
    setIpa(null);
    setAnalysis([]);
    setFeedback(null);
    setLastBlob(null);
  }, [userId]);

  useEffect(() => {
    if (text !== DEFAULT_TEXT) {
      localStorage.setItem(`pronounce_draft_${userId}`, text);
    }
  }, [text, userId]);

  // Tải danh sách giọng đọc tiếng Anh của trình duyệt
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter(v => v.lang.startsWith('en') && !v.name.includes('Microsoft'));
      setNativeVoices(englishVoices);
      if (englishVoices.length > 0 && !selectedVoiceURI) {
        // Ưu tiên các giọng hay như Google hoặc Siri nếu có
        const bestVoice = englishVoices.find(v => v.name.includes('Google') || v.name.includes('Siri')) || englishVoices[0];
        setSelectedVoiceURI(bestVoice.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Chỉ phân tích văn bản khi nội dung văn bản thay đổi (debounce 1s)
  useEffect(() => {
    const timer = setTimeout(() => {
      generateAnalysis();
    }, 1000);
    return () => clearTimeout(timer);
  }, [text]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setLastBlob(audioBlob);
        await evaluatePronunciation(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      // Native Speech Recognition Fallback
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
          const resultText = fullTranscript.trim();
          setNativeTranscript(resultText);
          nativeTranscriptRef.current = resultText;
        };

        // Quan trọng: Tự động khởi động lại nếu bị ngắt do im lặng nhưng vẫn đang trong trạng thái ghi âm
        recognition.onend = () => {
          // Chúng ta không thể truy cập trực tiếp state 'recording' ở đây một cách tin cậy do closure
          // Nhưng có thể kiểm tra trạng thái của mediaRecorder
          if (recorder.state === 'recording') {
            try { recognition.start(); } catch (e) { }
          }
        };

        recognition.start();
        recorder.addEventListener('stop', () => {
          recognition.onend = null; // Gỡ bỏ listener để không restart nữa
          recognition.stop();
        });
      }

      setNativeTranscript(''); // Reset
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setAudioChunks([]);
      setFeedback(null);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  }

  function stopRecording() {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
      setRecording(false);
    }
  }

  async function evaluatePronunciation(blob: Blob) {
    setLoading(true);

    // Sử dụng Ref để lấy giá trị mới nhất, tránh stale closure
    if (evaluationModeRef.current === 'native') {
      runNativeFallback();
      setLoading(false);
      return;
    }

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              text: `Evaluate the pronunciation of the provided audio against this target text: "${text}". 
            1. Provide a score from 0-100.
            2. A general supportive comment.
            3. A list of specific words that were mispronounced.
            4. VERY IMPORTANT: Provide a "raw_transcription" representing exactly what the speaker said, even if they made mistakes or mispronounced words. Do not auto-correct it.
            Return the result in JSON format with keys: "score" (number), "comment" (string), "errors" (array of strings), "rawTranscription" (string).` },
            { inlineData: { data: base64Audio, mimeType: "audio/webm" } }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text || '{}');
      setFeedback(result);
    } catch (error: any) {
      console.error("Error evaluating pronunciation:", error);
      runNativeFallback();
    } finally {
      setLoading(false);
    }
  }

  function runNativeFallback() {
    const currentNativeText = nativeTranscriptRef.current;
    if (currentNativeText) {
      const origWords = text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);
      const transWords = currentNativeText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").split(/\s+/).filter(Boolean);

      let matches = 0;
      const errors: string[] = [];

      origWords.forEach(w => {
        if (transWords.includes(w)) {
          matches++;
        } else {
          errors.push(w);
        }
      });

      const fallbackScore = Math.round((matches / origWords.length) * 100);

      setFeedback({
        score: fallbackScore,
        comment: evaluationModeRef.current === 'native' ? "Mode: Native Recognition (Free & Unlimited)" : "Note: Gemini AI is out of quota. Using native browser recognition for feedback.",
        errors: errors.slice(0, 5),
        rawTranscription: currentNativeText
      });
    } else {
      alert("Native recognition failed to capture text. Please check your microphone.");
    }
  }

  async function generateAnalysis() {
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this text and provide the following for an English learner:
        1. The IPA transcription of the full text.
        2. A "Skeleton Outline" of the paragraph. For EACH sentence in the text, provide a highly condensed summary (1-3 words) that captures its core meaning to serve as a memory anchor.
        Return as JSON with keys "ipa" and "analysis" (array of objects where "word" is the condensed phrase and "tip" is a brief explanation of how it connects to the target sentence).
        Text: ${text}`,
        config: {
          responseMimeType: "application/json"
        }
      });
      const data = JSON.parse(response.text || '{}');
      setIpa(data.ipa);
      setAnalysis(data.analysis || []);
    } catch (error) {
      console.error("Error generating analysis:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  async function fetchHistory() {
    try {
      const response = await fetch(`/api/history?userId=${userId}`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }

  async function saveToHistory() {
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('text', text);
      formData.append('ipa', ipa || '');
      formData.append('analysis', JSON.stringify(analysis));
      formData.append('feedback', JSON.stringify(feedback));

      if (lastBlob) {
        formData.append('audio', lastBlob, 'recording.webm');
      }

      const response = await fetch('/api/history', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Đã lưu rồi cu!');
        if (activeTab === 'history') fetchHistory();
      }
    } catch (error) {
      console.error('Error saving history:', error);
      alert('Lỗi khi lưu vào Cloud.');
    }
  }

  async function deleteHistoryItem(id: number) {
    try {
      await fetch(`/api/history/${id}?userId=${userId}`, { method: 'DELETE' });
      fetchHistory();
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  }

  async function playHistoryAudio(audioKey: string) {
    if (playingHistoryKey === audioKey) return;

    setPlayingHistoryKey(audioKey);
    const audio = new Audio(`/api/audio/${audioKey}`);
    audio.onended = () => setPlayingHistoryKey(null);
    audio.onerror = () => setPlayingHistoryKey(null);
    audio.play();
  }

  function loadHistoryToPractice(item: any) {
    setText(item.text);
    setIpa(item.ipa || '');
    if (item.analysis) {
      setAnalysis(typeof item.analysis === 'string' ? JSON.parse(item.analysis) : item.analysis);
    }
    if (item.feedback) {
      setFeedback(typeof item.feedback === 'string' ? JSON.parse(item.feedback) : item.feedback);
    }
    setLastBlob(null);
    setActiveTab('reading');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleLastRecording() {
    if (isPlayingLast) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingLast(false);
    } else if (lastBlob) {
      const url = URL.createObjectURL(lastBlob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingLast(false);
      audio.play();
      setIsPlayingLast(true);
    }
  }

  function resetPractice() {
    setText("");
    setIpa(null);
    setAnalysis([]);
    setFeedback(null);
    setLastBlob(null);
    setNativeTranscript('');
    nativeTranscriptRef.current = '';
    localStorage.removeItem(`pronounce_draft_${userId}`);
  }

  function speak() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = nativeVoices.find(v => v.voiceURI === selectedVoiceURI);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 px-4 md:px-10 py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Languages size={18} />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-800 truncate">PronounceAI</h1>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
              <button
                onClick={() => setActiveTab('reading')}
                className={`transition-colors ${activeTab === 'reading' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'hover:text-slate-800'}`}
              >
                Reading Practice
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`transition-colors ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'hover:text-slate-800'}`}
              >
                History
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</span>
                <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate">{keycloak.tokenParsed?.preferred_username || 'User'}</span>
              </div>
              <button
                onClick={() => keycloak.logout()}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-28 px-10 max-w-7xl mx-auto">
        {activeTab === 'history' ? (
          <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Learning History</h2>
                <p className="text-sm text-slate-500 mt-1">Viewing saved sessions for <span className="text-indigo-600 font-bold">{username}</span></p>
              </div>
              <span className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                {history.length} Sessions
              </span>
            </div>

            {history.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-[32px] p-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <HistoryIcon size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-400">No history found</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Start practicing and save your sessions to see them here.</p>
                <button
                  onClick={() => setActiveTab('reading')}
                  className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Start Practice
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {history.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => loadHistoryToPractice(item)}
                    className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all relative group cursor-pointer"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHistoryItem(item.id);
                      }}
                      className="absolute top-4 md:top-6 right-4 md:right-6 p-2 text-slate-300 hover:text-red-500 transition-colors z-10"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <BookOpen size={14} />
                          <span className="truncate">Session: {new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed line-clamp-3">
                          {item.text}
                        </p>
                        {item.ipa && (
                          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mt-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">IPA Transcription</h4>
                            <p className="text-indigo-900/60 font-mono text-xs leading-relaxed">{item.ipa}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-4">
                          {item.audio_key && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playHistoryAudio(item.audio_key);
                              }}
                              disabled={playingHistoryKey === item.audio_key}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${playingHistoryKey === item.audio_key
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-inner'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100'
                                }`}
                            >
                              {playingHistoryKey === item.audio_key ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Play size={14} fill="currentColor" />
                              )}
                              {playingHistoryKey === item.audio_key ? 'Playing...' : 'Play Recording'}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                                e.stopPropagation();
                                loadHistoryToPractice(item);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
                          >
                            <RefreshCw size={14} /> Practice Again
                          </button>
                        </div>
                      </div>

                      <div className="w-full lg:w-80 space-y-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Analysis Highlights</h4>
                        <div className="flex flex-wrap gap-2">
                          {item.analysis.slice(0, 5).map((ana: any, i: number) => (
                            <div key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                              <span className="text-xs font-bold text-slate-700">{ana.word}</span>
                            </div>
                          ))}
                          {item.analysis.length > 5 && (
                            <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                              <span className="text-xs font-bold text-slate-400">+{item.analysis.length - 5} more</span>
                            </div>
                          )}
                        </div>

                        {item.feedback && (
                          <div className="mt-4 p-4 bg-green-50/50 border border-green-100 rounded-2xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Performance</span>
                              <span className="text-lg font-black text-green-700">{item.feedback.score}%</span>
                            </div>
                            <p className="text-[10px] text-green-600/70 italic line-clamp-2">"{item.feedback.comment}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content Area */}
            <div className="flex-1 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <h2 className="text-[9px] md:text-sm uppercase tracking-widest text-slate-400 font-bold">Active Passage</h2>
                  <button
                    onClick={saveToHistory}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors uppercase whitespace-nowrap"
                  >
                    <Save size={12} /> Save
                  </button>
                  <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200">
                    <button
                        onClick={() => setEvaluationMode('ai')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold transition-all uppercase ${evaluationMode === 'ai' 
                            ? 'bg-purple-600 text-white shadow-md' 
                            : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Cpu size={10} /> AI Mode
                    </button>
                    <button
                        onClick={() => setEvaluationMode('native')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold transition-all uppercase ${evaluationMode === 'native' 
                            ? 'bg-amber-500 text-white shadow-md' 
                            : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Zap size={10} /> Native
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <span className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full border border-green-100 uppercase">Intermediate</span>
                  <span className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 uppercase">{text.split(/\s+/).filter(Boolean).length} Words</span>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm group relative"
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={() => generateAnalysis()}
                  className="w-full h-60 md:h-80 p-0 bg-transparent border-none text-[20px] md:text-[28px] leading-[1.6] font-normal text-slate-700 resize-none outline-none placeholder:text-slate-200"
                  placeholder="Paste your text here to practice..."
                />
              </motion.div>

              {/* Playback Controls Area */}
              <div className="h-24 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between px-8">
                <div className="flex items-center gap-12">
                  <div className="relative">
                    <button
                      onClick={speak}
                      disabled={speaking}
                      className={`w-14 h-14 flex items-center justify-center pl-1 rounded-full transition-all duration-300 shadow-lg border relative z-10 ${speaking
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-white text-indigo-600 border-slate-200 hover:bg-indigo-50 hover:border-indigo-100 active:scale-95'
                        }`}
                    >
                      {speaking ? <Loader2 className="animate-spin" size={28} /> : <Volume2 size={28} />}
                    </button>
                  </div>

                  <div className="hidden md:flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Voice Selector (Native)</span>
                    <div className="flex gap-1 overflow-x-auto pb-1 max-w-[200px] no-scrollbar">
                      <select
                        value={selectedVoiceURI}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                        className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                      >
                        {nativeVoices.map(v => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-w-xs mx-8 hidden md:flex items-center gap-4">
                  <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: (speaking || recording) ? '100%' : '0%' }}
                      transition={{ duration: speaking ? 15 : (recording ? 30 : 0.5) }}
                      className={`h-full ${recording ? 'bg-red-500' : 'bg-indigo-500'}`}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {recording ? 'Recording...' : (speaking ? 'Playing...' : '0:00 / 0:15')}
                  </span>
                </div>

                {!recording && (
                  <button
                    onClick={toggleLastRecording}
                    disabled={!lastBlob}
                    className={`flex items-center justify-center w-12 h-12 rounded-full border transition-all mr-4 shadow-sm ${!lastBlob
                        ? 'bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed'
                        : isPlayingLast
                          ? 'bg-red-50 border-red-100 text-red-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    title={!lastBlob ? "No recording available" : (isPlayingLast ? "Stop playing" : "Play last recording")}
                  >
                    {isPlayingLast ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                )}

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full font-bold shadow-lg transition-all uppercase text-xs tracking-wider ${recording
                        ? 'bg-red-600 text-white shadow-red-100 hover:bg-red-700'
                        : evaluationMode === 'ai'
                            ? 'bg-purple-600 text-white shadow-purple-100 hover:bg-purple-700'
                            : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                        }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${recording ? 'bg-white animate-ping' : 'bg-white animate-pulse'}`}></div>
                    {recording ? 'Stop & Evaluate' : `Start Recording (${evaluationMode.toUpperCase()})`}
                  </button>
                  <span className={`text-[8px] font-bold uppercase tracking-[0.2em] ${evaluationMode === 'ai' ? 'text-purple-400' : 'text-slate-400'}`}>
                    {evaluationMode === 'ai' ? 'Using Gemini AI 1.5 Flash' : 'Using Web Speech API'}
                  </span>
                </div>
              </div>

              {/* Raw Transcription Section */}
              <AnimatePresence>
                {feedback?.rawTranscription && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">What We Heard (Raw Transcription)</h3>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">Real-time Recognition</span>
                    </div>
                    <p className="text-xl leading-relaxed text-slate-600 font-medium italic">
                      "{feedback.rawTranscription}"
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-lg">
                      This text represents exactly what the AI recognized from your speech, without any structural corrections.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* IPA Display - Integrated Style */}
              <AnimatePresence>
                {ipa && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">IPA Transcription</h3>
                    </div>
                    <p className="text-indigo-900/60 font-mono text-xs leading-relaxed">
                      {ipa}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar Analysis */}
            <aside className="w-full lg:w-80 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-800 mb-5 text-center px-4">Paragraph Skeleton</h2>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-300">
                    <Loader2 className="animate-spin" size={24} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Rebuilding Skeleton...</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative">
                    {/* Vertical Line for the skeleton path */}
                    <div className="absolute left-3 top-2 bottom-2 w-[1px] bg-indigo-100" />

                    {analysis.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative pl-8 group"
                      >
                        {/* Step Indicator */}
                        <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border border-indigo-200 rounded-full flex items-center justify-center text-[10px] font-bold text-indigo-600 z-10 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          {index + 1}
                        </div>

                        <div className="p-3 rounded-xl border border-transparent hover:bg-slate-50 transition-colors">
                          <span className="text-xs font-bold text-indigo-900 block mb-0.5 uppercase tracking-tight">
                            {item.word}
                          </span>
                          <p className="text-[9px] leading-relaxed text-slate-400">
                            {item.tip}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {analysis.length === 0 && !loading && (
                      <p className="text-xs text-slate-400 text-center py-4 px-2">
                        Input text above to generate a memory skeleton.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Score Card / Summary */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-slate-200">
                <div className={`absolute top-0 right-0 px-3 py-1 text-[8px] font-bold uppercase tracking-widest ${evaluationMode === 'ai' ? 'bg-purple-600' : 'bg-amber-500'}`}>
                   {evaluationMode === 'ai' ? 'AI Evaluation' : 'Native Engine'}
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white opacity-5 rounded-full"></div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pronunciation Score</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-5xl font-bold">{feedback?.score ?? '--'}</span>
                  <span className="text-slate-400 font-bold text-xl">/100</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed uppercase font-medium">
                  {feedback ? feedback.comment : "Record yourself to receive a score and feedback."}
                </p>

                {feedback?.errors && feedback.errors.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Focus on these words:</p>
                    <div className="flex flex-wrap gap-2">
                      {feedback.errors.map(err => (
                        <span key={err} className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-white font-medium">
                          {err}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[10px] font-bold rounded-xl transition-colors uppercase tracking-widest">
                  {loading && !recording ? 'Evaluating...' : 'View Full Report'}
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Bottom Bar Footer (Desktop Only) */}
      <footer className="fixed bottom-0 w-full h-12 px-10 hidden md:flex items-center justify-between text-[10px] text-slate-400 bg-white border-t border-slate-100 uppercase tracking-widest font-bold z-40">
        <span>Created by TGB- 934</span>
        <div className="flex gap-8">
          <button
            onClick={resetPractice}
            className="hover:text-red-600 transition-colors"
          >
            Reset Practice
          </button>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 md:hidden z-50 flex items-center justify-around py-3 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => setActiveTab('reading')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'reading' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <BookOpen size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Practice</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <HistoryIcon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
        </button>
        <button
          onClick={resetPractice}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-red-500 transition-all"
        >
          <RefreshCw size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Reset</span>
        </button>
      </nav>
    </div>
  );
}

