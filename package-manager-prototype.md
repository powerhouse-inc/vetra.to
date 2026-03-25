# Package Manager Visual Prototype Plan

## Quick Testing Approaches

### Option 1: Storybook Stories (Recommended)

Create component stories to test visual previews:

```typescript
// modules/packages/components/package-card/package-card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { PackageCard } from './package-card';

const meta: Meta<typeof PackageCard> = {
  title: 'Packages/PackageCard',
  component: PackageCard,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof PackageCard>;

export const DocumentModelPackage: Story = {
  args: {
    package: {
      name: "ToDo Management Suite",
      description: "Complete todo document management with schema and editor",
      publisher: { name: "Powerhouse", url: "https://powerhouse.inc" },
      documentModels: [
        { id: "powerhouse/todo", name: "ToDoDocument", schema: "type TodoItem { id: ID!, text: String!, checked: Boolean! }" }
      ],
      editors: [
        { id: "todo-editor", name: "ToDoEditor", documentTypes: ["powerhouse/todo"] }
      ],
      apps: [],
      subgraphs: [],
      processors: []
    }
  },
};

export const ApplicationPackage: Story = {
  args: {
    package: {
      name: "Finance Dashboard",
      description: "Complete financial management application",
      publisher: { name: "MakerDAO", url: "https://makerdao.com" },
      documentModels: [],
      editors: [],
      apps: [
        { id: "finance-app", name: "Finance Dashboard", driveEditor: "financial-editor" }
      ],
      subgraphs: [],
      processors: []
    }
  },
};

export const MultiModulePackage: Story = {
  args: {
    package: {
      name: "Complete Data Suite",
      description: "Full data management with models, editors, and processors",
      publisher: { name: "Community", url: "" },
      documentModels: [
        { id: "powerhouse/data-model", name: "DataModel" }
      ],
      editors: [
        { id: "data-editor", name: "DataEditor", documentTypes: ["powerhouse/data-model"] }
      ],
      apps: [],
      subgraphs: [
        { id: "data-subgraph", name: "DataAPI" }
      ],
      processors: [
        { id: "data-processor", name: "DataProcessor" }
      ]
    }
  },
};

export const GridLayout: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 p-6">
      <PackageCard package={DocumentModelPackage.args.package} />
      <PackageCard package={ApplicationPackage.args.package} />
      <PackageCard package={MultiModulePackage.args.package} />
    </div>
  ),
};
```

### Option 2: Next.js Dev Page

Create a temporary development page:

```typescript
// app/prototype/package-manager/page.tsx
import { PackageGrid } from '@/modules/packages/components/package-grid';
import { FilterSidebar } from '@/modules/packages/components/filter-sidebar';

const mockPackages = [
  // Use real package data from E2E tests
  {
    name: "test-package-vetra",
    description: "ToDo Document Model with complete editor suite",
    publisher: { name: "Powerhouse", url: "https://powerhouse.inc" },
    documentModels: [
      {
        id: "powerhouse/todo",
        name: "ToDoDocument",
        schema: `type ToDoDocumentState {
  items: [ToDoItem!]!
  stats: ToDoListStats!
}

type ToDoItem {
  id: ID!
  text: String!
  checked: Boolean!
}`
      }
    ],
    editors: [
      {
        id: "todo-editor",
        name: "ToDoEditor",
        documentTypes: ["powerhouse/todo"]
      }
    ],
    apps: [],
    subgraphs: [],
    processors: []
  },
  // Add more test packages...
];

export default function PackageManagerPrototype() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Package Manager Prototype</h1>

        <div className="flex gap-8">
          <aside className="w-64">
            <FilterSidebar />
          </aside>

          <main className="flex-1">
            <PackageGrid packages={mockPackages} />
          </main>
        </div>
      </div>
    </div>
  );
}
```

### Option 3: Visual Regression Testing

Create visual snapshots for different states:

```typescript
// tests/visual/package-card.visual.test.ts
import { test, expect } from '@playwright/test'

test.describe('Package Card Visual Tests', () => {
  test('should render document model package correctly', async ({ page }) => {
    await page.goto('/prototype/package-manager')

    const documentModelCard = page.locator('[data-testid="package-card-todo-suite"]')
    await expect(documentModelCard).toHaveScreenshot('document-model-package.png')
  })

  test('should show hover states', async ({ page }) => {
    await page.goto('/prototype/package-manager')

    const card = page.locator('[data-testid="package-card-todo-suite"]')
    await card.hover()
    await expect(card).toHaveScreenshot('package-card-hover.png')
  })

  test('should show expanded module list', async ({ page }) => {
    await page.goto('/prototype/package-manager')

    const expandButton = page.locator('[data-testid="expand-modules-button"]')
    await expandButton.click()
    await expect(page.locator('[data-testid="package-card-todo-suite"]')).toHaveScreenshot(
      'package-card-expanded.png',
    )
  })
})
```

## Testing Plan

### Phase 1: Component Stories (1-2 hours)

```bash
# Create component stories for:
1. Individual preview components (WordCloud, EditorPreview, etc.)
2. PackageCard with different module combinations
3. Grid layouts with responsive behavior
4. Installation flow states

# Run and iterate:
pnpm storybook
# Visit http://localhost:6006
```

### Phase 2: Integration Testing (2-3 hours)

```bash
# Create dev page with:
1. Real package data from E2E tests
2. Full package manager interface
3. Interactive filtering and search
4. Installation flow simulation

# Test on:
http://localhost:3000/prototype/package-manager
```

### Phase 3: User Testing (1 hour)

```bash
# Get feedback on:
1. Visual hierarchy and clarity
2. Preview usefulness
3. Installation flow intuitiveness
4. Mobile responsiveness
```

## Recommended Approach

**Start with Option 1 (Storybook)** because:

1. **Isolated Testing**: Test individual components without full app complexity
2. **Fast Iteration**: Quick visual changes and immediate feedback
3. **Existing Setup**: You already have Storybook configured
4. **Documentation**: Stories serve as component documentation
5. **Stakeholder Review**: Easy to share links for feedback

Want me to create the initial Storybook stories and mock data files to get started?
