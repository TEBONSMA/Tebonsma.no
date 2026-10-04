import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SectionHeader from '../SectionHeader'
import PostCard from './PostCard'
import { usePosts } from './usePosts'

const SHOWN = 3

// The newest posts, for the front page. Visitors only get the public ones, and nothing is
// shown when there are none.
const FeedPreview = () => {
  const { posts, change, remove } = usePosts('new', SHOWN)
  if (!posts || posts.length === 0) return null

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <SectionHeader eyebrow="Feed" title="Siste fra medlemmene" subtitle="Nytt fra gjengen, rett fra kilden." />
      <div className="space-y-6">
        {posts.map(post => (
          <PostCard key={post.id} post={post} onChange={change} onDelete={remove} />
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        <Link
          to="/feed"
          className="inline-flex items-center gap-2 rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:border-white/40 transition-colors"
        >
          Se alle innlegg
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export default FeedPreview
