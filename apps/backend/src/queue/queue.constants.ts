import { Job, JobsOptions, Queue } from 'bullmq'

export const QueueNames = {
    test: 'test',
    documentProcessing: 'documentProcessing',
} as const

// union of Job<data, result, name>, one per entry
export type JobOf<M> = { [K in keyof M & string]: Job<M[K], void, K> }[keyof M & string]

// queue whose add() ties name to its data
export type TypedQueue<M> = Omit<Queue<JobOf<M>>, 'add'> & {
    add<K extends keyof M & string>(name: K, data: M[K], opts?: JobsOptions): Promise<Job<M[K], void, K>>
}

// job name -> data
export type TestJobs = {
    hello: { hello: string }
    world: { world: string }
}
export type TestQueue = TypedQueue<TestJobs>

export type DocumentProcessingJobs = {
    process: { documentId: string; mimetype: string }
}
export type DocumentProcessingQueue = TypedQueue<DocumentProcessingJobs>
