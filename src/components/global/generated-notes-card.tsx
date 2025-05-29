import ReactMarkdown from 'react-markdown'

interface GeneratedNotesCardProps {
  generatedNotes: string
}
export default function GeneratedNotesCard({
  generatedNotes,
}: GeneratedNotesCardProps) {
  return (
    <div className="border border-border rounded-lg p-6 bg-card min-w-full max-w-full">
      <div className="flex gap-2 items-center justify-between">
        <h2 className="text-xl font-semibold mb-4">Generated Release Notes</h2>
      </div>
      {generatedNotes ? (
        <div className="prose prose-sm dark:prose-invert whitespace-pre-wrap max-w-none break-words">
          <ReactMarkdown>{generatedNotes}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-muted-foreground">No generated notes yet.</p>
      )}
    </div>
  )
}
