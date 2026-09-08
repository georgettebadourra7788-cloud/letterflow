import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import NewStudent from './pages/NewStudent';
import NewLetterRequest from './pages/NewLetterRequest';
import LetterEditor from './pages/LetterEditor';
import Export from './pages/Export';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
          <Route path="/students/new" element={<ProtectedRoute><NewStudent /></ProtectedRoute>} />
          <Route path="/students/:studentId/edit" element={<ProtectedRoute><NewStudent /></ProtectedRoute>} />
          <Route path="/letters/new" element={<ProtectedRoute><NewLetterRequest /></ProtectedRoute>} />
          <Route path="/letters/:letterId" element={<ProtectedRoute><LetterEditor /></ProtectedRoute>} />
          <Route path="/letters/:letterId/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
