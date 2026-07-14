"use client"

import React from "react"

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 border border-border rounded-full text-xs font-medium text-muted-foreground mb-6">
            Legal
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-foreground font-serif mb-6">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By accessing or using AdvocAI, you agree to these Terms of Service. If you do not agree, do not use the service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Description of Service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AdvocAI provides AI-powered tools for legal document analysis, generation, and management. We also facilitate connections between users and legal professionals. Our services are not a substitute for professional legal advice.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">User Accounts</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information when creating an account.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Acceptable Use</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You agree not to use AdvocAI for any unlawful purpose, to attempt to gain unauthorized access to any part of the service, or to interfere with or disrupt the service or servers.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Intellectual Property</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You retain ownership of documents you upload and create. AdvocAI retains ownership of the platform, AI models, and underlying technology.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AdvocAI is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to direct, indirect, incidental, or consequential damages.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Termination</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may suspend or terminate your access to AdvocAI at any time for conduct that we determine violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Changes to Terms</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page with a revised date.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
