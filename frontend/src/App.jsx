import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import VerifyOtp from "./pages/VerifyOtp"; // Added this import
import ForgotPassword from "./pages/ForgotPassword"; // Import ForgotPassword
import ResetPassword from "./pages/ResetPassword"; // Import ResetPassword


import LawyerProfile from "./pages/LawyerProfile";
import LawyerDashboard from "./pages/LawyerDashboard";
import DocumentAnalyzer from "./pages/DocumentAnalyzer";
import LawyerConnect from "./pages/LawyerConnect";
import MyDocuments from "./pages/MyDocuments";
import DocumentCreation from "./pages/DocumentCreation";
import SharedDocumentView from "./pages/SharedDocumentView";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Security from "./pages/Security";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import ChatList from "./pages/ChatList";
import Chat from "./pages/Chat";
import ProtectedRoute from "./routes/ProtectedRoute";

function AppContent() {
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']; // Updated hideNavbarRoutes
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground" style={{ '--navbar-height': '4.5rem' }}> {/* Set a reasonable navbar height */}
      {shouldShowNavbar && <Navbar />}
      <main 
        className="flex-grow relative z-10 animate-fade-in" 
        style={{ 
          height: shouldShowNavbar ? 'calc(100vh - var(--navbar-height))' : '100vh',
          marginTop: shouldShowNavbar ? 'var(--navbar-height)' : '0px'
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/security" element={<Security />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route
            path="/document-analyser"
            element={(
              <ProtectedRoute>
                <DocumentAnalyzer />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/document-analyser/:id"
            element={(
              <ProtectedRoute>
                <DocumentAnalyzer />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/document-creation"
            element={(
              <ProtectedRoute>
                <DocumentCreation />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/document-creation/:id"
            element={(
              <ProtectedRoute>
                <DocumentCreation />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/lawyer-connect"
            element={(
              <ProtectedRoute>
                <LawyerConnect />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/my-documents"
            element={(
              <ProtectedRoute>
                <MyDocuments />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/lawyer-profile/:id"
            element={(
              <ProtectedRoute>
                <LawyerProfile />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/lawyer-dashboard"
            element={(
              <ProtectedRoute>
                <LawyerDashboard />
              </ProtectedRoute>
            )}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Added ForgotPassword route */}
          <Route path="/reset-password" element={<ResetPassword />} /> {/* Added ResetPassword route */}
          <Route
            path="/verify-otp"
            element={<VerifyOtp />}
          />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/documentShare/:id"
            element={<SharedDocumentView />}
          />
          <Route
            path="/chat"
            element={(
              <ProtectedRoute>
                <ChatList />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/chat/:conversationId"
            element={(
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            )}
          />
        </Routes>
      </main>
      {/* {shouldShowNavbar && <Footer />} */}
    </div>
  );
}

import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full text-center space-y-4 p-8 border border-border bg-card rounded-xl shadow-sm">
            <h1 className="text-xl font-bold text-destructive">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred in the application. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Toaster position="bottom-right" />
        <AuthProvider> {/* Wrap AppContent with AuthProvider */}
          <ThemeProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
