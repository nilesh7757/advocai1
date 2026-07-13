"use client"

import { ArrowRight, Shield, FileText, Zap, CheckCircle2, Sparkles, ArrowUpRight, X } from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Link } from "react-router-dom"
import React, { useState, Suspense } from "react"
import Navbar from "@/Components/Navbar/Navbar" // Import the new Navbar component

import { useAuth } from '../context/AuthContext'; // Import useAuth

function ProductPreviewCard() {
  return (
    <div className="relative w-full max-w-lg mx-auto bg-card rounded-2xl border border-border shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] dark:shadow-none overflow-hidden animate-fade-in-up">
      {/* Top browser bar */}
      <div className="flex items-center justify-between bg-muted/40 border-b border-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
        </div>
        <span className="text-xs font-mono text-muted-foreground select-none">
          advocai.net/document/analyzer
        </span>
        <div className="w-10" />
      </div>
      
      {/* Document content mock */}
      <div className="p-6 space-y-4 bg-card">
        {/* Paragraph 1 */}
        <div className="space-y-2">
          <div className="h-3 w-[90%] bg-muted rounded animate-pulse" />
          <div className="h-3 w-[95%] bg-muted rounded animate-pulse" />
          <div className="h-3 w-[85%] bg-muted rounded animate-pulse" />
        </div>

        {/* Highlighted Risky Clause Block */}
        <div className="relative my-4 p-4 bg-primary/5 border border-primary/20 dark:border-primary/30 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">Section 4.2: Indemnification</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
              <span>⚠️</span> Risk Detected
            </span>
          </div>
          <p className="text-xs leading-relaxed text-foreground/80 font-sans">
            "The Client agrees to indemnify and hold harmless the Provider from any and all claims, damages, or liabilities arising directly or indirectly under this Agreement, without limitation of liability or cap on damages."
          </p>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>AI Risk Score: <strong className="text-destructive font-semibold">High Risk</strong></span>
            <span className="text-primary font-medium hover:underline cursor-pointer">Suggested Revision Available</span>
          </div>
        </div>

        {/* Paragraph 2 */}
        <div className="space-y-2">
          <div className="h-3 w-[95%] bg-muted rounded animate-pulse" />
          <div className="h-3 w-[88%] bg-muted rounded animate-pulse" />
          <div className="h-3 w-[40%] bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedFeature, setSelectedFeature] = useState(null)
  const { isAuthenticated } = useAuth(); // Get isAuthenticated from AuthContext
  // isLoggedIn, showProfileMenu, profileMenuRef, navigate, isAuthenticated, user, logout, handleProtectedNavClick are now handled by Navbar component

  const featureDetails = {
    analyzer: {
      title: "AI Document Analyzer",
      description:
        "Transform complex legal documents into clear, actionable insights with our advanced AI-powered analysis engine.",
      features: [
        "Instant clause-by-clause breakdown",
        "Risk flagging and liability alerts",
        "Ask follow-up questions about any document",
      ],
    },
    creator: {
      title: "Smart Document Creator",
      description:
        "Generate custom legal documents through an intuitive AI-powered chatbot. Describe what you need and edit through natural conversation.",
      features: [
        "Conversational document generation",
        "Edit through natural chat interaction",
        "Download, edit, or regenerate instantly",
      ],
    },
    timeline: {
      title: "Document History Timeline",
      description:
        "Track every change made to your documents with a clear, chronological timeline and restore any previous version instantly.",
      features: [
        "Complete version history with timestamps",
        "Instantly restore any previous version",
        "Track changes made to your documents",
      ],
    },
    signature: {
      title: "Secure E-Signature",
      description:
        "Sign documents with complete legal validity and safety. Our e-signature solution is compliant with ESIGN Act and other regulations.",
      features: [
        "Legally binding digital signatures",
        "Multi-party signature workflows",
        "Bank-level encryption and audit trail",
      ],
    },
    "gen-track-sign": {
      title: "Generate, Track & Sign",
      description:
        "Create custom documents with AI, track version changes, and collect legally binding e-signatures from all parties. Manage document life cycles.",
      features: [
        "AI-powered custom document creation",
        "Complete version history with timestamps",
        "Legally binding e-signatures & verification",
        "Edit and regenerate with AI suggestions",
      ],
    },
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      <div className="relative z-10">
        <section className="relative overflow-hidden py-20 md:py-32">
          {/* Subtle static blob behind hero - tasteful accent moment only in the hero */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(55,48,163,0.06)_0%,transparent_70%)] blur-3xl" />
          </div>

          <div className="relative w-full px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 z-10">
                <div className="inline-flex items-center px-3 py-1 border border-border rounded-full text-xs font-medium text-muted-foreground">
                  AI-Powered Legal Assistant
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-foreground font-serif">
                  Master Legal Docs in
                  <span className="block mt-2">
                    <span className="relative inline-block px-1">
                      Minutes
                      <svg 
                        className="absolute left-0 -bottom-2 w-full h-3 text-primary" 
                        viewBox="0 0 100 10" 
                        preserveAspectRatio="none" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                      >
                        <path d="M 3 2 Q 50 9 97 2" />
                      </svg>
                    </span>
                    , Not Hours
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Stop struggling with confusing contracts. Our AI simplifies legal jargon, flags risks,
                  generates custom documents, and connects you with expert lawyers when you need them.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {isAuthenticated ? (
                    <>
                      <Button
                        size="lg"
                        className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-medium text-base px-8 h-12 shadow-sm transition-colors duration-150"
                        asChild
                      >
                        <Link to="/document-creation">
                          Get Started <ArrowRight className="w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-lg border border-border text-foreground bg-transparent hover:bg-secondary font-medium text-base px-8 h-12 transition-colors duration-150"
                        asChild
                      >
                        <Link to="/document-analyser">Analyze Document</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-medium text-base px-8 h-12 shadow-sm transition-colors duration-150"
                        asChild
                      >
                        <Link to="/signup">
                          Get Started <ArrowRight className="w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-lg border border-border text-foreground bg-transparent hover:bg-secondary font-medium text-base px-8 h-12 transition-colors duration-150"
                        asChild
                      >
                        <Link to="/login">See How It Works</Link>
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>No card needed</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <ProductPreviewCard />
              </div>
            </div>
          </div>
        </section>

        <section
          id="features-detailed"
          className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-border" // Changed to w-full
        >
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text">
                Core Capabilities
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Powerful Features That Work Together</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every tool you need to master legal documents, from AI analysis to secure collaboration.
            </p>
          </div>

          {/* Feature 1: AI-Powered Document Analyzer */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="relative order-2 md:order-1 cursor-pointer" onClick={() => setSelectedFeature("analyzer")}>
              <div className="relative bg-card rounded-2xl p-1 border border-border shadow-md shadow-primary/5 overflow-hidden">
                <div className="relative bg-card rounded-xl h-64 flex flex-col items-center justify-center gap-6 p-8">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-semibold text-foreground">Document Analysis Engine</p>
                    <p className="text-xs text-muted-foreground">AI-powered clause detection</p>
                  </div>
                  <div className="w-full space-y-2 max-w-xs">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 h-2 bg-primary/20 rounded-full overflow-hidden">
                        <div className="w-[100%] h-full bg-primary rounded-full"></div>
                      </div>
                      <span className="text-xs text-primary font-semibold font-mono">100%</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="w-[40%] h-full bg-primary/50 rounded-full"></div>
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold font-mono">5 alerts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-3 text-foreground font-serif">
                  AI Document Analyzer
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Transform complex legal documents into clear, actionable insights. Our advanced AI reads through pages
                  of dense legal text and instantly highlights key terms, identifies risks, and provides plain-English
                  summaries. Say goodbye to hours of frustrating document review.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Instant clause-by-clause breakdown</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Risk flagging and liability alerts</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Ask follow-up questions about any document</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2: Smart Document Creator */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="space-y-6 order-1 md:order-1">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-3 text-foreground font-serif">
                  Smart Document Creator
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Generate custom legal documents through an intuitive AI-powered chatbot. Describe exactly what you
                  need, and our AI creates a tailored document. Edit, refine, and regenerate using natural conversation
                  until your document is perfect.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Conversational document generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Edit through natural chat interaction</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Download, edit, or regenerate instantly</span>
                </li>
              </ul>
            </div>
            <div
              className="relative group cursor-pointer order-2 md:order-2"
              onClick={() => setSelectedFeature("creator")}
            >
              <div className="relative bg-card rounded-2xl p-1 border border-border shadow-md shadow-primary/5 overflow-hidden">
                <div className="relative bg-card rounded-xl p-6 h-64 flex flex-col justify-end gap-3">
                  <div className="space-y-3">
                    <div className="flex gap-2 justify-start">
                      <div className="bg-primary/10 rounded-xl px-4 py-2.5 text-xs text-primary max-w-[70%] border border-primary/20">
                        Create a contract...
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <div className="bg-muted rounded-xl px-4 py-2.5 text-xs text-muted-foreground max-w-[70%] border border-border">
                        Processing details...
                      </div>
                    </div>
                    <div className="flex gap-1.5 px-1 py-1">
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Document History Timeline */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div
              className="relative group order-2 md:order-1 cursor-pointer"
              onClick={() => setSelectedFeature("timeline")}
            >
              <div className="relative bg-card rounded-2xl p-1 border border-border shadow-md shadow-primary/5 overflow-hidden">
                <div className="relative bg-card rounded-xl p-6 h-64 flex flex-col justify-center gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/25"></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Current v1.2.3</p>
                        <p className="text-xs text-muted-foreground">Now</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-75">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Previous v1.2.2</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 opacity-50">
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Previous v1.2.1</p>
                        <p className="text-xs text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-3 text-foreground font-serif">
                  Document History Timeline
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Track every change made to your documents with a clear, chronological timeline. Access all previous
                  versions of your documents with timestamps, see exactly what was modified, and instantly restore any
                  earlier version with a single click.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Complete version history with timestamps</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Instantly restore any previous version</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Track changes made to your documents</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 4: Secure E-Signature */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="space-y-6 order-1 md:order-1">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-3 text-foreground font-serif">
                  Secure E-Signature
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Sign documents with complete legal validity and security. Our e-signature solution is compliant with
                  eIDAS, ESIGN Act, and other global regulations. Send signature requests to multiple parties, track
                  completion status, and store signed documents securely.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Legally binding digital signatures</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Multi-party signature workflows</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Bank-level encryption and audit trail</span>
                </li>
              </ul>
            </div>
            <div
              className="relative group cursor-pointer order-2 md:order-2"
              onClick={() => setSelectedFeature("signature")}
            >
              <div className="relative bg-card rounded-2xl p-1 border border-border shadow-md shadow-primary/5 overflow-hidden">
                <div className="relative bg-card rounded-xl p-8 h-64 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-primary">DOCUMENT SIGNATURE</p>
                    <p className="text-sm text-muted-foreground">Legal Agreement v1.2</p>
                  </div>
                  <div className="border border-primary/20 rounded-xl h-24 flex items-center justify-center bg-primary/5">
                    <div className="text-center">
                      <Shield className="w-7 h-7 text-primary mx-auto mb-2" />
                      <p className="text-xs text-primary font-semibold">Digitally Secured</p>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm">
                    Sign Document
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 5: Document Generator with Version Tracking & E-Signature */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20 border-t border-border pt-20">
            <div
              className="relative group cursor-pointer order-2 md:order-1"
              onClick={() => setSelectedFeature("gen-track-sign")}
            >
              <div className="relative bg-card rounded-2xl p-1 border border-border shadow-md shadow-primary/5 overflow-hidden">
                <div className="relative bg-card rounded-xl p-6 h-64 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">DOCUMENT GENERATOR</span>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">v1.2.3</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 h-2 bg-primary/20 rounded-full overflow-hidden">
                      <div className="w-[80%] h-full bg-primary rounded-full"></div>
                    </div>
                    <span className="text-xs text-primary font-mono font-semibold">Version 3</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs text-green-600 font-semibold">3 Signatures Verified</span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-border/80">
                    <p className="text-xs text-muted-foreground text-center">Last edited 2 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div>
                <h3 className="text-3xl md:text-4xl font-bold mb-3 text-foreground font-serif">
                  Generate, Track & Sign
                </h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Create custom documents with AI, track every version change in real-time, and collect legally binding
                  e-signatures from multiple parties. Manage your entire document lifecycle in one platform.
                </p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">AI-powered custom document creation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Complete version history with timestamps</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Legally binding e-signatures & verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  <span className="text-muted-foreground text-sm">Edit and regenerate with AI suggestions</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="w-full px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-border"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-serif text-foreground">Three Simple Steps to Mastery</h2>
            <p className="text-lg text-muted-foreground">From analysis to generation to signature in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                number: "01",
                title: "Analyze or Generate",
                description:
                  "Upload documents for instant AI analysis or create new ones from scratch with our intelligent generator.",
                numColor: "text-primary/90",
              },
              {
                number: "02",
                title: "Version & Edit",
                description:
                  "Make edits, request AI-powered changes, and track every version with complete revision history.",
                numColor: "text-primary/60",
              },
              {
                number: "03",
                title: "Sign & Deliver",
                description:
                  "Collect legally binding e-signatures from all parties with verification and secure audit trails.",
                numColor: "text-primary/30",
              },
            ].map((step, idx /* eslint-disable-line no-unused-vars */) => (
              <div key={step.number} className="relative group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                <div className="relative border border-border rounded-xl p-8 group-hover:border-primary/30 transition-colors bg-card shadow-sm">
                  <div className={`text-6xl font-bold ${step.numColor} mb-4 group-hover:scale-105 transition-transform font-serif`}>
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold font-serif mb-3 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border relative">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            <div className="grid md:grid-cols-5 gap-12 mb-12">
              {/* Brand */}
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 group mb-4">
                  <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <polyline points="9 15 11 17 15 13" />
                  </svg>
                  <span className="text-lg font-bold font-serif tracking-tight text-foreground">
                    Advoc<span className="text-primary font-sans font-extrabold">AI</span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Master legal documents with AI-powered analysis, generation, and secure e-signatures.
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground mb-4">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Features
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Pricing
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Security
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground mb-4">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      About
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Blog
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Contact
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Privacy
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Terms
                    </span>
                  </li>
                  <li>
                    <span className="text-xs text-muted-foreground hover:text-primary transition cursor-default">
                      Disclaimer
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">&copy; 2025 Advoc AI. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <span className="text-xs text-muted-foreground">Built with AI for legal professionals</span>
              </div>
            </div>
          </div>
        </footer>

        {selectedFeature && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedFeature(null)}
          >
            <div
              className="bg-card border border-primary/30 rounded-2xl max-w-2xl w-full p-8 space-y-6 relative max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedFeature(null)}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>

              <div>
                <h2 className="text-4xl font-bold text-foreground font-serif mb-4">
                  {featureDetails[selectedFeature].title}
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {featureDetails[selectedFeature].description}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold font-serif">Key Benefits:</h3>
                <ul className="space-y-2">
                  {featureDetails[selectedFeature].features.map((feature, idx /* eslint-disable-line no-unused-vars */) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-primary">
                        <span className="text-xs font-bold">✓</span>
                      </div>
                      <span className="text-muted-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base py-3 rounded-xl shadow-sm transition"
              >
                Try {featureDetails[selectedFeature].title} <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}