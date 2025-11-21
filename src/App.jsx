import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

// CSS - Components
import './App.css';
import Header from './components/Header';
import Feed from './pages/Feed';
import News from './pages/News';
import UserProfile from './pages/UserProfile';
import CompanyProfile from './pages/CompanyProfile';
import Connections from './pages/Connections';
import JobsView from './pages/JobsView';
import JobsNew from './pages/JobsNew';
import JobDetails from './pages/JobDetails';
import JobsOnDemand from './pages/JobsOnDemand';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
        {/* Header fixo */}
        <Header isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              {/* Feed principal - agora com componente separado */}
              <Route path="/" element={<Feed />} />

              {/* Páginas da Sidebar */}
              <Route path="/news" element={<News />} />
              <Route path="/jobs" element={<JobsView />} />
              <Route path="/jobsOnDemand" element={<JobsOnDemand />} />
              <Route path="/jobs/new" element={<JobsNew />} />
              <Route path="/jobs/:id" element={<JobDetails />} />

              {/* Perfil do usuário logado */}
              <Route path="/user" element={<UserProfile />} />

              {/* Perfil da empresa logada */}
              <Route path="/company" element={<CompanyProfile />} />

              {/* Perfil de outros usuários */}
              <Route path="/user/:id" element={<UserProfile />} />

              {/* Perfil de outras empresas */}
              <Route path="/company/:id" element={<CompanyProfile />} />

              {/* Página de conexões */}
              <Route path="/connections" element={<Connections />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;