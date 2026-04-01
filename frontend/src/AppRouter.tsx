import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { routes, type RouteConfig } from '@/routes/routes';

function renderRoutes(routes: RouteConfig[]) {
  return routes.map(({ path, element, children }) => (
    <Route key={path} path={path} element={element}>
      {children && renderRoutes(children)}
    </Route>
  ));
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          {renderRoutes(routes)}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
