import Image from 'next/image'
import { forwardRef } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ 
    src, 
    alt, 
    width, 
    height, 
    className = '', 
    priority = false,
    fill = false,
    sizes,
    quality = 75,
    placeholder = 'empty',
    blurDataURL,
    ...props 
  }, ref) => {
    // Calculer le ratio d'aspect pour maintenir les proportions
    const aspectRatio = width / height
    
    // Déterminer les styles CSS appropriés
    const getImageStyles = () => {
      if (fill) {
        return { objectFit: 'contain' as const }
      }
      
      // Si la classe contient des modifications de taille, s'assurer que le ratio est maintenu
      if (className.includes('h-') && className.includes('w-')) {
        return { objectFit: 'contain' as const }
      } else if (className.includes('h-') && !className.includes('w-')) {
        return { width: 'auto', height: `${height}px` }
      } else if (className.includes('w-') && !className.includes('h-')) {
        return { height: 'auto', width: `${width}px` }
      }
      
      return {}
    }

    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        fill={fill}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        style={getImageStyles()}
        {...props}
      />
    )
  }
)

OptimizedImage.displayName = 'OptimizedImage'

export default OptimizedImage
