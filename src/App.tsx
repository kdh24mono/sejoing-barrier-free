import { useState, useCallback, useEffect } from 'react';
import MapContainer from './components/MapContainer';
import OverlayUI from './components/OverlayUI';
import DetailPanel from './components/DetailPanel';
import DepartureSelector from './components/DepartureSelector';
import EdgePanel from './components/EdgePanel';
import RouteInfoPanel from './components/RouteInfoPanel';
import DevAuthModal from './components/DevAuthModal';
import { useBarrierFreeData } from './hooks/useBarrierFreeData';
import { findRoute } from './services/routeFinder';
import type { Location, RouteNode, RouteEdge, RouteSegment } from './types';
import './App.css';

type LatLng = { lat: number; lng: number };
const GRAPH_STORAGE_KEY = 'sejong-route-graph-v2';

function loadSavedGraph(): { nodes: RouteNode[]; edges: RouteEdge[] } | null {
  try {
    const raw = localStorage.getItem(GRAPH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const isDevUrl = new URLSearchParams(window.location.search).has('dev');

function App() {
  const { filteredLocations, activeFilters, toggleFilter, defaultNodes, defaultEdges } =
    useBarrierFreeData();

  // ── 경로 그래프 (로컬스토리지에서 복원) ──────────────────
  const saved = loadSavedGraph();
  const [routeNodes, setRouteNodesRaw] = useState<RouteNode[]>(
    saved?.nodes ?? (defaultNodes as RouteNode[])
  );
  const [routeEdges, setRouteEdgesRaw] = useState<RouteEdge[]>(
    saved?.edges ?? (defaultEdges as RouteEdge[])
  );

  const setRouteNodes = useCallback((nodes: RouteNode[]) => {
    setRouteNodesRaw((prevNodes) => {
      void prevNodes;
      setRouteEdgesRaw((prevEdges) => {
        localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify({ nodes, edges: prevEdges }));
        return prevEdges;
      });
      return nodes;
    });
  }, []);

  const setRouteEdges = useCallback((edges: RouteEdge[]) => {
    setRouteEdgesRaw((prevEdges) => {
      void prevEdges;
      setRouteNodesRaw((prevNodes) => {
        localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify({ nodes: prevNodes, edges }));
        return prevNodes;
      });
      return edges;
    });
  }, []);

  // ── 개발자 인증 상태 ──────────────────────────────────────
  const [showDevModal, setShowDevModal] = useState(isDevUrl && !sessionStorage.getItem('dev-auth'));
  const [isDev, setIsDev] = useState(isDevUrl && !!sessionStorage.getItem('dev-auth'));

  // ── 편집 모드 상태 ────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [pendingEdge, setPendingEdge] = useState<{ from: string; to: string } | null>(null);

  // ── 길찾기 상태 ───────────────────────────────────────────
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isSettingStartPoint, setIsSettingStartPoint] = useState(false);
  const [routePath, setRoutePath] = useState<RouteSegment[] | null>(null);
  const [pendingDestination, setPendingDestination] = useState<Location | null>(null);
  const [isSelectingDeparture, setIsSelectingDeparture] = useState(false);

  // GPS 취득 (1회)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── 편집 모드 핸들러 ──────────────────────────────────────

  const onToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => {
      if (prev) {
        // 편집 종료 시 선택 상태 초기화
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setPendingEdge(null);
      }
      return !prev;
    });
  }, []);

  const onNodeClickEditor = useCallback((nodeId: string) => {
    if (pendingEdge) return;
    setSelectedEdgeId(null);

    setSelectedNodeId((prev) => {
      if (prev === null) return nodeId;          // 첫 선택
      if (prev === nodeId) return null;          // 같은 노드 → 선택 해제
      // 다른 노드 클릭 → 엣지 생성 준비
      setPendingEdge({ from: prev, to: nodeId });
      return null;
    });
  }, [pendingEdge]);

  const onEdgeClickEditor = useCallback((edgeId: string) => {
    setSelectedNodeId(null);
    setPendingEdge(null);
    setSelectedEdgeId((prev) => (prev === edgeId ? null : edgeId));
  }, []);

  const onMapClickEditor = useCallback((lat: number, lng: number) => {
    if (pendingEdge) return;
    // 선택 해제 후 새 노드 추가
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    const newNode: RouteNode = {
      id: `node_${Date.now()}`,
      lat,
      lng,
      label: `N${routeNodes.length + 1}`,
    };
    setRouteNodes([...routeNodes, newNode]);
  }, [pendingEdge, routeNodes, setRouteNodes]);

  const onNodeDragEnd = useCallback((nodeId: string, lat: number, lng: number) => {
    setRouteNodes(routeNodes.map((n) => (n.id === nodeId ? { ...n, lat, lng } : n)));
  }, [routeNodes, setRouteNodes]);

  const onNodeLabelChange = useCallback((nodeId: string, label: string) => {
    setRouteNodes(routeNodes.map((n) => (n.id === nodeId ? { ...n, label } : n)));
  }, [routeNodes, setRouteNodes]);

  const onDeleteNode = useCallback((nodeId: string) => {
    setRouteNodes(routeNodes.filter((n) => n.id !== nodeId));
    setRouteEdges(routeEdges.filter((e) => e.from !== nodeId && e.to !== nodeId));
    setSelectedNodeId(null);
  }, [routeNodes, routeEdges, setRouteNodes, setRouteEdges]);

  const onSaveEdge = useCallback(
    (data: Pick<RouteEdge, 'type' | 'accessible' | 'rampHighEnd' | 'rampAngle'>) => {
      if (pendingEdge) {
        // 새 엣지 생성
        const newEdge: RouteEdge = {
          id: `edge_${Date.now()}`,
          from: pendingEdge.from,
          to: pendingEdge.to,
          ...data,
        };
        setRouteEdges([...routeEdges, newEdge]);
        setPendingEdge(null);
      } else if (selectedEdgeId) {
        // 기존 엣지 수정
        setRouteEdges(
          routeEdges.map((e) => (e.id === selectedEdgeId ? { ...e, ...data } : e))
        );
        setSelectedEdgeId(null);
      }
    },
    [pendingEdge, selectedEdgeId, routeEdges, setRouteEdges]
  );

  const onDeleteEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    setRouteEdges(routeEdges.filter((e) => e.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }, [selectedEdgeId, routeEdges, setRouteEdges]);

  const onExportGraph = useCallback(() => {
    const json = JSON.stringify({ nodes: routeNodes, edges: routeEdges }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'route-graph.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [routeNodes, routeEdges]);

  const onResetGraph = useCallback(() => {
    if (!confirm('경로 그래프를 기본값으로 초기화할까요?')) return;
    setRouteNodesRaw(defaultNodes as RouteNode[]);
    setRouteEdgesRaw(defaultEdges as RouteEdge[]);
    localStorage.removeItem(GRAPH_STORAGE_KEY);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setPendingEdge(null);
  }, [defaultNodes, defaultEdges]);

  // ── EdgePanel용 데이터 ────────────────────────────────────
  const nodeMap = new Map(routeNodes.map((n) => [n.id, n]));
  const edgePanelFrom = pendingEdge
    ? nodeMap.get(pendingEdge.from)
    : selectedEdgeId
    ? nodeMap.get(routeEdges.find((e) => e.id === selectedEdgeId)?.from ?? '')
    : undefined;
  const edgePanelTo = pendingEdge
    ? nodeMap.get(pendingEdge.to)
    : selectedEdgeId
    ? nodeMap.get(routeEdges.find((e) => e.id === selectedEdgeId)?.to ?? '')
    : undefined;
  const edgePanelInitial = selectedEdgeId
    ? (() => { const e = routeEdges.find((x) => x.id === selectedEdgeId); return e ? { type: e.type, rampHighEnd: e.rampHighEnd, rampAngle: e.rampAngle } : undefined; })()
    : undefined;
  const showEdgePanel = isEditMode && (pendingEdge !== null || selectedEdgeId !== null);

  // ── 선택된 노드 ───────────────────────────────────────────
  const selectedNode = selectedNodeId ? nodeMap.get(selectedNodeId) : undefined;

  // ── 길찾기 핸들러 ─────────────────────────────────────────

  const handleMarkerClick = useCallback((location: Location) => {
    if (isEditMode) return;
    setSelectedLocation(location);
  }, [isEditMode]);

  const handleClosePanel = useCallback(() => setSelectedLocation(null), []);

  const onFindRoute = useCallback((destination: Location) => {
    setPendingDestination(destination);
    setIsSelectingDeparture(true);
    setSelectedLocation(null);
  }, []);

  const onSelectCurrentLocation = useCallback(() => {
    if (!userLocation || !pendingDestination) return;
    const path = findRoute(userLocation, { lat: pendingDestination.lat, lng: pendingDestination.lng }, routeNodes, routeEdges, true, pendingDestination.name);
    setRoutePath(path);
    setStartPoint(userLocation);
    setPendingDestination(null);
    setIsSelectingDeparture(false);
  }, [userLocation, pendingDestination, routeNodes, routeEdges]);

  const onSelectMapPoint = useCallback(() => {
    setIsSelectingDeparture(false);
    setIsSettingStartPoint(true);
  }, []);

  const onMapClick = useCallback((lat: number, lng: number) => {
    const newStart = { lat, lng };
    setStartPoint(newStart);
    setIsSettingStartPoint(false);
    if (pendingDestination) {
      const path = findRoute(newStart, { lat: pendingDestination.lat, lng: pendingDestination.lng }, routeNodes, routeEdges, true, pendingDestination.name);
      setRoutePath(path);
      setPendingDestination(null);
    }
  }, [pendingDestination, routeNodes, routeEdges]);

  const onCancelDeparture = useCallback(() => {
    setIsSelectingDeparture(false);
    setPendingDestination(null);
  }, []);

  const onClearRoute = useCallback(() => {
    setRoutePath(null);
    setStartPoint(null);
  }, []);

  return (
    <div className="app-container">
      {showDevModal && (
        <DevAuthModal
          onSuccess={() => { setIsDev(true); setShowDevModal(false); }}
          onCancel={() => setShowDevModal(false)}
        />
      )}
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-title-group">
            <div className="app-title">세종온길</div>
            <div className="app-subtitle">배리어프리 길찾기</div>
          </div>
        </div>
        {isEditMode && (
          <div className="app-header-actions">
            <button className="header-btn-primary" onClick={onExportGraph}>JSON 저장</button>
            <button className="header-btn-ghost" onClick={onResetGraph}>초기화</button>
          </div>
        )}
      </header>

      <MapContainer
        locations={filteredLocations}
        onMarkerClick={handleMarkerClick}
        startPoint={startPoint}
        isSettingStartPoint={isSettingStartPoint}
        onMapClick={onMapClick}
        routePath={routePath}
        userLocation={userLocation}
        isEditMode={isEditMode}
        routeNodes={routeNodes}
        routeEdges={routeEdges}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        onNodeClickEditor={onNodeClickEditor}
        onNodeDragEnd={onNodeDragEnd}
        onEdgeClickEditor={onEdgeClickEditor}
        onMapClickEditor={onMapClickEditor}
      />

      <OverlayUI
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        isEditMode={isEditMode}
        onToggleEditMode={onToggleEditMode}
        isRouteActive={routePath !== null}
        onClearRoute={onClearRoute}
        isDev={isDev}
      />

      {/* 노드 선택 중 안내 배너 */}
      {isEditMode && selectedNode && (
        <div style={{
          position: 'absolute',
          top: 'calc(var(--header-height) + 56px)',
          left: '50%', transform: 'translateX(-50%)',
          zIndex: 2000, background: '#1a6fff', color: 'white',
          padding: '8px 12px', borderRadius: 24, fontSize: 13, fontWeight: 600,
          display: 'flex', gap: 10, alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
          <span style={{ opacity: 0.85, fontWeight: 400, whiteSpace: 'nowrap' }}>이름:</span>
          <input
            value={selectedNode.label ?? ''}
            onChange={(e) => onNodeLabelChange(selectedNode.id, e.target.value)}
            placeholder="노드 이름 입력"
            style={{
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 10, color: 'white', padding: '4px 10px', fontSize: 13,
              fontWeight: 600, width: 130, outline: 'none',
            }}
          />
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ opacity: 0.8, fontWeight: 400, whiteSpace: 'nowrap', fontSize: 12 }}>다른 노드 클릭 → 연결</span>
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '3px 10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}
          >삭제</button>
          <button
            onClick={() => setSelectedNodeId(null)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 16, padding: 0 }}
          >✕</button>
        </div>
      )}

      {/* 엣지 패널 (생성 / 편집) */}
      {showEdgePanel && edgePanelFrom && edgePanelTo && (
        <EdgePanel
          mode={pendingEdge ? 'create' : 'edit'}
          fromNode={edgePanelFrom}
          toNode={edgePanelTo}
          initialData={edgePanelInitial}
          onSave={onSaveEdge}
          onDelete={selectedEdgeId ? onDeleteEdge : undefined}
          onCancel={() => { setPendingEdge(null); setSelectedEdgeId(null); }}
        />
      )}

      {/* 경로 경사 정보 패널 */}
      {!isEditMode && routePath && (
        <RouteInfoPanel routePath={routePath} />
      )}

      {/* 건물 상세 패널 */}
      {!isEditMode && selectedLocation && (
        <DetailPanel
          selectedLocation={selectedLocation}
          onClose={handleClosePanel}
          onFindRoute={onFindRoute}
        />
      )}

      {/* 출발지 선택 모달 */}
      {!isEditMode && isSelectingDeparture && pendingDestination && (
        <DepartureSelector
          destinationName={pendingDestination.name}
          hasUserLocation={userLocation !== null}
          onSelectCurrentLocation={onSelectCurrentLocation}
          onSelectMapPoint={onSelectMapPoint}
          onCancel={onCancelDeparture}
        />
      )}
    </div>
  );
}

export default App;
