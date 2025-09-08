import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppRoutes />
          </Router>
        </CartProvider>
      </AuthProvider>
    </UIProvider>
  );
}

export default App;