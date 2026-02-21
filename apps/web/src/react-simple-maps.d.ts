declare module "react-simple-maps" {
  import type { ReactNode, Ref } from "react";

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: { scale?: number; center?: [number, number] };
    width?: number;
    height?: number;
    className?: string;
    children?: ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (props: { geographies: Geography[] }) => ReactNode;
  }

  export interface Geography {
    rsmKey: string;
    id?: string | number;
    geometry?: unknown;
    properties?: Record<string, unknown>;
  }

  export interface GeographyProps {
    geography: Geography;
    style?: {
      default?: Record<string, unknown>;
      hover?: Record<string, unknown>;
      pressed?: Record<string, unknown>;
    };
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onClick?: () => void;
    children?: ReactNode;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    filterZoomEvent?: (event: unknown) => boolean;
    children?: ReactNode;
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element;
  export function Geographies(props: GeographiesProps): JSX.Element;
  export function Geography(props: GeographyProps): JSX.Element;
  export function ZoomableGroup(
    props: ZoomableGroupProps & { ref?: Ref<unknown> },
  ): JSX.Element;
}
