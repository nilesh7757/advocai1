import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/Components/ui/button";
import { User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from '../../context/AuthContext'; // Import useAuth

export default function Navbar() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuth(); // Use AuthContext

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
    { to: "/", label: "Home" },
    { to: "/document-analyser", label: "Document Analyzer" },
    { to: "/document-creation", label: "Document Generator" },
    { to: "/lawyer-connect", label: "Connect" },
    { to: "/my-documents", label: "My Documents" },
    { to: "/chat", label: "Chat", requiresAuth: true },
  ];

  if (isAuthenticated && user?.role === 'lawyer') {
    navLinks.push({ to: "/lawyer-dashboard", label: "Lawyer Dashboard", requiresAuth: true });
  }

  return (
    <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b py-4 border-border shadow-lg shadow-black/20 h-[var(--navbar-height)]">
      <div className="container mx-auto px-5 h-full">
        <div className="flex items-center justify-between h-17">
          <Link to="/" className="text-3xl font-extrabold text-white hover:text-primary transition-colors duration-200 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            AdvocAI
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link, index) => (
              ((!link.requiresAuth) || isAuthenticated) && (
                <Link 
                  to={link.to} 
                  key={index} 
                  className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-lg hover:bg-foreground/5 transition-all duration-200 relative group"
                >
                  {link.label}
                  <span className="absolute bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>
              )
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <Button variant="ghost" className="hover:bg-foreground/5 rounded-full">
                    {user && user.profile_picture ? (
                      <img src={user.profile_picture} alt="Profile" className="w-9 h-8 rounded-full border-2 border-primary/50 hover:border-primary transition-colors" />
                    ) : (
                      <div className="w-9 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <User size={17} className="text-primary" />
                      </div>
                    )}
                  </Button>
                </Link>
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  size="sm"
                  className="border-border hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                >
                  <LogOut size={15} className="mr-2" />
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

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-lg hover:bg-foreground/10 transition-colors duration-200 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
              <Menu size={23} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-background/90 backdrop-blur-md z-40 flex flex-col items-center justify-center space-y-8">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-5 right-5 p-3 rounded-lg hover:bg-foreground/10 transition-colors duration-200 text-foreground"
          >
            <X size={24} />
          </button>
          {navLinks.map((link, index) => (
            ((!link.requiresAuth) || isAuthenticated) && (
              <Link 
                to={link.to} 
                key={index} 
                className="text-3xl font-bold text-foreground hover:text-primary transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            )
          ))}
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="text-3xl font-bold text-foreground hover:text-primary transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>
                Profile
              </Link>
              <Button 
                onClick={() => { logout(); setIsMenuOpen(false); }} 
                variant="outline" 
                size="lg"
                className="border-border hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 text-3xl font-bold"
              >
                <LogOut size={25} className="mr-3" />
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login" className="text-3xl font-bold text-foreground hover:text-primary transition-colors duration-200" onClick={() => setIsMenuOpen(false)}>
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary hover:to-secondary text-white shadow-md shadow-primary/30 hover:shadow-lg shadow-primary/40 transition-all duration-200 text-3xl font-bold">
                Login
              </Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
