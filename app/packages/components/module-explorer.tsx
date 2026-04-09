'use client'

import { type PowerhouseModule } from '@powerhousedao/shared'
import { capitalCase } from 'change-case'
import { ChevronDown, ChevronRight, FileCode2, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { cn } from '@/modules/shared/lib/utils'

interface ModuleFile {
  name: string
  path: string
  content: string
}

interface ModuleExplorerProps {
  modules: Record<string, PowerhouseModule[] | undefined>
  cdnBase: string
}

const moduleFileMap: Record<string, { name: string; path: string }[]> = {
  documentModels: [
    { name: 'Module', path: 'module.d.ts' },
    { name: 'Schema (Types)', path: 'gen/schema/types.d.ts' },
    { name: 'Actions', path: 'gen/actions.d.ts' },
    { name: 'Reducer', path: 'gen/reducer.d.ts' },
    { name: 'Types', path: 'gen/types.d.ts' },
    { name: 'Operations', path: 'gen/builders/operations.d.ts' },
    { name: 'Reducers (src)', path: 'v1/src/index.d.ts' },
  ],
  editors: [
    { name: 'Module', path: 'module.d.ts' },
    { name: 'Editor', path: 'editor.d.ts' },
  ],
  apps: [{ name: 'Module', path: 'module.d.ts' }],
  processors: [{ name: 'Module', path: 'module.d.ts' }],
  subgraphs: [{ name: 'Module', path: 'module.d.ts' }],
}

/**
 * Parse the index.d.ts of a module type directory to find
 * which subdirectory each exported module lives in.
 * e.g. `export { GnosispayAnalyticsEditor } from "./crypto-tx-analytics-editor/module.js";`
 *  -> { GnosispayAnalyticsEditor: "crypto-tx-analytics-editor" }
 */
function parseExportDirs(indexContent: string): Record<string, string> {
  const map: Record<string, string> = {}
  const re = /export\s*\{[^}]*\b(\w+)\b[^}]*\}\s*from\s*["']\.\/([^/]+)\//g
  let match
  while ((match = re.exec(indexContent)) !== null) {
    map[match[1]] = match[2]
  }
  return map
}

function kebabCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export function ModuleExplorer({ modules, cdnBase }: ModuleExplorerProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [files, setFiles] = useState<Record<string, ModuleFile[]>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const [activeFile, setActiveFile] = useState<Record<string, string>>({})
  const [dirCache, setDirCache] = useState<Record<string, Record<string, string>>>({})

  const resolveDir = useCallback(
    async (type: string, modName: string): Promise<string> => {
      const typeDir = type === 'documentModels' ? 'document-models' : type

      if (dirCache[typeDir]?.[modName]) {
        return dirCache[typeDir][modName]
      }

      try {
        const res = await fetch(`${cdnBase}/dist/${typeDir}/index.d.ts`)
        if (res.ok) {
          const content = await res.text()
          const exportDirs = parseExportDirs(content)
          setDirCache((prev) => ({ ...prev, [typeDir]: exportDirs }))
          if (exportDirs[modName]) return exportDirs[modName]
        }
      } catch {
        // fall through to kebab-case fallback
      }

      return kebabCase(modName)
    },
    [cdnBase, dirCache],
  )

  const loadModuleFiles = useCallback(
    async (type: string, mod: PowerhouseModule) => {
      const key = `${type}/${mod.name}`
      if (files[key]) {
        setExpandedModule(expandedModule === key ? null : key)
        return
      }

      setExpandedModule(key)
      setLoading(key)

      const typeDir = type === 'documentModels' ? 'document-models' : type
      const dirName = await resolveDir(type, mod.name)
      const basePath = `dist/${typeDir}/${dirName}`
      const fileDefs = moduleFileMap[type] ?? moduleFileMap.apps

      const results = await Promise.all(
        fileDefs.map(async ({ name, path }) => {
          try {
            const res = await fetch(`${cdnBase}/${basePath}/${path}`)
            if (!res.ok) return null
            const content = await res.text()
            return { name, path: `${basePath}/${path}`, content }
          } catch {
            return null
          }
        }),
      )

      let loaded = results.filter(Boolean) as ModuleFile[]

      // For document models: discover and load reducer source files from v1/src/
      if (type === 'documentModels') {
        const srcIndex = loaded.find((f) => f.name === 'Reducers (src)')
        if (srcIndex) {
          // Parse imports like: export * from "./reducers/packages.js"
          const importRe = /from\s*["']\.\/reducers\/([^"']+)\.js["']/g
          const reducerNames: string[] = []
          let m
          while ((m = importRe.exec(srcIndex.content)) !== null) {
            reducerNames.push(m[1])
          }
          if (reducerNames.length > 0) {
            const reducerFiles = await Promise.all(
              reducerNames.map(async (name) => {
                try {
                  const res = await fetch(`${cdnBase}/${basePath}/v1/src/reducers/${name}.d.ts`)
                  if (!res.ok) return null
                  const content = await res.text()
                  return {
                    name: `Reducer: ${name}`,
                    path: `${basePath}/v1/src/reducers/${name}.d.ts`,
                    content,
                  }
                } catch {
                  return null
                }
              }),
            )
            // Replace the generic "Reducers (src)" entry with individual reducer files
            loaded = [
              ...loaded.filter((f) => f.name !== 'Reducers (src)'),
              ...(reducerFiles.filter(Boolean) as ModuleFile[]),
            ]
          }
        }
      }
      setFiles((prev) => ({ ...prev, [key]: loaded }))
      if (loaded.length > 0) {
        setActiveFile((prev) => ({ ...prev, [key]: loaded[0].name }))
      }
      setLoading(null)
    },
    [cdnBase, expandedModule, files, resolveDir],
  )

  const hasModules = Object.entries(modules).some(([, mods]) => mods?.length)
  if (!hasModules) return null

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Modules</h2>
      {Object.entries(modules).map(([type, mods]) =>
        mods?.length ? (
          <div key={type}>
            <h3 className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
              <FileCode2 className="size-4" />
              {capitalCase(type)}
            </h3>
            <div className="space-y-2">
              {mods.map((mod) => {
                const key = `${type}/${mod.name}`
                const isExpanded = expandedModule === key
                const isLoading = loading === key
                const moduleFiles = files[key] ?? []
                const currentFile = activeFile[key]
                const activeContent = moduleFiles.find((f) => f.name === currentFile)

                return (
                  <div key={mod.id} className="overflow-hidden rounded-lg border">
                    <button
                      onClick={() => loadModuleFiles(type, mod)}
                      className="hover:bg-accent/50 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="text-primary size-4 shrink-0 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronDown className="text-primary size-4 shrink-0" />
                      ) : (
                        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{capitalCase(mod.name)}</p>
                        <p className="text-muted-foreground font-mono text-[10px]">{mod.id}</p>
                      </div>
                    </button>

                    {isExpanded && moduleFiles.length > 0 && (
                      <div className="border-t">
                        <div className="bg-accent/30 flex gap-0.5 overflow-x-auto border-b px-2">
                          {moduleFiles.map((file) => (
                            <button
                              key={file.name}
                              onClick={() =>
                                setActiveFile((prev) => ({ ...prev, [key]: file.name }))
                              }
                              className={cn(
                                'border-b-2 px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-colors',
                                currentFile === file.name
                                  ? 'border-primary text-primary'
                                  : 'text-muted-foreground hover:text-foreground border-transparent',
                              )}
                            >
                              {file.name}
                            </button>
                          ))}
                        </div>

                        {activeContent && (
                          <div className="relative max-w-full overflow-hidden">
                            <div className="bg-accent/80 text-muted-foreground absolute top-2 right-2 z-10 rounded px-1.5 py-0.5 text-[9px]">
                              {activeContent.path}
                            </div>
                            <pre className="max-h-[400px] overflow-auto p-4 text-xs leading-relaxed">
                              <code>{activeContent.content}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {isExpanded && moduleFiles.length === 0 && !isLoading && (
                      <div className="text-muted-foreground border-t p-4 text-center text-xs">
                        No source files available for this module
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : null,
      )}
    </div>
  )
}
