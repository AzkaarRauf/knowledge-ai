import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { EmbeddingModule } from 'src/embedding/embedding.module.js'
import { S3Module } from 'src/s3/s3.module.js'
import { DocumentProcessingConsumer } from './document-processing.consumer.js'
import { QueueNames } from './queue.constants.js'
import { TestConsumer } from './test.consumer.js'

@Module({
    imports: [
        BullModule.registerQueue(
            {
                name: QueueNames.documentProcessing,
                // embedding api can fail for a moment, so retry with growing delay
                defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
            },
            { name: QueueNames.test },
        ),
        S3Module,
        EmbeddingModule,
    ],
    providers: [DocumentProcessingConsumer, TestConsumer],
    // export so importing modules can @InjectQueue
    exports: [BullModule],
})
export class QueueModule {}
