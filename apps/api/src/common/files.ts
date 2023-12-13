import path from 'path'

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
 * The function is used to validate the type of a file using the file extension and MIME type
 * @param file object that represent file
 * @param cb callback function which indicates whether file is accepted or not
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
  if (!mimeAllowlist.includes(file.mimetype)) {
    return cb(new Error('File mime type is not allowed'), false)
  }

  const allowedExtensions = /txt|json|pdf|jpeg|jpg|png|xml|xlsx|xls|docx/

  const isExtensionSupported = allowedExtensions.test(path.extname(file.originalname).toLowerCase())
  if (!isExtensionSupported) {
    return cb(new Error('File extension is not allowed'), false)
  }

  cb(null, true)
}
