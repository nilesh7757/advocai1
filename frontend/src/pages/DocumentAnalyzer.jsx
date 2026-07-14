import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Bot,
  MessageCircle,
  Send,
  FileText,
  Loader2,
  History,
  X,
  Sparkles,
  User,
  Copy,
  Check,
  ShieldAlert,
  Lightbulb,
  Users,
  DollarSign,
  Calendar,
  Clock,
  BookOpen,
  Maximize2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  uploadDocument as uploadDocumentApi, 
  getUserSessions as getUserSessionsApi, 
  getChatHistory as getChatHistoryApi, 
  sendChatMessage as sendChatMessageApi,
  deleteSession as deleteSessionApi,
  updateSessionTags as updateSessionTagsApi 
} from '../utils/api';

const SCORE_LABELS = {
  5: 'Critical',
  4: 'High',
  3: 'Medium',
  2: 'Low',
  1: 'Minimal',
};

const coerceRiskScore = (value) => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  return Math.min(5, Math.max(1, Math.round(numeric)));
};

const getRiskDisplay = (clause) => {
  const score = coerceRiskScore(clause?.risk_score ?? clause?.riskScore);
  const level = clause?.risk_level || clause?.riskLevel || (score ? SCORE_LABELS[score] : null);
  return {
    score,
    level: level || 'High',
  };
};

const getMitigation = (clause) => (clause?.mitigation || clause?.suggestion || clause?.recommendation || clause?.proposed_change || clause?.proposedChange || '').trim();

const getReplacementClause = (clause) => (clause?.replacement_clause || clause?.replacementClause || clause?.alternate_clause || clause?.alternateClause || clause?.alternative_clause || clause?.alternativeClause || '').trim();

const DocumentAnalyzer = () => {
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [comprehensiveSummary, setComprehensiveSummary] = useState(null); // NEW: Structured detailed summary
  const [comprehensiveSummaryLoading, setComprehensiveSummaryLoading] = useState(false); // Loading state
  const [showDetailedSummary, setShowDetailedSummary] = useState(false); // Toggle for detailed view
  const [highlightedPreview, setHighlightedPreview] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [highRiskClauses, setHighRiskClauses] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [editingSessionTagsId, setEditingSessionTagsId] = useState(null);
  const [newTagsInput, setNewTagsInput] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');
  const [isSummaryCopied, setIsSummaryCopied] = useState(false); // New state for copy status
  const [expandedSection, setExpandedSection] = useState(null); // Modal state: 'preview', 'analysis', 'chat', or null
  const [severityFilter, setSeverityFilter] = useState('All'); // Severity filter: 'All', 'Critical', 'High', 'Medium', 'Low'
  const [activeClauseIndex, setActiveClauseIndex] = useState(null); // Clicked highlighted clause index
  const [showFullSummary, setShowFullSummary] = useState(false); // Collapsible top bar summary toggle
  const [chatOpen, setChatOpen] = useState(true); // Collapsible chat drawer


  const resetForNewDocument = () => {
    setUploadedFile(null);
    setSummary('');
    setComprehensiveSummary(null);
    setComprehensiveSummaryLoading(false);
    setShowDetailedSummary(false);
    setHighlightedPreview('');
    setPreviewText('');
    setHighRiskClauses([]);
    setSessionId(null);
    setChatHistory([]);
    setError('');
    setSeverityFilter('All');
    setActiveClauseIndex(null);
    setShowFullSummary(false);
    setChatOpen(false);
  };

  const handleSaveTags = async (sessionIdToSave) => {
    try {
      const tagList = newTagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
        
      await updateSessionTagsApi(sessionIdToSave, tagList);
      
      setSessions((prevSessions) =>
        prevSessions.map((s) => {
          if ((s.id ?? s._id) === sessionIdToSave) {
            return { ...s, tags: tagList };
          }
          return s;
        })
      );
      
      toast.success('Tags updated successfully!');
      setEditingSessionTagsId(null);
    } catch (err) {
      console.error('Error saving tags:', err);
      toast.error('Failed to update tags.');
    }
  };

  const handleDeleteSession = async (e, sessionIdToDelete) => {
    e.stopPropagation(); // Prevent opening the session when clicking delete
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      await deleteSessionApi(sessionIdToDelete);
      // Remove from state
      setSessions((prev) => prev.filter((s) => (s.id ?? s._id) !== sessionIdToDelete));
      // If deleted session was the currently open one, reset state
      if (sessionId === sessionIdToDelete) {
        setSessionId(null);
        setSummary('');
        setHighlightedPreview('');
        setPreviewText('');
        setHighRiskClauses([]);
        setChatHistory([]);
        setComprehensiveSummary(null);
        setUploadedFile(null);
        setError('');
      }
      toast.success("Session deleted successfully");
    } catch (err) {
      console.error("Failed to delete session:", err);
      toast.error("Failed to delete session");
    }
  };

  const handleCopySummary = () => {
    const riskSection = highRiskClauses.length
      ? ['High Risk Clauses:', ...highRiskClauses.map((clause, index) => {
          const { score, level } = getRiskDisplay(clause);
          const badge = score ? `${level} (${score}/5)` : level;
          const text = clause?.clause_text || clause?.clauseText || '';
          const rationale = clause?.rationale || clause?.reason || '';
          const mitigation = getMitigation(clause);
          const replacement = getReplacementClause(clause);
          const clauseLine = text ? `${index + 1}. [${badge}] ${text}` : `${index + 1}. [${badge}]`;
          const rationaleLine = rationale ? `${clauseLine} — ${rationale}` : clauseLine;
          const mitigationLine = mitigation ? `${rationaleLine}\n   Mitigation: ${mitigation}` : rationaleLine;
          return replacement ? `${mitigationLine}\n   Alternate Clause: ${replacement}` : mitigationLine;
        })].join('\n')
      : 'High Risk Clauses: None flagged.';

    const copyPayload = [summary, '', riskSection].filter(Boolean).join('\n').trim();
    navigator.clipboard.writeText(copyPayload);
    setIsSummaryCopied(true);
    setTimeout(() => setIsSummaryCopied(false), 2000); // Reset after 2 seconds
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    setUploadedFile(file);
    setError('');
    setUploading(true);
    setSummary('');
    setHighlightedPreview('');
    setPreviewText('');
    setHighRiskClauses([]);

    try {
      const response = await uploadDocumentApi(file);

      const previewHtml = response?.highlighted_preview ?? response?.highlightedPreview ?? '';
      const previewPlain = response?.preview_text ?? response?.previewText ?? '';
      const riskClausesRaw = response?.high_risk_clauses ?? response?.highRiskClauses ?? response?.risk_clauses ?? [];

      setHighlightedPreview(previewHtml || '');
      setPreviewText(previewPlain || '');
      setHighRiskClauses(Array.isArray(riskClausesRaw) ? riskClausesRaw : []);

      // Accept multiple possible shapes from backend
      const receivedSummary = response?.summary ?? response?.data?.summary ?? '';
      const receivedComprehensiveSummary = response?.comprehensive_summary ?? response?.data?.comprehensive_summary ?? null;
      const receivedSessionId = response?.session_id ?? response?.sessionId ?? null;

      // Store comprehensive summary if available
      setComprehensiveSummaryLoading(false);
      if (receivedComprehensiveSummary) {
        setComprehensiveSummary(receivedComprehensiveSummary);
        console.log('✅ Comprehensive summary received:', receivedComprehensiveSummary);
      } else {
        console.log('⚠️ No comprehensive_summary in response. Keys:', Object.keys(response || {}));
        console.log('Full response:', response);
      }

      // If backend didn't provide a session id, create a client-side one so chat works
      const finalSessionId = receivedSessionId ?? `local-${Date.now()}`;
      setSessionId(finalSessionId);

      if (receivedSummary) {
        setSummary(receivedSummary);
        setChatHistory([
          {
            id: Date.now(),
            sender: 'AdvocAI',
            message:
              "Hi! I've analyzed your document. Feel free to ask me any questions about the terms, risks, or anything else you'd like to understand better.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else {
        // If there's no summary but upload succeeded, show a friendly placeholder
        setSummary(response?.summary_preview ?? response?.summaryPreview ?? 'No summary available');
        setChatHistory([
          {
            id: Date.now(),
            sender: 'AdvocAI',
            message: "Document uploaded successfully. Ask a question to start the analysis.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      // better extraction of error text
      const message = err?.response?.data?.error || err?.message || 'Failed to upload document';
      setError(message);
      setUploadedFile(null);
      setHighlightedPreview('');
      setPreviewText('');
      setHighRiskClauses([]);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        // reuse same handler shape
        handleFileUpload({ target: { files: dataTransfer.files } });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !sessionId) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setLoading(true);

    const newUserMessage = {
      id: Date.now(),
      sender: 'User',
      message: userMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatHistory((prev) => [...prev, newUserMessage]);

    try {
      const response = await sendChatMessageApi(sessionId, userMessage);
      const aiText = response?.response ?? response?.message ?? response?.text ?? response?.data?.text ?? '';

      if (aiText) {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'AdvocAI',
          message: aiText,
          timestamp: new Date().toLocaleTimeString(),
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || err?.message || 'Failed to send message';
      setError(message);
      // remove the optimistic user message
      setChatHistory((prev) => prev.filter((m) => m.id !== newUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        document.body.style.overflow = '';
      } else if (sidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    if (sidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await getUserSessionsApi();
      const list = Array.isArray(response) ? response : response?.sessions ?? response?.data?.sessions ?? [];
      setSessions(list);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const openSession = async (session) => {
    if (!session) return;
    setSessionId(session.id ?? session._id ?? `session-${Date.now()}`);
    setSidebarOpen(false);
    setLoading(true);
    setSeverityFilter('All');
    setActiveClauseIndex(null);
    setShowFullSummary(false);
    setChatOpen(false);
    try {
      const data = await getChatHistoryApi(session.id ?? session._id ?? session.sessionId);
      const sessionInfo = data?.session ?? data ?? {};
      const messagesRaw = data?.messages ?? data?.messages_list ?? [];

      const messages = (messagesRaw || []).map((m, idx) => ({
        id: m.id ?? m._id ?? idx + 1,
        sender: (m.sender || m.role || '').toLowerCase() === 'user' ? 'User' : 'AdvocAI',
        message: m.text || m.message || '',
        timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
      }));

      setChatHistory(messages);
      const sessionSummary = sessionInfo.summary ?? session.summary ?? session.summary_preview ?? '';
      setSummary(sessionSummary || '');
      
      // Load comprehensive summary if available
      const sessionComprehensiveSummary = sessionInfo.comprehensive_summary ?? session.comprehensive_summary ?? null;
      if (sessionComprehensiveSummary) {
        setComprehensiveSummary(sessionComprehensiveSummary);
      }

      const sessionPreviewHtml = sessionInfo.highlighted_preview ?? session.highlighted_preview ?? '';
      const sessionPreviewPlain = sessionInfo.preview_text ?? session.document_preview ?? session.document_text ?? '';
      const sessionRiskClauses = sessionInfo.high_risk_clauses ?? session.high_risk_clauses ?? [];

      setHighlightedPreview(sessionPreviewHtml || '');
      setPreviewText(sessionPreviewPlain || '');
      setHighRiskClauses(Array.isArray(sessionRiskClauses) ? sessionRiskClauses : []);
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || err?.message || 'Failed to load session';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const hasAnalysis = Boolean(summary || highlightedPreview || highRiskClauses.length);

  // Severity filter counts
  const allCount = highRiskClauses.length;
  const criticalCount = highRiskClauses.filter(c => getRiskDisplay(c).level === 'Critical').length;
  const highCount = highRiskClauses.filter(c => getRiskDisplay(c).level === 'High').length;
  const mediumCount = highRiskClauses.filter(c => getRiskDisplay(c).level === 'Medium').length;
  const lowCount = highRiskClauses.filter(c => getRiskDisplay(c).level === 'Low').length;

  // Filtered high-risk clauses based on severity chip selection
  const filteredRiskClauses = highRiskClauses.filter(clause => {
    if (severityFilter === 'All') return true;
    const { level } = getRiskDisplay(clause);
    return level.toLowerCase() === severityFilter.toLowerCase();
  });

  // Client-side PDF printable view layout builder
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Legal Analysis Report - AdvocAI</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1c1c24; line-height: 1.6; }
            h1 { font-size: 24px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; font-weight: 700; }
            h2 { font-size: 18px; margin-top: 30px; color: #27272a; border-bottom: 1px solid #e4e4e7; padding-bottom: 5px; }
            .summary { background: #f4f4f5; padding: 20px; border-radius: 8px; font-size: 14px; margin-bottom: 25px; }
            .clause-card { border: 1px solid #e4e4e7; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 15px; border-radius: 6px; }
            .clause-title { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #71717a; }
            .clause-text { font-style: italic; margin: 10px 0; font-size: 14px; color: #3f3f46; background: #fafafa; padding: 10px; border-radius: 4px; }
            .clause-rationale { font-size: 13px; color: #52525b; margin-top: 10px; }
            .clause-mitigation { background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 13px; color: #1e3a8a; }
          </style>
        </head>
        <body>
          <h1>AdvocAI Legal Analysis Report</h1>
          <p><strong>Document Title:</strong> ${uploadedFile?.name || 'Document Analysis'}</p>
          <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          
          <h2>Executive Summary</h2>
          <div class="summary">${summary || 'No summary available.'}</div>
          
          <h2>Flagged High-Risk Clauses (${highRiskClauses.length})</h2>
          ${highRiskClauses.length > 0 ? highRiskClauses.map((clause, idx) => {
            const { level } = getRiskDisplay(clause);
            const text = clause?.clause_text || clause?.clauseText || '';
            const rationale = clause?.rationale || clause?.reason || '';
            const mitigation = getMitigation(clause);
            const replacement = getReplacementClause(clause);
            return `
              <div class="clause-card" style="border-left-color: ${level === 'Critical' || level === 'High' ? '#ef4444' : level === 'Medium' ? '#f97316' : '#3b82f6'}">
                <div class="clause-title">Clause ${idx + 1} — Risk Level: ${level}</div>
                ${text ? `<div class="clause-text">"${text}"</div>` : ''}
                ${rationale ? `<div class="clause-rationale"><strong>Rationale:</strong> ${rationale}</div>` : ''}
                ${mitigation ? `<div class="clause-mitigation"><strong>Suggested Change:</strong> ${mitigation}</div>` : ''}
                ${replacement ? `<div class="clause-mitigation" style="background:#f0fdf4; border-color:#bbf7d0; color:#14532d;"><strong>Alternate Clause:</strong> ${replacement}</div>` : ''}
              </div>
            `;
          }).join('') : '<p>No high-risk clauses flagged.</p>'}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Scroll to targeted highlight segment inside document viewer
  const scrollToHighlight = (index) => {
    setActiveClauseIndex(index);
    const element = document.getElementById(`highlight-mark-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.remove('animate-pulse');
      void element.offsetWidth; // trigger reflow to restart animation
      element.classList.add('animate-pulse');
      setTimeout(() => {
        element.classList.remove('animate-pulse');
      }, 1800);
    }
  };

  // Render plaintext with highlights mapped to click/scroll triggers
  const renderHighlightedText = () => {
    if (!previewText) {
      return <p className="text-muted-foreground italic text-center py-12">No document content loaded.</p>;
    }

    const clauseMatches = [];
    filteredRiskClauses.forEach((clause, index) => {
      const clauseText = clause?.clause_text || clause?.clauseText || '';
      if (!clauseText) return;
      
      let startIdx = previewText.indexOf(clauseText);
      while (startIdx !== -1) {
        clauseMatches.push({
          start: startIdx,
          end: startIdx + clauseText.length,
          clause,
          originalIndex: index
        });
        startIdx = previewText.indexOf(clauseText, startIdx + 1);
      }
    });

    clauseMatches.sort((a, b) => a.start - b.start);

    // Overlap resolution
    const nonOverlappingMatches = [];
    let lastEnd = 0;
    for (const match of clauseMatches) {
      if (match.start >= lastEnd) {
        nonOverlappingMatches.push(match);
        lastEnd = match.end;
      }
    }

    const nodes = [];
    let currentPos = 0;
    
    nonOverlappingMatches.forEach((match, idx) => {
      if (match.start > currentPos) {
        nodes.push(
          <span key={`text-${idx}`}>
            {previewText.substring(currentPos, match.start)}
          </span>
        );
      }

      const { level } = getRiskDisplay(match.clause);
      const isSelected = activeClauseIndex === match.originalIndex;
      
      let highlightBg = 'bg-yellow-500/15 border-yellow-500/40 hover:bg-yellow-500/25 text-foreground';
      if (level === 'Critical' || level === 'High') {
        highlightBg = 'bg-destructive/15 border-destructive/40 hover:bg-destructive/25 text-foreground';
      } else if (level === 'Medium') {
        highlightBg = 'bg-orange-500/15 border-orange-500/40 hover:bg-orange-500/25 text-foreground';
      }

      nodes.push(
        <span
          key={`highlight-${idx}`}
          id={`highlight-mark-${match.originalIndex}`}
          onClick={() => {
            setActiveClauseIndex(match.originalIndex);
            const element = document.getElementById(`annotation-card-${match.originalIndex}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }}
          className={`cursor-pointer border-b-2 px-1 py-0.5 rounded transition-all duration-200 inline ${highlightBg} ${
            isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
          }`}
          title={`Click to view annotation: ${level} Risk`}
        >
          {previewText.substring(match.start, match.end)}
        </span>
      );
      
      currentPos = match.end;
    });

    if (currentPos < previewText.length) {
      nodes.push(
        <span key="text-end">
          {previewText.substring(currentPos)}
        </span>
      );
    }

    return (
      <div className="whitespace-pre-wrap font-serif text-base leading-relaxed text-foreground/90 tracking-wide max-w-[70ch] mx-auto p-4 select-text">
        {nodes}
      </div>
    );
  };

  const allUniqueTags = Array.from(
    new Set(sessions.flatMap(session => session.tags || []))
  ).sort();

  const filteredSessions = selectedTagFilter
    ? sessions.filter(session => (session.tags || []).includes(selectedTagFilter))
    : sessions;

  return (
    <div className="flex h-[calc(100vh-var(--navbar-height))] bg-background overflow-hidden relative">
      {/* Mobile Sidebar Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Left Sidebar - Collapsible History Sidebar */}
      <div className={`flex flex-col bg-card border-r border-border transition-all duration-300 ease-out flex-shrink-0 h-full ${
        sidebarOpen 
          ? 'w-80 translate-x-0' 
          : 'w-0 -translate-x-full md:w-16 md:translate-x-0'
      } z-40 md:relative fixed top-[var(--navbar-height)] md:top-0 bottom-0 left-0`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between overflow-hidden flex-shrink-0 h-16">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-semibold text-foreground truncate">Analysis History</h2>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                title="Collapse history"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground mx-auto hidden md:block"
              title="Expand history"
            >
              <History className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sidebar Session List */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar flex flex-col gap-2">
          {/* Tag filter block */}
          {sidebarOpen && sessions.length > 0 && (
            <div className="px-1 py-1 flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[9px] font-bold text-muted-foreground uppercase select-none">Tag Filter:</span>
              <select
                value={selectedTagFilter}
                onChange={(e) => setSelectedTagFilter(e.target.value)}
                className="flex-1 bg-background text-foreground text-[10px] font-semibold rounded border border-border px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="">All tags</option>
                {allUniqueTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          )}

          {loadingSessions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="space-y-1">
              {filteredSessions.map((session) => {
                const isSelected = sessionId === (session.id ?? session._id);
                return (
                  <div
                    key={session.id ?? session._id}
                    className="relative group w-full"
                  >
                    {sidebarOpen ? (
                      <div
                        onClick={() => openSession(session)}
                        className={`w-full text-left p-3 pr-10 rounded-lg border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-primary/20 shadow-sm'
                            : 'bg-transparent border-transparent hover:bg-muted hover:border-border'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground font-medium line-clamp-2 mb-1">
                              {session.summary_preview || session.title || 'Document Analysis'}
                            </p>
                            
                            {/* Session Tag pills */}
                            {session.tags && session.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {session.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="bg-muted text-muted-foreground text-[9px] font-bold rounded-full px-1.5 py-0.5 border border-border/40"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {editingSessionTagsId === (session.id ?? session._id) ? (
                              <div className="mt-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={newTagsInput}
                                  onChange={(e) => setNewTagsInput(e.target.value)}
                                  placeholder="NDA, Rental..."
                                  className="w-full bg-background border border-border text-[10px] rounded px-1 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSaveTags(session.id ?? session._id);
                                    } else if (e.key === 'Escape') {
                                      setEditingSessionTagsId(null);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveTags(session.id ?? session._id)}
                                  className="px-1 py-0.5 text-[10px] text-primary font-bold hover:bg-muted rounded cursor-pointer"
                                  title="Save"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingSessionTagsId(null)}
                                  className="px-1 py-0.5 text-[10px] text-muted-foreground font-bold hover:bg-muted rounded cursor-pointer"
                                  title="Cancel"
                                >
                                  ✗
                                </button>
                              </div>
                            ) : (
                              <div className="mt-1 flex items-center justify-between">
                                <span className="text-[9px] text-muted-foreground">
                                  {formatDate(session.created_at || session.createdAt || session.date)}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionTagsId(session.id ?? session._id);
                                    setNewTagsInput((session.tags || []).join(', '));
                                  }}
                                  className="text-[9px] text-primary hover:underline px-1 py-0.5 rounded hover:bg-muted cursor-pointer flex items-center gap-0.5 font-bold"
                                  title="Edit Tags"
                                >
                                  + Tag
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => openSession(session)}
                        className={`w-10 h-10 rounded-lg mx-auto flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted'
                        }`}
                        title={session.summary_preview || session.title || 'Document Analysis'}
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    
                    {sidebarOpen && (
                      <button
                        onClick={(e) => handleDeleteSession(e, session.id ?? session._id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-card border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : sidebarOpen ? (
            <div className="text-center py-12 px-4">
              <History className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No matching sessions</p>
            </div>
          ) : null}
        </div>

        {/* Sidebar New Session Button */}
        <div className="p-3 border-t border-border flex items-center justify-center flex-shrink-0">
          {sidebarOpen ? (
            <button
              onClick={resetForNewDocument}
              className="w-full py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium shadow-sm transition-all duration-200 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Analysis</span>
            </button>
          ) : (
            <button
              onClick={resetForNewDocument}
              className="w-10 h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center justify-center shadow-sm transition-all duration-200 cursor-pointer"
              title="New Analysis"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Middle Panel - Document Reading & Analysis Workspace */}
      <div className="flex-1 flex flex-col h-full bg-background min-w-0 relative">
        {!hasAnalysis ? (
          // Center Empty State / Upload Container
          <div className="w-full max-w-2xl mx-auto p-6 lg:p-12 flex-grow flex flex-col items-center justify-center space-y-8 animate-fade-in-up relative">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="absolute top-4 left-4 z-40 p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground md:hidden cursor-pointer shadow-sm animate-fade-in"
                title="Open history"
              >
                <History className="w-5 h-5" />
              </button>
            )}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">AI Document Analyzer</h1>
              <p className="text-sm text-muted-foreground">Upload legal documents for instant review, semantic analysis, and risk detection</p>
            </div>

            <div
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 w-full cursor-pointer ${
                dragActive ? 'border-primary bg-primary/10 scale-[1.02]' : uploadedFile ? 'border-primary/50 bg-card' : 'border-border hover:border-primary/50 hover:bg-muted/50 bg-card'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />

              <div className="p-8 sm:p-10 lg:p-12 text-center select-none">
                {uploading ? (
                  <div className="space-y-4">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                    <div>
                      <p className="text-base font-semibold text-foreground mb-1">Analyzing document terms...</p>
                      <p className="text-xs text-muted-foreground">Extracting clauses and measuring liabilities</p>
                    </div>
                  </div>
                ) : uploadedFile ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 text-primary rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-primary/20">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-base font-medium text-foreground mb-1">{uploadedFile.name}</p>
                      <p className="text-xs text-primary font-semibold">✓ Ready for analysis</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 text-primary rounded-2xl border border-primary/20 flex items-center justify-center w-16 h-16 mx-auto">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground mb-1">Drag and drop your document here</p>
                      <p className="text-xs text-muted-foreground mb-4">or click to browse your files</p>
                      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                        <span>Supports:</span>
                        <span className="px-2 py-0.5 bg-muted border border-border rounded font-mono">PDF</span>
                        <span className="px-2 py-0.5 bg-muted border border-border rounded font-mono">DOCX</span>
                        <span className="px-2 py-0.5 bg-muted border border-border rounded font-mono">TXT</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="m-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
                  <p className="text-destructive text-sm font-medium">{error}</p>
                </div>
              )}
            </div>

            {/* 3 supporting core feature calls */}
            <div className="grid grid-cols-3 gap-6 w-full pt-4 border-t border-border">
              <div className="text-center space-y-1">
                <div className="text-primary font-semibold text-sm flex items-center justify-center gap-1 select-none">
                  <span>✓</span> Instant Analysis
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">Parse clauses and terms in seconds</p>
              </div>
              <div className="text-center space-y-1">
                <div className="text-primary font-semibold text-sm flex items-center justify-center gap-1 select-none">
                  <span>✓</span> Risk Detection
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">Unmask unfavorable and missing terms</p>
              </div>
              <div className="text-center space-y-1">
                <div className="text-primary font-semibold text-sm flex items-center justify-center gap-1 select-none">
                  <span>✓</span> Plain English
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">Deconstruct legalese into readable notes</p>
              </div>
            </div>
          </div>
        ) : (
          // Redesigned Active Workspace
          <>
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 flex-shrink-0 bg-card select-none">
              <div className="min-w-0 flex items-center gap-3">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-1.5 hover:bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground md:hidden cursor-pointer shadow-sm"
                    title="Open history"
                  >
                    <History className="w-4.5 h-4.5" />
                  </button>
                )}
                <div>
                  <h2 className="text-base font-bold text-foreground truncate">{uploadedFile?.name || 'Document Analysis'}</h2>
                  <p className="text-xs text-muted-foreground">Interactive annotations & risk reports</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export Analysis Report to PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
                <button
                  onClick={resetForNewDocument}
                  className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold text-xs transition-all cursor-pointer"
                >
                  New Document
                </button>
                {!chatOpen && (
                  <button
                    onClick={() => setChatOpen(true)}
                    className="p-1.5 hover:bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shadow-sm"
                    title="Open AI Chat"
                  >
                    <MessageCircle className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Executive Summary bar */}
            <div className="bg-card border-b border-border px-6 py-3 flex-shrink-0 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0 flex-1 select-none">
                  <span className="font-semibold text-foreground flex-shrink-0">Executive Summary:</span>
                  <span className="truncate">{summary || 'No summary available.'}</span>
                </div>
                <button
                  onClick={() => setShowFullSummary(!showFullSummary)}
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer flex-shrink-0 ml-4 select-none"
                >
                  <span>{showFullSummary ? 'Collapse' : 'Expand'} Summary</span>
                  {showFullSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showFullSummary && (
                <div className="mt-3 border-t border-border pt-4 max-h-[30vh] overflow-y-auto custom-scrollbar text-xs space-y-4 text-muted-foreground leading-relaxed">
                  {comprehensiveSummary ? (
                    <div className="space-y-4">
                      {comprehensiveSummary.executive_summary && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                          <p className="text-foreground font-bold mb-1">Executive Summary</p>
                          <p className="whitespace-pre-wrap">{comprehensiveSummary.executive_summary}</p>
                        </div>
                      )}
                      
                      {comprehensiveSummary.parties && comprehensiveSummary.parties.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-foreground mb-1.5">Parties Involved</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {comprehensiveSummary.parties.map((party, idx) => (
                              <div key={idx} className="bg-muted border border-border rounded-lg p-2.5 text-[11px]">
                                <span className="font-bold text-foreground">{party.name}</span>
                                <span className="text-primary block font-medium mt-0.5">{party.role}</span>
                                {party.simple_explanation && <p className="text-muted-foreground mt-1 font-sans">{party.simple_explanation}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {comprehensiveSummary.purpose && (
                        <div>
                          <h5 className="font-semibold text-foreground mb-1">Purpose</h5>
                          <p>{comprehensiveSummary.purpose}</p>
                        </div>
                      )}

                      {comprehensiveSummary.key_obligations && Object.keys(comprehensiveSummary.key_obligations).length > 0 && (
                        <div>
                          <h5 className="font-semibold text-foreground mb-1.5">Key Obligations</h5>
                          <div className="space-y-2">
                            {Object.entries(comprehensiveSummary.key_obligations).map(([party, obligation], idx) => (
                              <div key={idx} className="bg-muted border border-border rounded-lg p-2 text-[11px]">
                                <span className="font-bold text-foreground">{party}</span>
                                <p className="text-muted-foreground mt-0.5 leading-normal">{obligation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {comprehensiveSummary.financial_terms && comprehensiveSummary.financial_terms.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-foreground mb-1.5">Financial Terms</h5>
                          <div className="space-y-2">
                            {comprehensiveSummary.financial_terms.map((term, idx) => (
                              <div key={idx} className="bg-muted border border-border rounded-lg p-2 text-[11px]">
                                <div className="flex justify-between items-start font-medium">
                                  <span className="text-foreground">{term.item}</span>
                                  <span className="text-primary">{term.amount}</span>
                                </div>
                                {term.simple_explanation && <p className="text-muted-foreground mt-1 leading-normal">{term.simple_explanation}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {comprehensiveSummary.term_and_termination && (
                        <div>
                          <h5 className="font-semibold text-foreground mb-1.5">Term & Termination</h5>
                          <div className="bg-muted border border-border rounded-lg p-2.5 space-y-1">
                            <div><span className="font-bold text-foreground">Duration:</span> {comprehensiveSummary.term_and_termination.duration}</div>
                            {comprehensiveSummary.term_and_termination.renewal_terms && (
                              <div><span className="font-bold text-foreground">Renewal:</span> {comprehensiveSummary.term_and_termination.renewal_terms}</div>
                            )}
                            {comprehensiveSummary.term_and_termination.termination_process && (
                              <div><span className="font-bold text-foreground">Process:</span> {comprehensiveSummary.term_and_termination.termination_process}</div>
                            )}
                            {comprehensiveSummary.term_and_termination.simple_explanation && (
                              <p className="text-muted-foreground pt-1.5 border-t border-border mt-1.5 leading-normal">{comprehensiveSummary.term_and_termination.simple_explanation}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {comprehensiveSummary.legal_terms_explained && comprehensiveSummary.legal_terms_explained.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-foreground mb-1.5">Plain English Definitions</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {comprehensiveSummary.legal_terms_explained.map((item, idx) => (
                              <div key={idx} className="bg-primary/5 border border-primary/10 rounded-lg p-2">
                                <span className="font-bold text-foreground block">{item.term}</span>
                                <p className="text-muted-foreground mt-0.5 leading-normal">{item.meaning}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{summary}</p>
                  )}
                </div>
              )}
            </div>

            {/* Severity Filter Chips row */}
            <div className="px-6 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between flex-shrink-0 select-none">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar min-w-0">
                <span className="text-xs font-semibold text-muted-foreground mr-1.5">Severity Filter:</span>
                {[
                  { id: 'All', label: 'All Risks', count: allCount, color: 'bg-muted border-border hover:bg-border text-foreground' },
                  { id: 'Critical', label: 'Critical', count: criticalCount, color: 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20 text-destructive' },
                  { id: 'High', label: 'High', count: highCount, color: 'bg-destructive/10 border-destructive/20 hover:bg-destructive/15 text-destructive' },
                  { id: 'Medium', label: 'Medium', count: mediumCount, color: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15 text-orange-600 dark:text-orange-500' },
                  { id: 'Low', label: 'Low', count: lowCount, color: 'bg-primary/10 border-primary/20 hover:bg-primary/15 text-primary' }
                ].map((chip) => {
                  const isSelected = severityFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => {
                        setSeverityFilter(chip.id);
                        setActiveClauseIndex(null);
                      }}
                      className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isSelected 
                          ? 'ring-2 ring-primary ring-offset-1 bg-card border-primary/40' 
                          : chip.color
                      }`}
                    >
                      <span>{chip.label}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-background border border-border/50 text-[10px]">{chip.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Content Area: Document pane left + Annotations pane right */}
            <div className="flex-1 flex overflow-hidden min-h-0 bg-background">
              {/* Left Column: Document Reading Pane */}
              <div className="flex-grow overflow-y-auto p-6 bg-card border-r border-border custom-scrollbar flex flex-col items-center">
                <div className="w-full max-w-[70ch] py-4">
                  {renderHighlightedText()}
                </div>
              </div>

              {/* Right Column: Side Annotations Pane */}
              <div className="w-[340px] overflow-y-auto p-4 bg-muted/10 border-l border-border custom-scrollbar flex-shrink-0 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5 select-none">
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  <span>Flagged Risks ({filteredRiskClauses.length})</span>
                </h4>
                
                {filteredRiskClauses.length > 0 ? (
                  filteredRiskClauses.map((clause, idx) => {
                    const { score, level } = getRiskDisplay(clause);
                    const isSelected = activeClauseIndex === idx;
                    const text = clause?.clause_text || clause?.clauseText || '';
                    const rationale = clause?.rationale || clause?.reason || '';
                    const mitigation = getMitigation(clause);
                    const replacement = getReplacementClause(clause);
                    
                    return (
                      <div
                        key={`annotation-card-${idx}`}
                        id={`annotation-card-${idx}`}
                        onClick={() => scrollToHighlight(idx)}
                        className={`p-4 rounded-xl border bg-card transition-all duration-200 cursor-pointer flex flex-col gap-2.5 shadow-sm ${
                          isSelected 
                            ? 'border-primary ring-1 ring-primary' 
                            : 'border-border hover:border-border/80'
                        }`}
                      >
                        <div className="flex items-center justify-between select-none">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                            level === 'Critical' || level === 'High' 
                              ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                              : level === 'Medium' 
                                ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' 
                                : 'bg-primary/10 text-primary border border-primary/20'
                          }`}>
                            {level} Risk {score ? `• ${score}/5` : ''}
                          </span>
                          {isSelected && <span className="text-[10px] text-primary font-semibold">Matched highlight</span>}
                        </div>
                        
                        {text && (
                          <p className="text-xs text-muted-foreground font-serif leading-relaxed italic border-l-2 border-border pl-2.5 py-0.5 select-text">
                            "{text.length > 140 ? text.slice(0, 140) + '...' : text}"
                          </p>
                        )}
                        
                        {rationale && (
                          <div className="text-xs text-foreground/80 leading-normal select-text">
                            <span className="font-semibold block text-[11px] text-foreground uppercase tracking-wide mb-0.5 select-none">Rationale:</span>
                            {rationale}
                          </div>
                        )}
                        
                        {mitigation && (
                          <div className="bg-primary/5 border border-primary/25 rounded-lg p-2.5 text-xs select-text">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-primary mb-1 select-none">
                              <Lightbulb className="w-3.5 h-3.5" />
                              <span>Suggested Change</span>
                            </div>
                            <p className="text-muted-foreground leading-normal">{mitigation}</p>
                          </div>
                        )}

                        {replacement && (
                          <div className="bg-muted/50 border border-border rounded-lg p-2.5 text-xs mt-0.5 flex flex-col gap-2 select-text">
                            <div>
                              <span className="font-semibold block text-[11px] text-foreground uppercase tracking-wide select-none">Alternate Clause:</span>
                              <p className="text-muted-foreground mt-1 leading-normal font-serif">"{replacement}"</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(replacement);
                                toast.success("Alternate clause copied to clipboard!");
                              }}
                              className="self-end px-2.5 py-1 bg-card hover:bg-muted border border-border rounded text-[10px] font-medium text-foreground transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy Clause</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-card border border-border rounded-xl">
                    <Check className="w-8 h-8 text-primary bg-primary/10 p-1.5 rounded-full mb-2" />
                    <p className="text-xs font-semibold text-foreground">No Risks Flagged</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">No risks found for filter "{severityFilter}"</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Chat Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${
          chatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setChatOpen(false)}
      />

      {/* Right Column: AI Co-pilot Chat Interface */}
      <div className={`
        border-l border-border flex flex-col bg-card flex-shrink-0 z-40 select-none
        transition-all duration-300 ease-out
        fixed md:relative inset-y-0 md:inset-y-auto right-0 md:h-full
        top-[var(--navbar-height)] md:top-0
        ${chatOpen 
          ? 'translate-x-0 w-full sm:w-80 md:w-[380px] opacity-100' 
          : 'translate-x-full w-0 opacity-0 pointer-events-none'
        }
      `}>
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0 h-16 bg-muted/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-primary/10 text-primary rounded-lg flex-shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider truncate">Ask AdvocAI</h3>
              <p className="text-[10px] text-muted-foreground truncate">Interactive legal co-pilot</p>
            </div>
          </div>
          <button 
            onClick={() => setChatOpen(false)} 
            className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground flex-shrink-0"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/50 animate-fade-in">
          {chatHistory.map((message) => (
            <div key={message.id} className={`flex items-start gap-2.5 ${message.sender === 'User' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {message.sender !== 'User' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className="max-w-[82%]">
                <div className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  message.sender === 'User' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card text-foreground border border-border'
                }`}>
                  <p className="whitespace-pre-wrap break-words">{message.message}</p>
                </div>
              </div>
              {message.sender === 'User' && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-medium">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-border bg-card flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={sessionId ? "Ask co-pilot anything..." : "Upload a document to chat"}
              disabled={!sessionId || loading}
              className="flex-1 px-3 py-2.5 bg-background border border-input rounded-lg text-xs placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-w-0"
            />
            <button
              onClick={handleSendMessage}
              disabled={!sessionId || !chatMessage.trim() || loading}
              className="px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-semibold shadow-sm transition-all duration-205 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Send className="w-3.5 h-3.5" /><span>Send</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
