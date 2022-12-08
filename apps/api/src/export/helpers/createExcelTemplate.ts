import { Column, Alignment, Style } from 'exceljs'

type NonEmptyArray<T> = [T, ...T[]]

export type ExcelColumns = NonEmptyArray<Column>

type Sheet = {
  title?: string
  alignment?: Alignment
  bodyStyle: Style | null
  headerStyle?: Style
  columns: ExcelColumns
}

export type Template = {
  sheets: Sheet[]
  fileName?: string
}

type Styles = {
  header: Style | null
  body: Style | null
}

const defaultHeaderStyle = {
  font: { size: 16 },
  alignment: {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: false,
  } as Alignment,
  height: 20,
}

const defaultBodyStyle = {
  alignment: {
    vertical: 'middle',
    horizontal: 'center',
    wrapText: false,
  } as Alignment,
}

export const createExcelTemplate = (columns: ExcelColumns, styles?: Styles | null): Template => {
  return {
    sheets: [
      {
        title: '',
        bodyStyle: styles?.body || defaultBodyStyle,
        headerStyle: styles?.header || defaultHeaderStyle,
        columns,
      },
    ],
  }
}
