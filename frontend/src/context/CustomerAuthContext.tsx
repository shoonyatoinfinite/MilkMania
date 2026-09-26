import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

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
  customerLogin: (phone: string, pin: string) => Promise<boolean>;
  customerLogout: () => void;
  refreshCustomerData: () => Promise<void>;
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

  const getAuthHeader = () => {
    const token = localStorage.getItem('milkmania_customer_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const refreshCustomerData = async () => {
    const token = localStorage.getItem('milkmania_customer_token');
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
      const headers = getAuthHeader();

      const [meRes, purchasesRes, paymentsRes] = await Promise.all([
        axios.get(`${API_BASE}/customer-portal/me`, { headers }),
        axios.get(`${API_BASE}/customer-portal/purchases`, { headers }),
        axios.get(`${API_BASE}/customer-portal/payments`, { headers }),
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
      setErrorMsg(err.response?.data?.message || 'Error loading dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCustomerData();
  }, []);

  const customerLogin = async (phone: string, pin: string): Promise<boolean> => {
    setErrorMsg(null);
    try {
      const res = await axios.post(`${API_BASE}/customer-portal/login`, { phone, pin });
      if (res.data.token) {
        localStorage.setItem('milkmania_customer_token', res.data.token);
        setCustomer(res.data.customer);
        await refreshCustomerData();
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
      const headers = getAuthHeader();
      const res = await axios.put(`${API_BASE}/customer-portal/change-pin`, { currentPin, newPin }, { headers });
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
