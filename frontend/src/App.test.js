import { render } from '@testing-library/react';
import App from './App';

jest.mock(
  'react-router-dom',
  () => ({
    BrowserRouter: ({ children }) => <>{children}</>,
    Routes: ({ children }) => <>{children}</>,
    Route: ({ element }) => element ?? null,
    Outlet: () => null,
    Link: ({ children }) => <>{children}</>,
    NavLink: ({ children }) => <>{children}</>,
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
    useLocation: () => ({ pathname: '/' }),
  }),
  { virtual: true }
);

test('renders app without crashing', () => {
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
