/* eslint-disable */
// @ts-nocheck
import { useQuery, useSuspenseQuery, UseQueryOptions, UseSuspenseQueryOptions } from '@tanstack/react-query';
import { fetcher } from '@/shared/lib/fetcher';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };

type FetchOptions = {
cache?: RequestCache;
next?: NextFetchRequestConfig;
};

            type RequestInit = {
              headers: (HeadersInit & FetchOptions) | FetchOptions;
            };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Amount: { input: any; output: any; }
  Amount_Crypto: { input: any; output: any; }
  Amount_Currency: { input: any; output: any; }
  Amount_Fiat: { input: any; output: any; }
  Amount_Money: { input: any; output: any; }
  Amount_Percentage: { input: any; output: any; }
  Amount_Tokens: { input: any; output: any; }
  Currency: { input: any; output: any; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  EmailAddress: { input: any; output: any; }
  EthereumAddress: { input: any; output: any; }
  JSONObject: { input: any; output: any; }
  OID: { input: any; output: any; }
  OLabel: { input: any; output: any; }
  PHID: { input: any; output: any; }
  URL: { input: any; output: any; }
  Unknown: { input: any; output: any; }
};

export type AddDriveResult = {
  __typename?: 'AddDriveResult';
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  preferredEditor?: Maybe<Scalars['String']['output']>;
  slug: Scalars['String']['output'];
};

export type AnalyticsFilter = {
  currency?: InputMaybe<Scalars['String']['input']>;
  /** List of dimensions to filter by, such as 'budget' or 'project' */
  dimensions?: InputMaybe<Array<InputMaybe<AnalyticsFilterDimension>>>;
  end?: InputMaybe<Scalars['String']['input']>;
  /** Period to group by */
  granularity?: InputMaybe<AnalyticsGranularity>;
  /** List of metrics to filter by, such as 'budget' or 'actuals' */
  metrics?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  start?: InputMaybe<Scalars['String']['input']>;
};

export type AnalyticsFilterDimension = {
  lod: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  select: Scalars['String']['input'];
};

export enum AnalyticsGranularity {
  Annual = 'annual',
  Daily = 'daily',
  Hourly = 'hourly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
  SemiAnnual = 'semiAnnual',
  Total = 'total',
  Weekly = 'weekly'
}

export type AnalyticsPeriod = {
  __typename?: 'AnalyticsPeriod';
  end?: Maybe<Scalars['DateTime']['output']>;
  period?: Maybe<Scalars['String']['output']>;
  rows?: Maybe<Array<Maybe<AnalyticsSeries>>>;
  start?: Maybe<Scalars['DateTime']['output']>;
};

export type AnalyticsQuery = {
  __typename?: 'AnalyticsQuery';
  currencies?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  dimensions?: Maybe<Array<Maybe<Dimension>>>;
  metrics?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  multiCurrencySeries?: Maybe<Array<Maybe<AnalyticsPeriod>>>;
  series?: Maybe<Array<Maybe<AnalyticsPeriod>>>;
};


export type AnalyticsQueryMultiCurrencySeriesArgs = {
  filter?: InputMaybe<MultiCurrencyConversions>;
};


export type AnalyticsQuerySeriesArgs = {
  filter?: InputMaybe<AnalyticsFilter>;
};

export type AnalyticsSeries = {
  __typename?: 'AnalyticsSeries';
  dimensions?: Maybe<Array<Maybe<AnalyticsSeriesDimension>>>;
  metric?: Maybe<Scalars['String']['output']>;
  sum?: Maybe<Scalars['Float']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['Float']['output']>;
};

export type AnalyticsSeriesDimension = {
  __typename?: 'AnalyticsSeriesDimension';
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  path?: Maybe<Scalars['String']['output']>;
};

export type AtlasExploratory = IDocument & {
  __typename?: 'AtlasExploratory';
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: AtlasExploratory_AtlasExploratoryState;
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: AtlasExploratory_AtlasExploratoryState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type AtlasExploratoryOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: AtlasExploratory */
export type AtlasExploratoryQueries = {
  __typename?: 'AtlasExploratoryQueries';
  getDocument?: Maybe<AtlasExploratory>;
  getDocuments?: Maybe<Array<AtlasExploratory>>;
};


/** Queries: AtlasExploratory */
export type AtlasExploratoryQueriesGetDocumentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
};

/** Subgraph definition for AtlasExploratory (sky/atlas-exploratory) */
export type AtlasExploratoryState = {
  __typename?: 'AtlasExploratoryState';
  /** Additional commentary and context for guidance. */
  additionalGuidance: Scalars['String']['output'];
  /**
   * The type of the Exploratory document within Atlas.
   * Example: Tenet, Original Context Data, Active Data.
   */
  atlasType: EAtlasType;
  /** Entire content body of the Exploratory document within Atlas. */
  content?: Maybe<Scalars['String']['output']>;
  /** Unique document number assigned to the Exploratory document within Atlas. */
  docNo?: Maybe<Scalars['String']['output']>;
  /** Alignmnet boolean findings. */
  findings: Finding;
  /** Document tags managed by the Atlas Axis facilitator group for classification. */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status of the Exploratory document as managed by the Atlas Axis facilitator group. */
  masterStatus: EStatus;
  /** Full name of the Exploratory document entity. */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Original Notion document ID of the Exploratory document.
   * Used for cross-system referencing and linking back to the original Notion source.
   */
  notionId?: Maybe<Scalars['String']['output']>;
  /** List of Atlas documents that were relevant for the creation of this Exploratory document. */
  originalContextData: Array<Scalars['String']['output']>;
  /**
   * Parent entity that this Exploratory document belongs to.
   * This is a reference to another Atlas document.
   */
  parent: EDocumentLink;
};

/** Module: Context */
export type AtlasExploratory_AddContextDataInput = {
  id: Scalars['String']['input'];
};

/** Module: Tags */
export type AtlasExploratory_AddTagsInput = {
  newTags: Array<Scalars['String']['input']>;
};

export type AtlasExploratory_AtlasExploratoryState = {
  __typename?: 'AtlasExploratory_AtlasExploratoryState';
  /** Additional commentary and context for guidance.  */
  additionalGuidance: Scalars['String']['output'];
  /**
   * The type AtlasExploratory_of the Exploratory document within Atlas.
   * Example: Tenet, Original Context Data, Active Data.
   */
  atlasType: AtlasExploratory_EAtlasType;
  /** Entire content body AtlasExploratory_of the Exploratory document within Atlas. */
  content?: Maybe<Scalars['String']['output']>;
  /** Unique document number assigned to the Exploratory document within Atlas. */
  docNo?: Maybe<Scalars['String']['output']>;
  /** Alignmnet boolean findings.  */
  findings: AtlasExploratory_Finding;
  /** Document tags managed by the Atlas Axis facilitator group for classification.   */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status AtlasExploratory_of the Exploratory document as managed by the Atlas Axis facilitator group.   */
  masterStatus: AtlasExploratory_EStatus;
  /** Full name AtlasExploratory_of the Exploratory document entity.   */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Original Notion document ID AtlasExploratory_of the Exploratory document.
   * Used for cross-system referencing and linking back to the original Notion source.
   */
  notionId?: Maybe<Scalars['String']['output']>;
  /** List AtlasExploratory_of Atlas documents that were relevant for the creation AtlasExploratory_of this Exploratory document.   */
  originalContextData: Array<Scalars['String']['output']>;
  /**
   * Parent entity that this Exploratory document belongs to.
   * This is a reference to another Atlas document.
   */
  parent: AtlasExploratory_EDocumentLink;
};

/** Domain (i.e., Atlas) specific document types with the same document model global schema.   */
export enum AtlasExploratory_EAtlasType {
  Scenario = 'SCENARIO',
  ScenarioVariation = 'SCENARIO_VARIATION'
}

export type AtlasExploratory_EDocumentLink = {
  __typename?: 'AtlasExploratory_EDocumentLink';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

/** Defines the lifecycle stage AtlasExploratory_of the Exploratory document within Atlas.   */
export enum AtlasExploratory_EStatus {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

/** Reference to a document within Atlas with optional name and document number for display reasons.  */
export type AtlasExploratory_Finding = {
  __typename?: 'AtlasExploratory_Finding';
  isAligned: Scalars['Boolean']['output'];
};

export type AtlasExploratory_RemoveContextDataInput = {
  id: Scalars['String']['input'];
};

export type AtlasExploratory_RemoveTagsInput = {
  tags: Array<Scalars['String']['input']>;
};

export type AtlasExploratory_ReplaceContextDataInput = {
  id: Scalars['String']['input'];
  prevId: Scalars['String']['input'];
};

export type AtlasExploratory_SetAdditionalGuidanceInput = {
  additionalGuidance: Scalars['String']['input'];
};

export type AtlasExploratory_SetAtlasTypeInput = {
  atlasType: EAtlasType;
};

export type AtlasExploratory_SetContentInput = {
  content: Scalars['String']['input'];
};

export type AtlasExploratory_SetDocNumberInput = {
  docNo?: InputMaybe<Scalars['String']['input']>;
};

/** Module: General */
export type AtlasExploratory_SetExploratoryNameInput = {
  name: Scalars['String']['input'];
};

export type AtlasExploratory_SetFindingsInput = {
  isAligned: Scalars['Boolean']['input'];
};

export type AtlasExploratory_SetMasterStatusInput = {
  masterStatus: EStatus;
};

export type AtlasExploratory_SetNotionIdInput = {
  notionID?: InputMaybe<Scalars['String']['input']>;
};

export type AtlasExploratory_SetParentInput = {
  docNo?: InputMaybe<Scalars['String']['input']>;
  documentType?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['PHID']['input'];
  title?: InputMaybe<Scalars['OLabel']['input']>;
};

export type AtlasFeedbackIssues = IDocument & {
  __typename?: 'AtlasFeedbackIssues';
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: AtlasFeedbackIssues_AtlasFeedbackIssuesState;
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: AtlasFeedbackIssues_AtlasFeedbackIssuesState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type AtlasFeedbackIssuesOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: AtlasFeedbackIssues */
export type AtlasFeedbackIssuesQueries = {
  __typename?: 'AtlasFeedbackIssuesQueries';
  getDocument?: Maybe<AtlasFeedbackIssues>;
  getDocuments?: Maybe<Array<AtlasFeedbackIssues>>;
};


/** Queries: AtlasFeedbackIssues */
export type AtlasFeedbackIssuesQueriesGetDocumentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
};

/** Subgraph definition for AtlasFeedbackIssues (makerdao/feedback-issues) */
export type AtlasFeedbackIssuesState = {
  __typename?: 'AtlasFeedbackIssuesState';
  /** The list of issues submitted to the Atlas. */
  issues: Array<Issue>;
};

export type AtlasFeedbackIssues_AddNotionIdInput = {
  notionId: Scalars['String']['input'];
  phid: Scalars['PHID']['input'];
};

export type AtlasFeedbackIssues_AtlasFeedbackIssuesState = {
  __typename?: 'AtlasFeedbackIssues_AtlasFeedbackIssuesState';
  /** The list of issues submitted to the Atlas. */
  issues: Array<AtlasFeedbackIssues_Issue>;
};

/**
 * Issues are comprised of Comments.
 *
 * When an AtlasFeedbackIssues_Issue is first created, it is empty and has no comments. Users can then submit comments which are associated with a given issue.
 *
 * A comment refers to a specific item from the Atlas. This field is required, but can be changed later.
 */
export type AtlasFeedbackIssues_Comment = {
  __typename?: 'AtlasFeedbackIssues_Comment';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  creatorAddress: Scalars['EthereumAddress']['output'];
  lastEditedAt: Scalars['DateTime']['output'];
  notionId: Scalars['String']['output'];
  phid: Scalars['PHID']['output'];
};

/** Module: Comments */
export type AtlasFeedbackIssues_CreateCommentInput = {
  content: Scalars['String']['input'];
  createdAt: Scalars['DateTime']['input'];
  issuePhid: Scalars['PHID']['input'];
  notionId: Scalars['String']['input'];
  phid: Scalars['PHID']['input'];
};

/** Module: Issues */
export type AtlasFeedbackIssues_CreateIssueInput = {
  createdAt: Scalars['DateTime']['input'];
  notionIds: Array<InputMaybe<Scalars['String']['input']>>;
  phid: Scalars['PHID']['input'];
};

export type AtlasFeedbackIssues_DeleteCommentInput = {
  issuePhid: Scalars['PHID']['input'];
  phid: Scalars['PHID']['input'];
};

export type AtlasFeedbackIssues_DeleteIssueInput = {
  phid: Scalars['PHID']['input'];
};

export type AtlasFeedbackIssues_EditCommentInput = {
  content?: InputMaybe<Scalars['String']['input']>;
  editedAt: Scalars['DateTime']['input'];
  issuePhid: Scalars['PHID']['input'];
  notionId?: InputMaybe<Scalars['String']['input']>;
  phid: Scalars['PHID']['input'];
};

/**
 * An issue that has been submitted to the Atlas.
 *
 * Holds a list of comments pertaining to specific items in the Atlas.
 *
 * Uses the same identifiers to register the relevant content as are used in the Atlas itself. These identifiers are the UUID's used by Notion, sometimes with a suffix of a part of the item's parent for cases where multiple parents exist.
 *
 * The relevant Notion IDs are separate from the Notion IDs referenced in the Comments themselves, because we might want to determine the scope of the AtlasFeedbackIssues_Issue's content before any actual comments are added yet.
 */
export type AtlasFeedbackIssues_Issue = {
  __typename?: 'AtlasFeedbackIssues_Issue';
  comments: Array<AtlasFeedbackIssues_Comment>;
  createdAt: Scalars['DateTime']['output'];
  creatorAddress: Scalars['EthereumAddress']['output'];
  notionIds: Array<Scalars['String']['output']>;
  phid: Scalars['PHID']['output'];
};

export type AtlasFeedbackIssues_RemoveNotionIdInput = {
  notionId: Scalars['String']['input'];
  phid: Scalars['PHID']['input'];
};

export type AtlasFoundation = IDocument & {
  __typename?: 'AtlasFoundation';
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: AtlasFoundation_AtlasFoundationState;
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: AtlasFoundation_AtlasFoundationState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type AtlasFoundationOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: AtlasFoundation */
export type AtlasFoundationQueries = {
  __typename?: 'AtlasFoundationQueries';
  getDocument?: Maybe<AtlasFoundation>;
  getDocuments?: Maybe<Array<AtlasFoundation>>;
};


/** Queries: AtlasFoundation */
export type AtlasFoundationQueriesGetDocumentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
};

/** Subgraph definition for AtlasFoundation (sky/atlas-foundation) */
export type AtlasFoundationState = {
  __typename?: 'AtlasFoundationState';
  /**
   * The type of the Foundation entity within Atlas.
   * Example: DAO, Governance Body, Research Hub, etc.
   */
  atlasType: FAtlasType;
  /** Entire content body of the Foundation document within Atlas. */
  content?: Maybe<Scalars['String']['output']>;
  /** Unique document number assigned to the Foundation document within Atlas. */
  docNo?: Maybe<Scalars['String']['output']>;
  /** Document tags managed by the Atlas Axis facilitator group for classification. */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status of the Foundation entity as managed by the Atlas Axis facilitator group. */
  masterStatus: FStatus;
  /** Full name of the Foundation entity. */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Original Notion document ID of the Foundation document.
   * Used for cross-system referencing and linking back to the original Notion source.
   */
  notionId?: Maybe<Scalars['String']['output']>;
  /** List of Atlas documents that were relevant for the creation of this Foundation document. */
  originalContextData: Array<Scalars['String']['output']>;
  /**
   * Parent entity that this Foundation belongs to.
   * This is a reference to another Atlas document.
   */
  parent?: Maybe<FDocumentLink>;
};

/** Module: Context */
export type AtlasFoundation_AddContextDataInput = {
  id: Scalars['String']['input'];
};

/** Module: Tags */
export type AtlasFoundation_AddTagsInput = {
  tags: Array<Scalars['String']['input']>;
};

export type AtlasFoundation_AtlasFoundationState = {
  __typename?: 'AtlasFoundation_AtlasFoundationState';
  /**
   * The type AtlasFoundation_of the Foundation entity within Atlas.
   * Example: DAO, Governance Body, Research Hub, etc.
   */
  atlasType: AtlasFoundation_FAtlasType;
  /** Entire content body AtlasFoundation_of the Foundation document within Atlas.  */
  content?: Maybe<Scalars['String']['output']>;
  /** Unique document number assigned to the Foundation document within Atlas. */
  docNo?: Maybe<Scalars['String']['output']>;
  /** Document tags managed by the Atlas Axis facilitator group for classification. */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status AtlasFoundation_of the Foundation entity as managed by the Atlas Axis facilitator group. */
  masterStatus: AtlasFoundation_FStatus;
  /** Full name AtlasFoundation_of the Foundation entity. */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Original Notion document ID AtlasFoundation_of the Foundation document.
   * Used for cross-system referencing and linking back to the original Notion source.
   */
  notionId?: Maybe<Scalars['String']['output']>;
  /** List AtlasFoundation_of Atlas documents that were relevant for the creation AtlasFoundation_of this Foundation document. */
  originalContextData: Array<Scalars['String']['output']>;
  /**
   * Parent entity that this Foundation belongs to.
   * This is a reference to another Atlas document.
   */
  parent?: Maybe<AtlasFoundation_FDocumentLink>;
};

/** Domain (i.e., Atlas) specific document types with the same document model global schema.  */
export enum AtlasFoundation_FAtlasType {
  ActiveDataController = 'ACTIVE_DATA_CONTROLLER',
  Article = 'ARTICLE',
  Core = 'CORE',
  Section = 'SECTION',
  TypeSpecification = 'TYPE_SPECIFICATION'
}

/** Reference to a document within Atlas with optional name and document number for display reasons.  */
export type AtlasFoundation_FDocumentLink = {
  __typename?: 'AtlasFoundation_FDocumentLink';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

export enum AtlasFoundation_FStatus {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

export type AtlasFoundation_RemoveContextDataInput = {
  id: Scalars['String']['input'];
};

export type AtlasFoundation_RemoveTagsInput = {
  tags: Array<Scalars['String']['input']>;
};

export type AtlasFoundation_ReplaceContextDataInput = {
  id: Scalars['String']['input'];
  prevId: Scalars['String']['input'];
};

export type AtlasFoundation_SetAtlasTypeInput = {
  atlasType: FAtlasType;
};

export type AtlasFoundation_SetContentInput = {
  content: Scalars['String']['input'];
};

export type AtlasFoundation_SetDocNumberInput = {
  docNo?: InputMaybe<Scalars['String']['input']>;
};

/** Module: General */
export type AtlasFoundation_SetFoundationNameInput = {
  name: Scalars['String']['input'];
};

export type AtlasFoundation_SetMasterStatusInput = {
  masterStatus: FStatus;
};

export type AtlasFoundation_SetNotionIdInput = {
  notionID: Scalars['String']['input'];
};

export type AtlasFoundation_SetParentInput = {
  docNo?: InputMaybe<Scalars['String']['input']>;
  documentType?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['PHID']['input'];
  title?: InputMaybe<Scalars['OLabel']['input']>;
};

export type AtlasGrounding = IDocument & {
  __typename?: 'AtlasGrounding';
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: AtlasGrounding_AtlasGroundingState;
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: AtlasGrounding_AtlasGroundingState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type AtlasGroundingOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: AtlasGrounding */
export type AtlasGroundingQueries = {
  __typename?: 'AtlasGroundingQueries';
  getDocument?: Maybe<AtlasGrounding>;
  getDocuments?: Maybe<Array<AtlasGrounding>>;
};


/** Queries: AtlasGrounding */
export type AtlasGroundingQueriesGetDocumentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
};

/** Subgraph definition for AtlasGrounding (sky/atlas-grounding) */
export type AtlasGroundingState = {
  __typename?: 'AtlasGroundingState';
  /**
   * The type of the Grounding document within Atlas.
   * Example: Tenet, Original Context Data, Active Data.
   */
  atlasType: GAtlasType;
  /** Entire content body of the Grounding document within Atlas. */
  content?: Maybe<Scalars['String']['output']>;
  /** Unique document number assigned to the Grounding document within Atlas. */
  docNo?: Maybe<Scalars['String']['output']>;
  /** Document tags managed by the Atlas Axis facilitator group for classification. */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status of the Grounding document as managed by the Atlas Axis facilitator group. */
  masterStatus: GStatus;
  /** Full name of the Grounding document entity. */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Original Notion document ID of the Grounding document.
   * Used for cross-system referencing and linking back to the original Notion source.
   */
  notionId?: Maybe<Scalars['String']['output']>;
  /** List of Atlas documents that were relevant for the creation of this Grounding document. */
  originalContextData: Array<Scalars['String']['output']>;
  /**
   * Parent entity that this Grounding document belongs to.
   * This is a reference to another Atlas document.
   */
  parent: GDocumentLink;
};

/** Module: Context */
export type AtlasGrounding_AddContextDataInput = {
  id: Scalars['String']['input'];
};

/** Module: Tags */
export type AtlasGrounding_AddTagsInput = {
  tags: Array<Scalars['String']['input']>;
};

export type AtlasGrounding_AtlasGroundingState = {
  __typename?: 'AtlasGrounding_AtlasGroundingState';
  /**
   * The type AtlasGrounding_of the Grounding document within Atlas.
   * Example: Tenet, Original Context Data, Active Data.
   */
  atlasType: AtlasGrounding_GAtlasType;
  /** Entire content body AtlasGrounding_of the Grounding document within Atlas.   */
  content?: Maybe<Scalars['String']['output']>;
  /** Unique document number assigned to the Grounding document within Atlas. */
  docNo?: Maybe<Scalars['String']['output']>;
  /** Document tags managed by the Atlas Axis facilitator group for classification.   */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status AtlasGrounding_of the Grounding document as managed by the Atlas Axis facilitator group.   */
  masterStatus: AtlasGrounding_GStatus;
  /** Full name AtlasGrounding_of the Grounding document entity.   */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Original Notion document ID AtlasGrounding_of the Grounding document.
   * Used for cross-system referencing and linking back to the original Notion source.
   */
  notionId?: Maybe<Scalars['String']['output']>;
  /** List AtlasGrounding_of Atlas documents that were relevant for the creation AtlasGrounding_of this Grounding document.   */
  originalContextData: Array<Scalars['String']['output']>;
  /**
   * Parent entity that this Grounding document belongs to.
   * This is a reference to another Atlas document.
   */
  parent: AtlasGrounding_GDocumentLink;
};

/** Domain (i.e., Atlas) specific document types with the same document model global schema.   */
export enum AtlasGrounding_GAtlasType {
  ActiveData = 'ACTIVE_DATA',
  OriginalContextData = 'ORIGINAL_CONTEXT_DATA',
  Tenet = 'TENET'
}

/** Reference to a document within Atlas with optional name and document number for display reasons.  */
export type AtlasGrounding_GDocumentLink = {
  __typename?: 'AtlasGrounding_GDocumentLink';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

/** Defines the lifecycle stage AtlasGrounding_of the Grounding document within Atlas.   */
export enum AtlasGrounding_GStatus {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

export type AtlasGrounding_RemoveContextDataInput = {
  id: Scalars['String']['input'];
};

export type AtlasGrounding_RemoveTagsInput = {
  tags: Array<Scalars['String']['input']>;
};

export type AtlasGrounding_ReplaceContextDataInput = {
  id: Scalars['String']['input'];
  prevId: Scalars['String']['input'];
};

export type AtlasGrounding_SetAtlasTypeInput = {
  atlasType: GAtlasType;
};

export type AtlasGrounding_SetContentInput = {
  content: Scalars['String']['input'];
};

export type AtlasGrounding_SetDocNumberInput = {
  docNo?: InputMaybe<Scalars['String']['input']>;
};

/** Module: General */
export type AtlasGrounding_SetGroundingNameInput = {
  name: Scalars['String']['input'];
};

export type AtlasGrounding_SetMasterStatusInput = {
  /** Add your inputs here */
  masterStatus: GStatus;
};

export type AtlasGrounding_SetNotionIdInput = {
  notionID: Scalars['String']['input'];
};

export type AtlasGrounding_SetParentInput = {
  docNo?: InputMaybe<Scalars['String']['input']>;
  documentType?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['PHID']['input'];
  title?: InputMaybe<Scalars['OLabel']['input']>;
};

export type AtlasMultiParent = IDocument & {
  __typename?: 'AtlasMultiParent';
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: AtlasMultiParent_AtlasMultiParentState;
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: AtlasMultiParent_AtlasMultiParentState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type AtlasMultiParentOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: AtlasMultiParent */
export type AtlasMultiParentQueries = {
  __typename?: 'AtlasMultiParentQueries';
  getDocument?: Maybe<AtlasMultiParent>;
  getDocuments?: Maybe<Array<AtlasMultiParent>>;
};


/** Queries: AtlasMultiParent */
export type AtlasMultiParentQueriesGetDocumentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
};

/** Subgraph definition for AtlasMultiParent (sky/atlas-multiparent) */
export type AtlasMultiParentState = {
  __typename?: 'AtlasMultiParentState';
  /**
   * The type of the MultiParent document within Atlas.
   * Example: Tenet, Original Context Data, Active Data.
   */
  atlasType: MAtlasType;
  /** Entire content body of the MultiParent document within Atlas. */
  content?: Maybe<Scalars['String']['output']>;
  /** Document tags managed by the Atlas Axis facilitator group for classification. */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status of the MultiParent document as managed by the Atlas Axis facilitator group. */
  masterStatus: MStatus;
  /** Full name of the MultiParent document entity. */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Original Notion document ID of the MultiParent document.
   * Used for cross-system referencing and linking back to the original Notion source.
   */
  notionId?: Maybe<Scalars['String']['output']>;
  /**
   *   List of Atlas documents that were relevant for the creation of this MultiParent document.
   *
   *   Should the subfields of the MDocumentLink object differ from the subfields of the MDocumentLink for Parent? Potentially we don't need docNo field.
   *
   * Change a subfield "name" to "title" in MDocumentLink object.
   *
   *
   *   type MDocumentCDLink {
   *   id: PHID!
   *   title: OLabel
   * }
   */
  originalContextData: Array<Scalars['String']['output']>;
  /**
   * Parent entity that this MultiParent document belongs to.
   * This is a reference to another Atlas document.
   */
  parents: Array<MDocumentLink>;
};

/** Module: Context */
export type AtlasMultiParent_AddContextDataInput = {
  id: Scalars['String']['input'];
};

export type AtlasMultiParent_AddParentInput = {
  docNo?: InputMaybe<Scalars['String']['input']>;
  documentType?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['PHID']['input'];
  title?: InputMaybe<Scalars['OLabel']['input']>;
};

/** Module: Tags */
export type AtlasMultiParent_AddTagsInput = {
  tags: Array<Scalars['String']['input']>;
};

export type AtlasMultiParent_AtlasMultiParentState = {
  __typename?: 'AtlasMultiParent_AtlasMultiParentState';
  /**
   * The type AtlasMultiParent_of the MultiParent document within Atlas.
   * Example: Tenet, Original Context Data, Active Data.
   */
  atlasType: AtlasMultiParent_MAtlasType;
  /** Entire content body AtlasMultiParent_of the MultiParent document within Atlas. */
  content?: Maybe<Scalars['String']['output']>;
  /** Document tags managed by the Atlas Axis facilitator group for classification.   */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status AtlasMultiParent_of the MultiParent document as managed by the Atlas Axis facilitator group.   */
  masterStatus: AtlasMultiParent_MStatus;
  /** Full name AtlasMultiParent_of the MultiParent document entity. */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Original Notion document ID AtlasMultiParent_of the MultiParent document.
   * Used for cross-system referencing and linking back to the original Notion source.
   */
  notionId?: Maybe<Scalars['String']['output']>;
  /**
   *   List AtlasMultiParent_of Atlas documents that were relevant for the creation AtlasMultiParent_of this MultiParent document.
   *
   *   Should the subfields AtlasMultiParent_of the AtlasMultiParent_MDocumentLink object differ from the subfields AtlasMultiParent_of the AtlasMultiParent_MDocumentLink for Parent? Potentially we don't need docNo field.
   *
   * Change a subfield "name" to "title" in AtlasMultiParent_MDocumentLink object.
   *
   *
   *   type AtlasMultiParent_MDocumentCDLink {
   *   id: PHID!
   *   title: OLabel
   * }
   */
  originalContextData: Array<Scalars['String']['output']>;
  /**
   * Parent entity that this MultiParent document belongs to.
   * This is a reference to another Atlas document.
   */
  parents: Array<AtlasMultiParent_MDocumentLink>;
};

/** Domain (i.e., Atlas) specific document types with the same document model global schema.   */
export enum AtlasMultiParent_MAtlasType {
  Annotation = 'ANNOTATION',
  NeededResearch = 'NEEDED_RESEARCH'
}

/** Reference to a document within Atlas with optional name and document number for display reasons.  */
export type AtlasMultiParent_MDocumentLink = {
  __typename?: 'AtlasMultiParent_MDocumentLink';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

/** Defines the lifecycle stage AtlasMultiParent_of the MultiParent document within Atlas. */
export enum AtlasMultiParent_MStatus {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

export type AtlasMultiParent_RemoveContextDataInput = {
  id: Scalars['String']['input'];
};

export type AtlasMultiParent_RemoveParentInput = {
  id: Scalars['PHID']['input'];
};

export type AtlasMultiParent_RemoveTagsInput = {
  tags: Array<Scalars['String']['input']>;
};

export type AtlasMultiParent_ReplaceContextDataInput = {
  id: Scalars['String']['input'];
  prevId: Scalars['String']['input'];
};

export type AtlasMultiParent_ReplaceParentInput = {
  docNo?: InputMaybe<Scalars['String']['input']>;
  documentType?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['PHID']['input'];
  prevID: Scalars['PHID']['input'];
  title?: InputMaybe<Scalars['OLabel']['input']>;
};

export type AtlasMultiParent_SetAtlasTypeInput = {
  atlasType: MAtlasType;
};

export type AtlasMultiParent_SetContentInput = {
  content: Scalars['String']['input'];
};

/** Module: General */
export type AtlasMultiParent_SetExploratoryNameInput = {
  name: Scalars['String']['input'];
};

export type AtlasMultiParent_SetMasterStatusInput = {
  masterStatus: MStatus;
};

export type AtlasMultiParent_SetNotionIdInput = {
  notionId: Scalars['String']['input'];
};

export type AtlasScope = IDocument & {
  __typename?: 'AtlasScope';
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: AtlasScope_AtlasScopeState;
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: AtlasScope_AtlasScopeState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type AtlasScopeOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: AtlasScope */
export type AtlasScopeQueries = {
  __typename?: 'AtlasScopeQueries';
  getDocument?: Maybe<AtlasScope>;
  getDocuments?: Maybe<Array<AtlasScope>>;
};


/** Queries: AtlasScope */
export type AtlasScopeQueriesGetDocumentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
};

/** Subgraph definition for AtlasScope (sky/atlas-scope) */
export type AtlasScopeState = {
  __typename?: 'AtlasScopeState';
  /**
   * Document number of the scope document within Atlas.
   * For example: "A.1" for the Governance Scope.
   */
  content?: Maybe<Scalars['String']['output']>;
  /** Unique document number assigned to the Scope document within Atlas. */
  docNo?: Maybe<Scalars['String']['output']>;
  /** Document tags as managed by the Atlas Axis facilitator group. */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status as managed by the Atlas Axis facilitator group. */
  masterStatus: Status;
  /**
   * Full name of the Scope without the document number.
   * For example: "The Support Scope"
   */
  name?: Maybe<Scalars['OLabel']['output']>;
  /** Original Notion document ID of the scope document. */
  notionId?: Maybe<Scalars['String']['output']>;
  /** List of Atlas documents that were relevant for the creation of the scope document. */
  originalContextData: Array<Scalars['String']['output']>;
};

/** Module: Context */
export type AtlasScope_AddContextDataInput = {
  id: Scalars['String']['input'];
};

/** Module: Tags */
export type AtlasScope_AddTagsInput = {
  /** Tags to be added */
  newTags: Array<Scalars['String']['input']>;
};

export type AtlasScope_AtlasScopeState = {
  __typename?: 'AtlasScope_AtlasScopeState';
  /**
   * Document number of the scope document within Atlas.
   * For example: "A.1" for the Governance Scope.
   */
  content?: Maybe<Scalars['String']['output']>;
  /** Unique document number assigned to the Scope document within Atlas. */
  docNo?: Maybe<Scalars['String']['output']>;
  /** Document tags as managed by the Atlas Axis facilitator group. */
  globalTags: Array<Scalars['String']['output']>;
  /** Master status as managed by the Atlas Axis facilitator group. */
  masterStatus: AtlasScope_Status;
  /**
   * Full name of the Scope without the document number.
   * For example: "The Support Scope"
   */
  name?: Maybe<Scalars['OLabel']['output']>;
  /** Original Notion document ID of the scope document. */
  notionId?: Maybe<Scalars['String']['output']>;
  /** List of Atlas documents that were relevant for the creation of the scope document.  */
  originalContextData: Array<Scalars['String']['output']>;
};

/** Reference to a document within Atlas with optional name and document number for display reasons.  */
export type AtlasScope_DocumentInfo = {
  __typename?: 'AtlasScope_DocumentInfo';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

export type AtlasScope_RemoveContextDataInput = {
  id: Scalars['String']['input'];
};

export type AtlasScope_RemoveTagsInput = {
  /** Tags to be removed */
  tags: Array<Scalars['String']['input']>;
};

export type AtlasScope_ReplaceContextDataInput = {
  id: Scalars['String']['input'];
  prevId: Scalars['String']['input'];
};

export type AtlasScope_SetContentInput = {
  /** Update the content of the scope document */
  content: Scalars['String']['input'];
};

export type AtlasScope_SetDocNumberInput = {
  docNo?: InputMaybe<Scalars['String']['input']>;
};

export type AtlasScope_SetMasterStatusInput = {
  /** New master status */
  masterStatus: Status;
};

export type AtlasScope_SetNotionIdInput = {
  /** Add your inputs here */
  notionID?: InputMaybe<Scalars['String']['input']>;
};

/** Module: General */
export type AtlasScope_SetScopeNameInput = {
  name: Scalars['OLabel']['input'];
};

export enum AtlasScope_Status {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

export type AtlasSet = IDocument & {
  __typename?: 'AtlasSet';
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: AtlasSet_AtlasSetState;
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: AtlasSet_AtlasSetState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type AtlasSetOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: AtlasSet */
export type AtlasSetQueries = {
  __typename?: 'AtlasSetQueries';
  getDocument?: Maybe<AtlasSet>;
  getDocuments?: Maybe<Array<AtlasSet>>;
};


/** Queries: AtlasSet */
export type AtlasSetQueriesGetDocumentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
};

/** Subgraph definition for AtlasSet (sky/atlas-set) */
export type AtlasSetState = {
  __typename?: 'AtlasSetState';
  id: Scalars['PHID']['output'];
  name: Scalars['String']['output'];
  notionId?: Maybe<Scalars['String']['output']>;
  parent?: Maybe<SetDocumentLink>;
};

export type AtlasSet_AtlasSetState = {
  __typename?: 'AtlasSet_AtlasSetState';
  id: Scalars['PHID']['output'];
  name: Scalars['String']['output'];
  notionId?: Maybe<Scalars['String']['output']>;
  parent?: Maybe<AtlasSet_SetDocumentLink>;
};

export type AtlasSet_SetDocumentLink = {
  __typename?: 'AtlasSet_SetDocumentLink';
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

export type AtlasSet_SetNotionIdInput = {
  notionId: Scalars['String']['input'];
};

/** Module: General */
export type AtlasSet_SetSetNameInput = {
  name: Scalars['String']['input'];
};

export type AtlasSet_SetSetParentInput = {
  documentType?: InputMaybe<Scalars['String']['input']>;
  icon?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['PHID']['input'];
  title?: InputMaybe<Scalars['OLabel']['input']>;
};

/**
 * Issues are comprised of Comments.
 *
 * When an Issue is first created, it is empty and has no comments. Users can then submit comments which are associated with a given issue.
 *
 * A comment refers to a specific item from the Atlas. This field is required, but can be changed later.
 */
export type Comment = {
  __typename?: 'Comment';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  creatorAddress: Scalars['EthereumAddress']['output'];
  lastEditedAt: Scalars['DateTime']['output'];
  notionId: Scalars['String']['output'];
  phid: Scalars['PHID']['output'];
};

export type CurrencyConversion = {
  metric: Scalars['String']['input'];
  sourceCurrency: Scalars['String']['input'];
};

export type Dimension = {
  __typename?: 'Dimension';
  name?: Maybe<Scalars['String']['output']>;
  values?: Maybe<Array<Maybe<Value>>>;
};

export type DocumentDrive = IDocument & {
  __typename?: 'DocumentDrive';
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: DocumentDrive_DocumentDriveState;
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: DocumentDrive_DocumentDriveState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type DocumentDriveOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type DocumentDriveLocalState = {
  __typename?: 'DocumentDriveLocalState';
  availableOffline: Scalars['Boolean']['output'];
  listeners: Array<DocumentDrive_Listener>;
  sharingType?: Maybe<Scalars['String']['output']>;
  triggers: Array<DocumentDrive_Trigger>;
};

export type DocumentDriveStateInput = {
  icon?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};

export type DocumentDrive_DocumentDriveState = {
  __typename?: 'DocumentDrive_DocumentDriveState';
  icon?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  nodes: Array<DocumentDrive_Node>;
};

export type DocumentDrive_FileNode = {
  __typename?: 'DocumentDrive_FileNode';
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  kind: Scalars['String']['output'];
  name: Scalars['String']['output'];
  parentFolder?: Maybe<Scalars['String']['output']>;
  synchronizationUnits: Array<DocumentDrive_SynchronizationUnit>;
};

export type DocumentDrive_FolderNode = {
  __typename?: 'DocumentDrive_FolderNode';
  id: Scalars['String']['output'];
  kind: Scalars['String']['output'];
  name: Scalars['String']['output'];
  parentFolder?: Maybe<Scalars['String']['output']>;
};

export type DocumentDrive_Listener = {
  __typename?: 'DocumentDrive_Listener';
  block: Scalars['Boolean']['output'];
  callInfo?: Maybe<DocumentDrive_ListenerCallInfo>;
  filter: DocumentDrive_ListenerFilter;
  label?: Maybe<Scalars['String']['output']>;
  listenerId: Scalars['ID']['output'];
  system: Scalars['Boolean']['output'];
};

export type DocumentDrive_ListenerCallInfo = {
  __typename?: 'DocumentDrive_ListenerCallInfo';
  data?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  transmitterType?: Maybe<DocumentDrive_TransmitterType>;
};

export type DocumentDrive_ListenerFilter = {
  __typename?: 'DocumentDrive_ListenerFilter';
  branch?: Maybe<Array<Scalars['String']['output']>>;
  documentId?: Maybe<Array<Scalars['ID']['output']>>;
  documentType: Array<Scalars['String']['output']>;
  scope?: Maybe<Array<Scalars['String']['output']>>;
};

export type DocumentDrive_Node = DocumentDrive_FileNode | DocumentDrive_FolderNode;

export type DocumentDrive_PullResponderTriggerData = {
  __typename?: 'DocumentDrive_PullResponderTriggerData';
  interval: Scalars['String']['output'];
  listenerId: Scalars['ID']['output'];
  url: Scalars['String']['output'];
};

export type DocumentDrive_SynchronizationUnit = {
  __typename?: 'DocumentDrive_SynchronizationUnit';
  branch: Scalars['String']['output'];
  scope: Scalars['String']['output'];
  syncId: Scalars['ID']['output'];
};

export enum DocumentDrive_TransmitterType {
  Internal = 'Internal',
  MatrixConnect = 'MatrixConnect',
  PullResponder = 'PullResponder',
  RestWebhook = 'RESTWebhook',
  SecureConnect = 'SecureConnect',
  SwitchboardPush = 'SwitchboardPush'
}

export type DocumentDrive_Trigger = {
  __typename?: 'DocumentDrive_Trigger';
  data?: Maybe<DocumentDrive_TriggerData>;
  id: Scalars['ID']['output'];
  type: DocumentDrive_TriggerType;
};

export type DocumentDrive_TriggerData = DocumentDrive_PullResponderTriggerData;

export enum DocumentDrive_TriggerType {
  PullResponder = 'PullResponder'
}

/** Reference to a document within Atlas with optional name and document number for display reasons. */
export type DocumentInfo = {
  __typename?: 'DocumentInfo';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

export type DocumentModel = IDocument & {
  __typename?: 'DocumentModel';
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type DocumentModelOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Domain (i.e., Atlas) specific document types with the same document model global schema. */
export enum EAtlasType {
  Scenario = 'SCENARIO',
  ScenarioVariation = 'SCENARIO_VARIATION'
}

export type EDocumentLink = {
  __typename?: 'EDocumentLink';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

/** Defines the lifecycle stage of the Exploratory document within Atlas. */
export enum EStatus {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

/** Domain (i.e., Atlas) specific document types with the same document model global schema. */
export enum FAtlasType {
  ActiveDataController = 'ACTIVE_DATA_CONTROLLER',
  Article = 'ARTICLE',
  Core = 'CORE',
  Section = 'SECTION',
  TypeSpecification = 'TYPE_SPECIFICATION'
}

/** Reference to a document within Atlas with optional name and document number for display reasons. */
export type FDocumentLink = {
  __typename?: 'FDocumentLink';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

export enum FStatus {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

/** Reference to a document within Atlas with optional name and document number for display reasons. */
export type Finding = {
  __typename?: 'Finding';
  isAligned: Scalars['Boolean']['output'];
};

/** Domain (i.e., Atlas) specific document types with the same document model global schema. */
export enum GAtlasType {
  ActiveData = 'ACTIVE_DATA',
  OriginalContextData = 'ORIGINAL_CONTEXT_DATA',
  Tenet = 'TENET'
}

/** Reference to a document within Atlas with optional name and document number for display reasons. */
export type GDocumentLink = {
  __typename?: 'GDocumentLink';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

/** Defines the lifecycle stage of the Grounding document within Atlas. */
export enum GStatus {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

export type IDocument = {
  created: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastModified: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type IDocumentOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * An issue that has been submitted to the Atlas.
 *
 * Holds a list of comments pertaining to specific items in the Atlas.
 *
 * Uses the same identifiers to register the relevant content as are used in the Atlas itself. These identifiers are the UUID's used by Notion, sometimes with a suffix of a part of the item's parent for cases where multiple parents exist.
 *
 * The relevant Notion IDs are separate from the Notion IDs referenced in the Comments themselves, because we might want to determine the scope of the Issue's content before any actual comments are added yet.
 */
export type Issue = {
  __typename?: 'Issue';
  comments: Array<Comment>;
  createdAt: Scalars['DateTime']['output'];
  creatorAddress: Scalars['EthereumAddress']['output'];
  notionIds: Array<Scalars['String']['output']>;
  phid: Scalars['PHID']['output'];
};

/** Domain (i.e., Atlas) specific document types with the same document model global schema. */
export enum MAtlasType {
  Annotation = 'ANNOTATION',
  NeededResearch = 'NEEDED_RESEARCH'
}

/** Reference to a document within Atlas with optional name and document number for display reasons. */
export type MDocumentLink = {
  __typename?: 'MDocumentLink';
  docNo?: Maybe<Scalars['String']['output']>;
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

/** Defines the lifecycle stage of the MultiParent document within Atlas. */
export enum MStatus {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

export type MultiCurrencyConversions = {
  conversions: Array<InputMaybe<CurrencyConversion>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  /** List of dimensions to filter by, such as 'budget' or 'project' */
  dimensions?: InputMaybe<Array<InputMaybe<AnalyticsFilterDimension>>>;
  end?: InputMaybe<Scalars['String']['input']>;
  /** Period to group by */
  granularity?: InputMaybe<AnalyticsGranularity>;
  /** List of metrics to filter by, such as 'budget' or 'actuals' */
  metrics?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  start?: InputMaybe<Scalars['String']['input']>;
};

/** Mutations: AtlasMultiParent */
export type Mutation = {
  __typename?: 'Mutation';
  AtlasExploratory_addContextData?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_addTags?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_createDocument?: Maybe<Scalars['String']['output']>;
  AtlasExploratory_removeContextData?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_removeTags?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_replaceContextData?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_setAdditionalGuidance?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_setAtlasType?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_setContent?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_setDocNumber?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_setExploratoryName?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_setFindings?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_setMasterStatus?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_setNotionId?: Maybe<Scalars['Int']['output']>;
  AtlasExploratory_setParent?: Maybe<Scalars['Int']['output']>;
  AtlasFeedbackIssues_addNotionId?: Maybe<Scalars['Int']['output']>;
  AtlasFeedbackIssues_createComment?: Maybe<Scalars['Int']['output']>;
  AtlasFeedbackIssues_createDocument?: Maybe<Scalars['String']['output']>;
  AtlasFeedbackIssues_createIssue?: Maybe<Scalars['Int']['output']>;
  AtlasFeedbackIssues_deleteComment?: Maybe<Scalars['Int']['output']>;
  AtlasFeedbackIssues_deleteIssue?: Maybe<Scalars['Int']['output']>;
  AtlasFeedbackIssues_editComment?: Maybe<Scalars['Int']['output']>;
  AtlasFeedbackIssues_removeNotionId?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_addContextData?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_addTags?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_createDocument?: Maybe<Scalars['String']['output']>;
  AtlasFoundation_removeContextData?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_removeTags?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_replaceContextData?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_setAtlasType?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_setContent?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_setDocNumber?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_setFoundationName?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_setMasterStatus?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_setNotionId?: Maybe<Scalars['Int']['output']>;
  AtlasFoundation_setParent?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_addContextData?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_addTags?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_createDocument?: Maybe<Scalars['String']['output']>;
  AtlasGrounding_removeContextData?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_removeTags?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_replaceContextData?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_setAtlasType?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_setContent?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_setDocNumber?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_setGroundingName?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_setMasterStatus?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_setNotionId?: Maybe<Scalars['Int']['output']>;
  AtlasGrounding_setParent?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_addContextData?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_addParent?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_addTags?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_createDocument?: Maybe<Scalars['String']['output']>;
  AtlasMultiParent_removeContextData?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_removeParent?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_removeTags?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_replaceContextData?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_replaceParent?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_setAtlasType?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_setContent?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_setExploratoryName?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_setMasterStatus?: Maybe<Scalars['Int']['output']>;
  AtlasMultiParent_setNotionId?: Maybe<Scalars['Int']['output']>;
  AtlasScope_addContextData?: Maybe<Scalars['Int']['output']>;
  AtlasScope_addTags?: Maybe<Scalars['Int']['output']>;
  AtlasScope_createDocument?: Maybe<Scalars['String']['output']>;
  AtlasScope_removeContextData?: Maybe<Scalars['Int']['output']>;
  AtlasScope_removeTags?: Maybe<Scalars['Int']['output']>;
  AtlasScope_replaceContextData?: Maybe<Scalars['Int']['output']>;
  AtlasScope_setContent?: Maybe<Scalars['Int']['output']>;
  AtlasScope_setDocNumber?: Maybe<Scalars['Int']['output']>;
  AtlasScope_setMasterStatus?: Maybe<Scalars['Int']['output']>;
  AtlasScope_setNotionId?: Maybe<Scalars['Int']['output']>;
  AtlasScope_setScopeName?: Maybe<Scalars['Int']['output']>;
  AtlasSet_createDocument?: Maybe<Scalars['String']['output']>;
  AtlasSet_setNotionId?: Maybe<Scalars['Int']['output']>;
  AtlasSet_setSetName?: Maybe<Scalars['Int']['output']>;
  AtlasSet_setSetParent?: Maybe<Scalars['Int']['output']>;
  ForkAtlas?: Maybe<Scalars['String']['output']>;
  addDrive?: Maybe<AddDriveResult>;
  deleteDrive?: Maybe<Scalars['Boolean']['output']>;
  setDriveIcon?: Maybe<Scalars['Boolean']['output']>;
  setDriveName?: Maybe<Scalars['Boolean']['output']>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_AddContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_AddContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_AddTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_AddTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_RemoveContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_RemoveContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_RemoveTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_RemoveTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_ReplaceContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_ReplaceContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_SetAdditionalGuidanceArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_SetAdditionalGuidanceInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_SetAtlasTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_SetAtlasTypeInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_SetContentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_SetContentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_SetDocNumberArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_SetDocNumberInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_SetExploratoryNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_SetExploratoryNameInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_SetFindingsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_SetFindingsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_SetMasterStatusArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_SetMasterStatusInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_SetNotionIdArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_SetNotionIdInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasExploratory_SetParentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasExploratory_SetParentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFeedbackIssues_AddNotionIdArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFeedbackIssues_AddNotionIdInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFeedbackIssues_CreateCommentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFeedbackIssues_CreateCommentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFeedbackIssues_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFeedbackIssues_CreateIssueArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFeedbackIssues_CreateIssueInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFeedbackIssues_DeleteCommentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFeedbackIssues_DeleteCommentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFeedbackIssues_DeleteIssueArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFeedbackIssues_DeleteIssueInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFeedbackIssues_EditCommentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFeedbackIssues_EditCommentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFeedbackIssues_RemoveNotionIdArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFeedbackIssues_RemoveNotionIdInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_AddContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_AddContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_AddTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_AddTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_RemoveContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_RemoveContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_RemoveTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_RemoveTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_ReplaceContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_ReplaceContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_SetAtlasTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_SetAtlasTypeInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_SetContentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_SetContentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_SetDocNumberArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_SetDocNumberInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_SetFoundationNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_SetFoundationNameInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_SetMasterStatusArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_SetMasterStatusInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_SetNotionIdArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_SetNotionIdInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasFoundation_SetParentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasFoundation_SetParentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_AddContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_AddContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_AddTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_AddTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_RemoveContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_RemoveContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_RemoveTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_RemoveTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_ReplaceContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_ReplaceContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_SetAtlasTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_SetAtlasTypeInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_SetContentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_SetContentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_SetDocNumberArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_SetDocNumberInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_SetGroundingNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_SetGroundingNameInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_SetMasterStatusArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_SetMasterStatusInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_SetNotionIdArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_SetNotionIdInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasGrounding_SetParentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasGrounding_SetParentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_AddContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_AddContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_AddParentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_AddParentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_AddTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_AddTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_RemoveContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_RemoveContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_RemoveParentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_RemoveParentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_RemoveTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_RemoveTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_ReplaceContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_ReplaceContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_ReplaceParentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_ReplaceParentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_SetAtlasTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_SetAtlasTypeInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_SetContentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_SetContentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_SetExploratoryNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_SetExploratoryNameInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_SetMasterStatusArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_SetMasterStatusInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasMultiParent_SetNotionIdArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasMultiParent_SetNotionIdInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_AddContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_AddContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_AddTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_AddTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_RemoveContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_RemoveContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_RemoveTagsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_RemoveTagsInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_ReplaceContextDataArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_ReplaceContextDataInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_SetContentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_SetContentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_SetDocNumberArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_SetDocNumberInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_SetMasterStatusArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_SetMasterStatusInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_SetNotionIdArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_SetNotionIdInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasScope_SetScopeNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasScope_SetScopeNameInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasSet_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasSet_SetNotionIdArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasSet_SetNotionIdInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasSet_SetSetNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasSet_SetSetNameInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationAtlasSet_SetSetParentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AtlasSet_SetSetParentInput>;
};


/** Mutations: AtlasMultiParent */
export type MutationForkAtlasArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AtlasMultiParent */
export type MutationAddDriveArgs = {
  icon?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  preferredEditor?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AtlasMultiParent */
export type MutationDeleteDriveArgs = {
  id: Scalars['String']['input'];
};


/** Mutations: AtlasMultiParent */
export type MutationSetDriveIconArgs = {
  icon: Scalars['String']['input'];
  id: Scalars['String']['input'];
};


/** Mutations: AtlasMultiParent */
export type MutationSetDriveNameArgs = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type Operation = {
  __typename?: 'Operation';
  context?: Maybe<PhOperationContext>;
  error?: Maybe<Scalars['String']['output']>;
  hash: Scalars['String']['output'];
  id: Scalars['String']['output'];
  index: Scalars['Int']['output'];
  inputText?: Maybe<Scalars['String']['output']>;
  skip?: Maybe<Scalars['Int']['output']>;
  timestamp: Scalars['DateTime']['output'];
  type: Scalars['String']['output'];
};

export type PhOperationContext = {
  __typename?: 'PHOperationContext';
  signer?: Maybe<Signer>;
};

export type Query = {
  __typename?: 'Query';
  AtlasExploratory?: Maybe<AtlasExploratoryQueries>;
  AtlasFeedbackIssues?: Maybe<AtlasFeedbackIssuesQueries>;
  AtlasFoundation?: Maybe<AtlasFoundationQueries>;
  AtlasGrounding?: Maybe<AtlasGroundingQueries>;
  AtlasMultiParent?: Maybe<AtlasMultiParentQueries>;
  AtlasScope?: Maybe<AtlasScopeQueries>;
  AtlasSet?: Maybe<AtlasSetQueries>;
  analytics?: Maybe<AnalyticsQuery>;
  driveIdBySlug?: Maybe<Scalars['String']['output']>;
  drives: Array<Scalars['String']['output']>;
};


export type QueryDriveIdBySlugArgs = {
  slug: Scalars['String']['input'];
};

export type SetDocumentLink = {
  __typename?: 'SetDocumentLink';
  documentType?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  id: Scalars['PHID']['output'];
  title?: Maybe<Scalars['OLabel']['output']>;
};

export type Signer = {
  __typename?: 'Signer';
  app?: Maybe<SignerApp>;
  signatures: Array<Scalars['String']['output']>;
  user?: Maybe<SignerUser>;
};

export type SignerApp = {
  __typename?: 'SignerApp';
  key: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type SignerUser = {
  __typename?: 'SignerUser';
  address: Scalars['String']['output'];
  chainId: Scalars['Int']['output'];
  networkId: Scalars['String']['output'];
};

export enum Status {
  Approved = 'APPROVED',
  Archived = 'ARCHIVED',
  Deferred = 'DEFERRED',
  Placeholder = 'PLACEHOLDER',
  Provisional = 'PROVISIONAL'
}

export type Value = {
  __typename?: 'Value';
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  path?: Maybe<Scalars['String']['output']>;
};

export type GetAtlasSetQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAtlasSetQuery = { __typename?: 'Query', AtlasSet?: { __typename?: 'AtlasSetQueries', getDocuments?: Array<{ __typename?: 'AtlasSet', documentType: string, id: string, created: any, lastModified: any, name: string, revision: number, stateJSON?: any | null, initialState: { __typename?: 'AtlasSet_AtlasSetState', id: any, name: string }, operations: Array<{ __typename?: 'Operation', error?: string | null, hash: string, id: string, index: number, inputText?: string | null, skip?: number | null, timestamp: any, type: string }>, state: { __typename?: 'AtlasSet_AtlasSetState', id: any, name: string, notionId?: string | null, parent?: { __typename?: 'AtlasSet_SetDocumentLink', documentType?: string | null, icon?: string | null, id: any, title?: any | null } | null } }> | null } | null };



export const GetAtlasSetDocument = `
    query GetAtlasSet {
  AtlasSet {
    getDocuments {
      documentType
      id
      created
      initialState {
        id
        name
      }
      lastModified
      name
      operations(first: 10) {
        error
        hash
        id
        index
        inputText
        skip
        timestamp
        type
      }
      revision
      state {
        id
        name
        notionId
        parent {
          documentType
          icon
          id
          title
        }
      }
      stateJSON
    }
  }
}
    `;

export const useGetAtlasSetQuery = <
      TData = GetAtlasSetQuery,
      TError = unknown
    >(
      variables?: GetAtlasSetQueryVariables,
      options?: Omit<UseQueryOptions<GetAtlasSetQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetAtlasSetQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetAtlasSetQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetAtlasSet'] : ['GetAtlasSet', variables],
    queryFn: fetcher<GetAtlasSetQuery, GetAtlasSetQueryVariables>(GetAtlasSetDocument, variables),
    ...options
  }
    )};

useGetAtlasSetQuery.getKey = (variables?: GetAtlasSetQueryVariables) => variables === undefined ? ['GetAtlasSet'] : ['GetAtlasSet', variables];

export const useSuspenseGetAtlasSetQuery = <
      TData = GetAtlasSetQuery,
      TError = unknown
    >(
      variables?: GetAtlasSetQueryVariables,
      options?: Omit<UseSuspenseQueryOptions<GetAtlasSetQuery, TError, TData>, 'queryKey'> & { queryKey?: UseSuspenseQueryOptions<GetAtlasSetQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useSuspenseQuery<GetAtlasSetQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetAtlasSetSuspense'] : ['GetAtlasSetSuspense', variables],
    queryFn: fetcher<GetAtlasSetQuery, GetAtlasSetQueryVariables>(GetAtlasSetDocument, variables),
    ...options
  }
    )};

useSuspenseGetAtlasSetQuery.getKey = (variables?: GetAtlasSetQueryVariables) => variables === undefined ? ['GetAtlasSetSuspense'] : ['GetAtlasSetSuspense', variables];


useGetAtlasSetQuery.fetcher = (variables?: GetAtlasSetQueryVariables, options?: RequestInit['headers']) => fetcher<GetAtlasSetQuery, GetAtlasSetQueryVariables>(GetAtlasSetDocument, variables, options);
