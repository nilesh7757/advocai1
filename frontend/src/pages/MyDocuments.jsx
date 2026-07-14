import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { 
  FileText, 
  Download, 
  Trash2, 
  PlusCircle, 
  Share2, 
  Edit, 
  Save, 
  XCircle, 
  Search, 
  Grid, 
  List, 
  MoreVertical, 
  Loader2,
  Pin,
  Eye
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/Components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/Select";
import ShareModal from '../Components/ShareModal';
import { useAuth } from '../context/AuthContext';

// Import Tiptap for Quick Preview markdown conversion
import { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

const MyDocuments = () => {
  const { user } = useAuth();
  const [myDocumentsList, setMyDocumentsList] = useState([]);
  const [sharedWithMeDocumentsList, setSharedWithMeDocumentsList] = useState([]);
  const [templatesList, setTemplatesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [editingDocId, setEditingDocId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('my_documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('modified');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('my_documents_view_mode') || 'grid');
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  // Pinning and selection state
  const [pinnedDocIds, setPinnedDocIds] = useState(() => JSON.parse(localStorage.getItem('pinned_document_ids') || '[]'));
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  // Preview modal state
  const [previewDocId, setPreviewDocId] = useState(null);
  const [previewContent, setPreviewContent] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/documents/conversations/');
      const allDocuments = response.data;

      const owned = [];
      const shared = [];

      allDocuments.forEach(doc => {
        if (doc.owner === user.username) {
          owned.push(doc);
        } else {
          const isSharedWithMe = doc.shared_with_users?.some(
            sharedUser => sharedUser.username === user.username
          );
          if (isSharedWithMe) {
            shared.push(doc);
          }
        }
      });

      setMyDocumentsList(owned);
      setSharedWithMeDocumentsList(shared);
      
      const templatesResponse = await axios.get('/api/documents/templates/');
      setTemplatesList(templatesResponse.data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents.');
      toast.error('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user, fetchDocuments]);

  // Reset selections and mode when switching tabs
  useEffect(() => {
    setSelectedDocIds([]);
    setIsMultiSelectMode(false);
  }, [activeTab]);

  const handleViewDocument = (documentId) => {
    navigate(`/document-creation/${documentId}`);
  };

  const handleUseTemplate = (template) => {
    navigate('/document-creation', {
      state: {
        templateId: template.id,
        templateContent: template.latest_document,
        templateVariables: template.variables,
        templateTitle: template.title
      }
    });
  };

  const handleDownloadPdf = async (documentId, title) => {
    try {
      const response = await axios.get(`api/utils/conversations/${documentId}/download-latest-pdf/`, {
        responseType: 'blob',
      });
      const { saveAs } = await import('file-saver');
      saveAs(response.data, `${title || 'legal_document'}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error('Failed to download PDF.');
    }
  };

  const handleDownloadDocx = async (documentId, title) => {
    try {
      const response = await axios.get(`api/utils/conversations/${documentId}/download-latest-docx/`, {
        responseType: 'blob',
      });
      const { saveAs } = await import('file-saver');
      saveAs(response.data, `${title || 'legal_document'}.docx`);
      toast.success('Word document downloaded successfully!');
    } catch (err) {
      console.error('Error downloading Word document:', err);
      toast.error('Failed to download Word document.');
    }
  };

  const handleEditClick = (docId, currentTitle) => {
    setEditingDocId(docId);
    setNewTitle(currentTitle);
  };

  const handleSaveTitle = async (docId) => {
    if (!newTitle.trim()) {
      toast.error('Document title cannot be empty.');
      return;
    }
    try {
      await axios.put(`api/documents/conversations/${docId}/`, { title: newTitle });
      toast.success('Document title updated!');
      setEditingDocId(null);
      setNewTitle('');
      fetchDocuments();
    } catch (err) {
      console.error('Error updating document title:', err);
      toast.error('Failed to update document title.');
    }
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    setNewTitle('');
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document and all its versions? This action cannot be undone.')) {
      try {
        await axios.delete(`api/documents/conversations/${documentId}/`);
        toast.success('Document deleted successfully!');
        setSelectedDocIds(prev => prev.filter(id => id !== documentId));
        fetchDocuments();
      } catch (err) {
        console.error('Error deleting document:', err);
        toast.error('Failed to delete document.');
      }
    }
  };

  const handleShareDocument = (doc) => {
    setSelectedDoc(doc);
    setIsShareModalOpen(true);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('my_documents_view_mode', mode);
  };

  const handleTemplateClick = (prompt) => {
    navigate('/document-creation', { state: { initialPrompt: prompt } });
  };

  const handleTogglePin = (docId) => {
    let updated;
    const isCurrentlyPinned = pinnedDocIds.includes(docId);
    if (isCurrentlyPinned) {
      updated = pinnedDocIds.filter(id => id !== docId);
      toast.success('Document unpinned.');
    } else {
      updated = [...pinnedDocIds, docId];
      toast.success('Document pinned to top.');
    }
    setPinnedDocIds(updated);
    localStorage.setItem('pinned_document_ids', JSON.stringify(updated));
  };

  const handleToggleSelect = (docId) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter(id => id !== docId));
    } else {
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  const handleSelectAll = (filteredList) => {
    const allIds = filteredList.map(doc => doc._id);
    const allSelected = allIds.every(id => selectedDocIds.includes(id));
    if (allSelected) {
      setSelectedDocIds(selectedDocIds.filter(id => !allIds.includes(id)));
    } else {
      const newSelection = Array.from(new Set([...selectedDocIds, ...allIds]));
      setSelectedDocIds(newSelection);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the ${selectedDocIds.length} selected documents? This action cannot be undone.`)) {
      try {
        setLoading(true);
        await Promise.all(selectedDocIds.map(docId => axios.delete(`api/documents/conversations/${docId}/`)));
        toast.success('Selected documents deleted successfully!');
        setSelectedDocIds([]);
        setIsMultiSelectMode(false);
        fetchDocuments();
      } catch (err) {
        console.error('Error executing bulk delete:', err);
        toast.error('Failed to delete some documents.');
        fetchDocuments();
      } finally {
        setLoading(false);
      }
    }
  };

  const convertMarkdownToHtml = (markdownContent) => {
    if (!markdownContent) return '';
    try {
      const tempEditor = new Editor({
        extensions: [
          StarterKit,
          Markdown,
          TextAlign.configure({ types: ['heading', 'paragraph'] }),
          Underline,
        ],
      });
      tempEditor.commands.setContent(markdownContent, false, { contentType: 'markdown' });
      const html = tempEditor.getHTML();
      tempEditor.destroy();
      return html;
    } catch (e) {
      console.error('Error converting markdown to HTML in preview:', e);
      return markdownContent;
    }
  };

  const handleOpenPreview = async (docId) => {
    setPreviewDocId(docId);
    setPreviewContent('');
    setPreviewLoading(true);
    try {
      const response = await axios.get(`/api/documents/conversations/${docId}/`);
      const conversation = response.data;
      
      let rawContent = '';
      if (conversation.document_versions && conversation.document_versions.length > 0) {
        const latestVersion = conversation.document_versions[conversation.document_versions.length - 1];
        rawContent = latestVersion.content || '';
      } else {
        rawContent = conversation.final_document || '';
      }

      // Check if content is already HTML or is markdown
      const isHtml = /<\/?[a-z][\s\S]*>/i.test(rawContent);
      const htmlContent = isHtml ? rawContent : convertMarkdownToHtml(rawContent);
      setPreviewContent(htmlContent);
    } catch (err) {
      console.error('Error loading preview:', err);
      toast.error('Failed to load document preview.');
      setPreviewDocId(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const getDocType = (title) => {
    const t = title.toLowerCase();
    if (t.includes('nda') || t.includes('non-disclosure')) return 'NDA';
    if (t.includes('rental') || t.includes('lease')) return 'Rental Agreement';
    if (t.includes('employment') || t.includes('offer')) return 'Employment';
    if (t.includes('contract')) return 'Contract';
    return 'Document';
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFilteredAndSortedList = (list) => {
    return list
      .filter(doc => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const isAPinned = pinnedDocIds.includes(a._id);
        const isBPinned = pinnedDocIds.includes(b._id);
        
        // Pinned status takes absolute priority
        if (isAPinned && !isBPinned) return -1;
        if (!isAPinned && isBPinned) return 1;

        if (sortBy === 'created') {
          return new Date(b.created_at) - new Date(a.created_at);
        } else if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else {
          const dateA = a.updated_at || a.created_at;
          const dateB = b.updated_at || b.created_at;
          return new Date(dateB) - new Date(dateA);
        }
      });
  };

  const myDocsFiltered = getFilteredAndSortedList(myDocumentsList);
  const sharedDocsFiltered = getFilteredAndSortedList(sharedWithMeDocumentsList);
  const currentTabFilteredList = activeTab === 'my_documents' ? myDocsFiltered : sharedDocsFiltered;
  const allCurrentSelected = currentTabFilteredList.length > 0 && currentTabFilteredList.every(doc => selectedDocIds.includes(doc._id));

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      {isShareModalOpen && selectedDoc && (
        <ShareModal
          documentId={selectedDoc._id}
          documentTitle={selectedDoc.title}
          initialSharedWithUsers={selectedDoc.shared_with_users || []}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Quick Preview Modal */}
      {previewDocId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setPreviewDocId(null)} />
          <div className="fixed inset-y-12 inset-x-6 md:inset-x-20 lg:inset-x-40 max-w-4xl mx-auto z-50 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20 select-none">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground truncate">
                  {myDocumentsList.find(d => d._id === previewDocId)?.title || sharedWithMeDocumentsList.find(d => d._id === previewDocId)?.title || 'Document Preview'}
                </h2>
              </div>
              <button
                onClick={() => setPreviewDocId(null)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar select-text">
              {previewLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Fetching document content...</p>
                </div>
              ) : previewContent ? (
                <div className="markdown-preview max-w-3xl mx-auto leading-relaxed py-4 select-text">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewContent) }} />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No content available for this document.
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/10 select-none">
              <Button
                variant="outline"
                onClick={() => setPreviewDocId(null)}
                className="border border-border bg-card hover:bg-muted text-xs cursor-pointer rounded-lg h-9 px-4"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  const docId = previewDocId;
                  setPreviewDocId(null);
                  if (activeTab === 'shared_with_me') {
                    navigate(`/documentShare/${docId}`);
                  } else {
                    handleViewDocument(docId);
                  }
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold cursor-pointer rounded-lg h-9 px-4"
              >
                Open Full Editor
              </Button>
            </div>
          </div>
        </>
      )}
      
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">All your legal documents in one place.</p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex-1 flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search documents by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-input border-border focus:ring-1 focus:ring-primary rounded-lg text-sm h-10 w-full"
              />
            </div>
            
            {/* Sort Select */}
            <div className="w-44 flex-shrink-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-card border border-border rounded-lg text-xs lg:text-sm h-10 cursor-pointer">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border">
                  <SelectItem value="modified">Recently modified</SelectItem>
                  <SelectItem value="created">Recently created</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Multiple Select Toggle */}
            {activeTab === 'my_documents' && myDocumentsList.length > 0 && (
              <button
                onClick={() => {
                  const newMode = !isMultiSelectMode;
                  setIsMultiSelectMode(newMode);
                  if (!newMode) {
                    setSelectedDocIds([]);
                  }
                }}
                className={`px-3 h-10 border rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm ${
                  isMultiSelectMode
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
                title="Enable multiple select"
              >
                <span>Bulk Select</span>
              </button>
            )}

            {/* Select All Action (Only visible when isMultiSelectMode is active) */}
            {isMultiSelectMode && currentTabFilteredList.length > 0 && activeTab === 'my_documents' && (
              <button
                onClick={() => handleSelectAll(currentTabFilteredList)}
                className="px-3 h-10 border border-border bg-card hover:bg-muted rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground flex-shrink-0 shadow-sm"
                title="Select all documents"
              >
                <input
                  type="checkbox"
                  checked={allCurrentSelected}
                  onChange={() => {}} // Handled by button click
                  className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer pointer-events-none"
                />
                <span>Select All</span>
              </button>
            )}

            {/* Grid/List View Toggle */}
            <div className="flex bg-muted p-1 rounded-lg border border-border flex-shrink-0">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <Button
            onClick={() => navigate('/document-creation')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 h-10 rounded-lg shadow-sm font-semibold flex-shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Create New Document</span>
          </Button>
        </div>

        {/* Tabs Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my_documents" className="flex items-center justify-center gap-2">
              <span>My Documents</span>
              <span className="px-1.5 py-0.5 text-xs bg-muted-foreground/10 dark:bg-muted-foreground/20 rounded-full font-medium text-muted-foreground">
                {myDocumentsList.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="shared_with_me" className="flex items-center justify-center gap-2">
              <span>Shared with Me</span>
              <span className="px-1.5 py-0.5 text-xs bg-muted-foreground/10 dark:bg-muted-foreground/20 rounded-full font-medium text-muted-foreground">
                {sharedWithMeDocumentsList.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center justify-center gap-2">
              <span>Templates</span>
              <span className="px-1.5 py-0.5 text-xs bg-muted-foreground/10 dark:bg-muted-foreground/20 rounded-full font-medium text-muted-foreground">
                {templatesList.length}
              </span>
            </TabsTrigger>
          </TabsList>
          
          {/* My Documents Tab Content */}
          <TabsContent value="my_documents">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Loading your documents...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 text-destructive text-sm font-medium">
                <p>{error}</p>
              </div>
            ) : myDocsFiltered.length === 0 ? (
              <div className="text-center py-16 space-y-6 max-w-lg mx-auto">
                <div className="p-4 bg-primary/10 rounded-full text-primary w-16 h-16 flex items-center justify-center mx-auto border border-primary/20">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">No documents yet</h3>
                  <p className="text-sm text-muted-foreground leading-normal">
                    Create your first legal document to get started
                  </p>
                </div>
                
                {/* Template chips */}
                <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                  {[
                    { label: "Draft an NDA", prompt: "Draft a Non-Disclosure Agreement (NDA)" },
                    { label: "Create a rental agreement", prompt: "Create a rental agreement" },
                    { label: "Generate a freelance contract", prompt: "Generate a freelance contract" },
                    { label: "Employment offer letter", prompt: "Draft an employment offer letter" }
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleTemplateClick(chip.prompt)}
                      className="px-4 py-2 bg-card hover:bg-muted border border-border rounded-full text-sm font-medium transition-colors cursor-pointer text-foreground shadow-sm"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid gap-6 md:grid-cols-2">
                  {myDocsFiltered.map((doc) => {
                    const isPinned = pinnedDocIds.includes(doc._id);
                    const isSelected = selectedDocIds.includes(doc._id);
                    
                    return (
                      <Card key={doc._id} className={`bg-card border shadow-sm hover:shadow transition-all duration-300 flex flex-col relative justify-between overflow-visible ${
                        isPinned ? 'border-primary/40 ring-1 ring-primary/10' : 'border-border'
                      }`}>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 pb-2">
                              <div className="flex items-start gap-2.5 min-w-0 flex-grow">
                                {/* Bulk Selection Checkbox with sliding transition */}
                                <div className={`transition-all duration-300 ease-in-out flex items-center ${isMultiSelectMode ? 'w-6 opacity-100 mr-2.5' : 'w-0 opacity-0 overflow-hidden mr-0'}`}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelect(doc._id)}
                                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer flex-shrink-0"
                                  />
                                </div>
                                
                                {editingDocId === doc._id ? (
                                  <div className="flex-grow flex items-center gap-2">
                                    <Input
                                      value={newTitle}
                                      onChange={(e) => setNewTitle(e.target.value)}
                                      className="text-foreground text-sm font-bold bg-input border-border h-8"
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') handleSaveTitle(doc._id);
                                      }}
                                      autoFocus
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => handleSaveTitle(doc._id)} title="Save Title" className="h-8 w-8">
                                      <Save className="w-4 h-4 text-green-500" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} title="Cancel Edit" className="h-8 w-8">
                                      <XCircle className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 min-w-0 flex-grow">
                                    <CardTitle className="text-foreground text-base sm:text-lg font-bold truncate">{doc.title}</CardTitle>
                                    <Button size="icon" variant="ghost" onClick={() => handleEditClick(doc._id, doc.title)} title="Edit Title" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {/* Pin Action */}
                                <button
                                  onClick={() => handleTogglePin(doc._id)}
                                  className={`p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                                    isPinned
                                      ? 'text-primary hover:bg-primary/10'
                                      : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'
                                  }`}
                                  title={isPinned ? "Unpin document" : "Pin document to top"}
                                >
                                  <Pin className={`w-4 h-4 ${isPinned ? 'fill-primary' : ''}`} />
                                </button>
                                
                                <span className="bg-primary/10 text-primary text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 uppercase tracking-wider">
                                  {getDocType(doc.title)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground space-y-1 mb-4">
                              <div title={new Date(doc.created_at).toLocaleString()}>
                                Created {getRelativeTime(doc.created_at)}
                              </div>
                              {doc.updated_at && doc.updated_at !== doc.created_at && (
                                <div title={new Date(doc.updated_at).toLocaleString()}>
                                  Updated {getRelativeTime(doc.updated_at)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                            <Button
                              size="sm"
                              onClick={() => handleViewDocument(doc._id)}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 h-9 flex-grow font-semibold cursor-pointer"
                            >
                              View Document
                            </Button>
                            
                            {/* Kebab Action dropdown */}
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setActiveDropdownId(activeDropdownId === doc._id ? null : doc._id)}
                                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
                                title="More Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              {activeDropdownId === doc._id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                  <div className="absolute right-0 bottom-11 w-40 bg-card border border-border rounded-lg shadow-md py-1 z-50 animate-fadeIn text-left select-none">
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleOpenPreview(doc._id);
                                      }}
                                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>Quick Preview</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleShareDocument(doc);
                                      }}
                                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                    >
                                      <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>Share</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleDownloadPdf(doc._id, doc.title);
                                      }}
                                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                    >
                                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>Download PDF</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleDownloadDocx(doc._id, doc.title);
                                      }}
                                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>Download Word</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleDeleteDocument(doc._id);
                                      }}
                                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted text-destructive flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3 flex flex-col">
                  {myDocsFiltered.map((doc) => {
                    const isPinned = pinnedDocIds.includes(doc._id);
                    const isSelected = selectedDocIds.includes(doc._id);
                    
                    return (
                      <div key={doc._id} className={`bg-card border rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all relative ${
                        isPinned ? 'border-primary/40 ring-1 ring-primary/10' : 'border-border'
                      }`}>
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {/* Bulk Selection Checkbox with sliding transition */}
                          <div className={`transition-all duration-300 ease-in-out flex items-center ${isMultiSelectMode ? 'w-6 opacity-100 mr-2.5' : 'w-0 opacity-0 overflow-hidden mr-0'}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(doc._id)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer flex-shrink-0"
                            />
                          </div>
                          
                          <div className="p-2.5 bg-primary/10 rounded-lg text-primary flex-shrink-0 hidden sm:block">
                            <FileText className="w-5 h-5" />
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {editingDocId === doc._id ? (
                                <div className="flex items-center gap-2 flex-grow">
                                  <Input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="text-foreground text-sm font-bold bg-input border-border h-8"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') handleSaveTitle(doc._id);
                                    }}
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" onClick={() => handleSaveTitle(doc._id)} title="Save Title" className="h-8 w-8">
                                    <Save className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={handleCancelEdit} title="Cancel Edit" className="h-8 w-8">
                                    <XCircle className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className="font-semibold text-foreground truncate text-sm sm:text-base">{doc.title}</span>
                                  <Button size="icon" variant="ghost" onClick={() => handleEditClick(doc._id, doc.title)} title="Edit Title" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                              
                              {/* Pin Action */}
                              <button
                                onClick={() => handleTogglePin(doc._id)}
                                className={`p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                                  isPinned
                                    ? 'text-primary hover:bg-primary/10'
                                    : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'
                                }`}
                                title={isPinned ? "Unpin document" : "Pin document to top"}
                              >
                                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-primary' : ''}`} />
                              </button>
                              
                              <span className="bg-primary/10 text-primary text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 uppercase tracking-wider">
                                {getDocType(doc.title)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                              <span title={new Date(doc.created_at).toLocaleString()}>
                                Created {getRelativeTime(doc.created_at)}
                              </span>
                              {doc.updated_at && doc.updated_at !== doc.created_at && (
                                <span title={new Date(doc.updated_at).toLocaleString()}>
                                  &bull; Updated {getRelativeTime(doc.updated_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleViewDocument(doc._id)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 h-8 shadow-sm cursor-pointer"
                          >
                            View
                          </Button>
                          
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setActiveDropdownId(activeDropdownId === doc._id ? null : doc._id)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                              title="More Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            {activeDropdownId === doc._id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                <div className="absolute right-0 top-9 w-40 bg-card border border-border rounded-lg shadow-md py-1 z-50 animate-fadeIn text-left select-none">
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleOpenPreview(doc._id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Quick Preview</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleShareDocument(doc);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                  >
                                    <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Share</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleDownloadPdf(doc._id, doc.title);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                  >
                                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Download PDF</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleDownloadDocx(doc._id, doc.title);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Download Word</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleDeleteDocument(doc._id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-destructive flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </TabsContent>

          {/* Shared with Me Tab Content */}
          <TabsContent value="shared_with_me">
            {loading ? (
              <div className="text-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">Loading shared documents...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 text-destructive text-sm font-medium">
                <p>{error}</p>
              </div>
            ) : sharedDocsFiltered.length === 0 ? (
              <div className="text-center py-16 space-y-4 max-w-md mx-auto">
                <div className="p-4 bg-primary/10 rounded-full text-primary w-16 h-16 flex items-center justify-center mx-auto border border-primary/20">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground">No shared documents</h3>
                <p className="text-sm text-muted-foreground leading-normal">
                  No documents have been shared with you yet
                </p>
              </div>
            ) : (
              viewMode === 'grid' ? (
                /* Shared Docs Grid View */
                <div className="grid gap-6 md:grid-cols-2">
                  {sharedDocsFiltered.map((doc) => {
                    const myPermission = doc.shared_with_users?.find(u => u.username === user.username)?.permission || 'view';
                    const canEdit = myPermission === 'edit';
                    const isPinned = pinnedDocIds.includes(doc._id);
                    
                    return (
                      <Card key={doc._id} className={`bg-card border shadow-sm hover:shadow transition-all duration-300 flex flex-col relative justify-between overflow-visible ${
                        isPinned ? 'border-primary/40 ring-1 ring-primary/10' : 'border-border'
                      }`}>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 pb-2">
                              {editingDocId === doc._id ? (
                                <div className="flex-grow flex items-center gap-2">
                                  <Input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="text-foreground text-sm font-bold bg-input border-border h-8"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') handleSaveTitle(doc._id);
                                    }}
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" onClick={() => handleSaveTitle(doc._id)} title="Save Title" className="h-8 w-8">
                                    <Save className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={handleCancelEdit} title="Cancel Edit" className="h-8 w-8">
                                    <XCircle className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 min-w-0 flex-grow">
                                  <CardTitle className="text-foreground text-base sm:text-lg font-bold truncate">{doc.title}</CardTitle>
                                  {canEdit && (
                                    <Button size="icon" variant="ghost" onClick={() => handleEditClick(doc._id, doc.title)} title="Edit Title" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {/* Pin Action */}
                                <button
                                  onClick={() => handleTogglePin(doc._id)}
                                  className={`p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                                    isPinned
                                      ? 'text-primary hover:bg-primary/10'
                                      : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'
                                  }`}
                                  title={isPinned ? "Unpin document" : "Pin document to top"}
                                >
                                  <Pin className={`w-4 h-4 ${isPinned ? 'fill-primary' : ''}`} />
                                </button>
                                
                                <span className="bg-primary/10 text-primary text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 uppercase tracking-wider">
                                  {getDocType(doc.title)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground space-y-1 mb-4">
                              <div title={new Date(doc.created_at).toLocaleString()}>
                                Created {getRelativeTime(doc.created_at)}
                              </div>
                              {doc.updated_at && doc.updated_at !== doc.created_at && (
                                <div title={new Date(doc.updated_at).toLocaleString()}>
                                  Updated {getRelativeTime(doc.updated_at)}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                <span>Shared by: <strong className="text-foreground/80">{doc.owner}</strong></span>
                                <span className="bg-muted text-muted-foreground text-[10px] font-semibold rounded-full px-2 py-0.5 capitalize border border-border/30">
                                  {canEdit ? 'Can edit' : 'View only'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                            <Button
                              size="sm"
                              onClick={() => navigate(`/documentShare/${doc._id}`)}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 h-9 flex-grow font-semibold cursor-pointer"
                            >
                              View Document
                            </Button>
                            
                            {/* Kebab Action dropdown */}
                            <div className="relative">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setActiveDropdownId(activeDropdownId === doc._id ? null : doc._id)}
                                className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-lg border border-border bg-card hover:bg-muted cursor-pointer"
                                title="More Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              {activeDropdownId === doc._id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                  <div className="absolute right-0 bottom-11 w-40 bg-card border border-border rounded-lg shadow-md py-1 z-50 animate-fadeIn text-left select-none">
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleOpenPreview(doc._id);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>Quick Preview</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleDownloadPdf(doc._id, doc.title);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                    >
                                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>Download PDF</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleDownloadDocx(doc._id, doc.title);
                                      }}
                                      className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>Download Word</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                /* Shared Docs List View */
                <div className="space-y-3 flex flex-col">
                  {sharedDocsFiltered.map((doc) => {
                    const myPermission = doc.shared_with_users?.find(u => u.username === user.username)?.permission || 'view';
                    const canEdit = myPermission === 'edit';
                    const isPinned = pinnedDocIds.includes(doc._id);
                    
                    return (
                      <div key={doc._id} className={`bg-card border rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all relative ${
                        isPinned ? 'border-primary/40 ring-1 ring-primary/10' : 'border-border'
                      }`}>
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="p-2.5 bg-primary/10 rounded-lg text-primary flex-shrink-0 hidden sm:block">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {editingDocId === doc._id ? (
                                <div className="flex items-center gap-2 flex-grow">
                                  <Input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="text-foreground text-sm font-bold bg-input border-border h-8"
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') handleSaveTitle(doc._id);
                                    }}
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" onClick={() => handleSaveTitle(doc._id)} title="Save Title" className="h-8 w-8">
                                    <Save className="w-4 h-4 text-green-500" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={handleCancelEdit} title="Cancel Edit" className="h-8 w-8">
                                    <XCircle className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-foreground truncate text-sm sm:text-base">{doc.title}</span>
                                  {canEdit && (
                                    <Button size="icon" variant="ghost" onClick={() => handleEditClick(doc._id, doc.title)} title="Edit Title" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              
                              {/* Pin Action */}
                              <button
                                onClick={() => handleTogglePin(doc._id)}
                                className={`p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0 ${
                                  isPinned
                                    ? 'text-primary hover:bg-primary/10'
                                    : 'text-muted-foreground/40 hover:text-foreground hover:bg-muted'
                                }`}
                                title={isPinned ? "Unpin document" : "Pin document to top"}
                              >
                                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-primary' : ''}`} />
                              </button>
                              
                              <span className="bg-primary/10 text-primary text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 uppercase tracking-wider">
                                {getDocType(doc.title)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                              <span title={new Date(doc.created_at).toLocaleString()}>
                                Created {getRelativeTime(doc.created_at)}
                              </span>
                              {doc.updated_at && doc.updated_at !== doc.created_at && (
                                <span title={new Date(doc.updated_at).toLocaleString()}>
                                  &bull; Updated {getRelativeTime(doc.updated_at)}
                                </span>
                              )}
                              <span>&bull; Shared by: <strong className="text-foreground/80">{doc.owner}</strong></span>
                              <span className="bg-muted text-muted-foreground text-[10px] font-semibold rounded-full px-2 py-0.5 capitalize border border-border/30">
                                {canEdit ? 'Can edit' : 'View only'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/documentShare/${doc._id}`)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-3 h-8 shadow-sm cursor-pointer"
                          >
                            View
                          </Button>
                          
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setActiveDropdownId(activeDropdownId === doc._id ? null : doc._id)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                              title="More Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            {activeDropdownId === doc._id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                <div className="absolute right-0 top-9 w-40 bg-card border border-border rounded-lg shadow-md py-1 z-50 animate-fadeIn text-left select-none">
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleOpenPreview(doc._id);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Quick Preview</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleDownloadPdf(doc._id, doc.title);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                                  >
                                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Download PDF</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleDownloadDocx(doc._id, doc.title);
                                    }}
                                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Download Word</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </TabsContent>
          <TabsContent value="templates">
            {templatesList.length === 0 ? (
              <div className="text-center py-16 space-y-6 max-w-lg mx-auto">
                <div className="p-4 bg-primary/10 rounded-full text-primary w-16 h-16 flex items-center justify-center mx-auto border border-primary/20">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1">No Templates Found</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You haven't saved any templates yet. In Document Creation, click the "Save as Template" option in the toolbar menu to save a document as a template.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templatesList.map((template) => (
                  <Card key={template.id} className="bg-card border-border hover:border-primary/45 hover:shadow-md transition-all duration-300 flex flex-col justify-between p-5 rounded-xl border">
                    <CardHeader className="pb-2 p-0 select-none">
                      <CardTitle className="text-sm font-bold text-foreground truncate">{template.title}</CardTitle>
                      <CardDescription className="text-[10px] text-muted-foreground mt-0.5">
                        Created: {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-0 mt-4 select-none">
                      {template.variables && template.variables.length > 0 ? (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">Template Fields</span>
                          <div className="flex flex-wrap gap-1">
                            {template.variables.map((v, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded bg-primary/5 text-primary text-[9px] font-medium border border-primary/10">
                                {v}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground italic">No placeholders detected.</p>
                      )}
                      
                      <Button
                        onClick={() => handleUseTemplate(template)}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8 rounded cursor-pointer mt-2"
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedDocIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border px-6 py-4 rounded-xl shadow-xl flex items-center gap-6 animate-fadeIn select-none">
          <span className="text-sm font-semibold text-foreground">
            {selectedDocIds.length} {selectedDocIds.length === 1 ? 'document' : 'documents'} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDocIds([]);
                setIsMultiSelectMode(false);
              }}
              className="border border-border bg-card hover:bg-muted text-xs cursor-pointer rounded-lg h-9 px-3"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold cursor-pointer rounded-lg h-9 px-3 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDocuments;
