'use client'

import { useDiffStore } from '@/store/diff-store'
import { Button } from '@/components/ui/button'
import { ArrowUpRight } from 'lucide-react'

interface PRDetailsCardProps {
  onGenerate: () => void
  isGenerating: boolean
  onStop: () => void
}

export default function PRDetailsCard({
  onGenerate,
  isGenerating,
  onStop,
}: PRDetailsCardProps) {
  const selectedDiff = useDiffStore((state) => state.selectedDiff)

  if (!selectedDiff) {
    return (
      <div className="h-full">
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full justify-between">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
            PR Diff Details
          </h2>
        </div>
        <p className="text-muted-foreground">
          Select a pull request to view details.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full justify-between">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
          PR Diff Details
        </h2>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => window.open(selectedDiff.url, '_blank')}
        >
          <ArrowUpRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        <p className="break-words">
          <b>ID - </b> {selectedDiff.id}
        </p>
        <p className="break-words">
          <b>Description - </b> {selectedDiff.description}
        </p>
        <p className="break-words">
          <b>Labels - </b>{' '}
          {selectedDiff.labels.length > 0
            ? selectedDiff.labels.map((label) => label.name).join(', ')
            : 'no labels found'}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end mt-4">
        <Button
          className="w-full sm:w-auto"
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Release Notes'}
        </Button>
        {isGenerating && (
          <Button className="w-full sm:w-auto" onClick={onStop}>
            Stop
          </Button>
        )}
      </div>
    </div>
  )
}
