interface TitleAndDescriptionProps {
  title: string
  description: string
}

export default function TitleAndDescription({ title, description }: TitleAndDescriptionProps) {
  return (
    <div className="dark:border-charcoal-800 tablet_768:h-full desktop_1024:border-none desktop_1024:p-0 flex flex-col gap-4 rounded-xl border border-gray-200 p-2 px-4 pb-4">
      <div className="desktop_1024:text-lg desktop_1024:font-bold desktop_1024:leading-[120%] desktop_1280:text-xl text-base leading-6 font-semibold text-gray-900 dark:text-gray-50">
        {title}
      </div>

      <div className="flex flex-col gap-2">
        {description.split('\n').map((paragraph, index) => (
          <p
            key={index}
            className="desktop_1280:text-base m-0 text-sm leading-[22px] font-normal text-gray-800 dark:text-slate-100"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}
