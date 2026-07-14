"use client"

import { ArrowRight, ShieldAlert, Info, FileText, Search, PenTool, Users } from "lucide-react"
import { Button } from "@/Components/ui/button"
import { Link } from "react-router-dom"
import React from "react"

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-20 md:py-24">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 border border-border rounded-full text-xs font-medium text-muted-foreground mb-6">
            About AdvocAI
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-foreground font-serif mb-6">
            Making Legal Documents
            <span className="block mt-2">Accessible to Everyone</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            AdvocAI helps people understand, draft, and manage legal documents using AI-powered analysis.
            When you need more than what AI can offer, we connect you with qualified lawyers.
          </p>
        </div>
      </section>

      {/* Mission / Problem Section */}
      <section className="py-20 md:py-24 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-8">
            The Problem We're Solving
          </h2>
          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Legal documents are written in dense, specialized language that most people cannot easily parse.
              A simple rental agreement, employment contract, or non-disclosure agreement can contain clauses
              that have significant consequences — but understanding those consequences usually requires either
              a legal education or expensive professional help.
            </p>
            <p>
              For many everyday legal needs — drafting a basic contract, understanding what a lease actually says,
              or preparing a standard agreement — hiring a lawyer feels disproportionate. The cost and
              complexity of traditional legal services leave a gap where people either pay too much for simple
              tasks or navigate important legal matters without proper guidance.
            </p>
            <p>
              AdvocAI addresses this gap with AI-powered plain-English analysis and affordable document drafting.
              We translate legal jargon into language you can understand, flag risks you might otherwise miss,
              and generate customized documents through natural conversation. And when your situation requires
              real legal expertise, our Lawyer Connect feature helps you find a qualified professional.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-24 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif text-foreground">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three steps to clearer legal documents
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Analyze or Generate",
                description:
                  "Upload an existing document for instant AI analysis, or describe what you need and let our AI draft a custom document for you.",
                icon: FileText,
                numColor: "text-primary/90",
              },
              {
                number: "02",
                title: "Understand and Refine",
                description:
                  "Get plain-English explanations of every clause, flag potential risks, and refine your document through natural conversation with the AI.",
                icon: Search,
                numColor: "text-primary/60",
              },
              {
                number: "03",
                title: "Sign or Connect",
                description:
                  "Securely e-sign your document when it's ready, or connect with a qualified lawyer if your situation needs professional legal review.",
                icon: Users,
                numColor: "text-primary/30",
              },
            ].map((step) => (
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
        </div>
      </section>

      {/* AI & Legal Disclaimer */}
      <section className="py-20 md:py-24 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <div className="bg-muted/50 border border-border rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl md:text-2xl font-bold font-serif text-foreground">
                Important: What AdvocAI Is (and Isn't)
              </h2>
            </div>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                AdvocAI is an AI-powered drafting and analysis tool. We are not a law firm, and nothing on this
                platform constitutes legal advice. Our AI can help you generate preliminary drafts of legal
                documents, explain legal terminology in plain language, and flag clauses that may warrant
                attention — but it cannot interpret your specific situation, predict legal outcomes, or
                replace the judgment of a qualified legal professional.
              </p>
              <p>
                Every document generated by AdvocAI is a starting point, not a finished legal instrument.
                Laws and regulations vary by jurisdiction and change over time. An AI-generated template
                may not account for the specific requirements of your situation, your local laws, or recent
                legal developments.
              </p>
              <p>
                For any real legal matter — whether reviewing a contract before signing, navigating a dispute,
                or ensuring compliance with local regulations — you should consult a qualified, licensed
                lawyer. AdvocAI's <Link to="/lawyer-connect" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">Lawyer Connect</Link> feature
                exists specifically to help you find the right legal professional when you need one.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team / Company */}
      <section className="py-20 md:py-24 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-6">
            Built by a Small Team
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            AdvocAI is built by a small team focused on making legal help more accessible.
            We believe that understanding your legal documents shouldn't require a law degree
            or a expensive consultation — and that technology can bridge that gap without
            replacing the professionals who matter most.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-20 md:py-24 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground mb-6">
            Ready to simplify your legal documents?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start analyzing or creating documents today — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              <Link to="/document-analyser">Analyze a Document</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
