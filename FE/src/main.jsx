import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

import { ToastProvider } from "./contexts/ToastContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { WishlistProvider } from "./contexts/WishlistContext.jsx";

// Import global styles
import "./assets/css/style.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <WishlistProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </WishlistProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
