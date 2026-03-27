# PRD: Vetra Package Manager Frontend

## Product Overview

Build the frontend for the Vetra Package Manager, a centralized registry interface for discovering and managing Vetra modules. The system allows users to filter through packages and document types (Applications, Editors, Subgraphs, etc.) and view previews of their functionality.

**Target Timeline**: 4-6 weeks
**Environment**: React/Next.js, Tailwind CSS, TanStack Query
**Backend**: Powerhouse Registry (@powerhousedao/registry)

---

## Core User Stories

### Epic 1: Package Discovery & Filtering

#### Story 1.1: Hierarchical Filter System
**As a** developer searching for Vetra packages  
**I want** a hierarchical filtering system with primary and secondary filters  
**So that** I can efficiently narrow down packages by type and category  

**Acceptance Criteria:**
- [ ] Left sidebar with 256px fixed width
- [ ] Primary filters (mutually exclusive): Packages, Applications, Document Editors, Document Models, Subgraphs, Processors
- [ ] Secondary filters (additive): Categories, Publishers, Status
- [ ] Filter state reflected in URL parameters
- [ ] Package counts displayed for each filter option
- [ ] Dynamic search placeholder based on current filter scope

**Technical Notes:**
- Use FilterState interface from spec section 6.6
- Implement radio buttons for primary filters that show a checkmark when selected
- Multi-select checkboxes for secondary filters

---

#### Story 1.2: Package Grid Display
**As a** user browsing packages  
**I want** a responsive grid showing package cards with previews  
**So that** I can quickly identify relevant packages  

**Acceptance Criteria:**
- [ ] 3-column grid (desktop), 2-column (tablet), 1-column (mobile)
- [ ] Cards with exact Figma specifications: 400px width, 235px preview area
- [ ] Package header with name, preview section, footer with publisher
- [ ] Hover effects and loading states
- [ ] Module type indicators (Badge overlay on top of the preview)

**Technical Notes:**
- Follow PackageCard component spec from section 6.1
- Use design tokens from section 5

---

### Epic 2: Package Selection & Details

#### Story 2.1: Package Selection Flow
**As a** user exploring packages  
**I want** to select a package and see its detailed modules  
**So that** I can understand what's included before installing  

**Acceptance Criteria:**
- [ ] Click package card to select it
- [ ] Selected package moves to first grid position
- [ ] Selected package card is highlighted with a stroke
- [ ] Package's document types appear as subsequent cards
- [ ] Selected package indicator in left sidebar below the search-field
- [ ] Deselection functionality for the package indicator

**Technical Notes:**
- Implement grid reordering logic from section 6.5
- Use PackageSelectionFrame component from section 6.2

---

#### Story 2.2: Document Type Expansion
**As a** user viewing a selected package  
**I want** to see individual document types as separate cards  
**So that** I can understand each module's functionality  

**Acceptance Criteria:**
- [ ] Individual cards for document models, editors, applications etc
- [ ] Same card dimensions as main package cards (235px preview)
- [ ] Type-specific previews (schema visualization, editor thumbnails, etc.)
- [ ] Module metadata and descriptions
- [ ] Links back to parent package by clicking the link in the package name in the metadata

**Technical Notes:**
- Use DocumentTypeCard component from section 6.3
- Implement module-specific preview components from section 3.2

---

### Epic 3: Search & Real-time Updates

#### Story 3.1: Dynamic Package Search
**As a** developer looking for specific functionality  
**I want** to search across package names, descriptions, and publishers  
**So that** I can quickly find relevant packages  

**Acceptance Criteria:**
- [ ] Search input with debounced queries
- [ ] Search applies to current filter scope
- [ ] Highlight matching terms in results
- [ ] Clear search functionality
- [ ] No results state handling

**Technical Notes:**
- 300ms debounce on search queries
- Search implementation from section 6.6

---

#### Story 3.2: Package Status Management
**As a** user managing packages  
**I want** to see installation status for each package  
**So that** I know what's available, installing, or already installed  

**Acceptance Criteria:**
- [ ] Status badges: Available, Installing, Installed, Update Available
- [ ] Real-time status updates
- [ ] Installation progress indication
- [ ] Error state handling
- [ ] Retry functionality for failed installations

**Technical Notes:**
- Use SSE for real-time updates (/packages/-/events endpoint)
- Status colors per design system

---

### Epic 4: Backend Integration (Unknown)

#### Story 4.1: Powerhouse Registry Integration
**As a** frontend application  
**I want** to integrate with the Powerhouse Registry API  
**So that** I can display real package data and enable installations  

**Acceptance Criteria:**
- [ ] Connect to registry endpoints: /packages, /packages/by-document-type
- [ ] Parse PowerhouseManifest structure correctly
- [ ] Handle CDN file serving for previews
- [ ] Support scoped package names (@org/package)
- [ ] Error handling for network failures

**Technical Notes:**
- API endpoints from section 4.2.1
- Data models from section 4.2.2
- Use TanStack Query for caching and state management

---

#### Story 4.2: Package Installation Context (Unknown)
**As a** user in a Connect instance  
**I want** to install packages directly to my current environment  
**So that** installed modules are immediately available for document creation  

**Acceptance Criteria:**
- [ ] Detect current Connect context
- [ ] One-click installation to current instance
- [ ] Success/failure feedback
- [ ] Refresh available document types after installation
- [ ] Installation only when Connect context is available

**Technical Notes:**
- Context-aware installation from section 9.1
- Integration with Connect settings modal pattern

---

### Epic 5: Visual Previews & Design System

#### Story 5.1: Module Type Previews
**As a** user browsing packages  
**I want** visual previews that represent different module types  
**So that** I can quickly understand what each package offers  

**Acceptance Criteria:**
- [ ] Document Models: Schema wordcloud visualization
- [ ] Editors: UI screenshot thumbnails (1280x720 aspect ratio)
- [ ] Applications: High-fidelity app mockups
- [ ] Subgraphs: GraphQL query/mutation code snippets
- [ ] Processors: Data flow diagrams or metrics
- [ ] Fallback geometric patterns for undefined types

**Technical Notes:**
- Preview specifications from section 3.2
- Module type colors from section 5.4

---

#### Story 5.2: Figma Design System Implementation
**As a** frontend developer  
**I want** exact implementation of the Figma design system  
**So that** the UI matches the approved design specifications  

**Acceptance Criteria:**
- [ ] Color system implementation (#343839, #f3f5f7, etc.)
- [ ] Inter font family with correct weights
- [ ] 12px border radius for cards
- [ ] Exact spacing and layout measurements
- [ ] Responsive breakpoints
- [ ] Proper shadow and gradient usage

**Technical Notes:**
- Design tokens from section 5
- Component architecture from section 6

---

## Technical Requirements

### Architecture
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query (React Query v5)
- **Component Library**: Radix UI primitives
- **Build System**: Turbopack
- **Testing**: Vitest with Storybook integration

### Performance
- **Search Debouncing**: 300ms for search queries
- **Image Optimization**: Lazy loading for package previews
- **Bundle Size**: Code splitting for preview components
- **Caching**: 5-minute cache for package listings, 30-second for search

### Accessibility
- **ARIA Labels**: All interactive elements
- **Keyboard Navigation**: Full keyboard support for filters and grids
- **Screen Readers**: Semantic HTML and proper heading structure
- **Color Contrast**: WCAG AA compliance for all text

### Integration Points
- **Registry API**: HTTP REST endpoints with JSON responses
- **CDN Access**: Direct file serving for package assets
- **SSE**: Real-time package updates via Server-Sent Events
- **Connect Integration**: Context-aware installation within Connect instances

---

## Success Metrics

### User Experience
- **Search Performance**: < 200ms average response time
- **Installation Success**: > 95% successful installations
- **User Adoption**: 80% of package discoveries result in installation
- **Task Completion**: Users can find and install packages in < 2 minutes

### Technical Performance
- **Page Load**: < 2s initial load time
- **Search Response**: < 300ms search result display
- **Error Rate**: < 1% API error rate
- **Uptime**: 99.9% availability during business hours

---

## Risk Assessment

### High Risk
- **Registry Dependency**: Backend registry must be stable and performant
- **CDN Performance**: Package preview loading depends on CDN speed
- **Connect Integration**: Installation flow requires active Connect context

### Medium Risk
- **Search Complexity**: Complex filtering may impact performance with large datasets
- **Preview Generation**: Dynamic preview creation for different module types
- **Real-time Updates**: SSE connection stability across different network conditions

### Mitigation Strategies
- **Offline Fallbacks**: Cache critical package data for offline browsing
- **Progressive Loading**: Load package cards incrementally
- **Error Boundaries**: Graceful degradation for failed preview loads
- **Retry Logic**: Automatic retry for failed API calls

---

## Implementation Phases

### Phase 1: Core UI Components (Week 1-2)
- PackageCard, FilterSidebar, PackageGrid components
- Basic filtering and search functionality
- Mock data integration for rapid development

### Phase 2: Backend Integration (Week 2-3)
- Powerhouse Registry API integration
- Real package data loading
- Package status management

### Phase 3: Selection & Details (Week 3-4)
- Package selection flow
- Document type expansion
- Preview system implementation

### Phase 4: Installation & Polish (Week 4-6)
- Connect context integration
- Installation functionality
- Error handling and edge cases
- Performance optimization

---

## Dependencies

### External Dependencies
- **@powerhousedao/registry**: Backend package registry
- **Powerhouse Connect**: For installation context detection
- **Figma Design System**: Complete design specifications

### Internal Dependencies
- **Vetra Design System**: Existing UI components
- **Authentication System**: User context for installations
- **Navigation Framework**: Integration with existing Vetra navigation

---

## Acceptance Definition

The Vetra Package Manager frontend is considered complete when:

1. **All user stories are implemented** with passing acceptance criteria
2. **Design system is pixel-perfect** match to Figma specifications  
3. **Backend integration is functional** with real Powerhouse Registry
4. **Installation flow works** within Connect instance contexts
5. **Performance benchmarks are met** for search and loading times
6. **Accessibility standards are achieved** (WCAG AA compliance)
7. **Error handling is comprehensive** for all failure scenarios
8. **Documentation is complete** for component usage and API integration