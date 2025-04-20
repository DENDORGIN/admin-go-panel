import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/direct')({
  component: () => <div>Hello /_layout/direct!</div>
})