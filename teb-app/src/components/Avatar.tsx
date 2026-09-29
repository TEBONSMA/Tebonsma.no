import { initials } from '../auth/profile'

// Profile picture (a base64 JPEG from LLDAP) with the member's initials as fallback
const Avatar = ({ name, image, className = '' }: { name: string; image?: string | null; className?: string }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1f2937] font-bold text-white ${className}`}
    aria-hidden="true"
  >
    {image ? <img src={`data:image/jpeg;base64,${image}`} alt="" className="h-full w-full object-cover" /> : initials(name)}
  </span>
)

export default Avatar
