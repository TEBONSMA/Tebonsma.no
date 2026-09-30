import { useEffect } from 'react'
import Layout from '../components/Layout'
import Badge from '../components/Badge'
import SectionHeader from '../components/SectionHeader'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import Calendar from '../components/Calendar'
import Tag from '../components/Tag'
import Reveal from '../components/Reveal'

const Contact = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);
  return (
    <Layout mainClassName="flex flex-col items-center p-8 pt-24 space-y-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-4 mb-4">
          <Badge>Ta kontakt</Badge>
          <h1 className="text-6xl md:text-8xl font-bold text-teb-orange tracking-tight">
            KONTAKT
          </h1>
        </div>

        {/* Doctor Appointment Booking Section */}
        <Reveal className="w-full max-w-4xl mt-8">
          <SectionHeader title="Book din legetime" />

          <SpotlightCard
            className="hover:border-white/20 transition-colors duration-300"
            spotlightColor="rgba(255, 140, 66, 0.25)"
          >
            <div className="space-y-6">
              {/* Doctor Info with Image */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <img
                  src="images/contact/dreivind.jpg"
                  alt="Doctor"
                  className="w-full md:w-48 h-48 object-cover rounded-lg border border-white/10"
                />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-teb-orange">Dr. Bingo</h3>
                    <span className="font-mono text-xs uppercase tracking-wider text-white/50">(Tann)Lege</span>
                  </div>
                  <p className="text-white/70">Spesialist i problemer med mage og tarmutleggelse</p>
                  <div className="space-y-1 text-sm text-white/60">
                    <p><span className="font-mono text-xs uppercase tracking-wider text-white/40">Tilgjengelig</span> — Man-Søn</p>
                    <p><span className="font-mono text-xs uppercase tracking-wider text-white/40">Tidspunkt</span> — 09:00 - 17:00</p>
                    <p><span className="font-mono text-xs uppercase tracking-wider text-white/40">Lokasjon</span> — Jeg kommer til deg</p>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <Calendar />
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Cybersecurity Phone Section */}
        <Reveal className="w-full max-w-4xl">
          <SectionHeader title="Cybersikkerhetstelefonen" />

          <SpotlightCard
            className="hover:border-white/20 transition-colors duration-300"
            spotlightColor="rgba(140, 255, 66, 0.25)"
          >
            <div className="space-y-6">
              {/* Cybersecurity Info with Image */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <img
                  src="images/contact/hacker.png"
                  alt="Cybersecurity"
                  className="w-full md:w-48 h-48 object-cover rounded-lg border border-white/10"
                />
                <div className="flex-1 space-y-3">
                  <h3 className="text-2xl font-bold text-teb-green">24/7 Cybersikkerhet</h3>
                  <p className="text-white/70">Trenger du hjelp med cybersikkerhet? Ring vår dedikerte hotline for øyeblikkelig assistanse.</p>
                  <div className="space-y-1 text-sm text-white/60">
                    <p><span className="font-mono text-xs uppercase tracking-wider text-white/40">Tilgjengelig</span> — 24/7</p>
                    <p><span className="font-mono text-xs uppercase tracking-wider text-white/40">Tjenester</span> — Sikkerhetsrådgivning, Incident Response</p>
                    <p><span className="font-mono text-xs uppercase tracking-wider text-white/40">Responstid</span> — Umiddelbar</p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="text-center space-y-2">
                  <p className="text-teb-green font-semibold text-lg">Beskyttelse hele døgnet</p>
                  <p className="text-white/60 text-sm">Ring oss nå for profesjonell cybersikkerhetshjelp</p>
                </div>
                <a
                  href="tel:+6767676967"
                  className="w-full bg-teb-green hover:bg-teb-green-light text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Ring +67 67 67 69 67
                </a>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* DJ Booking Section */}
        <Reveal className="w-full max-w-4xl">
          <SectionHeader title="Book en DJ" />

          <SpotlightCard
            className="hover:border-white/20 transition-colors duration-300"
            spotlightColor="rgba(255, 140, 66, 0.25)"
          >
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-teb-orange mb-2">Våre DJs</h3>
                <p className="text-white/70">Book en av våre profesjonelle DJs til ditt arrangement:</p>
              </div>

              {/* DJs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gjøran */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <img
                      src="images/contact/DJGjøran.png"
                      alt="DJ Gjøran"
                      className="w-20 h-20 rounded-full object-cover border border-white/10"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white">DJ Gjøran</h4>
                      <p className="text-sm text-white/60">Techno & Algdat</p>
                      <div className="flex gap-2 mt-2">
                        <Tag>Erfaren</Tag>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Johann */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <img
                      src="images/contact/DJJohann.png"
                      alt="DJ Johann"
                      className="w-20 h-20 rounded-full object-cover border border-white/10"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white">DJ Johann</h4>
                      <p className="text-sm text-white/60">House & mer House</p>
                      <div className="flex gap-2 mt-2">
                        <Tag>Energisk</Tag>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remi */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <img
                      src="images/contact/DJRemi.png"
                      alt="DJ Remi"
                      className="w-20 h-20 rounded-full object-cover border border-white/10"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white">DJ Remi</h4>
                      <p className="text-sm text-white/60">UKG & stutter House</p>
                      <div className="flex gap-2 mt-2">
                        <Tag>Smooth</Tag>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kris */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <img
                      src="images/contact/DJKris.png"
                      alt="DJ Kris"
                      className="w-20 h-20 rounded-full object-cover border border-white/10"
                    />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white">DJ Kris</h4>
                      <p className="text-sm text-white/60">Pop-musikk og danseband</p>
                      <div className="flex gap-2 mt-2">
                        <Tag>Festlig</Tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="text-center space-y-2">
                  <p className="text-teb-orange font-semibold text-lg">Profesjonell DJ-service</p>
                  <p className="text-white/60 text-sm">Kontakt oss for tilgjengelighet og priser</p>
                </div>
                <a
                  href="mailto:post@tebonsma.no?subject=DJ Booking TEBONSMA"
                  className="w-full bg-teb-orange hover:bg-teb-orange-light text-white font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send forespørsel
                </a>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>
    </Layout>
  )
}

export default Contact