interface Props {
  children: React.ReactNode
  variant?: 'default' | 'main' | 'alt' | 'guild' | 'level'
}

const variantClass: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700',
  main:    'bg-amber-100 text-amber-800',
  alt:     'bg-blue-100 text-blue-700',
  guild:   'bg-purple-100 text-purple-700',
  level:   'bg-green-100 text-green-700',
}

export default function Badge({ children, variant = 'default' }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass[variant]}`}>
      {children}
    </span>
  )
}
