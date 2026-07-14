import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/Input";
import { Send, Paperclip, FileText, ArrowLeft, Star } from 'lucide-react';
import ReviewModal from '../Components/ReviewModal';

const CASE_STATUS_OPTS = [
  { value: 'open',        label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved',    label: 'Resolved' },
];

const CASE_STATUS_CLASS = {
  open:        'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  resolved:    'bg-accent/20 text-accent-foreground',
};

const Chat = () => {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [connectionReq, setConnectionReq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [caseStatus, setCaseStatus] = useState('open');
  const [updatingCase, setUpdatingCase] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      loadConversation();
      loadUserDocuments();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await axios.get(`api/chat/conversations/${conversationId}/messages/`);
      setMessages(response.data || []);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast.error(err.response?.data?.error || 'Failed to load messages.');
      }
    }
  };

  const loadConversation = async () => {
    try {
      const response = await axios.get('api/chat/conversations/');
      const allConvs = response.data?.results || response.data || [];
      const conv = Array.isArray(allConvs)
        ? allConvs.find(c => c.id === conversationId)
        : (response.data?.id === conversationId ? response.data : null);

      if (conv) {
        setConversation(conv);
        // Load the underlying connection request for case status + review
        if (conv.connection_request_id) {
          try {
            const connsResp = await axios.get('api/lawyer/connections/');
            const req = (connsResp.data || []).find(r => r.id === conv.connection_request_id);
            if (req) {
              setConnectionReq(req);
              setCaseStatus(req.case_status || 'open');
              // Check if already reviewed (only for clients)
              if (user?.role !== 'lawyer') {
                const reviewCheck = await axios.get(
                  `api/lawyer/connections/${req.id}/review/check/`
                );
                setHasReviewed(reviewCheck.data?.has_reviewed || false);
              }
            }
          } catch (e) {
            console.error('Failed to load connection request:', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDocuments = async () => {
    try {
      const response = await axios.get('api/documents/conversations/');
      setAvailableDocuments(response.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await axios.post(`api/chat/conversations/${conversationId}/messages/`, {
        message: newMessage.trim(),
        message_type: 'text',
      });
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const shareDocument = async (documentId, documentTitle) => {
    setSending(true);
    try {
      await axios.post(`api/chat/conversations/${conversationId}/messages/`, {
        message: `Shared document: ${documentTitle}`,
        message_type: 'document',
        document_id: documentId,
        document_title: documentTitle,
      });
      setShowDocumentPicker(false);
      loadMessages();
      toast.success('Document shared successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to share document.');
    } finally {
      setSending(false);
    }
  };

  const handleCaseStatusChange = async (newStatus) => {
    if (!connectionReq?.id) return;
    setUpdatingCase(true);
    try {
      await axios.patch(`api/lawyer/connections/${connectionReq.id}/case/`, {
        case_status: newStatus,
      });
      setCaseStatus(newStatus);
      toast.success(`Case status updated to "${CASE_STATUS_OPTS.find(o => o.value === newStatus)?.label}"`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update case status.');
    } finally {
      setUpdatingCase(false);
    }
  };

  const handleSubmitReview = async ({ rating, review_text }) => {
    if (!connectionReq?.id) return;
    try {
      await axios.post(`api/lawyer/connections/${connectionReq.id}/review/`, {
        rating,
        review_text,
      });
      toast.success('Review submitted! Thank you.');
      setHasReviewed(true);
      setShowReview(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit review.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 animate-fade-in">
        <div className="text-center text-muted-foreground">Loading conversation...</div>
      </div>
    );
  }

  const otherUser = conversation?.client?.id === user?.id
    ? conversation?.lawyer
    : conversation?.client;

  const isClient = conversation?.client?.id === user?.id;

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-var(--navbar-height))] flex flex-col animate-fade-in">
      <Card className="flex-1 flex flex-col bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <CardTitle className="text-foreground">
                  {otherUser?.name || otherUser?.username || 'Chat'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {conversation?.lawyer?.id === user?.id ? 'Client' : 'Lawyer'}
                </p>
              </div>
            </div>

            {/* Case status + review controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {connectionReq && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Case:</span>
                  <select
                    value={caseStatus}
                    disabled={updatingCase}
                    onChange={(e) => handleCaseStatusChange(e.target.value)}
                    className={`text-xs font-semibold rounded px-2 py-1 border border-border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${CASE_STATUS_CLASS[caseStatus] || 'bg-muted text-muted-foreground'}`}
                  >
                    {CASE_STATUS_OPTS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {isClient && connectionReq && !hasReviewed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 gap-1 border-border text-foreground"
                  onClick={() => setShowReview(true)}
                >
                  <Star className="w-3 h-3" />
                  Rate Lawyer
                </Button>
              )}
              {isClient && hasReviewed && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  Reviewed
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            {messages.map((msg) => {
              const senderId = msg.sender?.id || msg.sender;
              const userId = user?.id || user;
              const isOwn = String(senderId) === String(userId);
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : msg.message_type === 'system'
                        ? 'bg-muted/50 text-muted-foreground text-center mx-auto'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {msg.message_type === 'document' && (
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" />
                        <a
                          href={`/documentShare/${msg.document_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          {msg.document_title || 'Document'}
                        </a>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Document Picker Modal */}
          {showDocumentPicker && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
              <Card className="w-full max-w-md bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Share Document</CardTitle>
                </CardHeader>
                <CardContent className="max-h-96 overflow-y-auto">
                  {availableDocuments.length === 0 ? (
                    <p className="text-muted-foreground">No documents available.</p>
                  ) : (
                    <div className="space-y-2">
                      {availableDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-foreground">{doc.title || 'Untitled Document'}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => shareDocument(doc.id, doc.title || 'Untitled Document')}
                            disabled={sending}
                          >
                            Share
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => setShowDocumentPicker(false)}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentPicker(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReview}
        onOpenChange={setShowReview}
        lawyerName={otherUser?.name || otherUser?.username}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
};

export default Chat;
