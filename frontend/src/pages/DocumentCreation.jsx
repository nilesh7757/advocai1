
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileText, PenTool, Send, Download, User, Bot, Save, Edit, Eye, Bold, Italic, Strikethrough, Code, Pilcrow, Heading1, Heading2, Heading3, Indent as IndentIcon, Outdent as OutdentIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Underline as UnderlineIcon, MessageCircle, History, FileCheck, Minus, Menu, X, XCircle, Maximize, Share2 } from 'lucide-react'; // Added Maximize, Share2
import axios from '../api/axios';
import { saveAs } from 'file-saver';
import '../styles/MarkdownPreview.css';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/Components/ui/Card";

import { useEditor, EditorContent, Editor } from '@tiptap/react'; // Import Editor
import StarterKit from '@tiptap/starter-kit'; // Corrected import
import { Markdown } from 'tiptap-markdown';
import { Indent } from '../lib/tiptap-extensions/indent';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ShareModal from '../Components/ShareModal';
import CommentList from '../Components/Comments/CommentList';
import MenuBar from '../Components/MenuBar'; // Import the MenuBar component
import VersionsSidebar from '../Components/VersionsSidebar';
import SignatureModal from '../Components/SignatureModal'; // Import SignatureModal

// Helper function to convert Markdown to HTML using a headless Tiptap editor
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


const DocumentCreation = () => {
  const { id: mongoConversationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const versionToLoad = queryParams.get('version');
  
  const [messages, setMessages] = useState([]);
  const [title, setTitle] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [finalDocument, setFinalDocument] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const chatContainerRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isVersionsSidebarOpen, setIsVersionsSidebarOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [originalDocumentContent, setOriginalDocumentContent] = useState(''); // New state to track original content
  const [isTitleEditing, setIsTitleEditing] = useState(false); // New state for title editing
  const [tempTitle, setTempTitle] = useState(''); // New state for temporary title during editing
  const [commentsSidebarOpen, setCommentsSidebarOpen] = useState(false); // State for comments sidebar
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false); // State for SignatureModal
  const [documentSharedWithUsers, setDocumentSharedWithUsers] = useState([]); // New state for shared users


  const documentRef = useRef(null); // Ref for the document area
  const [isFullScreen, setIsFullScreen] = useState(false); // State for full screen mode

  const toggleFullScreen = () => {
    if (!documentRef.current) return;

    if (!document.fullscreenElement) {
      documentRef.current.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      }).catch(err => {
        console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
      });
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const handleShareDocument = async () => {
    if (!mongoConversationId) {
      toast('Please save the document before sharing.', { icon: 'ℹ️' });
      return;
    }
    setIsShareModalOpen(true);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const ws = useRef(null); // WebSocket instance

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Image.configure({ inline: true }),
      Indent,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Underline,
    ],
    content: finalDocument,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setFinalDocument(newContent);
      // Send content update via WebSocket
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
          type: 'document_content_change',
          content: newContent,
        });
        ws.current.send(message);
        console.log('Frontend: Sent document_content_change:', message); // Debug log
      }
    },
    editorProps: {
      attributes: {
        class: 'markdown-preview p-8 bg-card/60 border border-border/10 rounded-b-2xl backdrop-blur-xl text-foreground overflow-hidden',
      },
    },
  });

  // WebSocket connection and message handling
  useEffect(() => {
    if (!mongoConversationId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Explicitly connect to port 8000 where Daphne is running
    const accessToken = localStorage.getItem('access_token');
    let wsUrl = `${protocol}//${window.location.hostname}:8000/ws/document/${mongoConversationId}/`;
    if (accessToken) {
      wsUrl += `?token=${accessToken}`;
    }
    const newWs = new WebSocket(wsUrl);
    ws.current = newWs;

    newWs.onopen = () => {
      console.log('WebSocket connected');
    };

    newWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Frontend: Received WebSocket message:', data); // Debug log
      if (data.type === 'document_content_change') {
        // Update finalDocument state, let the useEffect handle editor update
        setFinalDocument(data.content);
        console.log('Frontend: finalDocument state updated from WebSocket.'); // Debug log
      } else if (data.type === 'new_comment') {
        // Handle new comment, e.g., refresh comments list
        toast.success('New comment added!');
        // You might want to trigger a re-fetch of comments or update the state directly
      }
    };

    newWs.onclose = () => {
      console.log('WebSocket disconnected');
    };

    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      newWs.close();
    };
  }, [mongoConversationId, editor]); // Reconnect if document ID or editor instance changes

  const fetchConversation = useCallback(async (idToFetch) => {
    if (idToFetch) {
      try {
        const convResponse = await axios.get(`/api/documents/conversations/${idToFetch}/`);
        const conversation = convResponse.data;
        setTitle(conversation.title || '');
        setMessages(conversation.messages || []);
                  setDocumentSharedWithUsers(conversation.shared_with_users || []); // Set shared users
                
                if (conversation.document_versions && conversation.document_versions.length > 0) {
                  let contentToLoad = '';
                  let versionToSet = null;
                  if (versionToLoad) {
                    const specificVersion = conversation.document_versions.find(v => v.version_number === parseInt(versionToLoad));
                    if (specificVersion) {
                      contentToLoad = specificVersion.content;
                      versionToSet = specificVersion.version_number;
                    } else {
                      toast.error(`Version ${versionToLoad} not found.`);
                      const latestVersion = conversation.document_versions[conversation.document_versions.length - 1];
                      contentToLoad = latestVersion.content;
                      versionToSet = latestVersion.version_number;
                    }
                  } else {
                    const latestVersion = conversation.document_versions[conversation.document_versions.length - 1];
                    contentToLoad = latestVersion.content;
                    versionToSet = latestVersion.version_number;
                  }
                  const htmlContent = convertMarkdownToHtml(contentToLoad); // Convert Markdown to HTML
                  setFinalDocument(htmlContent);
                  setCurrentVersion(versionToSet);
                  setOriginalDocumentContent(htmlContent); // Set original content here
                } else {
                  setFinalDocument('');
                  setCurrentVersion(null);
                  setOriginalDocumentContent(''); // Set original content here
                }
              } catch (error) {
                console.error('Error fetching conversation:', error);
                if (error.response && error.response.status === 404) {
                  toast.error('Document not found. Redirecting to My Documents.');
                  navigate('/my-documents'); // Navigate to a safe page
                } else {
                  toast.error('Could not load conversation.');
                }
              }
            } else {
              setTitle('');
              setMessages([]);
              setFinalDocument('');
              setCurrentVersion(null);
              setOriginalDocumentContent(''); // Set original content here
              setDocumentSharedWithUsers([]); // Clear shared users for new document
            }
          }, [versionToLoad, navigate]); // Add navigate to dependency array
  const handleSelectVersion = async (versionNumber) => {
    try {
      const response = await axios.get(`/api/documents/conversations/${mongoConversationId}/`);
      const conversation = response.data;
      const specificVersion = conversation.document_versions.find(v => v.version_number === versionNumber);
      if (specificVersion) {
        setFinalDocument(specificVersion.content);
        setCurrentVersion(versionNumber);
        toast.success(`Loaded version ${versionNumber}`);
        setIsVersionsSidebarOpen(false);
      } else {
        toast.error(`Version ${versionNumber} not found.`);
      }
    } catch (error) {
      console.error('Error fetching version:', error);
      toast.error('Could not load version.');
    }
  };

  useEffect(() => {
    if (editor) {
      editor.chain().setContent(finalDocument, false).setMeta('addToHistory', false).run();
    }
  }, [finalDocument, editor]);

  useEffect(() => {
    fetchConversation(mongoConversationId);
  }, [mongoConversationId, versionToLoad, fetchConversation]);

  const handleSaveConversation = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Please provide a title for the document.');
      return;
    }

    if (finalDocument === originalDocumentContent && mongoConversationId) {
      toast('No changes made to save.', { icon: 'ℹ️' });
      return;
    }

    const conversationPayload = {
      title: title,
      messages: messages,
      new_document_content: finalDocument
    };

    try {
      let idToUseForFetch = mongoConversationId;

      if (!mongoConversationId) {
                const convResponse = await axios.post('/api/documents/conversations/', {
                    title: title,
                    messages: messages,
                    initial_document_content: finalDocument
                });        idToUseForFetch = convResponse.data.id;
        navigate(`/document-creation/${idToUseForFetch}`, { replace: true });
        toast.success('New Document created and saved as Version 0!');
      } else {
        await axios.put(`/api/documents/conversations/${mongoConversationId}/`, conversationPayload);
        toast.success('Document updated and new version saved!');
      }
      await fetchConversation(idToUseForFetch);
      setOriginalDocumentContent(finalDocument); // Update original content after successful save
    } catch (error) {
      console.error('Error saving document/conversation:', error);
      toast.error(`Failed to save document or conversation: ${error.message}`);
    }
  }, [title, finalDocument, originalDocumentContent, mongoConversationId, messages, fetchConversation, navigate]);

  // Debounced save effect
  useEffect(() => {
    if (!mongoConversationId || !editor) return;

    const handler = setTimeout(() => {
      // Only save if there are actual changes and the editor is ready
      if (finalDocument !== originalDocumentContent && editor.isReady) {
        handleSaveConversation();
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => {
      clearTimeout(handler);
    };
  }, [finalDocument, mongoConversationId, editor, originalDocumentContent, handleSaveConversation]);

  const handleDeleteVersion = async (convId, versionNumber) => {
    if (!convId || !versionNumber) {
      toast.error('Missing conversation ID or version number for deletion.');
      return;
    }

    try {
      // Fetch conversation to check version count
      const convResponse = await axios.get(`/api/documents/conversations/${convId}/`);
      const conversation = convResponse.data;

      if (conversation.document_versions && conversation.document_versions.length === 1) {
        const onlyVersion = conversation.document_versions[0];
        if (onlyVersion.version_number === versionNumber) {
          const confirmDelete = window.confirm(
            'This is the only version of the document. Deleting it will delete the entire document. Are you sure you want to proceed?'
          );
          if (!confirmDelete) {
            toast('Deletion cancelled.', { icon: 'ℹ️' });
            return;
          }
        }
      }

      await axios.delete(`/api/documents/conversations/${convId}/versions/${versionNumber}/`);
      toast.success(`Version ${versionNumber} deleted successfully!`);
      await fetchConversation(convId); // Re-fetch conversation to update versions list
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error(error.response?.data?.error || 'Failed to delete version.');
    }
  };

  const handleDownloadPdf = async () => {
    if (!mongoConversationId) {
      toast.error('Please save the document first.');
      return;
    }
    try {
      const response = await axios.get(`api/utils/conversations/${mongoConversationId}/download-latest-pdf/`, {
        responseType: 'blob',
      });
      saveAs(response.data, `${title || 'legal_document'}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(`Failed to download PDF: ${error.message}`);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEditTitleClick = () => {
    setTempTitle(title);
    setIsTitleEditing(true);
  };

  const handleSaveTitle = async () => {
    if (!tempTitle.trim()) {
      toast.error('Title cannot be empty.');
      return;
    }
    if (tempTitle === title) {
      setIsTitleEditing(false);
      return;
    }
    try {
      await axios.put(`/api/documents/conversations/${mongoConversationId}/`, { title: tempTitle });
      setTitle(tempTitle);
      toast.success('Title updated successfully!');
      setIsTitleEditing(false);
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error('Failed to update title.');
    }
  };

  const handleCancelTitleEdit = () => {
    setIsTitleEditing(false);
    setTempTitle(title); // Revert to original title
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isGenerating) return;

    setIsGenerating(true);
    const userMessage = { sender: 'user', text: chatMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setChatMessage('');

    try {
      const payload = {
        message: chatMessage,
        document_content: finalDocument, // Send current document content as context
      };

      let response;
      if (mongoConversationId) {
        // If conversation exists, update it
        response = await axios.post(`/api/documents/conversations/${mongoConversationId}/chat/`, payload);
      } else {
        // If no conversation, create a new one with the initial message
        response = await axios.post('/api/documents/conversations/chat/', payload);
        const newConversationId = response.data.conversation_id;
        navigate(`/document-creation/${newConversationId}`, { replace: true });
      }

      const botMessage = { sender: 'bot', text: response.data.response };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      const htmlUpdatedDocumentContent = convertMarkdownToHtml(response.data.updated_document_content);
      setFinalDocument(htmlUpdatedDocumentContent);
      toast.success('AI response received!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get AI response.');
      setMessages((prevMessages) => [...prevMessages, { sender: 'bot', text: 'Error: Could not get a response from the AI.' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasDocument = !!finalDocument;

  // Initial view when no document
  if (!hasDocument) {
    return (
      <div className="flex relative h-screen bg-background overflow-hidden">
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="w-full relative z-10 flex flex-col h-screen overflow-hidden">
          {/* Big Navbar */}
          <div className="px-8 py-6 bg-gradient-to-r from-card/80 to-card/80 backdrop-blur-xl border-b border-border/10 flex-shrink-0">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-primary to-secondary rounded-xl shadow-lg">
                    <FileText className="w-8 h-8 text-foreground" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground">Legal Document Assistant</h1>
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1 relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your document title..."
                    className="pl-12 bg-input border-border/10 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary rounded-xl h-12 text-lg backdrop-blur-sm"
                  />
                </div>
                <Button
                  onClick={handleSaveConversation}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-foreground px-8 rounded-xl shadow-lg shadow-green-500/30 transition-all hover:scale-105 h-12 whitespace-nowrap"
                >
                  <Save className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Create Document</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 p-8 flex items-center justify-center overflow-hidden">
            <Card className="w-full bg-gradient-to-br from-card/60 to-card/60 backdrop-blur-xl border border-border/10 shadow-2xl rounded-2xl overflow-hidden h-full flex flex-col">
              <CardHeader className="pb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border/10 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-lg">
                    <MessageCircle className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">AI Assistant</CardTitle>
                    <CardDescription className="text-muted-foreground">Describe the document you want to create</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 flex-1 flex flex-col overflow-hidden">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                  {messages.filter(msg => msg.type !== 'document_context').map((msg, index) => (
                    <div key={index} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                      {msg.sender === 'bot' && (
                        <div className="w-6 h-6 flex-shrink-0 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                          <Bot className="w-3 h-3 text-foreground" />
                        </div>
                      )}
                      <div className={`px-3 py-2 rounded-lg max-w-xs text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-primary text-foreground'
                          : 'bg-card text-foreground border border-border/10'
                      }`}>
                        <p style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{msg.text}</p>
                      </div>
                      {msg.sender === 'user' && (
                        <div className="w-6 h-6 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isGenerating && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 flex-shrink-0 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                        <Bot className="w-3 h-3 text-foreground animate-pulse" />
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-card border border-border/10">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 flex-shrink-0 mt-4">
                  <Input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe the document you want to create..."
                    className="flex-1 bg-input border-border/10 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary rounded-xl h-12 backdrop-blur-sm"
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isGenerating || !chatMessage.trim()}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-foreground px-8 rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105 h-12"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Send</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Document generated view with 3-column layout
  return (
    <div className="flex relative h-full bg-background overflow-hidden overflow-x-hidden">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Left Sidebar - Chat */}
     <div className={`${sidebarOpen ? 'translate-x-0 w-80 opacity-100' : '-translate-x-full max-w-0 opacity-0 pointer-events-none'} transition-all duration-300 bg-gradient- to-b from-card/95 to-card/95 backdrop-blur-xl border-r border-border/10 flex flex-col absolute z-20 overflow-hidden h-full`}> 
        <div className="p-4 border-b border-border/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="text-foreground font-semibold text-sm">Chat History</span>
            </div>
          </div>
        </div>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
          {messages.filter(msg => msg.type !== 'document_context').map((msg, index) => (
            <div key={index} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'bot' && (
                <div className="w-6 h-6 flex-shrink-0 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <Bot className="w-3 h-3 text-foreground" />
                </div>
              )}
              <div className={`px-3 py-2 rounded-lg max-w-xs text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-primary text-foreground'
                  : 'bg-card text-foreground border border-border/10'
              }`}>
                                      <p style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{msg.text}</p>              </div>
              {msg.sender === 'user' && (
                <div className="w-6 h-6 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isGenerating && (
            <div className="flex gap-2">
              <div className="w-6 h-6 flex-shrink-0 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <Bot className="w-3 h-3 text-foreground animate-pulse" />
              </div>
              <div className="px-3 py-2 rounded-lg bg-card border border-border/10">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border/10 space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask for changes..."
              className="flex-1 bg-input border-border/10 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary rounded-lg h-10 text-sm backdrop-blur-sm"
              disabled={isGenerating}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isGenerating || !chatMessage.trim()}
              className="bg-primary hover:bg-primary/80 text-foreground rounded-lg h-10 w-10 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col relative z-10 h-full overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Top Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-card/80 to-card/80 backdrop-blur-xl border-b border-border/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-foreground/10 rounded-lg transition-all text-muted-foreground flex-shrink-0 lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-foreground/10 rounded-lg transition-all text-muted-foreground flex-shrink-0 hidden lg:block"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="min-w-0 flex-1 flex items-center gap-2">
              {isTitleEditing ? (
                <Input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                  }}
                  className="text-xl lg:text-2xl font-bold bg-input border-border/50 text-foreground focus:ring-2 focus:ring-primary focus:border-primary rounded-lg h-10"
                />
              ) : (
                <h2 className="text-xl lg:text-2xl font-bold text-foreground truncate">{title || 'Your Document'}</h2>
              )}
              {mongoConversationId && ( // Only show edit/save/cancel if document exists
                isTitleEditing ? (
                  <>
                    <Button size="icon" variant="ghost" onClick={handleSaveTitle} title="Save Title">
                      <Save className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelTitleEdit} title="Cancel Edit">
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <Button size="icon" variant="ghost" onClick={handleEditTitleClick} title="Edit Title">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="border-border/20 bg-card/40 hover:bg-card/60 hover:border-border/30 text-muted-foreground rounded-lg backdrop-blur-sm transition-all text-xs lg:text-sm"
            >
              {isEditing ? (
                <>
                  <Eye className="w-4 h-4 mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">Preview</span>
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-1 lg:mr-2" />
                  <span className="hidden lg:inline">Edit</span>
                </>
              )}
            </Button>
            {mongoConversationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsVersionsSidebarOpen(!isVersionsSidebarOpen);
                  setCommentsSidebarOpen(false);
                }}
                className="border-border/20 bg-card/40 hover:bg-card/60 hover:border-border/30 text-muted-foreground rounded-lg backdrop-blur-sm transition-all text-xs lg:text-sm"
              >
                <History className="w-4 h-4 mr-1 lg:mr-2" />
                <span className="hidden lg:inline">Versions</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullScreen}
              className="border-border/20 bg-card/40 hover:bg-card/60 hover:border-border/30 text-muted-foreground rounded-lg backdrop-blur-sm transition-all text-xs lg:text-sm"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <Maximize className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden lg:inline">{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareDocument}
              className="border-border/20 bg-card/40 hover:bg-card/60 hover:border-border/30 text-muted-foreground rounded-lg backdrop-blur-sm transition-all text-xs lg:text-sm"
              title="Share Document"
            >
              <Share2 className="w-4 h-4 mr-1 lg:mr-2" />
              <span className="hidden lg:inline">Share</span>
            </Button>
            {mongoConversationId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCommentsSidebarOpen(!commentsSidebarOpen);
                  setIsVersionsSidebarOpen(false);
                }}
                className="border-border/20 bg-card/40 hover:bg-card/60 hover:border-border/30 text-muted-foreground rounded-lg backdrop-blur-sm transition-all text-xs lg:text-sm"
                title="View Comments"
              >
                <MessageCircle className="w-4 h-4 mr-1 lg:mr-2" />
                <span className="hidden lg:inline">Comments</span>
              </Button>
            )}
          </div>
        </div>

        {/* Document Area */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 bg-card/80 rounded-xl shadow-inner">
          {isEditing ? (
            <div className="flex-1 border border-border/10 rounded-t-xl overflow-hidden shadow-2xl flex flex-col">
              <MenuBar editor={editor} />
              <div ref={documentRef} className="flex-1 overflow-y-auto custom-scrollbar bg-card/60 p-8 markdown-preview text-foreground">
                <EditorContent editor={editor} />
              </div>
            </div>
          ) : (
            <div ref={documentRef} className="flex-1 overflow-y-auto custom-scrollbar bg-card/60 border border-border/10 rounded-xl p-8 markdown-preview shadow-2xl text-foreground">
                {console.log("Previewing finalDocument:", finalDocument)}
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(finalDocument) }} />
              </div>
          )}

          {/* Action Buttons at Bottom */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pt-6 pb-6 border-t border-border/10 bg-card/80 rounded-b-xl">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSignatureModalOpen(true)} // Open SignatureModal
              className="border-border/20 bg-card/40 hover:bg-card/60 hover:border-border/30 text-muted-foreground rounded-lg backdrop-blur-sm transition-all"
            >
              <PenTool className="w-4 h-4 mr-2" />
              Add Signature
            </Button>
            <Button
              onClick={handleDownloadPdf}
              className="bg-gradient-to-r from-accent to-accent text-foreground rounded-lg shadow-lg shadow-accent/30 transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button
              onClick={handleSaveConversation}
              className="bg-gradient-to-r from-primary to-secondary text-foreground rounded-lg shadow-lg shadow-primary/30 transition-all"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Version
            </Button>
          </div>


        </div>
      </div>

      {/* Right Sidebar - Comments */}
      <div className={`${commentsSidebarOpen ? 'translate-x-0 w-80 opacity-100' : 'translate-x-full max-w-0 opacity-0 pointer-events-none'} transition-all duration-300 bg-gradient-to-b from-card/95 to-card/95 backdrop-blur-xl border-l border-border/10 flex flex-col absolute right-0 z-20 overflow-hidden h-full`}>
        {commentsSidebarOpen && mongoConversationId && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span className="text-foreground font-semibold text-sm">Comments</span>
              </div>
              <button
                onClick={() => setCommentsSidebarOpen(false)}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <CommentList documentId={mongoConversationId} />
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Versions */}
      <div className={`${isVersionsSidebarOpen ? 'translate-x-0 w-80 opacity-100' : 'translate-x-full max-w-0 opacity-0 pointer-events-none'} transition-all duration-300 bg-gradient-to-b from-card/95 to-card/95 backdrop-blur-xl border-l border-border/10 flex flex-col absolute right-0 z-20 overflow-hidden h-full`}>
        <VersionsSidebar
          conversationId={mongoConversationId}
          onSelectVersion={handleSelectVersion}
          onClose={() => setIsVersionsSidebarOpen(false)}
          currentVersion={currentVersion}
          onDeleteVersion={handleDeleteVersion} // Pass the delete function
        />
      </div>

      {isShareModalOpen && (
        <ShareModal
          documentId={mongoConversationId}
          documentTitle={title}
          onClose={() => setIsShareModalOpen(false)}
          initialSharedWithUsers={documentSharedWithUsers} // Pass shared users
        />
      )}

      {isSignatureModalOpen && (
        <SignatureModal
          onClose={() => setIsSignatureModalOpen(false)}
          onSignatureAdded={async (signatureMarkdown, partyName) => {
            if (editor) {
              editor.commands.setContent(editor.getHTML() + `\n\n---\n\n${signatureMarkdown}\n\n**${partyName}**`);
              setFinalDocument(editor.getHTML());
              // Automatically save the document after adding a signature
              await handleSaveConversation();
            }
          }}
        />
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default DocumentCreation;