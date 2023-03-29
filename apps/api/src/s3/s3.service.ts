import { Injectable, Logger } from '@nestjs/common'
import { S3, Endpoint, config } from 'aws-sdk'
import { Readable } from 'stream'

@Injectable()
export class S3Service {
  private readonly s3: S3

  constructor() {
    config.update({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      s3ForcePathStyle: true,
    })

    if (!process.env.S3_ENDPOINT) {
      throw new Error('S3 endpoint not set in config.')
    }
    this.s3 = new S3({ endpoint: new Endpoint(process.env.S3_ENDPOINT) })
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
      .upload({
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
      .promise()
      .then((x) => {
        Logger.log(
          `Uploading file ${filename} to S3 bucket ${bucketName} with key ${fileId}: ${x.Key}, loc: ${x.Location}`,
        )
        return x.Key
      })
  }

  async deleteObject(bucketName: string, fileId: string): Promise<boolean | undefined> {
    return await this.s3
      .deleteObject({ Bucket: bucketName, Key: fileId })
      .promise()
      .then((x) => x.DeleteMarker)
  }

  async streamFile(bucketName: string, fileId: string): Promise<Readable> {
    return await this.s3
      .getObject({
        Bucket: bucketName,
        Key: fileId,
      })
      .createReadStream()
  }
}
