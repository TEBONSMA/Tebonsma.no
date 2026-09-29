import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { DayPicker, type DayButtonProps } from 'react-day-picker'
import { nb } from 'date-fns/locale'

const BookedDayButton = ({ modifiers, className, children, ...props }: DayButtonProps) => {
  const isBooked = !modifiers.disabled && !modifiers.outside

  return (
    <button
      {...props}
      className={`${className} relative group`}
    >
      {children}
      {isBooked && (
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/90 rounded-lg">
          <span className="font-mono text-xs uppercase tracking-wider text-white/50">Opptatt</span>
        </span>
      )}
    </button>
  )
}

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false)

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setShowTimeSlotModal(true)
    }
  }

  // Generate time slots from 09:00 to 17:00
  const timeSlots = []
  for (let hour = 9; hour <= 17; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 17) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }

  return (
    <>
      <DayPicker
        mode="single"
        locale={nb}
        selected={selectedDate ?? undefined}
        onSelect={handleSelect}
        disabled={{ before: new Date() }}
        showOutsideDays
        className="mx-auto w-full max-w-md text-white"
        classNames={{
          months: 'relative',
          month: 'space-y-4',
          month_caption: 'flex items-center justify-center h-10',
          caption_label: 'text-lg font-semibold text-white',
          nav: 'flex items-center justify-between absolute inset-x-0 top-0 h-10',
          button_previous: 'p-2 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none',
          button_next: 'p-2 rounded-md text-white/50 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none',
          chevron: 'w-5 h-5 fill-current',
          month_grid: 'w-full border-collapse mt-4',
          weekday: 'font-mono text-xs uppercase tracking-wider text-white/40 font-normal pb-3',
          day: 'p-1.5 text-center',
          day_button: 'w-full aspect-square max-w-14 rounded-lg text-lg font-medium mx-auto flex items-center justify-center bg-white/5 border border-white/10 text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 cursor-pointer',
          disabled: 'bg-transparent border-transparent text-white/20 cursor-not-allowed hover:bg-transparent hover:border-transparent',
          outside: 'text-white/20 border-transparent bg-transparent',
          today: 'ring-1 ring-teb-orange/50',
          selected: '',
        }}
        components={{ DayButton: BookedDayButton }}
      />

      {/* Time Slot Modal */}
      <AnimatePresence>
        {showTimeSlotModal && selectedDate && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTimeSlotModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90%] max-w-sm"
            >
              <div className="bg-neutral-900 rounded-lg border border-white/10 overflow-hidden">
                {/* Modal Header */}
                <div className="border-b border-white/10 p-5 relative">
                  <button
                    onClick={() => setShowTimeSlotModal(false)}
                    className="absolute top-3 right-3 text-white/50 hover:text-white hover:bg-white/5 rounded-md p-1.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h3 className="text-lg font-semibold text-white">Velg tidspunkt</h3>
                  <p className="text-white/50 text-sm mt-1">
                    {selectedDate.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Time Slots */}
                <div className="p-5 max-h-[320px] overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        disabled
                        className="bg-white/5 text-white/40 border border-white/10 rounded-md py-2 text-xs font-medium cursor-not-allowed relative group"
                      >
                        <span>{time}</span>
                        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900/90 rounded-md">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">Opptatt</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Message */}
                  <div className="mt-5 p-3 bg-white/5 border border-white/10 rounded-md">
                    <p className="text-white/70 text-xs text-center font-medium">
                      Alle tidspunkter er fullbooket
                    </p>
                    <p className="text-white/40 text-xs text-center mt-1">
                      Kontakt oss på eivind@tebonsma.no for å finne en ledig time
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Unavailable Message */}
      <div className="space-y-3 pt-4 border-t border-white/10 text-center">
        <div className="space-y-1">
          <p className="text-white/70 text-sm font-medium">Alle datoer er for øyeblikket opptatt</p>
          <p className="text-white/40 text-xs">Vennligst kontakt meg direkte på eivind@tebonsma.no for å finne en ledig time</p>
        </div>
        <button
          disabled
          className="w-full max-w-xs mx-auto block bg-white/5 text-white/30 border border-white/10 font-medium text-sm py-2.5 px-6 rounded-md cursor-not-allowed"
        >
          Ingen ledige timer tilgjengelig
        </button>
      </div>
    </>
  )
}

export default Calendar
