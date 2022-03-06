import { Injectable } from '@nestjs/common'
import { S3, Endpoint } from 'aws-sdk'
import { Body } from 'aws-sdk/clients/s3'
import { config } from 'aws-sdk'

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
    console.log(process.env.S3_BUCKET)

    if (!process.env.S3_ENDPOINT) {
      throw new Error('S3 endpoint not set in config.')
    }

    console.log(process.env.S3_ENDPOINT)

    this.s3 = new S3({ endpoint: new Endpoint(process.env.S3_ENDPOINT) })
    this.s3
      .listObjects({ Bucket: this.bucketName })
      .promise()
      .then((x) => {
        if (!x.Contents) return
        for (let e of x.Contents) {
          console.log(e)
        }
      })
  }

  async getObject(key: string): Promise<Body | undefined> {
    return await this.s3
      .getObject({ Bucket: this.bucketName, Key: key })
      .promise()
      .then((x) => x.Body)
  }
}
