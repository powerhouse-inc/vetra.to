import { CloudProject } from './types'

const CLOUD_PROJECTS: CloudProject[] = [
  {
    id: 'default',
    title: 'Frontend',
    description: 'Our server instances for frontends',
    environments: [
      {
        id: 'frontend-1',
        projectId: 'default',
        address: '127.0.0.1',
        packages: 'nginx',
        resources: '1gb',
        label: 'default',
        admin: 'admin',
        backup: true,
      },
      {
        id: 'frontend-2',
        projectId: 'default',
        address: '127.0.0.2',
        packages: 'nginx',
        resources: '1gb',
        label: 'default',
        admin: 'admin',
        backup: true,
      },
    ],
  },
  {
    id: 'eth-1',
    title: 'Ethereum nodes',
    description: 'Our running mainnet nodes for Ethereum.',
    environments: [
      {
        id: 'eth-1',
        projectId: 'eth-1',
        address: '127.0.0.1',
        packages: 'nginx',
        resources: '1gb',
        label: 'default',
        admin: 'admin',
        backup: true,
      },
    ],
  },
  {
    id: 'sol-1',
    title: 'Solana nodes',
    description: 'Our running mainnet nodes for Solana.',
    environments: [
      {
        id: 'sol-1',
        projectId: 'sol-1',
        address: '127.0.0.1',
        packages: 'nginx',
        resources: '1gb',
        label: 'default',
        admin: 'admin',
        backup: true,
      },
    ],
  },
  {
    id: 'indexer-1',
    title: 'Ethereum indexer',
    description: 'Web crawler indexing ethereum',
    environments: [
      {
        id: 'indexer-1',
        projectId: 'indexer-1',
        address: '127.0.0.1',
        packages: 'nginx',
        resources: '1gb',
        label: 'default',
        admin: 'admin',
        backup: true,
      },
      {
        id: 'indexer-2',
        projectId: 'indexer-1',
        address: '127.0.0.2',
        packages: 'nginx',
        resources: '1gb',
        label: 'default',
        admin: 'admin',
        backup: true,
      },
    ],
  },
]

export function getProject(id: string): CloudProject | undefined {
  return CLOUD_PROJECTS.find((el) => el.id === id)
}

export function getProjects(): CloudProject[] {
  return CLOUD_PROJECTS
}
