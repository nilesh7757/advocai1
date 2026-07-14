import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  ShieldAlert, 
  FileText, 
  BookOpen, 
  MessageSquare, 
  Trash2, 
  Award, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  FileCheck,
  TrendingUp,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  UserPlus,
  Mail,
  AlertTriangle,
  UserMinus,
  UserCheck,
  Inbox,
  Clock
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Tab control
  const [activeTab, setActiveTab] = useState('pending');
  
  // Data lists
  const [pendingLawyers, setPendingLawyers] = useState([]);
  const [allLawyers, setAllLawyers] = useState([]);
  const [stats, setStats] = useState(null);
  const [adminsList, setAdminsList] = useState([]);
  const [supportQueries, setSupportQueries] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  // Paginations & Counts
  const [usersCount, setUsersCount] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const usersPageSize = 10;
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filters
  const [lawyerSearch, setLawyerSearch] = useState('');
  const [lawyerStatusFilter, setLawyerStatusFilter] = useState('all');
  const [usersSearch, setUsersSearch] = useState('');
  const [usersStatusFilter, setUsersStatusFilter] = useState('all');
  const [queriesStatusFilter, setQueriesStatusFilter] = useState('open');

  // Rejection notes for pending lawyer queue
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [rejectActiveId, setRejectActiveId] = useState(null);

  // Expandable states
  const [expandedQueryId, setExpandedQueryId] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [expandedLawyerId, setExpandedLawyerId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Promote admin form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState('admin');
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

  // Warning & Ban overlay modals
  const [modalType, setModalType] = useState(null); // 'warn' | 'ban'
  const [targetUser, setTargetUser] = useState(null); // User object
  const [modalReason, setModalReason] = useState('');

  const isSuperAdminUser = user?.email?.lower() === 'nileshmori7757@gmail.com' || user?.is_superuser;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin role required.');
      navigate('/');
      return;
    }

    fetchInitialData();
  }, [isAuthenticated, user, navigate]);

  // Refetch users when search/filter/page change
  useEffect(() => {
    if (activeTab === 'users' && isAuthenticated && user?.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab, usersPage, usersStatusFilter, usersSearch]);

  // Refetch queries when status filter changes
  useEffect(() => {
    if (activeTab === 'queries' && isAuthenticated && user?.role === 'admin') {
      fetchSupportQueries();
    }
  }, [activeTab, queriesStatusFilter]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingLawyers(),
        fetchAllLawyers(),
        fetchStats(),
        fetchSupportQueries(),
        isSuperAdminUser ? fetchAdmins() : Promise.resolve()
      ]);
    } catch (err) {
      console.error('Error fetching initial dashboard data:', err);
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingLawyers = async () => {
    const res = await axios.get('/api/lawyer/admin/pending-lawyers/');
    setPendingLawyers(res.data || []);
  };

  const fetchAllLawyers = async () => {
    const res = await axios.get('/api/lawyer/admin/all-lawyers/');
    setAllLawyers(res.data || []);
  };

  const fetchStats = async () => {
    const res = await axios.get('/api/lawyer/admin/stats/');
    setStats(res.data);
  };

  const fetchAdmins = async () => {
    const res = await axios.get('/api/lawyer/admin/manage-admin-role/');
    setAdminsList(res.data || []);
  };

  const fetchSupportQueries = async () => {
    setQueriesLoading(true);
    try {
      const url = `/api/utils/admin/queries/${queriesStatusFilter !== 'all' ? `?status=${queriesStatusFilter}` : ''}`;
      const res = await axios.get(url);
      setSupportQueries(res.data || []);
    } catch (err) {
      console.error('Error loading support queries:', err);
    } finally {
      setQueriesLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const statusParam = usersStatusFilter !== 'all' ? `&status=${usersStatusFilter}` : '';
      const searchParam = usersSearch.trim() ? `&search=${encodeURIComponent(usersSearch)}` : '';
      const res = await axios.get(`/api/auth/admin/users/?page=${usersPage}&page_size=${usersPageSize}${statusParam}${searchParam}`);
      setUsersList(res.data.results || []);
      setUsersCount(res.data.count || 0);
    } catch (err) {
      console.error('Error loading users list:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Lawyer Verification Handlers
  const handleVerify = async (lawyerUserId, actionStatus) => {
    const notes = rejectionNotes[lawyerUserId]?.trim() || '';
    
    if (actionStatus === 'rejected' && !notes) {
      toast.error('Please enter a rejection reason.');
      return;
    }

    try {
      await axios.patch(`/api/lawyer/admin/lawyers/${lawyerUserId}/verify/`, {
        status: actionStatus,
        notes: notes
      });

      toast.success(`Lawyer successfully ${actionStatus}.`);
      
      // Reset dejection notes
      setRejectActiveId(null);
      setRejectionNotes(prev => {
        const copy = { ...prev };
        delete copy[lawyerUserId];
        return copy;
      });

      // Refresh listings
      fetchPendingLawyers();
      fetchAllLawyers();
      fetchStats();
    } catch (err) {
      console.error('Error verifying lawyer:', err);
      toast.error(err.response?.data?.error || 'Failed to update lawyer status.');
    }
  };

  // Support Queries Handlers
  const handleReplyQuery = async (queryId) => {
    if (!replyText.trim()) {
      toast.error('Please type a reply message.');
      return;
    }

    setActionLoading(true);
    try {
      await axios.patch(`/api/utils/admin/queries/${queryId}/reply/`, {
        reply: replyText
      });
      toast.success('Reply sent successfully.');
      setReplyText('');
      setExpandedQueryId(null);
      fetchSupportQueries();
    } catch (err) {
      console.error('Error sending query reply:', err);
      toast.error('Failed to send reply.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseQuery = async (queryId) => {
    if (!confirm('Are you sure you want to close this support ticket without replying?')) return;
    
    setActionLoading(true);
    try {
      await axios.patch(`/api/utils/admin/queries/${queryId}/close/`);
      toast.success('Query closed successfully.');
      setExpandedQueryId(null);
      fetchSupportQueries();
    } catch (err) {
      console.error('Error closing query:', err);
      toast.error('Failed to close query.');
    } finally {
      setActionLoading(false);
    }
  };

  // Warning & Banning Action Handlers
  const openActionModal = (type, target) => {
    setModalType(type);
    setTargetUser(target);
    setModalReason('');
  };

  const closeActionModal = () => {
    setModalType(null);
    setTargetUser(null);
    setModalReason('');
  };

  const submitWarningOrBan = async () => {
    if (!modalReason.trim()) {
      toast.error('A reason is required.');
      return;
    }

    setActionLoading(true);
    try {
      if (modalType === 'warn') {
        const res = await axios.post(`/api/auth/admin/users/${targetUser.id}/warn/`, {
          reason: modalReason
        });
        toast.success(res.data.message || 'Warning issued.');
      } else if (modalType === 'ban') {
        const res = await axios.post(`/api/auth/admin/users/${targetUser.id}/ban/`, {
          reason: modalReason
        });
        toast.success('Account banned successfully.');
      }
      
      closeActionModal();
      
      // Refresh current states
      fetchUsers();
      fetchAllLawyers();
      fetchPendingLawyers();
      fetchStats();
    } catch (err) {
      console.error('Action error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (targetId) => {
    const reset = confirm('Do you want to reset the user\'s warning count to 0 as well?');
    setActionLoading(true);
    try {
      await axios.post(`/api/auth/admin/users/${targetId}/unban/`, {
        reset_warnings: reset
      });
      toast.success('Account reinstated.');
      
      fetchUsers();
      fetchAllLawyers();
      fetchPendingLawyers();
      fetchStats();
    } catch (err) {
      console.error('Error unbanning user:', err);
      toast.error('Failed to restore account.');
    } finally {
      setActionLoading(false);
    }
  };

  // Promote admin handler
  const handleManageAdmin = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      toast.error('Email is required.');
      return;
    }

    setSubmittingAdmin(true);
    try {
      const res = await axios.patch('/api/lawyer/admin/manage-admin-role/', {
        email: adminEmail,
        role: adminRole,
        is_superuser: isSuperuser
      });
      toast.success(res.data.message || 'User role updated successfully.');
      setAdminEmail('');
      setIsSuperuser(false);
      fetchAdmins();
      fetchUsers();
    } catch (err) {
      console.error('Error promoting admin:', err);
      toast.error(err.response?.data?.error || 'Failed to update user role.');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // Filters for Lawyer List
  const filteredLawyers = allLawyers.filter(lawyer => {
    const matchesSearch = 
      (lawyer.name || '').toLowerCase().includes(lawyerSearch.toLowerCase()) ||
      (lawyer.email || '').toLowerCase().includes(lawyerSearch.toLowerCase()) ||
      (lawyer.license_number || '').toLowerCase().includes(lawyerSearch.toLowerCase());
    
    const matchesStatus = lawyerStatusFilter === 'all' || lawyer.verification_status === lawyerStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statusValue) => {
    switch (statusValue) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20"><AlertCircle className="w-3 h-3" /> Pending</span>;
    }
  };

  // Strikes visual helper
  const renderStrikeDots = (count) => {
    const dots = [];
    for (let i = 1; i <= 3; i++) {
      if (i <= count) {
        dots.push(<span key={i} className="w-2.5 h-2.5 rounded-full bg-destructive inline-block" title={`${count}/3 warning strikes`} />);
      } else {
        dots.push(<span key={i} className="w-2.5 h-2.5 rounded-full bg-muted border border-border inline-block" />);
      }
    }
    return <div className="flex gap-1 items-center">{dots}</div>;
  };

  // Open support queries count
  const openQueriesCount = supportQueries.filter(q => q.status === 'open').length;

  const navItems = [
    { key: 'pending', icon: ShieldAlert, label: 'Pending Verification', badge: pendingLawyers.length },
    { key: 'all', icon: Users, label: 'All Lawyers' },
    { key: 'users', icon: Users, label: 'Users & Bans' },
    { key: 'queries', icon: Mail, label: 'Support Inbox', badge: openQueriesCount },
    { key: 'stats', icon: TrendingUp, label: 'Platform Stats' },
    ...(isSuperAdminUser ? [{ key: 'admins', icon: ShieldCheck, label: 'Admin Management' }] : [])
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground font-semibold">Loading AdvocAI Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">AdvocAI Admin Console</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure access permissions, reply to customer support, issue warning strikes, and review credentials.
            </p>
          </div>
        </div>

        {/* Tabbed Settings Layout */}
        <div className="flex flex-col lg:flex-row gap-6 mt-4">
          
          {/* Sticky left tabs */}
          <nav className="w-full lg:w-64 flex-shrink-0 sticky lg:top-[var(--navbar-height)] z-20">
            <div className="bg-card border border-border rounded-xl p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={
                      "flex items-center justify-between lg:w-full gap-3 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors text-left flex-shrink-0 cursor-pointer " +
                      (isActive
                        ? "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground")
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Main workspace */}
          <div className="flex-1 min-w-0">
            <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm">
              
              {/* PENDING LAWYERS TAB */}
              {activeTab === 'pending' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <h2 className="text-lg font-bold text-foreground">Pending Verifications</h2>
                    <span className="text-xs bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-full font-bold">
                      {pendingLawyers.length} Pending
                    </span>
                  </div>

                  {pendingLawyers.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                      <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <h3 className="font-bold text-foreground text-sm">All verifications cleared</h3>
                      <p className="text-xs text-muted-foreground mt-1">No lawyer signups are currently pending check.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingLawyers.map((lawyer) => (
                        <div key={lawyer.lawyer_user_id} className="border border-border bg-background rounded-xl p-5 hover:border-primary/20 transition-all flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-foreground text-base">{lawyer.name}</h3>
                                <p className="text-xs text-muted-foreground">@{lawyer.username} • {lawyer.email}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs border-y border-border/50 py-3">
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">License Number</span>
                                <span className="font-semibold text-foreground">{lawyer.license_number || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Bar Council ID</span>
                                <span className="font-semibold text-foreground">{lawyer.bar_council_id || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Experience</span>
                                <span className="font-semibold text-foreground">{lawyer.experience_years} Years</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Education</span>
                                <span className="font-semibold text-foreground truncate block" title={lawyer.education}>{lawyer.education || 'N/A'}</span>
                              </div>
                            </div>

                            <div>
                              <span className="text-xs font-semibold text-foreground block mb-1.5">Verification Documents</span>
                              {lawyer.verification_documents && lawyer.verification_documents.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {lawyer.verification_documents.map((docUrl, index) => {
                                    const filename = docUrl.split('/').pop() ? decodeURIComponent(docUrl.split('/').pop()) : `Document ${index + 1}`;
                                    return (
                                      <a 
                                        key={index} 
                                        href={docUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background hover:bg-muted text-[10px] font-semibold text-foreground border border-border transition-colors cursor-pointer shadow-sm"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                        <span className="max-w-[120px] truncate">{filename}</span>
                                        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-xs text-destructive italic font-medium">No documents uploaded</span>
                              )}
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="mt-5 pt-4 border-t border-border/50 space-y-3">
                            {rejectActiveId === lawyer.lawyer_user_id ? (
                              <div className="space-y-2">
                                <textarea
                                  placeholder="Enter reason for rejection (required)..."
                                  value={rejectionNotes[lawyer.lawyer_user_id] || ''}
                                  onChange={(e) => setRejectionNotes(prev => ({ ...prev, [lawyer.lawyer_user_id]: e.target.value }))}
                                  className="w-full text-xs p-2.5 border border-destructive bg-background text-foreground rounded-lg h-20 resize-none focus:outline-none focus:ring-1 focus:ring-destructive"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => setRejectActiveId(null)}
                                    className="px-3 py-1.5 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground rounded-lg cursor-pointer transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleVerify(lawyer.lawyer_user_id, 'rejected')}
                                    className="px-3 py-1.5 text-xs font-bold bg-destructive hover:bg-destructive/90 text-white rounded-lg cursor-pointer transition-colors"
                                  >
                                    Confirm Reject
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setRejectActiveId(lawyer.lawyer_user_id)}
                                  className="px-3 py-1.5 text-xs font-bold border border-destructive bg-card text-destructive hover:bg-destructive hover:text-white rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                                <button
                                  onClick={() => handleVerify(lawyer.lawyer_user_id, 'approved')}
                                  className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ALL LAWYERS TAB */}
              {activeTab === 'all' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-border pb-3">
                    <h2 className="text-lg font-bold text-foreground">Registered Lawyers</h2>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or license..."
                        value={lawyerSearch}
                        onChange={(e) => setLawyerSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-border bg-background text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <select
                      value={lawyerStatusFilter}
                      onChange={(e) => setLawyerStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm focus:outline-none focus:border-primary cursor-pointer font-bold"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Table */}
                  {filteredLawyers.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <h3 className="font-bold text-foreground text-sm">No lawyers match criteria</h3>
                      <p className="text-xs text-muted-foreground mt-1">Try tweaking filters or searches.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-border rounded-xl bg-background">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            <th className="p-4">Lawyer Details</th>
                            <th className="p-4">Credentials</th>
                            <th className="p-4">Status & Strikes</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60 text-xs">
                          {filteredLawyers.map((lawyer) => {
                            const isExpanded = expandedLawyerId === lawyer.lawyer_user_id;
                            return (
                              <React.Fragment key={lawyer.lawyer_user_id}>
                                <tr className="hover:bg-muted/10 transition-colors">
                                  <td className="p-4">
                                    <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                      {lawyer.name}
                                      {/* Expander triggers */}
                                      <button 
                                        onClick={() => setExpandedLawyerId(isExpanded ? null : lawyer.lawyer_user_id)}
                                        className="p-0.5 hover:bg-muted rounded text-muted-foreground cursor-pointer"
                                      >
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                    <div className="text-muted-foreground">@{lawyer.username}</div>
                                    <div className="text-muted-foreground">{lawyer.email}</div>
                                  </td>
                                  <td className="p-4">
                                    <div className="text-foreground"><span className="text-muted-foreground font-semibold">License:</span> {lawyer.license_number || 'N/A'}</div>
                                    <div className="text-foreground"><span className="text-muted-foreground font-semibold">Bar ID:</span> {lawyer.bar_council_id || 'N/A'}</div>
                                    <div className="text-foreground"><span className="text-muted-foreground font-semibold">Exp:</span> {lawyer.experience_years} Years</div>
                                  </td>
                                  <td className="p-4 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                      {getStatusBadge(lawyer.verification_status)}
                                    </div>
                                    {/* Warnings Strikes visual indicators */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-muted-foreground font-semibold">Strikes:</span>
                                      {renderStrikeDots(lawyer.warning_count)}
                                    </div>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex gap-1.5 justify-end">
                                      {/* Issue Warning */}
                                      <button
                                        onClick={() => openActionModal('warn', { id: lawyer.lawyer_user_id, email: lawyer.email, name: lawyer.name, role: 'lawyer' })}
                                        className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded cursor-pointer transition-colors border border-amber-500/20"
                                        title="Warn Lawyer"
                                      >
                                        Warn
                                      </button>

                                      {/* Direct Ban / Unban */}
                                      {lawyer.verification_status !== 'rejected' && lawyer.verification_status !== 'pending' && (
                                        <button
                                          onClick={() => {
                                            const reason = prompt("Enter a deactivation/rejection note for this lawyer:");
                                            if (reason !== null && reason.trim()) {
                                              axios.patch(`/api/lawyer/admin/lawyers/${lawyer.lawyer_user_id}/verify/`, {
                                                status: 'rejected',
                                                notes: reason
                                              }).then(() => {
                                                toast.success("Lawyer verification revoked.");
                                                fetchInitialData();
                                              }).catch(err => {
                                                toast.error("Failed to revoke status.");
                                              });
                                            }
                                          }}
                                          className="px-2.5 py-1 text-[10px] font-bold border border-destructive bg-card text-destructive hover:bg-destructive hover:text-white rounded cursor-pointer transition-all"
                                        >
                                          Revoke Verify
                                        </button>
                                      )}

                                      {lawyer.verification_status === 'rejected' && (
                                        <button
                                          onClick={() => handleVerify(lawyer.lawyer_user_id, 'approved')}
                                          className="px-2.5 py-1 text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded cursor-pointer"
                                        >
                                          Re-Approve
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Expandable Warnings history row */}
                                {isExpanded && (
                                  <tr className="bg-muted/10">
                                    <td colSpan="4" className="p-4 border-t border-border/50">
                                      <div className="space-y-3">
                                        <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">Warning Logs</h4>
                                        {lawyer.warnings && lawyer.warnings.length > 0 ? (
                                          <div className="space-y-2 max-w-2xl">
                                            {lawyer.warnings.map((warn, index) => (
                                              <div key={index} className="bg-background border border-border rounded-lg p-3 text-xs flex justify-between items-start gap-4">
                                                <div>
                                                  <div className="font-semibold text-foreground">Reason: {warn.reason}</div>
                                                  <div className="text-[10px] text-muted-foreground">Issued by: @{warn.issued_by}</div>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                  {new Date(warn.issued_at).toLocaleDateString()}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-muted-foreground italic">No warnings issued to this user.</p>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* USERS & BANS TAB */}
              {activeTab === 'users' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-border pb-3 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-foreground">Platform User Management</h2>
                    <span className="text-xs bg-muted border border-border px-2.5 py-1 rounded-full font-bold text-muted-foreground">
                      {usersCount} Users Total
                    </span>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search users by email or username..."
                        value={usersSearch}
                        onChange={(e) => {
                          setUsersSearch(e.target.value);
                          setUsersPage(1); // Reset page on query
                        }}
                        className="w-full pl-9 pr-4 py-2 border border-border bg-background text-foreground rounded-lg text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <select
                      value={usersStatusFilter}
                      onChange={(e) => {
                        setUsersStatusFilter(e.target.value);
                        setUsersPage(1); // Reset page on filter
                      }}
                      className="px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm focus:outline-none focus:border-primary cursor-pointer font-bold"
                    >
                      <option value="all">All Accounts</option>
                      <option value="active">Active Only</option>
                      <option value="banned">Banned Only</option>
                    </select>
                  </div>

                  {/* Users table */}
                  {usersLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">Fetching users database...</p>
                    </div>
                  ) : usersList.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <h3 className="font-bold text-foreground text-sm">No users found</h3>
                      <p className="text-xs text-muted-foreground mt-1">Refine query inputs or change deactivation status filter.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto border border-border rounded-xl bg-background">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                              <th className="p-4">User</th>
                              <th className="p-4">Platform Role</th>
                              <th className="p-4">Warning Strikes</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60 text-xs">
                            {usersList.map((usr) => {
                              const isExpanded = expandedUserId === usr.id;
                              return (
                                <React.Fragment key={usr.id}>
                                  <tr className="hover:bg-muted/10 transition-colors">
                                    <td className="p-4">
                                      <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                        {usr.name || usr.username}
                                        <button 
                                          onClick={() => setExpandedUserId(isExpanded ? null : usr.id)}
                                          className="p-0.5 hover:bg-muted rounded text-muted-foreground cursor-pointer"
                                        >
                                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </button>
                                      </div>
                                      <div className="text-muted-foreground">@{usr.username} • {usr.email}</div>
                                    </td>
                                    <td className="p-4 font-semibold uppercase text-muted-foreground text-[10px]">
                                      {usr.role}
                                    </td>
                                    <td className="p-4">
                                      {renderStrikeDots(usr.warning_count)}
                                    </td>
                                    <td className="p-4">
                                      {usr.is_active ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><UserCheck className="w-3 h-3" /> Active</span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20"><UserMinus className="w-3 h-3" /> Banned</span>
                                      )}
                                      {usr.ban_reason && (
                                        <div className="text-[10px] text-destructive/80 mt-1 max-w-[150px] truncate" title={usr.ban_reason}>
                                          Ban: {usr.ban_reason}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-4 text-right">
                                      <div className="flex gap-1.5 justify-end">
                                        {usr.id !== user.id && (
                                          <>
                                            {/* Warn */}
                                            {usr.is_active && (
                                              <button
                                                onClick={() => openActionModal('warn', usr)}
                                                className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded cursor-pointer transition-colors border border-amber-500/20"
                                              >
                                                Warn User
                                              </button>
                                            )}

                                            {/* Ban / Unban */}
                                            {usr.is_active ? (
                                              <button
                                                onClick={() => openActionModal('ban', usr)}
                                                className="px-2.5 py-1 text-[10px] font-bold border border-destructive bg-card text-destructive hover:bg-destructive hover:text-white rounded cursor-pointer transition-all"
                                              >
                                                Ban
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => handleUnban(usr.id)}
                                                className="px-2.5 py-1 text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/95 rounded cursor-pointer"
                                              >
                                                Restore
                                              </button>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Warning history panel */}
                                  {isExpanded && (
                                    <tr className="bg-muted/10">
                                      <td colSpan="5" className="p-4 border-t border-border/50">
                                        <div className="space-y-3">
                                          <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">Warning Strikes History</h4>
                                          {usr.warnings && usr.warnings.length > 0 ? (
                                            <div className="space-y-2 max-w-2xl">
                                              {usr.warnings.map((warn, index) => (
                                                <div key={index} className="bg-background border border-border rounded-lg p-3 text-xs flex justify-between items-start gap-4">
                                                  <div>
                                                    <div className="font-semibold text-foreground">Reason: {warn.reason}</div>
                                                    <div className="text-[10px] text-muted-foreground">Issued by: @{warn.issued_by}</div>
                                                  </div>
                                                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                    {new Date(warn.issued_at).toLocaleDateString()}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-muted-foreground italic">No warnings recorded on this account.</p>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {usersCount > usersPageSize && (
                        <div className="flex justify-between items-center pt-2">
                          <button
                            disabled={usersPage <= 1}
                            onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                            className="px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg cursor-pointer disabled:opacity-40"
                          >
                            Previous Page
                          </button>
                          <span className="text-xs text-muted-foreground font-semibold">
                            Page {usersPage} of {Math.ceil(usersCount / usersPageSize)}
                          </span>
                          <button
                            disabled={usersPage >= Math.ceil(usersCount / usersPageSize)}
                            onClick={() => setUsersPage(prev => prev + 1)}
                            className="px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg cursor-pointer disabled:opacity-40"
                          >
                            Next Page
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SUPPORT INBOX TAB */}
              {activeTab === 'queries' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-border pb-3 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-foreground">Support Queries & Inbox</h2>
                    <select
                      value={queriesStatusFilter}
                      onChange={(e) => setQueriesStatusFilter(e.target.value)}
                      className="px-2.5 py-1 border border-border bg-background text-foreground rounded-lg text-xs focus:outline-none focus:border-primary cursor-pointer font-bold"
                    >
                      <option value="open">Open tickets</option>
                      <option value="answered">Answered</option>
                      <option value="closed">Closed</option>
                      <option value="all">All Queries</option>
                    </select>
                  </div>

                  {/* Queries list */}
                  {queriesLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">Fetching support inbox...</p>
                    </div>
                  ) : supportQueries.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                      <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <h3 className="font-bold text-foreground text-sm">Inbox is empty</h3>
                      <p className="text-xs text-muted-foreground mt-1">No support queries match the status filter.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {supportQueries.map((query) => {
                        const isExpanded = expandedQueryId === query.id;
                        return (
                          <div 
                            key={query.id} 
                            className={`border rounded-xl p-4 transition-all bg-background hover:border-primary/20 ${
                              isExpanded ? 'border-primary/40 bg-muted/5' : 'border-border'
                            }`}
                          >
                            <div 
                              onClick={() => {
                                setExpandedQueryId(isExpanded ? null : query.id);
                                setReplyText('');
                              }}
                              className="flex justify-between items-start gap-4 cursor-pointer"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap gap-2 items-center">
                                  <h3 className="font-bold text-foreground text-sm truncate max-w-[250px]">{query.subject}</h3>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    query.status === 'open' 
                                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                      : query.status === 'answered'
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                        : 'bg-muted text-muted-foreground border border-border'
                                  }`}>
                                    {query.status}
                                  </span>
                                  {query.user && (
                                    <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-bold uppercase">
                                      Member
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  From: <span className="font-semibold text-foreground">{query.name}</span> ({query.email})
                                </p>
                              </div>
                              <div className="text-[10px] text-muted-foreground flex-shrink-0 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(query.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-border/50 space-y-4 text-xs animate-fadeIn">
                                <div>
                                  <h4 className="font-bold text-muted-foreground text-[10px] uppercase mb-1">Message</h4>
                                  <div className="p-3 bg-muted/40 rounded-lg text-foreground leading-relaxed whitespace-pre-wrap">
                                    {query.message}
                                  </div>
                                </div>

                                {/* Previous replies */}
                                {query.admin_reply && (
                                  <div>
                                    <h4 className="font-bold text-emerald-500 text-[10px] uppercase mb-1 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" /> Support Answer
                                    </h4>
                                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-foreground leading-relaxed whitespace-pre-wrap">
                                      {query.admin_reply}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mt-1">
                                      Replied at: {new Date(query.replied_at).toLocaleString()}
                                    </div>
                                  </div>
                                )}

                                {/* Action forms */}
                                {query.status === 'open' && (
                                  <div className="space-y-3 pt-2">
                                    <textarea
                                      placeholder="Type your official support response here (will be emailed or sent in-app)..."
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      className="w-full p-3 border border-border bg-background text-foreground rounded-lg h-24 resize-none focus:outline-none focus:border-primary text-xs"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        onClick={() => handleCloseQuery(query.id)}
                                        disabled={actionLoading}
                                        className="px-3 py-1.5 bg-card hover:bg-muted text-muted-foreground border border-border text-xs font-bold rounded-lg cursor-pointer transition-colors"
                                      >
                                        Close Ticket Without Replying
                                      </button>
                                      <button
                                        onClick={() => handleReplyQuery(query.id)}
                                        disabled={actionLoading}
                                        className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                                      >
                                        {actionLoading ? 'Sending...' : 'Send Reply'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STATS TAB */}
              {activeTab === 'stats' && stats && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-border pb-3">
                    <h2 className="text-lg font-bold text-foreground">Platform Analytics</h2>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Stat Card 1 */}
                    <div className="border border-border bg-background rounded-xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Users</span>
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-3xl font-extrabold text-foreground">{stats.total_users}</div>
                      <p className="text-[10px] text-muted-foreground">Overall registered accounts on AdvocAI</p>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="border border-border bg-background rounded-xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lawyers (Approved)</span>
                        <Award className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="text-3xl font-extrabold text-foreground">
                        {stats.lawyers?.approved} <span className="text-xs font-medium text-muted-foreground">/ {stats.lawyers?.total} total</span>
                      </div>
                      <div className="flex gap-2 text-[10px]">
                        <span className="text-amber-500 font-bold">{stats.lawyers?.pending} Pending</span>
                        <span className="text-destructive font-bold">{stats.lawyers?.rejected} Rejected</span>
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="border border-border bg-background rounded-xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Documents Processed</span>
                        <FileText className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="text-3xl font-extrabold text-foreground">{stats.documents?.total}</div>
                      <div className="flex gap-2 text-[10px] text-muted-foreground">
                        <span>{stats.documents?.created} Created</span>
                        <span>•</span>
                        <span>{stats.documents?.analyzed} Analyzed</span>
                      </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="border border-border bg-background rounded-xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Connection Requests</span>
                        <MessageSquare className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="text-3xl font-extrabold text-foreground">{stats.total_connection_requests}</div>
                      <p className="text-[10px] text-muted-foreground">Interactions between clients and lawyers</p>
                    </div>

                    {/* Stat Card 5 */}
                    <div className="border border-border bg-background rounded-xl p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reviews Submitted</span>
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="text-3xl font-extrabold text-foreground">{stats.total_reviews}</div>
                      <p className="text-[10px] text-muted-foreground">User ratings and reviews for approved lawyers</p>
                    </div>

                  </div>
                </div>
              )}

              {/* ADMINS MANAGEMENT TAB */}
              {activeTab === 'admins' && isSuperAdminUser && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-border pb-3">
                    <h2 className="text-lg font-bold text-foreground">Super Admin Console</h2>
                  </div>

                  {/* Promote User Form */}
                  <form onSubmit={handleManageAdmin} className="border border-border bg-background rounded-xl p-5 space-y-4 max-w-lg">
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                      <UserPlus className="w-4 h-4 text-primary" /> Promote/Update User Role
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground block mb-1">User Email Address</label>
                        <input
                          type="email"
                          placeholder="e.g. name@example.com"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="w-full px-3.5 py-2 border border-border bg-background text-foreground rounded-lg text-xs focus:outline-none focus:border-primary"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">Platform Role</label>
                          <select
                            value={adminRole}
                            onChange={(e) => setAdminRole(e.target.value)}
                            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-xs focus:outline-none focus:border-primary cursor-pointer font-bold"
                          >
                            <option value="admin">Admin</option>
                            <option value="client">Client (Demote)</option>
                            <option value="lawyer">Lawyer (Demote)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 mt-5">
                          <input
                            type="checkbox"
                            id="superuser-chk"
                            checked={isSuperuser}
                            onChange={(e) => setIsSuperuser(e.target.checked)}
                            className="w-4 h-4 border border-border rounded focus:ring-0 cursor-pointer accent-primary"
                          />
                          <label htmlFor="superuser-chk" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                            Designate Superuser
                          </label>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAdmin}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {submittingAdmin ? 'Processing...' : 'Confirm Update'}
                    </button>
                  </form>

                  {/* Active Admins List */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Active Platform Admins
                    </h3>
                    <div className="border border-border rounded-xl overflow-hidden bg-background divide-y divide-border/60">
                      {adminsList.map((adm) => (
                        <div key={adm.id} className="flex justify-between items-center p-4 hover:bg-muted/10 transition-colors">
                          <div>
                            <div className="font-bold text-foreground text-xs">
                              {adm.name || 'No Display Name'} <span className="text-muted-foreground font-normal">({adm.username})</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">{adm.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {adm.is_superuser && (
                              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-extrabold uppercase">
                                Superuser
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border text-[9px] font-semibold uppercase">
                              Admin
                            </span>
                            
                            {/* Option to demote admin */}
                            {adm.email.lower() !== 'nileshmori7757@gmail.com' && adm.email.lower() !== user.email.lower() && (
                              <button
                                onClick={async () => {
                                  if (confirm(`Remove admin permissions for ${adm.email}?`)) {
                                    try {
                                      await axios.patch('/api/lawyer/admin/manage-admin-role/', {
                                        email: adm.email,
                                        role: 'client',
                                        is_superuser: false
                                      });
                                      toast.success("Admin role removed.");
                                      fetchAdmins();
                                      fetchUsers();
                                    } catch (err) {
                                      toast.error("Failed to revoke admin role.");
                                    }
                                  }
                                }}
                                className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
                                title="Demote to Client"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* OVERLAY ACTION MODALS (Warn / Ban) */}
      {modalType && targetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-none z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 border-b border-border pb-3 text-foreground">
              <AlertTriangle className={`w-6 h-6 ${modalType === 'warn' ? 'text-amber-500' : 'text-destructive'}`} />
              <h3 className="font-extrabold text-base uppercase tracking-wide">
                {modalType === 'warn' ? 'Issue Account Warning' : 'Ban Account'}
              </h3>
            </div>

            <p className="text-xs text-muted-foreground">
              You are about to issue a {modalType === 'warn' ? 'formal warning' : 'direct ban'} to user{' '}
              <span className="font-bold text-foreground">@{targetUser.username}</span> ({targetUser.email}).
              {modalType === 'warn' && (
                <span className="block mt-1 font-semibold text-destructive">
                  Note: Accumulating 3 strikes results in an automatic system-wide ban.
                </span>
              )}
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                Reason / Explanation
              </label>
              <textarea
                placeholder={modalType === 'warn' ? 'Specify warning reasons (e.g. offensive comments, spamming)...' : 'Specify ban reason...'}
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                className="w-full p-3 border border-border bg-background text-foreground rounded-lg h-24 resize-none focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={closeActionModal}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitWarningOrBan}
                disabled={actionLoading}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg cursor-pointer transition-colors ${
                  modalType === 'warn' 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-destructive hover:bg-destructive/90'
                }`}
              >
                {actionLoading ? 'Processing...' : modalType === 'warn' ? 'Send Warning' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
