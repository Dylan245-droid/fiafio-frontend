import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './layouts/ProtectedLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PayPage from './pages/PayPage';
import Dashboard from './pages/Dashboard';
import TransferPage from './pages/TransferPage';
import AdminConsole from './pages/AdminConsole';
import CashInPage from './pages/CashInPage';
import WithdrawPage from './pages/WithdrawPage';
import AgentDashboard from './pages/AgentDashboard';
import AgentDashboardPage from './pages/AgentDashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import DepositPage from './pages/DepositPage';
import FloatRequestPage from './pages/FloatRequestPage';
import QRWithdrawPage from './pages/QRWithdrawPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pay/:sessionId" element={<PayPage />} />
          <Route path="/qr-withdraw" element={<QRWithdrawPage />} />
          
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/cashin" element={<CashInPage />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/agent" element={<AgentDashboardPage />} />
            <Route path="/agent-dashboard" element={<AgentDashboard />} />
            <Route path="/float-request" element={<FloatRequestPage />} />
            <Route path="/admin" element={<AdminConsole />} />
          </Route>

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
