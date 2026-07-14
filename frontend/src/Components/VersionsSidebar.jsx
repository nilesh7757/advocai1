import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import { FileText, Download, Trash2, History, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { Button } from "@/Components/ui/button";
import { diffWords } from 'diff';

const VersionsSidebar = ({ conversationId, onSelectVersion, onClose, currentVersion, onDeleteVersion }) => { // Added onDeleteVersion prop
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documentTitle, setDocumentTitle] = useState('Document');

  const [isComparing, setIsComparing] = useState(false);
  const [compA, setCompA] = useState('');
  const [compB, setCompB] = useState('');
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffData, setDiffData] = useState([]);
  const [fetchingDiff, setFetchingDiff] = useState(false);

  const handleCompare = async () => {
    if (!compA || !compB) return;
    setFetchingDiff(true);
    try {
      const [resA, resB] = await Promise.all([
        axios.get(`/api/documents/conversations/${conversationId}/versions/${compA}/content/`),
        axios.get(`/api/documents/conversations/${conversationId}/versions/${compB}/content/`)
      ]);

      const contentA = resA.data.content || '';
      const contentB = resB.data.content || '';

      const diff = diffWords(contentA, contentB);
      setDiffData(diff);
      setShowDiffModal(true);
    } catch (err) {
      console.error('Error comparing versions:', err);
      toast.error('Failed to compare versions.');
    } finally {
      setFetchingDiff(false);
    }
  };

  const fetchDocumentVersions = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/documents/conversations/${conversationId}/`);
      setDocumentTitle(response.data.title || 'Document');
      setVersions(response.data.document_versions || []);
    } catch (err) {
      console.error('Error fetching document versions:', err);
      setError('Failed to load document versions.');
      toast.error('Failed to load document versions.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchDocumentVersions();
  }, [conversationId, fetchDocumentVersions]);

  const handleDownloadVersionPdf = async (versionNumber) => {
    try {
      const response = await axios.get(`utils/conversations/${conversationId}/versions/${versionNumber}/download-pdf/`, {
        responseType: 'blob',
      });
      const filename = `${documentTitle}_v${versionNumber}.pdf`;
      const blob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(blob, filename);
      toast.success(`Version ${versionNumber} PDF downloaded!`);
    } catch (err) {
      console.error(`Error downloading version ${versionNumber} PDF:`, err);
      toast.error(`Failed to download version ${versionNumber} PDF.`);
    }
  };

  const handleDownloadVersionDocx = async (versionNumber) => {
    try {
      const response = await axios.get(`utils/conversations/${conversationId}/versions/${versionNumber}/download-docx/`, {
        responseType: 'blob',
      });
      const filename = `${documentTitle}_v${versionNumber}.docx`;
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, filename);
      toast.success(`Version ${versionNumber} Word document downloaded!`);
    } catch (err) {
      console.error(`Error downloading version ${versionNumber} Word document:`, err);
      toast.error(`Failed to download version ${versionNumber} Word document.`);
    }
  };

  const handleDeleteVersionClick = async (versionNumber) => { // Renamed to avoid conflict with prop
    if (onDeleteVersion) {
      await onDeleteVersion(conversationId, versionNumber);
      fetchDocumentVersions(); // Re-fetch versions after deletion
    }
  };

  return (
    <>
      <div className="p-4 border-b border-border/10 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-primary" />
          <span className="text-foreground font-semibold text-sm">Version History</span>
        </div>
        <button 
          onClick={() => onClose()} 
          className="p-2 hover:bg-foreground/10 rounded-lg transition-all text-muted-foreground cursor-pointer"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Compare Mode Toggler & Setup */}
      <div className="px-3 py-2 border-b border-border/40 bg-muted/10 flex flex-col gap-2">
        <div className="flex items-center justify-between select-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Compare Versions</span>
          <button
            onClick={() => {
              setIsComparing(!isComparing);
              setCompA('');
              setCompB('');
            }}
            className="text-[10px] text-primary hover:underline font-bold bg-transparent border-0 cursor-pointer"
          >
            {isComparing ? 'Exit Compare' : 'Setup Compare'}
          </button>
        </div>

        {isComparing && (
          <div className="flex flex-col gap-2 mt-1 bg-card/60 p-2.5 rounded-lg border border-border">
            <div className="flex gap-2 items-center">
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="text-[9px] text-muted-foreground font-semibold">Version A</span>
                <select
                  value={compA}
                  onChange={(e) => setCompA(e.target.value)}
                  className="bg-background text-foreground text-[10px] rounded border border-border px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary w-full cursor-pointer font-medium"
                >
                  <option value="">Select</option>
                  {versions.map((v) => (
                    <option key={v.version_number} value={v.version_number}>
                      V{v.version_number}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-muted-foreground mt-4 font-bold select-none">vs</span>
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="text-[9px] text-muted-foreground font-semibold">Version B</span>
                <select
                  value={compB}
                  onChange={(e) => setCompB(e.target.value)}
                  className="bg-background text-foreground text-[10px] rounded border border-border px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary w-full cursor-pointer font-medium"
                >
                  <option value="">Select</option>
                  {versions.map((v) => (
                    <option key={v.version_number} value={v.version_number}>
                      V{v.version_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={handleCompare}
              disabled={fetchingDiff || !compA || !compB || compA === compB}
              size="sm"
              className="w-full text-[10px] font-bold h-7 py-0 mt-1 cursor-pointer animate-fadeIn"
            >
              {fetchingDiff ? 'Comparing...' : 'Compare Differences'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-3">
              <History className="w-6 h-6 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading versions...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-destructive text-center py-8 text-sm px-3">
            <p>{error}</p>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No versions found.</p>
          </div>
        ) : (
          versions.map((version) => {
            const isCurrentVersion = currentVersion === version.version_number;
            return (
              <div
                key={version.version_number}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isCurrentVersion
                    ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10'
                    : 'bg-card/40 border-border/50 hover:border-border/80 hover:bg-card/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-sm truncate">
                          Version {version.version_number}
                        </h3>
                        {isCurrentVersion && (
                          <Check className="w-4 h-4 text-accent flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        {new Date(version.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => onSelectVersion(version.version_number)}
                    size="sm"
                    className={`flex-1 text-xs font-medium rounded-lg transition-all ${
                      isCurrentVersion
                        ? 'bg-primary hover:bg-primary/80 text-foreground'
                        : 'bg-primary/80 hover:bg-primary text-foreground'
                    }`}
                  >
                    <FileText className="w-3 h-3 mr-1.5" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDownloadVersionPdf(version.version_number)}
                    size="sm"
                    variant="outline"
                    className="border-border/20 bg-card/40 hover:bg-card/60 hover:border-border/30 text-muted-foreground text-xs rounded-lg transition-all px-2"
                    title="Download PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDownloadVersionDocx(version.version_number)}
                    size="sm"
                    variant="outline"
                    className="border-border/20 bg-card/40 hover:bg-card/60 hover:border-border/30 text-muted-foreground text-xs rounded-lg transition-all px-2"
                    title="Download Word"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteVersionClick(version.version_number)} // Call the new handler
                    size="sm"
                    variant="outline"
                    className="border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs rounded-lg transition-all px-2"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comparison Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20 select-none">
              <div>
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Compare Versions</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Comparing <span className="font-bold text-foreground">Version {compA}</span> (Base) to <span className="font-bold text-foreground">Version {compB}</span> (Modified)
                </p>
              </div>
              <button
                onClick={() => setShowDiffModal(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-grow overflow-y-auto p-5 font-serif text-sm leading-relaxed whitespace-pre-wrap select-text custom-scrollbar bg-card text-foreground">
              {diffData.length > 0 ? (
                diffData.map((part, index) => {
                  if (part.added) {
                    return (
                      <span key={index} className="bg-primary/10 text-primary px-0.5 rounded font-medium border border-primary/20">
                        {part.value}
                      </span>
                    );
                  }
                  if (part.removed) {
                    return (
                      <span key={index} className="bg-destructive/10 text-destructive line-through px-0.5 rounded border border-destructive/20">
                        {part.value}
                      </span>
                    );
                  }
                  return <span key={index}>{part.value}</span>;
                })
              ) : (
                <p className="text-muted-foreground italic text-center py-12">No differences found.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border flex justify-end bg-muted/20 gap-2 select-none">
              <Button variant="outline" size="sm" onClick={() => setShowDiffModal(false)}>
                Close Comparison
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VersionsSidebar;