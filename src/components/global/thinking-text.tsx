import { TextShimmer } from '@/components/ui/text-shimmer'
import { useState, useEffect } from 'react'

function ThinkingText() {
  const sentences = [
    'Extracting facts',
    'Generating developer notes',
    'Generating marketing notes',
    'Auditing',
    'Assembling',
  ]
  const [currentSentence, setCurrentSentence] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSentence((prev) => (prev + 1) % sentences.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [sentences.length])

  return (
    <TextShimmer
      duration={2}
      className="text-lg [--base-color:theme(colors.blue.500)] [--base-gradient-color:theme(colors.blue.200)] dark:[--base-color:theme(colors.blue.700)] dark:[--base-gradient-color:theme(colors.blue.400)]"
    >
      {sentences[currentSentence]}
    </TextShimmer>
  )
}

export default ThinkingText
