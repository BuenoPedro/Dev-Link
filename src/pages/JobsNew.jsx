import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Ícones SVG Inline
const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 w-4 h-4"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);
const IconBriefcase = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
const IconMapPin = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);
const IconSave = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>
);

// Mock da API removido pois você já tem a api real.
// Certifique-se de importar sua api corretamente:
import { api } from '../lib/api';

export default function JobsNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    // Valores iniciais ajustados para os Enums válidos do Backend
    employmentType: 'CLT', 
    seniority: 'PLENO',
    locationType: 'REMOTE',
    locationCity: '',
    salaryMin: '',
    salaryMax: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin ? Number(formData.salaryMin) : null,
        salaryMax: formData.salaryMax ? Number(formData.salaryMax) : null,
        locationCity: formData.locationCity || null,
      };

      await api.post('/api/jobs', payload);
      
      navigate('/company');
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        // Formata erros do Zod para leitura amigável
        const msg = err.response.data.errors
          .map(e => `${e.path}: ${e.message}`)
          .join(' | ');
        setError(`Erro de validação: ${msg}`);
      } else {
        setError(err.response?.data?.message || 'Ocorreu um erro ao criar a vaga.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-sm text-gray-500 hover:text-sky-600 transition-colors mb-4"
          >
            <IconArrowLeft /> Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Publicar Nova Vaga</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Preencha os detalhes abaixo para atrair os melhores talentos para sua empresa.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título da Vaga <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Desenvolvedor Front-end React Sênior"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Grid para Selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Modelo de Trabalho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Modelo de Trabalho <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="locationType"
                    value={formData.locationType}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 appearance-none"
                  >
                    <option value="REMOTE">Remoto</option>
                    <option value="HYBRID">Híbrido</option>
                    <option value="ONSITE">Presencial</option>
                  </select>
                  <IconMapPin className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              {/* Localização (Cidade) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cidade/Estado {formData.locationType === 'REMOTE' && '(Opcional)'}
                </label>
                <input
                  type="text"
                  name="locationCity"
                  value={formData.locationCity}
                  onChange={handleChange}
                  placeholder="Ex: São Paulo, SP"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              {/* Tipo de Contrato - CORRIGIDO PARA ENUM DO BACKEND */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Contrato <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 appearance-none"
                  >
                    <option value="CLT">CLT (Tempo Integral)</option>
                    <option value="PJ">PJ (Pessoa Jurídica)</option>
                    <option value="FREELANCE">Freelance</option>
                    <option value="INTERNSHIP">Estágio</option>
                    <option value="OTHER">Outro</option>
                  </select>
                  <IconBriefcase className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              {/* Senioridade - CORRIGIDO PARA ENUM DO BACKEND */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nível de Senioridade <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="seniority"
                    value={formData.seniority}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 appearance-none"
                  >
                    <option value="JUNIOR">Júnior</option>
                    <option value="PLENO">Pleno</option>
                    <option value="SENIOR">Sênior</option>
                    <option value="LEAD">Tech Lead / Liderança</option>
                    <option value="ANY">Qualquer / Estagiário</option>
                  </select>
                  <IconBriefcase className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Salário */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Faixa Salarial (Mensal) <span className="text-xs font-normal text-gray-500 ml-1">(Opcional)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                  <input
                    type="number"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleChange}
                    placeholder="Mínimo"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                  <input
                    type="number"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleChange}
                    placeholder="Máximo"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição da Vaga <span className="text-red-500">*</span>
              </label>
              <div className="text-xs text-gray-500 mb-2">
                Inclua responsabilidades, requisitos, benefícios e informações sobre a empresa.
              </div>
              <textarea
                name="description"
                required
                rows={12}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Descreva a vaga detalhadamente aqui..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Publicando...
                  </>
                ) : (
                  <>
                    <IconSave className="w-4 h-4" /> Publicar Vaga
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}