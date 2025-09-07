import path from 'path'
import { FileValidationException } from './exception/file-validation.exception'

interface File {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer: Buffer
}

/**
 * The function is used to validate the type of file using the file extension and MIME type
 * @param file object that represent file
 * @param cb callback function which indicates whether file is accepted or not
 *
 * @throws FileValidationException if the file does not pass validation
 */
export function validateFileType(
  file: File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const mimeAllowlist = [
    'text/plain',
    'application/json',
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/xml',
    'text/xml',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]

  let filename = file.originalname
  let extension = path.extname(filename).toLowerCase()
  if (extension == '') {
    filename = file.filename
    // for the expense files, the original filename is encoded in base64
    extension = path.extname(filename).toLowerCase()
  }

  if (!mimeAllowlist.includes(file.mimetype)) {
    return cb(new FileValidationException('File mime type is not allowed', filename), false)
  }

  const allowedExtensions = /txt|json|pdf|jpeg|jpg|png|xml|xlsx|xls|docx/

  const isExtensionSupported = allowedExtensions.test(extension)
  if (!isExtensionSupported) {
    return cb(
      new FileValidationException('File extension is not allowed: ' + filename, filename),
      false,
    )
  }

  cb(null, true)
}
