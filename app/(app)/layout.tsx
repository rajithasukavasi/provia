import { AppHeader } from '@/components/app-header'
import { requireUser } from '@/lib/data'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader email={user.email ?? ''} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
