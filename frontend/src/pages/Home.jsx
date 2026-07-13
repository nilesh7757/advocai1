"use client"

import { ArrowRight, Shield, FileText, Zap, CheckCircle2, Sparkles, ArrowUpRight, X } from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Link } from "react-router-dom"
import React, { useState, Suspense } from "react"
import Navbar from "@/Components/Navbar/Navbar" // Import the new Navbar component

import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function Home() {
  const [selectedFeature, setSelectedFeature] = useState(null)
  const [activeDemo, setActiveDemo] = useState("analyzer")
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
        "Sign documents with complete legal validity and security. Compliant with eIDAS, ESIGN Act, and other global regulations.",
      features: [
        "Legally binding digital signatures",
        "Multi-party signature workflows",
        "Bank-level encryption and audit trail",
      ],
    },
    "gen-track-sign": {
      title: "Generate, Track & Sign",
      description:
        "Create custom documents with AI, track every version change in real-time, and collect legally binding e-signatures from multiple parties. Manage your entire document lifecycle in one platform.",
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
          {/* Subtle static gradient mesh - tasteful accent moment only in the hero */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(49,46,129,0.12)_0%,transparent_70%)] blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(49,46,129,0.06)_0%,transparent_70%)] blur-3xl" />
          </div>

          <div className="relative w-full px-4 sm:px-6 lg:px-8"> {/* Changed to w-full */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 z-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">AI-Powered Legal Platform</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-foreground font-serif">
                  Master Legal Docs in
                  <span className="block relative mt-2 pb-2">
                    Seconds, Not Hours
                    <span className="absolute bottom-0 left-0 w-20 h-1 bg-primary rounded-full"></span>
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Stop struggling with confusing contracts. Our AI instantly simplifies legal jargon, flags risks,
                  generates custom legal documents, and connects you with expert lawyers when you need them.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {isAuthenticated ? (
                    <>
                      <Button
                        size="lg"
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base px-8 h-12 shadow-sm rounded-xl transition-all duration-200"
                        asChild
                      >
                        <Link to="/document-creation">
                          Document Generation <ArrowRight className="w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border border-border/80 text-foreground hover:bg-muted/80 font-semibold text-base px-8 h-12 rounded-xl bg-transparent transition-all duration-200"
                        asChild
                      >
                        <Link to="/document-analyzer">Document Analyzer</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base px-8 h-12 shadow-sm rounded-xl transition-all duration-200"
                        asChild
                      >
                        <Link to="/signup">
                          Sign Up <ArrowRight className="w-5 h-5" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border border-border/80 text-foreground hover:bg-muted/80 font-semibold text-base px-8 h-12 rounded-xl bg-transparent transition-all duration-200"
                        asChild
                      >
                        <Link to="/login">Sign In</Link>
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>No card needed</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative bg-card rounded-2xl p-1 border border-border shadow-md shadow-primary/5">
                  <div className="bg-card rounded-xl overflow-hidden">
                    {/* Toggle Buttons */}
                    <div className="flex border-b border-border/80 bg-muted/20">
                      <button
                        onClick={() => setActiveDemo("analyzer")}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                          activeDemo === "analyzer"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                        }`}
                      >
                        Document Analysis
                      </button>
                      <button
                        onClick={() => setActiveDemo("creator")}
                        className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
                          activeDemo === "creator"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                        }`}
                      >
                        Document Generator
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 space-y-4 min-h-64">
                      {activeDemo === "analyzer" ? (
                        <>
                          <div className="flex items-center gap-3 pb-4 border-b border-border/80">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-lg text-foreground">Document Analysis</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                              <ArrowUpRight className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground">Clauses decoded instantly</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground">Risk alerts highlighted</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                              <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground">Key terms simplified</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 pb-4 border-b border-border/80">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-semibold text-lg text-foreground">Document Generator</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                              <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground">AI-powered document creation</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                              <ArrowUpRight className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground">Chat-based editing interface</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground">Instant download & regenerate</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
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