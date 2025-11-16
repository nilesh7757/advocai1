import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { FileText, History, Download, Trash2, PlusCircle, Share2 } from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input"; // Added Input import
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/Components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/Tabs"; // Import Tabs components
import { Edit, Save, XCircle } from 'lucide-react'; // Add new icons
import ShareModal from '../Components/ShareModal';
import { useAuth } from '../context/AuthContext'; // Import useAuth to get current user

const MyDocuments = () => {
  const { user } = useAuth(); // Get current user from AuthContext
  const [myDocumentsList, setMyDocumentsList] = useState([]);
  const [sharedWithMeDocumentsList, setSharedWithMeDocumentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [editingDocId, setEditingDocId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('my_documents'); // New state for active tab

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
          // Check if the document is shared with the current user
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
  }, [user]); // user is a dependency for fetchDocuments

  useEffect(() => {
    if (user) { // Only fetch documents if user is authenticated
      fetchDocuments();
    }
  }, [user, fetchDocuments]); // Re-fetch when user changes or fetchDocuments changes

  const handleViewDocument = (documentId) => {
    navigate(`/document-creation/${documentId}`);
  };

  const handleDownloadPdf = async (documentId, title) => {
    try {
      const response = await axios.get(`api/utils/conversations/${documentId}/download-latest-pdf/`, {
        responseType: 'blob',
      });
      const { saveAs } = await import('file-saver'); // Dynamically import file-saver
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
      fetchDocuments(); // Refresh the list
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
        fetchDocuments(); // Refresh the list
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

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      {isShareModalOpen && selectedDoc && (
        <ShareModal
          documentId={selectedDoc._id}
          documentTitle={selectedDoc.title}
          initialSharedWithUsers={selectedDoc.shared_with_users || []} // Pass shared users
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Documents</h1>
          <Button
            onClick={() => navigate('/document-creation')}
            className="bg-gradient-to-r from-primary to-secondary text-foreground px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-all"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Document
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my_documents">My Documents</TabsTrigger>
            <TabsTrigger value="shared_with_me">Shared with Me</TabsTrigger>
          </TabsList>
          <TabsContent value="my_documents">
            {loading ? (
              <div className="text-center py-10">
                <History className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading your documents...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                <p>{error}</p>
              </div>
            ) : myDocumentsList.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">No documents found.</p>
                <Button
                  onClick={() => navigate('/document-creation')}
                  className="bg-gradient-to-r from-primary to-secondary text-foreground px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-all"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create Your First Document
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {myDocumentsList.map((doc) => (
                  <Card key={doc._id} className="bg-card/60 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      {editingDocId === doc._id ? (
                        <div className="flex-grow flex items-center gap-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="text-primary text-xl font-bold bg-input border-border/50"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(doc._id);
                            }}
                          />
                          <Button size="icon" variant="ghost" onClick={() => handleSaveTitle(doc._id)} title="Save Title">
                            <Save className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit} title="Cancel Edit">
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <CardTitle className="text-primary text-xl truncate">{doc.title}</CardTitle>
                          <Button size="icon" variant="ghost" onClick={() => handleEditClick(doc._id, doc.title)} title="Edit Title">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardDescription className="text-muted-foreground text-sm px-6">
                      Created: {new Date(doc.created_at).toLocaleDateString()}
                    </CardDescription>
                    <div className="p-4 border-t border-border/50 flex justify-between items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewDocument(doc._id)}
                        className="bg-primary hover:bg-primary/80 text-foreground transition-all flex-grow"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Document
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleShareDocument(doc)}
                        className="border-primary/50 text-primary hover:bg-primary/10 transition-all"
                        title="Share Document"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownloadPdf(doc._id, doc.title)}
                        className="border-accent/50 text-accent hover:bg-accent/10 transition-all"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc._id)}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10 transition-all"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="shared_with_me">
            {loading ? (
              <div className="text-center py-10">
                <History className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading shared documents...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                <p>{error}</p>
              </div>
            ) : sharedWithMeDocumentsList.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">No documents shared with you.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {sharedWithMeDocumentsList.map((doc) => (
                  <Card key={doc._id} className="bg-card/60 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      {editingDocId === doc._id ? (
                        <div className="flex-grow flex items-center gap-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="text-primary text-xl font-bold bg-input border-border/50"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(doc._id);
                            }}
                          />
                          <Button size="icon" variant="ghost" onClick={() => handleSaveTitle(doc._id)} title="Save Title">
                            <Save className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit} title="Cancel Edit">
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <CardTitle className="text-primary text-xl truncate">{doc.title}</CardTitle>
                          {doc.shared_with_users?.find(u => u.username === user.username)?.permission === 'edit' && (
                            <Button size="icon" variant="ghost" onClick={() => handleEditClick(doc._id, doc.title)} title="Edit Title">
                              <Edit className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground flex-shrink-0">Shared by: {doc.owner}</span>
                    </CardHeader>
                    <CardDescription className="text-muted-foreground text-sm px-6">
                      Created: {new Date(doc.created_at).toLocaleDateString()}
                    </CardDescription>
                    <div className="p-4 border-t border-border/50 flex justify-between items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/documentShare/${doc._id}`)}
                        className="bg-primary hover:bg-primary/80 text-foreground transition-all flex-grow"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Document
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownloadPdf(doc._id, doc.title)}
                        className="border-accent/50 text-accent hover:bg-accent/10 transition-all"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyDocuments;
