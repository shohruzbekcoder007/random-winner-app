import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminPages.css';

const Upload = () => {
  const [viloyatlar, setViloyatlar] = useState([]);
  const [tumanlar, setTumanlar] = useState([]);
  const [selectedViloyat, setSelectedViloyat] = useState('');
  const [selectedTuman, setSelectedTuman] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViloyatlar();
  }, []);

  useEffect(() => {
    if (selectedViloyat) {
      fetchTumanlar(selectedViloyat);
    } else {
      setTumanlar([]);
      setSelectedTuman('');
    }
  }, [selectedViloyat]);

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

  const fetchTumanlar = async (viloyatId) => {
    try {
      const response = await api.get(`/tuman?viloyat=${viloyatId}`);
      setTumanlar(response.data.data);
    } catch (error) {
      console.error('Tumanlarni olishda xato:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Faqat Excel fayllari (.xlsx, .xls) qabul qilinadi');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedViloyat) {
      alert('Viloyatni tanlang');
      return;
    }

    if (!selectedTuman) {
      alert('Tumanni tanlang');
      return;
    }

    if (!file) {
      alert('Excel faylni tanlang');
      return;
    }

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tumanId', selectedTuman);

    try {
      const response = await api.post('/upload/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data.data);
      setFile(null);
      document.getElementById('file-input').value = '';
    } catch (error) {
      alert(error.response?.data?.message || 'Yuklashda xato yuz berdi');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/upload/template', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ishtirokchilar_namuna.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Namuna faylni yuklab olishda xato');
    }
  };

  const getSelectedTumanName = () => {
    const tuman = tumanlar.find(t => t._id === selectedTuman);
    return tuman ? tuman.nomi : '';
  };

  const getSelectedViloyatName = () => {
    const viloyat = viloyatlar.find(v => v._id === selectedViloyat);
    return viloyat ? viloyat.nomi : '';
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
          <h1>Excel orqali yuklash</h1>
        </div>

        <div className="upload-section">
          <div className="card upload-card">
            <div className="upload-icon">📊</div>
            <h2>Ishtirokchilarni Excel fayldan yuklash</h2>
            <p className="upload-description">
              Avval viloyat va tumanni tanlang, keyin Excel faylni yuklang.
              <br />
              Barcha ishtirokchilar tanlangan tumanga qo'shiladi.
            </p>

            {/* Viloyat va Tuman tanlash */}
            <div className="selection-grid">
              <div className="form-group">
                <label className="form-label">Viloyat tanlang *</label>
                <select
                  value={selectedViloyat}
                  onChange={(e) => {
                    setSelectedViloyat(e.target.value);
                    setSelectedTuman('');
                    setResult(null);
                  }}
                  className="form-input"
                >
                  <option value="">-- Viloyatni tanlang --</option>
                  {viloyatlar.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.nomi} ({v.tumanlarSoni} ta tuman)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tuman tanlang *</label>
                <select
                  value={selectedTuman}
                  onChange={(e) => {
                    setSelectedTuman(e.target.value);
                    setResult(null);
                  }}
                  className="form-input"
                  disabled={!selectedViloyat}
                >
                  <option value="">-- Tumanni tanlang --</option>
                  {tumanlar.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.nomi} ({t.ishtirokchilarSoni || 0} ta ishtirokchi)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tanlangan joy ko'rsatish */}
            {selectedTuman && (
              <div className="selected-location">
                <span className="location-icon">📍</span>
                <span className="location-text">
                  {getSelectedTumanName()}, {getSelectedViloyatName()}
                </span>
              </div>
            )}

            <div className="upload-controls">
              <button onClick={handleDownloadTemplate} className="btn btn-outline">
                📥 Namuna faylni yuklab olish
              </button>

              <div className="file-input-wrapper">
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="file-input" className="file-label">
                  {file ? (
                    <>📎 {file.name}</>
                  ) : (
                    <>📁 Excel fayl tanlash</>
                  )}
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={!file || !selectedTuman || uploading}
                className="btn btn-primary upload-btn"
              >
                {uploading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Yuklanmoqda...
                  </>
                ) : (
                  <>⬆️ Yuklash</>
                )}
              </button>
            </div>
          </div>

          {/* Natija */}
          {result && (
            <div className="card result-card">
              <h3>Yuklash natijasi</h3>
              <div className="result-location">
                📍 {result.tuman}, {result.viloyat}
              </div>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-value">{result.total}</span>
                  <span className="result-label">Jami qatorlar</span>
                </div>
                <div className="result-item success">
                  <span className="result-value">{result.created}</span>
                  <span className="result-label">Muvaffaqiyatli</span>
                </div>
                <div className="result-item warning">
                  <span className="result-value">{result.skipped}</span>
                  <span className="result-label">O'tkazib yuborilgan</span>
                </div>
                <div className="result-item error">
                  <span className="result-value">{result.errors?.length || 0}</span>
                  <span className="result-label">Xatolar</span>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="errors-list">
                  <h4>Xatolar ro'yxati:</h4>
                  <ul>
                    {result.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>
                        Qator {err.row}: {err.fio} - {err.error}
                      </li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>... va yana {result.errors.length - 10} ta xato</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Qo'llanma */}
          <div className="card instructions-card">
            <h3>📋 Qo'llanma</h3>
            <ol>
              <li><strong>Viloyat</strong> va <strong>Tuman</strong>ni tanlang</li>
              <li>Namuna faylni yuklab oling (ixtiyoriy)</li>
              <li>Excel faylga ishtirokchilar ma'lumotlarini kiriting:
                <ul>
                  <li><strong>FIO</strong> - majburiy (1-ustun)</li>
                  <li><strong>Telefon</strong> - ixtiyoriy (2-ustun)</li>
                </ul>
              </li>
              <li>Birinchi qator sarlavha bo'lishi mumkin (avtomatik aniqlanadi)</li>
              <li>Takroriy ishtirokchilar o'tkazib yuboriladi</li>
              <li>Barcha ishtirokchilar tanlangan tumanga qo'shiladi</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
