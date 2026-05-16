import { useState, useMemo } from 'react';
import db from '../data/db.json';
import type { BarrierFreeData } from '../types';

const data = db as unknown as BarrierFreeData;

export const useBarrierFreeData = () => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filteredLocations = useMemo(() => {
    return data.locations.filter((location) =>
      activeFilters.every((filter) => {
        const facility = (location.facilities as any)[filter];
        return facility?.exists;
      })
    );
  }, [activeFilters]);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  return {
    filteredLocations,
    activeFilters,
    toggleFilter,
    defaultNodes: data.routeGraph.nodes,
    defaultEdges: data.routeGraph.edges,
  };
};
