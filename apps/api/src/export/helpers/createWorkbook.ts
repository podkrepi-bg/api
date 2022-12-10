import excelJs from 'exceljs'
import { ExportableData } from './exportableData'
import { Template } from './exportableData'

const applySheetDataToRows = (sheet, data: ExportableData) => {
  data.forEach((el) => {
    sheet.addRow(el)
  })
}

const handleHeadersRowStyle = (header, style) => {
  header.font = style?.font
  header.alignment = style?.alignment
  header.height = style?.height
}

const handleBodyRowsStyle = (sheet, style) => {
  let rowIndex = 2
  for (rowIndex; rowIndex <= sheet.rowCount; rowIndex++) {
    const currentRow = sheet.getRow(rowIndex)
    currentRow.alignment = style?.alignment
  }
}

export const createWorkbook = (data: ExportableData, template: Template) => {
  const workbook = new excelJs.Workbook()
  template.sheets.forEach((sheet) => {
    const { title, columns, style } = sheet

    const currentSheet = workbook.addWorksheet(title)
    currentSheet.columns = columns

    applySheetDataToRows(currentSheet, data)

    const headerRow = currentSheet.getRow(1)
    handleHeadersRowStyle(headerRow, style.header)

    handleBodyRowsStyle(currentSheet, style.body)
  })

  return workbook
}
