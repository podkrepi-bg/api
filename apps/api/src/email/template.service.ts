import path from 'path'
import mjml from 'mjml'
import Handlebars from 'handlebars'
import { readFile } from 'fs/promises'
import { Logger } from '@nestjs/common'
import { Injectable } from '@nestjs/common'

import { EmailTemplate, BuiltTemplate, TemplateType, EmailMetadata } from './template.interface'

@Injectable()
export class TemplateService {
  async getTemplate<C>({ name, data }: EmailTemplate<C>): Promise<BuiltTemplate> {
    try {
      // pass it through mjml to produce html template
      const result = await this.getEmailTemplate(name)

      // compile the handlebar template
      const template = Handlebars.compile<typeof data>(result.html)
      // build the final html
      const html = template(data)
      // extract extra info (e.g. subject)
      const metadata = await this.getEmailData(name)

      return { html, metadata }
    } catch (err) {
      Logger.error(`can not get html from template=${name}`, err)
      throw err
    }
  }

  private async getEmailTemplate(templateName: TemplateType): Promise<ReturnType<typeof mjml>> {
    try {
      const file = await readFile(
        path.resolve(__dirname, `./assets/templates/${templateName}.mjml`),
        { encoding: 'utf-8' },
      )
      return mjml(file)
    } catch (error) {
      Logger.error(`getEmailTemplate`, error)
      throw error
    }
  }

  private async getEmailData(templateName: string): Promise<EmailMetadata> {
    try {
      const contents = await readFile(
        path.resolve(__dirname, `./assets/templates/${templateName}.json`),
        { encoding: 'utf-8' },
      )
      return JSON.parse(contents)
    } catch (error) {
      Logger.error(`getEmailData`, error)
      throw error
    }
  }
}
