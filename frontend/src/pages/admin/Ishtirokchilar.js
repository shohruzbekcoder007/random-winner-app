import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminPages.css';

const Ishtirokchilar = () => {
  const [ishtirokchilar, setIshtirokchilar] = useState([]);
  const [viloyatlar, setViloyatlar] = useState([]);
  const [tumanlar, setTumanlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIshtirokchi, setEditingIshtirokchi] = useState(null);
  const [formData, setFormData] = useState({ fio: '', tuman: '', telefon: '' });
  const [filterViloyat, setFilterViloyat] = useState('');
  const [filterTuman, setFilterTuman] = useState('');
  const [filterWinner, setFilterWinner] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchViloyatlar();
  }, []);

  useEffect(() => {
    fetchIshtirokchilar();
  }, [filterViloyat, filterTuman, filterWinner, page]);

  useEffect(() => {
    if (filterViloyat) {
      fetchTumanlar(filterViloyat);
    } else {
      setTumanlar([]);
      setFilterTuman('');
    }
  }, [filterViloyat]);

  const fetchViloyatlar = async () => {
    try {
      const response = await api.get('/viloyat');
      setViloyatlar(response.data.data);
    } catch (error) {
      console.error('Viloyatlarni olishda xato:', error);
    }
  };

  const fetchTumanlar = async (viloyatId) => {
    try {
      const response = await api.get(`/tuman?viloyat=${viloyatId}`);
      setTumanlar(response.data.data);
    } catch (error) {
      console.error('Tumanlarni olishda xato:', error);
    }
  };

  const fetchIshtirokchilar = async () => {
    try {
      setLoading(true);
      let url = `/ishtirokchi?page=${page}&limit=50`;
      if (filterViloyat) url += `&viloyat=${filterViloyat}`;
      if (filterTuman) url += `&tuman=${filterTuman}`;
      if (filterWinner) url += `&isWinner=${filterWinner}`;

      const response = await api.get(url);
      setIshtirokchilar(response.data.data);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Ishtirokchilarni olishda xato:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingIshtirokchi) {
        await api.put(`/ishtirokchi/${editingIshtirokchi._id}`, {
          fio: formData.fio,
          telefon: formData.telefon
        });
      } else {
        await api.post('/ishtirokchi', formData);
      }
      setShowModal(false);
      setEditingIshtirokchi(null);
      setFormData({ fio: '', tuman: '', telefon: '' });
      fetchIshtirokchilar();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const handleEdit = (ishtirokchi) => {
    setEditingIshtirokchi(ishtirokchi);
    setFormData({
      fio: ishtirokchi.fio,
      tuman: ishtirokchi.tuman._id,
      telefon: ishtirokchi.telefon || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ishtirokchini o\'chirmoqchimisiz?')) return;
    try {
      await api.delete(`/ishtirokchi/${id}`);
      fetchIshtirokchilar();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const handleResetWinner = async (id) => {
    if (!window.confirm('G\'olib statusini bekor qilmoqchimisiz?')) return;
    try {
      await api.patch(`/ishtirokchi/${id}/reset-winner`);
      fetchIshtirokchilar();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Ishtirokchilar</h1>
          <button
            onClick={() => {
              setEditingIshtirokchi(null);
              setFormData({ fio: '', tuman: '', telefon: '' });
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            + Yangi ishtirokchi
          </button>
        </div>

        {/* Filter */}
        <div className="filter-bar">
          <select
            value={filterViloyat}
            onChange={(e) => {
              setFilterViloyat(e.target.value);
              setPage(1);
            }}
            className="form-input filter-select"
          >
            <option value="">Barcha viloyatlar</option>
            {viloyatlar.map((v) => (
              <option key={v._id} value={v._id}>{v.nomi}</option>
            ))}
          </select>

          <select
            value={filterTuman}
            onChange={(e) => {
              setFilterTuman(e.target.value);
              setPage(1);
            }}
            className="form-input filter-select"
            disabled={!filterViloyat}
          >
            <option value="">Barcha tumanlar</option>
            {tumanlar.map((t) => (
              <option key={t._id} value={t._id}>{t.nomi}</option>
            ))}
          </select>

          <select
            value={filterWinner}
            onChange={(e) => {
              setFilterWinner(e.target.value);
              setPage(1);
            }}
            className="form-input filter-select"
          >
            <option value="">Barcha holatlar</option>
            <option value="true">G'oliblar</option>
            <option value="false">G'olib bo'lmaganlar</option>
          </select>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : ishtirokchilar.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <p>Ishtirokchilar topilmadi</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>FIO</th>
                    <th>Tuman</th>
                    <th>Viloyat</th>
                    <th>Telefon</th>
                    <th>Holati</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {ishtirokchilar.map((ish, index) => (
                    <tr key={ish._id}>
                      <td>{(page - 1) * 50 + index + 1}</td>
                      <td className="name-cell">
                        {ish.isWinner && <span className="winner-badge">🏆</span>}
                        {ish.fio}
                      </td>
                      <td>{ish.tuman?.nomi}</td>
                      <td>{ish.tuman?.viloyat?.nomi}</td>
                      <td>{ish.telefon || '-'}</td>
                      <td>
                        <span className={`badge ${ish.isWinner ? 'badge-success' : 'badge-info'}`}>
                          {ish.isWinner ? 'G\'olib' : 'Faol'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        {ish.isWinner && (
                          <button
                            onClick={() => handleResetWinner(ish._id)}
                            className="btn-icon"
                            title="G'olib statusini bekor qilish"
                          >
                            🔄
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(ish)}
                          className="btn-icon"
                          title="Tahrirlash"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(ish._id)}
                          className="btn-icon"
                          title="O'chirish"
                        >
                          🗑️
                        </button>
                      </td>
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

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingIshtirokchi ? 'Ishtirokchini tahrirlash' : 'Yangi ishtirokchi'}</h2>
                <button onClick={() => setShowModal(false)} className="modal-close">×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">FIO</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.fio}
                    onChange={(e) => setFormData({ ...formData, fio: e.target.value })}
                    placeholder="To'liq ism-sharif"
                    required
                  />
                </div>
                {!editingIshtirokchi && (
                  <div className="form-group">
                    <label className="form-label">Tuman</label>
                    <select
                      className="form-input"
                      value={formData.tuman}
                      onChange={(e) => setFormData({ ...formData, tuman: e.target.value })}
                      required
                    >
                      <option value="">Tuman tanlang</option>
                      {viloyatlar.map((v) => (
                        <optgroup key={v._id} label={v.nomi}>
                          {tumanlar.filter(t => t.viloyat?._id === v._id).map((t) => (
                            <option key={t._id} value={t._id}>{t.nomi}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Telefon (ixtiyoriy)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    placeholder="+998 XX XXX XX XX"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingIshtirokchi ? 'Saqlash' : 'Qo\'shish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ishtirokchilar;
