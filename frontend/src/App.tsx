import { Suspense, lazy, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import RequireAuth from "./lib/RequireAuth";
import { ToastProvider } from "./lib/toast";
import { BootProvider } from "./lib/boot";
import LoadingScreen from "./lib/LoadingScreen";
import Dashboard from "./pages/dashboard";

const Auth = lazy(() => import("./pages/auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Discover = lazy(() => import("./pages/Discover"));
const Matches = lazy(() => import("./pages/Matches"));
const Messages = lazy(() => import("./pages/Message"));
const ProfileCompletion = lazy(() => import("./pages/auth/ProfileCompletion"));
const About = lazy(() => import("./pages/auth/About"));
const Features = lazy(() => import("./pages/auth/Features"));
const Contact = lazy(() => import("./pages/auth/Contact"));

function App() {
  // Warm remaining route chunks immediately (not idle): login takes seconds
  // while this downloads in the background, so post-login tab switches never
  // suspend (which would flash a second fullscreen loader mid-session).
  // Dashboard is eagerly imported above — the /info → /dashboard handoff,
  // the most common one, can never suspend.
  useEffect(() => {
    void import("./pages/Profile");
    void import("./pages/Discover");
    void import("./pages/Matches");
    void import("./pages/Message");
    void import("./pages/auth/ProfileCompletion");
    void import("./pages/auth/About");
    void import("./pages/auth/Features");
    void import("./pages/auth/Contact");
  }, []);

  return (
    <Router>
      {" "}
      <div className="app-container">
        <ToastProvider>
          <BootProvider>
          <Suspense fallback={<LoadingScreen message="Loading…" />}>

            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/info" element={<ProfileCompletion />} />
              <Route path="/about" element={<About />} />
              <Route path="/features" element={<Features />} />
              <Route path="/contact" element={<Contact />} />
              <Route
                path="/messages"
                element={
                  <RequireAuth>
                    <Messages />
                  </RequireAuth>
                }
              />
              <Route
                path="/matches"
                element={
                  <RequireAuth>
                    <Matches />
                  </RequireAuth>
                }
              />
              <Route
                path="/discover"
                element={
                  <RequireAuth>
                    <Discover />
                  </RequireAuth>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
            </Routes>
          </Suspense>
          </BootProvider>
        </ToastProvider>
      </div>
    </Router>
  );
}

export default App;
