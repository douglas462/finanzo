import { Transaction, Account, Category, Goal } from './types';

export const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', name: 'Conta Corrente', balance: 2500, type: 'checking', color: '#3B82F6' },
  { id: '2', name: 'Poupança', balance: 12000, type: 'savings', color: '#10B981' },
  { id: '3', name: 'Cartão de Crédito', balance: -850, type: 'credit', color: '#EF4444' },
];

export const CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Alimentação', icon: 'Utensils', color: '#F59E0B', type: 'expense' },
  { id: 'cat2', name: 'Transporte', icon: 'Car', color: '#3B82F6', type: 'expense' },
  { id: 'cat3', name: 'Lazer', icon: 'Gamepad2', color: '#8B5CF6', type: 'expense' },
  { id: 'cat4', name: 'Salário', icon: 'Wallet', color: '#10B981', type: 'income' },
  { id: 'cat5', name: 'Saúde', icon: 'HeartPulse', color: '#EC4899', type: 'expense' },
  { id: 'cat6', name: 'Educação', icon: 'GraduationCap', color: '#6366F1', type: 'expense' },
  { id: 'cat7', name: 'Moradia', icon: 'Home', color: '#F97316', type: 'expense' },
  { id: 'cat8', name: 'Outros', icon: 'MoreHorizontal', color: '#6B7280', type: 'both' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    amount: 5000,
    type: 'income',
    category: 'Salário',
    date: new Date().toISOString(),
    description: 'Salário Mensal',
    accountId: '1'
  },
  {
    id: 't2',
    amount: 150,
    type: 'expense',
    category: 'Alimentação',
    date: new Date(Date.now() - 86400000).toISOString(),
    description: 'Supermercado',
    accountId: '1'
  },
  {
    id: 't3',
    amount: 50,
    type: 'expense',
    category: 'Transporte',
    date: new Date(Date.now() - 172800000).toISOString(),
    description: 'Combustível',
    accountId: '1'
  }
];
