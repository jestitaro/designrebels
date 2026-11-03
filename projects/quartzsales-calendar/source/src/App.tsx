import { createHashRouter, Navigate, RouterProvider } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { Bootstrap } from './components/layout/Bootstrap';
import { ToastProvider } from './components/ui/Toast';
import { CalendarPage } from './features/calendar/CalendarPage';

const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/calendario" replace /> },
      { path: 'calendario', element: <CalendarPage /> },
      { path: '*', element: <Navigate to="/calendario" replace /> },
    ],
  },
]);

export function App() {
  return (
    <ToastProvider>
      <Bootstrap>
        <RouterProvider router={router} />
      </Bootstrap>
    </ToastProvider>
  );
}
