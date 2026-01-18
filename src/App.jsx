import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Alimenti } from './pages/Alimenti';
import { Ricette } from './pages/Ricette';
import { Utenti } from './pages/Utenti';
import { Piani } from './pages/Piani';

function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="alimenti" element={<Alimenti />} />
            <Route path="ricette" element={<Ricette />} />
            <Route path="utenti" element={<Utenti />} />
            <Route path="piani" element={<Piani />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

export default App;
