import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import '../styles/theme.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
