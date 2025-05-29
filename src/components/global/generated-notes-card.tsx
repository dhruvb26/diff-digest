import ReactMarkdown from 'react-markdown'

interface GeneratedNotesCardProps {
  generatedNotes: string
}

export default function GeneratedNotesCard({
  generatedNotes,
}: GeneratedNotesCardProps) {
  const isError = generatedNotes.startsWith('### Error')

  return (
    <div className="border border-border rounded-lg p-6 bg-card min-w-full max-w-full">
      <div className="flex gap-2 items-center justify-between">
        <h2 className="text-xl font-semibold mb-4">Generated Release Notes</h2>
      </div>
      {generatedNotes ? (
        <div
          className={`prose prose-sm dark:prose-invert whitespace-pre-wrap max-w-none break-words ${isError ? 'text-red-600 dark:text-red-400' : ''}`}
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
