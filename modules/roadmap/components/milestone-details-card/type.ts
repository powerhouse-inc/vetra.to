// TODO: delete this file once we have the actual types in the generatedgraphql schema

export type Maybe<T> = T | null

export interface OwnerRef {
  ref: string
  id: string
  name: string
  code: string
  imageUrl: string
}

export interface StoryPoints {
  __typename: 'StoryPoints'
  total: number
  completed: number
}

export interface Percentage {
  __typename: 'Percentage'
  value: number
}

export type Progress = StoryPoints | Percentage

export interface KeyResult {
  id: string
  title: string
  link: string
  parentIdRef?: string
}

export enum DeliverableStatus {
  WONT_DO = 'WONT_DO',
  DRAFT = 'DRAFT',
  TODO = 'TODO',
  BLOCKED = 'BLOCKED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
}

export interface BProject {
  code: string
  title: string
}

export interface BudgetAnchorProject {
  project: BProject
  workUnitBudget: number
  deliverableBudget: number
}

export interface MDeliverable {
  id: string
  title: string

  code: string
  description: string
  keyResults: KeyResult[]

  status: DeliverableStatus
  workProgress: Progress

  owner: OwnerRef
  budgetAnchor: BudgetAnchorProject
}

export interface Deliverable {
  id: string
  title: string

  code: string
  description: string
  keyResults: KeyResult[]
  supportedKeyResults: KeyResult[]

  status: DeliverableStatus
  progress: Progress

  owner: OwnerRef
  milestone: string
}

export interface IncrementedDeliverable extends Deliverable {
  milestoneOverride: Maybe<{
    roadmapSlug: string
    code: string
  }>
}

export const isMDeliverable = (
  deliverable: Deliverable | MDeliverable,
): deliverable is MDeliverable => 'workProgress' in deliverable

export enum ProgressStatus {
  DRAFT = 'DRAFT',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export interface DeliverableSet {
  deliverables: MDeliverable[]
  status: ProgressStatus
  progress: Maybe<Progress>
  totalDeliverables: Maybe<number>
  deliverablesCompleted: Maybe<number>
}

export interface Milestone {
  id: string
  sequenceCode: string
  code: string
  title: string
  abstract: string
  description: string
  targetDate: string
  scope: DeliverableSet
  coordinators: OwnerRef[]
  contributors: OwnerRef[]
}
