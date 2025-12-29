import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Upload, FileText, Search, TrendingUp, AlertCircle, CheckCircle2, 
  DollarSign, BarChart3, Zap, ArrowRight, Loader2, Briefcase, 
  XCircle, RefreshCw, Target, Users, Wrench, ShieldAlert, 
  Info, Eye, EyeOff, ChevronUp, Scan, Globe, Sparkles, 
  MessageSquare, PenTool, Mic2, User, MapPin, GraduationCap, 
  Award, Layers, Check, Edit3, Send, ChevronRight, Sparkle, 
  Code2, Target as FocusIcon, Coffee, Image as ImageIcon
} from 'lucide-react';

/**
 * CONFIGURAÇÃO GLOBAL
 * -------------------
 * O ResumeCritic Pro utiliza a API do Gemini 2.5 Flash para análise e OCR.
 * Bibliotecas PDF.js e Mammoth.js são carregadas dinamicamente para suporte universal.
 */

const apiKey = ""; // Injetada automaticamente pelo ambiente

const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAMMOTH_URL = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-zinc-900 rounded-2xl ${className}`} />
);

const App = () => {
  // Dados Principais
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  
  // Estado de Interface
  const [isJobSubmitted, setIsJobSubmitted] = useState(false);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isOcrActive, setIsOcrActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // IA Power-Ups
  const [aiActionLoading, setAiActionLoading] = useState(null);
  const [aiOutputs, setAiOutputs] = useState({});

  const fileInputRef = useRef(null);

  // Inicialização das bibliotecas externas
  useEffect(() => {
    const loadScripts = async () => {
      // PDF.js
      const pdfScript = document.createElement('script');
      pdfScript.src = PDF_JS_URL;
      pdfScript.async = true;
      pdfScript.onload = () => {
        if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      };
      document.head.appendChild(pdfScript);

      // Mammoth (Word)
      const mammothScript = document.createElement('script');
      mammothScript.src = MAMMOTH_URL;
      mammothScript.async = true;
      document.head.appendChild(mammothScript);
    };
    loadScripts();
  }, []);

  // --- MOTOR DE API GEMINI ---

  const fetchGemini = useCallback(async (parts, systemInstruction, structured = true) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    let retries = 5;
    
    const payload = {
      contents: [{ role: "user", parts }],
      systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    if (structured) {
      payload.generationConfig = { responseMimeType: "application/json" };
    } else {
      payload.tools = [{ google_search: {} }];
    }

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.status === 401) throw new Error("Não autorizado. Chave da API inválida.");
        if (response.ok) return await response.json();
        
        // Exponential Backoff: 1s, 2s, 4s, 8s, 16s
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      } catch (err) {
        if (i === retries) throw err;
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      }
    }
  }, []);

  const safeJsonParse = useCallback((text) => {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : text);
    } catch (e) {
      throw new Error("Falha ao processar os dados da IA.");
    }
  }, []);

  // --- EXTRAÇÃO UNIVERSAL (OCR / WORD / PDF) ---

  const performVisualExtraction = useCallback(async (base64Data, mimeType) => {
    setStatusMessage('IA a analisar imagem do documento...');
    const sys = `Extraia todo o texto deste currículo. Retorne apenas o conteúdo textual puro, respeitando a estrutura de secções.`;
    try {
      const data = await fetchGemini(
        [{ text: "Extraia o texto." }, { inlineData: { mimeType, data: base64Data } }],
        sys,
        true
      );
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (err) {
      throw new Error("O motor de visão falhou ao ler o documento.");
    }
  }, [fetchGemini]);

  const extractProfile = useCallback(async (text) => {
    setStatusMessage('A sincronizar perfil Apple-style...');
    const sys = `Analise o CV e retorne JSON em Português: { "name": "s", "headline": "s", "location": "s", "summary": "s", "topSkills": [], "education": "s", "experienceYears": "s" }`;
    try {
      const data = await fetchGemini([{ text }], sys, true);
      const res = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (res) setCandidateProfile(safeJsonParse(res));
    } catch (e) {
      console.error(e);
    } finally {
      setStatusMessage('');
    }
  }, [fetchGemini, safeJsonParse]);

  const processFile = useCallback(async (file) => {
    setFileName(file.name);
    setError(null);
    setIsProcessingPdf(true);
    setStatusMessage('A carregar motor de leitura...');
    setCandidateProfile(null);
    setAnalysis(null);

    try {
      let text = "";

      // Word (.docx)
      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        if (!window.mammoth) throw new Error("Aguarde o carregamento do módulo Word.");
        const buf = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
        text = result.value;
      } 
      // Imagens (.png, .jpg)
      else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        const b64 = await new Promise(res => {
          reader.onload = () => res(reader.result.split(',')[1]);
          reader.readAsDataURL(file);
        });
        text = await performVisualExtraction(b64, file.type);
      }
      // PDF
      else if (file.type === "application/pdf") {
        const pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) throw new Error("O motor PDF ainda não está pronto.");
        
        const buf = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        let fullText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('');
        }

        // Caso seja PDF escaneado (imagem)
        if (fullText.trim().length < 100) {
          setStatusMessage('PDF escaneado detectado. Iniciando OCR...');
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const imgB64 = canvas.toDataURL('image/png').split(',')[1];
          text = await performVisualExtraction(imgB64, 'image/png');
        } else {
          text = fullText;
        }
      } 
      // TXT ou fallback
      else {
        text = await file.text();
      }

      if (!text.trim()) throw new Error("Não foi detetado conteúdo textual.");
      setResumeText(text);
      await extractProfile(text);
    } catch (err) {
      setError(err.message || "Erro ao processar ficheiro.");
    } finally {
      setIsProcessingPdf(false);
      setStatusMessage('');
    }
  }, [extractProfile, performVisualExtraction]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // --- ANÁLISE E POWER-UPS ---

  const analyzeResume = useCallback(async () => {
    setLoading(true);
    setError(null);
    setStatusMessage('A gerar inteligência de carreira...');
    const sys = `Você é um Recrutador Sênior Crítico. Analise o CV contra a vaga. Se não houver salário, pesquise estimativas no Google (BRL). Retorne APENAS um JSON: { "matchPercentage": n, "jobExplanation": "s", "strongMatches": [], "toolsRequested": [], "collaborativeProfile": "s", "gaps": [], "objectiveEvaluation": [], "honestConclusion": "s", "salaryBRL": "s", "isEstimatedSalary": b }`;

    try {
      const data = await fetchGemini([{ text: `CV: ${resumeText}\nVAGA: ${jobDescription}` }], sys, false);
      const res = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAnalysis(safeJsonParse(res));
    } catch (err) {
      setError("A análise falhou. Tente novamente.");
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  }, [resumeText, jobDescription, fetchGemini, safeJsonParse]);

  const runPowerUp = useCallback(async (type) => {
    setAiActionLoading(type);
    const prompts = {
      optimizedBullets: "Reescreva conquistas do CV focando em métricas.",
      techQuestions: "Gere 4 perguntas técnicas difíceis sobre a vaga.",
      cultureDecoder: "Analise a cultura da empresa com base no tom da vaga.",
      coverLetter: "Escreva uma carta de apresentação persuasiva.",
      interview: "Simule perguntas comportamentais.",
      pitch: "Crie um pitch de 30s."
    };
    try {
      const data = await fetchGemini([{ text: `CV: ${resumeText}\nVaga: ${jobDescription}\nPedido: ${prompts[type]}` }], "Gere um texto profissional.", true);
      const res = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAiOutputs(prev => ({ ...prev, [type]: res }));
    } catch (e) {
      setError("Erro no Power-up.");
    } finally {
      setAiActionLoading(null);
    }
  }, [resumeText, jobDescription, fetchGemini]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-indigo-500/40 overflow-x-hidden pb-40">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-15%,#1e1b4b,transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto p-4 md:p-12 relative z-10">
        
        {/* Header Apple Style */}
        <header className="mb-16 text-center animate-in fade-in duration-1000">
          <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.3)] border border-white/10 mb-8 mx-auto rotate-3 hover:rotate-0 transition-all">
            <Zap className="text-white w-8 h-8 fill-current" />
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2">ResumeCritic <span className="text-indigo-500 italic">Pro</span></h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em]">Universal AI Career Engine</p>
        </header>

        {/* INPUTS CENTRALIZADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 items-start">
          
          {/* Card CV */}
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-[3rem] border border-zinc-800 p-10 shadow-2xl flex flex-col min-h-[500px] transition-all hover:border-zinc-700 relative group overflow-hidden">
            {candidateProfile ? (
              <div className="animate-in fade-in slide-in-from-left-4 duration-700 flex flex-col h-full">
                <div className="flex items-center gap-6 mb-10">
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-[1.5rem] flex items-center justify-center shadow-xl border border-white/10 group-hover:rotate-3 transition-transform">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold leading-tight truncate text-white">{candidateProfile.name}</h3>
                    <p className="text-zinc-500 text-[10px] font-bold truncate mt-1 uppercase tracking-widest">{candidateProfile.headline}</p>
                  </div>
                </div>
                
                <div className="space-y-8 flex-1">
                  <div className="flex gap-3 pb-8 border-b border-zinc-800/50 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full"><MapPin className="w-3 h-3" /> {candidateProfile.location}</div>
                    <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full"><Award className="w-3 h-3" /> {candidateProfile.experienceYears} EXP</div>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed italic text-center font-medium">"{candidateProfile.summary}"</p>
                </div>

                <button onClick={() => fileInputRef.current.click()} className="mt-10 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-all">
                  <RefreshCw className="w-4 h-4" /> Substituir Documento
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center animate-in zoom-in duration-500">
                <div 
                  className="w-24 h-24 bg-zinc-950 rounded-[2.5rem] flex items-center justify-center mb-10 border border-zinc-800 shadow-inner group-hover:border-indigo-500/40 transition-all cursor-pointer relative"
                  onClick={() => fileInputRef.current.click()}
                >
                  {isProcessingPdf ? <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /> : <Upload className="w-10 h-10 text-zinc-700 group-hover:text-white" />}
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight text-white uppercase tracking-widest">Enviar Currículo</h3>
                <p className="text-xs text-zinc-600 mb-10 max-w-[280px] leading-loose italic">PDF, Word, TXT ou Imagem do seu currículo.</p>
                <input type="file" className="hidden" accept=".pdf,.txt,.docx,.png,.jpg,.jpeg" onChange={handleFileUpload} ref={fileInputRef} />
                <button onClick={() => fileInputRef.current.click()} className="px-12 py-4 bg-white text-black rounded-full font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-2xl">
                  Seleccionar Arquivo
                </button>
              </div>
            )}
          </div>

          {/* Card Vaga */}
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-[3rem] border border-zinc-800 p-10 shadow-2xl flex flex-col min-h-[500px] transition-all hover:border-zinc-700 group">
            <div className="flex items-center gap-4 mb-10 justify-center">
              <div className="p-3 bg-blue-600/20 rounded-2xl"><Target className="text-blue-500 w-6 h-6" /></div>
              <h2 className="font-bold text-sm uppercase tracking-widest text-zinc-300">Dados da Oportunidade</h2>
            </div>

            {!isJobSubmitted ? (
              <div className="flex flex-col flex-1 animate-in slide-in-from-right-4 duration-500">
                <textarea 
                  className="w-full flex-1 p-7 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-sm resize-none leading-relaxed text-zinc-300 font-medium custom-scrollbar mb-8 shadow-inner"
                  placeholder="Cole aqui a descrição da vaga..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <button onClick={() => { if(jobDescription.trim()) setIsJobSubmitted(true); }} disabled={!jobDescription.trim()} className="w-full py-5 bg-white text-black rounded-full font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-zinc-200 transition-all shadow-xl">
                  Confirmar Vaga <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col flex-1 animate-in zoom-in-95 duration-500">
                <div className="flex-1 p-8 bg-black/40 border border-zinc-800 rounded-[2.5rem] relative group border-l-8 border-l-blue-600 mb-8 overflow-hidden">
                  <div className="flex items-center gap-3 text-[10px] font-black text-blue-500 uppercase mb-5 tracking-[0.3em]"><CheckCircle2 className="w-4 h-4" /> Sincronizado</div>
                  <div className="text-sm text-zinc-500 line-clamp-[12] leading-relaxed font-medium italic opacity-80">{jobDescription}</div>
                  <button onClick={() => { setIsJobSubmitted(false); setAnalysis(null); }} className="absolute top-6 right-6 p-2.5 bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl text-zinc-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"><Edit3 className="w-5 h-5" /></button>
                </div>
                <button onClick={analyzeResume} disabled={loading || !resumeText} className="w-full py-6 bg-indigo-600 text-white rounded-full font-black uppercase text-sm tracking-[0.4em] flex items-center justify-center gap-5 shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-zinc-800">
                  {loading ? <Loader2 className="animate-spin w-6 h-6" /> : <Zap className="w-6 h-6 fill-current text-indigo-300" />}
                  Executar Análise Crítica
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DASHBOARD */}
        <div className="mt-16 space-y-16 animate-in fade-in duration-1000">
          
          {error && (
            <div className="max-w-2xl mx-auto p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-3xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-4 animate-shake shadow-2xl">
              <AlertCircle className="w-6 h-6 shrink-0" /> {error}
            </div>
          )}

          {statusMessage && (
            <div className="max-w-md mx-auto flex items-center justify-center gap-4 p-5 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full shadow-2xl animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">{statusMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              <Skeleton className="h-64 rounded-[3rem]" />
              <Skeleton className="h-64 rounded-[3rem]" />
            </div>
          ) : analysis ? (
            <div className="space-y-16">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-zinc-900/50 backdrop-blur-xl p-12 rounded-[4rem] border border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.6em] mb-12">Match Score</span>
                  <div className="relative">
                    <svg className="w-52 h-52 transform -rotate-90">
                      <circle cx="104" cy="104" r="92" fill="transparent" stroke="#18181b" strokeWidth="20" />
                      <circle cx="104" cy="104" r="92" fill="transparent" stroke="currentColor" strokeWidth="20" strokeDasharray={578} strokeDashoffset={578 - (578 * (analysis.matchPercentage || 0)) / 100} strokeLinecap="round" className={`${getScoreColor(analysis.matchPercentage)} transition-all duration-[2000ms] ease-out shadow-[0_0_40px_currentColor]`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-8xl font-black tracking-tighter text-white leading-none">{analysis.matchPercentage}%</span></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-zinc-900 to-black p-12 rounded-[4rem] border border-zinc-800 shadow-2xl flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute -bottom-16 -right-16 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-2000 scale-[2] text-green-500"><DollarSign className="w-64 h-64" /></div>
                  <span className="text-[10px] font-black text-green-500/60 uppercase tracking-[0.6em] mb-8">Remuneração Estimada</span>
                  <p className="text-6xl font-black tracking-tight mb-10 text-white leading-none">{analysis.salaryBRL || "N/D"}</p>
                  <div className="flex items-center gap-4 px-7 py-3.5 bg-green-500/10 border border-green-500/20 rounded-full w-fit text-[11px] font-black uppercase text-green-400 tracking-[0.3em] backdrop-blur-md">
                    {analysis.isEstimatedSalary ? <Globe className="w-5 h-5 animate-pulse" /> : <RefreshCw className="w-5 h-5" />}
                    Sync Mercado
                  </div>
                </div>
              </div>

              {/* Power-Ups */}
              <div className="bg-zinc-900/30 backdrop-blur-3xl p-12 rounded-[4rem] border border-zinc-800 shadow-2xl">
                <div className="flex items-center gap-4 mb-16 justify-center">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-2xl flex items-center justify-center"><Sparkles className="text-indigo-400 w-5 h-5 fill-current" /></div>
                  <h3 className="font-black uppercase text-[12px] tracking-[0.6em] text-zinc-400 text-center">IA Career Booster ✨</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Object.keys(aiOutputs).concat(['optimizedBullets', 'techQuestions', 'cultureDecoder', 'coverLetter', 'interview', 'pitch']).filter((v, i, a) => a.indexOf(v) === i).slice(0,6).map(id => (
                    <button key={id} onClick={() => runPowerUp(id)} disabled={aiActionLoading} className="group p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] text-[10px] font-black uppercase text-zinc-400 hover:bg-white hover:text-black transition-all duration-500 flex flex-col items-center gap-6 shadow-xl active:scale-95">
                      <div className="p-5 bg-zinc-800 rounded-3xl group-hover:bg-black group-hover:text-white transition-colors shadow-inner flex items-center justify-center">
                        {aiActionLoading === id ? <Loader2 className="animate-spin w-7 h-7 text-indigo-500" /> : <Sparkles className="w-7 h-7" />}
                      </div>
                      {id.replace(/([A-Z])/g, ' $1').toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="space-y-8 mt-16 max-w-5xl mx-auto">
                  {Object.entries(aiOutputs).map(([key, value]) => value && (
                    <div key={key} className="p-12 bg-zinc-950 border border-zinc-800 rounded-[3.5rem] text-zinc-300 text-lg relative animate-in slide-in-from-top-6 shadow-2xl border-l-[12px] border-l-indigo-600 group">
                      <button onClick={() => setAiOutputs(prev => ({ ...prev, [key]: '' }))} className="absolute top-8 right-8 p-3 hover:bg-zinc-800 rounded-3xl text-zinc-600 transition-all opacity-0 group-hover:opacity-100"><XCircle className="w-7 h-7" /></button>
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.5em] mb-8 block">Output Gerado</span>
                      <div className="leading-loose whitespace-pre-wrap font-medium text-zinc-100">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusão Final */}
              <div className="bg-white p-20 rounded-[5rem] text-black relative shadow-2xl overflow-hidden border-b-[20px] border-indigo-600">
                <div className="absolute top-0 right-0 p-20 opacity-5 scale-[3] group-hover:rotate-12 transition-transform duration-2000"><Zap className="w-48 h-48" /></div>
                <div className="relative z-10 text-center">
                  <h3 className="font-black text-4xl mb-16 flex items-center justify-center gap-6">
                    <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center shadow-2xl rotate-3"><Zap className="text-white w-10 h-10 fill-current" /></div>
                    Conclusão Honesta
                  </h3>
                  <p className="text-zinc-800 leading-relaxed italic text-4xl font-bold tracking-tighter border-y-2 border-zinc-100 py-16 animate-in fade-in duration-2000">"{analysis.honestConclusion}"</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center border-4 border-dashed border-zinc-900 rounded-[5rem] bg-zinc-950/20 text-zinc-800 shadow-inner">
              <Layers className="w-16 h-16 opacity-5 mb-8" />
              <p className="font-black text-xs tracking-[0.6em] uppercase opacity-20">Aguardando Execução Profissional</p>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 20px; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}} />
    </div>
  );
};

export default App; 