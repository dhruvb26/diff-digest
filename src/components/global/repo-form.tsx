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
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-0 w-full sm:w-auto">
      {nextPage && !isLoading && onLoadMore && (
        <Button
          className="w-full sm:w-auto sm:mr-6"
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
          className="flex flex-col sm:flex-row items-end gap-4 sm:gap-8 w-full"
        >
          <FormField
            control={form.control}
            name="repo"
            render={({ field }) => (
              <FormItem className="flex-1 w-full sm:w-auto">
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
              <FormItem className="flex-1 w-full sm:w-auto">
                <FormLabel>Owner</FormLabel>
                <FormControl>
                  <Input autoComplete="off" placeholder="openai" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            className="w-full sm:w-auto self-end"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Fetching...' : 'Fetch'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
