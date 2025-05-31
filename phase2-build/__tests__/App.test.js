import { render } from '@testing-library/react-native';
//import App from '../App';
import IndexScreen from '../app/(tabs)/index';
import { SessionProvider } from '../SessionContext';
import { ThemeProvider } from '../theme/ThemeContext';

test('renders correctly', () => {
  //const { getByText } = render(<App />);
  const { getByText } = render(
    <SessionProvider>
      <ThemeProvider>
        <IndexScreen />
      </ThemeProvider>
    </SessionProvider>
  );
  expect(getByText('Open up App.js to start working on your app!')).toBeTruthy();
});
