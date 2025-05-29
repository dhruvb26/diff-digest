import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import ThinkingText from './thinking-text'

interface GeneratedNotesCardProps {
  generatedNotes: string
  isWaiting?: boolean
}

export default function GeneratedNotesCard({
  generatedNotes,
  isWaiting = false,
}: GeneratedNotesCardProps) {
  const isError = generatedNotes.includes('Error')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedNotes)
      toast.success('Copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <div className="border border-border rounded-lg p-6 bg-card min-w-full max-w-full">
      <div className="flex gap-2 items-center justify-between">
        <h2 className="text-xl font-semibold mb-4">Generated Release Notes</h2>
        {generatedNotes && !isError && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="mb-4"
          >
            <Copy className="size-4" />
          </Button>
        )}
      </div>
      {isWaiting ? (
        <div className="flex justify-center items-center py-8">
          <ThinkingText />
        </div>
      ) : generatedNotes ? (
        <div
          className={`prose prose-sm dark:prose-invert whitespace-pre-wrap max-w-none break-words ${isError ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}
        >
          <ReactMarkdown
            components={{
              code: function Code({ children }) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-sm">
                    {children}
                  </code>
                )
              },
            }}
          >
            {generatedNotes}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="text-muted-foreground">No generated notes yet.</p>
      )}
    </div>
  )
}
