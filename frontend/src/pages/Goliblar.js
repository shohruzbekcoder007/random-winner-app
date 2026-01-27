import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './Goliblar.css';

const Goliblar = () => {
  const [goliblar, setGoliblar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);

  // Filter states
  const [viloyatlar, setViloyatlar] = useState([]);
  const [tumanlar, setTumanlar] = useState([]);
  const [filteredTumanlar, setFilteredTumanlar] = useState([]);

  const [filters, setFilters] = useState({
    viloyat: '',
    tuman: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Viloyat va tumanlarni olish
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const [vilRes, tumRes] = await Promise.all([
          api.get('/viloyat'),
          api.get('/tuman')
        ]);
        setViloyatlar(vilRes.data.data);
        setTumanlar(tumRes.data.data);
      } catch (error) {
        console.error('Joylashuvlarni olishda xato:', error);
      }
    };
    fetchLocations();
  }, []);

  // Viloyat o'zgarganda tumanlarni filter qilish
  useEffect(() => {
    if (filters.viloyat) {
      const filtered = tumanlar.filter(t => t.viloyat?._id === filters.viloyat);
      setFilteredTumanlar(filtered);
    } else {
      setFilteredTumanlar(tumanlar);
    }
  }, [filters.viloyat, tumanlar]);

  // Query string yasash
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', 20);

    if (filters.viloyat) params.append('viloyat', filters.viloyat);
    if (filters.tuman) params.append('tuman', filters.tuman);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    return params.toString();
  }, [page, filters]);

  const fetchGoliblar = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/golib?${buildQueryString()}`);
      setGoliblar(response.data.data);
      setTotalPages(response.data.pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('G\'oliblarni olishda xato:', error);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/golib/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Statistika olishda xato:', error);
    }
  };

  useEffect(() => {
    fetchGoliblar();
  }, [fetchGoliblar]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Filter o'zgarganda page ni 1 ga qaytarish
  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };

      // Viloyat o'zgarganda tuman ni tozalash
      if (field === 'viloyat') {
        newFilters.tuman = '';
      }

      return newFilters;
    });
    setPage(1);
  };

  // Filterlarni tozalash
  const clearFilters = () => {
    setFilters({
      viloyat: '',
      tuman: '',
      search: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  // XLSX ga export qilish
  const handleExport = async () => {
    try {
      setExporting(true);

      // Filter parametrlarini query string ga aylantirish
      const params = new URLSearchParams();
      if (filters.viloyat) params.append('viloyat', filters.viloyat);
      if (filters.tuman) params.append('tuman', filters.tuman);
      if (filters.search) params.append('search', filters.search);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/golib/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Faylni yuklash
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Fayl nomini yaratish
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `goliblar_${today}.xlsx`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export xatosi:', error);
      alert('Export qilishda xato yuz berdi');
    } finally {
      setExporting(false);
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

  // Filter faolmi tekshirish
  const hasActiveFilters = filters.viloyat || filters.tuman || filters.search || filters.startDate || filters.endDate;

  return (
    <div className="goliblar-page">
      <div className="container">
        <div className="page-header">
          <h1>G'oliblar ro'yxati</h1>
          <div className="header-actions">
            <span className="total-count">Jami: {total} ta</span>
            <button
              onClick={handleExport}
              disabled={exporting || total === 0}
              className="btn btn-success export-btn"
            >
              {exporting ? (
                <>
                  <span className="btn-spinner"></span>
                  <span>Yuklanmoqda...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>XLSX yuklash</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Viloyat</label>
              <select
                value={filters.viloyat}
                onChange={(e) => handleFilterChange('viloyat', e.target.value)}
                className="form-input"
              >
                <option value="">Barchasi</option>
                {viloyatlar.map(v => (
                  <option key={v._id} value={v._id}>{v.nomi}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Tuman</label>
              <select
                value={filters.tuman}
                onChange={(e) => handleFilterChange('tuman', e.target.value)}
                className="form-input"
                disabled={filteredTumanlar.length === 0}
              >
                <option value="">Barchasi</option>
                {filteredTumanlar.map(t => (
                  <option key={t._id} value={t._id}>{t.nomi}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>FIO bo'yicha qidirish</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Ism kiriting..."
                className="form-input"
              />
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Boshlanish sanasi</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="filter-group">
              <label>Tugash sanasi</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="filter-group filter-actions">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn btn-outline clear-btn">
                  ✕ Tozalash
                </button>
              )}
            </div>
          </div>
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
          {loading ? (
            <div className="table-loading">
              <div className="spinner"></div>
            </div>
          ) : goliblar.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏆</span>
              <p>{hasActiveFilters ? 'Filter bo\'yicha natija topilmadi' : 'Hali g\'olib tanlanmagan'}</p>
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
                    <th>Manzil</th>
                    <th>Tanlangan sana</th>
                  </tr>
                </thead>
                <tbody>
                  {goliblar.map((golib, index) => (
                    <tr key={golib._id}>
                      <td>{(page - 1) * 20 + index + 1}</td>
                      <td className="fio-cell">
                        <span className="winner-icon">🏆</span>
                        {golib.ishtirokchi?.fio}
                      </td>
                      <td>{golib.viloyat?.nomi}</td>
                      <td>{golib.tuman?.nomi}</td>
                      <td>{golib.ishtirokchi?.telefon || '-'}</td>
                      <td>{formatDate(golib.tanlanganSana)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
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
