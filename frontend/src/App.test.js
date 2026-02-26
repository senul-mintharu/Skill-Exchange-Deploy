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
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
  }),
  { virtual: true }
);

test('renders app without crashing', () => {
  const { container } = render(<App />);
  expect(container).toBeTruthy();
});
