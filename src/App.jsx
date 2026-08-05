import { Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Admin from './pages/Admin.jsx';
import Distributor from './pages/Distributor.jsx';

export default function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Admin />} />
          <Route path="/distributor" element={<Distributor />} />
        </Routes>
      </DataProvider>
    </ToastProvider>
  );
}
