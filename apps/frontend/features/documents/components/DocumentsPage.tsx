import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { getCredentials } from '@/features/auth/auth.server'
import { DocumentList, DocumentListSkeleton } from '@/features/documents/components/DocumentList'
import { DocumentUploadDialog } from '@/features/documents/components/DocumentUploadDialog'

// every role can view docs; only admins upload and delete (backend checks the role too)
export function DocumentsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      {/* reading the cookie is request-time, so the role-based parts stream in behind Suspense */}
      <Suspense fallback={<DocumentsContentSkeleton />}>
        <DocumentsContent />
      </Suspense>
    </div>
  )
}

async function DocumentsContent() {
  const credentials = await getCredentials()
  const isAdmin = credentials?.role === 'ADMIN'

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Documents</h1>
          {isAdmin && <p className="text-sm text-muted-foreground">PDF, DOCX or text files, up to 25MB.</p>}
        </div>
        {isAdmin && <DocumentUploadDialog />}
      </div>
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
      <Skeleton className="h-7 w-40" />
      <DocumentListSkeleton />
    </>
  )
}
