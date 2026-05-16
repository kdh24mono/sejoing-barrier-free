import { useState } from 'react';

interface DevAuthModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const DevAuthModal = ({ onSuccess, onCancel }: DevAuthModalProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_DEV_PASSWORD) {
      sessionStorage.setItem('dev-auth', '1');
      onSuccess();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '32px 28px',
        width: 300, boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 4 }}>
            개발자 모드
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            비밀번호를 입력해야 편집 기능을 사용할 수 있어요.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="비밀번호 입력"
            autoFocus
            style={{
              border: `1.5px solid ${error ? '#e53935' : 'rgba(0,0,0,0.15)'}`,
              borderRadius: 10, padding: '10px 14px', fontSize: 14,
              outline: 'none', color: '#111', width: '100%', boxSizing: 'border-box',
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: '#e53935', marginTop: -4 }}>
              비밀번호가 올바르지 않습니다.
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)',
                background: 'white', color: '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                background: '#111', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevAuthModal;
