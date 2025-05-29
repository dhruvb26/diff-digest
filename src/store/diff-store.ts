import { create } from 'zustand'
import { DiffItem } from '@/types/global'

interface DiffStore {
  selectedDiff: DiffItem | null
  setSelectedDiff: (diff: DiffItem | null) => void
}

export const useDiffStore = create<DiffStore>((set) => ({
  selectedDiff: null,
  setSelectedDiff: (diff: DiffItem | null) => set({ selectedDiff: diff }),
}))
