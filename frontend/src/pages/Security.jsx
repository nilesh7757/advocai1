"use client"

import { Shield, Lock, Key, Users, FileCheck, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import React from "react"

export default function Security() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-16 md:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 border border-border rounded-full text-xs font-medium text-muted-foreground mb-6">
            Security
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight text-foreground font-serif mb-6">
            How We Protect Your Data
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Security is foundational to AdvocAI. Here's how we keep your documents and information safe.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-12">
          {/* Authentication */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground mb-2">Authentication</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                AdvocAI uses JWT-based authentication with token blacklisting for secure session management. When you log out, your refresh token is immediately invalidated so it cannot be reused.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-foreground">Email/password sign-in</strong> with password hashing using Django's PBKDF2 algorithm with a SHA256 hash, iterated 320,000 times</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-foreground">Google OAuth sign-in</strong> — verify Google tokens server-side before issuing session tokens</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-foreground">Email verification via OTP</strong> — new accounts must verify their email with a 6-digit code (10-minute expiry) before gaining full access</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground mb-2">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                For additional security, you can enable two-factor authentication (2FA) on your account. When enabled, signing in requires both your password and a one-time code sent to your email.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>OTP codes are 6 digits and expire after 10 minutes</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>Can be enabled or disabled at any time from your <Link to="/profile?tab=security" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">Security settings</Link></span>
                </li>
              </ul>
            </div>
          </div>

          {/* Session Management */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground mb-2">Session Management</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You have full control over your active sessions. If you suspect unauthorized access, you can instantly log out of all other devices from your <Link to="/profile?tab=security" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">Security settings</Link>. This invalidates every other session by rotating your account's token version, forcing re-authentication on all devices.
              </p>
            </div>
          </div>

          {/* Data Storage */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground mb-2">Data Storage</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Your documents and account data are stored in MongoDB with encrypted connections using TLS certificates. File uploads — including profile photos, cover images, and document signatures — are handled through Cloudinary's secure hosting infrastructure with HTTPS delivery.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>MongoDB connections use TLS via CA certificates (certifi) for encrypted data transit</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>All file uploads are served over HTTPS via Cloudinary's CDN</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Document Access Control */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground mb-2">Document Access Control</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Your documents are private by default — only you can see them. Sharing requires your explicit action, and you control the level of access each person receives.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-foreground">Granular permissions</strong> — share with specific users as view-only or with edit access</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-foreground">Per-user access</strong> — each person's permission is tracked individually; you can revoke anyone's access at any time</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span><strong className="text-foreground">Owner-only control</strong> — only the document owner can change sharing permissions or remove access</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Account Security */}
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground mb-2">Account Security</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                We apply industry-standard protections to your account and credentials.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>Passwords are hashed using Django's PBKDF2 algorithm (SHA256, 320,000 iterations) — never stored in plain text</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>Built-in password validators enforce minimum length, common password checks, and numeric password prevention</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>You can delete your account and all associated data at any time from your <Link to="/profile?tab=danger" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">profile settings</Link></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Have a security concern?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you've found a vulnerability or have a security concern, please{" "}
            <Link to="/contact" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">
              contact us
            </Link>
            . We take all security reports seriously.
          </p>
        </div>
      </section>
    </div>
  )
}
