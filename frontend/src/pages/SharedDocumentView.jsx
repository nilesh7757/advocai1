import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { Button } from "@/Components/ui/button";
import { Download, MessageCircle, Edit, History, BookOpen } from 'lucide-react';
import CommentList from '../Components/Comments/CommentList';
import AppSidebar from '../Components/AppSidebar';
import { saveAs } from 'file-saver';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import { Indent } from '../lib/tiptap-extensions/indent';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import MenuBar from '../Components/MenuBar';
import SignatureModal from '../Components/SignatureModal';
import VersionsSidebar from '../Components/VersionsSidebar';

const convertMarkdownToHtml = (markdownContent) => {
  if (!markdownContent) return '';
  const tempEditor = new Editor({
    extensions: [
      StarterKit,
      Markdown,
      Image.configure({ inline: true }),
      Indent,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
  });
  tempEditor.commands.setContent(markdownContent, false, { contentType: 'markdown' });
  const html = tempEditor.getHTML();
  tempEditor.destroy();
  return html;
};

const SharedDocumentView = () => {
  const { id: mongoConversationId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const versionToLoad = queryParams.get('version');

  const [title, setTitle] = useState('Loading Document...');
  const [documentContent, setDocumentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [rightSidebarTab, setRightSidebarTab] = useState('comments');
  const [canEdit, setCanEdit] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Image.configure({ inline: true }),
      Indent,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: documentContent,
    editable: isEditMode,
    onUpdate: ({ editor }) => {
      setDocumentContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'markdown-preview p-8 bg-card border border-border rounded-b-2xl text-foreground overflow-hidden',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditMode);
      if (editor.getHTML() !== documentContent) {
        editor.commands.setContent(documentContent, false);
      }
    }
  }, [isEditMode, documentContent, editor]);

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`api/documents/conversations/${mongoConversationId}/`);
      const conversation = response.data;
      setTitle(conversation.title || 'Untitled Document');

      if (conversation.share_permissions && conversation.share_permissions.permission_level === 'edit') {
        setCanEdit(true);
      }

      if (conversation.document_versions && conversation.document_versions.length > 0) {
        let contentToLoad = '';
        let versionToSet = null;

        if (versionToLoad) {
          const versionResponse = await axios.get(`api/documents/conversations/${mongoConversationId}/versions/${versionToLoad}/content/`);
          contentToLoad = versionResponse.data.content;
          versionToSet = parseInt(versionToLoad);
          toast.success(`Loaded version ${versionToLoad}`);
        } else {
          const latestVersion = conversation.document_versions[conversation.document_versions.length - 1];
          contentToLoad = latestVersion.content;
          versionToSet = latestVersion.version_number;
        }
        const htmlContent = convertMarkdownToHtml(contentToLoad);
        setDocumentContent(htmlContent);
        setCurrentVersion(versionToSet);
      } else {
        setDocumentContent('No content available for this document.');
        setCurrentVersion(null);
      }
    } catch (err) {
      console.error('Error fetching document:', err);
      setError('Failed to load document. It might not exist or you do not have access.');
      toast.error('Failed to load document.');
    } finally {
      setLoading(false);
    }
  }, [mongoConversationId, versionToLoad]);

  useEffect(() => {
    if (mongoConversationId) {
      fetchDocument();
    }
  }, [mongoConversationId, versionToLoad, fetchDocument]);

  const handleDownloadPdf = async () => {
    if (!mongoConversationId) {
      toast.error('Document not available for download.');
      return;
    }
    try {
      const downloadUrl = currentVersion
        ? `api/utils/conversations/${mongoConversationId}/download-version-pdf/${currentVersion}/`
        : `api/utils/conversations/${mongoConversationId}/download-latest-pdf/`;

      const response = await axios.get(downloadUrl, {
        responseType: 'blob',
      });
      saveAs(response.data, `${title || 'shared_document'}_v${currentVersion || 'latest'}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      toast.error(`Failed to download PDF: ${err.message}`);
    }
  };

  const handleSave = async () => {
    if (!editor) return;
    try {
      await axios.put(`api/documents/conversations/${mongoConversationId}/`, {
        title: title,
        new_document_content: editor.getHTML(),
        notes: 'Updated from shared link'
      });
      toast.success('Document saved successfully!');
      setIsEditMode(false);
      fetchDocument();
    } catch (err) {
      console.error('Error saving document:', err);
      toast.error('Failed to save document.');
    }
  };

  const handleSelectVersion = async (versionNumber) => {
    try {
      const response = await axios.get(`api/documents/conversations/${mongoConversationId}/versions/${versionNumber}/content/`);
      setDocumentContent(response.data.content);
      setCurrentVersion(versionNumber);
      toast.success(`Loaded version ${versionNumber}`);
      setRightSidebarOpen(false);
    } catch (error) {
      console.error('Error fetching version:', error);
      toast.error('Could not load version.');
    }
  };

  const openSidebar = (tab) => {
    setRightSidebarTab(tab);
    setRightSidebarOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex relative min-h-screen bg-background text-foreground">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="bg-card border-b border-border px-8 py-6 mb-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold text-foreground truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {canEdit && !isEditMode && (
                <Button onClick={() => setIsEditMode(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditMode && (
                <Button onClick={handleSave}>Save</Button>
              )}
              {canEdit && (
                <Button
                  onClick={() => {
                    setIsEditMode(true);
                    setShowSignatureModal(true);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Add Signature
                </Button>
              )}
              <Button
                onClick={handleDownloadPdf}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              {mongoConversationId && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => openSidebar('versions')}
                  className="bg-card border-border hover:bg-muted text-muted-foreground"
                  title="View Versions"
                >
                  <History className="w-5 h-5" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => openSidebar('comments')}
                className="bg-card border-border hover:bg-muted text-muted-foreground"
                title="View Comments"
              >
                <MessageCircle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Document View */}
        <div className="px-8 max-w-6xl mx-auto">
          {isEditMode ? (
            <div className="flex-1 border border-border rounded-t-xl overflow-hidden flex flex-col">
              <MenuBar editor={editor} />
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-card p-8 markdown-preview text-foreground">
                <EditorContent editor={editor} />
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto custom-scrollbar bg-card border border-border rounded-2xl pt-8 markdown-preview text-foreground min-h-full max-w-3xl mx-auto">
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(documentContent) }} />
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Comments & Versions (AppSidebar) */}
      {mongoConversationId && (
        <AppSidebar
          side="right"
          isOpen={rightSidebarOpen}
          onClose={() => setRightSidebarOpen(false)}
          onOpenCollapsed={() => setRightSidebarOpen(true)}
          icon={BookOpen}
          title={rightSidebarTab === 'comments' ? 'Comments' : 'Versions'}
          collapsedRail={true}
        >
          <div className="flex flex-col h-full overflow-hidden bg-background/30 select-none">
            {/* Sidebar Tab Header */}
            <div className="p-2 border-b border-border flex items-center justify-center flex-shrink-0 bg-muted/20">
              <div className="flex gap-1 bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setRightSidebarTab('comments')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    rightSidebarTab === 'comments'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Comments
                </button>
                <button
                  onClick={() => setRightSidebarTab('versions')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    rightSidebarTab === 'versions'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Versions
                </button>
              </div>
            </div>

            {/* Sidebar Tab Content */}
            <div className="flex-grow overflow-hidden flex flex-col">
              {rightSidebarTab === 'comments' ? (
                <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col">
                  <CommentList documentId={mongoConversationId} />
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col">
                  <VersionsSidebar
                    conversationId={mongoConversationId}
                    onSelectVersion={handleSelectVersion}
                    onClose={() => setRightSidebarOpen(false)}
                    currentVersion={currentVersion}
                  />
                </div>
              )}
            </div>
          </div>
        </AppSidebar>
      )}

      {showSignatureModal && (
        <SignatureModal
          onClose={() => setShowSignatureModal(false)}
          onSignatureAdded={async (signatureMarkdown, partyName) => {
            if (editor) {
              const newContentMarkdown = editor.getHTML() + `\n\n---\n\n${signatureMarkdown}\n\n**${partyName}**`;
              const newContentHtml = convertMarkdownToHtml(newContentMarkdown);
              editor.commands.setContent(newContentHtml);
              setDocumentContent(newContentHtml);
              await handleSave();
            }
          }}
        />
      )}
    </div>
  );
};

export default SharedDocumentView;
