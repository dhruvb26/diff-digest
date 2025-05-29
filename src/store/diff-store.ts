import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DiffItem } from '@/types/global'

interface DiffStore {
  selectedDiff: DiffItem | null
  setSelectedDiff: (diff: DiffItem | null) => void
}

export const useDiffStore = create<DiffStore>()(
  persist(
    (set) => ({
      selectedDiff: null,
      setSelectedDiff: (diff: DiffItem | null) => set({ selectedDiff: diff }),
    }),
    { name: 'diff-store' }
  )
)
