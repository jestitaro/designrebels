import { createHashRouter, Navigate, Outlet, RouterProvider } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { Bootstrap } from './components/layout/Bootstrap';
import { ToastProvider } from './components/ui/Toast';
import { UpdatePrompt } from './components/layout/UpdatePrompt';
import { CalendarPage } from './features/calendar/CalendarPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { EventEditorProvider } from './features/events/EventEditor';
import { LibraryPage } from './features/library/LibraryPage';
import { EventPage } from './pages/EventPage';
import { GreetingEditorPage } from './features/greetings/GreetingEditorPage';
import { GreetingsPage } from './features/greetings/GreetingsPage';
import { UpcomingPage } from './features/upcoming/UpcomingPage';
import { SettingsPage } from './features/settings/SettingsPage';

function Root() {
  return (
    <EventEditorProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </EventEditorProvider>
  );
}

const router = createHashRouter([
  {
    element: <Root />,
    children: [
      { index: true, element: <Navigate to="/inicio" replace /> },
      { path: 'inicio', element: <DashboardPage /> },
      { path: 'calendario', element: <CalendarPage /> },
      { path: 'proximos', element: <UpcomingPage /> },
      { path: 'saludos', element: <GreetingsPage /> },
      { path: 'saludos/:id', element: <GreetingEditorPage /> },
      { path: 'biblioteca', element: <LibraryPage /> },
      { path: 'eventos/:id', element: <EventPage /> },
      { path: 'configuracion', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/inicio" replace /> },
    ],
  },
]);

export function App() {
  return (
    <ToastProvider>
      <UpdatePrompt />
      <Bootstrap>
        <RouterProvider router={router} />
      </Bootstrap>
    </ToastProvider>
  );
}
