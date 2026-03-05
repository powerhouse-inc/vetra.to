import { CloudProject } from './types'

const CLOUD_PROJECTS: CloudProject[] = [
  {
    id: 'default',
    title: 'Frontend',
    description: 'Our server instances for frontends',
  },
  {
    id: 'eth-1',
    title: 'Ethereum nodes',
    description: 'Our running mainnet nodes for Ethereum.',
  },
  {
    id: 'sol-1',
    title: 'Solana nodes',
    description: 'Our running mainnet nodes for Solana.',
  },
  {
    id: 'indexer-1',
    title: 'Ethereum indexer',
    description: 'Web crawler indexing ethereum',
  },
]

export function getProject(id: string): CloudProject | undefined {
  return CLOUD_PROJECTS.find((el) => el.id === id)
}

export function getProjects(): CloudProject[] {
  return CLOUD_PROJECTS
}
