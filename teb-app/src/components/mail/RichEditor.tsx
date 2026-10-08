import { useRef } from 'react'
import { EditorContent, type Editor, Node, mergeAttributes, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote, RemoveFormatting, Strikethrough, Underline, type LucideIcon } from 'lucide-react'
import { apiFetchBlob } from '../../lib/api'
import { uploadMailFile } from '../../lib/mail'
import { cn } from '../../lib/utils'

interface RichEditorProps {
  // What the editor starts with. Later changes go out through onChange, not back in here.
  initialHtml: string
  onChange: (html: string) => void
  // Without a frame, filling the space it is given, with the formatting buttons under the text and only when asked for
  bare?: boolean
  showToolbar?: boolean
  // Lets pictures be pasted or dropped into the text; they are uploaded with this login
  token?: string
}

const MAX_PICTURE_BYTES = 10 * 1024 * 1024
const PICTURE = /^image\/(png|jpe?g|gif|webp)$/

// Where each uploaded picture can be shown from while the mail is written
const shown = new Map<string, string>()

// A picture in the text. In the mail it is <img src="cid:upload-id">, which the API sends along
// as part of the mail; here it is shown from the upload itself.
const createPicture = (token: string) =>
  Node.create({
    name: 'picture',
    group: 'block',
    atom: true,
    draggable: true,
    addAttributes: () => ({ id: { default: '' } }),
    parseHTML: () => [
      {
        tag: 'img[src^="cid:"]',
        getAttrs: el => ({ id: (el as HTMLElement).getAttribute('src')!.slice(4) }),
      },
    ],
    renderHTML: ({ HTMLAttributes }) => ['img', mergeAttributes({ src: `cid:${HTMLAttributes.id}`, alt: '' })],
    addNodeView:
      () =>
      ({ node }) => {
        const img = document.createElement('img')
        img.alt = ''
        img.className = 'my-2 block max-h-96 max-w-full rounded-md'
        const id = node.attrs.id as string
        const known = shown.get(id)
        if (known) img.src = known
        else
          apiFetchBlob(`/mail/uploads/${id}`, token)
            .then(blob => {
              const url = URL.createObjectURL(blob)
              shown.set(id, url)
              img.src = url
            })
            .catch(() => {})
        return { dom: img }
      },
  })

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
const RichEditor = ({ initialHtml, onChange, bare = false, showToolbar = true, token }: RichEditorProps) => {
  const addPictures = (files: File[]) => {
    for (const file of files) {
      if (file.size > MAX_PICTURE_BYTES) {
        window.alert(`Bildet «${file.name}» er større enn 10 MB`)
        continue
      }
      uploadMailFile(token!, file)
        .then(upload => {
          shown.set(upload.id, URL.createObjectURL(file))
          editorRef.current?.chain().focus().insertContent({ type: 'picture', attrs: { id: upload.id } }).run()
        })
        .catch(err => window.alert(err instanceof Error ? err.message : 'Kunne ikke laste opp bildet'))
    }
  }
  const editorRef = useRef<Editor | null>(null)

  const editor = useEditor({
    extensions: [
      ...(token ? [createPicture(token)] : []),
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
    onCreate: ({ editor: created }) => {
      editorRef.current = created
    },
    onUpdate: ({ editor: updated }) => onChange(updated.getHTML()),
    editorProps: {
      handlePaste: (_view, event) => {
        const pictures = [...(event.clipboardData?.files ?? [])].filter(f => PICTURE.test(f.type))
        if (!token || pictures.length === 0) return false
        addPictures(pictures)
        return true
      },
      handleDrop: (_view, event) => {
        const pictures = [...(event.dataTransfer?.files ?? [])].filter(f => PICTURE.test(f.type))
        if (!token || pictures.length === 0) return false
        addPictures(pictures)
        return true
      },
      attributes: {
        'aria-label': 'Innhold i mailen',
        class: `${bare ? 'min-h-40 px-4 py-3' : 'min-h-48 max-h-[50vh] overflow-y-auto px-3 py-2'} text-sm text-white outline-none [&_a]:text-teb-orange [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-3 [&_blockquote]:text-white/60 [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5`,
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

  if (!editor || !active) return <div className={bare ? 'min-h-40 flex-1' : 'min-h-48 rounded-md border border-white/10 bg-white/5'} />

  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Adressen lenken skal gå til', previous ?? 'https://')
    if (url === null) return
    if (url.trim() === '') editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  const toolbar = (
    <div role="toolbar" aria-label="Formatering" className={cn('flex flex-wrap gap-0.5 p-1', bare ? 'border-t border-white/10 px-3' : 'border-b border-white/10')}>
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
  )

  if (bare) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto" onClick={() => editor.chain().focus().run()}>
          <EditorContent editor={editor} />
        </div>
        {showToolbar && toolbar}
      </div>
    )
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/5 focus-within:border-teb-orange">
      {showToolbar && toolbar}
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichEditor
