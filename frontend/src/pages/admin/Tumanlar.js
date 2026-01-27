import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AdminPages.css';

const Tumanlar = () => {
  const { isAdmin } = useAuth();
  const [tumanlar, setTumanlar] = useState([]);
  const [viloyatlar, setViloyatlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTuman, setEditingTuman] = useState(null);
  const [formData, setFormData] = useState({ nomi: '', soato: '', viloyat: '' });
  const [filterViloyat, setFilterViloyat] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '', 'true', 'false'

  useEffect(() => {
    fetchData();
  }, [filterViloyat, filterStatus]);

  const fetchData = async () => {
    try {
      // Query parametrlarini yasash
      const params = new URLSearchParams();
      if (filterViloyat) params.append('viloyat', filterViloyat);
      if (filterStatus) params.append('isActive', filterStatus);
      const queryString = params.toString();

      const [tumanlarRes, viloyatlarRes] = await Promise.all([
        api.get(`/tuman${queryString ? `?${queryString}` : ''}`),
        api.get('/viloyat')
      ]);
      setTumanlar(tumanlarRes.data.data);
      setViloyatlar(viloyatlarRes.data.data);
    } catch (error) {
      console.error('Ma\'lumot olishda xato:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTuman) {
        await api.put(`/tuman/${editingTuman._id}`, { nomi: formData.nomi, soato: formData.soato });
      } else {
        await api.post('/tuman', formData);
      }
      setShowModal(false);
      setEditingTuman(null);
      setFormData({ nomi: '', soato: '', viloyat: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const handleEdit = (tuman) => {
    setEditingTuman(tuman);
    setFormData({
      nomi: tuman.nomi,
      soato: tuman.soato,
      viloyat: tuman.viloyat._id
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu tumanni o\'chirmoqchimisiz?')) return;
    try {
      await api.delete(`/tuman/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const handleToggleActive = async (tuman) => {
    try {
      await api.patch(`/tuman/${tuman._id}/toggle-active`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  // Filterlangan tumanlarni faol/nofaol qilish
  const handleBulkToggle = async (isActive) => {
    const viloyatNomi = filterViloyat
      ? viloyatlar.find(v => v._id === filterViloyat)?.nomi
      : 'Barcha viloyatlar';
    const statusText = filterStatus === 'true' ? 'faol' : filterStatus === 'false' ? 'nofaol' : 'barcha';
    const action = isActive ? 'faollashtirmoqchi' : 'nofaol qilmoqchi';

    const confirmMessage = filterViloyat
      ? `${viloyatNomi} viloyatidagi ${statusText} tumanlarni ${action}misiz?`
      : `${statusText.charAt(0).toUpperCase() + statusText.slice(1)} tumanlarni ${action}misiz? (${tumanlar.length} ta)`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setBulkLoading(true);
    try {
      const body = { isActive };
      if (filterViloyat) body.viloyat = filterViloyat;
      if (filterStatus) body.currentStatus = filterStatus;

      const response = await api.patch('/tuman/bulk-toggle', body);
      alert(response.data.message);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    } finally {
      setBulkLoading(false);
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
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Tumanlar</h1>
          {isAdmin() && (
            <button
              onClick={() => {
                setEditingTuman(null);
                setFormData({ nomi: '', soato: '', viloyat: viloyatlar[0]?._id || '' });
                setShowModal(true);
              }}
              className="btn btn-primary"
            >
              + Yangi tuman
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="filter-bar">
          <select
            value={filterViloyat}
            onChange={(e) => setFilterViloyat(e.target.value)}
            className="form-input filter-select"
          >
            <option value="">Barcha viloyatlar</option>
            {viloyatlar.map((v) => (
              <option key={v._id} value={v._id}>{v.nomi}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input filter-select"
          >
            <option value="">Barcha holatlar</option>
            <option value="true">Faol (Ishtirok etadi)</option>
            <option value="false">Nofaol (Ishtirok etmaydi)</option>
          </select>

          {/* Bulk actions - filterlangan tumanlar uchun */}
          {tumanlar.length > 0 && (
            <div className="bulk-actions">
              <button
                onClick={() => handleBulkToggle(true)}
                disabled={bulkLoading}
                className="btn btn-success btn-sm"
                title="Filterlangan tumanlarni faollashtirish"
              >
                {bulkLoading ? '...' : '🟢 Barchasini faol'}
              </button>
              <button
                onClick={() => handleBulkToggle(false)}
                disabled={bulkLoading}
                className="btn btn-danger btn-sm"
                title="Filterlangan tumanlarni nofaol qilish"
              >
                {bulkLoading ? '...' : '🔴 Barchasini nofaol'}
              </button>
            </div>
          )}
        </div>

        <div className="card">
          {tumanlar.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📍</span>
              <p>Tumanlar topilmadi</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SOATO</th>
                    <th>Nomi</th>
                    <th>Viloyat</th>
                    <th>Ishtirokchilar</th>
                    <th>Faol</th>
                    <th>Holati</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {tumanlar.map((tuman, index) => (
                    <tr key={tuman._id}>
                      <td>{index + 1}</td>
                      <td><code>{tuman.soato}</code></td>
                      <td className="name-cell">{tuman.nomi}</td>
                      <td>{tuman.viloyat?.nomi}</td>
                      <td>{tuman.ishtirokchilarSoni}</td>
                      <td>{tuman.faolIshtirokchilar}</td>
                      <td>
                        <span className={`badge ${tuman.isActive ? 'badge-success' : 'badge-error'}`}>
                          {tuman.isActive ? 'Ishtirok etadi' : 'Ishtirok etmaydi'}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleToggleActive(tuman)}
                          className="btn-icon"
                          title={tuman.isActive ? 'Ishtirokdan chiqarish' : 'Ishtirok ettirish'}
                        >
                          {tuman.isActive ? '🔴' : '🟢'}
                        </button>
                        {isAdmin() && (
                          <>
                            <button
                              onClick={() => handleEdit(tuman)}
                              className="btn-icon"
                              title="Tahrirlash"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(tuman._id)}
                              className="btn-icon"
                              title="O'chirish"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal - faqat admin uchun */}
        {isAdmin() && showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingTuman ? 'Tumanni tahrirlash' : 'Yangi tuman'}</h2>
                <button onClick={() => setShowModal(false)} className="modal-close">×</button>
              </div>
              <form onSubmit={handleSubmit}>
                {!editingTuman && (
                  <div className="form-group">
                    <label className="form-label">Viloyat</label>
                    <select
                      className="form-input"
                      value={formData.viloyat}
                      onChange={(e) => setFormData({ ...formData, viloyat: e.target.value })}
                      required
                    >
                      <option value="">Viloyat tanlang</option>
                      {viloyatlar.map((v) => (
                        <option key={v._id} value={v._id}>{v.soato} - {v.nomi}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">SOATO kodi</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.soato}
                    onChange={(e) => setFormData({ ...formData, soato: e.target.value })}
                    placeholder="Masalan: 1703401"
                    pattern="\d{7}"
                    maxLength={7}
                    required
                  />
                  <small style={{ color: 'var(--gray-500)', fontSize: '12px' }}>
                    7 raqamdan iborat bo'lishi kerak
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label">Tuman nomi</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nomi}
                    onChange={(e) => setFormData({ ...formData, nomi: e.target.value })}
                    placeholder="Tuman nomini kiriting"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTuman ? 'Saqlash' : 'Qo\'shish'}
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

export default Tumanlar;
