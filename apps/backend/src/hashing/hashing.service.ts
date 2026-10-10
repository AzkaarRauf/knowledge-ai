import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

@Injectable()
export class HashingService {
    private saltRounds = 10
    hash(value: string) {
        return bcrypt.hash(value, this.saltRounds)
    }
    compare({ data, encrypted }: { data: string; encrypted: string }) {
        return bcrypt.compare(data, encrypted)
    }
}
