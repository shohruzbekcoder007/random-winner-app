import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { showSuccess, showError } from '../services/api';
import './Home.css';

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

  // Progress xabarini tinglash
  useEffect(() => {
    const unsubscribe = onProgress((data) => {
      setProgress(data);
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

    try {
      const result = await selectRandomWinner({ excludePreviousWinners: excludePrevious });

      if (result.success) {
        setSelectedWinner(result.data.golib);
        setLatestWinner(result.data.golib);
        showSuccess('G\'olib muvaffaqiyatli tanlandi!');
        fetchData();
      }
    } catch (error) {
      showError({ errorMessage: error.message || 'G\'olib tanlashda xato' });
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

        {/* Random tanlash */}
        <div className="selection-section">
          <div className={`selection-card ${selecting ? 'animating' : ''}`}>
            {/* Progress ko'rsatish */}
            {selecting && progress && (
              <div className="selection-progress">
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progress.percent}%` }}
                  ></div>
                </div>
                <div className="progress-info">
                  <span className="progress-message">{progress.message}</span>
                  <span className="progress-percent">{progress.percent}%</span>
                </div>
                {progress.viloyat && (
                  <div className="progress-location">
                    <span>🏛️ {progress.viloyat}</span>
                    {progress.tuman && <span> → 📍 {progress.tuman}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Natija */}
            {!selecting && selectedWinner ? (
              <div className="winner-result">
                <div className="winner-badge">🎉 G'OLIB 🎉</div>
                <h2 className="winner-name">{selectedWinner.ishtirokchi.fio}</h2>
                <div className="winner-details">
                  <span className="winner-location">
                    📍 {selectedWinner.tuman.nomi}, {selectedWinner.viloyat.nomi}
                  </span>
                  {selectedWinner.ishtirokchi.telefon && (
                    <span className="winner-phone">
                      📞 {selectedWinner.ishtirokchi.telefon}
                    </span>
                  )}
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
                    Tanlanmoqda...
                  </>
                ) : (
                  <>
                    🎲 Random Tanlash
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
