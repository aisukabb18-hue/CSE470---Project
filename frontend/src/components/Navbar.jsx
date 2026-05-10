import { useTheme } from "../context/ThemeContext";
import "./Navbar.css";

const Navbar = ({ title }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="navbar-title">
        <h2>{title}</h2>
      </div>
      <div className="navbar-right">
        <span className="navbar-date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year:    "numeric",
            month:   "long",
            day:     "numeric",
          })}
        </span>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title="Toggle dark/light mode"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>
    </header>
  );
};

export default Navbar;