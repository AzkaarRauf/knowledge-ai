import { Suspense } from 'react'
import { PageContainer, PageHeader } from '@/components/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { getCredentials } from '@/features/auth/auth.server'
import { DocumentList, DocumentListSkeleton } from '@/features/documents/components/DocumentList'
import { DocumentUploadDialog } from '@/features/documents/components/DocumentUploadDialog'

// every role can view docs; only admins upload and delete (backend checks the role too)
export function DocumentsPage() {
  return (
    <PageContainer>
      {/* reading the cookie is request-time, so the role-based parts stream in behind Suspense */}
      <Suspense fallback={<DocumentsContentSkeleton />}>
        <DocumentsContent />
      </Suspense>
    </PageContainer>
  )
}

async function DocumentsContent() {
  const credentials = await getCredentials()
  const isAdmin = credentials?.role === 'ADMIN'

  return (
    <>
      <PageHeader
        title="Documents"
        description={
          isAdmin
            ? 'The knowledge base the assistant answers from. PDF, DOCX or text files, up to 25MB.'
            : 'The knowledge base the assistant answers from.'
        }
        actions={isAdmin && <DocumentUploadDialog />}
      />
      {/* DocumentList reads URL search params, which needs a Suspense boundary */}
      <Suspense fallback={<DocumentListSkeleton />}>
        <DocumentList canManage={isAdmin} />
      </Suspense>
    </>
  )
}

function DocumentsContentSkeleton() {
  return (
    <>
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <DocumentListSkeleton />
    </>
  )
}
