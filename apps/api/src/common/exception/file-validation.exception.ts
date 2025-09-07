import { HttpStatus, UnsupportedMediaTypeException } from '@nestjs/common'

/**
 * Custom exception thrown when file validation fails.
 * This exception provides a structured error response for unsupported or invalid file types.
 */
export class FileValidationException extends UnsupportedMediaTypeException {
  /**
   * Constructor.
   *
   * @param message - The detailed error message describing the validation failure
   * @param fileName - The name of the file that failed validation
   */
  constructor(message: string, fileName = 'file') {
    super({
      statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      message: {
        property: fileName,
        constraints: {
          isValidFile: false,
        },
      },
      error: message,
    })
  }
}
