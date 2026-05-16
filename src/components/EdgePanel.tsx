import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import styles from './EdgePanel.module.css';
import type { RouteNode, RouteEdge } from '../types';

interface EdgePanelProps {
  mode: 'create' | 'edit';
  fromNode: RouteNode;
  toNode: RouteNode;
  initialData?: Pick<RouteEdge, 'type' | 'rampHighEnd' | 'rampAngle'>;
  onSave: (data: Pick<RouteEdge, 'type' | 'accessible' | 'rampHighEnd' | 'rampAngle'>) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

const TYPE_OPTIONS: { value: RouteEdge['type']; label: string; color: string; desc: string }[] = [
  { value: 'flat',   label: '평지',   color: '#888',   desc: '계단·경사 없음' },
  { value: 'ramp',   label: '경사로', color: '#1a6fff', desc: '휠체어 통행 가능' },
  { value: 'stairs', label: '계단',   color: '#e53935', desc: '배리어프리 우회 필요' },
];

const EdgePanel = ({
  mode,
  fromNode,
  toNode,
  initialData,
  onSave,
  onDelete,
  onCancel,
}: EdgePanelProps) => {
  const [type, setType] = useState<RouteEdge['type']>(initialData?.type ?? 'flat');
  const [rampHighEnd, setRampHighEnd] = useState<'from' | 'to'>(initialData?.rampHighEnd ?? 'to');
  const [rampAngle, setRampAngle] = useState(initialData?.rampAngle ?? 8);

  const handleSave = () => {
    onSave({
      type,
      accessible: type !== 'stairs',
      rampHighEnd: type === 'ramp' ? rampHighEnd : undefined,
      rampAngle: type === 'ramp' ? rampAngle : undefined,
    });
  };

  const fromLabel = fromNode.label ?? fromNode.id;
  const toLabel = toNode.label ?? toNode.id;
  const highLabel = rampHighEnd === 'from' ? fromLabel : toLabel;
  const lowLabel = rampHighEnd === 'from' ? toLabel : fromLabel;

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onCancel}><X size={18} /></button>

        <p className={styles.sectionTitle}>{mode === 'create' ? '구간 추가' : '구간 편집'}</p>
        <div className={styles.nodeRow}>
          <span className={styles.nodeTag}>{fromLabel}</span>
          <span className={styles.arrow}>──────</span>
          <span className={styles.nodeTag}>{toLabel}</span>
        </div>

        {/* 구간 유형 */}
        <p className={styles.label}>구간 유형</p>
        <div className={styles.typeRow}>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.typeBtn} ${type === opt.value ? styles.typeBtnActive : ''}`}
              style={type === opt.value ? { borderColor: opt.color, color: opt.color } : {}}
              onClick={() => setType(opt.value)}
            >
              <span className={styles.typeDot} style={{ background: opt.color }} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        <p className={styles.typeDesc}>{TYPE_OPTIONS.find(o => o.value === type)?.desc}</p>

        {/* 경사로 전용 옵션 */}
        {type === 'ramp' && (
          <div className={styles.rampSection}>
            <p className={styles.label}>높은 쪽 (상단)</p>
            <div className={styles.highEndRow}>
              <button
                className={`${styles.highEndBtn} ${rampHighEnd === 'from' ? styles.highEndActive : ''}`}
                onClick={() => setRampHighEnd('from')}
              >
                {fromLabel}
              </button>
              <button
                className={`${styles.highEndBtn} ${rampHighEnd === 'to' ? styles.highEndActive : ''}`}
                onClick={() => setRampHighEnd('to')}
              >
                {toLabel}
              </button>
            </div>
            <p className={styles.rampDesc}>
              ↑ 높은 쪽: <strong>{highLabel}</strong> &nbsp;→&nbsp; 낮은 쪽: <strong>{lowLabel}</strong>
            </p>

            <p className={styles.label}>경사 각도: <strong>{rampAngle}°</strong></p>
            <input
              type="range"
              min={1}
              max={30}
              value={rampAngle}
              onChange={(e) => setRampAngle(Number(e.target.value))}
              className={styles.slider}
            />
            <div className={styles.sliderLabels}>
              <span>1° (완만)</span>
              <span>15° (보통)</span>
              <span>30° (급경사)</span>
            </div>
          </div>
        )}

        {/* 버튼 영역 */}
        <div className={styles.actions}>
          {mode === 'edit' && onDelete && (
            <button className={styles.deleteBtn} onClick={onDelete}>
              <Trash2 size={16} /> 삭제
            </button>
          )}
          <button className={styles.saveBtn} onClick={handleSave}>
            {mode === 'create' ? '추가' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EdgePanel;
