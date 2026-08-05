import { Route, Routes } from 'react-router-dom';
import { DataProvider } from './context/DataContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <ToastProvider>
      <DataProvider>
        <Routes>
          <Route path="*" element={<Admin />} />
        </Routes>
      </DataProvider>
    </ToastProvider>
  );
}
