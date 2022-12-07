import { Readable } from 'stream'

export interface StreamableFileDto {
  filename: string
  mimetype: string
  stream: Readable
}
