import { type Manifest } from '@powerhousedao/shared'
import { capitalCase } from 'change-case'
import { PackageIcon } from 'lucide-react'
import Link from 'next/link'
import Highlighter from 'react-highlight-words'
import { Card, CardContent } from '@/modules/shared/components/ui/card'
import { Badge } from '@/modules/shared/components/ui/badge'
import { cn } from '@/modules/shared/lib/utils'
import { getCategoryStyle } from '../lib/category-colors'

export function PackageCard(props: { manifest: Manifest; searchWords: string[] }) {
  const {
    manifest: {
      name,
      publisher,
      description,
      category,
      documentModels,
      editors,
      apps,
      processors,
      subgraphs,
    },
    searchWords,
  } = props

  const moduleCount =
    (documentModels?.length ?? 0) +
    (editors?.length ?? 0) +
    (apps?.length ?? 0) +
    (processors?.length ?? 0) +
    (subgraphs?.length ?? 0)

  const catStyle = getCategoryStyle(category)

  return (
    <Link href={`/packages/${encodeURIComponent(name)}`}>
      <Card
        className={cn(
          'flex h-full flex-col border-t-3 transition-shadow hover:shadow-md',
          catStyle.border,
        )}
      >
        <CardContent className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start gap-2">
            <PackageIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <h3 className="text-sm font-semibold break-all">
              <PurpleHighlighter textToHighlight={name} searchWords={searchWords} />
            </h3>
          </div>

          {publisher?.name && (
            <p className="text-muted-foreground text-xs">
              by <PurpleHighlighter textToHighlight={publisher.name} searchWords={searchWords} />
            </p>
          )}

          {description && (
            <p className="text-foreground-70 text-xs leading-relaxed">
              <PurpleHighlighter textToHighlight={description} searchWords={searchWords} />
            </p>
          )}

          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {category && (
              <Badge variant="secondary" className="text-[10px]">
                <PurpleHighlighter
                  textToHighlight={capitalCase(category)}
                  searchWords={searchWords}
                />
              </Badge>
            )}
            {moduleCount > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {moduleCount} module{moduleCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function PurpleHighlighter(props: { textToHighlight: string; searchWords: string[] }) {
  return <Highlighter {...props} highlightClassName="bg-purple-30" />
}
