import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote, RemoveFormatting, Strikethrough, Underline, type LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface RichEditorProps {
  // What the editor starts with. Later changes go out through onChange, not back in here.
  initialHtml: string
  onChange: (html: string) => void
}

interface ToolProps {
  label: string
  icon: LucideIcon
  active?: boolean
  onClick: () => void
}

const Tool = ({ label, icon: Icon, active, onClick }: ToolProps) => (
  <button
    type="button"
    // Keeps the selection in the text while the button is pressed
    onMouseDown={e => e.preventDefault()}
    onClick={onClick}
    aria-label={label}
    title={label}
    aria-pressed={active}
    className={cn(
      'rounded p-1.5 cursor-pointer transition-colors',
      active ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white',
    )}
  >
    <Icon size={16} aria-hidden="true" />
  </button>
)

// Mail is written with simple formatting only: what the API lets through when the mail is sent
const RichEditor = ({ initialHtml, onChange }: RichEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        // Nothing the API would remove again
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto'] },
      }),
    ],
    content: initialHtml,
    onUpdate: ({ editor: updated }) => onChange(updated.getHTML()),
    editorProps: {
      attributes: {
        'aria-label': 'Innhold i mailen',
        class: 'min-h-48 max-h-[50vh] overflow-y-auto px-3 py-2 text-sm text-white outline-none [&_a]:text-teb-orange [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3 [&_blockquote]:text-white/60 [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5',
      },
    },
  })

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: !!current?.isActive('bold'),
      italic: !!current?.isActive('italic'),
      underline: !!current?.isActive('underline'),
      strike: !!current?.isActive('strike'),
      bullet: !!current?.isActive('bulletList'),
      ordered: !!current?.isActive('orderedList'),
      quote: !!current?.isActive('blockquote'),
      heading: !!current?.isActive('heading'),
      link: !!current?.isActive('link'),
    }),
  })

  if (!editor || !active) return <div className="min-h-48 rounded-md border border-white/10 bg-white/5" />

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Adressen lenken skal gå til', previous ?? 'https://')
    if (url === null) return
    if (url.trim() === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/5 focus-within:border-teb-orange">
      <div role="toolbar" aria-label="Formatering" className="flex flex-wrap gap-0.5 border-b border-white/10 p-1">
        <Tool label="Fet" icon={Bold} active={active.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
        <Tool label="Kursiv" icon={Italic} active={active.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <Tool label="Understreket" icon={Underline} active={active.underline} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <Tool label="Gjennomstreket" icon={Strikethrough} active={active.strike} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <Tool label="Overskrift" icon={Heading2} active={active.heading} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <Tool label="Punktliste" icon={List} active={active.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <Tool label="Nummerert liste" icon={ListOrdered} active={active.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <Tool label="Sitat" icon={Quote} active={active.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <Tool label="Lenke" icon={Link2} active={active.link} onClick={setLink} />
        <Tool label="Fjern formatering" icon={RemoveFormatting} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichEditor
