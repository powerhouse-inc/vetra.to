export type CloudEnvironment = {
  id: string
  name: string
  documentType: string
  revision: number
  createdAtUtcIso: string
  lastModifiedAtUtcIso: string
  state: {
    name: string | null
    services: string[]
    packages: Array<{ name: string; version: string | null }> | null
    status: string
  }
}

export type OptionValue = [value: string, label: string]

export type CloudEnvironmentFormValues = {
  address: string
  packages: OptionValue[]
  resources: OptionValue[]
  label: OptionValue[]
  admin: OptionValue[]
  backup: boolean
}
