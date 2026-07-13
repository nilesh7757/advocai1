import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
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
  Moon
} from "lucide-react";
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { useTheme } from '../../context/ThemeContext'; // Import useTheme

export default function Navbar() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuth(); // Use AuthContext

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
          <Link to="/" className="text-2xl font-bold text-foreground flex items-center gap-2 group flex-shrink-0">
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
          <div className="hidden lg:flex items-center space-x-0.5 xl:space-x-1.5">
            {navLinks.map((link, index) => (
              ((!link.requiresAuth) || isAuthenticated) && (
                <Link 
                  to={link.to} 
                  key={index} 
                  className="text-muted-foreground hover:text-foreground px-2.5 xl:px-3.5 py-1.5 text-xs xl:text-sm font-semibold rounded-lg hover:bg-muted transition-all duration-150 relative group"
                >
                  {link.label === "Document Analyzer" ? (
                    <>
                      <span className="hidden xl:inline">Document </span>Analyzer
                    </>
                  ) : link.label === "Document Generator" ? (
                    <>
                      <span className="hidden xl:inline">Document </span>Generator
                    </>
                  ) : link.label === "My Documents" ? (
                    <>
                      <span className="hidden xl:inline">My </span>Documents
                    </>
                  ) : link.label === "Lawyer Dashboard" ? (
                    <>
                      <span className="hidden xl:inline">Lawyer </span>Dashboard
                    </>
                  ) : (
                    link.label
                  )}
                  <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>
              )
            ))}
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
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-white shadow-md shadow-primary/30 hover:shadow-lg shadow-primary/40 transition-all duration-200">
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="lg:hidden flex items-center space-x-2">
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
        className={`lg:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l border-border shadow-2xl z-50 flex flex-col transition-all duration-300 ease-out transform ${
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
            
            const isActive = window.location.pathname === link.to;
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
        <div className="p-5 border-t border-border flex-shrink-0 bg-muted/20">
          {isAuthenticated ? (
            <div className="space-y-2">
              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start border-border hover:bg-muted h-11 rounded-lg">
                  <User size={16} className="mr-2" />
                  View Profile
                </Button>
              </Link>
              <Button 
                onClick={() => { logout(); setIsMenuOpen(false); }} 
                variant="destructive" 
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-150 h-11 rounded-lg"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/95 hover:to-secondary/95 text-white shadow-md shadow-primary/20 hover:shadow-lg shadow-primary/30 transition-all h-11 rounded-xl font-medium">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
