"use client"

import { FileText, Sparkles, Clock, Shield, Users, CheckCircle2, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import React from "react"

export default function Features() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 border border-border rounded-full text-xs font-medium text-muted-foreground mb-6">
            Features
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-foreground font-serif mb-6">
            Everything You Need to Handle
            <span className="block mt-2">Legal Documents with Confidence</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            AI-powered analysis, conversational document drafting, version tracking, e-signatures, and lawyer connections — all in one platform.
          </p>
        </div>
      </section>

      {/* AI Document Analyzer */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
                AI Document Analyzer
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Upload any legal document and get instant, comprehensive analysis. Our AI reads through dense legal text and surfaces what matters — in plain language you can actually understand.
              </p>
              <ul className="space-y-3">
                {[
                  "Clause-by-clause breakdown with risk scoring on a 1–5 scale",
                  "Plain-English summaries of complex legal terminology",
                  "Follow-up Q&A chat — ask questions about your document and get instant answers",
                  "Document comparison mode — upload two versions side by side to spot differences",
                  "Tagged session history — organize and revisit past analyses by topic",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Risk Analysis</span>
                <span className="text-[10px] font-semibold text-destructive flex items-center gap-1">High Risk</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded w-full"></div>
                <div className="h-2 bg-muted rounded w-[85%]"></div>
                <div className="h-2 bg-muted rounded w-[70%]"></div>
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 space-y-2">
                <span className="text-[10px] font-mono text-muted-foreground tracking-wider uppercase">Section 4.2: Indemnification</span>
                <p className="text-xs text-foreground leading-relaxed">Risk Score: 4/5 — Unlimited liability clause detected</p>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded w-[90%]"></div>
                <div className="h-2 bg-muted rounded w-[60%]"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Document Creator */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-card rounded-2xl border border-border overflow-hidden order-2 md:order-1">
              <div className="flex items-center justify-between bg-muted/40 border-b border-border px-4 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                  <div className="w-1.5 h-1.5 rounded-full bg-border" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground select-none">Document Generator</span>
                <div className="w-6" />
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-start">
                  <div className="bg-muted/70 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs text-foreground max-w-[85%] border border-border/50">
                    Draft an NDA for a software contractor in California
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary/10 rounded-2xl rounded-tr-none px-3.5 py-2 text-xs text-primary max-w-[85%] border border-primary/20">
                    I'll draft that. What duration and confidentiality scope?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted/70 rounded-2xl rounded-tl-none px-3.5 py-2 text-xs text-foreground max-w-[85%] border border-border/50">
                    2 years, standard scope
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary/10 rounded-2xl rounded-tr-none px-3.5 py-2 text-xs text-primary max-w-[85%] border border-primary/20">
                    <span className="text-muted-foreground">Drafting NDA...</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
                Smart Document Creator
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Generate custom legal documents through natural conversation. Describe what you need, and our AI drafts a tailored document — then refine it through chat until it's right.
              </p>
              <ul className="space-y-3">
                {[
                  "Conversational AI drafting — describe your document in plain language",
                  "Jurisdiction-aware templates for India and generic/international use",
                  "Inline AI text refinement — make formal, simplify, or shorten any section",
                  "Built-in clause library for common legal provisions",
                  "DOCX and PDF export for immediate use",
                  "Save as reusable template for documents you create regularly",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Version History & Collaboration */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
                Version History & Collaboration
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Track every change made to your documents with full revision history. Collaborate with your team through comments, mentions, and granular sharing permissions.
              </p>
              <ul className="space-y-3">
                {[
                  "Full version tracking with side-by-side diff comparison",
                  "Threaded comments with @mention support for team discussions",
                  "Document sharing with view or edit permissions per user",
                  "Instantly restore any previous version with a single click",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Version History</span>
                <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-medium">v1.2.3</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Current v1.2.3</p>
                    <p className="text-[10px] text-muted-foreground">Now</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-70">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Previous v1.2.2</p>
                    <p className="text-[10px] text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Previous v1.2.1</p>
                    <p className="text-[10px] text-muted-foreground">1 day ago</p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">3 comments · 2 mentions</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E-Signature */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4 order-2 md:order-1">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-primary tracking-wider uppercase">Document Signature</p>
                <p className="text-xs text-muted-foreground">Legal Agreement v1.2</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-foreground">John Smith</span>
                  <span className="text-[10px] text-green-600 font-medium bg-green-500/10 px-2 py-0.5 rounded">Signed</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-foreground">Sarah Johnson</span>
                  <span className="text-[10px] text-yellow-600 font-medium bg-yellow-500/10 px-2 py-0.5 rounded">Pending</span>
                </div>
              </div>
              <div className="border border-primary/20 rounded-xl h-16 flex items-center justify-center bg-primary/5">
                <div className="text-center">
                  <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-[10px] text-primary font-semibold">Digitally Secured</p>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
                Secure E-Signature
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Sign documents with legally binding digital signatures. Upload your signature, embed it directly into documents, and track signature status across all parties.
              </p>
              <ul className="space-y-3">
                {[
                  "Upload and save your signature for repeated use",
                  "Embed signatures directly into document text at designated fields",
                  "Multi-party signature tracking — see who has signed and who's pending",
                  "Signature status dashboard for complete visibility",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Lawyer Connect */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
                Lawyer Connect
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                When AI analysis isn't enough, connect with a real lawyer. Browse verified professionals filtered by specialization, request consultations, and get expert legal review of your documents.
              </p>
              <ul className="space-y-3">
                {[
                  "Searchable directory of verified lawyers with specialization filters",
                  "Sort by rating and review scores from other clients",
                  "Consultation and quote request forms with preferred scheduling",
                  "AI-powered lawyer matching based on your document type",
                  "In-app messaging for lawyer-client communication",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">RS</div>
                <div>
                  <p className="text-sm font-bold text-foreground">Rajesh Sharma</p>
                  <p className="text-[10px] text-muted-foreground">Corporate Law · 12 years exp.</p>
                </div>
                <div className="ml-auto text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-medium">4.8 ★</div>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">Contract Law</span>
                <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">M&A</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-muted/50 rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground">Consultation</p>
                  <p className="text-xs font-bold text-foreground">₹2,000/hr</p>
                </div>
                <div className="flex-1 px-3 py-2 bg-muted/50 rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground">Availability</p>
                  <p className="text-xs font-bold text-green-600">Available</p>
                </div>
              </div>
              <button className="w-full py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition">
                Request Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-4">
            Ready to simplify your legal documents?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start analyzing or creating documents today — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/document-analyser"
              className="inline-flex items-center justify-center gap-2 px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg font-medium text-base transition-colors"
            >
              Analyze a Document <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 h-12 border border-border text-foreground bg-transparent hover:bg-muted rounded-lg font-medium text-base transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
