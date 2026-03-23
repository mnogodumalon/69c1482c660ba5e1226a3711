import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import ProduktePage from '@/pages/ProduktePage';
import EinkaufslistenPage from '@/pages/EinkaufslistenPage';
import EinkaufseintraegePage from '@/pages/EinkaufseintraegePage';

export default function App() {
  return (
    <HashRouter>
      <ActionsProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="produkte" element={<ProduktePage />} />
            <Route path="einkaufslisten" element={<EinkaufslistenPage />} />
            <Route path="einkaufseintraege" element={<EinkaufseintraegePage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </ActionsProvider>
    </HashRouter>
  );
}
