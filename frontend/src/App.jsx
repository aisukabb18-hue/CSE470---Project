import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login          from "./pages/Login";
import Register       from "./pages/Register";
import Dashboard      from "./pages/Dashboard";
import MoodLog        from "./pages/MoodLog";
import Journal        from "./pages/Journal";
import Sleep          from "./pages/Sleep";
import Habits         from "./pages/Habits";
import RiskAssessment from "./pages/RiskAssessment";
import Reports        from "./pages/Reports";
import Support        from "./pages/Support";
import Admin          from "./pages/Admin";

const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/login"     element={!token ? <Login />    : <Navigate to="/dashboard" />} />
      <Route path="/register"  element={!token ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/mood"      element={<ProtectedRoute><MoodLog /></ProtectedRoute>} />
      <Route path="/journal"   element={<ProtectedRoute><Journal /></ProtectedRoute>} />
      <Route path="/sleep"     element={<ProtectedRoute><Sleep /></ProtectedRoute>} />
      <Route path="/habits"    element={<ProtectedRoute><Habits /></ProtectedRoute>} />
      <Route path="/risk"      element={<ProtectedRoute><RiskAssessment /></ProtectedRoute>} />
      <Route path="/reports"   element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/support"   element={<ProtectedRoute><Support /></ProtectedRoute>} />
      <Route path="/admin"     element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="*"          element={<Navigate to="/login" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;