import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/Components/ui/Card";
import { Button } from "@/Components/ui/button";
import { Switch } from "@/Components/ui/switch";
import { Textarea } from "@/Components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/Select";
import { BadgeCheck, Clock, ShieldAlert, MessageSquare, CalendarDays, Star, Plus, Trash2, Download, Timer } from "lucide-react";
import { saveAs } from "file-saver";

const DAYS = [
  { key: 'monday',    label: 'Monday' },
  { key: 'tuesday',   label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday' },
  { key: 'friday',    label: 'Friday' },
  { key: 'saturday',  label: 'Saturday' },
  { key: 'sunday',    label: 'Sunday' },
];

const defaultSlots = () => DAYS.map(d => ({ day: d.key, enabled: false, start_time: '09:00', end_time: '17:00' }));

const buildSlotsFromProfile = (availability) => {
  const map = {};
  (availability || []).forEach(slot => { map[slot.day] = slot; });
  return DAYS.map(d => ({
    day: d.key,
    enabled: !!map[d.key],
    start_time: map[d.key]?.start_time || '09:00',
    end_time:   map[d.key]?.end_time   || '17:00',
  }));
};

const statusColors = {
  pending: "text-muted-foreground",
  approved: "text-primary",
  rejected: "text-destructive",
  not_submitted: "text-amber-500",
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

const relativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const elapsedDays = (dateStr) => {
  if (!dateStr) return 0;
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((Date.now() - then) / 86400000);
};

const RatingStars = ({ rating, size = 'w-4 h-4' }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`${size} ${i <= Math.round(rating) ? 'fill-primary text-primary' : 'fill-muted-foreground/20 text-muted-foreground/20'}`}
      />
    ))}
  </div>
);

const LawyerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [slots, setSlots] = useState(defaultSlots());
  const [savingAvail, setSavingAvail] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ average_rating: null, review_count: 0 });

  // FEATURE 1 — Quick reply templates
  const [quickReplies, setQuickReplies] = useState([]);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [newTemplateLabel, setNewTemplateLabel] = useState('');
  const [newTemplateMessage, setNewTemplateMessage] = useState('');
  const [savingReplies, setSavingReplies] = useState(false);

  // FEATURE 1 — Per-connection reply state
  const [activeReplyConnection, setActiveReplyConnection] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  // FEATURE 3 — Export date range
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await axios.get("api/lawyer/dashboard/");
      setDashboard(response.data);
      setSlots(buildSlotsFromProfile(response.data?.profile?.availability));
      setQuickReplies(response.data?.profile?.quick_reply_templates || []);
    } catch (err) {
      console.error("Failed to load lawyer dashboard:", err);
      setError(err.response?.data?.error || "Unable to load lawyer dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "lawyer") {
      toast.error("This dashboard is only available to lawyer accounts.");
      navigate("/");
      return;
    }
    loadDashboard();
  }, [user, navigate, loadDashboard]);

  useEffect(() => {
    if (!dashboard?.user?.id) return;
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`lawyer/${dashboard.user.id}/reviews/`);
        const results = res.data?.results || res.data || [];
        setReviews(Array.isArray(results) ? results : []);
        if (results.length > 0) {
          const sum = results.reduce((acc, r) => acc + (r.rating || 0), 0);
          setReviewMeta({ average_rating: Math.round((sum / results.length) * 10) / 10, review_count: results.length });
        } else {
          setReviewMeta({ average_rating: null, review_count: 0 });
        }
      } catch {
        // Reviews endpoint may fail for newly created lawyers — non-critical
      }
    };
    fetchReviews();
  }, [dashboard]);

  const handleSlotToggle = (idx, enabled) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, enabled } : s));
  };

  const handleSlotTime = (idx, field, value) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleSaveAvailability = async () => {
    setSavingAvail(true);
    try {
      const payload = slots
        .filter(s => s.enabled)
        .map(({ day, start_time, end_time }) => ({ day, start_time, end_time }));
      await axios.patch('api/lawyer/availability/', { availability: payload });
      toast.success('Availability saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save availability.');
    } finally {
      setSavingAvail(false);
    }
  };

  const handleConnectionUpdate = async (requestId, status, messageOverride) => {
    try {
      const payload = { status };
      if (messageOverride) payload.response_message = messageOverride;
      const response = await axios.patch(`api/lawyer/connections/${requestId}/`, payload);
      toast.success(response.data?.message || "Connection updated.");
      setActiveReplyConnection(null);
      setReplyMessage('');
      const dashboardResponse = await axios.get("api/lawyer/dashboard/");
      setDashboard(dashboardResponse.data);
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

  const handleCaseStatusChange = async (connectionId, newCaseStatus) => {
    try {
      await axios.patch(`api/lawyer/connections/${connectionId}/case/`, { case_status: newCaseStatus });
      toast.success(`Case status updated to ${newCaseStatus.replace('_', ' ')}.`);
      setDashboard(prev => {
        if (!prev) return prev;
        const updatedConnections = prev.connections.map(c => {
          if (c.id === connectionId) return { ...c, case_status: newCaseStatus };
          return c;
        });
        const accepted = updatedConnections.filter(c => c.status === 'accepted');
        return {
          ...prev,
          connections: updatedConnections,
          summary: {
            ...prev.summary,
            open_cases: accepted.filter(c => c.case_status === 'open').length,
            in_progress_cases: accepted.filter(c => c.case_status === 'in_progress').length,
            resolved_cases: accepted.filter(c => c.case_status === 'resolved').length,
          },
        };
      });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update case status.");
    }
  };

  const handleOpenChat = async (connection) => {
    try {
      const convResponse = await axios.get(
        `api/chat/conversations/?connection_request_id=${connection.id}`
      );
      if (convResponse.data && convResponse.data.id) {
        navigate(`/chat/${convResponse.data.id}`);
        return;
      }
      const allConvsResponse = await axios.get('api/chat/conversations/');
      const conv = allConvsResponse.data.find(c => {
        const matchesConnectionId = c.connection_request_id === connection.id;
        const matchesUsers = c.client?.id === connection.client?.id &&
                           c.lawyer?.id === connection.lawyer?.id;
        return matchesConnectionId || matchesUsers;
      });
      if (conv) {
        navigate(`/chat/${conv.id}`);
      } else {
        toast.error('Chat conversation not found. Please refresh the page and try again.');
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to open chat';
      toast.error(errorMsg);
    }
  };

  // FEATURE 1 — Quick reply template management
  const saveQuickReplies = async (updated) => {
    setSavingReplies(true);
    try {
      const res = await axios.patch('api/lawyer/quick-replies/', { quick_reply_templates: updated });
      setQuickReplies(res.data.quick_reply_templates);
      toast.success('Templates saved.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save templates.');
    } finally {
      setSavingReplies(false);
    }
  };

  const handleAddTemplate = () => {
    if (!newTemplateLabel.trim() || !newTemplateMessage.trim()) return;
    const updated = [...quickReplies, { label: newTemplateLabel.trim(), message: newTemplateMessage.trim() }];
    saveQuickReplies(updated);
    setNewTemplateLabel('');
    setNewTemplateMessage('');
    setShowReplyForm(false);
  };

  const handleDeleteTemplate = (idx) => {
    const updated = quickReplies.filter((_, i) => i !== idx);
    saveQuickReplies(updated);
  };

  // FEATURE 3 — Export consultations
  const handleExportConsultations = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportStartDate) params.set('start_date', exportStartDate);
      if (exportEndDate) params.set('end_date', exportEndDate);
      const qs = params.toString();
      const response = await axios.get(`api/lawyer/export-consultations/${qs ? '?' + qs : ''}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `consultations_export.csv`);
      toast.success('Consultations exported.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to export consultations.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 animate-fade-in">
        <div className="text-center text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 animate-fade-in">
        <div className="text-center text-destructive">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { profile, connections, summary, user: lawyerUser } = dashboard;
  const verificationStatus = lawyerUser?.lawyer_verification_status || profile?.verification_status || "pending";
  const averageRating = reviewMeta.average_rating;
  const reviewCount = reviewMeta.review_count;

  // FEATURE 2 — Upcoming consultations (accepted + future preferred_time, sorted ascending)
  const upcomingConsultations = connections
    .filter(c => c.status === 'accepted' && c.preferred_time && new Date(c.preferred_time) > new Date())
    .sort((a, b) => new Date(a.preferred_time) - new Date(b.preferred_time))
    .slice(0, 5);

  return (
    <div className="container mx-auto py-10 animate-fade-in space-y-8">
      {/* Verification Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-2xl text-foreground">Lawyer Verification</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track the status of your professional account verification.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className={`text-lg font-semibold ${statusColors[verificationStatus] || "text-muted-foreground"}`}>
                Status: {verificationStatus.toUpperCase()}
              </p>
              {profile?.verification_notes && (
                <p className="text-sm text-muted-foreground mt-2">Notes: {profile.verification_notes}</p>
              )}
            </div>
            {verificationStatus === "pending" && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                Your verification is being reviewed. This usually takes 1-2 business days.
              </div>
            )}
            {verificationStatus === "rejected" && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <ShieldAlert className="w-4 h-4" />
                Update your credentials or contact support for assistance.
              </div>
            )}
            {verificationStatus === "not_submitted" && (
              <div className="flex items-center gap-2 text-amber-500 text-sm">
                <ShieldAlert className="w-4 h-4" />
                Please complete your onboarding profile to request verification and list yourself publicly.
              </div>
            )}
            {(verificationStatus === "not_submitted" || verificationStatus === "rejected") && (
              <button
                onClick={() => navigate('/lawyer-onboarding')}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/95 transition-colors cursor-pointer"
              >
                {verificationStatus === "rejected" ? "Update Onboarding Info" : "Complete Onboarding"}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FEATURE 2 — Upcoming Consultations */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-foreground text-xl">Upcoming Consultations</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your next scheduled appointments.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingConsultations.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No upcoming consultations scheduled.</p>
          ) : (
            <div className="space-y-3">
              {upcomingConsultations.map((c) => (
                <div key={c.id} className="flex items-center justify-between border border-border rounded-lg p-3 bg-background/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.client?.name || c.client?.username || 'Client'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(c.preferred_time)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary hover:text-primary/80 shrink-0"
                    onClick={() => handleOpenChat(c)}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-xl">My Reviews</CardTitle>
          <CardDescription className="text-muted-foreground">
            See what your clients are saying about you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewCount === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No reviews yet.</p>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-5">
                <span className="text-4xl font-bold text-foreground">{averageRating}</span>
                <div className="space-y-1">
                  <RatingStars rating={averageRating} size="w-5 h-5" />
                  <p className="text-xs text-muted-foreground">Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</p>
                </div>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {reviews.slice(0, 10).map((review) => (
                  <div key={review.id} className="border border-border rounded-lg p-3 bg-background/30">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground">
                        {review.client?.name || 'Anonymous Client'}
                      </p>
                      <span className="text-[10px] text-muted-foreground">{relativeTime(review.created_at)}</span>
                    </div>
                    <RatingStars rating={review.rating} />
                    {review.review_text && (
                      <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-wrap">{review.review_text}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Stat Cards + Export Button */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Dashboard Summary</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="border border-border bg-background text-foreground text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-muted-foreground text-xs">to</span>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="border border-border bg-background text-foreground text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportConsultations}
              disabled={exporting}
              className="border-border text-foreground hover:bg-muted"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Case Status Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm">Open Cases</p>
              <p className="text-2xl font-bold text-muted-foreground">{summary.open_cases}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <p className="text-primary text-sm">In Progress</p>
              <p className="text-2xl font-bold text-primary">{summary.in_progress_cases}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <p className="text-accent text-sm">Resolved</p>
              <p className="text-2xl font-bold text-accent">{summary.resolved_cases}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Requests Monthly Trend Chart */}
      {dashboard.requests_by_month && dashboard.requests_by_month.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-xl">Connection Requests Trend</CardTitle>
            <CardDescription className="text-muted-foreground">
              Number of connection requests received over the last 6 months.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col items-center">
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

      {/* FEATURE 1 — Quick Reply Templates */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-xl">Quick Reply Templates</CardTitle>
          <CardDescription className="text-muted-foreground">
            Save canned responses to quickly accept or decline connection requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quickReplies.length === 0 && !showReplyForm && (
            <p className="text-muted-foreground text-sm text-center py-2">No templates saved yet.</p>
          )}
          {quickReplies.map((tpl, idx) => (
            <div key={idx} className="border border-border rounded-lg p-3 bg-background/30 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{tpl.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-wrap">{tpl.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive shrink-0"
                onClick={() => handleDeleteTemplate(idx)}
                disabled={savingReplies}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {showReplyForm ? (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="Template label (e.g. Standard Accept)"
                value={newTemplateLabel}
                onChange={(e) => setNewTemplateLabel(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Textarea
                placeholder="Response message..."
                value={newTemplateMessage}
                onChange={(e) => setNewTemplateMessage(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setShowReplyForm(false); setNewTemplateLabel(''); setNewTemplateMessage(''); }}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddTemplate}
                  disabled={savingReplies || !newTemplateLabel.trim() || !newTemplateMessage.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save Template
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplyForm(true)}
              className="border-border text-foreground hover:bg-muted"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Template
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Availability Editor */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CalendarDays className="w-6 h-6 text-primary" />
            <div>
              <CardTitle className="text-foreground text-xl">Weekly Availability</CardTitle>
              <CardDescription className="text-muted-foreground">
                Set the days and hours when clients can book consultations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {slots.map((slot, idx) => {
              const dayLabel = DAYS[idx].label;
              return (
                <div key={slot.day} className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 w-40">
                    <Switch
                      id={`avail-${slot.day}`}
                      checked={slot.enabled}
                      onCheckedChange={(checked) => handleSlotToggle(idx, checked)}
                    />
                    <label
                      htmlFor={`avail-${slot.day}`}
                      className={`text-sm font-medium cursor-pointer select-none ${
                        slot.enabled ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {dayLabel}
                    </label>
                  </div>
                  {slot.enabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => handleSlotTime(idx, 'start_time', e.target.value)}
                        className="border border-border bg-background text-foreground text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => handleSlotTime(idx, 'end_time', e.target.value)}
                        className="border border-border bg-background text-foreground text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                  {!slot.enabled && (
                    <span className="text-xs text-muted-foreground/60">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={handleSaveAvailability}
              disabled={savingAvail}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {savingAvail ? 'Saving…' : 'Save Availability'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connection Requests */}
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
          {connections.map((connection) => {
            const isQuote = connection.request_type === 'quote';
            const isAccepted = connection.status === 'accepted';
            const isPending = connection.status === 'pending';
            const daysElapsed = isPending ? elapsedDays(connection.created_at) : 0;
            const isOverdue = isPending && daysElapsed >= 1;
            const isReplying = activeReplyConnection === connection.id;

            return (
              <div
                key={connection.id}
                className="border border-border rounded-lg p-4 bg-background/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-foreground font-semibold">
                      {connection.client?.name || connection.client?.username || "Client"}
                    </p>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                      isQuote
                        ? 'bg-secondary/20 text-secondary-foreground border border-border'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {isQuote ? '📋 Quote Request' : '🤝 Consultation'}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase ${
                      isPending  ? 'bg-muted text-muted-foreground' :
                      isAccepted ? 'bg-primary/10 text-primary' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {connection.status}
                    </span>
                    {/* FEATURE 4 — Overdue badge */}
                    {isOverdue && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${
                        daysElapsed >= 3 ? 'bg-destructive/15 text-destructive' : 'bg-destructive/10 text-destructive'
                      }`}>
                        <Timer className="w-3 h-3" />
                        Awaiting response for {daysElapsed} day{daysElapsed !== 1 ? 's' : ''}{daysElapsed >= 3 ? ' — please respond soon' : ''}
                      </span>
                    )}
                    {isAccepted && (
                      <Select
                        value={connection.case_status || 'open'}
                        onValueChange={(val) => handleCaseStatusChange(connection.id, val)}
                      >
                        <SelectTrigger className="w-[130px] h-7 text-[10px] border-border bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact: {connection.preferred_contact_value || connection.client?.email || "Not provided"}
                  </p>
                  {connection.preferred_time && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Preferred time: {formatDateTime(connection.preferred_time)}
                    </p>
                  )}
                  {connection.meeting_link && !isQuote && (
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
                      "{connection.message}"
                    </p>
                  )}
                </div>

                {/* FEATURE 1 — Reply message textarea when replying */}
                {isPending && isReplying && (
                  <div className="w-full md:w-72 space-y-2 border border-border rounded-lg p-3 bg-background/30">
                    <p className="text-xs font-medium text-muted-foreground">
                      Response message (optional):
                    </p>
                    {quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {quickReplies.map((tpl, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReplyMessage(tpl.message)}
                            className="px-2 py-0.5 text-[10px] font-medium border border-border rounded bg-background hover:bg-muted text-muted-foreground transition-colors"
                          >
                            {tpl.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <Textarea
                      placeholder="Type a response..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => { setActiveReplyConnection(null); setReplyMessage(''); }}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleConnectionUpdate(connection.id, 'accepted', replyMessage)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleConnectionUpdate(connection.id, 'declined', replyMessage)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}

                {isPending && !isReplying && (
                  <div className="flex gap-2">
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => setActiveReplyConnection(connection.id)}
                    >
                      {isQuote ? 'Accept Quote' : 'Accept'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setActiveReplyConnection(connection.id)}
                    >
                      Decline
                    </Button>
                  </div>
                )}
                {isAccepted && (
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleOpenChat(connection)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open Chat
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default LawyerDashboard;
