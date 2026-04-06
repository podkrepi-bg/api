import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Multer (Busboy) decodes multipart filename headers as latin1 by default,
 * so non-ASCII filenames arrive on `file.originalname` as mojibake. These
 * decorators replace Nest's built-in `UploadedFile` / `UploadedFiles` and
 * re-decode `originalname` as UTF-8 before the controller sees the file.
 *
 * Use these in place of the Nest decorators on every multipart upload
 * handler so non-ASCII filenames are stored correctly everywhere.
 */

type AnyFile = { originalname?: string } & Record<string, unknown>

const fixOriginalName = <T extends AnyFile>(file: T): T => {
  if (file && typeof file.originalname === 'string') {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
  }
  return file
}

export const UploadedFile = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest()
  return req.file ? fixOriginalName(req.file) : req.file
})

export const UploadedFiles = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const files = ctx.switchToHttp().getRequest().files
  if (!files) return files
  if (Array.isArray(files)) return files.map(fixOriginalName)
  // FileFieldsInterceptor: { [field]: Express.Multer.File[] }
  for (const key of Object.keys(files)) {
    files[key] = files[key].map(fixOriginalName)
  }
  return files
})
