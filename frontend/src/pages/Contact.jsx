"use client"

import { Mail, MessageSquare } from "lucide-react"
import React from "react"

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 border border-border rounded-full text-xs font-medium text-muted-foreground mb-6">
            Contact
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-foreground font-serif mb-6">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Have a question, suggestion, or need help? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-foreground mb-1">Email</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For general inquiries, reach us at{" "}
                  <a href="mailto:hello@advocai.com" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">
                    hello@advocai.com
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-foreground mb-1">Feedback</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Found a bug or have a feature request? Let us know at{" "}
                  <a href="mailto:feedback@advocai.com" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">
                    feedback@advocai.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
