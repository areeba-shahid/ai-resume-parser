// frontend/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar({ isAuthenticated, user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
    window.location.reload();
  };

  const isRecruiter = user?.role === "recruiter";

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            🤖 AI Resume Screener
          </Link>

          <div className="flex space-x-4 items-center">
            {isAuthenticated ? (
              <>
                {isRecruiter ? (
                  <Link to="/dashboard" className="hover:text-blue-200">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/jobs" className="hover:text-blue-200">
                      Browse Jobs
                    </Link>
                    <Link to="/my-applications" className="hover:text-blue-200">
                      My Applications
                    </Link>
                  </>
                )}
                <div className="w-px h-6 bg-blue-400"></div>
                <span className="text-sm">👤 {user?.email || "User"}</span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-blue-200">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
