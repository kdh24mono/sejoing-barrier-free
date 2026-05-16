import { X, MapPin, ChevronRight, TrendingUp, ArrowUpDown, Toilet, SquareParking } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './DetailPanel.module.css';
import type { Location } from '../types';

interface DetailPanelProps {
  selectedLocation: Location | null;
  onClose: () => void;
  onFindRoute: (destination: Location) => void;
}

const FACILITY_LABELS: Record<string, { label: string; Icon: LucideIcon }> = {
  ramp:     { label: '경사로',        Icon: TrendingUp    },
  elevator: { label: '엘리베이터',    Icon: ArrowUpDown   },
  toilet:   { label: '장애인 화장실', Icon: Toilet        },
  parking:  { label: '장애인 주차장', Icon: SquareParking },
};

const DetailPanel = ({ selectedLocation, onClose, onFindRoute }: DetailPanelProps) => {
  if (!selectedLocation) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={20} />
        </button>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.category}>{selectedLocation.category}</div>
            <h2 className={styles.title}>{selectedLocation.name}</h2>
            <div className={styles.address}>
              <MapPin size={13} />
              <span>서울특별시 광진구 능동로 209, 세종대학교 {selectedLocation.name}</span>
            </div>
          </div>

          <div className={styles.section}>
            <h3>배리어프리 시설 정보</h3>
            <div className={styles.facilityList}>
              {Object.entries(selectedLocation.facilities).map(([key, info]) => {
                const facility = FACILITY_LABELS[key];
                if (!facility) return null;
                const { label, Icon } = facility;
                return (
                  <div
                    key={key}
                    className={`${styles.facilityItem} ${info.exists ? styles.exists : styles.notExists}`}
                  >
                    <div className={styles.facilityMain}>
                      <span className={styles.facilityIcon}>
                        <Icon size={17} />
                      </span>
                      <span className={styles.facilityLabel}>{label}</span>
                      <span className={styles.statusBadge}>{info.exists ? '있음' : '없음'}</span>
                    </div>
                    {info.exists && info.description && (
                      <div className={styles.description}>{info.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.primaryAction}
              onClick={() => onFindRoute(selectedLocation)}
            >
              <span>길 찾기</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
