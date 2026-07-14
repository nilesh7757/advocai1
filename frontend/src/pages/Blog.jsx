"use client"

import { BookOpen } from "lucide-react"
import { Link } from "react-router-dom"
import React from "react"

export default function Blog() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 border border-border rounded-full text-xs font-medium text-muted-foreground mb-6">
            Blog
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-foreground font-serif mb-6">
            AdvocAI Blog
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Insights on legal tech, document management, and AI.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Coming Soon</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-8">
            We're working on our first posts. Check back soon for updates on legal tech, product news, and tips for managing your documents.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium text-sm transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  )
}
