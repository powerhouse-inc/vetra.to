import { CloudProject, OptionValue } from './types'

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
        resources: 'small',
        label: 'default',
        admin: 'admin',
        backup: true,
      },
      {
        id: 'frontend-2',
        projectId: 'default',
        address: '127.0.0.2',
        packages: 'nginx',
        resources: 'small',
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
        resources: 'medium',
        label: 'production',
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
        packages: 'apache',
        resources: 'large',
        label: 'production',
        admin: 'root',
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
        packages: 'postgresql',
        resources: 'x-large',
        label: 'staging',
        admin: 'user',
        backup: false,
      },
      {
        id: 'indexer-2',
        projectId: 'indexer-1',
        address: '127.0.0.2',
        packages: 'mongodb',
        resources: '2x-large',
        label: 'development',
        admin: 'admin',
        backup: true,
      },
    ],
  },
]

const CLOUD_ENVIRONMENTS_PACKAGES: OptionValue[] = [
  ['nginx', 'Nginx'],
  ['apache', 'Apache'],
  ['mysql', 'MySQL'],
  ['postgresql', 'PostgreSQL'],
  ['mongodb', 'MongoDB'],
  ['redis', 'Redis'],
]

const CLOUD_ENVIRONMENTS_RESOURCES: OptionValue[] = [
  ['micro', 'Micro (512MB, 1vCPU)'],
  ['small', 'Small (1GB, 1vCPU)'],
  ['medium', 'Medium (2GB, 2vCPU)'],
  ['large', 'Large (4GB, 4vCPU)'],
  ['x-large', 'X-Large (8GB, 8vCPU)'],
  ['2x-large', '2X-Large (16GB, 16vCPU)'],
  ['4x-large', '4X-Large (32GB, 32vCPU)'],
  ['8x-large', '8X-Large (64GB, 64vCPU)'],
  ['16x-large', '16X-Large (128GB, 128vCPU)'],
  ['32x-large', '32X-Large (256GB, 256vCPU)'],
  ['64x-large', '64X-Large (512GB, 512vCPU)'],
  ['128x-large', '128X-Large (1024GB, 1024vCPU)'],
]

const CLOUD_ENVIRONMENTS_LABELS: OptionValue[] = [
  ['default', 'Default'],
  ['production', 'Production'],
  ['staging', 'Staging'],
  ['development', 'Development'],
]

const CLOUD_ENVIRONMENTS_ADMINS: OptionValue[] = [
  ['admin', 'Admin'],
  ['user', 'User'],
  ['root', 'Root'],
]

export function getProject(id: string): CloudProject | undefined {
  return CLOUD_PROJECTS.find((el) => el.id === id)
}

export function getProjects(): CloudProject[] {
  return CLOUD_PROJECTS
}

export function getEnvironmentFormValues() {
  return {
    address: '',
    packages: CLOUD_ENVIRONMENTS_PACKAGES,
    resources: CLOUD_ENVIRONMENTS_RESOURCES,
    label: CLOUD_ENVIRONMENTS_LABELS,
    admin: CLOUD_ENVIRONMENTS_ADMINS,
    backup: false,
  }
}
