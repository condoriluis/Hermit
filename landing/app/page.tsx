import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import AppMockup from '@/components/AppMockup'
import Ejemplos from '@/components/Ejemplos'
import SkillsShowcase from '@/components/SkillsShowcase'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import CTA from '@/components/CTA'
import Footer from '@/components/Footer'
import VolverArriba from '@/components/VolverArriba'

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AppMockup />
        <Ejemplos />
        <SkillsShowcase />
        <Features />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <VolverArriba />
    </>
  )
}

