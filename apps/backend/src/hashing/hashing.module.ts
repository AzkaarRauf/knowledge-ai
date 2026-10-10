import { Module } from '@nestjs/common'
import { HashingService } from './hashing.service.js'

@Module({
    providers: [HashingService],
    exports: [HashingService],
})
export class HashingModule {}
