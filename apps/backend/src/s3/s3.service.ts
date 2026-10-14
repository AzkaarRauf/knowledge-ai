import { Injectable } from '@nestjs/common'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'
import { env } from 'src/env.js'

type GenerateKeyParams = {
    originalName: string
} & ({ scope: 'admin'; conversationId?: undefined } | { scope: 'conversation'; conversationId: string })

@Injectable()
export class S3Service {
    private readonly s3 = new S3Client({ forcePathStyle: true })
    private readonly bucket = env.S3_BUCKET

    generateKey({ originalName, scope, conversationId }: GenerateKeyParams): string {
        const idx = originalName.lastIndexOf('.')
        const filename = `${originalName.slice(0, idx)}-${randomUUID()}${originalName.slice(idx)}`
        if (scope === 'conversation') {
            return `${scope}/${conversationId}/${filename}`
        }
        return `${scope}/${filename}`
    }

    async upload(args: GenerateKeyParams & { buffer: Buffer; key?: string }) {
        const Key = args.key || this.generateKey(args)
        await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key, Body: args.buffer }))
    }

    async delete(key: string) {
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
    }
}
