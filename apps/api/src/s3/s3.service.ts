import { Injectable } from '@nestjs/common'
import { CampaignFile } from '@prisma/client'
import { S3, Endpoint } from 'aws-sdk'
import { config } from 'aws-sdk'
import { Readable } from 'stream'

@Injectable()
export class S3Service {
  private readonly bucketName: string
  private readonly s3: S3

  constructor() {
    config.update({
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      s3ForcePathStyle: true,
    })

    if (!process.env.S3_BUCKET) {
      throw new Error('S3 bucket not set in config.')
    }
    this.bucketName = process.env.S3_BUCKET

    if (!process.env.S3_ENDPOINT) {
      throw new Error('S3 endpoint not set in config.')
    }
    this.s3 = new S3({ endpoint: new Endpoint(process.env.S3_ENDPOINT) })
  }

  async uploadObject(dbFile: CampaignFile, mimetype: string, stream: Buffer): Promise<string> {
    return await this.s3
      .upload({
        Bucket: this.bucketName,
        Body: stream,
        Key: dbFile.id,
        ContentType: mimetype,
        Metadata: {
          originalName: dbFile.filename,
          campaignId: dbFile.campaignId,
          personId: dbFile.personId,
        },
      })
      .promise()
      .then((x) => x.Key)
  }

  async deleteObject(key: string): Promise<boolean | undefined> {
    return await this.s3
      .deleteObject({ Bucket: this.bucketName, Key: key })
      .promise()
      .then((x) => x.DeleteMarker)
  }

  async streamFile(key: string): Promise<Readable> {
    return await this.s3
      .getObject({
        Bucket: this.bucketName,
        Key: key,
      })
      .createReadStream()
  }
}
