import { Donation, Campaign, BankTransaction } from '@prisma/client'
import { Column, Alignment, Style } from 'exceljs'

type NonEmptyArray<T> = [T, ...T[]]

export type ExportableData = Donation[] | Campaign[] | BankTransaction[]

export type ExcelColumns = NonEmptyArray<Column>

type Sheet = {
  title?: string
  alignment?: Alignment
  style: {
    header?: Style
    body?: Style
  }
  columns: ExcelColumns
}

export type Template = {
  sheets: Sheet[]
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

const donationsDefaultCellWidth = 30

const exportableData = {
  donations: {
    sheets: [
      {
        title: 'Donations',
        columns: [
          {
            header: 'Created At',
            key: 'createdAt',
            width: donationsDefaultCellWidth,
            style: { numFmt: 'YYYY-MM-DD hh:mm:ss' },
          },
          { header: 'Status', key: 'status', width: donationsDefaultCellWidth },
          {
            header: 'Amount',
            key: 'amount',
            width: donationsDefaultCellWidth,
            style: { numFmt: '#,##0.00' },
          },
          { header: 'Currency', key: 'currency', width: donationsDefaultCellWidth },
          { header: 'Person', key: 'person', width: donationsDefaultCellWidth },
          { header: 'Email', key: 'email', width: donationsDefaultCellWidth },
          { header: 'BillingName', key: 'billingName', width: donationsDefaultCellWidth },
          { header: 'BillingEmail', key: 'billingEmail', width: donationsDefaultCellWidth },
          { header: 'Payment Provider', key: 'provider', width: donationsDefaultCellWidth },
          { header: 'Campaign ID', key: 'campaignId', width: donationsDefaultCellWidth },
        ],
        style: {
          header: defaultHeaderStyle,
          body: defaultBodyStyle,
        },
      },
    ],
  },
  bankTransactions: {
    sheets: [
      {
        title: 'Bank Transactions',
        columns: [
          { header: 'Transaction ID', key: 'id', width: donationsDefaultCellWidth },
          { header: 'Account IBAN', key: 'ibanNumber', width: donationsDefaultCellWidth },
          { header: 'Bank Name', key: 'bankName', width: donationsDefaultCellWidth },
          {
            header: 'Transaction Date',
            key: 'transactionDate',
            width: donationsDefaultCellWidth,
          },
          { header: 'Transaction Type', key: 'type', width: donationsDefaultCellWidth },
          { header: 'Sender Name', key: 'senderName', width: donationsDefaultCellWidth },
          { header: 'Sender IBAN', key: 'senderIban', width: donationsDefaultCellWidth },
          { header: 'Recipient Name', key: 'recipientName', width: donationsDefaultCellWidth },
          { header: 'Recipient IBAN', key: 'recipientIban', width: donationsDefaultCellWidth },
          { header: 'Amount', key: 'amount', width: donationsDefaultCellWidth },
          { header: 'Currency', key: 'currency', width: donationsDefaultCellWidth },
          { header: 'Description', key: 'description', width: donationsDefaultCellWidth + 20 },
          {
            header: 'Bank Donation Status',
            key: 'bankDonationStatus',
            width: donationsDefaultCellWidth,
          },
        ],
        style: {
          header: defaultHeaderStyle,
          body: defaultBodyStyle,
        },
      },
    ],
  },
}

type ValidTableNames = keyof typeof exportableData

export const getDefaultTemplateAllColumns = (data: ExportableData): Template => {
  const headers = Object.keys(data[0])
  const columns = headers.map((key) => ({
    header: key.charAt(0).toLocaleUpperCase() + key.slice(1),
    key,
    width: donationsDefaultCellWidth,
  }))

  const template = {
    sheets: [
      {
        title: 'Default',
        columns,
        style: {
          header: defaultHeaderStyle,
          body: defaultBodyStyle,
        },
      },
    ],
  }

  return template as unknown as Template
}

export const getTemplateByTable = (table: ValidTableNames): Template => {
  return exportableData[table] as unknown as Template
}
