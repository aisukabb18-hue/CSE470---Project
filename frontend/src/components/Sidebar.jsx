import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const navItems = [
  { path: "/dashboard",        icon: "🏠", label: "Dashboard"        },
  { path: "/mood",             icon: "😊", label: "Mood Log"          },
  { path: "/journal",          icon: "📔", label: "Journal"           },
  { path: "/sleep",            icon: "😴", label: "Sleep"             },
  { path: "/habits",           icon: "✅", label: "Habits"            },
  { path: "/risk",             icon: "🔍", label: "Risk Assessment"   },
  { path: "/reports",          icon: "📊", label: "Reports"           },
  { path: "/support",          icon: "💬", label: "Support"           },
  { path: "/admin",            icon: "⚙️",  label: "Admin"             },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🧠</span>
        <span className="logo-text">MindCare</span>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="user-info">
          <p className="user-name">{user?.name || "User"}</p>
          <p className="user-role">Member</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item-active" : ""}`
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <span>🚪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;