"use client"

import { Check, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import React from "react"

const features = [
  "AI-powered document analysis with risk scoring",
  "Conversational document generation",
  "Document version history with diff comparison",
  "Secure e-signatures",
  "Document sharing with view/edit permissions",
  "Lawyer Connect — find verified legal professionals",
  "Threaded comments with @mentions",
  "Tagged session history",
]

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 border border-border rounded-full text-xs font-medium text-muted-foreground mb-6">
            Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-foreground font-serif mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            AdvocAI is currently free to use during beta. Everything you see is included — no hidden fees, no paywalls.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-lg mx-auto">
          <div className="border border-border rounded-xl bg-card p-8">
            <div className="text-xs font-bold text-primary mb-2">Currently Free</div>
            <h2 className="text-2xl font-bold font-serif text-foreground">During Beta</h2>
            <div className="mt-4 mb-2">
              <span className="text-4xl font-bold text-foreground">₹0</span>
              <span className="text-sm text-muted-foreground ml-2">Free during beta</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Full access to all current features while we build and improve AdvocAI.
            </p>
            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium text-sm transition-colors"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-16 md:pb-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto text-center">
          <p className="text-sm text-muted-foreground leading-relaxed">
            AdvocAI is currently free to use. We may introduce paid plans in the future as we add more advanced features, but all current functionality will remain accessible.
          </p>
        </div>
      </section>
    </div>
  )
}
