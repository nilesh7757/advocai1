import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
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
  Loader2 
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/Components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/Tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/Select";
import ShareModal from '../Components/ShareModal';
import { useAuth } from '../context/AuthContext';

const MyDocuments = () => {
  const { user } = useAuth();
  const [myDocumentsList, setMyDocumentsList] = useState([]);
  const [sharedWithMeDocumentsList, setSharedWithMeDocumentsList] = useState([]);
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

  const handleViewDocument = (documentId) => {
    navigate(`/document-creation/${documentId}`);
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
      
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary">Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">All your legal documents in one place.</p>
        </div>

        {/* Toolbar controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex-1 flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my_documents">My Documents ({myDocumentsList.length})</TabsTrigger>
            <TabsTrigger value="shared_with_me">Shared with Me ({sharedWithMeDocumentsList.length})</TabsTrigger>
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
                  {myDocsFiltered.map((doc) => (
                    <Card key={doc._id} className="bg-card border border-border shadow-sm hover:shadow transition-all duration-300 flex flex-col relative justify-between overflow-visible">
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
                                <Button size="icon" variant="ghost" onClick={() => handleEditClick(doc._id, doc.title)} title="Edit Title" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                            <span className="bg-primary/10 text-primary text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 uppercase tracking-wider">
                              {getDocType(doc.title)}
                            </span>
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
                                <div className="absolute right-0 bottom-11 w-40 bg-card border border-border rounded-lg shadow-md py-1 z-50 animate-fadeIn text-left">
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
                    </Card>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="space-y-3 flex flex-col">
                  {myDocsFiltered.map((doc) => (
                    <div key={doc._id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all relative">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary flex-shrink-0">
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
                                <Button size="icon" variant="ghost" onClick={() => handleEditClick(doc._id, doc.title)} title="Edit Title" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
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
                              <div className="absolute right-0 top-9 w-40 bg-card border border-border rounded-lg shadow-md py-1 z-50 animate-fadeIn text-left">
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
                  ))}
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
                    
                    return (
                      <Card key={doc._id} className="bg-card border border-border shadow-sm hover:shadow transition-all duration-300 flex flex-col relative justify-between overflow-visible">
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
                              <span className="bg-primary/10 text-primary text-[10px] font-bold rounded-full px-2 py-0.5 flex-shrink-0 uppercase tracking-wider">
                                {getDocType(doc.title)}
                              </span>
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
                                  <div className="absolute right-0 bottom-11 w-40 bg-card border border-border rounded-lg shadow-md py-1 z-50 animate-fadeIn text-left">
                                    <button
                                      onClick={() => {
                                        setActiveDropdownId(null);
                                        handleDownloadPdf(doc._id, doc.title);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Download className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span>Download PDF</span>
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
                    
                    return (
                      <div key={doc._id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow transition-all relative">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="p-2.5 bg-primary/10 rounded-lg text-primary flex-shrink-0">
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
                                <div className="absolute right-0 top-9 w-40 bg-card border border-border rounded-lg shadow-md py-1 z-50 animate-fadeIn text-left">
                                  <button
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleDownloadPdf(doc._id, doc.title);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span>Download PDF</span>
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
        </Tabs>
      </div>
    </div>
  );
};

export default MyDocuments;
