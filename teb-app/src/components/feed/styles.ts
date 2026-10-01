// Shared looks for the feed, matching the cards and buttons on the account page
export const CARD = 'rounded-lg border border-white/10 bg-white/[0.03]'
export const INPUT =
  'w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-teb-orange'
const BUTTON =
  'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
export const BUTTON_PRIMARY = `${BUTTON} bg-teb-orange text-white hover:bg-teb-orange-light`
export const BUTTON_GHOST = `${BUTTON} border border-white/10 text-white/80 hover:border-white/20 hover:text-white`
export const BUTTON_DANGER = `${BUTTON} border border-red-400/30 text-red-300 hover:border-red-400/60 hover:text-red-200`
// The row of small actions under a post or comment
export const ACTION =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-white/60 cursor-pointer transition-colors hover:bg-white/5 hover:text-white disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-white/60'
export const MENU =
  'absolute z-20 rounded-lg p-1 bg-neutral-950/95 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)]'
export const MENU_ITEM =
  'flex w-full items-center gap-2 py-2 px-3 text-sm font-medium text-white/80 rounded-md cursor-pointer transition-colors hover:bg-white/10 hover:text-white'
export const ERROR_TEXT = 'text-sm text-red-300'
