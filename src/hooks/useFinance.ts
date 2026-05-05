import React, { useState, useEffect } from 'react';
import { Transaction, Account, Goal, Category } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_ACCOUNTS, CATEGORIES } from '../constants';

export function useFinance() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('finanzo_auth') === 'true';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finanzo_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS.map(t => ({ ...t, status: 'completed' }));
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('finanzo_categories');
    return saved ? JSON.parse(saved) : CATEGORIES;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('finanzo_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('finanzo_goals');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('finanzo_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finanzo_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('finanzo_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('finanzo_goals', JSON.stringify(goals));
  }, [goals]);

  const login = (password: string) => {
    if (password === '1234') { // Senha padrão para o demo
      setIsAuthenticated(true);
      localStorage.setItem('finanzo_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('finanzo_auth');
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Only update balance if completed
    if (t.status === 'completed') {
      updateAccountBalance(t.accountId, (t.type === 'income' ? t.amount : -t.amount));
    }
  };

  const updateAccountBalance = (accountId: string, amount: number) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    }));
  };

  const completeTransaction = (id: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id && t.status === 'pending') {
        updateAccountBalance(t.accountId, (t.type === 'income' ? t.amount : -t.amount));
        return { ...t, status: 'completed' };
      }
      return t;
    }));
  };

  const deleteTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    setTransactions(prev => prev.filter(t => t.id !== id));
    
    if (transaction.status === 'completed') {
      updateAccountBalance(transaction.accountId, -(transaction.type === 'income' ? transaction.amount : -transaction.amount));
    }
  };

  const addCategory = (c: Category) => {
    setCategories(prev => [...prev, c]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addGoal = (g: Omit<Goal, 'id'>) => {
    setGoals(prev => [...prev, { ...g, id: Math.random().toString(36).substr(2, 9) }]);
  };

  return {
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
    addGoal,
    addCategory,
    deleteCategory
  };
}
