export type CloudProject = {
  id: string
  title: string
  description: string
  environments: CloudEnvironment[]
}

export type OptionValue = [value: string, label: string]

export type CloudEnvironment = {
  id: string
  projectId: string
  address: string
  packages: string
  resources: string
  label: string
  admin: string
  backup: boolean
}

export type CloudEnvironmentFormValues = {
  address: string
  packages: OptionValue[]
  resources: OptionValue[]
  label: OptionValue[]
  admin: OptionValue[]
  backup: boolean
}
