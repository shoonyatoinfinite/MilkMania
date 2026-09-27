import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// Dedicated Axios instance for Customer Portal so it never conflicts with Admin session
export const customerApi = axios.create({
  baseURL: API_BASE
});

// Automatically inject customer token and cache buster
customerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('milkmania_customer_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
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

export interface CustomerStats {
  totalLiters: number;
  totalAmount: number;
  totalPaid: number;
  pendingBalance: number;
  thisMonthLiters: number;
  thisMonthAmount: number;
  thisMonthPaid: number;
  lastPurchaseDate: string | null;
  lastPaymentDate: string | null;
}

export interface CustomerPurchase {
  id: string;
  date: string;
  shift: string;
  quantity: number;
  rate: number;
  amount: number;
  paymentMethod: string;
  remarks?: string;
}

export interface CustomerPayment {
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  remarks?: string;
}

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  village: string;
  address?: string;
  pricePerLiter: number;
  customerType: string;
  status: string;
}

interface CustomerAuthContextType {
  customer: CustomerData | null;
  stats: CustomerStats | null;
  purchases: CustomerPurchase[];
  payments: CustomerPayment[];
  loading: boolean;
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
  customerLogin: (phoneOrName: string, pin: string) => Promise<boolean>;
  customerLogout: () => void;
  refreshCustomerData: (explicitToken?: string) => Promise<void>;
  changePin: (currentPin: string, newPin: string) => Promise<{ success: boolean; message: string }>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [purchases, setPurchases] = useState<CustomerPurchase[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshCustomerData = async (explicitToken?: string) => {
    const token = explicitToken || localStorage.getItem('milkmania_customer_token');
    if (!token) {
      setCustomer(null);
      setStats(null);
      setPurchases([]);
      setPayments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [meRes, purchasesRes, paymentsRes] = await Promise.all([
        customerApi.get('/customer-portal/me', { headers }),
        customerApi.get('/customer-portal/purchases', { headers }),
        customerApi.get('/customer-portal/payments', { headers }),
      ]);

      setCustomer(meRes.data.customer);
      setStats(meRes.data.stats);
      setPurchases(purchasesRes.data);
      setPayments(paymentsRes.data);
      setErrorMsg(null);
    } catch (err: any) {
      console.error('Error fetching customer data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('milkmania_customer_token');
        setCustomer(null);
      }
      setErrorMsg(err.response?.data?.message || 'Error loading customer dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCustomerData();
  }, []);

  const customerLogin = async (phoneOrName: string, pin: string): Promise<boolean> => {
    setErrorMsg(null);
    try {
      const res = await axios.post(`${API_BASE}/customer-portal/login`, {
        phone: phoneOrName,
        pin: pin.trim()
      });

      if (res.data.token) {
        localStorage.setItem('milkmania_customer_token', res.data.token);
        setCustomer(res.data.customer);
        await refreshCustomerData(res.data.token);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Customer login failed:', err);
      const msg = err.response?.data?.message || 'Login failed. Please check mobile number and 6-digit PIN.';
      setErrorMsg(msg);
      return false;
    }
  };

  const customerLogout = () => {
    localStorage.removeItem('milkmania_customer_token');
    setCustomer(null);
    setStats(null);
    setPurchases([]);
    setPayments([]);
  };

  const changePin = async (currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await customerApi.put('/customer-portal/change-pin', { currentPin, newPin });
      return { success: true, message: res.data.message || 'PIN updated successfully!' };
    } catch (err: any) {
      console.error('Error changing customer PIN:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update PIN.'
      };
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        stats,
        purchases,
        payments,
        loading,
        errorMsg,
        setErrorMsg,
        customerLogin,
        customerLogout,
        refreshCustomerData,
        changePin
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};
