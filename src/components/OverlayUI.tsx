import { Info, PenLine, X, TrendingUp, ArrowUpDown, Toilet, SquareParking } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './OverlayUI.module.css';

const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc4qrdA8NdKhznMUFUwJbLxQTuv88iQZ0r9iWf16ccIMbRM8Q/viewform';

interface OverlayUIProps {
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  isRouteActive: boolean;
  onClearRoute: () => void;
  isDev: boolean;
}

const FILTERS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'ramp',     label: '경사로',     Icon: TrendingUp    },
  { id: 'elevator', label: '엘리베이터', Icon: ArrowUpDown   },
  { id: 'toilet',   label: '화장실',     Icon: Toilet        },
  { id: 'parking',  label: '주차장',     Icon: SquareParking },
];

const OverlayUI = ({
  activeFilters,
  toggleFilter,
  isEditMode,
  onToggleEditMode,
  isRouteActive,
  onClearRoute,
  isDev,
}: OverlayUIProps) => {
  return (
    <>
      {/* 상단 좌측 필터 칩 — 편집 모드에서는 숨김 */}
      {!isEditMode && (
        <div className={styles.filterRow}>
          {FILTERS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`${styles.filterButton} ${activeFilters.includes(id) ? styles.active : ''}`}
              onClick={() => toggleFilter(id)}
            >
              <Icon size={15} className={styles.filterIcon} />
              <span className={styles.filterLabel}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 우측 하단 액션 버튼 */}
      <div className={styles.footer}>
        {!isEditMode && (
          <a
            className={styles.infoButton}
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Info size={15} />
            <span>정보 수정 제안</span>
          </a>
        )}

        {isRouteActive && !isEditMode && (
          <button className={styles.clearRouteButton} onClick={onClearRoute}>
            <X size={14} />
            경로 취소
          </button>
        )}

        {isDev && (
          <button
            className={isEditMode ? styles.editButtonActive : styles.editButton}
            onClick={onToggleEditMode}
          >
            <PenLine size={15} />
            <span>{isEditMode ? '편집 종료' : '지도 편집'}</span>
          </button>
        )}
      </div>
    </>
  );
};

export default OverlayUI;
