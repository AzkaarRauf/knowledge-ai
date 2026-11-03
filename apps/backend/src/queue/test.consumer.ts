import { Processor, WorkerHost } from '@nestjs/bullmq'
import { QueueNames } from './queue.constants.js'
import { Job } from 'bullmq'

@Processor(QueueNames.test)
export class TestConsumer extends WorkerHost {
    async process(job: Job) {
        console.log('from test queue')
    }
}
