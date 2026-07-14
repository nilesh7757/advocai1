"use client"

import { Send } from "lucide-react"
import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "../api/axios"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"

export default function Contact() {
  const { user, isAuthenticated } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }))
    }
  }, [isAuthenticated, user])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "Name is required."
    if (!formData.email.trim()) {
      newErrors.email = "Email is required."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address."
    }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required."
    if (!formData.message.trim()) newErrors.message = "Message is required."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error("Please fix the errors in the form.")
      return
    }
    setLoading(true)
    setErrors({})
    try {
      const res = await axios.post("api/utils/contact/", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      })
      toast.success(res.data.message || "Message sent!")
      setFormData({ name: "", email: "", subject: "", message: "" })
      if (isAuthenticated && user) {
        setFormData({
          name: user.name || "",
          email: user.email || "",
          subject: "",
          message: "",
        })
      }
    } catch (error) {
      if (error.response) {
        const data = error.response.data
        if (typeof data === "object" && !data.error) {
          const msgs = Object.values(data).flat().join(" ")
          toast.error(msgs)
        } else {
          toast.error(data.error || "Failed to send message. Please try again.")
        }
      } else if (error.request) {
        toast.error("Unable to connect to server. Please check your internet connection.")
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) =>
    `w-full px-4 py-3 bg-background border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
      errors[field] ? "border-red-500" : "border-input"
    }`

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
            Have a question, suggestion, or need help? Fill out the form below and we'll get back to you.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-border">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
                className={inputClass("name")}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className={inputClass("email")}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-foreground">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                placeholder="What is this about?"
                value={formData.subject}
                onChange={handleInputChange}
                disabled={loading}
                className={inputClass("subject")}
              />
              {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-foreground">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Tell us more..."
                value={formData.message}
                onChange={handleInputChange}
                disabled={loading}
                className={`${inputClass("message")} resize-none`}
              />
              {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Message
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            We typically respond within 1–2 business days.
          </p>

          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link to="/" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
              Back to Home
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
