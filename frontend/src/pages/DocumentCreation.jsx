import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileText, PenTool, Send, Download, User, Bot, Save, Edit, Eye, Bold, Italic, Strikethrough, Code, Pilcrow, Heading1, Heading2, Heading3, Indent as IndentIcon, Outdent as OutdentIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Underline as UnderlineIcon, MessageCircle, History, FileCheck, Minus, Menu, X, XCircle, Maximize, Share2, Sparkles, BookOpen, Loader2 } from 'lucide-react'; // Added Maximize, Share2, Sparkles, BookOpen
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
import AppSidebar from '../Components/AppSidebar';

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

// Clause Library Panel Component
const ClauseLibraryPanel = ({ editor, setIsEditing }) => {
  const [clauses, setClauses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClauses = async () => {
      try {
        const response = await axios.get('/api/ai-generator/clause-library/');
        setClauses(response.data);
      } catch (err) {
        console.error('Error fetching clauses:', err);
        toast.error('Failed to load clause library.');
      } finally {
        setLoading(false);
      }
    };
    fetchClauses();
  }, []);

  const handleInsert = (clauseText) => {
    if (!editor) {
      toast.error('Editor not ready.');
      return;
    }
    // Switch to edit mode automatically so insertion is visible/possible
    if (setIsEditing) {
      setIsEditing(true);
    }
    setTimeout(() => {
      editor.chain().focus().insertContent(clauseText).run();
      toast.success('Clause inserted!');
    }, 100);
  };

  const filteredClauses = clauses.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-card select-none">
      <div className="p-4 border-b border-border flex-shrink-0 flex flex-col gap-2">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Clause Library</h3>
        <input
          type="text"
          placeholder="Search by category, title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background border border-border text-xs rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-xs text-muted-foreground animate-pulse">Loading clauses...</span>
          </div>
        ) : filteredClauses.length > 0 ? (
          filteredClauses.map((clause, idx) => (
            <div key={idx} className="p-3 border border-border rounded-lg bg-muted/20 hover:border-border/80 flex flex-col gap-2 transition-all">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wide">
                  {clause.category}
                </span>
                <button
                  onClick={() => handleInsert(clause.text)}
                  className="px-2.5 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                >
                  Insert
                </button>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground mb-1 select-text">{clause.title}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed font-serif select-text italic">
                  {clause.text}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <span className="text-xs text-muted-foreground">No clauses found.</span>
          </div>
        )}
      </div>
    </div>
  );
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
  const [jurisdiction, setJurisdiction] = useState('india');

  const chatContainerRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [rightSidebarTab, setRightSidebarTab] = useState('comments'); // 'comments' | 'versions'
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [originalDocumentContent, setOriginalDocumentContent] = useState(''); // New state to track original content
  const [isTitleEditing, setIsTitleEditing] = useState(false); // New state for title editing
  const [tempTitle, setTempTitle] = useState(''); // New state for temporary title during editing
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false); // State for SignatureModal
  const [documentSharedWithUsers, setDocumentSharedWithUsers] = useState([]); // New state for shared users


  const documentRef = useRef(null); // Ref for the document area
  const [isZenMode, setIsZenMode] = useState(false); // Zen mode state

  // Inline AI refinement actions state and helper
  const [refiningAction, setRefiningAction] = useState(null);

  const handleInlineAction = async (action) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      toast.error('Please select some text first.');
      return;
    }
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText || !selectedText.trim()) {
      toast.error('Please select some text first.');
      return;
    }

    setRefiningAction(action);
    try {
      const response = await axios.post('/api/ai-generator/refine-text/', {
        text: selectedText,
        action: action
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const newText = response.data;
      editor.chain().focus().deleteSelection().insertContent(newText).run();
      toast.success('Text refined successfully!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Failed to refine text.');
    } finally {
      setRefiningAction(null);
    }
  };

  // Template States & Handlers
  const [templateContent, setTemplateContent] = useState('');
  const [templateVariables, setTemplateVariables] = useState([]);
  const [templateValues, setTemplateValues] = useState({});
  const [isTemplateActive, setIsTemplateActive] = useState(false);

  const handleTemplateValueChange = (variable, value) => {
    const updatedValues = { ...templateValues, [variable]: value };
    setTemplateValues(updatedValues);
    
    // Perform substitution
    let substituted = templateContent;
    Object.keys(updatedValues).forEach(key => {
      const val = updatedValues[key] || `{{${key}}}`;
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      substituted = substituted.replace(regex, val);
    });
    
    setFinalDocument(substituted);
    if (editor) {
      editor.commands.setContent(substituted);
    }
  };

  const [menuPosition, setMenuPosition] = useState(null);

  useEffect(() => {
    const initialPrompt = location.state?.initialPrompt || queryParams.get('prompt');
    if (initialPrompt) {
      setChatMessage(initialPrompt);
    }
    
    if (location.state?.templateId) {
      const content = location.state.templateContent || '';
      const variables = location.state.templateVariables || [];
      const titleVal = location.state.templateTitle || 'Document';
      
      setTemplateContent(content);
      setTemplateVariables(variables);
      setIsTemplateActive(true);
      setTitle(titleVal);
      setIsEditing(true);
      
      const initialValues = {};
      variables.forEach(v => {
        initialValues[v] = '';
      });
      setTemplateValues(initialValues);
      setFinalDocument(content);
    }
  }, [location.state, location.search]);

  const handleShareDocument = async () => {
    if (!mongoConversationId) {
      toast('Please save the document before sharing.', { icon: 'ℹ️' });
      return;
    }
    setIsShareModalOpen(true);
  };

  const handleSaveAsTemplate = async () => {
    if (!mongoConversationId) {
      toast.error('Please save the document first.');
      return;
    }
    const confirmSave = window.confirm(
      "To save this document as a template, please ensure you have wrapped all variables in double braces, e.g. {{client_name}} or {{amount}}.\n\nWould you like to save this document as a template now?"
    );
    if (!confirmSave) return;
    
    try {
      const response = await axios.post(`/api/documents/conversations/${mongoConversationId}/save-as-template/`);
      toast.success(`Template saved successfully! Saved ${response.data.variables?.length || 0} variables.`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save template.');
    }
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
        class: 'markdown-preview p-8 bg-background border border-border rounded-b-xl text-foreground overflow-hidden',
      },
    },
  });

  // selectionUpdate hook for inline AI actions floating menu
  useEffect(() => {
    if (!editor) return;
    const updateMenu = () => {
      const { from, to } = editor.state.selection;
      if (from === to) {
        setMenuPosition(null);
        return;
      }
      
      try {
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        
        const left = (start.left + end.left) / 2;
        const top = start.top - 48;
        
        if (left > 0 && top > 0) {
          setMenuPosition({ left, top });
        } else {
          setMenuPosition(null);
        }
      } catch (e) {
        setMenuPosition(null);
      }
    };
    
    editor.on('selectionUpdate', updateMenu);
    
    return () => {
      editor.off('selectionUpdate', updateMenu);
    };
  }, [editor]);

  // template content loading effect
  useEffect(() => {
    if (editor && isTemplateActive && templateContent) {
      editor.commands.setContent(templateContent);
    }
  }, [editor, isTemplateActive, templateContent]);

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
        setRightSidebarOpen(false);
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

  const handleDownloadDocx = async () => {
    if (!mongoConversationId) {
      toast.error('Please save the document first.');
      return;
    }
    try {
      const response = await axios.get(`api/utils/conversations/${mongoConversationId}/download-latest-docx/`, {
        responseType: 'blob',
      });
      saveAs(response.data, `${title || 'legal_document'}.docx`);
      toast.success('Word document downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Word document:', error);
      toast.error(`Failed to download Word document: ${error.message}`);
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
        jurisdiction: jurisdiction,
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
    const hasMessages = messages.length > 0;
    return (
      <div className="flex relative h-screen bg-background overflow-hidden">
        <div className="w-full relative z-10 flex flex-col h-screen overflow-hidden">
          {/* Unified Top Bar Header */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 bg-card border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-primary/10 text-primary rounded-lg flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">Legal Document Assistant</h2>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto sm:max-w-2xl sm:flex-1 sm:justify-end min-w-0">
              <div className="relative flex-1 sm:max-w-xs min-w-0">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title..."
                  className="pl-9 bg-background border border-input text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary rounded-lg h-9 text-xs w-full"
                />
              </div>
              <Button
                onClick={handleSaveConversation}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 rounded-lg shadow-sm h-9 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create Document</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          </div>

          {/* Chat Interface Container */}
          <div className="flex-1 p-6 lg:p-8 flex items-center justify-center overflow-hidden bg-background">
            <Card className="w-full max-w-4xl bg-card border border-border shadow-sm rounded-xl overflow-hidden min-h-[450px] max-h-[600px] flex flex-col">
              <CardHeader className="pb-4 bg-muted/20 border-b border-border flex-shrink-0 p-5">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">AI Assistant</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">Describe the document you want to create</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 flex flex-col overflow-hidden bg-card">
                <div ref={chatContainerRef} className="flex-grow flex flex-col overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                  {!hasMessages && !isGenerating ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto my-auto py-8">
                      <div className="p-4 bg-primary/10 rounded-full text-primary border border-primary/20">
                        <Sparkles className="w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground">What document do you need?</h3>
                        <p className="text-sm text-muted-foreground leading-normal">
                          Describe the legal document you want to create, or click one of the templates below to prefill the prompt.
                        </p>
                      </div>

                      {/* Jurisdiction Selection Segmented Toggle */}
                      <div className="flex flex-col items-center gap-1.5 pt-1 select-none">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Jurisdiction</span>
                        <div className="flex bg-muted p-0.5 rounded-full border border-border">
                          <button
                            onClick={() => setJurisdiction('india')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              jurisdiction === 'india'
                                ? 'bg-card text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            India
                          </button>
                          <button
                            onClick={() => setJurisdiction('generic')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              jurisdiction === 'generic'
                                ? 'bg-card text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Generic / International
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2.5 justify-center pt-2">
                        {[
                          "Draft an NDA",
                          "Create a rental agreement",
                          "Generate a freelance contract",
                          "Employment offer letter"
                        ].map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => setChatMessage(prompt)}
                            className="px-4 py-2 bg-card hover:bg-muted border border-border rounded-full text-sm font-medium transition-colors cursor-pointer text-foreground"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.filter(msg => msg.type !== 'document_context').map((msg, index) => (
                        <div key={index} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                          {msg.sender === 'bot' && (
                            <div className="w-6 h-6 flex-shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className={`px-4 py-2.5 rounded-lg max-w-xs text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted text-foreground border border-border'
                          }`}>
                            <p style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{msg.text}</p>
                          </div>
                          {msg.sender === 'user' && (
                            <div className="w-6 h-6 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isGenerating && (
                        <div className="flex gap-2">
                          <div className="w-6 h-6 flex-shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 animate-pulse" />
                          </div>
                          <div className="px-4 py-2.5 rounded-lg bg-muted border border-border">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-4 flex-shrink-0 mt-4">
                  <Input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe the document you want to create..."
                    className="flex-1 bg-background border border-input text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary rounded-lg h-12 text-sm"
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isGenerating || !chatMessage.trim()}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 rounded-lg shadow-sm h-12 cursor-pointer font-semibold flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex relative h-full bg-background overflow-hidden overflow-x-hidden">
      {/* Left Sidebar - Chat */}
      {!isZenMode && (
        <AppSidebar
          side="left"
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenCollapsed={() => setSidebarOpen(true)}
          icon={MessageCircle}
          title="Chat History"
          collapsedRail={true}
        >
          <div className="flex flex-col h-full overflow-hidden bg-background/30 select-none">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
              {messages.filter(msg => msg.type !== 'document_context').map((msg, index) => (
                <div key={index} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 flex-shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-lg max-w-xs text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-foreground border border-border'
                  }`}>
                    <p style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{msg.text}</p>
                  </div>
                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isGenerating && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 flex-shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-muted border border-border">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-card space-y-2 mt-auto">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for changes..."
                  className="flex-1 bg-background border border-input text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary rounded-lg h-10 text-sm"
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isGenerating || !chatMessage.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-10 w-10 p-0 cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </AppSidebar>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 min-w-0 bg-background relative">
        {/* Top Bar (Hidden in Zen Mode) */}
        {!isZenMode && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 bg-card border-b border-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto sm:flex-1">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 hover:bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shadow-sm flex-shrink-0"
                  title="Open chat history"
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                </button>
              )}
              <div className="min-w-0 flex-1 flex items-center gap-2">
                {isTitleEditing ? (
                  <Input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                    }}
                    className="text-xl lg:text-2xl font-bold bg-background border border-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary rounded-lg h-10"
                  />
                ) : (
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground truncate">{title || 'Your Document'}</h2>
                )}
                {mongoConversationId && ( // Only show edit/save/cancel if document exists
                  isTitleEditing ? (
                    <>
                      <Button size="icon" variant="ghost" onClick={handleSaveTitle} title="Save Title" className="cursor-pointer">
                        <Save className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancelTitleEdit} title="Cancel Edit" className="cursor-pointer">
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={handleEditTitleClick} title="Edit Title" className="cursor-pointer">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-start sm:justify-end items-center w-full sm:w-auto">
              {/* Jurisdiction Toggle Pill (Toolbar) */}
              <div className="flex bg-muted p-0.5 rounded-full border border-border select-none mr-1">
                <button
                  onClick={() => setJurisdiction('india')}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                    jurisdiction === 'india'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Draft documents based on Indian laws"
                >
                  India
                </button>
                <button
                  onClick={() => setJurisdiction('generic')}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer ${
                    jurisdiction === 'generic'
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Draft documents based on generic laws"
                >
                  Generic
                </button>
              </div>

              {/* Segmented Control for Edit/Preview */}
              <div className="flex bg-muted p-1 rounded-lg mr-1.5">
                <button
                  onClick={() => setIsEditing(true)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    isEditing
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    !isEditing
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-border mx-1" />

              {/* Clause Library Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (rightSidebarOpen && rightSidebarTab === 'clause-library') {
                    setRightSidebarOpen(false);
                  } else {
                    setRightSidebarOpen(true);
                    setRightSidebarTab('clause-library');
                  }
                }}
                className={`border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg h-9 w-9 p-0 transition-all cursor-pointer flex items-center justify-center mr-1.5 ${
                  rightSidebarOpen && rightSidebarTab === 'clause-library' ? 'bg-primary/10 text-primary border-primary/20' : ''
                }`}
                title="Clause Library"
              >
                <BookOpen className="w-4 h-4" />
              </Button>

              {/* Overflow Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOverflowOpen(!isOverflowOpen)}
                  className="border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg h-9 w-9 p-0 transition-all cursor-pointer flex items-center justify-center font-bold text-lg"
                  title="More Actions"
                >
                  ⋯
                </Button>
                {isOverflowOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOverflowOpen(false)} />
                    <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-md py-1 z-50 animate-fadeIn">
                      <button
                        onClick={() => {
                          setIsOverflowOpen(false);
                          if (rightSidebarOpen && rightSidebarTab === 'clause-library') {
                            setRightSidebarOpen(false);
                          } else {
                            setRightSidebarOpen(true);
                            setRightSidebarTab('clause-library');
                          }
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                      >
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span>Clause Library</span>
                      </button>
                      {mongoConversationId && (
                        <>
                          <button
                            onClick={() => {
                              setIsOverflowOpen(false);
                              if (rightSidebarOpen && rightSidebarTab === 'comments') {
                                setRightSidebarOpen(false);
                              } else {
                                setRightSidebarOpen(true);
                                setRightSidebarTab('comments');
                              }
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                          >
                            <MessageCircle className="w-4 h-4 text-muted-foreground" />
                            <span>Comments</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsOverflowOpen(false);
                              if (rightSidebarOpen && rightSidebarTab === 'versions') {
                                setRightSidebarOpen(false);
                              } else {
                                setRightSidebarOpen(true);
                                setRightSidebarTab('versions');
                              }
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                          >
                            <History className="w-4 h-4 text-muted-foreground" />
                            <span>Versions</span>
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setIsOverflowOpen(false);
                          handleShareDocument();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                      >
                        <Share2 className="w-4 h-4 text-muted-foreground" />
                        <span>Share Document</span>
                      </button>
                      {mongoConversationId && (
                        <button
                          onClick={() => {
                            setIsOverflowOpen(false);
                            handleSaveAsTemplate();
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                        >
                          <Save className="w-4 h-4 text-muted-foreground" />
                          <span>Save as Template</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsOverflowOpen(false);
                          setIsZenMode(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                      >
                        <Maximize className="w-4 h-4 text-muted-foreground" />
                        <span>Zen Mode</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsOverflowOpen(false);
                          setIsSignatureModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                      >
                        <PenTool className="w-4 h-4 text-muted-foreground" />
                        <span>Add Signature</span>
                      </button>
                       <button
                        onClick={() => {
                          setIsOverflowOpen(false);
                          handleDownloadPdf();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors border-b border-border/50"
                      >
                        <Download className="w-4 h-4 text-muted-foreground" />
                        <span>Download PDF</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsOverflowOpen(false);
                          handleDownloadDocx();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted text-foreground flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>Download Word</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Save Version Button */}
              <Button
                onClick={handleSaveConversation}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm font-semibold h-9 px-4 text-xs lg:text-sm cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Version</span>
              </Button>
            </div>
          </div>
        )}

        {/* Floating Zen Mode controls */}
        {isZenMode && (
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsZenMode(false)}
              className="border border-border bg-card/90 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg h-9 px-3 cursor-pointer shadow-sm text-xs font-semibold"
            >
              Exit Zen Mode
            </Button>
            <Button
              onClick={handleSaveConversation}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm h-9 px-4 text-xs font-semibold cursor-pointer"
            >
              Save Version
            </Button>
          </div>
        )}

        {/* Document Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-background custom-scrollbar">
          {isTemplateActive && templateVariables.length > 0 && (
            <div className="mb-6 p-5 bg-card border border-border rounded-xl shadow-sm space-y-4">
              <div className="flex justify-between items-center select-none">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Fill Template Variables</h3>
                  <p className="text-[11px] text-muted-foreground">The fields below will substitute the placeholders in the document in real time.</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsTemplateActive(false)}
                  className="text-xs cursor-pointer h-8"
                >
                  Finish Editing Fields
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templateVariables.map((variable) => (
                  <div key={variable} className="space-y-1">
                    <Label htmlFor={`var-${variable}`} className="text-[10px] font-bold uppercase text-muted-foreground">{variable.split('_').join(' ')}</Label>
                    <Input
                      id={`var-${variable}`}
                      value={templateValues[variable] || ''}
                      onChange={(e) => handleTemplateValueChange(variable, e.target.value)}
                      placeholder={`Enter ${variable.split('_').join(' ')}`}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {isEditing ? (
            <div className="border border-border rounded-xl overflow-hidden flex flex-col bg-card min-h-full">
              <MenuBar editor={editor} />
              <div ref={documentRef} className="flex-1 p-8 text-foreground bg-card">
                <div className="max-w-5xl mx-auto w-full select-text">
                  <EditorContent editor={editor} />
                  {menuPosition && isEditing && (
                    <div 
                      className="fixed z-50 flex bg-card border border-border shadow-lg rounded-lg overflow-hidden p-1 gap-1 items-center select-none"
                      style={{
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <button
                        onClick={() => handleInlineAction('formal')}
                        disabled={refiningAction !== null}
                        className={`px-2.5 py-1 text-xs hover:bg-muted font-semibold rounded transition-all text-foreground flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {refiningAction === 'formal' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                        <span>Make Formal</span>
                      </button>
                      <button
                        onClick={() => handleInlineAction('simplify')}
                        disabled={refiningAction !== null}
                        className={`px-2.5 py-1 text-xs hover:bg-muted font-semibold rounded transition-all text-foreground flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {refiningAction === 'simplify' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                        <span>Simplify</span>
                      </button>
                      <button
                        onClick={() => handleInlineAction('favorable')}
                        disabled={refiningAction !== null}
                        className={`px-2.5 py-1 text-xs hover:bg-muted font-semibold rounded transition-all text-foreground flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {refiningAction === 'favorable' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                        <span>Make Favorable</span>
                      </button>
                      <button
                        onClick={() => handleInlineAction('shorten')}
                        disabled={refiningAction !== null}
                        className={`px-2.5 py-1 text-xs hover:bg-muted font-semibold rounded transition-all text-foreground flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {refiningAction === 'shorten' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
                        <span>Shorten</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div ref={documentRef} className="bg-card border border-border rounded-xl p-8 text-foreground min-h-full flex flex-col">
              <div className="markdown-preview max-w-5xl mx-auto w-full leading-relaxed py-4 select-text flex-1">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(finalDocument) }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Tabbed Comments & Versions */}
      <AppSidebar
        side="right"
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
        onOpenCollapsed={() => setRightSidebarOpen(true)}
        icon={BookOpen}
        title="Document Workspace"
        collapsedRail={true}
      >
        <div className="flex flex-col h-full overflow-hidden bg-background/30 select-none">
          {/* Sidebar Tab Header */}
          <div className="p-2 border-b border-border flex items-center justify-center flex-shrink-0 bg-muted/20">
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              {mongoConversationId && (
                <>
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
                </>
              )}
              <button
                onClick={() => setRightSidebarTab('clause-library')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  (mongoConversationId ? rightSidebarTab : 'clause-library') === 'clause-library'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Clause Library
              </button>
            </div>
          </div>

          {/* Sidebar Tab Content */}
          <div className="flex-grow overflow-hidden flex flex-col">
            {(mongoConversationId ? rightSidebarTab : 'clause-library') === 'comments' && mongoConversationId ? (
              <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col">
                <CommentList documentId={mongoConversationId} />
              </div>
            ) : (mongoConversationId ? rightSidebarTab : 'clause-library') === 'versions' && mongoConversationId ? (
              <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col">
                <VersionsSidebar
                  conversationId={mongoConversationId}
                  onSelectVersion={handleSelectVersion}
                  onClose={() => setRightSidebarOpen(false)}
                  currentVersion={currentVersion}
                  onDeleteVersion={handleDeleteVersion}
                />
              </div>
            ) : (
              <div className="flex-grow overflow-hidden flex flex-col h-full">
                <ClauseLibraryPanel editor={editor} setIsEditing={setIsEditing} />
              </div>
            )}
          </div>
        </div>
      </AppSidebar>


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
          documentId={mongoConversationId}
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