import { MoonIcon, SunIcon } from 'lucide-react'

interface ThemeIconLabelProps {
  theme?: string
}

const ThemeIconLabel = ({ theme }: ThemeIconLabelProps) => (
  <>
    {theme === 'dark' ? (
      <SunIcon className="mr-2 h-4 w-4" />
    ) : (
      <MoonIcon className="mr-2 h-4 w-4" />
    )}
    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
  </>
)

export default ThemeIconLabel
