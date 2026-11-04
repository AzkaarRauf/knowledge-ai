import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { EmbeddingModule } from 'src/embedding/embedding.module.js'
import { S3Module } from 'src/s3/s3.module.js'
import { DocumentProcessingConsumer } from './document-processing.consumer.js'
import { QueueNames } from './queue.constants.js'

@Module({
    imports: [
        BullModule.registerQueue({
            name: QueueNames.documentProcessing,
            // no auto retries: a failed job goes straight to FAILED. to retry, delete the doc and upload again.
            // drop finished jobs to keep redis small
            defaultJobOptions: { attempts: 1, removeOnComplete: true, removeOnFail: { count: 1000 } },
        }),
        S3Module,
        EmbeddingModule,
    ],
    providers: [DocumentProcessingConsumer],
    // export so importing modules can @InjectQueue
    exports: [BullModule],
})
export class QueueModule {}
