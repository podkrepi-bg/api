import { Logger } from '@nestjs/common'
import { readFile } from 'fs/promises'
import mjml from 'mjml'
import path from 'path'

import { EmailMetadata, TemplateType } from './template.interface'
import { TemplateService } from './template.service'

export class TemplateServiceSpecAdapter extends TemplateService {
  /**
   * Why do we need this when we have the template.service.ts?
   * It's looking in a hardcoded path which is correct when the app is built and deployed but incorrect when running the tests.
   * Hence we extend the base class with this for the tests.
   *
   * @param basePath where to look for the assets/templates/*.mjml files
   */
  constructor(private basePath: string) {
    super()
  }

  protected async getEmailTemplate(templateName: TemplateType): Promise<ReturnType<typeof mjml>> {
    try {
      const file = await readFile(
        path.resolve(this.basePath, `./assets/templates/${templateName}.mjml`),
        { encoding: 'utf-8' },
      )
      return mjml(file)
    } catch (error) {
      Logger.error(`getEmailTemplate`, error)
      throw error
    }
  }

  protected async getEmailData(templateName: string): Promise<EmailMetadata> {
    try {
      const contents = await readFile(
        path.resolve(this.basePath, `./assets/templates/${templateName}.json`),
        { encoding: 'utf-8' },
      )
      return JSON.parse(contents)
    } catch (error) {
      Logger.error(`getEmailData`, error)
      throw error
    }
  }
}
