const AppError = require('../utils/AppError');

// MongoDB xatolarini aniqlash va o'zgartirish
const handleCastErrorDB = (err) => {
  const message = `Noto'g'ri ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `"${value}" qiymati allaqachon mavjud. Boshqa qiymat kiriting.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Noto'g'ri ma'lumotlar: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Noto\'g\'ri token. Qaytadan kiring.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token muddati tugagan. Qaytadan kiring.', 401);

// Development muhitida to'liq xato
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

// Production muhitida xavfsiz xato
const sendErrorProd = (err, res) => {
  // Operatsion xatolar - foydalanuvchiga ko'rsatish mumkin
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } else {
    // Dasturlash xatosi - tafsilotlarni yashirish
    console.error('ERROR:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Serverda xato yuz berdi'
    });
  }
};

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // MongoDB CastError (noto'g'ri ObjectId)
    if (err.name === 'CastError') error = handleCastErrorDB(error);

    // MongoDB Duplicate Key Error
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);

    // MongoDB Validation Error
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);

    // JWT Error
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Async funksiyalar uchun wrapper (try-catch o'rniga)
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 Not Found handler
const notFound = (req, res, next) => {
  const error = new AppError(`${req.originalUrl} topilmadi`, 404);
  next(error);
};

module.exports = {
  errorHandler,
  catchAsync,
  notFound,
  AppError
};
