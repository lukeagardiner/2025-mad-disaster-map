import { render } from '@testing-library/react-native';
//import App from '../App';
import IndexScreen from '../app/(tabs)/index';

test('renders correctly', () => {
  //const { getByText } = render(<App />);
  const { getByText } = render(<IndexScreen />);
  expect(getByText('Open up App.js to start working on your app!')).toBeTruthy();
});
