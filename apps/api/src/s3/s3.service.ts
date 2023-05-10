import { Injectable, Logger } from '@nestjs/common'
import { S3 } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

@Injectable()
export class S3Service {
  private readonly s3: S3

  constructor() {
    if (!process.env.S3_ENDPOINT) {
      throw new Error('S3 endpoint not set in config.')
    }
    this.s3 = new S3({
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
      },
      region: process.env.S3_REGION,
      forcePathStyle: true,
    })
  }

  async uploadObject(
    bucketName: string,
    fileId: string,
    filename: string,
    mimetype: string,
    stream: Buffer,
    parentEntityName: string,
    parentEntityId: string,
    personId: string,
    metadata?: Record<string, string>,
  ): Promise<string> {
    return await this.s3
      .putObject({
        Bucket: bucketName,
        Body: stream,
        Key: fileId,
        ContentType: mimetype,
        Metadata: {
          originalName: filename,
          parentEntityName,
          parentEntityId,
          uploaderId: personId,
          ...metadata,
        },
      })
      .then((x) => {
        Logger.debug(
          `Uploaded file ${filename} to S3 bucket ${bucketName} with key ${fileId}: ${fileId}, filename: ${filename}`,
        )
        return x.ETag as string
      })
  }

  async deleteObject(bucketName: string, fileId: string): Promise<boolean | undefined> {
    return await this.s3
      .deleteObject({ Bucket: bucketName, Key: fileId })
      .then((x) => x.DeleteMarker)
  }

  async streamFile(bucketName: string, fileId: string): Promise<Readable> {
    return await this.s3
      .getObject({
        Bucket: bucketName,
        Key: fileId,
      })
      .then((x) => x.Body as Readable)
  }
}
