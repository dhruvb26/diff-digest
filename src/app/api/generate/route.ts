import { Annotation, StateGraph, END, START } from '@langchain/langgraph'
import { z } from 'zod'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOpenAI } from '@langchain/openai'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { tool } from '@langchain/core/tools'
import { requestSchema } from '@/types/schemas'

export async function POST(req: Request) {
  try {
    const { diff, id, description, labels } = requestSchema.parse(
      await req.json()
    )

    console.log('[generate] STARTED', id)

    // Global GraphState to be used across all nodes
    const GraphState = Annotation.Root({
      messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
      }),
    })

    // Nodes

    async function changeExtractor(
      state: typeof GraphState.State
    ): Promise<Partial<typeof GraphState.State>> {
      const { messages } = state

      console.log('[changeExtractor] STARTED')

      const responseSchema = z.object({
        facts: z.array(
          z.object({
            id: z.string(),
            category: z.string(),
            description: z.string(),
          })
        ),
      })

      const finalResponseTool = tool(async () => 'mocked value', {
        name: 'response',
        description: 'Always respond to the user using this tool.',
        schema: responseSchema,
      })

      // Get the last message i.e. the diff from the user's request to the route
      const lastMessage = messages[messages.length - 1].content

      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are a helpful assistant that whose job is to extract a list of facts from a given diff. These facts will be used to generate release notes for a given diff.
           An example of a fact: 
           - id: 1
           - category: performance
           - description: Improved performance by 20% (should be in-depth and detailed)
          
           Here are some details about the diff:\n
           - {description}
           - {labels}
                
           Here is the diff:\n
           {diff}
       
           You must use the response tool to return the list of facts.
          `,
        ],
      ])

      const model = new ChatOpenAI({
        model: 'gpt-4.1',
        temperature: 0,
        openAIApiKey: process.env.OPENAI_API_KEY,
      }).bindTools([finalResponseTool], {
        tool_choice: finalResponseTool.name,
      })

      const response = await prompt.pipe(model).invoke({
        diff: lastMessage,
        description: description,
        labels: labels,
      })

      console.log('[changeExtractor] COMPLETED')

      return {
        messages: [response],
      }
    }

    async function devDrafter(
      state: typeof GraphState.State
    ): Promise<Partial<typeof GraphState.State>> {
      const { messages } = state

      console.log('[devDrafter] STARTED')

      // Last message must be a tool call
      const lastMessage = messages[messages.length - 1]

      if (
        'tool_calls' in lastMessage &&
        Array.isArray(lastMessage.tool_calls) &&
        lastMessage.tool_calls.length
      ) {
        // Extract the tool call args
        const toolArgs = lastMessage.tool_calls[0].args
        const facts = toolArgs.facts

        const prompt = ChatPromptTemplate.fromTemplate(
          `You are a helpful assistant that drafts release notes for a given diff and list of facts.
           The release notes should be developer oriented and should focus on the _what_ and _why_ of the change (e.g., "Refactored useFetchDiffs hook to use useSWR for improved caching and reduced re-renders.").
           
           Here is the list of facts:
           {facts}
          `
        )

        const model = new ChatOpenAI({
          model: 'gpt-4o',
          temperature: 0,
          openAIApiKey: process.env.OPENAI_API_KEY,
        })

        const response = await prompt.pipe(model).invoke({
          facts: facts,
        })

        console.log('[devDrafter] COMPLETED')

        return {
          messages: [response],
        }
      }

      return {
        messages: [lastMessage],
      }
    }

    async function marketingDrafter(
      state: typeof GraphState.State
    ): Promise<Partial<typeof GraphState.State>> {
      const { messages } = state

      console.log('[marketingDrafter] STARTED')

      // Last message must be a tool call
      const lastMessage = messages[messages.length - 1]

      if (
        'tool_calls' in lastMessage &&
        Array.isArray(lastMessage.tool_calls) &&
        lastMessage.tool_calls.length
      ) {
        // Extract the tool call args
        const toolArgs = lastMessage.tool_calls[0].args
        const facts = toolArgs.facts

        const prompt = ChatPromptTemplate.fromTemplate(
          `You are a helpful assistant that drafts release notes for a given diff and list of facts.
           The release notes should be marketing oriented and user-centric, highlight the _benefit_ of the change, and use simpler language (e.g., "Loading pull requests is now faster and smoother thanks to improved data fetching!").
           
           These are user-facing release notes. They should be written in a way that is easy to understand and use. Omit any details that might not be relevant to the user.

           The notes should have an introduction, the main content, and a short conclusion.

           Here is the list of facts:
           {facts}
          `
        )

        const model = new ChatOpenAI({
          model: 'gpt-4o',
          temperature: 0,
          openAIApiKey: process.env.OPENAI_API_KEY,
        })

        const response = await prompt.pipe(model).invoke({
          facts: facts,
        })

        console.log('[marketingDrafter] COMPLETED')

        return {
          messages: [response],
        }
      }

      return {
        messages: [lastMessage],
      }
    }

    async function auditor(
      state: typeof GraphState.State
    ): Promise<Partial<typeof GraphState.State>> {
      const { messages } = state

      console.log('[auditor] STARTED')

      const responseSchema = z.object({
        passed: z.boolean().describe('The result of the audit'),
        failed: z
          .array(z.string())
          .describe('The failures of the audit if any')
          .optional(),
        devNotes: z.string().describe('The final developer release notes'),
        marketingNotes: z
          .string()
          .describe('The final marketing release notes'),
      })

      const finalResponseTool = tool(async () => 'mocked value', {
        name: 'response',
        description: 'Always respond to the user using this tool.',
        schema: responseSchema,
      })

      const toolMessage = messages.filter((message) => {
        // check for tool_calls in the message
        return (
          'tool_calls' in message &&
          Array.isArray(message.tool_calls) &&
          message.tool_calls.length > 0
        )
      }) as AIMessage[]

      if (toolMessage.length > 0 && toolMessage[0].tool_calls) {
        const toolArgs = toolMessage[0].tool_calls[0].args
        const facts = toolArgs.facts

        const prompt = ChatPromptTemplate.fromTemplate(
          `You are a helpful assistant that audits the release notes for a given diff and list of facts.
          
           Keep in mind the following rules for the developer release notes:
           1. No fact is "lost" (every fact should appear in at least one bullet) in developer release notes.
           
           Keep in mind the following rules for the marketing release notes:
           1. Every marketing release note's bullet point must map to ≥1 developer bullet via shared fact.id
           2. Any numeric claim (e.g. "30%") must match the diff's metrics or commit message.

           Here are the generated release notes for the marketing and developer side:
           {generatedReleaseNotes}

           Here are the list of facts:
           {facts}

           You must use the response tool to return the result. If the release notes are not valid, return a list of failures.
          `
        )

        const model = new ChatOpenAI({
          model: 'gpt-4o',
          temperature: 0,
          openAIApiKey: process.env.OPENAI_API_KEY,
        }).bindTools([finalResponseTool], {
          tool_choice: finalResponseTool.name,
        })

        const marketingReleaseNotes = messages[messages.length - 1].content
        const developerReleaseNotes = messages[messages.length - 2].content

        const generatedReleaseNotes = `## Marketing Release Notes\n\n${marketingReleaseNotes}\n\n## Developer Release Notes\n\n${developerReleaseNotes}`

        const response = await prompt.pipe(model).invoke({
          generatedReleaseNotes: generatedReleaseNotes,
          facts: facts,
        })

        console.log('[auditor] COMPLETED')

        return {
          messages: [response],
        }
      }

      return {
        messages: [toolMessage[0] as BaseMessage],
      }
    }

    async function assembler(
      state: typeof GraphState.State
    ): Promise<Partial<typeof GraphState.State>> {
      const { messages } = state

      console.log('[assembler] STARTED')

      const lastMessage = messages[messages.length - 1]

      if (
        'tool_calls' in lastMessage &&
        Array.isArray(lastMessage.tool_calls) &&
        lastMessage.tool_calls.length
      ) {
        const toolArgs = lastMessage.tool_calls[0].args

        const devNotes = toolArgs.devNotes
        const marketingNotes = toolArgs.marketingNotes

        const prompt = ChatPromptTemplate.fromTemplate(
          `Return the user the final release notes in markdown format.
          
           Here is the developer release notes:
           {devNotes}
           Here is the marketing release notes:
           {marketingNotes}

           Separate the developer and marketing release notes with a horizontal rule and give a title to each section.
          `
        )

        const model = new ChatOpenAI({
          model: 'gpt-4o',
          temperature: 0,
          streaming: true,
          openAIApiKey: process.env.OPENAI_API_KEY,
        })

        const response = await prompt.pipe(model).invoke({
          devNotes: devNotes,
          marketingNotes: marketingNotes,
        })

        console.log('[assembler] COMPLETED')

        return {
          messages: [response],
        }
      }

      return {
        messages: [lastMessage],
      }
    }

    // Error handler node for missing tool calls
    async function errorNode(
      state: typeof GraphState.State
    ): Promise<Partial<typeof GraphState.State>> {
      // Reply with an error message when tool calls are missing
      console.error('[errorNode] ERROR', state)
      return {
        messages: [new AIMessage('Generation Failed please try again')],
      }
    }

    // Workflow
    // Define the workflow with the nodes
    const workflow = new StateGraph(GraphState)
      .addNode('changeExtractor', changeExtractor)
      .addNode('devDrafter', devDrafter)
      .addNode('marketingDrafter', marketingDrafter)
      .addNode('auditor', auditor)
      .addNode('assembler', assembler)
      .addNode('error', errorNode)

      .addEdge(START, 'changeExtractor')
      .addEdge('changeExtractor', 'devDrafter')
      .addEdge('changeExtractor', 'marketingDrafter')
      .addEdge('marketingDrafter', 'auditor')
      .addEdge('devDrafter', 'auditor')
      .addEdge('auditor', 'assembler')
      .addConditionalEdges('assembler', (state: typeof GraphState.State) => {
        const { messages } = state
        const lastMessage = messages[messages.length - 1]
        // Check if we have a valid content in the message
        if (lastMessage && 'content' in lastMessage && lastMessage.content) {
          return END
        }
        return 'error'
      })
      .addEdge('error', END)

    const app = workflow.compile()

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await app.stream(
            { messages: [new HumanMessage(diff)] },
            { streamMode: 'messages' }
          )

          // Get the abort signal from the request
          const signal = req.signal

          // Create an async iterator from the stream
          const iterator = stream[Symbol.asyncIterator]()

          while (true) {
            // Check if aborted before each iteration
            if (signal?.aborted) {
              controller.close()
              return
            }

            const result = await iterator.next()
            if (result.done) {
              controller.close()
              return
            }

            const [message, metadata] = result.value
            // Only stream the last message from the assembler or error node
            if (
              message.content &&
              (metadata.langgraph_node === 'assembler' ||
                metadata.langgraph_node === 'error')
            ) {
              controller.enqueue(encoder.encode(message.content))
            }
          }
        } catch (error) {
          // If the error is an abort error, just close the stream
          if (error instanceof Error && error.name === 'AbortError') {
            controller.close()
            return
          }
          // For other errors, enqueue the error message and close
          const errorMessage =
            error instanceof Error ? error.message : 'An unknown error occurred'
          controller.enqueue(encoder.encode(`Error: ${errorMessage}`))
          controller.close()
        }
      },

      cancel() {
        // Handle any cleanup needed when the stream is cancelled
        console.log('Stream cancelled')
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request format',
          details: error.errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Handle other types of errors
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
