declare module 'react-simple-maps' {
  import { ComponentType, ReactNode, CSSProperties } from 'react'

  export interface ProjectionConfig {
    center?: [number, number]
    scale?: number
    rotate?: [number, number, number]
    parallels?: [number, number]
  }

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: ProjectionConfig
    width?: number
    height?: number
    className?: string
    style?: CSSProperties
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: Geography[] }) => ReactNode
  }

  export interface Geography {
    rsmKey: string
    type: string
    properties: Record<string, unknown>
    geometry: unknown
  }

  export interface GeographyProps {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: CSSProperties
      hover?: CSSProperties
      pressed?: CSSProperties
    }
    onClick?: () => void
    className?: string
  }

  export interface MarkerProps {
    coordinates: [number, number]
    children?: ReactNode
    className?: string
    onClick?: () => void
  }

  export interface LineProps {
    from: [number, number]
    to: [number, number]
    stroke?: string
    strokeWidth?: number
    strokeLinecap?: string
    curve?: boolean
    className?: string
  }

  export interface MapContextType {
    width: number
    height: number
    projection: (coord: [number, number]) => [number, number] | null
    path: unknown
  }

  export interface GraticuleProps {
    stroke?: string
    strokeWidth?: number
    strokeOpacity?: number
    fill?: string
    className?: string
  }

  export interface SphereProps {
    id?: string
    fill?: string
    stroke?: string
    strokeWidth?: number
    className?: string
  }

  export interface ZoomableGroupProps {
    zoom?: number
    center?: [number, number]
    minZoom?: number
    maxZoom?: number
    onMoveStart?: (pos: { coordinates: [number, number]; zoom: number }) => void
    onMove?: (pos: { x: number; y: number; zoom: number }) => void
    onMoveEnd?: (pos: { coordinates: [number, number]; zoom: number }) => void
    translateExtent?: [[number, number], [number, number]]
    className?: string
    style?: CSSProperties
    children?: ReactNode
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
  export const Marker: ComponentType<MarkerProps>
  export const Line: ComponentType<LineProps>
  export const Graticule: ComponentType<GraticuleProps>
  export const Sphere: ComponentType<SphereProps>
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>
  export const MapContext: React.Context<MapContextType>

  export function useMapContext(): MapContextType
  export function useGeographies(props: { geography: string | object }): { geographies: Geography[] }
}
