import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [latestWinner, setLatestWinner] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [excludePrevious, setExcludePrevious] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [excludePrevious]);

  const fetchData = async () => {
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
  };

  const handleSelectWinner = async () => {
    setSelecting(true);
    setAnimating(true);
    setSelectedWinner(null);

    // Animatsiya effekti
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await api.post('/random/select', { excludePreviousWinners: excludePrevious });

      if (response.data.success) {
        setSelectedWinner(response.data.data.golib);
        setLatestWinner(response.data.data.golib);
        fetchData(); // Statistikani yangilash
      }
    } catch (error) {
      alert(error.response?.data?.message || 'G\'olib tanlashda xato');
    } finally {
      setSelecting(false);
      setAnimating(false);
    }
  };

  const handleResetWinners = async () => {
    if (!window.confirm('Barcha g\'oliblar statusini bekor qilmoqchimisiz?')) {
      return;
    }

    try {
      await api.post('/random/reset-all-winners');
      alert('Barcha g\'olib statuslari bekor qilindi');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
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
          <div className={`selection-card ${animating ? 'animating' : ''}`}>
            {selectedWinner ? (
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
            ) : latestWinner ? (
              <div className="latest-winner">
                <span className="latest-label">Oxirgi g'olib</span>
                <h3 className="latest-name">{latestWinner.ishtirokchi?.fio}</h3>
                <span className="latest-location">
                  {latestWinner.tuman?.nomi}, {latestWinner.viloyat?.nomi}
                </span>
              </div>
            ) : (
              <div className="no-winner">
                <span>Hali g'olib tanlanmagan</span>
              </div>
            )}

            <div className="selection-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={excludePrevious}
                  onChange={(e) => setExcludePrevious(e.target.checked)}
                />
                <span>Oldingi g'oliblarni hisobga olmaslik</span>
              </label>

              <button
                onClick={handleSelectWinner}
                disabled={selecting || stats?.tanlanishiMumkin === 0}
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
