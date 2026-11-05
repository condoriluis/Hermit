'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [osName, setOsName] = useState('Windows')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase()
      if (userAgent.includes('mac')) setOsName('Mac')
      else if (userAgent.includes('linux')) setOsName('Linux')
      else setOsName('Windows')
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-bg/85 backdrop-blur-md border-b border-line py-3.5 shadow-card'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-panel-2 border border-line flex items-center justify-center p-1.5 shadow-inner transition-transform group-hover:scale-105 group-hover:border-accent">
              <Image
                src="/icon.svg"
                alt="Hermit Logo"
                width={28}
                height={28}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-text font-heading">
                Hermit
              </span>
              <span className="text-[11px] text-muted -mt-0.5 font-medium">por luchodev</span>
            </div>
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <a href="#demostracion" className="hover:text-text transition-colors">
              Cómo funciona
            </a>
            <a href="#ejemplos" className="hover:text-text transition-colors">
              Ejemplos
            </a>
            <a href="#herramientas" className="hover:text-text transition-colors">
              Herramientas
            </a>
            <a href="#beneficios" className="hover:text-text transition-colors">
              Beneficios
            </a>
            <a href="#apoyo" className="hover:text-text transition-colors">
              Apoyo
            </a>
            <a href="#faq" className="hover:text-text transition-colors">
              Preguntas
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#descargar"
              className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-on-solid font-bold text-sm font-heading transition-all shadow-glow hover:shadow-lg active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar para {osName}</span>
            </a>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg bg-panel border border-line text-text"
              aria-label="Abrir menú"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-accent" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="md:hidden mt-3 p-4 rounded-2xl bg-panel border border-line shadow-card flex flex-col gap-3 animate-fade-in">
            <a
              href="#demostracion"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-text hover:bg-panel-2 text-sm"
            >
              Cómo funciona
            </a>
            <a
              href="#ejemplos"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-text hover:bg-panel-2 text-sm"
            >
              Ejemplos
            </a>
            <a
              href="#herramientas"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-text hover:bg-panel-2 text-sm"
            >
              Herramientas
            </a>
            <a
              href="#beneficios"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-text hover:bg-panel-2 text-sm"
            >
              Beneficios
            </a>
            <a
              href="#apoyo"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-text hover:bg-panel-2 text-sm"
            >
              Apoyo
            </a>
            <a
              href="#faq"
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg text-text hover:bg-panel-2 text-sm"
            >
              Preguntas
            </a>
            <hr className="border-line my-1" />
            <a
              href="#descargar"
              onClick={() => setMobileOpen(false)}
              className="w-full text-center py-3 rounded-xl bg-accent text-on-solid font-bold text-sm flex items-center justify-center gap-2 font-heading"
            >
              <Download className="w-4 h-4" />
              Descargar para {osName}
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}
