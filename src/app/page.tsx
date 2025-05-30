'use client' // Mark as a Client Component

import { useState, useEffect } from 'react'
import { DiffItem, ApiResponse } from '@/types/global'
import { useDiffStore } from '@/store/diff-store'
import { formSchema } from '@/types/schemas'
import { z } from 'zod'
import Image from 'next/image'
import PRDetailsCard from '@/components/global/pr-details-card'
import GeneratedNotesCard from '@/components/global/generated-notes-card'
import { tryCatch } from '@/utils/try-catch'
import RepoForm from '@/components/global/repo-form'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [diffs, setDiffs] = useState<DiffItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [initialFetchDone, setInitialFetchDone] = useState<boolean>(false)
  const { setSelectedDiff } = useDiffStore()
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedNotes, setGeneratedNotes] = useState<string>('')
  const selectedDiff = useDiffStore((state) => state.selectedDiff)
  const [formValues, setFormValues] = useState<z.infer<typeof formSchema>>({
    repo: 'openai-node',
    owner: 'openai',
  })

  const fetchDiffs = async (
    page: number,
    values: z.infer<typeof formSchema>
  ) => {
    setIsLoading(true)
    setError(null)

    const result = await tryCatch(
      fetch(
        `/api/sample-diffs?page=${page}&per_page=10&repo=${values.repo}&owner=${values.owner}`
      ).then(async (response) => {
        if (!response.ok) {
          let errorMsg = `HTTP error! status: ${response.status}`
          try {
            const errorData = await response.json()
            errorMsg = errorData.error || errorData.details || errorMsg
          } catch {
            console.warn('Failed to parse error response as JSON')
          }
          throw new Error(errorMsg)
        }
        return response.json()
      })
    )

    if (result.error) {
      setError(result.error.message)
    } else {
      const data = result.data as ApiResponse
      setDiffs((prevDiffs) =>
        page === 1 ? data.diffs : [...prevDiffs, ...data.diffs]
      )
      setNextPage(data.nextPage)
      if (!initialFetchDone) setInitialFetchDone(true)
    }

    setIsLoading(false)
  }

  const handleFetchClick = (values: z.infer<typeof formSchema>) => {
    setFormValues(values)
    setDiffs([]) // Clear existing diffs when fetching the first page again
    fetchDiffs(1, values)
  }

  const handleLoadMoreClick = () => {
    if (nextPage) {
      fetchDiffs(nextPage, formValues)
    }
  }

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered', registration)
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'getState' })
        }
      })
      navigator.serviceWorker.addEventListener('message', (event) => {
        const data = event.data
        if (!data || typeof data !== 'object') return
        switch (data.type) {
          case 'state':
            setGeneratedNotes(data.bufferedChunks.join(''))
            setIsGenerating(data.running)
            break
          case 'chunk':
            setGeneratedNotes((prev) => prev + data.chunk)
            break
          case 'started':
            setGeneratedNotes('')
            setIsGenerating(true)
            break
          case 'done':
            setIsGenerating(false)
            break
          case 'error':
            setGeneratedNotes(`Error: ${data.error}`)
            setIsGenerating(false)
            break
        }
      })
    }
  }, [])

  const handleGenerate = () => {
    if (
      !selectedDiff ||
      !('serviceWorker' in navigator) ||
      !navigator.serviceWorker.controller
    )
      return
    navigator.serviceWorker.controller.postMessage({
      type: 'start',
      payload: {
        diff: selectedDiff.diff,
        id: selectedDiff.id,
        description: selectedDiff.description,
        labels: selectedDiff.labels,
      },
    })
  }

  const stopGenerate = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'stop' })
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-12 md:p-24 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 sm:mb-12 w-full gap-4 sm:gap-0">
        <div className="flex flex-row items-center">
          <Image src="/logo-black.svg" alt="a0" width={35} height={35} />
          <span className="text-[22px] font-normal ml-1">a0 diff digest</span>
        </div>
        <RepoForm
          onSubmit={handleFetchClick}
          isLoading={isLoading}
          nextPage={nextPage}
          onLoadMore={handleLoadMoreClick}
        />
      </div>
      <div className="flex flex-col lg:flex-row w-full space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="w-full lg:w-1/2 border border-border rounded-lg p-4 sm:p-6 h-[40vh] bg-card overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Merged Pull Requests</h2>

          {error && (
            <div className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded mb-4">
              Error: {error}
            </div>
          )}

          {!initialFetchDone && !isLoading && (
            <p className="text-muted-foreground">
              Click the button above to fetch the latest merged pull requests
              from the repository.
            </p>
          )}

          {initialFetchDone && diffs.length === 0 && !isLoading && !error && (
            <p className="text-muted-foreground">
              No merged pull requests found or fetched.
            </p>
          )}

          {diffs.length > 0 && (
            <ul className="space-y-3 list-disc list-inside">
              {diffs.map((item) => (
                <li key={item.id} className="text-muted-foreground">
                  <Button
                    variant="link"
                    className="px-0 text-blue-500 hover:text-blue-600"
                    onClick={() => setSelectedDiff(item)}
                  >
                    PR #{item.id}:
                  </Button>
                  <span className="ml-2">{item.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="w-full lg:w-1/2 border border-border rounded-lg p-4 sm:p-6 h-[40vh] bg-card">
          <PRDetailsCard
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onStop={stopGenerate}
          />
        </div>
      </div>
      <GeneratedNotesCard
        generatedNotes={generatedNotes}
        isWaiting={isGenerating && !generatedNotes}
      />
    </main>
  )
}
