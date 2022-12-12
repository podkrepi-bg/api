import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Response } from 'express'
import { createWorkbook } from './helpers/createWorkbook'
import { ExportableData } from './helpers/exportableData'
import { Template } from './helpers/exportableData'

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  exportToExcel = async (res: Response, data: ExportableData, template: Template) => {
    if (!data.length) res.status(404).end('No data to export')

    try {
      const workbook = createWorkbook(data, template)

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment;',
      })

      workbook.xlsx.write(res).then(() => {
        res.status(200).end()
      })
    } catch (err) {
      throw new Error(err)
    }
  }
}
