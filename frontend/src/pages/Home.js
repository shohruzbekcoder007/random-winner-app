import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { showSuccess, showError } from '../services/api';
import './Home.css';

// Confetti component
const Confetti = ({ active }) => {
  const confettiPieces = useMemo(() => {
    if (!active) return [];
    const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ff9ff3', '#54a0ff'];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
      duration: Math.random() * 2 + 2
    }));
  }, [active]);

  if (!active) return null;

  return (
    <div className="confetti-container">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`
          }}
        />
      ))}
    </div>
  );
};

// Slot Reel Component
const SlotReel = ({ label, icon, value, isSpinning, isLanded }) => {
  return (
    <div className={`slot-reel ${isSpinning ? 'spinning' : ''} ${isLanded ? 'landed' : ''}`}>
      <div className="reel-content">
        <span className="reel-icon">{icon}</span>
        <span className="reel-label">{label}</span>
        <span className={`reel-value ${!value ? 'placeholder' : ''}`}>
          {value || '---'}
        </span>
      </div>
    </div>
  );
};

// Progress Ring Component
const ProgressRing = ({ percent, step, totalSteps }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="progress-ring-container">
      <svg className="progress-ring" width="120" height="120">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
        <circle className="progress-ring-bg" cx="60" cy="60" r={radius} />
        <circle
          className="progress-ring-fill"
          cx="60"
          cy="60"
          r={radius}
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="progress-center">
        <span className="progress-percent-value">{percent}%</span>
        <span className="progress-step">{step}/{totalSteps}</span>
      </div>
    </div>
  );
};

const Home = () => {
  const { isAdmin } = useAuth();
  const { isConnected, connect, selectRandomWinner, onProgress, onStarted, onNewWinner } = useSocket();

  const [stats, setStats] = useState(null);
  const [latestWinner, setLatestWinner] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [excludePrevious, setExcludePrevious] = useState(true);
  const [progress, setProgress] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [slotState, setSlotState] = useState({
    viloyat: { spinning: false, landed: false, value: null },
    tuman: { spinning: false, landed: false, value: null },
    ishtirokchi: { spinning: false, landed: false, value: null }
  });

  // Socket ulanishini boshlash
  useEffect(() => {
    connect();
  }, [connect]);

  // Yangi g'olib xabarini tinglash
  useEffect(() => {
    const unsubscribe = onNewWinner((data) => {
      showSuccess(data.message);
      fetchData();
    });
    return unsubscribe;
  }, [onNewWinner]);

  // Progress xabarini tinglash va slot animatsiyani boshqarish
  useEffect(() => {
    const unsubscribe = onProgress((data) => {
      setProgress(data);

      // Slot animatsiyalarni boshqarish
      if (data.step === 2) {
        // Viloyat tanlanmoqda - barchasi spinning
        setSlotState({
          viloyat: { spinning: true, landed: false, value: null },
          tuman: { spinning: true, landed: false, value: null },
          ishtirokchi: { spinning: true, landed: false, value: null }
        });
      } else if (data.step === 3 && data.viloyat) {
        // Viloyat tanlandi
        setSlotState(prev => ({
          ...prev,
          viloyat: { spinning: false, landed: true, value: data.viloyat },
          tuman: { spinning: true, landed: false, value: null }
        }));
      } else if (data.step === 4 && data.tuman) {
        // Tuman tanlandi
        setSlotState(prev => ({
          ...prev,
          tuman: { spinning: false, landed: true, value: data.tuman },
          ishtirokchi: { spinning: true, landed: false, value: null }
        }));
      } else if (data.step === 5) {
        // Ishtirokchi tanlanmoqda
        setSlotState(prev => ({
          ...prev,
          ishtirokchi: { spinning: true, landed: false, value: null }
        }));
      }
    });
    return unsubscribe;
  }, [onProgress]);

  // Started xabarini tinglash
  useEffect(() => {
    const unsubscribe = onStarted((data) => {
      setProgress({
        step: 0,
        totalSteps: 6,
        message: data.message,
        percent: 0
      });
      // Slot state ni tozalash
      setSlotState({
        viloyat: { spinning: false, landed: false, value: null },
        tuman: { spinning: false, landed: false, value: null },
        ishtirokchi: { spinning: false, landed: false, value: null }
      });
    });
    return unsubscribe;
  }, [onStarted]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, latestRes] = await Promise.all([
        api.get(`/random/stats?excludePreviousWinners=${excludePrevious}`),
        api.get('/golib/latest')
      ]);

      setStats(statsRes.data.data);
      setLatestWinner(latestRes.data.data);
    } catch (error) {
      console.error('Ma\'lumot olishda xato:', error);
    } finally {
      setLoading(false);
    }
  }, [excludePrevious]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectWinner = async () => {
    if (!isConnected) {
      showError({ errorMessage: 'Server bilan aloqa yo\'q. Sahifani yangilang.' });
      return;
    }

    setSelecting(true);
    setSelectedWinner(null);
    setProgress(null);
    setShowConfetti(false);

    try {
      const result = await selectRandomWinner({ excludePreviousWinners: excludePrevious });

      if (result.success) {
        // Oxirgi slot ni ham to'ldirish
        setSlotState(prev => ({
          ...prev,
          ishtirokchi: {
            spinning: false,
            landed: true,
            value: result.data.golib.ishtirokchi.fio
          }
        }));

        // Biroz kutib keyin natijani ko'rsatish
        setTimeout(() => {
          setSelectedWinner(result.data.golib);
          setLatestWinner(result.data.golib);
          setShowConfetti(true);
          showSuccess('G\'olib muvaffaqiyatli tanlandi!');
          fetchData();

          // Confetti ni 5 sekunddan keyin o'chirish
          setTimeout(() => setShowConfetti(false), 5000);

          // 10 sekunddan keyin g'olibni yashirish va random holatiga qaytarish
          setTimeout(() => {
            setSelectedWinner(null);
            setSlotState({
              viloyat: { spinning: false, landed: false, value: null },
              tuman: { spinning: false, landed: false, value: null },
              ishtirokchi: { spinning: false, landed: false, value: null }
            });
          }, 10000);
        }, 500);
      }
    } catch (error) {
      showError({ errorMessage: error.message || 'G\'olib tanlashda xato' });
      setSlotState({
        viloyat: { spinning: false, landed: false, value: null },
        tuman: { spinning: false, landed: false, value: null },
        ishtirokchi: { spinning: false, landed: false, value: null }
      });
    } finally {
      setSelecting(false);
      setProgress(null);
    }
  };

  const handleResetWinners = async () => {
    if (!window.confirm('Barcha g\'oliblar statusini bekor qilmoqchimisiz?')) {
      return;
    }

    try {
      await api.post('/random/reset-all-winners');
      showSuccess('Barcha g\'olib statuslari bekor qilindi');
      fetchData();
    } catch (error) {
      showError(error);
    }
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="container">
        {/* Socket ulanish holati */}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Server bilan ulangan' : 'Server bilan aloqa yo\'q'}
        </div>

        {/* Statistika */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏛️</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.faolViloyatlar || 0}</span>
              <span className="stat-label">Faol viloyatlar</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📍</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.faolTumanlar || 0}</span>
              <span className="stat-label">Faol tumanlar</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.tanlanishiMumkin || 0}</span>
              <span className="stat-label">Tanlanishi mumkin</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <span className="stat-value">{stats?.goliblar || 0}</span>
              <span className="stat-label">G'oliblar</span>
            </div>
          </div>
        </div>

        {/* Confetti */}
        <Confetti active={showConfetti} />

        {/* Random tanlash */}
        <div className="selection-section">
          <div className={`selection-card ${selecting ? 'animating' : ''}`}>
            {/* Progress ko'rsatish - Slot Machine Style */}
            {selecting && progress && (
              <div className="selection-progress">
                <div className="slot-machine">
                  <div className="slot-header">
                    <span className="slot-header-icon">🎰</span>
                    <span>G'olib tanlanmoqda</span>
                    <span className="slot-header-icon">🎰</span>
                  </div>

                  {/* Slot Reels */}
                  <div className="slot-reels">
                    <SlotReel
                      label="Viloyat"
                      icon="🏛️"
                      value={slotState.viloyat.value}
                      isSpinning={slotState.viloyat.spinning}
                      isLanded={slotState.viloyat.landed}
                    />
                    <SlotReel
                      label="Tuman"
                      icon="📍"
                      value={slotState.tuman.value}
                      isSpinning={slotState.tuman.spinning}
                      isLanded={slotState.tuman.landed}
                    />
                    <SlotReel
                      label="Ishtirokchi"
                      icon="👤"
                      value={slotState.ishtirokchi.value}
                      isSpinning={slotState.ishtirokchi.spinning}
                      isLanded={slotState.ishtirokchi.landed}
                    />
                  </div>

                  {/* Progress Ring */}
                  <ProgressRing
                    percent={progress.percent}
                    step={progress.step}
                    totalSteps={progress.totalSteps}
                  />

                  {/* Step Indicator */}
                  <div className="step-indicator">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                      <div
                        key={step}
                        className={`step-dot ${
                          progress.step === step ? 'active' :
                          progress.step > step ? 'completed' : ''
                        }`}
                      />
                    ))}
                  </div>

                  {/* Message */}
                  <div className="selection-message">
                    {progress.message}
                  </div>
                </div>
              </div>
            )}

            {/* Natija - Celebration Style */}
            {!selecting && selectedWinner ? (
              <div className="winner-result">
                <div className="winner-content">
                  <div className="winner-trophy">🏆</div>
                  <div className="winner-badge">
                    <span>🎉</span>
                    <span>TABRIKLAYMIZ!</span>
                    <span>🎉</span>
                  </div>
                  <h2 className="winner-name">{selectedWinner.ishtirokchi.fio}</h2>
                  <div className="winner-details">
                    <div className="winner-detail-item">
                      <span className="winner-detail-icon">📍</span>
                      <span>{selectedWinner.tuman.nomi}, {selectedWinner.viloyat.nomi}</span>
                    </div>
                    {selectedWinner.ishtirokchi.telefon && (
                      <div className="winner-detail-item">
                        <span className="winner-detail-icon">📞</span>
                        <span>{selectedWinner.ishtirokchi.telefon}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : !selecting && latestWinner ? (
              <div className="latest-winner">
                <span className="latest-label">Oxirgi g'olib</span>
                <h3 className="latest-name">{latestWinner.ishtirokchi?.fio}</h3>
                <span className="latest-location">
                  {latestWinner.tuman?.nomi}, {latestWinner.viloyat?.nomi}
                </span>
              </div>
            ) : !selecting ? (
              <div className="no-winner">
                <span>Hali g'olib tanlanmagan</span>
              </div>
            ) : null}

            <div className="selection-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={excludePrevious}
                  onChange={(e) => setExcludePrevious(e.target.checked)}
                  disabled={selecting}
                />
                <span>Oldingi g'oliblarni hisobga olmaslik</span>
              </label>

              <button
                onClick={handleSelectWinner}
                disabled={selecting || stats?.tanlanishiMumkin === 0 || !isConnected}
                className={`btn-select ${selecting ? 'selecting' : ''}`}
              >
                {selecting ? (
                  <>
                    <span className="select-spinner"></span>
                    <span>Tanlanmoqda...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🎲</span>
                    <span>Random Tanlash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Admin paneli */}
        {isAdmin() && (
          <div className="admin-actions">
            <h3>Admin amallar</h3>
            <button onClick={handleResetWinners} className="btn btn-danger">
              🔄 Barcha g'oliblar statusini bekor qilish
            </button>
          </div>
        )}

        {/* Viloyatlar statistikasi */}
        {stats?.viloyatStats && stats.viloyatStats.length > 0 && (
          <div className="card viloyat-stats">
            <h3>Viloyatlar bo'yicha</h3>
            <div className="viloyat-grid">
              {stats.viloyatStats.map((v, i) => (
                <div key={i} className="viloyat-item">
                  <span className="viloyat-name">{v.nomi}</span>
                  <span className="viloyat-count">{v.tumanlarSoni} ta tuman</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
