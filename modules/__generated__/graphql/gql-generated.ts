/* eslint-disable */
// @ts-nocheck
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
  Upload: { input: any; output: any; }
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

export type AppModule = IDocument & {
  __typename?: 'AppModule';
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: AppModule_AppModuleState;
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: AppModule_AppModuleState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type AppModuleOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: AppModule */
export type AppModuleQueries = {
  __typename?: 'AppModuleQueries';
  getDocument?: Maybe<AppModule>;
  getDocuments?: Maybe<Array<AppModule>>;
};


/** Queries: AppModule */
export type AppModuleQueriesGetDocumentArgs = {
  docId: Scalars['PHID']['input'];
  driveId?: InputMaybe<Scalars['PHID']['input']>;
};


/** Queries: AppModule */
export type AppModuleQueriesGetDocumentsArgs = {
  driveId: Scalars['String']['input'];
};

/** Subgraph definition for AppModule (powerhouse/app) */
export type AppModuleState = {
  __typename?: 'AppModuleState';
  documentTypes?: Maybe<Array<DocumentTypeItem>>;
  dragAndDrop?: Maybe<DragAndDropSettings>;
  name: Scalars['String']['output'];
  status: StatusType;
};

export type AppModule_AddDocumentTypeInput = {
  documentType: Scalars['String']['input'];
  id: Scalars['OID']['input'];
};

export type AppModule_AppModuleState = {
  __typename?: 'AppModule_AppModuleState';
  documentTypes?: Maybe<Array<AppModule_DocumentTypeItem>>;
  dragAndDrop?: Maybe<AppModule_DragAndDropSettings>;
  name: Scalars['String']['output'];
  status: AppModule_StatusType;
};

export type AppModule_DocumentTypeItem = {
  __typename?: 'AppModule_DocumentTypeItem';
  documentType: Scalars['String']['output'];
  id: Scalars['OID']['output'];
};

export type AppModule_DragAndDropSettings = {
  __typename?: 'AppModule_DragAndDropSettings';
  enabled: Scalars['Boolean']['output'];
};

export type AppModule_RemoveDocumentTypeInput = {
  id: Scalars['OID']['input'];
};

/** Module: BaseOperations */
export type AppModule_SetAppNameInput = {
  name: Scalars['String']['input'];
};

export type AppModule_SetAppStatusInput = {
  status: StatusType;
};

/** Module: DndOperations */
export type AppModule_SetDragAndDropEnabledInput = {
  enabled: Scalars['Boolean']['input'];
};

export enum AppModule_StatusType {
  Confirmed = 'CONFIRMED',
  Draft = 'DRAFT'
}

export type Author = {
  __typename?: 'Author';
  name?: Maybe<Scalars['String']['output']>;
  website?: Maybe<Scalars['URL']['output']>;
};

export type BuilderTeam = IDocument & {
  __typename?: 'BuilderTeam';
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: BuilderTeam_BuilderTeamState;
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: BuilderTeam_BuilderTeamState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type BuilderTeamOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type BuilderTeamFilter = {
  __typename?: 'BuilderTeamFilter';
  profileDescription?: Maybe<Scalars['String']['output']>;
  profileLogo?: Maybe<Scalars['String']['output']>;
  profileName?: Maybe<Scalars['String']['output']>;
  profileSlug?: Maybe<Scalars['String']['output']>;
};

export type BuilderTeamMember = {
  __typename?: 'BuilderTeamMember';
  builderAccountId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  ethAddress: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  phid?: Maybe<Scalars['String']['output']>;
  profileImage?: Maybe<Scalars['String']['output']>;
};

export type BuilderTeamPackage = {
  __typename?: 'BuilderTeamPackage';
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  driveId?: Maybe<Scalars['String']['output']>;
  github?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  npm?: Maybe<Scalars['String']['output']>;
  sortOrder: Scalars['Int']['output'];
  spaceId: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
  vetraDriveUrl?: Maybe<Scalars['String']['output']>;
};

/** Queries: BuilderTeam */
export type BuilderTeamQueries = {
  __typename?: 'BuilderTeamQueries';
  getDocument?: Maybe<BuilderTeam>;
  getDocuments?: Maybe<Array<BuilderTeam>>;
};


/** Queries: BuilderTeam */
export type BuilderTeamQueriesGetDocumentArgs = {
  docId: Scalars['PHID']['input'];
  driveId?: InputMaybe<Scalars['PHID']['input']>;
};


/** Queries: BuilderTeam */
export type BuilderTeamQueriesGetDocumentsArgs = {
  driveId: Scalars['String']['input'];
};

export type BuilderTeamSpace = {
  __typename?: 'BuilderTeamSpace';
  builderAccountId: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  packages: Array<BuilderTeamPackage>;
  title: Scalars['String']['output'];
  updatedAt: Scalars['String']['output'];
};

/** Subgraph definition for BuilderTeam (powerhouse/builder-team) */
export type BuilderTeamState = {
  __typename?: 'BuilderTeamState';
  members: Array<RenownProfileInfo>;
  profile: VetraBuilderProfile;
  spaces: Array<VetraBuilderSpace>;
};

/** Subgraph definition for Vetra Read Model */
export type BuilderTeamType = {
  __typename?: 'BuilderTeamType';
  createdAt: Scalars['String']['output'];
  id: Scalars['String']['output'];
  members: Array<BuilderTeamMember>;
  profileDescription?: Maybe<Scalars['String']['output']>;
  profileLogo?: Maybe<Scalars['String']['output']>;
  profileName: Scalars['String']['output'];
  profileSlug: Scalars['String']['output'];
  profileSocialsGithub?: Maybe<Scalars['String']['output']>;
  profileSocialsWebsite?: Maybe<Scalars['String']['output']>;
  profileSocialsX?: Maybe<Scalars['String']['output']>;
  spaces: Array<BuilderTeamSpace>;
  updatedAt: Scalars['String']['output'];
};

/** Module: Member */
export type BuilderTeam_AddMemberInput = {
  id: Scalars['OID']['input'];
};

/** Module: Packages */
export type BuilderTeam_AddPackageInput = {
  id: Scalars['OID']['input'];
  spaceId: Scalars['OID']['input'];
};

/** Module: Spaces */
export type BuilderTeam_AddSpaceInput = {
  id: Scalars['OID']['input'];
};

export type BuilderTeam_BuilderTeamState = {
  __typename?: 'BuilderTeam_BuilderTeamState';
  members: Array<BuilderTeam_RenownProfileInfo>;
  profile: BuilderTeam_VetraBuilderProfile;
  spaces: Array<BuilderTeam_VetraBuilderSpace>;
};

export type BuilderTeam_RemoveMemberInput = {
  id: Scalars['OID']['input'];
};

export type BuilderTeam_RemovePackageInput = {
  id: Scalars['OID']['input'];
};

export type BuilderTeam_RemoveSpaceInput = {
  id: Scalars['OID']['input'];
};

export type BuilderTeam_RenownProfileInfo = {
  __typename?: 'BuilderTeam_RenownProfileInfo';
  ethAddress?: Maybe<Scalars['String']['output']>;
  id: Scalars['OID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  phid?: Maybe<Scalars['PHID']['output']>;
  profileImage?: Maybe<Scalars['String']['output']>;
};

export type BuilderTeam_ReorderPackagesInput = {
  packageIds: Array<Scalars['OID']['input']>;
  spaceId: Scalars['OID']['input'];
  targetIndex: Scalars['Int']['input'];
};

export type BuilderTeam_ReorderSpacesInput = {
  spaceIds: Array<Scalars['OID']['input']>;
  targetIndex: Scalars['Int']['input'];
};

export type BuilderTeam_SetDescriptionInput = {
  description?: InputMaybe<Scalars['String']['input']>;
};

/** Module: Profile */
export type BuilderTeam_SetLogoInput = {
  logo?: InputMaybe<Scalars['String']['input']>;
};

export type BuilderTeam_SetSlugInput = {
  slug: Scalars['String']['input'];
};

export type BuilderTeam_SetSocialsInput = {
  github?: InputMaybe<Scalars['String']['input']>;
  website?: InputMaybe<Scalars['String']['input']>;
  xProfile?: InputMaybe<Scalars['String']['input']>;
};

export type BuilderTeam_SetTeamNameInput = {
  name: Scalars['String']['input'];
};

export type BuilderTeam_UpdateMemberInfoInput = {
  ethAddress?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['OID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  phid?: InputMaybe<Scalars['PHID']['input']>;
  profileImage?: InputMaybe<Scalars['String']['input']>;
};

export type BuilderTeam_UpdatePackageInfoInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  github?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['OID']['input'];
  npm?: InputMaybe<Scalars['String']['input']>;
  phid?: InputMaybe<Scalars['PHID']['input']>;
  spaceId?: InputMaybe<Scalars['OID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  vetraDriveUrl?: InputMaybe<Scalars['URL']['input']>;
};

export type BuilderTeam_UpdateSpaceInfoInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['OID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type BuilderTeam_VetraBuilderProfile = {
  __typename?: 'BuilderTeam_VetraBuilderProfile';
  description?: Maybe<Scalars['String']['output']>;
  logo?: Maybe<Scalars['URL']['output']>;
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  socials: BuilderTeam_VetraBuilderSocials;
};

export type BuilderTeam_VetraBuilderSocials = {
  __typename?: 'BuilderTeam_VetraBuilderSocials';
  github?: Maybe<Scalars['URL']['output']>;
  website?: Maybe<Scalars['URL']['output']>;
  xProfile?: Maybe<Scalars['URL']['output']>;
};

export type BuilderTeam_VetraBuilderSpace = {
  __typename?: 'BuilderTeam_VetraBuilderSpace';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['OID']['output'];
  packages: Array<BuilderTeam_VetraPackageInfo>;
  title: Scalars['String']['output'];
};

export type BuilderTeam_VetraPackageInfo = {
  __typename?: 'BuilderTeam_VetraPackageInfo';
  description?: Maybe<Scalars['String']['output']>;
  github?: Maybe<Scalars['String']['output']>;
  id: Scalars['OID']['output'];
  npm?: Maybe<Scalars['String']['output']>;
  phid?: Maybe<Scalars['PHID']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  vetraDriveUrl?: Maybe<Scalars['URL']['output']>;
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
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: DocumentDrive_DocumentDriveState;
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
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

export type DocumentEditor = IDocument & {
  __typename?: 'DocumentEditor';
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: DocumentEditor_DocumentEditorState;
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: DocumentEditor_DocumentEditorState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type DocumentEditorOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: DocumentEditor */
export type DocumentEditorQueries = {
  __typename?: 'DocumentEditorQueries';
  getDocument?: Maybe<DocumentEditor>;
  getDocuments?: Maybe<Array<DocumentEditor>>;
};


/** Queries: DocumentEditor */
export type DocumentEditorQueriesGetDocumentArgs = {
  docId: Scalars['PHID']['input'];
  driveId?: InputMaybe<Scalars['PHID']['input']>;
};


/** Queries: DocumentEditor */
export type DocumentEditorQueriesGetDocumentsArgs = {
  driveId: Scalars['String']['input'];
};

/** Subgraph definition for DocumentEditor (powerhouse/document-editor) */
export type DocumentEditorState = {
  __typename?: 'DocumentEditorState';
  documentTypes: Array<DocumentTypeItem>;
  name: Scalars['String']['output'];
  status: StatusType;
};

export type DocumentEditor_AddDocumentTypeInput = {
  documentType: Scalars['String']['input'];
  id: Scalars['OID']['input'];
};

export type DocumentEditor_DocumentEditorState = {
  __typename?: 'DocumentEditor_DocumentEditorState';
  documentTypes: Array<DocumentEditor_DocumentTypeItem>;
  name: Scalars['String']['output'];
  status: DocumentEditor_StatusType;
};

export type DocumentEditor_DocumentTypeItem = {
  __typename?: 'DocumentEditor_DocumentTypeItem';
  documentType: Scalars['String']['output'];
  id: Scalars['OID']['output'];
};

export type DocumentEditor_RemoveDocumentTypeInput = {
  id: Scalars['OID']['input'];
};

/** Module: BaseOperations */
export type DocumentEditor_SetEditorNameInput = {
  name: Scalars['String']['input'];
};

export type DocumentEditor_SetEditorStatusInput = {
  status: StatusType;
};

export enum DocumentEditor_StatusType {
  Confirmed = 'CONFIRMED',
  Draft = 'DRAFT'
}

export type DocumentModel = IDocument & {
  __typename?: 'DocumentModel';
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type DocumentModelOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type DocumentModel_Author = {
  __typename?: 'DocumentModel_Author';
  name: Scalars['String']['output'];
  website?: Maybe<Scalars['String']['output']>;
};

export type DocumentModel_CodeExample = {
  __typename?: 'DocumentModel_CodeExample';
  id: Scalars['ID']['output'];
  value: Scalars['String']['output'];
};

export type DocumentModel_DocumentModelState = {
  __typename?: 'DocumentModel_DocumentModelState';
  author: DocumentModel_Author;
  description: Scalars['String']['output'];
  extension: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  specifications: Array<DocumentModel_DocumentSpecification>;
};

export type DocumentModel_DocumentSpecification = {
  __typename?: 'DocumentModel_DocumentSpecification';
  changeLog: Array<Scalars['String']['output']>;
  modules: Array<DocumentModel_Module>;
  state: DocumentModel_ScopeState;
  version: Scalars['Int']['output'];
};

export type DocumentModel_Module = {
  __typename?: 'DocumentModel_Module';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  operations: Array<DocumentModel_Operation>;
};

export type DocumentModel_Operation = {
  __typename?: 'DocumentModel_Operation';
  description?: Maybe<Scalars['String']['output']>;
  errors: Array<DocumentModel_OperationError>;
  examples: Array<DocumentModel_CodeExample>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  reducer?: Maybe<Scalars['String']['output']>;
  schema?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  template?: Maybe<Scalars['String']['output']>;
};

export type DocumentModel_OperationError = {
  __typename?: 'DocumentModel_OperationError';
  code?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  template?: Maybe<Scalars['String']['output']>;
};

export type DocumentModel_ScopeState = {
  __typename?: 'DocumentModel_ScopeState';
  global: DocumentModel_State;
  local: DocumentModel_State;
};

export type DocumentModel_State = {
  __typename?: 'DocumentModel_State';
  examples: Array<DocumentModel_CodeExample>;
  initialValue: Scalars['String']['output'];
  schema: Scalars['String']['output'];
};

export type DocumentTypeItem = {
  __typename?: 'DocumentTypeItem';
  documentType: Scalars['String']['output'];
  id: Scalars['OID']['output'];
};

export type DragAndDropSettings = {
  __typename?: 'DragAndDropSettings';
  enabled: Scalars['Boolean']['output'];
};

export type DriveDocument = IDocument & {
  __typename?: 'DriveDocument';
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type DriveDocumentOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type IDocument = {
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type IDocumentOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type Keyword = {
  __typename?: 'Keyword';
  id: Scalars['OID']['output'];
  label: Scalars['String']['output'];
};

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

/** Mutations: AppModule */
export type Mutation = {
  __typename?: 'Mutation';
  AppModule_addDocumentType?: Maybe<Scalars['Int']['output']>;
  AppModule_createDocument?: Maybe<Scalars['String']['output']>;
  AppModule_removeDocumentType?: Maybe<Scalars['Int']['output']>;
  AppModule_setAppName?: Maybe<Scalars['Int']['output']>;
  AppModule_setAppStatus?: Maybe<Scalars['Int']['output']>;
  AppModule_setDragAndDropEnabled?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_addMember?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_addPackage?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_addSpace?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_createDocument?: Maybe<Scalars['String']['output']>;
  BuilderTeam_removeMember?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_removePackage?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_removeSpace?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_reorderPackages?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_reorderSpaces?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_setDescription?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_setLogo?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_setSlug?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_setSocials?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_setTeamName?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_updateMemberInfo?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_updatePackageInfo?: Maybe<Scalars['Int']['output']>;
  BuilderTeam_updateSpaceInfo?: Maybe<Scalars['Int']['output']>;
  DocumentEditor_addDocumentType?: Maybe<Scalars['Int']['output']>;
  DocumentEditor_createDocument?: Maybe<Scalars['String']['output']>;
  DocumentEditor_removeDocumentType?: Maybe<Scalars['Int']['output']>;
  DocumentEditor_setEditorName?: Maybe<Scalars['Int']['output']>;
  DocumentEditor_setEditorStatus?: Maybe<Scalars['Int']['output']>;
  ProcessorModule_addDocumentType?: Maybe<Scalars['Int']['output']>;
  ProcessorModule_createDocument?: Maybe<Scalars['String']['output']>;
  ProcessorModule_removeDocumentType?: Maybe<Scalars['Int']['output']>;
  ProcessorModule_setProcessorName?: Maybe<Scalars['Int']['output']>;
  ProcessorModule_setProcessorStatus?: Maybe<Scalars['Int']['output']>;
  ProcessorModule_setProcessorType?: Maybe<Scalars['Int']['output']>;
  SubgraphModule_createDocument?: Maybe<Scalars['String']['output']>;
  SubgraphModule_setSubgraphName?: Maybe<Scalars['Int']['output']>;
  SubgraphModule_setSubgraphStatus?: Maybe<Scalars['Int']['output']>;
  VetraPackage_addPackageKeyword?: Maybe<Scalars['Int']['output']>;
  VetraPackage_createDocument?: Maybe<Scalars['String']['output']>;
  VetraPackage_removePackageKeyword?: Maybe<Scalars['Int']['output']>;
  VetraPackage_setPackageAuthor?: Maybe<Scalars['Int']['output']>;
  VetraPackage_setPackageAuthorName?: Maybe<Scalars['Int']['output']>;
  VetraPackage_setPackageAuthorWebsite?: Maybe<Scalars['Int']['output']>;
  VetraPackage_setPackageCategory?: Maybe<Scalars['Int']['output']>;
  VetraPackage_setPackageDescription?: Maybe<Scalars['Int']['output']>;
  VetraPackage_setPackageGithubUrl?: Maybe<Scalars['Int']['output']>;
  VetraPackage_setPackageName?: Maybe<Scalars['Int']['output']>;
  VetraPackage_setPackageNpmUrl?: Maybe<Scalars['Int']['output']>;
  addDrive?: Maybe<AddDriveResult>;
  deleteDrive?: Maybe<Scalars['Boolean']['output']>;
  setDriveIcon?: Maybe<Scalars['Boolean']['output']>;
  setDriveName?: Maybe<Scalars['Boolean']['output']>;
};


/** Mutations: AppModule */
export type MutationAppModule_AddDocumentTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AppModule_AddDocumentTypeInput>;
};


/** Mutations: AppModule */
export type MutationAppModule_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


/** Mutations: AppModule */
export type MutationAppModule_RemoveDocumentTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AppModule_RemoveDocumentTypeInput>;
};


/** Mutations: AppModule */
export type MutationAppModule_SetAppNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AppModule_SetAppNameInput>;
};


/** Mutations: AppModule */
export type MutationAppModule_SetAppStatusArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AppModule_SetAppStatusInput>;
};


/** Mutations: AppModule */
export type MutationAppModule_SetDragAndDropEnabledArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<AppModule_SetDragAndDropEnabledInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_AddMemberArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_AddMemberInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_AddPackageArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_AddPackageInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_AddSpaceArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_AddSpaceInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


/** Mutations: AppModule */
export type MutationBuilderTeam_RemoveMemberArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_RemoveMemberInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_RemovePackageArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_RemovePackageInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_RemoveSpaceArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_RemoveSpaceInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_ReorderPackagesArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_ReorderPackagesInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_ReorderSpacesArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_ReorderSpacesInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_SetDescriptionArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_SetDescriptionInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_SetLogoArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_SetLogoInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_SetSlugArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_SetSlugInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_SetSocialsArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_SetSocialsInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_SetTeamNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_SetTeamNameInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_UpdateMemberInfoArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_UpdateMemberInfoInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_UpdatePackageInfoArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_UpdatePackageInfoInput>;
};


/** Mutations: AppModule */
export type MutationBuilderTeam_UpdateSpaceInfoArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<BuilderTeam_UpdateSpaceInfoInput>;
};


/** Mutations: AppModule */
export type MutationDocumentEditor_AddDocumentTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<DocumentEditor_AddDocumentTypeInput>;
};


/** Mutations: AppModule */
export type MutationDocumentEditor_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


/** Mutations: AppModule */
export type MutationDocumentEditor_RemoveDocumentTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<DocumentEditor_RemoveDocumentTypeInput>;
};


/** Mutations: AppModule */
export type MutationDocumentEditor_SetEditorNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<DocumentEditor_SetEditorNameInput>;
};


/** Mutations: AppModule */
export type MutationDocumentEditor_SetEditorStatusArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<DocumentEditor_SetEditorStatusInput>;
};


/** Mutations: AppModule */
export type MutationProcessorModule_AddDocumentTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<ProcessorModule_AddDocumentTypeInput>;
};


/** Mutations: AppModule */
export type MutationProcessorModule_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


/** Mutations: AppModule */
export type MutationProcessorModule_RemoveDocumentTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<ProcessorModule_RemoveDocumentTypeInput>;
};


/** Mutations: AppModule */
export type MutationProcessorModule_SetProcessorNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<ProcessorModule_SetProcessorNameInput>;
};


/** Mutations: AppModule */
export type MutationProcessorModule_SetProcessorStatusArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<ProcessorModule_SetProcessorStatusInput>;
};


/** Mutations: AppModule */
export type MutationProcessorModule_SetProcessorTypeArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<ProcessorModule_SetProcessorTypeInput>;
};


/** Mutations: AppModule */
export type MutationSubgraphModule_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};


/** Mutations: AppModule */
export type MutationSubgraphModule_SetSubgraphNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<SubgraphModule_SetSubgraphNameInput>;
};


/** Mutations: AppModule */
export type MutationSubgraphModule_SetSubgraphStatusArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<SubgraphModule_SetSubgraphStatusInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_AddPackageKeywordArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_AddPackageKeywordInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_CreateDocumentArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_RemovePackageKeywordArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_RemovePackageKeywordInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_SetPackageAuthorArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_SetPackageAuthorInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_SetPackageAuthorNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_SetPackageAuthorNameInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_SetPackageAuthorWebsiteArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_SetPackageAuthorWebsiteInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_SetPackageCategoryArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_SetPackageCategoryInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_SetPackageDescriptionArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_SetPackageDescriptionInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_SetPackageGithubUrlArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_SetPackageGithubUrlInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_SetPackageNameArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_SetPackageNameInput>;
};


/** Mutations: AppModule */
export type MutationVetraPackage_SetPackageNpmUrlArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
  input?: InputMaybe<VetraPackage_SetPackageNpmUrlInput>;
};


/** Mutations: AppModule */
export type MutationAddDriveArgs = {
  icon?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  preferredEditor?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


/** Mutations: AppModule */
export type MutationDeleteDriveArgs = {
  id: Scalars['String']['input'];
};


/** Mutations: AppModule */
export type MutationSetDriveIconArgs = {
  icon: Scalars['String']['input'];
  id: Scalars['String']['input'];
};


/** Mutations: AppModule */
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
  timestampUtcMs: Scalars['DateTime']['output'];
  type: Scalars['String']['output'];
};

export type PhOperationContext = {
  __typename?: 'PHOperationContext';
  signer?: Maybe<Signer>;
};

export type ProcessorModule = IDocument & {
  __typename?: 'ProcessorModule';
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: ProcessorModule_ProcessorModuleState;
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: ProcessorModule_ProcessorModuleState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type ProcessorModuleOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: ProcessorModule */
export type ProcessorModuleQueries = {
  __typename?: 'ProcessorModuleQueries';
  getDocument?: Maybe<ProcessorModule>;
  getDocuments?: Maybe<Array<ProcessorModule>>;
};


/** Queries: ProcessorModule */
export type ProcessorModuleQueriesGetDocumentArgs = {
  docId: Scalars['PHID']['input'];
  driveId?: InputMaybe<Scalars['PHID']['input']>;
};


/** Queries: ProcessorModule */
export type ProcessorModuleQueriesGetDocumentsArgs = {
  driveId: Scalars['String']['input'];
};

/** Subgraph definition for ProcessorModule (powerhouse/processor) */
export type ProcessorModuleState = {
  __typename?: 'ProcessorModuleState';
  documentTypes: Array<DocumentTypeItem>;
  name: Scalars['String']['output'];
  status: StatusType;
  type: Scalars['String']['output'];
};

export type ProcessorModule_AddDocumentTypeInput = {
  documentType: Scalars['String']['input'];
  id: Scalars['OID']['input'];
};

export type ProcessorModule_DocumentTypeItem = {
  __typename?: 'ProcessorModule_DocumentTypeItem';
  documentType: Scalars['String']['output'];
  id: Scalars['OID']['output'];
};

export type ProcessorModule_ProcessorModuleState = {
  __typename?: 'ProcessorModule_ProcessorModuleState';
  documentTypes: Array<ProcessorModule_DocumentTypeItem>;
  name: Scalars['String']['output'];
  status: ProcessorModule_StatusType;
  type: Scalars['String']['output'];
};

export type ProcessorModule_RemoveDocumentTypeInput = {
  id: Scalars['OID']['input'];
};

/** Module: BaseOperations */
export type ProcessorModule_SetProcessorNameInput = {
  name: Scalars['String']['input'];
};

export type ProcessorModule_SetProcessorStatusInput = {
  status: StatusType;
};

export type ProcessorModule_SetProcessorTypeInput = {
  type: Scalars['String']['input'];
};

export enum ProcessorModule_StatusType {
  Confirmed = 'CONFIRMED',
  Draft = 'DRAFT'
}

export type Query = {
  __typename?: 'Query';
  AppModule?: Maybe<AppModuleQueries>;
  BuilderTeam?: Maybe<BuilderTeamQueries>;
  DocumentEditor?: Maybe<DocumentEditorQueries>;
  ProcessorModule?: Maybe<ProcessorModuleQueries>;
  SubgraphModule?: Maybe<SubgraphModuleQueries>;
  VetraPackage?: Maybe<VetraPackageQueries>;
  analytics?: Maybe<AnalyticsQuery>;
  driveIdBySlug?: Maybe<Scalars['String']['output']>;
  drives: Array<Scalars['String']['output']>;
  fetchAllBuilderTeams: Array<BuilderTeamType>;
  fetchBuilderTeam?: Maybe<BuilderTeamType>;
  vetraPackages: Array<VetraPackageItem>;
};


export type QueryDriveIdBySlugArgs = {
  slug: Scalars['String']['input'];
};


export type QueryFetchAllBuilderTeamsArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
};


export type QueryFetchBuilderTeamArgs = {
  driveId?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  slug?: InputMaybe<Scalars['String']['input']>;
};


export type QueryVetraPackagesArgs = {
  documentId_in?: InputMaybe<Array<Scalars['PHID']['input']>>;
  search?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
};

export type RenownProfileInfo = {
  __typename?: 'RenownProfileInfo';
  ethAddress?: Maybe<Scalars['String']['output']>;
  id: Scalars['OID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  phid?: Maybe<Scalars['PHID']['output']>;
  profileImage?: Maybe<Scalars['String']['output']>;
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

export enum StatusType {
  Confirmed = 'CONFIRMED',
  Draft = 'DRAFT'
}

export type SubgraphModule = IDocument & {
  __typename?: 'SubgraphModule';
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: SubgraphModule_SubgraphModuleState;
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: SubgraphModule_SubgraphModuleState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type SubgraphModuleOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

/** Queries: SubgraphModule */
export type SubgraphModuleQueries = {
  __typename?: 'SubgraphModuleQueries';
  getDocument?: Maybe<SubgraphModule>;
  getDocuments?: Maybe<Array<SubgraphModule>>;
};


/** Queries: SubgraphModule */
export type SubgraphModuleQueriesGetDocumentArgs = {
  docId: Scalars['PHID']['input'];
  driveId?: InputMaybe<Scalars['PHID']['input']>;
};


/** Queries: SubgraphModule */
export type SubgraphModuleQueriesGetDocumentsArgs = {
  driveId: Scalars['String']['input'];
};

/** Subgraph definition for SubgraphModule (powerhouse/subgraph) */
export type SubgraphModuleState = {
  __typename?: 'SubgraphModuleState';
  name: Scalars['String']['output'];
  status: StatusType;
};

/** Module: BaseOperations */
export type SubgraphModule_SetSubgraphNameInput = {
  name: Scalars['String']['input'];
};

export type SubgraphModule_SetSubgraphStatusInput = {
  status: StatusType;
};

export enum SubgraphModule_StatusType {
  Confirmed = 'CONFIRMED',
  Draft = 'DRAFT'
}

export type SubgraphModule_SubgraphModuleState = {
  __typename?: 'SubgraphModule_SubgraphModuleState';
  name: Scalars['String']['output'];
  status: SubgraphModule_StatusType;
};

export type Value = {
  __typename?: 'Value';
  description?: Maybe<Scalars['String']['output']>;
  icon?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  path?: Maybe<Scalars['String']['output']>;
};

export type VetraBuilderProfile = {
  __typename?: 'VetraBuilderProfile';
  description?: Maybe<Scalars['String']['output']>;
  logo?: Maybe<Scalars['URL']['output']>;
  name: Scalars['String']['output'];
  slug: Scalars['String']['output'];
  socials: VetraBuilderSocials;
};

export type VetraBuilderSocials = {
  __typename?: 'VetraBuilderSocials';
  github?: Maybe<Scalars['URL']['output']>;
  website?: Maybe<Scalars['URL']['output']>;
  xProfile?: Maybe<Scalars['URL']['output']>;
};

export type VetraBuilderSpace = {
  __typename?: 'VetraBuilderSpace';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['OID']['output'];
  packages: Array<VetraPackageInfo>;
  sortOrder: Scalars['Int']['output'];
  title: Scalars['String']['output'];
};

export type VetraPackage = IDocument & {
  __typename?: 'VetraPackage';
  createdAtUtcIso: Scalars['DateTime']['output'];
  documentType: Scalars['String']['output'];
  id: Scalars['String']['output'];
  initialState: VetraPackage_VetraPackageState;
  lastModifiedAtUtcIso: Scalars['DateTime']['output'];
  name: Scalars['String']['output'];
  operations: Array<Operation>;
  revision: Scalars['Int']['output'];
  state: VetraPackage_VetraPackageState;
  stateJSON?: Maybe<Scalars['JSONObject']['output']>;
};


export type VetraPackageOperationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};

export type VetraPackageInfo = {
  __typename?: 'VetraPackageInfo';
  description?: Maybe<Scalars['String']['output']>;
  github?: Maybe<Scalars['String']['output']>;
  id: Scalars['OID']['output'];
  npm?: Maybe<Scalars['String']['output']>;
  phid?: Maybe<Scalars['PHID']['output']>;
  sortOrder: Scalars['Int']['output'];
  title?: Maybe<Scalars['String']['output']>;
  vetraDriveUrl?: Maybe<Scalars['URL']['output']>;
};

/** Subgraph definition */
export type VetraPackageItem = {
  __typename?: 'VetraPackageItem';
  authorName?: Maybe<Scalars['String']['output']>;
  authorWebsite?: Maybe<Scalars['String']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  documentId: Scalars['String']['output'];
  driveId?: Maybe<Scalars['String']['output']>;
  githubUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  npmUrl?: Maybe<Scalars['String']['output']>;
};

/** Queries: VetraPackage */
export type VetraPackageQueries = {
  __typename?: 'VetraPackageQueries';
  getDocument?: Maybe<VetraPackage>;
  getDocuments?: Maybe<Array<VetraPackage>>;
};


/** Queries: VetraPackage */
export type VetraPackageQueriesGetDocumentArgs = {
  docId?: InputMaybe<Scalars['PHID']['input']>;
  driveId?: InputMaybe<Scalars['String']['input']>;
};

/** Subgraph definition for VetraPackage (powerhouse/package) */
export type VetraPackageState = {
  __typename?: 'VetraPackageState';
  author: Author;
  category?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  githubUrl?: Maybe<Scalars['URL']['output']>;
  keywords: Array<Keyword>;
  name?: Maybe<Scalars['String']['output']>;
  npmUrl?: Maybe<Scalars['URL']['output']>;
};

export type VetraPackage_AddPackageKeywordInput = {
  id: Scalars['String']['input'];
  label: Scalars['String']['input'];
};

export type VetraPackage_Author = {
  __typename?: 'VetraPackage_Author';
  name?: Maybe<Scalars['String']['output']>;
  website?: Maybe<Scalars['URL']['output']>;
};

export type VetraPackage_Keyword = {
  __typename?: 'VetraPackage_Keyword';
  id: Scalars['OID']['output'];
  label: Scalars['String']['output'];
};

export type VetraPackage_RemovePackageKeywordInput = {
  id: Scalars['String']['input'];
};

export type VetraPackage_SetPackageAuthorInput = {
  name?: InputMaybe<Scalars['OID']['input']>;
  website?: InputMaybe<Scalars['URL']['input']>;
};

export type VetraPackage_SetPackageAuthorNameInput = {
  name: Scalars['String']['input'];
};

export type VetraPackage_SetPackageAuthorWebsiteInput = {
  website: Scalars['URL']['input'];
};

export type VetraPackage_SetPackageCategoryInput = {
  category: Scalars['String']['input'];
};

export type VetraPackage_SetPackageDescriptionInput = {
  description: Scalars['String']['input'];
};

export type VetraPackage_SetPackageGithubUrlInput = {
  url: Scalars['URL']['input'];
};

/** Module: BaseOperations */
export type VetraPackage_SetPackageNameInput = {
  name: Scalars['String']['input'];
};

export type VetraPackage_SetPackageNpmUrlInput = {
  url: Scalars['URL']['input'];
};

export type VetraPackage_VetraPackageState = {
  __typename?: 'VetraPackage_VetraPackageState';
  author: VetraPackage_Author;
  category?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  githubUrl?: Maybe<Scalars['URL']['output']>;
  keywords: Array<VetraPackage_Keyword>;
  name?: Maybe<Scalars['String']['output']>;
  npmUrl?: Maybe<Scalars['URL']['output']>;
};

export type FetchBuilderTeamQueryVariables = Exact<{
  fetchBuilderTeamId?: InputMaybe<Scalars['String']['input']>;
  fetchBuilderTeamSlug?: InputMaybe<Scalars['String']['input']>;
}>;


export type FetchBuilderTeamQuery = { __typename?: 'Query', fetchBuilderTeam?: { __typename?: 'BuilderTeamType', id: string, profileName: string, profileSlug: string, profileLogo?: string | null, profileDescription?: string | null, profileSocialsX?: string | null, profileSocialsGithub?: string | null, profileSocialsWebsite?: string | null, createdAt: string, updatedAt: string, spaces: Array<{ __typename?: 'BuilderTeamSpace', id: string, builderAccountId: string, title: string, description?: string | null, createdAt: string, updatedAt: string, packages: Array<{ __typename?: 'BuilderTeamPackage', id: string, spaceId: string, name: string, description?: string | null, vetraDriveUrl?: string | null, driveId?: string | null, sortOrder: number, createdAt: string, updatedAt: string, githubUrl?: string | null, npmUrl?: string | null }> }>, members: Array<{ __typename?: 'BuilderTeamMember', id: string, builderAccountId: string, phid?: string | null, name?: string | null, profileImage?: string | null, ethAddress: string, createdAt: string }> } | null };

export type FetchAllBuilderTeamsQueryVariables = Exact<{
  search?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
}>;


export type FetchAllBuilderTeamsQuery = { __typename?: 'Query', fetchAllBuilderTeams: Array<{ __typename?: 'BuilderTeamType', id: string, profileName: string, profileSlug: string, profileLogo?: string | null, profileDescription?: string | null, profileSocialsX?: string | null, profileSocialsGithub?: string | null, profileSocialsWebsite?: string | null, createdAt: string, updatedAt: string, spaces: Array<{ __typename?: 'BuilderTeamSpace', id: string, builderAccountId: string, title: string, description?: string | null, createdAt: string, updatedAt: string, packages: Array<{ __typename?: 'BuilderTeamPackage', id: string, spaceId: string, name: string, description?: string | null, vetraDriveUrl?: string | null, driveId?: string | null, sortOrder: number, createdAt: string, updatedAt: string, githubUrl?: string | null, npmUrl?: string | null }> }>, members: Array<{ __typename?: 'BuilderTeamMember', id: string, builderAccountId: string, phid?: string | null, name?: string | null, profileImage?: string | null, ethAddress: string, createdAt: string }> }> };

export type GetVetraPackagesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetVetraPackagesQuery = { __typename?: 'Query', vetraPackages: Array<{ __typename?: 'VetraPackageItem', documentId: string, name: string, description?: string | null, category?: string | null, authorName?: string | null, authorWebsite?: string | null, githubUrl?: string | null, npmUrl?: string | null, driveId?: string | null }> };
