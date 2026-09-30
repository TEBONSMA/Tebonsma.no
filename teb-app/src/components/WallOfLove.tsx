import { Quote } from 'lucide-react'
import SectionHeader from './SectionHeader'
import { testimonials } from '../lib/testimonials'

const WallOfLove = () => {
  return (
    <div className="w-full max-w-7xl mx-auto py-20 px-4">
      <SectionHeader
        eyebrow="Vitnesbyrd"
        title="Wall of Love"
        subtitle="Hør fra de som kjenner oss best!"
        className="mb-16"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <figure
            key={testimonial.name}
            className="flex flex-col border border-white/10 rounded-lg bg-white/[0.02] p-6 hover:border-white/20 transition-colors"
          >
            <Quote className="w-5 h-5 text-teb-orange/60 mb-3" />
            <blockquote className="text-sm text-white/80 leading-relaxed flex-1">
              {testimonial.quote}
            </blockquote>
            <figcaption className="flex items-center gap-3 mt-5">
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-9 h-9 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-white">{testimonial.name}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

export default WallOfLove
