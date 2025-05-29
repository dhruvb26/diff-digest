import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { formSchema } from '@/types/schemas'
import { z } from 'zod'

interface RepoFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void
  isLoading: boolean
  nextPage: number | null
  onLoadMore?: () => void
}

export default function RepoForm({
  onSubmit,
  isLoading,
  nextPage,
  onLoadMore,
}: RepoFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repo: 'openai-node',
      owner: 'openai',
    },
  })

  return (
    <div className="flex flex-row items-end">
      {nextPage && !isLoading && onLoadMore && (
        <Button
          className="mr-6"
          variant={'outline'}
          onClick={onLoadMore}
          disabled={isLoading}
        >
          {isLoading && nextPage > 1
            ? 'Loading more...'
            : `Load More (Page ${nextPage})`}
        </Button>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-x-8 flex flex-row items-end"
        >
          <FormField
            control={form.control}
            name="repo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repo</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="openai-node"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="owner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <FormControl>
                  <Input autoComplete="off" placeholder="openai" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isLoading} type="submit">
            {isLoading ? 'Fetching...' : 'Fetch'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
