import { useState } from "react";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import type { AppView as View } from "./types";

// Sayfa yenilendiğinde oturumu korumak için token varsa doğrudan dashboard'a dön.
function getInitialView(): View {
  return localStorage.getItem("taskfield_token") ? "dashboard" : "home";
}

function App() {
  const [view, setView] = useState<View>(getInitialView);

  const goTo = (nextView: View) => {
    setView(nextView);
    window.scrollTo(0, 0);
  };

  if (view === "login" || view === "register") {
    return <AuthPage key={view} mode={view} goTo={goTo} />;
  }

  if (view === "dashboard") {
    return <DashboardPage goTo={goTo} />;
  }

  return <HomePage goTo={goTo} />;
}

export default App;
