import { Navigation2, MapPinPlus, X, ChevronRight, MapPin } from 'lucide-react';
import styles from './DepartureSelector.module.css';

interface DepartureSelectorProps {
  destinationName: string;
  hasUserLocation: boolean;
  onSelectCurrentLocation: () => void;
  onSelectMapPoint: () => void;
  onCancel: () => void;
}

const DepartureSelector = ({
  destinationName,
  hasUserLocation,
  onSelectCurrentLocation,
  onSelectMapPoint,
  onCancel,
}: DepartureSelectorProps) => {
  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />

        {/* 목적지 헤더 */}
        <div className={styles.destHeader}>
          <div className={styles.destMeta}>
            <span className={styles.destChip}>
              <MapPin size={11} />
              목적지
            </span>
          </div>
          <p className={styles.destName}>{destinationName}</p>
          <button className={styles.closeBtn} onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.divider} />

        {/* 본문 */}
        <div className={styles.body}>
          <p className={styles.question}>어디서 출발하시나요?</p>

          <div className={styles.options}>
            {/* 현재 위치 */}
            <button
              className={`${styles.optionCard} ${styles.optionNav}`}
              onClick={onSelectCurrentLocation}
              disabled={!hasUserLocation}
            >
              <span className={`${styles.optionIconWrap} ${styles.iconBlue}`}>
                <Navigation2 size={22} />
              </span>
              <span className={styles.optionBody}>
                <span className={styles.optionTitle}>현재 위치 사용</span>
                <span className={styles.optionDesc}>
                  {hasUserLocation ? 'GPS 위치로 경로를 안내합니다' : '위치 정보를 불러오는 중...'}
                </span>
              </span>
              <ChevronRight size={18} className={styles.optionArrow} />
            </button>

            {/* 지도에서 선택 */}
            <button className={`${styles.optionCard} ${styles.optionMap}`} onClick={onSelectMapPoint}>
              <span className={`${styles.optionIconWrap} ${styles.iconGreen}`}>
                <MapPinPlus size={22} />
              </span>
              <span className={styles.optionBody}>
                <span className={styles.optionTitle}>지도에서 직접 선택</span>
                <span className={styles.optionDesc}>지도를 탭하여 출발지를 지정합니다</span>
              </span>
              <ChevronRight size={18} className={styles.optionArrow} />
            </button>
          </div>

          <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default DepartureSelector;
