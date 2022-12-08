import { ExportableData } from '@prisma/client'
import { ExcelColumns } from './createExcelTemplate'

const donationsDefaultCellWidth = 30

const exportableDataColumns = {
  donations: {
    columns: [
      { header: 'Created At', key: 'createdAt', width: donationsDefaultCellWidth },
      { header: 'Status', key: 'status', width: donationsDefaultCellWidth },
      { header: 'Amount', key: 'amount', width: donationsDefaultCellWidth },
      { header: 'Currency', key: 'currency', width: donationsDefaultCellWidth },
      { header: 'Person', key: 'person', width: donationsDefaultCellWidth },
    ],
    style: {},
  },
}

type ValidTableNames = keyof typeof exportableDataColumns

const mapDataToExcelDefaultColumns = (data: ExportableData): ExcelColumns => {
  const headers = Object.keys(data[0])
  const columns = headers.map((key) => ({
    header: key.charAt(0).toLocaleUpperCase() + key.slice(1),
    key,
    width: donationsDefaultCellWidth,
  }))
  return columns as ExcelColumns
}

export const getAllColumns = (data: ExportableData): ExcelColumns => {
  return mapDataToExcelDefaultColumns(data)
}

export const getSpecificTableColumns = (table: ValidTableNames): ExcelColumns => {
  return exportableDataColumns[table].columns as unknown as ExcelColumns
}
