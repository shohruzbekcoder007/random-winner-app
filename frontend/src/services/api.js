import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 soniya
});

// Xato xabarlarini tarjima qilish
const getErrorMessage = (error) => {
  // Server javobidan xabar olish
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // HTTP status kodlari bo'yicha xabarlar
  const statusMessages = {
    400: 'Noto\'g\'ri so\'rov',
    401: 'Avtorizatsiya talab qilinadi',
    403: 'Ruxsat berilmagan',
    404: 'Ma\'lumot topilmadi',
    409: 'Ma\'lumot allaqachon mavjud',
    422: 'Ma\'lumotlar noto\'g\'ri',
    429: 'Juda ko\'p so\'rov. Biroz kuting',
    500: 'Server xatosi',
    502: 'Server vaqtincha ishlamayapti',
    503: 'Xizmat mavjud emas'
  };

  if (error.response?.status && statusMessages[error.response.status]) {
    return statusMessages[error.response.status];
  }

  // Tarmoq xatolari
  if (error.code === 'ECONNABORTED') {
    return 'So\'rov vaqti tugadi. Qaytadan urinib ko\'ring';
  }

  if (error.code === 'ERR_NETWORK' || !error.response) {
    return 'Tarmoq xatosi. Internet aloqasini tekshiring';
  }

  return 'Kutilmagan xato yuz berdi';
};

// Token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = getErrorMessage(error);

    // 401 - Avtorizatsiya xatosi
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Agar login sahifasida bo'lmasa
      if (!window.location.pathname.includes('/login')) {
        toast.error('Sessiya tugadi. Qaytadan kiring');
        window.location.href = '/login';
      }
    }

    // Error obyektiga message qo'shish
    error.errorMessage = message;

    return Promise.reject(error);
  }
);

// Muvaffaqiyatli operatsiyalar uchun yordamchi funksiya
export const showSuccess = (message) => {
  toast.success(message);
};

// Xato ko'rsatish uchun yordamchi funksiya
export const showError = (error) => {
  const message = error.errorMessage || getErrorMessage(error);
  toast.error(message);
};

// Ogohlantirish uchun yordamchi funksiya
export const showWarning = (message) => {
  toast.warning(message);
};

// Info uchun yordamchi funksiya
export const showInfo = (message) => {
  toast.info(message);
};

export default api;
