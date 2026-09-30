import { useEffect } from 'react';
import Layout from '../components/Layout';
import Badge from '../components/Badge';
import SectionHeader from '../components/SectionHeader';
import MembersGrid from '../components/MembersGrid';
import Reveal from '../components/Reveal';

const About =() => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);
  return (
    <Layout mainClassName="flex flex-col items-center p-8 pt-24">
        {/* About Section */}
        <div className="max-w-6xl w-full mb-16 mt-8">
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-4 max-w-4xl mx-auto mb-4">
              <Badge>Hvem er vi?</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mx-auto max-w-5xl">
              Vi bringer ærlighet og transparens til vennskap og sosiale arrangementer
            </h1>
            <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-3xl mx-auto">
              TEBONSMA ble grunnlagt i 2021 og har siden den gang vært en eksklusiv organisasjon dedikert til å skape uforglemmelige øyeblikk og sterke bånd mellom medlemmene våre.
            </p>
            
            <Reveal className="pt-4 space-y-4 text-white/80">
              <p className="leading-relaxed">
                Det startet som en gruppe venner som ville formalisere vennskapet med faste tradisjoner: Pulebord, Nyttårsfeiring og den årlige Sommerfesten. Ni medlemmer, hver med sin egen rolle og personlighet, som tar vare på hverandre og finner enhver unnskyldning til å feire.
              </p>
              <p className="leading-relaxed">
                Medlemskapet holdes eksklusivt for å bevare en tett atmosfære, men under Sommerfesten åpner vi dørene for venner og kjente. Og uansett anledning: vi er stolte ambassadører for Jarritos.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Members Section */}
        <Reveal className="w-full">
          <SectionHeader title="Møt våre medlemmer" />
          <MembersGrid />
        </Reveal>
    </Layout>
  );
};

export default About;