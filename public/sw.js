const bufferedChunks = []
let controller = null

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  const msg = event.data
  switch (msg.type) {
    case 'start':
      bufferedChunks.length = 0
      if (!controller) {
        controller = new AbortController()
        startStream(msg.payload)
      }
      break
    case 'stop':
      if (controller) {
        controller.abort()
        controller = null
        broadcast({ type: 'done' })
      }
      break
    case 'getState':
      event.source.postMessage({
        type: 'state',
        bufferedChunks,
        running: !!controller,
      })
      break
  }
})

async function startStream(payload) {
  broadcast({ type: 'started' })
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diff: payload.diff,
        messages: [],
        id: payload.id,
        description: payload.description,
        labels: payload.labels,
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const error = await response.text()
      broadcast({ type: 'error', error })
      return
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      bufferedChunks.push(chunk)
      broadcast({ type: 'chunk', chunk })
    }
    controller = null
    broadcast({ type: 'done' })
  } catch (err) {
    if (err.name === 'AbortError') {
      // Stream aborted by stop
    } else {
      broadcast({ type: 'error', error: err.message || err.toString() })
    }
    controller = null
  }
}

async function broadcast(message) {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true })
  for (const client of allClients) {
    client.postMessage(message)
  }
}
