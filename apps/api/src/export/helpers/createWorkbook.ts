import excelJs from 'exceljs'
import { ExportableData } from '@prisma/client'
import { Template } from './createExcelTemplate'

const applySheetDataToRows = (sheet, data: ExportableData) => {
  data.forEach((el) => {
    sheet.addRow(el)
  })
}

const handleHeadersRowStyle = (header, style) => {
  header.font = style.font
  header.alignment = style.alignment
  header.height = style.height
}

const handleBodyRowsStyle = (sheet, style) => {
  let rowIndex = 2
  const { alignment  } = style
  for (rowIndex; rowIndex <= sheet.rowCount; rowIndex++) {
    const currentRow = sheet.getRow(rowIndex)
    currentRow.alignment = alignment
  }
}

export const createWorkbook = (data: ExportableData, template: Template) => {
  const workbook = new excelJs.Workbook()
  template.sheets.forEach((sheet) => {
    const { title, columns, headerStyle, bodyStyle } = sheet

    const currentSheet = workbook.addWorksheet(title)
    currentSheet.columns = columns

    applySheetDataToRows(currentSheet, data)

    const headerRow = currentSheet.getRow(1)
    handleHeadersRowStyle(headerRow, headerStyle)

    handleBodyRowsStyle(currentSheet, bodyStyle)
  })

  return workbook
}
