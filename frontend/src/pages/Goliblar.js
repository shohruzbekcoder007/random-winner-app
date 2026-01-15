import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Goliblar.css';

const Goliblar = () => {
  const [goliblar, setGoliblar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchGoliblar();
    fetchStats();
  }, [page]);

  const fetchGoliblar = async () => {
    try {
      const response = await api.get(`/golib?page=${page}&limit=20`);
      setGoliblar(response.data.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('G\'oliblarni olishda xato:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/golib/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Statistika olishda xato:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="goliblar-page">
      <div className="container">
        <div className="page-header">
          <h1>G'oliblar ro'yxati</h1>
          <span className="total-count">Jami: {stats?.totalGoliblar || 0} ta</span>
        </div>

        {/* Statistika */}
        {stats && (
          <div className="stats-row">
            <div className="mini-stat">
              <span className="mini-stat-label">Eng ko'p g'olib</span>
              {stats.viloyatStats[0] && (
                <span className="mini-stat-value">
                  {stats.viloyatStats[0]._id}: {stats.viloyatStats[0].count} ta
                </span>
              )}
            </div>
          </div>
        )}

        {/* Jadval */}
        <div className="card">
          {goliblar.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏆</span>
              <p>Hali g'olib tanlanmagan</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>FIO</th>
                    <th>Viloyat</th>
                    <th>Tuman</th>
                    <th>Telefon</th>
                    <th>Tanlangan sana</th>
                  </tr>
                </thead>
                <tbody>
                  {goliblar.map((golib, index) => (
                    <tr key={golib._id}>
                      <td>{(page - 1) * 20 + index + 1}</td>
                      <td className="fio-cell">
                        <span className="winner-icon">🏆</span>
                        {golib.ishtirokchiFio}
                      </td>
                      <td>{golib.viloyatNomi}</td>
                      <td>{golib.tumanNomi}</td>
                      <td>{golib.ishtirokchiTelefon || '-'}</td>
                      <td>{formatDate(golib.tanlanganSana)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-outline"
              >
                ← Oldingi
              </button>
              <span className="page-info">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-outline"
              >
                Keyingi →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Goliblar;
