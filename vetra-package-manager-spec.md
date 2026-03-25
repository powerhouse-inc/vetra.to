# Specification: Vetra.io Package Library & Registry Frontend

## 1. Project Overview

Build the frontend for the Vetra Package Manager, a centralized registry for discovering and managing Vetra modules. The system must allow users to filter through various packages and document types (Applications, Editors, Subgraphs, etc.) and view live/simulated previews of their functionality.

**Target Environment:** React, Tailwind CSS, Lucide-React (icons).
**Data Source:** Integration with Vetra Backend API.

---

## 2. UI Layout Architecture (Based on Figma Design)

### 2.1 Left Sidebar: Hierarchical Filter System

**Design System:**

- Background: `#f3f5f7` (Figma token)
- Width: `256px` fixed
- Border radius: `12px` for filter cards
- Text color: `#343839` (primary text)

**Primary Filter Selection (Mutually Exclusive):**

- **Packages Filter:** Search across complete packages (default view)
- **Document Type Filters:** Search for specific document types/modules within packages:
  - **Applications:** Search for application modules within packages
  - **Document Editors:** Search for editor modules within packages
  - **Document Models:** Search for document model modules within packages  
  - **Subgraphs:** Search for subgraph modules within packages
  - **Processors:** Search for processor modules within packages

**Secondary Category Filters (Additive):**

Applied on top of primary filter selection:
- **Categories:** Engineering, Finance, Governance, Operations
- **Publishers:** Powerhouse, MakerDAO, Community, etc.
- **Status:** Available, Installed, Update Available

**Filter Interaction Logic:**

```typescript
interface FilterState {
  // Primary filter (only one active)
  primaryFilter: 'packages' | 'applications' | 'documentEditors' | 'documentModels' | 'subgraphs' | 'processors';
  
  // Secondary filters (multiple can be active)
  categories: string[];
  publishers: string[];
  status: string[];
  
  // Search query
  searchQuery: string;
}

// Filter hierarchy: Primary → Secondary → Search Query
const filteredResults = applyFilters(allPackages, filterState);
```

**SVG Icons from Figma:**

```jsx
// Filter toggle icon
<svg viewBox="0 0 16 16" className="w-4 h-4">
  <path d="M3 5h10M6 10h4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
</svg>

// Search icon
<svg viewBox="0 0 16 16" className="w-4 h-4">
  <path d="M14 14l-3-3m1-5a6 6 0 11-12 0 6 6 0 0112 0z" stroke="currentColor" strokeWidth={1.5}/>
</svg>
```

### 2.2 Main Content: Dynamic Package Grid with Selection

**Grid Behavior:**

- **Default State:** 3-column grid showing filtered packages/document types
- **Selection State:** Selected package appears as first card, followed by its document types
- **Responsive:** 3 columns desktop, 2 columns tablet, 1 column mobile
- **Card Dimensions:** `400px` width (flexible height)

**Package Selection Interaction:**

1. **Package Selection:** User clicks on a package card
2. **Grid Reorder:** Selected package moves to first position
3. **Document Type Expansion:** Package's document types appear as subsequent cards
4. **Selection Overlay:** Floating header appears above grid showing package details
5. **Filter Update:** Selected package name appears in left sidebar as active selection indicator

**Card Anatomy (Figma Specification):**

```jsx
<div className="flex flex-col overflow-hidden rounded-[12px] bg-white shadow-sm">
  {/* Header Section - 41px fixed height */}
  <div className="flex h-[41px] items-center justify-center bg-[#f3f5f7] px-[16px]">
    <h3 className="inter-semibold text-[16px] leading-[19.36px] text-[#343839]">{packageName}</h3>
  </div>

  {/* Preview Section - 235px fixed height */}
  <div className="relative flex h-[235px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef]">
    <ModuleTypeFloatingIndicator type={primaryModuleType} />
    <PrimaryModulePreview module={primaryModule} />
  </div>

  {/* Footer Section - Variable height */}
  <div className="flex flex-col gap-[4px] bg-[#f3f5f7] px-[12px] py-[8px]">
    <div className="flex items-center justify-between">
      <span className="inter-medium text-[14px] text-[#343839]">{publisherName}</span>
      <PackageStatusBadge status={status} />
    </div>
    <p className="inter-regular line-clamp-2 text-[12px] text-[#6b7280]">{description}</p>
    <InstallButton variant="figma" />
  </div>
</div>
```

---

## 3. Package vs Module Differentiation & Visual Strategy

### 3.1 Package-First Architecture (Recommended Approach)

**Packages** are the installable units that contain multiple **modules/document types**:

```typescript
// Package Level (installable unit)
interface VetraPackage {
  name: string // "ToDo Management Package"
  description: string // Package description
  publisher: { name: string; url: string }

  // Contains multiple modules:
  documentModels: DocumentModel[] // Schema definitions
  editors: Editor[] // React editors
  apps: App[] // Full applications
  subgraphs: Subgraph[] // GraphQL APIs
  processors: Processor[] // Data transformations
}

// Module Level (components within package)
interface DocumentModel {
  id: string // "powerhouse/todo"
  name: string // "ToDoDocument"
}
```

### 3.2 Visual Preview Strategy (Figma Implementation)

**Primary Preview Logic** (235px fixed height container):

1. If package has `apps` → show application thumbnail with floating type indicator
2. If package has `editors` → show editor interface mockup
3. If package has `documentModels` → show schema visualization with gradient background
4. If package has `subgraphs` → show GraphQL query preview
5. If package has `processors` → show data flow diagram
6. Fallback to abstract geometric pattern

**Floating Module Type Indicator** (Figma Design):

```jsx
<div className="absolute top-[8px] right-[8px] z-10">
  <div className="flex items-center gap-[4px] rounded-[6px] bg-white/90 px-[8px] py-[4px] shadow-sm backdrop-blur-sm">
    <TypeIcon type={primaryType} className="h-[12px] w-[12px]" />
    <span className="inter-medium text-[10px] tracking-wide text-[#343839] uppercase">
      {getTypeLabel(primaryType)}
    </span>
  </div>
</div>
```

**Background Pattern System**:

```jsx
// Dynamic background based on package type
const getPreviewBackground = (packageType: string) => {
  const patterns = {
    application: 'bg-gradient-to-br from-orange-50 to-orange-100',
    documentModel: 'bg-gradient-to-br from-red-50 to-red-100',
    editor: 'bg-gradient-to-br from-green-50 to-green-100',
    subgraph: 'bg-gradient-to-br from-purple-50 to-purple-100',
    processor: 'bg-gradient-to-br from-blue-50 to-blue-100'
  };
  return patterns[packageType] || 'bg-gradient-to-br from-gray-50 to-gray-100';
};
```

**Module Details Modal** (Figma Navigation Pattern):

```jsx
// Expandable to full-screen detail view
<PackageDetailModal>
  <SelectedPackageHeader packageName={selectedPackage.name} />
  <ModuleGrid modules={selectedPackage.getAllModules()} />
  <DetailedInstallFlow />
</PackageDetailModal>
```

### 3.3 Module-Specific Visual Previews (Primary Preview Component)

Each module type has a unique preview when it's the package's primary component:

| Package Type                | Visual Specification | Implementation Detail                                                                               |
| :-------------------------- | :------------------- | :-------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Document Model**          | **Wordcloud**        | Use a terminal-style font (e.g., JetBrains Mono). Words sized by frequency/importance.              |
| **Editor**                  | **Thumbnail**        | 1280 × 720 aspect ratio mockup. High-fidelity UI screenshot.                                        |
| **Application**             | **Thumbnail**        | 1280 × 720 aspect ratio mockup. High-fidelity UI screenshot.                                        |
| **Relational DB Processor** | **ERD Diagram**      | A React component rendering simplified schema entities (tables/links).                              |
| **Subgraph**                | **Code Snippet**     | Display sample GraphQL `Queries` & `Mutations` in a syntax-highlighted block.                       |
| **Analytics Processor**     | **Metrics View**     | 2-column layout showing "Metric Name"                                                               | "Value" (e.g., Throughput: 450/s). |
| **Code Generators**         | **Language Icon**    | Logo of the programming language + Type (e.g., TypeScript, Go, Rust). Style: "The Guild" aesthetic. |

---

## 4. Technical Requirements

### 4.1 State Management & Filtering

- Implement a `usePackages` hook to manage fetching, sorting, and filtering logic.
- Filter state should be reflected in the URL parameters for shareable search results.

### 4.2 Backend Integration - Powerhouse Registry

The backend is built on the **@powerhousedao/registry** package, which provides a Verdaccio-based npm registry with custom APIs for package discovery and CDN capabilities.

#### 4.2.1 Core API Endpoints

- **`GET /packages`** - Returns all discovered packages
  - Supports `?documentType=<type>` filtering (e.g., `?documentType=powerhouse/package`)
- **`GET /packages/by-document-type?type=<documentType>`** - Returns package names containing specific document type
- **`GET /packages/<packageName>`** - Returns single package info (supports scoped names like `@powerhousedao/vetra`)
- **`GET /-/cdn/<packageName>/<filePath>`** - Serves package files from CDN cache

#### 4.2.2 Data Models (Based on Powerhouse Registry)

```typescript
// Core package structure from Powerhouse shared types
interface PowerhouseManifest {
  name: string
  description?: string
  version?: string
  category?: string
  publisher?: {
    name: string
    url: string
  }
  documentModels?: PowerhouseManifestDocumentModel[]
  editors?: PowerhouseManifestEditor[]
  apps?: PowerhouseManifestApp[]
  subgraphs?: unknown[]
  importScripts?: unknown[]
}

interface PowerhouseManifestDocumentModel {
  id: string
  name: string
}

interface PowerhouseManifestEditor {
  id: string
  name: string
  documentTypes: string[]
}

interface PowerhouseManifestApp {
  id: string
  name: string
  driveEditor?: string
}

// Package info returned by API
interface PackageInfo {
  name: string
  path: string // CDN path like "/-/cdn/package-name"
  manifest: PowerhouseManifest | null
}

// Extended for frontend use
type VetraPackage = PackageInfo & {
  status: 'available' | 'local-install' | 'registry-install' | 'dismissed'
  documentTypes: string[]
  // Derived from manifest
  type?: 'application' | 'editor' | 'documentModel' | 'subgraph' | 'processor' | 'codegen'
  category?: string
  contributor?: string
  team?: string
}
```

#### 4.2.3 Package Type Mapping

The frontend should map manifest properties to display types:

| Manifest Property | Display Type    | UI Label          |
| :---------------- | :-------------- | :---------------- |
| `apps`            | `application`   | "Application"     |
| `editors`         | `editor`        | "Document Editor" |
| `documentModels`  | `documentModel` | "Document Model"  |
| `subgraphs`       | `subgraph`      | "Subgraph"        |
| `importScripts`   | `processor`     | "Processor"       |

#### 4.2.4 Real-time Updates

The registry supports real-time package notifications:

- **SSE:** `GET /-/events` - Server-sent events for package publish notifications
- **Webhooks:** `POST /-/webhooks` - Register webhook endpoints for notifications

### 4.3 Component Library

- **PackageCard:** Main package cards with exact Figma specifications - 235px preview, hover states, type indicators (See Section 6.1)
- **DocumentTypeCard:** Full-sized cards for individual modules - same 235px preview as PackageCard (See Section 6.3)
- **PackageSelectionFrame:** Floating overlay showing selected package details with Vetra Studio integration (See Section 6.2)
- **FilterSidebar:** Hierarchical filtering system with selected package indicator and dynamic search (See Section 6.4)
- **ModuleTypePreview Factory:** Dynamic preview components switching between schema visualizations, thumbnails, and code blocks (See Section 3.2)
- **PackageTypeBadge:** Color-coded badges using Figma design system - Orange for Applications, Red for Document Models, etc. (See Section 5.4)
- **SearchInput:** Dynamic placeholder text based on current filter scope (See Section 6.6)
- **RadioFilterOption & FilterGroup:** Primary and secondary filter controls with package counts (See Section 6.6)

---

## 5. Design Tokens (Figma Design System)

### 5.1 Color System

```css
/* Primary Colors */
--primary-text: #343839; /* Main text */
--secondary-text: #6b7280; /* Muted text */
--background-primary: #ffffff; /* Card backgrounds */
--background-secondary: #f3f5f7; /* Header/footer sections */
--background-tertiary: #f8f9fa; /* Page background */

/* Accent Colors */
--accent-blue: #504dff; /* Primary actions */
--accent-orange: #ff891d; /* Applications */
--accent-green: #10b981; /* Success states */
--accent-red: #ef4444; /* Document models */
--accent-purple: #8b5cf6; /* Subgraphs */
```

### 5.2 Typography (Inter Font Family)

```css
/* Inter Font Weights */
.inter-regular {
  font-family: Inter;
  font-weight: 400;
}
.inter-medium {
  font-family: Inter;
  font-weight: 500;
}
.inter-semibold {
  font-family: Inter;
  font-weight: 600;
}
.inter-bold {
  font-family: Inter;
  font-weight: 700;
}

/* Size Scale */
--text-xs: 12px; /* Descriptions, metadata */
--text-sm: 14px; /* Secondary info */
--text-base: 16px; /* Primary text */
--text-lg: 18px; /* Section headers */
--text-xl: 20px; /* Page titles */
```

### 5.3 Layout System

```css
/* Border Radius */
--radius-sm: 8px; /* Small components */
--radius-md: 12px; /* Cards, buttons */
--radius-lg: 16px; /* Panels, modals */

/* Spacing Scale */
--space-1: 4px; /* gap-1 */
--space-2: 8px; /* gap-2 */
--space-3: 12px; /* gap-3 */
--space-4: 16px; /* gap-4 */
--space-6: 24px; /* gap-6 */
--space-8: 32px; /* gap-8 */

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
```

### 5.4 Module Type Colors (Figma Specification)

- **Applications:** `#ff891d` (Orange)
- **Document Models:** `#ef4444` (Red)
- **Editors:** `#10b981` (Green)
- **Subgraphs:** `#8b5cf6` (Purple)
- **Processors:** `#504dff` (Blue)

---

## 6. Figma Component Architecture

### 6.1 Package Card Component (Exact Figma Implementation)

**Component Structure:**

```jsx
// Based on Figma exports
interface PackageCardProps {
  name: string;
  description: string;
  publisher: { name: string; url: string };
  primaryModuleType: 'application' | 'documentModel' | 'editor' | 'subgraph' | 'processor';
  status: 'available' | 'installing' | 'installed' | 'updateAvailable';
  onClick: () => void;
}

const PackageCard: React.FC<PackageCardProps> = ({ name, description, publisher, primaryModuleType, status, onClick }) => {
  return (
    <div
      className="bg-white rounded-[12px] figma-card flex flex-col gap-[8px] pb-[8px] cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* Header - Exact Figma spacing */}
      <div className="bg-[#f3f5f7] h-[41px] rounded-tl-[12px] rounded-tr-[12px] flex items-center justify-center">
        <h3 className="inter-semibold text-[#343839] text-[16px] leading-[19.36px] text-center">
          {name}
        </h3>
      </div>

      {/* Preview Area - Fixed height from Figma */}
      <div className="h-[235px] relative rounded-[12px] preview-area overflow-hidden">
        <ModuleTypePreview type={primaryModuleType} />
        <FloatingTypeIndicator type={primaryModuleType} />
      </div>

      {/* Footer - Figma background and padding */}
      <div className="preview-bg rounded-[12px] px-[8px] py-[4px]">
        <div className="flex items-center justify-between mb-[4px]">
          <span className="inter-medium text-[#343839] text-[14px]">
            {publisher.name}
          </span>
          <PackageStatusBadge status={status} />
        </div>
        <p className="inter-regular text-[#6b7280] text-[12px] line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
};
```

### 6.2 Package Selection Overlay Frame

**Floating Selection Header (Above Grid):**

```jsx
// Overlay component that appears when a package is selected
const PackageSelectionFrame: React.FC<{ 
  selectedPackage: VetraPackage;
  onDeselect: () => void;
  onOpenInStudio: (packageName: string) => void;
}> = ({ selectedPackage, onDeselect, onOpenInStudio }) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-[12px] p-4 mx-6 mb-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onDeselect}
            className="p-1 hover:bg-gray-100 rounded-md"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
          
          <div>
            <h2 className="inter-semibold text-[#343839] text-[18px] mb-1">
              {selectedPackage.name}
            </h2>
            <div className="flex items-center gap-2 text-[14px] text-[#6b7280] mb-2">
              <span>by {selectedPackage.publisher.name}</span>
              <span>•</span>
              <PackageTypeBadge types={selectedPackage.getModuleTypes()} />
            </div>
            <p className="inter-regular text-[#6b7280] text-[12px] max-w-md line-clamp-2">
              {selectedPackage.description}
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => onOpenInStudio(selectedPackage.name)}
          className="px-4 py-2 bg-[#504dff] text-white text-[14px] rounded-lg hover:bg-[#4338ca] inter-medium"
        >
          Open in Vetra
        </button>
      </div>
    </div>
  );
};
```

### 6.3 Document Type Cards (Selection State)

**Individual Document Type Display:**

```jsx
// Cards that appear after package selection showing individual document types
// Same size as PackageCard but with document type specific content
const DocumentTypeCard: React.FC<{
  documentType: DocumentModel | Editor | App;
  parentPackage: VetraPackage;
}> = ({ documentType, parentPackage }) => {
  return (
    <div className="bg-white rounded-[12px] shadow-sm flex flex-col overflow-hidden">
      {/* Header - Same height as PackageCard */}
      <div className="bg-[#f3f5f7] h-[41px] px-[16px] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <DocumentTypeIcon type={getDocumentTypeCategory(documentType)} className="w-4 h-4" />
          <h3 className="inter-semibold text-[#343839] text-[16px] leading-[19.36px]">
            {documentType.name}
          </h3>
        </div>
      </div>
      
      {/* Preview area - Same height as PackageCard */}
      <div className="h-[235px] relative bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        <DocumentTypePreview documentType={documentType} />
        <FloatingTypeIndicator type={getDocumentTypeCategory(documentType)} />
      </div>
      
      {/* Footer - Same structure as PackageCard */}
      <div className="bg-[#f3f5f7] px-[12px] py-[8px] flex flex-col gap-[4px]">
        <div className="flex items-center justify-between">
          <span className="inter-medium text-[#343839] text-[14px]">
            Part of {parentPackage.name}
          </span>
          <DocumentTypeStatusBadge type={getDocumentTypeCategory(documentType)} />
        </div>
        <p className="inter-regular text-[#6b7280] text-[12px] line-clamp-2">
          {getDocumentTypeDescription(documentType)} • by {parentPackage.publisher.name}
        </p>
      </div>
    </div>
  );
};
```

### 6.4 Filter Sidebar Component

**Left Panel (From Figma SVG Paths):**

```jsx
const FilterSidebar: React.FC = () => {
  return (
    <div className="w-[256px] bg-white rounded-[12px] p-4 h-fit">
      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search packages..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
        />
        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
      </div>

      {/* Filter Groups */}
      <div className="space-y-4">
        <FilterGroup title="Package Types" defaultOpen>
          <FilterOption label="Applications" count={12} color="orange" />
          <FilterOption label="Document Models" count={8} color="red" />
          <FilterOption label="Editors" count={15} color="green" />
          <FilterOption label="Subgraphs" count={6} color="purple" />
          <FilterOption label="Processors" count={4} color="blue" />
        </FilterGroup>

        <FilterGroup title="Categories">
          <FilterOption label="Finance" count={9} />
          <FilterOption label="Engineering" count={14} />
          <FilterOption label="Governance" count={3} />
          <FilterOption label="Operations" count={7} />
        </FilterGroup>

        <FilterGroup title="Publishers">
          <FilterOption label="Powerhouse" count={18} />
          <FilterOption label="MakerDAO" count={6} />
          <FilterOption label="Community" count={11} />
        </FilterGroup>
      </div>
    </div>
  );
};
```

### 6.5 Navigation States and Grid Behavior

**Three-State Navigation Pattern:**

1. **Filtered Overview State**: Grid showing results based on filter selection

   ```jsx
   <PackageManagerOverview>
     <FilterSidebar filterState={filterState} onFilterChange={setFilterState} />
     <PackageGrid 
       packages={filteredPackages} 
       onPackageSelect={handlePackageSelection}
       selectedPackage={null}
     />
   </PackageManagerOverview>
   ```

2. **Package Selection State**: Selected package with document type expansion

   ```jsx
   <PackageManagerWithSelection>
     <FilterSidebar filterState={filterState} onFilterChange={setFilterState} />
     <div className="relative">
       {/* Floating selection overlay */}
       <PackageSelectionFrame 
         selectedPackage={selectedPackage}
         onDeselect={() => setSelectedPackage(null)}
         onOpenInStudio={handleOpenInStudio}
       />
       
       {/* Reordered grid: selected package first, then its document types */}
       <PackageGrid 
         packages={[selectedPackage, ...getDocumentTypeCards(selectedPackage)]}
         selectedPackage={selectedPackage}
         showDocumentTypes={true}
       />
     </div>
   </PackageManagerWithSelection>
   ```

3. **Vetra Studio Integration**: External navigation to Vetra Studio

   ```jsx
   // Triggers navigation to Vetra Studio with package context
   const handleOpenInStudio = (packageName: string) => {
     window.open(`/studio?package=${packageName}`, '_blank');
   };
   ```

**Grid Reordering Logic:**

```typescript
const getReorderedPackages = (
  allPackages: VetraPackage[], 
  selectedPackage: VetraPackage | null,
  showDocumentTypes: boolean
): (VetraPackage | DocumentType)[] => {
  if (!selectedPackage) return allPackages;
  
  const reorderedList: (VetraPackage | DocumentType)[] = [selectedPackage];
  
  if (showDocumentTypes) {
    // Add individual document types from selected package
    selectedPackage.documentModels?.forEach(dm => reorderedList.push(dm));
    selectedPackage.editors?.forEach(editor => reorderedList.push(editor));
    selectedPackage.apps?.forEach(app => reorderedList.push(app));
    selectedPackage.subgraphs?.forEach(sg => reorderedList.push(sg));
    selectedPackage.processors?.forEach(proc => reorderedList.push(proc));
  }
  
  // Add remaining packages (excluding selected one)
  const remainingPackages = allPackages.filter(pkg => pkg.name !== selectedPackage.name);
  reorderedList.push(...remainingPackages);
  
  return reorderedList;
};
```

---

## 6.6 Filter State Management and Search Logic

**Complete Filter Interaction Flow:**

```typescript
// Enhanced filter state management
interface FilterState {
  // Primary filter determines search scope
  primaryFilter: 'packages' | 'applications' | 'documentEditors' | 'documentModels' | 'subgraphs' | 'processors';
  
  // Secondary filters refine results
  categories: string[];
  publishers: string[];
  status: string[];
  
  // Search query applies to filtered scope
  searchQuery: string;
}

// Filter application logic
const applyFilters = (allPackages: VetraPackage[], filterState: FilterState) => {
  let results = [...allPackages];
  
  // Step 1: Apply primary filter (mutually exclusive)
  if (filterState.primaryFilter === 'packages') {
    // Show all packages (default view)
    results = allPackages;
  } else {
    // Filter to packages that contain specific document types/modules
    results = allPackages.filter(pkg => {
      switch (filterState.primaryFilter) {
        case 'applications': return pkg.apps?.length > 0;
        case 'documentEditors': return pkg.editors?.length > 0;
        case 'documentModels': return pkg.documentModels?.length > 0;
        case 'subgraphs': return pkg.subgraphs?.length > 0;
        case 'processors': return pkg.processors?.length > 0;
        default: return true;
      }
    });
  }
  
  // Step 2: Apply secondary filters (additive)
  if (filterState.categories.length > 0) {
    results = results.filter(pkg => 
      pkg.category && filterState.categories.includes(pkg.category)
    );
  }
  
  if (filterState.publishers.length > 0) {
    results = results.filter(pkg => 
      pkg.publisher && filterState.publishers.includes(pkg.publisher.name)
    );
  }
  
  if (filterState.status.length > 0) {
    results = results.filter(pkg => 
      filterState.status.includes(pkg.status)
    );
  }
  
  // Step 3: Apply search query
  if (filterState.searchQuery.trim()) {
    const query = filterState.searchQuery.toLowerCase();
    results = results.filter(pkg => 
      pkg.name.toLowerCase().includes(query) ||
      pkg.description?.toLowerCase().includes(query) ||
      pkg.publisher?.name.toLowerCase().includes(query)
    );
  }
  
  return results;
};

// Search behavior within filtered scope
const handleSearch = (query: string, filterState: FilterState) => {
  const updatedState = { ...filterState, searchQuery: query };
  const filteredPackages = applyFilters(allPackages, updatedState);
  
  // If a document type filter is active, enhance results with individual modules
  if (filterState.primaryFilter !== 'packages') {
    return enhanceWithDocumentTypeResults(filteredPackages, query, filterState.primaryFilter);
  }
  
  return filteredPackages;
};
```

**Filter UI Component Integration:**

```jsx
const FilterSidebar: React.FC<{
  filterState: FilterState;
  onFilterChange: (newState: FilterState) => void;
  packageCounts: Record<string, number>;
  selectedPackage?: VetraPackage | null;
  onDeselectPackage?: () => void;
}> = ({ filterState, onFilterChange, packageCounts, selectedPackage, onDeselectPackage }) => {
  return (
    <div className="w-[256px] bg-white rounded-[12px] p-4 h-fit">
      {/* Selected Package Indicator */}
      {selectedPackage && (
        <div className="mb-4 p-3 bg-[#504dff]/10 rounded-[8px] border border-[#504dff]/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="inter-medium text-[#504dff] text-[12px] uppercase tracking-wide">
                Selected Package
              </span>
              <h4 className="inter-semibold text-[#343839] text-[14px] mt-1">
                {selectedPackage.name}
              </h4>
            </div>
            <button 
              onClick={onDeselectPackage}
              className="p-1 hover:bg-[#504dff]/20 rounded-md"
            >
              <X className="w-3 h-3 text-[#504dff]" />
            </button>
          </div>
        </div>
      )}
      
      {/* Search Input */}
      <SearchInput 
        value={filterState.searchQuery}
        onChange={(query) => onFilterChange({...filterState, searchQuery: query})}
        placeholder={getSearchPlaceholder(filterState.primaryFilter)}
      />
      
      {/* Primary Filter Selection */}
      <FilterGroup title="Search Scope" defaultOpen>
        <RadioFilterOption 
          label="All Packages"
          value="packages"
          checked={filterState.primaryFilter === 'packages'}
          count={packageCounts.packages}
          onChange={(value) => onFilterChange({...filterState, primaryFilter: value})}
        />
        <RadioFilterOption 
          label="Applications"
          value="applications" 
          checked={filterState.primaryFilter === 'applications'}
          count={packageCounts.applications}
          onChange={(value) => onFilterChange({...filterState, primaryFilter: value})}
        />
        {/* ... other primary filters */}
      </FilterGroup>
      
      {/* Secondary Filters */}
      <FilterGroup title="Categories">
        {/* Multi-select category filters */}
      </FilterGroup>
    </div>
  );
};

// Dynamic search placeholder based on filter
const getSearchPlaceholder = (primaryFilter: string) => {
  const placeholders = {
    packages: "Search all packages...",
    applications: "Search for application modules...",
    documentEditors: "Search for editor modules...", 
    documentModels: "Search for document models...",
    subgraphs: "Search for subgraph modules...",
    processors: "Search for processor modules..."
  };
  return placeholders[primaryFilter] || "Search packages...";
};
```

---

## 7. Claude Code Implementation Guide

### 7.1 Implementation Priority Order

**For Claude Code implementation, tackle in this exact sequence:**

1. **Start with Core Components** (Sections 6.1-6.4 reference implementations)
   - Create `PackageCard` component using exact Figma specifications in Section 6.1
   - Create `DocumentTypeCard` component (same size as PackageCard) using Section 6.3
   - Create `PackageSelectionFrame` floating overlay using Section 6.2
   - Create `FilterSidebar` with hierarchical logic using Section 6.4

2. **Implement Filter Logic** (Section 6.6 provides complete implementation)
   - Use `FilterState` interface and `applyFilters` function exactly as specified
   - Implement radio button primary filters (packages vs document types)
   - Add secondary multi-select filters (categories, publishers, status)
   - Add selected package indicator in left sidebar

3. **Add Grid Behavior** (Section 6.5 provides reordering logic)
   - Implement `getReorderedPackages` function from Section 6.5
   - Add package selection state management
   - Add grid reordering when package is selected
   - Add document type expansion after selection

### 7.2 Mock Data Setup (Use Section 10.3 & test-package-data.json)

**Create mock data first for rapid development:**

1. **Use Existing Test Data**
   - Use `test-package-data.json` as base mock data (already in project)
   - Reference Section 10.3 `VetraPackageManifest` interface for structure
   - Create 8-10 varied package examples covering all document types

2. **Create Realistic Package Variations**
   - Finance packages (MakerDAO publisher)
   - Engineering packages (Community publisher)  
   - Productivity packages (Powerhouse publisher)
   - Ensure each package has different combinations of modules

### 7.3 Integration with Existing Project Structure

**Work within the established Next.js/Tailwind architecture:**

1. **Follow CLAUDE.md Guidelines**
   - Use existing component patterns in `modules/shared/components/ui/`
   - Follow Tailwind CSS 4 and Radix UI component patterns
   - Use TanStack Query for state management
   - Add Storybook stories for each component

2. **File Structure to Create**
   ```
   modules/packages/
   ├── components/
   │   ├── package-card/
   │   ├── document-type-card/
   │   ├── package-selection-frame/
   │   ├── filter-sidebar/
   │   └── package-grid/
   ├── hooks/
   │   ├── use-package-filters.ts
   │   └── use-package-selection.ts
   └── types/
       └── package-types.ts
   ```

### 7.4 Testing Strategy

**Use Storybook for rapid iteration:**

1. **Create Stories for Each Component** (reference `package-manager-prototype.md`)
   - Individual component stories with different states
   - Grid layout stories with various package combinations
   - Filter interaction stories
   - Package selection flow stories

2. **Test with Real Data Patterns**
   - Use mock data that matches E2E test patterns
   - Test all filter combinations
   - Test package selection and deselection flows

---

## 8. Backend Implementation Details

### 8.1 Powerhouse Registry Architecture

The **@powerhousedao/registry** package provides:

- **Verdaccio-based**: Full npm compatibility with custom extensions
- **CDN Capabilities**: Automatic tarball extraction and file serving
- **Manifest Discovery**: Scans for `powerhouse.manifest.json` in multiple locations:
  - `powerhouse.manifest.json`
  - `cdn/powerhouse.manifest.json`
  - `dist/powerhouse.manifest.json`
- **Document Type Filtering**: Built-in support for filtering by `documentType`
- **Scoped Packages**: Supports @org/package naming convention

### 8.2 Package Discovery Process

1. Registry scans CDN cache directory for packages
2. For each package, attempts to read manifest from candidate locations
3. Extracts package metadata from manifest
4. Provides filtering capabilities based on document models

### 8.3 Installation & Configuration

```bash
# Install registry
npm install @powerhousedao/registry

# Run registry
ph-registry --port 8080 --storage-dir ./storage --cdn-cache-dir ./cdn-cache
```

**Environment Variables:**

- `PORT` - Registry port (default: 8080)
- `REGISTRY_STORAGE` - Verdaccio storage directory
- `REGISTRY_CDN_CACHE` - CDN cache directory
- `REGISTRY_UPLINK` - Upstream npm registry URL

---

## 9. Package Installation Strategy

### 9.1 Context-Aware Installation (Strategy 1 - Recommended)

Based on E2E test patterns, the package manager operates within **Connect instance contexts**:

#### 9.1.1 Installation Flow

```typescript
// Package manager embedded in Connect Settings
Connect Instance (localhost:3001)
├── Settings Modal
    ├── Package Manager Tab ← Package discovery & installation
    ├── Drive Management
    ├── Other Settings...
```

**Installation Process:**

1. **User Context**: Package manager opens within an active Connect instance
2. **Package Discovery**: Search and browse packages in current context
3. **One-Click Install**: Install button installs to current Connect instance
4. **Immediate Availability**: Installed package modules appear in document creation

#### 9.1.2 Implementation Pattern (From E2E Tests)

```typescript
// Context-aware installation
const InstallButton = ({ packageName }: { packageName: string }) => {
  const connectContext = useConnectContext(); // Current Connect instance

  const installMutation = useMutation({
    mutationFn: async () => {
      if (!connectContext) {
        throw new Error('No Connect context available');
      }

      // Install to current Connect instance
      return connectContext.installPackage(packageName);
    },
    onSuccess: () => {
      toast.success(`${packageName} installed successfully`);
      // Refresh available document types in current Connect
      connectContext.refreshDocumentTypes();
    }
  });

  return (
    <Button
      onClick={() => installMutation.mutate()}
      disabled={!connectContext || installMutation.isPending}
      className="w-full"
    >
      {installMutation.isPending ? 'Installing...' : 'Install to Current Connect'}
    </Button>
  );
};
```

#### 9.1.3 Post-Installation Flow (E2E Verified)

```typescript
// After installation, packages become available for document creation
test('Package becomes available after installation', async ({ page }) => {
  // 1. Install package in Connect settings
  await installPackage('test-package-vetra')

  // 2. Navigate to a drive
  await page.goto('/drive/test-drive')

  // 3. Package document types appear as creation buttons
  const todoButton = page.getByRole('button').filter({ hasText: 'ToDoDocument' })
  await expect(todoButton).toBeVisible()

  // 4. Create document using installed package
  await todoButton.click()
  // Document editor loads from CDN: /-/cdn/test-package-vetra/editors/...
})
```

### 9.2 Installation Context Detection

```typescript
// Detect current Connect context
const useConnectContext = () => {
  const [context, setContext] = useState<ConnectInstance | null>(null)

  useEffect(() => {
    // Detect Connect context from:
    // 1. Current URL/domain
    // 2. Connect instance metadata
    // 3. Available drives/services
    const detectContext = async () => {
      const currentConnect = await getCurrentConnectInstance()
      setContext(currentConnect)
    }

    detectContext()
  }, [])

  return context
}

interface ConnectInstance {
  id: string
  name: string
  url: string
  installPackage: (packageName: string) => Promise<void>
  refreshDocumentTypes: () => Promise<void>
  getInstalledPackages: () => Promise<PackageInfo[]>
}
```

### 9.3 Installation UI Components

```typescript
// Package card with context-aware install button
<PackageCard>
  <PackageHeader>{package.name}</PackageHeader>
  <PackagePreview>{/* Primary module preview */}</PackagePreview>

  <ModuleTypeIndicators>
    {package.documentModels?.length > 0 && <Badge>📄 Document Models</Badge>}
    {package.editors?.length > 0 && <Badge>✏️ Editors</Badge>}
    {package.apps?.length > 0 && <Badge>🎯 Apps</Badge>}
  </ModuleTypeIndicators>

  <PackageDescription>{package.description}</PackageDescription>

  <InstallButton packageName={package.name} />

  {/* Expandable module details */}
  <Collapsible>
    <ModulesList modules={getAllModules(package)} />
  </Collapsible>
</PackageCard>
```

### 9.4 Future Enhancement: Multi-Target Installation (Strategy 2)

For standalone package browsers or multi-Connect environments:

```typescript
// Enhanced installation with target selection
const EnhancedInstallButton = ({ packageName }) => {
  const availableConnects = useDiscoverableConnects();

  if (availableConnects.length === 1) {
    return <InstallButton connectTarget={availableConnects[0]} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Install Package</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {availableConnects.map(connect => (
          <DropdownMenuItem key={connect.id}>
            Install to {connect.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

---

## 10. E2E Test Insights & Complete Package Lifecycle

### 10.1 Package Lifecycle Analysis

Based on the **Vetra E2E tests**, the complete package lifecycle includes:

#### 10.1.1 Package Creation Flow

1. **Document Model Creation**: Users create document models in Vetra Drive with:
   - Document type (e.g., `powerhouse/todo`)
   - Schema definition (GraphQL-style)
   - Initial state (JSON)
   - Operations/modules

2. **Editor Generation**: Create document editors that:
   - Reference existing document models
   - Auto-generate React editors via codegen
   - Support specific document types

3. **Build Process**: `ph-cli build` generates:
   - `/dist` directory with compiled assets
   - `powerhouse.manifest.json` in dist with populated metadata
   - TypeScript exports for document models and editors

4. **Publishing**: `ph-cli publish` publishes to registry with:
   - npm-compatible package structure
   - Automatic CDN extraction
   - Manifest discovery and indexing

#### 10.1.2 Package Installation Flow

1. **Package Discovery**: Users search packages via:
   - Autocomplete search interface
   - Real-time results from registry `/packages` endpoint
   - Package type filtering

2. **Installation Process**: Package manager:
   - Downloads from registry
   - Extracts to local Connect instance
   - Updates available document types
   - Enables new document creation

3. **Usage**: Users can create documents using installed packages:
   - Document types appear as creation buttons
   - Editors load dynamically from CDN
   - Full document model functionality available

### 10.2 Key Package Types & Their E2E Patterns

The E2E tests demonstrate these supported package types:

```typescript
// Document types tested in E2E
const supportedDocumentTypes = [
  'powerhouse/document-model', // Creates new document model schemas
  'powerhouse/document-editor', // Creates editors for existing models
  'powerhouse/app', // Creates full applications
  'powerhouse/subgraph', // Creates GraphQL subgraphs
  'powerhouse/processor', // Creates data processors
  'powerhouse/codegen-processor', // Code generation processors
]
```

### 10.3 Manifest Structure from E2E Tests

```typescript
// Real manifest structure from E2E tests
interface VetraPackageManifest {
  name: string // Package name (e.g., "test-package-vetra")
  description?: string
  category?: string
  publisher?: {
    name: string
    url: string
  }
  documentModels: Array<{
    id: string // e.g., "powerhouse/todo"
    name: string // Display name
    // Generated at build time
  }>
  editors: Array<{
    id: string // Editor identifier
    name: string // Display name
    documentTypes: string[] // Supported document types
    // Generated via codegen
  }>
  apps: Array<{
    id: string
    name: string
    driveEditor?: string
  }>
  subgraphs: unknown[] // GraphQL subgraph definitions
  importScripts: unknown[] // Processing scripts
}
```

### 10.4 Registry Integration Points

**Package Discovery API Usage:**

```typescript
// How Connect searches for packages
GET /packages                           // All packages
GET /packages?documentType=powerhouse/todo  // Filter by type
GET /packages/test-package-vetra       // Single package info
```

**CDN Usage for Dynamic Loading:**

```typescript
// How editors are loaded dynamically
GET / -/cdn/estt - package - vetra / powerhouse.manifest.json
GET / -/cdn/estt - package - vetra / editors / todo - editor / index.js
```

**Real-time Package Discovery:**

```typescript
// Search autocomplete in Connect settings
const searchPackages = async (query: string) => {
  const response = await fetch(`/packages?search=${query}`)
  return response.json()
}
```

---

## 11. Implementation Roadmap (E2E-Informed)

### Phase 1: Package Discovery UI

1. Build **SearchAutocomplete** component matching E2E test patterns
2. Implement **PackageCard** with real manifest structure from tests
3. Create **FilterSidebar** supporting actual document types:
   - `powerhouse/document-model`
   - `powerhouse/document-editor`
   - `powerhouse/app`
   - `powerhouse/subgraph`
   - `powerhouse/processor`
   - `powerhouse/codegen-processor`

### Phase 2: Registry Integration (E2E-Tested)

1. Build API client using endpoints from E2E tests:
   ```typescript
   // Real endpoints from tests
   GET /packages                     // Package listing
   GET /packages?documentType=X     // Type filtering
   GET /-/cdn/pkg/manifest.json     // CDN access
   ```
2. Implement package search with debounced autocomplete
3. Add package installation simulation (matches E2E flow)

### Phase 3: Package Visualization (Based on Real Types)

1. **Document Models**: Schema visualization (GraphQL-style from tests)
2. **Editors**: Generated editor previews
3. **Apps**: Application thumbnails
4. **Subgraphs**: GraphQL query/mutation previews
5. **Processors**: Data flow diagrams

### Phase 4: Integration & Installation

1. Connect with existing Connect settings modal (E2E pattern)
2. Implement "Install Package" button functionality
3. Add real-time package updates via SSE
4. Create package status tracking (`available`, `installing`, `installed`)

---

## 12. Technical Implementation Guide

### 12.1 Component Architecture (E2E-Based)

```typescript
// Package Manager main component
<VetraPackageManager>
  <SearchAutocomplete onPackageSelect={handleInstall} />
  <FilterSidebar documentTypes={supportedDocumentTypes} />
  <PackageGrid packages={filteredPackages} />
</VetraPackageManager>

// Package card structure from E2E tests
interface VetraPackageCardProps {
  package: PackageInfo & {
    manifest: VetraPackageManifest
    status: 'available' | 'installing' | 'installed'
  }
  onInstall: (packageName: string) => void
}
```

### 12.2 API Integration Patterns

```typescript
// Package search (from E2E autocomplete pattern)
export const usePackageSearch = (query: string) => {
  return useQuery({
    queryKey: ['packages', 'search', query],
    queryFn: () => fetch(`/packages?search=${query}`).then((r) => r.json()),
    enabled: query.length > 0,
    staleTime: 30000,
  })
}

// Package installation (from E2E test flow)
export const usePackageInstall = () => {
  return useMutation({
    mutationFn: async (packageName: string) => {
      // Simulate installation flow from E2E tests
      const response = await fetch('/packages/install', {
        method: 'POST',
        body: JSON.stringify({ packageName }),
      })
      return response.json()
    },
  })
}
```

---

### Instructions for Claude Code:

1. **Follow E2E Test Patterns**: Use the actual component patterns, API calls, and data structures from the E2E tests
2. **Implement Real Package Types**: Support the 6 document types tested in E2E (`document-model`, `document-editor`, `app`, `subgraph`, `processor`, `codegen-processor`)
3. **Match Registry Integration**: Use the exact API endpoints and CDN patterns from the E2E tests
4. **Simulate Installation Flow**: Create a package installation flow that matches the E2E test patterns (search → install → document creation)
