import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';

// CSS - Components
import './App.css';
import Header from './components/Header';
import PostCard from './components/PostCard';
import Sidebar from './components/Sidebar';
import News from './pages/News';
import UserProfile from './pages/UserProfile';
import CompanyProfile from './pages/CompanyProfile';
import Connections from './pages/Connections';
import JobsView from './pages/JobsView';
import JobsNew from './pages/JobsNew';
import JobDetails from './pages/JobDetails';

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock data para posts
  const posts = [
    {
      id: 1,
      company: 'TechCorp',
      companyImage: '/abstract-tech-logo.png',
      followers: '12.5k',
      content: 'Estamos contratando desenvolvedores React! Venha fazer parte da nossa equipe inovadora. #React #Jobs #TechCorp',
      image: '/modern-office.png',
      likes: 45,
      comments: 12,
      isFollowing: false,
    },
    {
      id: 2,
      company: 'StartupXYZ',
      companyImage: '/startup-logo-colorful.png',
      followers: '8.2k',
      content: 'Acabamos de lançar nossa nova feature de deploy automático! O que vocês acham? Feedback é sempre bem-vindo 🚀',
      image: '/images/update-4.png',
      likes: 78,
      comments: 23,
      isFollowing: true,
    },
    {
      id: 3,
      company: 'DevStudio',
      companyImage: '/creative-studio-logo.png',
      followers: '15.8k',
      content: 'Dicas de clean code que todo desenvolvedor deveria conhecer. Thread completa nos comentários! 💻✨',
      image: '/clean-code-programming.png',
      likes: 156,
      comments: 34,
      isFollowing: false,
    },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
        {/* Header fixo */}
        <Header isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              {/* Feed principal */}
              <Route
                path="/"
                element={
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
                    <div className="hidden lg:block lg:col-span-1"></div>

                    <div className="col-span-1 lg:col-span-2">
                      <div className="space-y-6">
                        {posts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    </div>

                    <div className="hidden lg:block lg:col-span-1">
                      <Sidebar />
                    </div>
                  </div>
                }
              />

              {/* Páginas da Sidebar */}
              <Route path="/news" element={<News />} />
              <Route path="/jobs" element={<JobsView />} />
              <Route path="/jobs/new" element={<JobsNew />} />
              <Route path="/jobs/:id" element={<JobDetails />} />

              {/* Perfil do usuário logado */}
              <Route path="/user" element={<UserProfile />} />

              {/* Perfil da empresa logada */}
              <Route path="/company" element={<CompanyProfile />} />

              {/* Perfil de outros usuários */}
              <Route path="/user/:id" element={<UserProfile />} />
              

              {/* Perfil de outros empresas */}
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
