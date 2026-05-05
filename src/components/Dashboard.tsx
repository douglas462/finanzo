import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Target, 
  MessageSquare, 
  Plus, 
  Trash2, 
  TrendingUp, 
  PieChart as PieChartIcon,
  X,
  Menu,
  Sparkles,
  Search,
  MoreVertical,
  ChevronRight,
  Filter,
  Settings,
  FileBarChart,
  LogOut,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { useFinance } from '../hooks/useFinance';
import { CATEGORIES } from '../constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getFinancialInsights, askFinanceQuestion } from '../services/aiService';
import Markdown from 'react-markdown';

export default function Dashboard() {
  const { 
    isAuthenticated, 
    login, 
    logout, 
    transactions, 
    categories, 
    accounts, 
    goals, 
    addTransaction, 
    completeTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory
  } = useFinance();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<'completed' | 'pending'>('completed');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Report states
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [reportDate, setReportDate] = useState(new Date().toISOString());
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('finanzo_theme') === 'dark';
  });

  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('finanzo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('finanzo_theme', 'light');
    }
  }, [darkMode]);

  const notifications = transactions.filter(t => 
    t.status === 'pending' && 
    t.dueDate && 
    format(new Date(t.dueDate), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
        <Sparkles className="absolute top-10 right-10 text-indigo-400/20" size={300} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-10 shadow-2xl w-full max-w-md relative z-10"
        >
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <TrendingUp size={44} />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900">Finanzo</h1>
              <p className="text-gray-500 font-medium">Controle Financeiro Inteligente</p>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (login(password)) {
              setLoginError(false);
            } else {
              setLoginError(true);
            }
          }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Senha de Acesso</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha (padrão: 1234)"
                className={`w-full bg-gray-50 border-2 ${loginError ? 'border-rose-500' : 'border-transparent'} rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-center text-2xl tracking-tighter`}
              />
              {loginError && <p className="text-rose-500 text-xs font-bold text-center">Senha incorreta. Tente "1234".</p>}
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:translate-y-0">
              Entrar na Conta
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Protegido por criptografia inteligente.
          </p>
        </motion.div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const incomeThisMonth = transactions
    .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((acc, t) => acc + t.amount, 0);
  const expenseThisMonth = transactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((acc, t) => acc + t.amount, 0);

  const categoryData = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#F97316'];

  const recentTransactions = transactions.slice(0, 5);

  const handleGetInsights = async () => {
    setIsAiLoading(true);
    const insights = await getFinancialInsights(transactions);
    setAiResponse(insights);
    setIsAiLoading(false);
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setIsAiLoading(true);
    const response = await askFinanceQuestion(question, transactions);
    setAiResponse(response);
    setIsAiLoading(false);
    setQuestion('');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} flex flex-col md:flex-row transition-colors duration-300`}>
      {/* Sidebar */}
      <aside className={`w-full md:w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r p-6 flex flex-col gap-8 transition-colors duration-300`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <TrendingUp size={24} />
          </div>
          <h1 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Finanzo</h1>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'Geral' },
            { id: 'transactions', icon: Wallet, label: 'Transações' },
            { id: 'reports', icon: FileBarChart, label: 'Relatórios' },
            { id: 'goals', icon: Target, label: 'Metas' },
            { id: 'ai', icon: MessageSquare, label: 'Assistente AI' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? darkMode ? 'bg-indigo-900/50 text-indigo-400 font-medium' : 'bg-indigo-50 text-indigo-700 font-medium'
                : darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all mt-4"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <div className="bg-indigo-600 rounded-2xl p-4 text-white relative overflow-hidden shadow-xl shadow-indigo-100">
             <div className="relative z-10">
               <p className="text-xs text-indigo-100 font-medium uppercase tracking-wider mb-1">Dica do dia</p>
               <p className="text-sm font-medium leading-snug">Economize 10% hoje evitando gastos supérfluos.</p>
             </div>
             <Sparkles className="absolute -right-2 -bottom-2 text-indigo-400 opacity-30" size={64} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex-1">
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} leading-tight`}>Olá, Douglas!</h2>
            <p className="text-gray-500 font-medium">Veja como estão suas finanças hoje.</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-gray-800 text-amber-400 hover:bg-gray-700' : 'bg-white text-indigo-600 border border-gray-200 hover:bg-gray-50 shadow-sm'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            <div className="relative group">
              <button 
                className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-gray-800 text-indigo-400 hover:bg-gray-700' : 'bg-white text-indigo-600 border border-gray-200 hover:bg-gray-50 shadow-sm'}`}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* Notification Tooltip */}
              {notifications.length > 0 && (
                <div className={`absolute right-0 mt-2 w-64 p-4 rounded-2xl shadow-xl transition-all opacity-0 group-hover:opacity-100 pointer-events-none translate-y-2 group-hover:translate-y-0 z-50 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                   <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Vencimentos Hoje</p>
                   <div className="space-y-3">
                      {notifications.map(n => (
                        <div key={n.id} className="flex flex-col gap-1">
                           <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{n.description}</p>
                           <p className="text-xs text-rose-500 font-bold">R$ {n.amount.toLocaleString('pt-BR')}</p>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus size={20} />
              <span>Nova Transação</span>
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-3xl shadow-sm border transition-colors`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Wallet size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saldo Total</span>
                </div>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-gray-900'}`}>R$ {totalBalance.toLocaleString('pt-BR')}</h3>
                <p className="text-sm text-gray-500 mt-1">Soma de todas as contas</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-3xl shadow-sm border transition-colors`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <ArrowUpRight size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receitas (Mês)</span>
                </div>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>R$ {incomeThisMonth.toLocaleString('pt-BR')}</h3>
                <p className="text-sm text-gray-500 mt-1">Entradas em Maio/2026</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-6 rounded-3xl shadow-sm border transition-colors`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <ArrowDownLeft size={24} />
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Despesas (Mês)</span>
                </div>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>R$ {expenseThisMonth.toLocaleString('pt-BR')}</h3>
                <p className="text-sm text-gray-500 mt-1">Saídas em Maio/2026</p>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-3xl shadow-sm border transition-colors h-[400px]`}
              >
                <div className="flex items-center justify-between mb-8">
                  <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} border-l-4 border-indigo-500 pl-3`}>Gastos por Categoria</h4>
                  <Filter size={18} className="text-gray-400 cursor-pointer" />
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: darkMode ? '#FFFFFF' : '#000000' }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Gasto']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} p-8 rounded-3xl shadow-sm border transition-colors h-[400px]`}
              >
                <div className="flex items-center justify-between mb-8">
                  <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'} border-l-4 border-indigo-500 pl-3`}>Fluxo de Caixa</h4>
                  <div className="flex gap-2">
                     <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><div className="w-2 h-2 rounded-full bg-emerald-600"></div> Receitas</span>
                     <span className="flex items-center gap-1 text-xs font-medium text-rose-600"><div className="w-2 h-2 rounded-full bg-rose-600"></div> Despesas</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={[
                    { name: 'Receitas', value: incomeThisMonth, color: '#10B981' },
                    { name: 'Despesas', value: expenseThisMonth, color: '#EF4444' },
                    { name: 'Saldo', value: totalBalance, color: '#3B82F6' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#F3F4F6'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: darkMode ? '#374151' : '#F9FAFB'}}
                      contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: darkMode ? '#FFFFFF' : '#000000' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <Cell fill="#10B981" />
                      <Cell fill="#EF4444" />
                      <Cell fill="#3B82F6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Recent Transactions & AI Snapshot */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className={`p-8 border-b transition-colors flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                    <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transações Recentes</h4>
                    <button onClick={() => setActiveTab('transactions')} className="text-indigo-600 text-sm font-semibold hover:underline">Ver todas</button>
                  </div>
                  <div className={`divide-y transition-colors ${darkMode ? 'divide-gray-700' : 'divide-gray-50'}`}>
                    {recentTransactions.map((t) => (
                      <div key={t.id} className={`p-4 px-8 transition-colors flex items-center justify-between group ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'income' ? darkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600' : darkMode ? 'bg-rose-900/30 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
                             {t.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                          </div>
                          <div>
                            <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.description}</p>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{t.category} • {format(new Date(t.date), 'dd MMM yyyy', { locale: ptBR })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-bold text-lg ${t.type === 'income' ? darkMode ? 'text-emerald-400' : 'text-emerald-600' : darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                            {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                          </span>
                          <button onClick={() => deleteTransaction(t.id)} className="p-2 text-gray-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {recentTransactions.length === 0 && (
                      <div className="p-12 text-center text-gray-500">
                        Nenhuma transação encontrada.
                      </div>
                    )}
                  </div>
               </div>

               <div className="bg-indigo-900 rounded-3xl shadow-xl p-8 text-white flex flex-col gap-6 relative overflow-hidden">
                  <Sparkles className="absolute -top-4 -right-4 text-indigo-400/20" size={120} />
                  <div className="relative z-10 flex flex-col gap-6 h-full">
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-indigo-500 rounded-lg">
                         <MessageSquare size={18} />
                       </div>
                       <h4 className="font-bold tracking-tight">Finanzo AI Assistant</h4>
                    </div>
                    <p className="text-indigo-100 text-sm leading-relaxed">
                       Sua inteligência financeira personalizada. Peça conselhos, analise gastos ou planeje seu futuro.
                    </p>
                    
                    {aiResponse ? (
                      <div className="bg-indigo-800/50 p-4 rounded-2xl border border-indigo-700 max-h-[150px] overflow-y-auto custom-scrollbar">
                         <div className="markdown-body text-xs prose-invert leading-relaxed">
                            <Markdown>{aiResponse}</Markdown>
                         </div>
                      </div>
                    ) : (
                      <div className="mt-auto space-y-3">
                         <button 
                           onClick={handleGetInsights}
                           disabled={isAiLoading}
                           className="w-full bg-white text-indigo-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                         >
                           {isAiLoading ? <TrendingUp className="animate-spin" size={18} /> : <Sparkles size={18} />}
                           Gerar Insights Agora
                         </button>
                      </div>
                    )}

                    {!aiResponse && (
                      <div className="flex items-center gap-1 text-[10px] text-indigo-300">
                        <TrendingUp size={10} /> Baseado nos seus últimos 30 dias de movimentação.
                      </div>
                    )}

                    {aiResponse && (
                       <button 
                         onClick={() => { setAiResponse(null); setActiveTab('ai'); }}
                         className="text-xs text-indigo-300 hover:text-white font-medium self-end mt-auto"
                       >
                         Abrir conversa completa →
                       </button>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* AI Assistant Full View */}
        {activeTab === 'ai' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8"
          >
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                      <Sparkles size={32} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold text-gray-900">Como posso ajudar hoje?</h3>
                      <p className="text-gray-500">Analiso seus dados reais para fornecer as melhores recomendações.</p>
                   </div>
                </div>

                <form onSubmit={handleAskQuestion} className="relative mb-8">
                   <input 
                     type="text" 
                     value={question}
                     onChange={(e) => setQuestion(e.target.value)}
                     placeholder="Ex: Onde gastei mais este mês? Como posso economizar para viajar?"
                     className="w-full bg-gray-50 border-none rounded-2xl p-6 pr-16 focus:ring-2 focus:ring-indigo-500 shadow-inner text-gray-900 placeholder:text-gray-400 transition-all"
                   />
                   <button 
                     type="submit"
                     disabled={isAiLoading || !question.trim()}
                     className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                   >
                     <ArrowUpRight size={24} />
                   </button>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                   <button 
                     disabled={isAiLoading}
                     onClick={() => handleAskQuestion({ preventDefault: () => {} } as any).then(() => setQuestion('Resumo de gastos por categoria'))}
                     className="p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl text-left transition-all group"
                   >
                      <p className="text-sm font-bold text-gray-700 group-hover:text-indigo-700">Resumo de gastos</p>
                      <p className="text-xs text-gray-500">Veja um panorama das maiores categorias.</p>
                   </button>
                   <button 
                     disabled={isAiLoading}
                     onClick={handleGetInsights}
                     className="p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl text-left transition-all group"
                   >
                      <p className="text-sm font-bold text-gray-700 group-hover:text-indigo-700">Sugestões de economia</p>
                      <p className="text-xs text-gray-500">Estratégias inteligentes para seu dinheiro.</p>
                   </button>
                </div>

                {isAiLoading && (
                   <div className="flex flex-col items-center justify-center p-12 gap-4">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="text-indigo-600"
                      >
                         <Sparkles size={48} />
                      </motion.div>
                      <p className="text-gray-500 font-medium animate-pulse">Consultando oráculo financeiro...</p>
                   </div>
                )}

                {aiResponse && !isAiLoading && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-indigo-50/50 p-8 rounded-3xl border border-indigo-100"
                  >
                     <div className="markdown-body prose max-w-none">
                        <Markdown>{aiResponse}</Markdown>
                     </div>
                  </motion.div>
                )}
             </div>
          </motion.div>
        )}

        {/* Transactions view */}
        {activeTab === 'transactions' && (
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
           >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Histórico de Transações</h3>
                  <p className="text-gray-500">Listagem detalhada de todas as suas entradas e saídas.</p>
                </div>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar..."
                      className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <button className="p-2 bg-gray-50 rounded-xl text-gray-500 hover:bg-gray-100">
                    <Filter size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                 {transactions.length > 0 ? transactions.map(t => (
                   <div key={t.id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-gray-50 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group">
                      <div className="flex items-center gap-5">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {t.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 group-hover:text-indigo-900 transition-colors">{t.description}</p>
                              {t.status === 'pending' && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-tighter">Pendente</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                              {t.category} • {format(new Date(t.date), 'dd/MM/yyyy')}
                              {t.dueDate && t.status === 'pending' && ` • Vence em: ${format(new Date(t.dueDate), 'dd/MM/yyyy')}`}
                            </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <span className={`font-bold text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                         </span>
                         <div className="flex items-center gap-2">
                           {t.status === 'pending' && (
                             <button 
                               onClick={() => completeTransaction(t.id)}
                               className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                               title="Marcar como Concluído"
                             >
                               <CheckCircle2 size={20} />
                             </button>
                           )}
                           <button onClick={() => deleteTransaction(t.id)} className="p-2 text-gray-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 size={20} />
                           </button>
                         </div>
                      </div>
                   </div>
                 )) : (
                   <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 font-medium">Nenhuma transação encontrada.</p>
                   </div>
                 )}
              </div>
           </motion.div>
        )}

        {/* Reports View */}
        {activeTab === 'reports' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h3>
                    <p className="text-gray-500">Analise seu desempenho por período.</p>
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-2xl">
                    <button 
                      onClick={() => setReportType('monthly')}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${reportType === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Mensal
                    </button>
                    <button 
                      onClick={() => setReportType('yearly')}
                      className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${reportType === 'yearly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Anual
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  {/* Report summaries would go here */}
                  <div className={`p-6 rounded-3xl border transition-colors ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
                     <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-400'}`}>Saldo Atual</p>
                     <p className={`text-xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>R$ {totalBalance.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className={`p-6 rounded-3xl border transition-colors ${darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-100'}`}>
                     <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-400'}`}>Total Receitas</p>
                     <p className={`text-xl font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>R$ {incomeThisMonth.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className={`p-6 rounded-3xl border transition-colors ${darkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-100'}`}>
                     <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-rose-400' : 'text-rose-400'}`}>Total Despesas</p>
                     <p className={`text-xl font-bold ${darkMode ? 'text-rose-300' : 'text-rose-900'}`}>R$ {expenseThisMonth.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className={`p-6 rounded-3xl border transition-colors ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-100'}`}>
                     <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-amber-400' : 'text-amber-400'}`}>Pendente</p>
                     <p className={`text-xl font-bold ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>
                       R$ {transactions.filter(t => t.status === 'pending').reduce((acc, t) => acc + t.amount, 0).toLocaleString('pt-BR')}
                     </p>
                  </div>
               </div>

               <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={transactions.slice().reverse().map((t, idx) => ({ name: idx, value: t.amount, type: t.type }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#F3F4F6'} />
                      <XAxis dataKey="name" hide />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderRadius: '12px', border: 'none', color: darkMode ? '#FFFFFF' : '#000000' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </motion.div>
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
               <h3 className="text-2xl font-bold text-gray-900 mb-8">Gerenciar Categorias</h3>
               
               <form onSubmit={(e) => {
                 e.preventDefault();
                 const formData = new FormData(e.currentTarget);
                 addCategory({
                   id: Math.random().toString(36).substr(2, 9),
                   name: formData.get('name') as string,
                   icon: 'Plus',
                   color: '#6366F1',
                   type: 'both'
                 });
                 e.currentTarget.reset();
               }} className="flex gap-4 mb-10">
                  <input 
                    name="name" 
                    required 
                    placeholder="Nova categoria..."
                    className="flex-1 bg-gray-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    Adicionar
                  </button>
               </form>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                       <span className="font-bold text-gray-700">{cat.name}</span>
                       <button 
                         onClick={() => deleteCategory(cat.id)}
                         className="p-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                       >
                         <X size={16} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}

        {/* Goals view */}
        {activeTab === 'goals' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
               <div>
                  <h3 className="text-2xl font-bold text-gray-900">Suas Metas Financeiras</h3>
                  <p className="text-gray-500">Acompanhe seu progresso e conquiste seus objetivos.</p>
               </div>
               <button 
                 onClick={() => {
                   // For simplicity in this demo, adding a fixed goal
                   addGoal({
                     name: 'Reserva de Emergência',
                     targetAmount: 20000,
                     currentAmount: totalBalance * 0.4,
                     deadline: '2026-12-31'
                   });
                 }}
                 className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
               >
                 <Plus size={18} /> Nova Meta
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {goals.length > 0 ? goals.map(goal => {
                 const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                 return (
                   <div key={goal.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                          <Target size={24} />
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Meta</p>
                           <p className="text-xl font-bold text-gray-900">R$ {goal.targetAmount.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{goal.name}</h4>
                      <div className="space-y-4">
                         <div className="flex justify-between text-sm font-medium">
                            <span className="text-gray-500">Progresso</span>
                            <span className="text-indigo-600">{progress.toFixed(0)}%</span>
                         </div>
                         <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="bg-indigo-600 h-full rounded-full" 
                            />
                         </div>
                         <div className="flex justify-between items-end pt-2">
                            <div>
                               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Atual</p>
                               <p className="text-lg font-bold text-emerald-600">R$ {goal.currentAmount.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Faltam</p>
                               <p className="font-bold text-gray-900">R$ {(goal.targetAmount - goal.currentAmount).toLocaleString('pt-BR')}</p>
                            </div>
                         </div>
                      </div>
                      {goal.deadline && (
                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-500 font-medium">
                           <TrendingUp size={14} className="text-indigo-400" /> Previsão de conclusão: {format(new Date(goal.deadline), 'dd MMM yyyy', { locale: ptBR })}
                        </div>
                      )}
                   </div>
                 );
               }) : (
                 <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                    <p className="text-gray-500 font-medium">Você ainda não definiu nenhuma meta.</p>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsAddModalOpen(false)}
               className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className={`relative w-full max-w-lg rounded-3xl shadow-2xl p-8 overflow-hidden transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
             >
                <div className="flex justify-between items-center mb-6">
                   <h3 className={`text-2xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Nova Transação</h3>
                   <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <X size={24} />
                   </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addTransaction({
                    amount: Number(formData.get('amount')),
                    type: formData.get('type') as 'income' | 'expense',
                    category: formData.get('category') as string,
                    date: new Date().toISOString(),
                    description: formData.get('description') as string,
                    accountId: '1',
                    status: modalStatus,
                    dueDate: formData.get('dueDate') as string || undefined
                  });
                  setIsAddModalOpen(false);
                  setModalStatus('completed');
                }} className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <label className={`flex items-center gap-3 p-4 border-2 border-transparent rounded-2xl cursor-pointer has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 transition-all ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <input type="radio" name="type" value="expense" defaultChecked className="hidden" />
                        <ArrowDownLeft size={20} className="text-rose-600" />
                        <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Despesa</span>
                      </label>
                      <label className={`flex items-center gap-3 p-4 border-2 border-transparent rounded-2xl cursor-pointer has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 transition-all ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <input type="radio" name="type" value="income" className="hidden" />
                        <ArrowUpRight size={20} className="text-emerald-600" />
                        <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Receita</span>
                      </label>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setModalStatus('completed')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${modalStatus === 'completed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-400'}`}
                      >
                        <CheckCircle2 size={18} />
                        Efetuado
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModalStatus('pending')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${modalStatus === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-400'}`}
                      >
                        <Clock size={18} />
                        Pendente
                      </button>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Descrição</label>
                      <input 
                        name="description" 
                        required 
                        placeholder="Ex: Mercado, Aluguel..."
                        className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-700 text-white placeholder:text-gray-500' : 'bg-gray-50 text-gray-900 placeholder:text-gray-400'}`} 
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Valor (R$)</label>
                         <input 
                           name="amount" 
                           type="number" 
                           step="0.01" 
                           required 
                           className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'}`} 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Categoria</label>
                         <select name="category" className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all appearance-none ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'}`}>
                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                         </select>
                      </div>
                   </div>

                   {modalStatus === 'pending' && (
                     <motion.div 
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       className="space-y-2"
                     >
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Data de Vencimento</label>
                        <input 
                          name="dueDate" 
                          type="date" 
                          required 
                          className={`w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'}`} 
                        />
                     </motion.div>
                   )}

                   <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:translate-y-0">
                      Adicionar Transação
                   </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
