import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/Components/ui/button";
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Home, 
  FileText, 
  Sparkles, 
  Users, 
  FolderOpen, 
  MessageSquare, 
  LayoutDashboard,
  Sun,
  Moon,
  Bell,
  Check
} from "lucide-react";
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { useTheme } from '../../context/ThemeContext'; // Import useTheme
import axios from '../../api/axios';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuth(); // Use AuthContext

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/auth/notifications/');
      setNotifications(response.data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // refresh every 15s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const markAsRead = async (id, documentId) => {
    try {
      await axios.patch(`/api/auth/notifications/${id}/read/`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setShowNotifications(false);
      navigate(`/document-creation/${documentId}`);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showProfileMenu]);

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/document-analyser", label: "Document Analyzer", icon: FileText },
    { to: "/document-creation", label: "Document Generator", icon: Sparkles },
    { to: "/lawyer-connect", label: "Connect", icon: Users },
    { to: "/my-documents", label: "My Documents", icon: FolderOpen },
    { to: "/chat", label: "Chat", requiresAuth: true, icon: MessageSquare },
  ];

  if (isAuthenticated && user?.role === 'lawyer') {
    navLinks.push({ to: "/lawyer-dashboard", label: "Lawyer Dashboard", requiresAuth: true, icon: LayoutDashboard });
  }

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 border-b border-border h-[var(--navbar-height)] transition-colors duration-200 ${isMenuOpen ? 'bg-background' : 'bg-background/90 backdrop-blur-sm'}`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <Link to="/" className="text-2xl font-bold text-foreground flex items-center gap-2 group flex-shrink-0 mr-6 lg:mr-8">
            <svg 
              className="w-7 h-7 text-primary transition-transform duration-300 group-hover:scale-105" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left leg of A (Document border angle) */}
              <path 
                d="M6 20L12 4" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Right leg of A (Document border angle) */}
              <path 
                d="M15 8L19.5 20" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Abstract Document Fold Flap at the apex */}
              <path 
                d="M12 4L15 8H12V4Z" 
                fill="currentColor" 
                opacity="0.35"
              />
              {/* Fold edge line */}
              <path 
                d="M12 4L15 8" 
                stroke="currentColor" 
                strokeWidth="1.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Checkmark Crossbar (Legal verification) */}
              <path 
                d="M8 14.5L11 17.5L17.5 9.5" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
            <span>
              Advoc<span className="text-primary">AI</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {navLinks.map((link, index) => {
              const isActive = location.pathname === link.to;
              const showLink = !link.requiresAuth || isAuthenticated;
              if (!showLink) return null;
              return (
                <Link 
                  to={link.to} 
                  key={index} 
                  className={
                    "min-w-[5rem] xl:min-w-[6rem] px-3 xl:px-4 py-1.5 text-xs xl:text-sm font-semibold rounded-lg transition-all duration-150 relative group text-center " +
                    (isActive
                      ? "bg-primary/10 text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted")
                  }
                >
                  {link.label}
                  <span className={"absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-300 " + (isActive ? "w-full" : "w-0 group-hover:w-full")}></span>
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 flex-shrink-0">
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="w-9 h-9 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <div ref={notificationsRef} className="relative">
                  <Button
                    onClick={() => setShowNotifications(!showNotifications)}
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors relative flex items-center justify-center flex-shrink-0 cursor-pointer"
                    title="Notifications"
                  >
                    <Bell size={16} />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {notifications.filter(n => !n.is_read).length}
                      </span>
                    )}
                  </Button>
                  
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 w-72 py-2 select-none overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                      <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground">Notifications</span>
                        {notifications.filter(n => !n.is_read).length > 0 && (
                          <span className="text-[10px] text-muted-foreground">{notifications.filter(n => !n.is_read).length} unread</span>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-6">No notifications yet.</p>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markAsRead(n.id, n.document_id)}
                              className={`p-3 text-left cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-2.5 ${
                                !n.is_read ? 'bg-muted/20 font-semibold' : ''
                              }`}
                            >
                              <div className="flex-1 space-y-1">
                                <p className="text-xs text-foreground font-medium leading-normal">{n.message}</p>
                                <p className="text-[9px] text-muted-foreground">
                                  {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                              {!n.is_read && (
                                <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link to="/profile" className="flex items-center justify-center flex-shrink-0" title="View Profile">
                  {user && user.profile_picture ? (
                    <img src={user.profile_picture} alt="Profile" className="w-9 h-9 rounded-full border-2 border-primary/50 hover:border-primary hover:scale-105 transition-all duration-200 object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 hover:border-primary hover:scale-105 transition-all duration-200">
                      <User size={16} className="text-primary" />
                    </div>
                  )}
                </Link>
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  size="sm"
                  className="border-border hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 h-9 px-3 rounded-lg"
                >
                  <LogOut size={14} className="mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="lg:hidden flex items-center space-x-2">
            {isAuthenticated && (
              <div ref={notificationsRef} className="relative">
                <Button
                  onClick={() => setShowNotifications(!showNotifications)}
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors relative flex items-center justify-center flex-shrink-0 cursor-pointer"
                  title="Notifications"
                >
                  <Bell size={16} />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 w-72 py-2 select-none overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                    <div className="px-4 py-2 border-b border-border flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground">Notifications</span>
                      {notifications.filter(n => !n.is_read).length > 0 && (
                        <span className="text-[10px] text-muted-foreground">{notifications.filter(n => !n.is_read).length} unread</span>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-6">No notifications yet.</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id, n.document_id)}
                            className={`p-3 text-left cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-2.5 ${
                              !n.is_read ? 'bg-muted/20 font-semibold' : ''
                            }`}
                          >
                            <div className="flex-1 space-y-1">
                              <p className="text-xs text-foreground font-medium leading-normal">{n.message}</p>
                              <p className="text-[9px] text-muted-foreground">
                                {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            {!n.is_read && (
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <Button
              onClick={toggleTheme}
              variant="ghost"
              size="icon"
              className="w-9 h-9 border border-border hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              title={isDarkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2.5 rounded-lg hover:bg-foreground/10 transition-colors duration-200 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`lg:hidden fixed top-[var(--navbar-height)] inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Sidebar Drawer */}
      <div 
        className={`lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-2xl z-50 flex flex-col transition-all duration-300 ease-out transform overflow-hidden ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <style>{`
          @keyframes slideInMobile {
            from {
              opacity: 0;
              transform: translateX(15px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>

        {/* Header of Sidebar */}
        <div className="p-5 border-b border-border/40 flex items-center justify-between flex-shrink-0">
          <Link 
            to="/" 
            className="text-2xl font-bold text-foreground flex items-center gap-2 group flex-shrink-0"
            onClick={() => setIsMenuOpen(false)}
          >
            <svg 
              className="w-7 h-7 text-primary" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left leg of A (Document border angle) */}
              <path 
                d="M6 20L12 4" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Right leg of A (Document border angle) */}
              <path 
                d="M15 8L19.5 20" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Abstract Document Fold Flap at the apex */}
              <path 
                d="M12 4L15 8H12V4Z" 
                fill="currentColor" 
                opacity="0.35"
              />
              {/* Fold edge line */}
              <path 
                d="M12 4L15 8" 
                stroke="currentColor" 
                strokeWidth="1.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Checkmark Crossbar (Legal verification) */}
              <path 
                d="M8 14.5L11 17.5L17.5 9.5" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            </svg>
            <span>
              Advoc<span className="text-primary">AI</span>
            </span>
          </Link>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Profile section in Sidebar */}
        {isAuthenticated && user && (
          <Link 
            to="/profile" 
            className="p-5 border-b border-border/40 bg-muted/40 hover:bg-muted/80 flex items-center gap-3 flex-shrink-0 transition-colors duration-200"
            onClick={() => setIsMenuOpen(false)}
          >
            {user.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" className="w-11 h-11 rounded-full border-2 border-primary/50 shadow-inner" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary font-bold text-lg">
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-grow">
              <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role || 'User'}</p>
            </div>
          </Link>
        )}

        {/* List of links - Spaced out and non-scrolling */}
        <div className="py-8 px-6 space-y-6">
          {navLinks.map((link, index) => {
            const showLink = (!link.requiresAuth) || isAuthenticated;
            if (!showLink) return null;
            
            const isActive = location.pathname === link.to;
            const Icon = link.icon;
            
            return (
              <Link 
                to={link.to} 
                key={index} 
                className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-150 border border-transparent ${
                  isActive 
                    ? 'bg-primary/10 border-primary/10 text-foreground font-semibold' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                onClick={() => setIsMenuOpen(false)}
                style={{ 
                  animation: isMenuOpen ? `slideInMobile 0.25s ease-out forwards ${index * 0.04}s` : 'none',
                  opacity: 0,
                  transform: 'translateX(15px)'
                }}
              >
                {Icon && <Icon size={20} className={isActive ? 'text-primary' : 'text-muted-foreground'} />}
                <span className="text-base font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer / Auth actions in Sidebar */}
        <div className="p-4 border-t border-border flex-shrink-0 bg-muted/20">
          {isAuthenticated ? (
            <Button 
              onClick={() => { logout(); setIsMenuOpen(false); }} 
              variant="destructive" 
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-150 h-11 rounded-lg text-sm"
            >
              <LogOut size={16} className="mr-2 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </Button>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all h-11 rounded-xl font-medium">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
