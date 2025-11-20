import Sidebar from '../components/Sidebar';

const articles = [
  { id: 1, title: 'React 19 Beta: Novidades e Breaking Changes', source: 'React Blog', excerpt: 'Principais mudanças e como preparar sua base de código.', image: '' },
  { id: 2, title: 'TypeScript 5.3 e melhorias de DX', source: 'TypeScript Weekly', excerpt: 'Novos recursos para produtividade no dia a dia.', image: '' },
  { id: 3, title: 'Tendências de Frontend para 2024', source: 'Dev Community', excerpt: 'Astro, RSC, SSR híbrido e mais.', image: '' },
];

export default function News() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
      <div className="hidden lg:block lg:col-span-1"></div>

      {/* coluna central (mesmo do feed) */}
      <div className="col-span-1 lg:col-span-2 space-y-6">
        {articles.map((a) => (
          <article key={a.id} className="card">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-semibold">{a.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a.source}</p>
            </div>

            <div className="p-4">
              <p className="text-gray-800 dark:text-gray-100 leading-relaxed">{a.excerpt}</p>

              {/* imagem opcional */}
              {a.image && (
                <div className="mt-4">
                  <img src={a.image} alt={a.title} className="w-full h-64 object-cover rounded-lg" />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* sidebar direita */}
      <div className="hidden lg:block lg:col-span-1">
        <Sidebar />
      </div>
    </div>
  );
}
