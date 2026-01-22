import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AdminPages.css';

const Viloyatlar = () => {
  const { isAdmin } = useAuth();
  const [viloyatlar, setViloyatlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingViloyat, setEditingViloyat] = useState(null);
  const [formData, setFormData] = useState({ nomi: '', soato: '' });

  useEffect(() => {
    fetchViloyatlar();
  }, []);

  const fetchViloyatlar = async () => {
    try {
      const response = await api.get('/viloyat');
      setViloyatlar(response.data.data);
    } catch (error) {
      console.error('Viloyatlarni olishda xato:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingViloyat) {
        await api.put(`/viloyat/${editingViloyat._id}`, formData);
      } else {
        await api.post('/viloyat', formData);
      }
      setShowModal(false);
      setEditingViloyat(null);
      setFormData({ nomi: '', soato: '' });
      fetchViloyatlar();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const handleEdit = (viloyat) => {
    setEditingViloyat(viloyat);
    setFormData({ nomi: viloyat.nomi, soato: viloyat.soato });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu viloyatni o\'chirmoqchimisiz?')) return;
    try {
      await api.delete(`/viloyat/${id}`);
      fetchViloyatlar();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const handleToggleActive = async (viloyat) => {
    try {
      await api.put(`/viloyat/${viloyat._id}`, { isActive: !viloyat.isActive });
      fetchViloyatlar();
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
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Viloyatlar</h1>
          {isAdmin() && (
            <button
              onClick={() => {
                setEditingViloyat(null);
                setFormData({ nomi: '', soato: '' });
                setShowModal(true);
              }}
              className="btn btn-primary"
            >
              + Yangi viloyat
            </button>
          )}
        </div>

        <div className="card">
          {viloyatlar.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🏛️</span>
              <p>Viloyatlar topilmadi</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>SOATO</th>
                    <th>Nomi</th>
                    <th>Tumanlar</th>
                    <th>Faol tumanlar</th>
                    <th>Holati</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {viloyatlar.map((viloyat, index) => (
                    <tr key={viloyat._id}>
                      <td>{index + 1}</td>
                      <td><code>{viloyat.soato}</code></td>
                      <td className="name-cell">{viloyat.nomi}</td>
                      <td>{viloyat.tumanlarSoni}</td>
                      <td>{viloyat.faolTumanlarSoni}</td>
                      <td>
                        <span className={`badge ${viloyat.isActive ? 'badge-success' : 'badge-error'}`}>
                          {viloyat.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      {isAdmin() && (
                        <td className="actions-cell">
                          <button
                            onClick={() => handleToggleActive(viloyat)}
                            className="btn-icon"
                            title={viloyat.isActive ? 'O\'chirish' : 'Yoqish'}
                          >
                            {viloyat.isActive ? '🔴' : '🟢'}
                          </button>
                          <button
                            onClick={() => handleEdit(viloyat)}
                            className="btn-icon"
                            title="Tahrirlash"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(viloyat._id)}
                            className="btn-icon"
                            title="O'chirish"
                          >
                            🗑️
                          </button>
                        </td>
                      )}
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
                <h2>{editingViloyat ? 'Viloyatni tahrirlash' : 'Yangi viloyat'}</h2>
                <button onClick={() => setShowModal(false)} className="modal-close">×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">SOATO kodi</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.soato}
                    onChange={(e) => setFormData({ ...formData, soato: e.target.value })}
                    placeholder="Masalan: 1703"
                    pattern="\d{4}"
                    maxLength={4}
                    required
                  />
                  <small style={{ color: 'var(--gray-500)', fontSize: '12px' }}>
                    4 raqamdan iborat bo'lishi kerak
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label">Viloyat nomi</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nomi}
                    onChange={(e) => setFormData({ ...formData, nomi: e.target.value })}
                    placeholder="Viloyat nomini kiriting"
                    required
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingViloyat ? 'Saqlash' : 'Qo\'shish'}
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

export default Viloyatlar;
