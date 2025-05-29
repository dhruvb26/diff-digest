// Define the expected structure of a diff object
export interface DiffItem {
  id: string
  description: string
  diff: string
  url: string // Added URL field
  labels: { name: string }[]
}

// Define the expected structure of the API response
export interface ApiResponse {
  diffs: DiffItem[]
  nextPage: number | null
  currentPage: number
  perPage: number
  labels: string[]
}
