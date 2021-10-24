import { Logger } from '@nestjs/common'
import { Injectable } from "@nestjs/common";
import { readFile } from 'fs/promises'
import mjml from 'mjml';
import Handlebars from 'handlebars'
import { TemplateData } from './template.interface';

export interface Template {
  html: string;
  email: {
    subject: string
  }
}

@Injectable()
export class TemplateService {

  async getTemplate(templateData: TemplateData): Promise<Template> {
    try {
      // read the file
      const file = await readFile(`./templates/${templateData.fileName}.mjml`, { encoding: "utf-8" })
      // pass it through mjml to produce html template
      const result = mjml(file)
      // compile the handlebar template
      const template = Handlebars.compile(result.html)
      // build the final html
      const html = template(templateData.data)
      const email = await this.getEmailData(`./templates/${templateData.fileName}.json`)
      return {
        html,
        email: email
      }
    } catch (err) {
      Logger.error(`can not get html from template=${templateData.fileName}`, err)
      throw err
    }
  }

  async getEmailData(path: string) {
    try {
      const contents = await readFile(path, { encoding: "utf-8" })
      return JSON.parse(contents)
    } catch {
      return {};
    }
  }
}
