type VariantColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'surface'

type VariantStyle = 'filled' | 'ghost' | 'soft' | 'ringed' | 'glass'

type GradientColor = `gradient-${VariantColor}-${VariantColor}`

type GradientDirectionSuffix =
  | 'to-t'
  | 'to-tr'
  | 'to-r'
  | 'to-br'
  | 'to-b'
  | 'to-bl'
  | 'to-l'
  | 'to-tl'

type GradientDirection = `bg-gradient-${GradientDirectionSuffix}`

type GradientVariant = `${GradientColor} ${GradientDirection}`

export type Variant = `variant-${VariantStyle}-${VariantColor}` | GradientVariant
