import React from 'react'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { GithubLogo } from '@/components/Icons'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg py-12 text-sm text-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-panel-2 border border-line flex items-center justify-center p-1">
              <Image src="/icon.svg" width={24} height={24} alt="Hermit" />
            </div>
            <div>
              <span className="font-extrabold text-text font-heading">Hermit</span>
              <span className="text-xs text-muted ml-2">por luchodev</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs font-medium">
            <a href="#demostracion" className="hover:text-text transition-colors">
              Cómo funciona
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
            <a
              href="https://github.com/condoriluis/Hermit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text transition-colors flex items-center gap-1.5 font-mono"
            >
              <GithubLogo className="w-3.5 h-3.5 text-accent" /> GitHub
            </a>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-line/40 text-center text-[11px] text-muted/70">
          Hermit es software libre para tu computadora. Los videos y textos generados son de tu total propiedad.
        </div>
      </div>
    </footer>
  )
}
