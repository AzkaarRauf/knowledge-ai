'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Building2, FileText, MessagesSquare, Plus, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { PageContainer, PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { conversationsQueryOptions } from '@/features/conversations/api/queries'
import { publicDepartmentsQueryOptions } from '@/features/departments/api/queries'
import { documentsQueryOptions } from '@/features/documents/api/queries'

const RECENT_COUNT = 5

/** Landing page: totals, recent chats and recent documents. */
export function HomeDashboard() {
  const conversations = useQuery(conversationsQueryOptions({ pageSize: RECENT_COUNT }))
  const documents = useQuery(documentsQueryOptions({ pageSize: RECENT_COUNT, sortBy: 'createdAt', sortOrder: 'desc' }))
  const departments = useQuery(publicDepartmentsQueryOptions())

  return (
    <PageContainer>
      <PageHeader
        title="Overview"
        description="Ask questions and get cited answers from your organization's documents."
        actions={
          <Button size="lg" nativeButton={false} render={<Link href="/chat" />}>
            <Plus data-icon="inline-start" />
            New chat
          </Button>
        }
      />

      {/* no health card here: the sidebar already shows it, and a second copy hydrates after the
          sidebar filled the cache, so its server skeleton would not match the client */}
      <section aria-label="Totals" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={FileText} label="Documents" value={documents.data?.meta.total} pending={documents.isPending} />
        <StatCard
          icon={MessagesSquare}
          label="Your chats"
          value={conversations.data?.meta.total}
          pending={conversations.isPending}
        />
        <StatCard icon={Building2} label="Departments" value={departments.data?.length} pending={departments.isPending} />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Recent chats" href="/chat" linkLabel="Open assistant">
          {conversations.isPending ? (
            <RowsSkeleton label="Loading chats" />
          ) : conversations.data?.data.length ? (
            <ul className="divide-y">
              {conversations.data.data.map((conversation) => (
                <li key={conversation.id}>
                  <Link
                    href={`/chat/${conversation.id}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                  >
                    <MessagesSquare className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate font-medium">{conversation.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(conversation.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <PanelEmpty>No chats yet. Start one to ask about your documents.</PanelEmpty>
          )}
        </Panel>

        <Panel title="Recently added documents" href="/documents" linkLabel="View all">
          {documents.isPending ? (
            <RowsSkeleton label="Loading documents" />
          ) : documents.data?.data.length ? (
            <ul className="divide-y">
              {documents.data.data.map((document) => (
                <li key={document.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate font-medium" title={document.filename}>
                    {document.filename}
                  </span>
                  {document.department && <Badge variant="outline">{document.department.name}</Badge>}
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(document.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <PanelEmpty>No documents have been added yet.</PanelEmpty>
          )}
        </Panel>
      </div>
    </PageContainer>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  pending,
}: {
  icon: LucideIcon
  label: string
  value: number | undefined
  pending: boolean
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
      </div>
      {pending ? (
        <Skeleton role="status" aria-label={`Loading ${label}`} className="h-8 w-16" />
      ) : (
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{(value ?? 0).toLocaleString()}</p>
      )}
    </div>
  )
}

function Panel({ title, href, linkLabel, children }: { title: string; href: string; linkLabel: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-3" />
        </Link>
      </div>
      {children}
    </section>
  )
}

function PanelEmpty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{children}</p>
}

function RowsSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="divide-y">
      {Array.from({ length: RECENT_COUNT }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-4" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

const timeAgo = (iso: string) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : '')
