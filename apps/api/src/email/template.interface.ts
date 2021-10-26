export type TemplateName = 'welcome' | 'inquiry-received' | 'welcome-internal' | 'inquiry-received-internal'
export interface TemplateData {
  name: TemplateName
  data: unknown
}
