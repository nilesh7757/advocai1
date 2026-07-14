import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/button";
import { BadgeCheck, Clock, ShieldAlert, MessageSquare } from "lucide-react";

const statusColors = {
  pending: "text-muted-foreground",
  approved: "text-primary",
  rejected: "text-destructive",
};

const monthNames = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};

const getMonthLabel = (monthStr) => {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const parts = monthStr.split('-');
  const mm = parts[1];
  const yearShort = parts[0].slice(-2);
  return `${monthNames[mm] || mm} '${yearShort}`;
};

const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const LawyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "lawyer") {
      toast.error("This dashboard is only available to lawyer accounts.");
      navigate("/");
      return;
    }

    const loadDashboard = async () => {
      try {
        const response = await axios.get("api/lawyer/dashboard/");
        setDashboard(response.data);
      } catch (err) {
        console.error("Failed to load lawyer dashboard:", err);
        setError(err.response?.data?.error || "Unable to load lawyer dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, navigate]);

  const handleConnectionUpdate = async (requestId, status) => {
    try {
      const response = await axios.patch(`api/lawyer/connections/${requestId}/`, { status });
      toast.success(response.data?.message || "Connection updated.");
      
      // Reload dashboard to get updated data including new chat conversations
      const dashboardResponse = await axios.get("api/lawyer/dashboard/");
      setDashboard(dashboardResponse.data);
      
      // If accepted, show option to open chat
      if (status === 'accepted') {
        setTimeout(() => {
          toast.success('Connection accepted! You can now chat with the client.', { duration: 4000 });
        }, 500);
      }
    } catch (err) {
      console.error("Failed to update connection request:", err);
      toast.error(err.response?.data?.error || "Unable to update request.");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 animate-fade-in">
        <div className="text-center text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 animate-fade-in">
        <div className="text-center text-red-400">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { profile, connections, summary, user: lawyerUser } = dashboard;
  const verificationStatus = lawyerUser?.lawyer_verification_status || profile?.verification_status || "pending";

  return (
    <div className="container mx-auto py-10 animate-fade-in space-y-8">
      <Card className="bg-card border-border backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-10 h-10 text-blue-400" />
            <div>
              <CardTitle className="text-2xl text-white">Lawyer Verification</CardTitle>
              <CardDescription className="text-gray-400">
                Track the status of your professional account verification.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className={`text-lg font-semibold ${statusColors[verificationStatus] || "text-gray-300"}`}>
                Status: {verificationStatus.toUpperCase()}
              </p>
              {profile?.verification_notes && (
                <p className="text-sm text-gray-300 mt-2">Notes: {profile.verification_notes}</p>
              )}
            </div>
            {verificationStatus === "pending" && (
              <div className="flex items-center gap-2 text-yellow-300 text-sm">
                <Clock className="w-4 h-4" />
                Your verification is being reviewed. This usually takes 1-2 business days.
              </div>
            )}
            {verificationStatus === "rejected" && (
              <div className="flex items-center gap-2 text-red-300 text-sm">
                <ShieldAlert className="w-4 h-4" />
                Update your credentials or contact support for assistance.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm">Total Requests</p>
            <p className="text-2xl font-bold text-foreground">{summary.total_requests}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm">Pending</p>
            <p className="text-2xl font-bold text-muted-foreground">{summary.pending_requests}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm">Accepted</p>
            <p className="text-2xl font-bold text-primary">{summary.accepted_requests}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm">Declined</p>
            <p className="text-2xl font-bold text-destructive">{summary.declined_requests}</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests Monthly Trend Chart */}
      {dashboard.requests_by_month && dashboard.requests_by_month.length > 0 && (
        <Card className="bg-card border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-xl">Connection Requests Trend</CardTitle>
            <CardDescription className="text-muted-foreground">
              Number of connection requests received over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center">
              {/* Bar Chart Container */}
              <div className="w-full max-w-2xl h-64 border-b border-border flex items-end justify-between px-6 pb-2 select-none">
                {(() => {
                  const counts = dashboard.requests_by_month.map(item => item.count || 0);
                  const maxCount = Math.max(...counts, 1);
                  
                  return dashboard.requests_by_month.map((item, idx) => {
                    const pct = ((item.count || 0) / maxCount) * 100;
                    const heightPct = item.count > 0 ? Math.max(pct, 4) : 0;
                    
                    return (
                      <div key={idx} className="flex flex-col items-center group relative w-12 md:w-16">
                        <div className="absolute bottom-full mb-2 bg-popover text-popover-foreground border border-border px-2.5 py-1 rounded text-xs font-semibold shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap">
                          {item.count} {item.count === 1 ? 'request' : 'requests'}
                        </div>
                        
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-primary hover:bg-primary/95 rounded-t transition-all duration-300"
                        />
                        
                        <span className="text-[10px] text-muted-foreground font-semibold mt-1">
                          {item.count}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
              
              {/* Labels Row */}
              <div className="w-full max-w-2xl flex justify-between px-6 pt-2 select-none">
                {dashboard.requests_by_month.map((item, idx) => (
                  <span key={idx} className="text-xs font-medium text-muted-foreground w-12 md:w-16 text-center">
                    {getMonthLabel(item.month)}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-xl">Connection Requests</CardTitle>
          <CardDescription className="text-muted-foreground">
            Respond to clients who want to connect with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connections.length === 0 && (
            <div className="text-center text-muted-foreground py-6">No connection requests yet.</div>
          )}
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="border-border rounded-lg p-4 bg-background/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <p className="text-foreground font-semibold">
                  {connection.client?.name || connection.client?.username || "Client"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Contact: {connection.preferred_contact_value || connection.client?.email || "Not provided"}
                </p>
                {connection.preferred_time && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Preferred time: {formatDateTime(connection.preferred_time)}
                  </p>
                )}
                {connection.meeting_link && (
                  <p className="text-sm text-primary mt-1">
                    Google Meet:{" "}
                    <a
                      href={connection.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-primary/80"
                    >
                      {connection.meeting_link}
                    </a>
                  </p>
                )}
                {connection.message && (
                  <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                    “{connection.message}”
                  </p>
                )}
                <p className="text-xs text-muted-foreground/80 mt-2">
                  Status: <span className="uppercase">{connection.status}</span>
                </p>
              </div>
              {connection.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleConnectionUpdate(connection.id, "accepted")}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleConnectionUpdate(connection.id, "declined")}
                  >
                    Decline
                  </Button>
                </div>
              )}
              {connection.status === "accepted" && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={async () => {
                    try {
                      console.log('Opening chat for connection:', connection.id);
                      
                      // Try to get conversation by connection_request_id
                      const convResponse = await axios.get(
                        `api/chat/conversations/?connection_request_id=${connection.id}`
                      );
                      
                      console.log('Conversation response:', convResponse.data);
                      
                      if (convResponse.data && convResponse.data.id) {
                        navigate(`/chat/${convResponse.data.id}`);
                        return;
                      }
                      
                      // Fallback: search all conversations
                      console.log('Fallback: searching all conversations');
                      const allConvsResponse = await axios.get('api/chat/conversations/');
                      console.log('All conversations:', allConvsResponse.data);
                      
                      const conv = allConvsResponse.data.find(c => {
                        const matchesConnectionId = c.connection_request_id === connection.id;
                        const matchesUsers = c.client?.id === connection.client?.id && 
                                           c.lawyer?.id === connection.lawyer?.id;
                        return matchesConnectionId || matchesUsers;
                      });
                      
                      if (conv) {
                        console.log('Found conversation:', conv.id);
                        navigate(`/chat/${conv.id}`);
                      } else {
                        console.error('No conversation found for connection:', connection.id);
                        toast.error('Chat conversation not found. Please refresh the page and try again.');
                      }
                    } catch (err) {
                      console.error('Failed to load conversation:', err);
                      console.error('Error details:', err.response?.data);
                      const errorMsg = err.response?.data?.error || err.message || 'Failed to open chat';
                      toast.error(errorMsg);
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Open Chat
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default LawyerDashboard;

