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

/**
 * Returns a shallow copy of `file` with `originalname` re-decoded from
 * latin1 to UTF-8. We deliberately do NOT mutate the original Multer file
 * object, so the request stays pristine for any other consumer (guards,
 * interceptors, exception filters) and so this conversion stays idempotent
 * — running it twice on the same input always yields the same result.
 */
const withDecodedFilename = <T extends AnyFile>(file: T): T => {
  if (!file || typeof file.originalname !== 'string') return file
  return {
    ...file,
    originalname: Buffer.from(file.originalname, 'latin1').toString('utf8'),
  }
}

export const UploadedFile = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const file = ctx.switchToHttp().getRequest().file
  return file ? withDecodedFilename(file) : file
})

export const UploadedFiles = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const files = ctx.switchToHttp().getRequest().files
  if (!files) return files
  if (Array.isArray(files)) return files.map(withDecodedFilename)
  // FileFieldsInterceptor: { [field]: Express.Multer.File[] }
  const result: Record<string, AnyFile[]> = {}
  for (const key of Object.keys(files)) {
    result[key] = files[key].map(withDecodedFilename)
  }
  return result
})
