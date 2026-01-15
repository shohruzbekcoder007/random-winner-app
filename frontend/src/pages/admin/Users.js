import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminPages.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data.data);
    } catch (error) {
      console.error('Foydalanuvchilarni olishda xato:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    try {
      await api.post('/auth/register', formData);
      setShowModal(false);
      setFormData({ username: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`"${username}" foydalanuvchisini o'chirmoqchimisiz?`)) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.patch(`/auth/users/${user._id}/toggle-active`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Xato yuz berdi');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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
    <div className="admin-page">
      <div className="container">
        <div className="page-header">
          <h1>Foydalanuvchilar</h1>
          <button
            onClick={() => {
              setFormData({ username: '', password: '', role: 'user' });
              setError('');
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            + Yangi foydalanuvchi
          </button>
        </div>

        <div className="card">
          {users.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <p>Foydalanuvchilar topilmadi</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Foydalanuvchi nomi</th>
                    <th>Rol</th>
                    <th>Holati</th>
                    <th>Yaratilgan</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user._id}>
                      <td>{index + 1}</td>
                      <td className="name-cell">
                        {user.role === 'admin' && <span className="role-icon">👑</span>}
                        {user.username}
                      </td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge-info' : 'badge-success'}`}>
                          {user.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                          {user.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td className="actions-cell">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="btn-icon"
                          title={user.isActive ? 'O\'chirish' : 'Yoqish'}
                        >
                          {user.isActive ? '🔴' : '🟢'}
                        </button>
                        <button
                          onClick={() => handleDelete(user._id, user.username)}
                          className="btn-icon"
                          title="O'chirish"
                          disabled={user.role === 'admin'}
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
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Yangi foydalanuvchi</h2>
                <button onClick={() => setShowModal(false)} className="modal-close">×</button>
              </div>
              <form onSubmit={handleSubmit}>
                {error && <div className="form-error">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Foydalanuvchi nomi *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="username"
                    minLength={3}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Parol *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Kamida 6 ta belgi"
                    minLength={6}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select
                    className="form-input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="user">Foydalanuvchi</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                    Bekor qilish
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Qo'shish
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

export default Users;
