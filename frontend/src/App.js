// frontend/src/App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import JobList from "./components/JobList";
import ApplicationForm from "./components/ApplicationForm";
import RecruiterDashboard from "./components/RecruiterDashboard";
import Navbar from "./components/Navbar";
import RealTimeUpdates from "./components/RealTimeUpdates";
import MyApplications from "./components/MyApplications";
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on load and when localStorage changes
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      } else {
        setIsAuthenticated(false);
        setUser({});
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (in case token is updated in another tab)
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  const isRecruiter = user.role === "recruiter";

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} user={user} />
      <RealTimeUpdates />
      <Routes>
        <Route
          path="/login"
          element={
            <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          }
        />
        <Route
          path="/register"
          element={
            <Register
              setIsAuthenticated={setIsAuthenticated}
              setUser={setUser}
            />
          }
        />

        <Route
          path="/jobs"
          element={isAuthenticated ? <JobList /> : <Navigate to="/login" />}
        />
        <Route
          path="/apply/:jobId"
          element={
            isAuthenticated ? <ApplicationForm /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated && isRecruiter ? (
              <RecruiterDashboard />
            ) : (
              <Navigate to="/jobs" />
            )
          }
        />
        <Route
          path="/my-applications"
          element={
            isAuthenticated && !isRecruiter ? (
              <MyApplications />
            ) : (
              <Navigate to="/jobs" />
            )
          }
        />
        <Route
          path="/"
          element={
            <Navigate
              to={
                isAuthenticated
                  ? isRecruiter
                    ? "/dashboard"
                    : "/jobs"
                  : "/login"
              }
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
