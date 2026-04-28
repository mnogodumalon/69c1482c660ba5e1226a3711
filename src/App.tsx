import '@/lib/sentry';
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ActionsProvider } from '@/context/ActionsContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorBusProvider } from '@/components/ErrorBus';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import EinkaufseintraegePage from '@/pages/EinkaufseintraegePage';
import ProduktePage from '@/pages/ProduktePage';
import EinkaufslistenPage from '@/pages/EinkaufslistenPage';
import PublicFormEinkaufseintraege from '@/pages/public/PublicForm_Einkaufseintraege';
import PublicFormProdukte from '@/pages/public/PublicForm_Produkte';
import PublicFormEinkaufslisten from '@/pages/public/PublicForm_Einkaufslisten';
// <public:imports>
// </public:imports>
// <custom:imports>
// </custom:imports>

export default function App() {
  return (
    <ErrorBoundary>
      <ErrorBusProvider>
        <HashRouter>
          <ActionsProvider>
            <Routes>
              <Route path="public/69c14815fa58aab0bb1f483b" element={<PublicFormEinkaufseintraege />} />
              <Route path="public/69c1480f8b2d1f1284e79d0a" element={<PublicFormProdukte />} />
              <Route path="public/69c148142a23cb12a67799b4" element={<PublicFormEinkaufslisten />} />
              {/* <public:routes> */}
              {/* </public:routes> */}
              <Route element={<Layout />}>
                <Route index element={<DashboardOverview />} />
                <Route path="einkaufseintraege" element={<EinkaufseintraegePage />} />
                <Route path="produkte" element={<ProduktePage />} />
                <Route path="einkaufslisten" element={<EinkaufslistenPage />} />
                <Route path="admin" element={<AdminPage />} />
                {/* <custom:routes> */}
              {/* </custom:routes> */}
              </Route>
            </Routes>
          </ActionsProvider>
        </HashRouter>
      </ErrorBusProvider>
    </ErrorBoundary>
  );
}
