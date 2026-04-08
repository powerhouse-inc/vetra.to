/**
 * Mock API for Cloud Environment Development
 * 
 * This file provides mock implementations of all cloud environment GraphQL operations.
 * It simulates the real API behavior for UX/UI development and testing.
 * 
 * To use: Set NEXT_PUBLIC_USE_MOCK_CLOUD_API=true in your .env file
 */

import type { CloudEnvironment, CloudEnvironmentServiceType } from './types'

// Mock configuration
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_CLOUD_API === 'true'

// Simulate network delays
const MOCK_DELAY_MS = 500

// Mock data store
const mockEnvironments: CloudEnvironment[] = [
  {
    id: 'mock-env-1',
    name: 'Development Environment',
    documentType: 'powerhouse/vetra-cloud-environment',
    createdAtUtcIso: '2024-01-01T00:00:00Z',
    lastModifiedAtUtcIso: '2024-01-15T10:30:00Z',
    revision: 5,
    state: {
      label: 'Development Environment',
      genericSubdomain: 'dev-env-abc123',
      genericBaseDomain: 'vetra.io',
      customDomain: {
        enabled: false,
        domain: null,
        dnsRecords: []
      },
      defaultPackageRegistry: 'https://registry.dev.vetra.io',
      status: 'READY',
      services: [
        {
          type: 'CONNECT',
          prefix: 'connect',
          enabled: true,
          url: 'https://connect.dev-env-abc123.vetra.io',
          status: 'ACTIVE',
          version: '1.2.0'
        }
      ],
      packages: [
        {
          registry: 'https://registry.dev.vetra.io',
          name: '@powerhousedao/powerhouse',
          version: '1.0.0'
        }
      ]
    }
  },
  {
    id: 'mock-env-2',
    name: 'Staging Environment',
    documentType: 'powerhouse/vetra-cloud-environment',
    createdAtUtcIso: '2024-01-10T00:00:00Z',
    lastModifiedAtUtcIso: '2024-01-20T14:20:00Z',
    revision: 3,
    state: {
      label: 'Staging Environment',
      genericSubdomain: 'staging-env-xyz789',
      genericBaseDomain: 'vetra.io',
      customDomain: {
        enabled: true,
        domain: 'staging.mycompany.com',
        dnsRecords: [
          { type: 'CNAME', host: 'staging.mycompany.com', value: 'staging-env-xyz789.vetra.io' }
        ]
      },
      defaultPackageRegistry: 'https://registry.dev.vetra.io',
      status: 'READY',
      services: [
        {
          type: 'CONNECT',
          prefix: 'connect',
          enabled: true,
          url: 'https://connect.staging.mycompany.com',
          status: 'ACTIVE',
          version: '1.2.1'
        }
      ],
      packages: []
    }
  },
  {
    id: 'mock-env-3',
    name: 'Test Environment (Pending Changes)',
    documentType: 'powerhouse/vetra-cloud-environment',
    createdAtUtcIso: '2024-01-20T00:00:00Z',
    lastModifiedAtUtcIso: '2024-01-22T16:45:00Z',
    revision: 2,
    state: {
      label: 'Test Environment (Pending Changes)',
      genericSubdomain: 'test-env-pending123',
      genericBaseDomain: 'vetra.io',
      customDomain: {
        enabled: false,
        domain: null,
        dnsRecords: []
      },
      defaultPackageRegistry: 'https://registry.dev.vetra.io',
      status: 'CHANGES_PENDING',
      services: [
        {
          type: 'CONNECT',
          prefix: 'connect',
          enabled: true,
          url: 'https://connect.test-env-pending123.vetra.io',
          status: 'ACTIVE',
          version: '1.1.5'
        }
      ],
      packages: [
        {
          registry: 'https://registry.dev.vetra.io',
          name: '@powerhousedao/sample-app',
          version: '2.0.0'
        }
      ]
    }
  }
]

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const generateId = () => `mock-env-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

// Mock API functions
export const mockCreateEnvironment = async (name: string): Promise<CloudEnvironment> => {
  await delay(MOCK_DELAY_MS)
  
  const newEnvironment: CloudEnvironment = {
    id: generateId(),
    name,
    documentType: 'powerhouse/vetra-cloud-environment',
    createdAtUtcIso: new Date().toISOString(),
    lastModifiedAtUtcIso: new Date().toISOString(),
    revision: 1,
    state: {
      label: name,
      genericSubdomain: null,
      genericBaseDomain: null,
      customDomain: {
        enabled: false,
        domain: null,
        dnsRecords: []
      },
      defaultPackageRegistry: null,
      status: 'DRAFT',
      services: [],
      packages: []
    }
  }
  
  mockEnvironments.push(newEnvironment)
  return newEnvironment
}

export const mockSetLabel = async (docId: string, label: string): Promise<CloudEnvironment> => {
  await delay(MOCK_DELAY_MS)
  
  const env = mockEnvironments.find(e => e.id === docId)
  if (!env) {
    throw new Error(`Environment ${docId} not found`)
  }
  
  env.state.label = label
  env.name = label
  env.lastModifiedAtUtcIso = new Date().toISOString()
  env.revision += 1
  
  return env
}

export const mockInitializeEnvironment = async (
  docId: string,
  genericSubdomain: string,
  genericBaseDomain: string,
  defaultPackageRegistry?: string | null
): Promise<CloudEnvironment> => {
  await delay(MOCK_DELAY_MS)
  
  const env = mockEnvironments.find(e => e.id === docId)
  if (!env) {
    throw new Error(`Environment ${docId} not found`)
  }
  
  env.state.genericSubdomain = genericSubdomain
  env.state.genericBaseDomain = genericBaseDomain
  env.state.defaultPackageRegistry = defaultPackageRegistry || null
  env.state.status = 'DEPLOYING'
  env.lastModifiedAtUtcIso = new Date().toISOString()
  env.revision += 1
  
  // Simulate initialization completing
  setTimeout(() => {
    env.state.status = 'READY'
  }, 2000)
  
  return env
}

export const mockEnableService = async (
  docId: string,
  type: CloudEnvironmentServiceType,
  prefix: string
): Promise<CloudEnvironment> => {
  await delay(MOCK_DELAY_MS)
  
  const env = mockEnvironments.find(e => e.id === docId)
  if (!env) {
    throw new Error(`Environment ${docId} not found`)
  }
  
  // Remove existing service of same type
  env.state.services = env.state.services.filter(s => s.type !== type)
  
  // Add new service
  const baseUrl = env.state.customDomain?.enabled && env.state.customDomain.domain
    ? `https://${prefix}.${env.state.customDomain.domain}`
    : env.state.genericSubdomain
    ? `https://${prefix}.${env.state.genericSubdomain}.${env.state.genericBaseDomain}`
    : null
  
  env.state.services.push({
    type,
    prefix,
    enabled: true,
    url: baseUrl,
    status: 'ACTIVE',
    version: '1.2.0'
  })
  
  env.lastModifiedAtUtcIso = new Date().toISOString()
  env.revision += 1
  
  return env
}

export const mockFetchEnvironments = async (): Promise<CloudEnvironment[]> => {
  await delay(MOCK_DELAY_MS)
  return [...mockEnvironments]
}

export const mockFetchEnvironment = async (id: string): Promise<CloudEnvironment | null> => {
  await delay(MOCK_DELAY_MS)
  return mockEnvironments.find(e => e.id === id) || null
}

// Export checker function
export const shouldUseMockAPI = () => USE_MOCK_API

// Helper function to change environment status for testing
export const mockChangeEnvironmentStatus = (envId: string, newStatus: any) => {
  const env = mockEnvironments.find(e => e.id === envId)
  if (env) {
    env.state.status = newStatus
    env.lastModifiedAtUtcIso = new Date().toISOString()
    env.revision += 1
    console.log(`🔄 Mock: Changed environment ${envId} status to ${newStatus}`)
  }
  return env
}

// Console logging for debugging
if (USE_MOCK_API) {
  console.log('🚧 Using Mock Cloud API for development')
  console.log('📝 Available test environments:')
  mockEnvironments.forEach(env => {
    console.log(`  - ${env.name} (${env.id}) - Status: ${env.state.status}`)
  })
  console.log('💡 To change status for testing: mockChangeEnvironmentStatus("mock-env-1", "CHANGES_PENDING")')
}