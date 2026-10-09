import { Suspense, lazy } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import RequireAuth from "./lib/RequireAuth";
import { ToastProvider } from "./lib/toast";

const Dashboard = lazy(() => import("./pages/dashboard"));
const Auth = lazy(() => import("./pages/auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Discover = lazy(() => import("./pages/Discover"));
const Matches = lazy(() => import("./pages/Matches"));
const Messages = lazy(() => import("./pages/Message"));
const ProfileCompletion = lazy(() => import("./pages/auth/ProfileCompletion"));

function App() {
  return (
    <Router>
      {" "}
      <div className="app-container">
        <ToastProvider>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-screen text-gray-500">
                Loading...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/info" element={<ProfileCompletion />} />
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
        </ToastProvider>
      </div>
    </Router>
  );
}

export default App;
