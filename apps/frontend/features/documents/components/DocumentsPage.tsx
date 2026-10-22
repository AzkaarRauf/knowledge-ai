import { Suspense } from 'react'
import { DocumentList, DocumentListSkeleton } from '@/features/documents/components/DocumentList'
import { DocumentUploadDialog } from '@/features/documents/components/DocumentUploadDialog'

export function DocumentsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground">PDF, DOCX or text files, up to 25MB.</p>
        </div>
        <DocumentUploadDialog />
      </div>
      {/* DocumentList reads URL search params, which needs a Suspense boundary */}
      <Suspense fallback={<DocumentListSkeleton />}>
        <DocumentList />
      </Suspense>
    </div>
  )
}
