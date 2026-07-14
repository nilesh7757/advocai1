"use client"

import React from "react"

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 border border-border rounded-full text-xs font-medium text-muted-foreground mb-6">
            Legal
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-foreground font-serif mb-6">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: January 2025</p>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Information We Collect</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect information you provide directly, such as your name, email address, and phone number when you create an account. We also collect documents you upload for analysis and any content you generate through our tools.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">How We Use Your Information</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use your information to provide and improve our services, process your documents, communicate with you, and ensure the security of our platform. We do not sell your personal information to third parties.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Document Privacy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your documents are private and encrypted. We do not use your documents to train AI models or for any purpose other than providing the service you requested. You can delete your documents and account at any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Data Security</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including encryption at rest and in transit, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Cookies</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We use essential cookies to maintain your session and preferences. We do not use tracking cookies or third-party analytics that compromise your privacy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Your Rights</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have the right to access, correct, or delete your personal information. You can export your data or request account deletion through your account settings or by contacting us.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold font-serif text-foreground mb-3">Contact</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For privacy-related questions, contact us at{" "}
              <a href="mailto:privacy@advocai.com" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">
                privacy@advocai.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
