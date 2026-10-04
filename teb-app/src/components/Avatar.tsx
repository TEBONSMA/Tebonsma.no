import { initials } from '../auth/profile'
import { apiUrl } from '../lib/api'

interface AvatarProps {
  name: string
  // The member's own picture: a base64 JPEG from LLDAP
  image?: string | null
  // Other members' pictures: a path on the API
  path?: string | null
  className?: string
}

// Profile picture with the member's initials as fallback
const Avatar = ({ name, image, path, className = '' }: AvatarProps) => {
  const src = image ? `data:image/jpeg;base64,${image}` : path ? apiUrl(path) : null
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1f2937] font-bold text-white ${className}`}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </span>
  )
}

export default Avatar
