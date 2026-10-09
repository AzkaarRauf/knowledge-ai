import { Injectable, NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { Request, Response } from 'express'

declare global {
    namespace Express {
        interface Request {
            id: string
        }
    }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: () => void) {
        req.id = randomUUID()
        next()
    }
}
