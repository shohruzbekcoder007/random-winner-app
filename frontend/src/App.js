import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import Goliblar from './pages/Goliblar';

// Admin Pages
import Viloyatlar from './pages/admin/Viloyatlar';
import Tumanlar from './pages/admin/Tumanlar';
import Ishtirokchilar from './pages/admin/Ishtirokchilar';
import Upload from './pages/admin/Upload';
import Users from './pages/admin/Users';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
        <div className="app">
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Home />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/goliblar"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Goliblar />
                  </>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/viloyatlar"
              element={
                <ProtectedRoute adminOnly>
                  <>
                    <Navbar />
                    <Viloyatlar />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tumanlar"
              element={
                <ProtectedRoute adminOnly>
                  <>
                    <Navbar />
                    <Tumanlar />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ishtirokchilar"
              element={
                <ProtectedRoute adminOnly>
                  <>
                    <Navbar />
                    <Ishtirokchilar />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/upload"
              element={
                <ProtectedRoute adminOnly>
                  <>
                    <Navbar />
                    <Upload />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <>
                    <Navbar />
                    <Users />
                  </>
                </ProtectedRoute>
              }
            />

            {/* Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
