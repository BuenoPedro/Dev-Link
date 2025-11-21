import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import News from './pages/News';
import UserProfile from './pages/UserProfile';
import CompanyProfile from './pages/CompanyProfile';
import Connections from './pages/Connections';
import JobsView from './pages/JobsView';
import JobsNew from './pages/JobsNew';
import AdminPanel from './pages/AdminPanel';
import JobDetails from './pages/JobDetails';
import JobsOnDemand from './pages/JobsOnDemand';
import Premium from './pages/Premium';

// Componente para redirecionar rotas públicas quando logado
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  // Se o usuário está logado, redireciona para o feed
  if (user) {
    return <Navigate to="/feed" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas - Redireciona para /feed se logado */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Rotas Privadas */}
      <Route element={<Layout />}>
        <Route
          path="/feed"
          element={
            <PrivateRoute>
              <Feed />
            </PrivateRoute>
          }
        />
        <Route
          path="/news"
          element={
            <PrivateRoute>
              <News />
            </PrivateRoute>
          }
        />
        <Route
          path="/user"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/user/:id"
          element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/company"
          element={
            <PrivateRoute>
              <CompanyProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/company/:id"
          element={
            <PrivateRoute>
              <CompanyProfile />
            </PrivateRoute>
          }
        />
        <Route
          path="/connections"
          element={
            <PrivateRoute>
              <Connections />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <PrivateRoute>
              <JobsView />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobsOnDemand"
          element={
            <PrivateRoute>
              <JobsOnDemand />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobs/new"
          element={
            <PrivateRoute>
              <JobsNew />
            </PrivateRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <PrivateRoute>
              <JobDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/premium"
          element={
            <PrivateRoute>
              <Premium />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Rota padrão - Redireciona para feed se logado, senão para landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
