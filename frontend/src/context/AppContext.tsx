import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Add request interceptor to prevent caching of GET requests
axios.interceptors.request.use(
  (config) => {
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface AppContextType {
  user: any;
  token: string | null;
  language: 'en' | 'hi';
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  updateProfile: (name: string, password?: string) => Promise<boolean>;
  portalUsers: any[];
  createPortalUser: (data: any) => Promise<boolean>;
  deletePortalUser: (id: string) => Promise<boolean>;
  updatePortalUser: (id: string, data: any) => Promise<boolean>;
  forgotPassword: (username: string, lastPassword: string, masterPassword: string, newPassword: string) => Promise<boolean>;
  isInstallable: boolean;
  deferredPrompt: any;
  isStandalone: boolean;
  handleInstallPrompt: () => Promise<void>;
  
  // Data State
  customers: any[];
  sales: any[];
  payments: any[];
  expenses: any[];
  inventory: any[];
  settings: any;
  dashboardStats: any;
  milkBought: any[];
  enableMilkBought: boolean;
  
  // Operations
  refreshAllData: (startDate?: string, endDate?: string) => Promise<void>;
  createCustomer: (data: any) => Promise<boolean>;
  updateCustomer: (id: string, data: any) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  createSale: (data: any) => Promise<boolean>;
  updateSale: (id: string, data: any) => Promise<boolean>;
  deleteSale: (id: string) => Promise<boolean>;
  createPayment: (data: any) => Promise<boolean>;
  updatePayment: (id: string, data: any) => Promise<boolean>;
  deletePayment: (id: string) => Promise<boolean>;
  createExpense: (data: any) => Promise<boolean>;
  updateExpense: (id: string, data: any) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  createInventoryItem: (data: any) => Promise<boolean>;
  updateInventoryItem: (id: string, data: any) => Promise<boolean>;
  deleteInventoryItem: (id: string) => Promise<boolean>;
  createMilkBought: (data: any) => Promise<boolean>;
  updateMilkBought: (id: string, data: any) => Promise<boolean>;
  deleteMilkBought: (id: string) => Promise<boolean>;
  toggleMilkBoughtSetting: (enabled: boolean) => Promise<boolean>;
  updateSettingsList: (settingsArray: any[]) => Promise<boolean>;
  triggerBackup: () => void;
  triggerRestore: (backupJson: any) => Promise<boolean>;
  createAdjustment: (data: any) => Promise<boolean>;
  loading: boolean;
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('milkmania_token'));
  const [language, setLanguageState] = useState<'en' | 'hi'>('en');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Business Data State
  const [customers, setCustomers] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [milkBought, setMilkBought] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [portalUsers, setPortalUsers] = useState<any[]>([]);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // Set up Authorization header defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('milkmania_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('milkmania_token');
    }
  }, [token]);

  // Load profile on start if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await axios.get(`${API_BASE}/auth/me`);
          setUser(res.data);
          await refreshAllData();
        } catch (err) {
          console.error('Invalid startup token', err);
          logout();
        }
      }
      setLoading(false);
    };

    const savedLang = localStorage.getItem('milkmania_lang') as 'en' | 'hi';
    if (savedLang) {
      setLanguageState(savedLang);
    }

    initAuth();
  }, [token]);

  const setLanguage = (lang: 'en' | 'hi') => {
    setLanguageState(lang);
    localStorage.setItem('milkmania_lang', lang);
  };

  const login = async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    try {
      setErrorMsg(null);
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password, rememberMe });
      setToken(res.data.token);
      setUser(res.data.user);
      return true;
    } catch (err: any) {
      console.error('Login failed:', err);
      setErrorMsg(err.response?.data?.message || 'Login failed. Check your connections.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCustomers([]);
    setSales([]);
    setPayments([]);
    setExpenses([]);
    setInventory([]);
    setDashboardStats(null);
    setPortalUsers([]);
  };

  useEffect(() => {
    const isPwaInstalled = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (navigator as any).standalone === true ||
      localStorage.getItem('milkmania_pwa_installed') === 'true';

    setIsStandalone(!!isPwaInstalled);

    const handleAppInstalled = () => {
      console.log('PWA app was successfully installed!');
      localStorage.setItem('milkmania_pwa_installed', 'true');
      setIsStandalone(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    if (!isPwaInstalled) {
      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
        setIsInstallable(true);
      }

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
        (window as any).deferredPrompt = e;
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    } else {
      setIsInstallable(false);
      return () => {
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const handleInstallPrompt = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log(`User installation decision: ${choiceResult.outcome}`);
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem('milkmania_pwa_installed', 'true');
        setIsStandalone(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Error handling install prompt:', err);
    }
  };

  useEffect(() => {
    if (!token) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      const wsUrl = API_BASE.replace('/api', '').replace(/^http/, 'ws');
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'REFRESH_DATA') {
            console.log('Real-time data update received from server. Refreshing...');
            refreshAllData();
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting in 3 seconds...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        ws?.close();
      };
    };

    connect();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [token]);

  const deletePortalUser = async (id: string): Promise<boolean> => {
    try {
      setErrorMsg(null);
      await axios.delete(`${API_BASE}/auth/users/${id}`);
      await fetchPortalUsers();
      return true;
    } catch (err: any) {
      console.error('Error deleting portal user:', err);
      setErrorMsg(err.response?.data?.message || 'Error deleting user access.');
      return false;
    }
  };

  const updatePortalUser = async (id: string, data: any): Promise<boolean> => {
    try {
      setErrorMsg(null);
      await axios.put(`${API_BASE}/auth/users/${id}`, data);
      await fetchPortalUsers();
      return true;
    } catch (err: any) {
      console.error('Error updating portal user:', err);
      setErrorMsg(err.response?.data?.message || 'Error updating user credentials.');
      return false;
    }
  };

  const fetchPortalUsers = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/auth/users`);
      setPortalUsers(res.data);
    } catch (err) {
      console.error('Error fetching portal users', err);
    }
  };

  const createPortalUser = async (userObj: any): Promise<boolean> => {
    try {
      setErrorMsg(null);
      await axios.post(`${API_BASE}/auth/users`, userObj);
      await fetchPortalUsers();
      return true;
    } catch (err: any) {
      console.error('Error creating portal user:', err);
      setErrorMsg(err.response?.data?.message || 'Error creating user.');
      return false;
    }
  };

  const forgotPassword = async (username: string, lastPassword: string, masterPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setErrorMsg(null);
      await axios.post(`${API_BASE}/auth/forgot-password`, { username, lastPassword, masterPassword, newPassword });
      return true;
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setErrorMsg(err.response?.data?.message || 'Password reset failed. Check your connection.');
      return false;
    }
  };

  const updateProfile = async (name: string, password?: string): Promise<boolean> => {
    try {
      setErrorMsg(null);
      const res = await axios.put(`${API_BASE}/auth/profile`, { name, password });
      setUser(res.data.user);
      return true;
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Profile update failed.');
      return false;
    }
  };

  // Sync business data
  const refreshAllData = async (startDate?: string, endDate?: string) => {
    if (!token) return;
    try {
      const dashUrl = startDate && endDate
        ? `${API_BASE}/dashboard?startDate=${startDate}&endDate=${endDate}`
        : `${API_BASE}/dashboard`;

      const [
        custRes,
        salesRes,
        payRes,
        expRes,
        invRes,
        settingsRes,
        dashRes,
        boughtRes
      ] = await Promise.all([
        axios.get(`${API_BASE}/customers`),
        axios.get(`${API_BASE}/sales`),
        axios.get(`${API_BASE}/payments`),
        axios.get(`${API_BASE}/expenses`),
        axios.get(`${API_BASE}/inventory`),
        axios.get(`${API_BASE}/settings`),
        axios.get(dashUrl),
        axios.get(`${API_BASE}/milk-bought`).catch(() => ({ data: [] }))
      ]);

      setCustomers(custRes.data);
      setSales(salesRes.data);
      setPayments(payRes.data);
      setExpenses(expRes.data);
      setInventory(invRes.data);
      setDashboardStats(dashRes.data);
      setMilkBought(boughtRes.data || []);
      await fetchPortalUsers();

      const settingsMap = settingsRes.data.reduce((acc: any, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
      setSettings(settingsMap);
    } catch (err) {
      console.error('Error refreshing data from server:', err);
    }
  };

  // Centralized CRUD error handler to alert the user of API/validation failures
  const handleError = (err: any, defaultMsg: string) => {
    console.error(err);
    const msg = err.response?.data?.message || defaultMsg;
    alert(msg);
  };

  // Customers CRUD
  const createCustomer = async (data: any): Promise<boolean> => {
    try {
      await axios.post(`${API_BASE}/customers`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error creating customer registry.');
      return false;
    }
  };

  const updateCustomer = async (id: string, data: any): Promise<boolean> => {
    try {
      await axios.put(`${API_BASE}/customers/${id}`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error updating customer details.');
      return false;
    }
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE}/customers/${id}`);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error deleting customer from registry.');
      return false;
    }
  };

  // Sales CRUD
  const createSale = async (data: any): Promise<boolean> => {
    try {
      await axios.post(`${API_BASE}/sales`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error recording milk sale entry.');
      return false;
    }
  };

  const updateSale = async (id: string, data: any): Promise<boolean> => {
    try {
      await axios.put(`${API_BASE}/sales/${id}`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error updating milk sale entry.');
      return false;
    }
  };

  const deleteSale = async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE}/sales/${id}`);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error deleting milk sale entry.');
      return false;
    }
  };

  // Payments CRUD
  const createPayment = async (data: any): Promise<boolean> => {
    try {
      await axios.post(`${API_BASE}/payments`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error recording payment entry.');
      return false;
    }
  };

  const updatePayment = async (id: string, data: any): Promise<boolean> => {
    try {
      await axios.put(`${API_BASE}/payments/${id}`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error updating payment entry.');
      return false;
    }
  };

  const deletePayment = async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE}/payments/${id}`);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error deleting payment entry.');
      return false;
    }
  };

  // Expenses CRUD
  const createExpense = async (data: any): Promise<boolean> => {
    try {
      await axios.post(`${API_BASE}/expenses`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error logging expense entry.');
      return false;
    }
  };

  const updateExpense = async (id: string, data: any): Promise<boolean> => {
    try {
      await axios.put(`${API_BASE}/expenses/${id}`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE}/expenses/${id}`);
      await refreshAllData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Inventory CRUD
  const createInventoryItem = async (data: any): Promise<boolean> => {
    try {
      await axios.post(`${API_BASE}/inventory`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateInventoryItem = async (id: string, data: any): Promise<boolean> => {
    try {
      await axios.put(`${API_BASE}/inventory/${id}`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const deleteInventoryItem = async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE}/inventory/${id}`);
      await refreshAllData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Milk Bought CRUD
  const createMilkBought = async (data: any): Promise<boolean> => {
    try {
      await axios.post(`${API_BASE}/milk-bought`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error recording milk bought.');
      return false;
    }
  };

  const updateMilkBought = async (id: string, data: any): Promise<boolean> => {
    try {
      await axios.put(`${API_BASE}/milk-bought/${id}`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error updating milk bought record.');
      return false;
    }
  };

  const deleteMilkBought = async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_BASE}/milk-bought/${id}`);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error deleting milk bought record.');
      return false;
    }
  };

  const toggleMilkBoughtSetting = async (enabled: boolean): Promise<boolean> => {
    try {
      await updateSettingsList([
        {
          key: 'enable_milk_bought',
          value: enabled ? 'true' : 'false',
          description: 'Toggle to enable or hide Milk Bought feature'
        }
      ]);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const enableMilkBought = settings?.enable_milk_bought === 'true';

  // Settings update
  const updateSettingsList = async (settingsArray: any[]): Promise<boolean> => {
    try {
      await axios.post(`${API_BASE}/settings`, { settings: settingsArray });
      await refreshAllData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Backup downloader
  const triggerBackup = () => {
    const win = window.open(`${API_BASE}/settings/backup?token=${token}`, '_blank');
    if (win) win.focus();
  };

  // Restore database
  const triggerRestore = async (backupJson: any): Promise<boolean> => {
    try {
      await axios.post(`${API_BASE}/settings/restore`, { backupData: backupJson });
      await refreshAllData();
      return true;
    } catch (err) {
      console.error('Restore error:', err);
      return false;
    }
  };

  // Stock Session Adjustments
  const createAdjustment = async (data: any): Promise<boolean> => {
    try {
      await axios.post(`${API_BASE}/adjustments`, data);
      await refreshAllData();
      return true;
    } catch (err) {
      handleError(err, 'Error saving session adjustment.');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        language,
        login,
        logout,
        setLanguage,
        updateProfile,
        
        customers,
        sales,
        payments,
        expenses,
        inventory,
        settings,
        dashboardStats,
        milkBought,
        enableMilkBought,
        
        refreshAllData,
        createCustomer,
        updateCustomer,
        deleteCustomer,
        createSale,
        updateSale,
        deleteSale,
        createPayment,
        updatePayment,
        deletePayment,
        createExpense,
        updateExpense,
        deleteExpense,
        createInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        createMilkBought,
        updateMilkBought,
        deleteMilkBought,
        toggleMilkBoughtSetting,
        updateSettingsList,
        triggerBackup,
        triggerRestore,
        createAdjustment,
        portalUsers,
        createPortalUser,
        deletePortalUser,
        updatePortalUser,
        forgotPassword,
        isInstallable,
        deferredPrompt,
        isStandalone,
        handleInstallPrompt,
        loading,
        errorMsg,
        setErrorMsg
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
