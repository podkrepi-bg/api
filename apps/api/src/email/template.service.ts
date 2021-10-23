import { Logger } from '@nestjs/common'
import { Injectable } from "@nestjs/common";
import { readFile } from 'fs/promises'
import mjml from 'mjml';
import Handlebars from 'handlebars'
import { TemplateData } from './template.interface';

@Injectable()
export class TemplateService {

  async getHtmlFromTemplate(templateData: TemplateData): Promise<string> {
    try {
      // read the file
      const file = await readFile(`./templates/${templateData.fileName}.mjml`, { encoding: "utf-8" })
      // pass it through mjml to produce html template
      const result = mjml(file)
      // compile the handlebar template
      const template = Handlebars.compile(result.html)
      // build the final html
      return template(templateData.data)
    } catch (err) {
      Logger.error(`can not get html from template=${templateData.fileName}`, err)
      throw err
    }
  }
}
