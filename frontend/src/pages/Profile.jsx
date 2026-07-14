import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Camera, Check, X, Lock, Briefcase, BarChart3, Bell, Shield, Trash2 } from "lucide-react";
import { Switch } from '../Components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from '../api/axios';
import PasswordModal from '../Components/PasswordModal';

const VALID_TABS = ['profile', 'professional', 'activity', 'notifications', 'security', 'danger'];

const Profile = () => {
  const { user, loading, setUser, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return VALID_TABS.includes(tab) ? tab : 'profile';
  });

  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    profile_picture: '',
    cover_photo: '',
    new_profile_picture: null,
    new_cover_photo: null,
  });
  const [savedProfileData, setSavedProfileData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewCoverImage, setPreviewCoverImage] = useState(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Lawyer profile state
  const [lawyerProfile, setLawyerProfile] = useState(null);
  const [lawyerProfileSaved, setLawyerProfileSaved] = useState(null);
  const [lawyerProfileSaving, setLawyerProfileSaving] = useState(false);

  // Activity stats
  const [stats, setStats] = useState(null);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    mentions: true,
    lawyer_updates: true,
    document_shares: true,
  });
  const [notifPrefsSaved, setNotifPrefsSaved] = useState(null);
  const [notifPrefsSaving, setNotifPrefsSaving] = useState(false);

  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [twoFactorSaving, setTwoFactorSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (user) {
      const data = {
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        profile_picture: user.profile_picture || '',
        cover_photo: user.cover_photo || '',
        new_profile_picture: null,
        new_cover_photo: null,
      };
      setProfileData(data);
      setSavedProfileData({ ...data });
      const prefs = user.notification_preferences || {
        mentions: true,
        lawyer_updates: true,
        document_shares: true,
      };
      setNotifPrefs(prefs);
      setNotifPrefsSaved({ ...prefs });
    }
  }, [user]);

  // Fetch lawyer profile if user is a lawyer
  useEffect(() => {
    if (user && user.role === 'lawyer') {
      axios.get('/api/lawyer/my-profile/')
        .then(res => {
          setLawyerProfile({
            bio: res.data.bio || '',
            specializations: Array.isArray(res.data.specializations) ? res.data.specializations : [],
            experience_years: res.data.experience_years || 0,
            consultation_fee: res.data.consultation_fee || '',
            education: res.data.education || '',
            law_firm: res.data.law_firm || '',
          });
          setLawyerProfileSaved({
            bio: res.data.bio || '',
            specializations: Array.isArray(res.data.specializations) ? res.data.specializations : [],
            experience_years: res.data.experience_years || 0,
            consultation_fee: res.data.consultation_fee || '',
            education: res.data.education || '',
            law_firm: res.data.law_firm || '',
          });
        })
        .catch(err => {
          console.error('Failed to fetch lawyer profile:', err);
        });
    }
  }, [user]);

  // Fetch activity stats
  useEffect(() => {
    if (user) {
      axios.get('/api/auth/profile/stats/')
        .then(res => setStats(res.data))
        .catch(err => console.error('Failed to fetch stats:', err));
    }
  }, [user]);

  const handleLawyerInputChange = (e) => {
    setLawyerProfile({ ...lawyerProfile, [e.target.name]: e.target.value });
  };

  const handleSaveLawyerProfile = async () => {
    setLawyerProfileSaving(true);
    try {
      const payload = {
        ...lawyerProfile,
        experience_years: parseInt(lawyerProfile.experience_years, 10) || 0,
        specializations: typeof lawyerProfile.specializations === 'string'
          ? lawyerProfile.specializations.split(',').map(s => s.trim()).filter(Boolean)
          : lawyerProfile.specializations,
      };
      const res = await axios.patch('/api/lawyer/my-profile/', payload);
      toast.success('Professional details updated!');
      const updated = {
        bio: res.data.bio || '',
        specializations: Array.isArray(res.data.specializations) ? res.data.specializations : [],
        experience_years: res.data.experience_years || 0,
        consultation_fee: res.data.consultation_fee || '',
        education: res.data.education || '',
        law_firm: res.data.law_firm || '',
      };
      setLawyerProfile({ ...updated });
      setLawyerProfileSaved({ ...updated });
    } catch (err) {
      console.error('Failed to update lawyer profile:', err);
      toast.error(err.response?.data?.error || 'Failed to update professional details.');
    } finally {
      setLawyerProfileSaving(false);
    }
  };

  const handleCancelLawyerProfile = () => {
    if (lawyerProfileSaved) {
      setLawyerProfile({ ...lawyerProfileSaved });
    }
  };

  const hasLawyerChanges = lawyerProfileSaved && lawyerProfile && (
    lawyerProfile.bio !== lawyerProfileSaved.bio ||
    lawyerProfile.experience_years !== lawyerProfileSaved.experience_years ||
    lawyerProfile.consultation_fee !== lawyerProfileSaved.consultation_fee ||
    lawyerProfile.education !== lawyerProfileSaved.education ||
    lawyerProfile.law_firm !== lawyerProfileSaved.law_firm ||
    JSON.stringify(lawyerProfile.specializations) !== JSON.stringify(lawyerProfileSaved.specializations)
  );

  const hasNotifPrefsChanges = notifPrefsSaved && (
    notifPrefs.mentions !== notifPrefsSaved.mentions ||
    notifPrefs.lawyer_updates !== notifPrefsSaved.lawyer_updates ||
    notifPrefs.document_shares !== notifPrefsSaved.document_shares
  );

  const handleSaveNotifPrefs = async () => {
    setNotifPrefsSaving(true);
    try {
      const res = await axios.patch('api/auth/profile/', {
        notification_preferences: notifPrefs,
      });
      toast.success('Notification preferences saved!');
      setUser(res.data);
      setNotifPrefsSaved({ ...notifPrefs });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save preferences.');
    } finally {
      setNotifPrefsSaving(false);
    }
  };

  const handleCancelNotifPrefs = () => {
    if (notifPrefsSaved) {
      setNotifPrefs({ ...notifPrefsSaved });
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      await axios.post('api/auth/logout-all-devices/');
      toast.success("You've been logged out of all other devices.");
      setUser({ ...user, last_login: new Date().toISOString() });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log out devices.');
    } finally {
      setLoggingOutAll(false);
    }
  };

  const handleToggle2FA = async (checked) => {
    setTwoFactorSaving(true);
    try {
      const res = await axios.patch('api/auth/two-factor/', { enabled: checked });
      setUser({ ...user, two_factor_enabled: res.data.two_factor_enabled });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update two-factor authentication.');
    } finally {
      setTwoFactorSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const payload = {};
      if (user.auth_provider !== 'google' || user.has_password) {
        payload.password = deletePassword;
      }
      await axios.post('api/auth/delete-account/', payload);
      toast.success('Your account has been deleted.');
      setDeleteDialogOpen(false);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete account.');
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData({ ...profileData, new_profile_picture: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileData({ ...profileData, new_cover_photo: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewCoverImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('phone', profileData.phone);
      if (profileData.new_profile_picture) {
        formData.append('profile_picture', profileData.new_profile_picture);
      }
      if (profileData.new_cover_photo) {
        formData.append('cover_photo', profileData.new_cover_photo);
      }

      const response = await axios.patch('api/auth/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('Profile updated successfully!');
      setUser(response.data);
      const updated = {
        name: response.data.name || '',
        username: response.data.username || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        profile_picture: response.data.profile_picture || '',
        cover_photo: response.data.cover_photo || '',
        new_profile_picture: null,
        new_cover_photo: null,
      };
      setSavedProfileData({ ...updated });
      setProfileData({ ...updated });
      setPreviewImage(null);
      setPreviewCoverImage(null);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPreviewImage(null);
    setPreviewCoverImage(null);
    if (savedProfileData) {
      setProfileData({ ...savedProfileData });
    }
  };

  const handlePasswordSubmit = async (payload, endpoint) => {
    try {
      const response = await axios.post(endpoint, payload);
      toast.success(response.data.message);
      setUser({ ...user, has_password: true });
    } catch (error) {
      console.error('Failed to change/add password:', error);
      console.log('Full error response:', error.response);

      let errorMessage = 'Failed to update password.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (typeof error.response.data === 'object') {
          const messages = [];
          for (const key in error.response.data) {
            if (Array.isArray(error.response.data[key])) {
              messages.push(...error.response.data[key]);
            } else if (typeof error.response.data[key] === 'string') {
              messages.push(error.response.data[key]);
            }
          }
          if (messages.length > 0) {
            errorMessage = messages.join(' ');
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          }
        }
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const hasChanges = savedProfileData && (
    profileData.name !== savedProfileData.name ||
    profileData.phone !== savedProfileData.phone ||
    profileData.new_profile_picture !== null ||
    profileData.new_cover_photo !== null
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-destructive/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <User className="w-10 h-10 text-destructive" />
          </div>
          <p className="text-destructive text-lg">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const displayImage = previewImage || profileData.profile_picture;

  const navItems = [
    { key: 'profile', icon: User, label: 'Profile Info' },
    ...(user?.role === 'lawyer' ? [{ key: 'professional', icon: Briefcase, label: 'Professional Details' }] : []),
    { key: 'activity', icon: BarChart3, label: 'Activity' },
    { key: 'notifications', icon: Bell, label: 'Notifications' },
    { key: 'security', icon: Shield, label: 'Security' },
    { key: 'danger', icon: Trash2, label: 'Danger Zone', destructive: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Twitter-style Profile Header */}
        <div className="bg-card border border-border border-b-0 rounded-t-xl overflow-hidden">
          {/* Cover Photo */}
          <div className="h-32 sm:h-48 md:h-56 relative group">
            {profileData.cover_photo || previewCoverImage ? (
              <img 
                src={previewCoverImage || profileData.cover_photo} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/10"></div>
            <label 
              htmlFor="cover-photo-upload" 
              className="absolute bottom-4 right-4 p-2.5 bg-muted/90 rounded-lg cursor-pointer hover:bg-muted transition-all duration-200 flex items-center gap-2 text-foreground text-sm font-medium z-10 opacity-0 group-hover:opacity-100"
            >
              <Camera className="w-4 h-4" />
              Change Cover
              <input 
                id="cover-photo-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleCoverFileChange} 
              />
            </label>
          </div>

          {/* Avatar + Info Row */}
          <div className="px-4 sm:px-6 md:px-8 pb-4 md:pb-6 relative">
            {/* Avatar - pulled up to overlap cover */}
            <div className="relative -mt-10 sm:-mt-12 md:-mt-16 mb-3 flex items-end justify-between">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-background border-4 border-card overflow-hidden">
                  {displayImage ? (
                    <img 
                      src={displayImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-3xl font-bold">
                        {getInitials(profileData.name || profileData.username)}
                      </span>
                    </div>
                  )}
                </div>
                
                <label 
                  htmlFor="profile-picture-upload" 
                  className="absolute bottom-1 right-1 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-all duration-200 shadow-md opacity-0 group-hover:opacity-100"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input 
                    id="profile-picture-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleProfileFileChange} 
                  />
                </label>
              </div>

              {hasChanges && (
                <div className="mb-2 flex items-center gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-full text-foreground text-sm font-bold transition-all duration-200 flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-1.5"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Name + Username */}
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                {profileData.name || 'Not provided'}
              </h1>
              <p className="text-sm text-muted-foreground">
                @{profileData.username || 'notprovided'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabbed Settings Layout */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-3 md:mt-4 px-0 sm:px-0">
          {/* Left: Tab Navigation */}
          <nav className="w-full md:w-64 flex-shrink-0 sticky top-[var(--navbar-height)] z-20">
            <div className="bg-card border border-border rounded-xl p-2 flex md:flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => switchTab(item.key)}
                    className={
                      "flex items-center justify-center md:w-full gap-0 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors text-left flex-shrink-0 " +
                      (item.destructive
                        ? (isActive
                            ? "bg-destructive/10 text-destructive"
                            : "text-destructive hover:bg-destructive/10")
                        : (isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"))
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden md:inline truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Right: Content Panel */}
          <div className="flex-1 min-w-0">
            <div className="bg-card border border-border rounded-xl p-6 md:p-8">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-20 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Enter your full name"
                      />
                      {savedProfileData && profileData.name !== savedProfileData.name && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-secondary" />
                      Username
                    </label>
                    <div className="px-4 py-3 bg-muted border border-border rounded-xl">
                      <p className="text-muted-foreground flex items-center gap-2">
                        <span className="text-muted-foreground">@</span>
                        {profileData.username || 'Not provided'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4 text-accent" />
                      Email Address
                    </label>
                    <div className="px-4 py-3 bg-muted border border-border rounded-xl">
                      <p className="text-muted-foreground">{profileData.email || 'Not provided'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Email is verified and cannot be changed</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4 text-accent" />
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-20 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Enter your phone number"
                      />
                      {savedProfileData && profileData.phone !== savedProfileData.phone && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Save"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={saving}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="pt-6 border-t border-border space-y-4">
                    <h3 className="text-sm font-medium text-foreground">Account Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="px-4 py-3 bg-muted border border-border rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Member since</p>
                        <p className="text-sm font-medium text-foreground">
                          {user.date_joined ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
                        </p>
                      </div>

                      <div className="px-4 py-3 bg-muted border border-border rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Account type</p>
                        <span className="inline-block bg-primary/10 text-primary text-xs font-medium rounded-full px-2.5 py-1">
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                        </span>
                      </div>

                      <div className="px-4 py-3 bg-muted border border-border rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Verification</p>
                        <div className="flex flex-wrap gap-1.5">
                          {user.is_verified ? (
                            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium rounded-full px-2.5 py-1">
                              <Check className="w-3 h-3" />
                              Email Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-medium rounded-full px-2.5 py-1 border border-border">
                              Not Verified
                            </span>
                          )}
                          {user.role === 'lawyer' && (
                            user.is_lawyer_verified || user.lawyer_verification_status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium rounded-full px-2.5 py-1">
                                <Check className="w-3 h-3" />
                                Bar Verified
                              </span>
                            ) : user.lawyer_verification_status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 bg-destructive/10 text-destructive text-xs font-medium rounded-full px-2.5 py-1">
                                Verification Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs font-medium rounded-full px-2.5 py-1 border border-border">
                                Verification Pending
                              </span>
                            )
                          )}
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-muted border border-border rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Sign-in method</p>
                        <p className="text-sm font-medium text-foreground">
                          {user.auth_provider === 'google' ? 'Google' : 'Email'}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'professional' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      Professional Details
                    </h2>
                    {hasLawyerChanges && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancelLawyerProfile}
                          disabled={lawyerProfileSaving}
                          className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleSaveLawyerProfile}
                          disabled={lawyerProfileSaving}
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Save"
                        >
                          {lawyerProfileSaving ? (
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {user.role === 'lawyer' && lawyerProfile ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Bio</label>
                        <textarea
                          name="bio"
                          value={lawyerProfile.bio}
                          onChange={handleLawyerInputChange}
                          rows={3}
                          className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                          placeholder="Tell clients about yourself..."
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Law Firm</label>
                          <input
                            type="text"
                            name="law_firm"
                            value={lawyerProfile.law_firm}
                            onChange={handleLawyerInputChange}
                            className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="e.g. Smith & Associates"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Education</label>
                          <input
                            type="text"
                            name="education"
                            value={lawyerProfile.education}
                            onChange={handleLawyerInputChange}
                            className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="e.g. LLB, National Law School"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Years of Experience</label>
                          <input
                            type="number"
                            name="experience_years"
                            value={lawyerProfile.experience_years}
                            onChange={handleLawyerInputChange}
                            min="0"
                            className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Consultation Fee</label>
                          <input
                            type="text"
                            name="consultation_fee"
                            value={lawyerProfile.consultation_fee}
                            onChange={handleLawyerInputChange}
                            className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="e.g. ₹2000/hr"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Specializations</label>
                        <input
                          type="text"
                          name="specializations"
                          value={Array.isArray(lawyerProfile.specializations) ? lawyerProfile.specializations.join(', ') : lawyerProfile.specializations}
                          onChange={(e) => setLawyerProfile({ ...lawyerProfile, specializations: e.target.value })}
                          className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="e.g. Family Law, Criminal Law, Corporate Law"
                        />
                        <p className="text-xs text-muted-foreground">Separate multiple specializations with commas</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">Professional details are available for lawyer accounts.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Activity
                  </h2>

                  {stats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-muted rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-foreground">{stats.documents_analyzed_count}</p>
                        <p className="text-sm text-muted-foreground mt-1">Documents Analyzed</p>
                      </div>
                      <div className="bg-muted rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-foreground">{stats.documents_created_count}</p>
                        <p className="text-sm text-muted-foreground mt-1">Documents Created</p>
                      </div>
                      <div className="bg-muted rounded-xl p-5 text-center">
                        <p className="text-3xl font-bold text-foreground">{stats.lawyer_consultations_count}</p>
                        <p className="text-sm text-muted-foreground mt-1">Lawyer Consultations</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-muted-foreground text-sm">Loading activity...</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium text-foreground mb-3">Quick Links</h3>
                    <div className="flex flex-wrap gap-2">
                      <a href="/document-analyser" className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition-colors">
                        Analyze a Document
                      </a>
                      <a href="/document-creation" className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition-colors">
                        Create a Document
                      </a>
                      <a href="/my-documents" className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium text-foreground transition-colors">
                        My Documents
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Bell className="w-5 h-5 text-primary" />
                      Notification Preferences
                    </h2>
                    {hasNotifPrefsChanges && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancelNotifPrefs}
                          disabled={notifPrefsSaving}
                          className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleSaveNotifPrefs}
                          disabled={notifPrefsSaving}
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          title="Save"
                        >
                          {notifPrefsSaving ? (
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between py-4 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Comment mentions</p>
                        <p className="text-xs text-muted-foreground">Get notified when someone mentions you in a comment</p>
                      </div>
                      <Switch
                        checked={notifPrefs.mentions}
                        onCheckedChange={(checked) => setNotifPrefs({ ...notifPrefs, mentions: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Lawyer connection updates</p>
                        <p className="text-xs text-muted-foreground">Updates on your lawyer connection requests</p>
                      </div>
                      <Switch
                        checked={notifPrefs.lawyer_updates}
                        onCheckedChange={(checked) => setNotifPrefs({ ...notifPrefs, lawyer_updates: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Document sharing</p>
                        <p className="text-xs text-muted-foreground">Notifications when documents are shared with you</p>
                      </div>
                      <Switch
                        checked={notifPrefs.document_shares}
                        onCheckedChange={(checked) => setNotifPrefs({ ...notifPrefs, document_shares: checked })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Password Management
                  </h2>
                  <div className="flex gap-3">
                    {user.auth_provider === 'google' && !user.has_password && (
                      <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        Add Password
                      </button>
                    )}
                    {(user.auth_provider === 'email' || (user.auth_provider === 'google' && user.has_password)) && (
                      <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        Change Password
                      </button>
                    )}
                  </div>

                  <div className="pt-6 border-t border-border space-y-4">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Session Security
                    </h3>

                    {user.last_login && (
                      <div className="px-4 py-3 bg-muted border border-border rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Current session started</p>
                        <p className="text-sm font-medium text-foreground">
                          {new Date(user.last_login).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: 'numeric', minute: '2-digit', hour12: true,
                          })}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-4 border-b border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Log out all other devices</p>
                        <p className="text-xs text-muted-foreground">
                          Invalidates every other active session. You'll need to sign in again on those devices.
                        </p>
                      </div>
                      <button
                        onClick={handleLogoutAllDevices}
                        disabled={loggingOutAll}
                        className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2 flex-shrink-0"
                      >
                        {loggingOutAll ? (
                          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin"></div>
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                        Log Out All
                      </button>
                    </div>

                    <div className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
                        <p className="text-xs text-muted-foreground">
                          Require a verification code from your email each time you sign in.
                        </p>
                      </div>
                      <Switch
                        checked={user.two_factor_enabled || false}
                        onCheckedChange={handleToggle2FA}
                        disabled={twoFactorSaving}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'danger' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-destructive" />
                    Danger Zone
                  </h2>

                  <div className="border border-destructive/30 rounded-xl p-6 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-destructive">Delete Account</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setDeletePassword('');
                        setDeleteConfirmText('');
                        setDeleteDialogOpen(true);
                      }}
                      className="px-6 py-3 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-medium transition-all duration-200"
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Account Dialog */}
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                    <DialogDescription>
                      This will permanently deactivate your account. You will lose access to all your data, documents, and connections.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    {(user.auth_provider !== 'google' || user.has_password) && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Confirm your password</label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-transparent transition-all"
                          placeholder="Enter your password"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Type <span className="font-bold text-destructive">DELETE</span> to confirm</label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive focus:border-transparent transition-all"
                        placeholder="Type DELETE"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <button
                      onClick={() => setDeleteDialogOpen(false)}
                      className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={
                        deleting ||
                        deleteConfirmText !== 'DELETE' ||
                        ((user.auth_provider !== 'google' || user.has_password) && !deletePassword)
                      }
                      className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {deleting ? (
                        <div className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete Account
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
      {user && (
        <PasswordModal
          isOpen={isPasswordModalOpen}
          onOpenChange={setIsPasswordModalOpen}
          user={user}
          onPasswordSubmit={handlePasswordSubmit}
        />
      )}
    </div>
  );
};

export default Profile;
