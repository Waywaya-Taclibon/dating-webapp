import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Auth from "./pages/auth";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Matches from "./pages/Matches";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import Messages from "./pages/Message";
import ProfileCompletion from "./pages/auth/ProfileCompletion";

function App() {
  return (
    <Router>
      {" "}
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/info" element={<ProfileCompletion />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
