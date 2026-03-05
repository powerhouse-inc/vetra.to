export type CloudProject = {
  id: string
  title: string
  description: string
  environments: CloudEnvironment[]
}

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
