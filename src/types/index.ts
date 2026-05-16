export interface FacilityInfo {
  exists: boolean;
  description?: string;
}

export interface Facilities {
  ramp: FacilityInfo;
  elevator: FacilityInfo;
  toilet: FacilityInfo;
  parking: FacilityInfo;
}

export interface Location {
  id: number;
  name: string;
  category: 'BUILDING' | 'FACILITY' | 'OTHER';
  lat: number;
  lng: number;
  facilities: Facilities;
}

export interface RouteNode {
  id: string;
  lat: number;
  lng: number;
  label?: string;
}

export interface RouteEdge {
  id: string;
  from: string;
  to: string;
  accessible: boolean;
  type: 'flat' | 'ramp' | 'stairs';
  rampHighEnd?: 'from' | 'to';
  rampAngle?: number;
}

export interface RouteSegment {
  points: { lat: number; lng: number }[];
  type: RouteEdge['type'];
  rampAngle?: number;
  isUphill?: boolean; // 경사로: 이동 방향이 오르막이면 true
}

export interface BarrierFreeData {
  locations: Location[];
  routeGraph: {
    nodes: RouteNode[];
    edges: RouteEdge[];
  };
}
