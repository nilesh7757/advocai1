import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/button";
import { MessageSquare, ArrowRight, Clock } from 'lucide-react';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevRequestsRef = useRef([]);

  useEffect(() => {
    loadAllItems();
    const interval = setInterval(loadAllItems, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAllItems = async () => {
    try {
      const [convResponse, reqResponse] = await Promise.all([
        axios.get('api/chat/conversations/'),
        axios.get('api/lawyer/connections/')
      ]);

      const requests = (reqResponse.data || []).map(r => ({ ...r, type: 'request' }));

      // Build lookup: connection_request_id → case_status
      const caseStatusMap = {};
      requests.forEach(r => { caseStatusMap[r.id] = r.case_status || 'open'; });

      const conversations = (convResponse.data.results || convResponse.data || []).map(c => ({
        ...c,
        type: 'conversation',
        case_status: c.connection_request_id ? (caseStatusMap[c.connection_request_id] || 'open') : null,
      }));

      // Compare status transitions to show toasts
      if (prevRequestsRef.current.length > 0) {
        requests.forEach(req => {
          const prev = prevRequestsRef.current.find(p => p.id === req.id);
          if (prev && prev.status !== req.status) {
            const lawyerName = req.lawyer?.name || req.lawyer?.username || 'the lawyer';
            const isQuote = req.request_type === 'quote';
            const typeLabel = isQuote ? 'quote request' : 'connection request';
            if (req.status === 'accepted') {
              toast.success(`Your ${typeLabel} to ${lawyerName} was accepted!`, { icon: '🎉' });
            } else if (req.status === 'declined') {
              toast.error(`Your ${typeLabel} to ${lawyerName} was declined.`);
            }
          }
        });
      }
      prevRequestsRef.current = requests;

      const combined = [...conversations, ...requests].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      setItems(combined);
    } catch (err) {
      console.error('Failed to load items:', err);
      toast.error(err.response?.data?.error || 'Failed to load messages and requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (connectionId) => {
    if (!window.confirm('Are you sure you want to withdraw this request?')) return;

    try {
      await axios.patch(`api/lawyer/connections/${connectionId}/withdraw/`);
      toast.success('Request withdrawn.');
      loadAllItems(); // Refresh the list
    } catch (err) {
      console.error('Failed to withdraw request:', err);
      toast.error(err.response?.data?.error || 'Failed to withdraw request.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 animate-fade-in">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    );
  }

  const activeConversations = items.filter(item => item.type === 'conversation');
  const pendingRequests = items.filter(item => item.type === 'request' && item.status === 'pending');
  const pastRequests = items.filter(item => item.type === 'request' && (item.status === 'declined' || item.status === 'withdrawn' || item.status === 'rejected'));

  return (
    <div className="container mx-auto py-10 animate-fade-in">
      <div className="text-center mb-10 select-none">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          <span className="text-primary text-xs font-medium">Messages & Requests</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
          My Consultations
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Your lawyer connections and conversations in one place.
        </p>
      </div>

      {items.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-10 text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No consultations or conversations to show.</p>
            <p className="text-muted-foreground/60 text-sm mt-2">
              Connect with a lawyer to start a conversation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 select-none">
          {/* Active Conversations Section */}
          {activeConversations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Active Conversations</h2>
                <span className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-full">
                  {activeConversations.length}
                </span>
              </div>
              <div className="grid gap-3">
                {activeConversations.map((item) => {
                  const otherUser = item.client?.id === user?.id ? item.lawyer : item.client;
                  return (
                    <Card
                      key={`conv-${item.id}`}
                      className="bg-card border-border hover:border-primary/60 transition-all duration-200 cursor-pointer"
                      onClick={() => navigate(`/chat/${item.id}`)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-semibold text-sm">
                              {otherUser?.name?.split(' ').map(n => n[0]).join('') || otherUser?.username?.slice(0, 2).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h3 className="text-foreground font-semibold text-sm">{otherUser?.name || otherUser?.username || 'Unknown User'}</h3>
                            <p className="text-muted-foreground text-xs truncate">
                              {item.last_message ? (item.last_message.message_type === 'document' ? `📄 ${item.last_message.document_title || 'Document'}` : item.last_message.message) : 'No messages yet'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.case_status && item.case_status !== 'open' && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${
                              item.case_status === 'in_progress' ? 'bg-primary/10 text-primary' :
                              item.case_status === 'resolved' ? 'bg-muted text-muted-foreground' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {item.case_status === 'in_progress' ? 'In Progress' : 'Resolved'}
                            </span>
                          )}
                          {item.unread_count > 0 && (
                            <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                              {item.unread_count}
                            </span>
                          )}
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Pending Requests</h2>
                <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="grid gap-3">
                {pendingRequests.map((item) => {
                  const targetUser = item.lawyer;
                  const isQuote = item.request_type === 'quote';
                  return (
                    <Card
                      key={`req-${item.id}`}
                      className="bg-card border-border"
                    >
                      <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-foreground font-semibold text-sm">
                              {isQuote ? 'Quote' : 'Consultation'} Request to {targetUser?.name || targetUser?.username}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-semibold rounded uppercase">
                                Pending
                              </span>
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded uppercase">
                                {isQuote ? 'Quote' : 'Consultation'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 text-xs cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithdraw(item.id);
                          }}
                        >
                          Withdraw
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Past Requests Section */}
          {pastRequests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Past Requests</h2>
                <span className="bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                  {pastRequests.length}
                </span>
              </div>
              <div className="grid gap-3">
                {pastRequests.map((item) => {
                  const targetUser = item.lawyer;
                  const isQuote = item.request_type === 'quote';
                  const isWithdrawn = item.status === 'withdrawn';
                  
                  return (
                    <Card
                      key={`req-${item.id}`}
                      className={`bg-card border-border ${isWithdrawn ? 'opacity-65' : ''}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-muted/40 border border-border rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-foreground font-semibold text-sm">
                              {isQuote ? 'Quote' : 'Consultation'} Request to {targetUser?.name || targetUser?.username}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {item.status === 'declined' || item.status === 'rejected' ? (
                                <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-[10px] font-semibold rounded uppercase">
                                  Declined
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-semibold rounded uppercase">
                                  Withdrawn
                                </span>
                              )}
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded uppercase">
                                {isQuote ? 'Quote' : 'Consultation'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatList;