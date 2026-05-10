import "./Navbar.css";

const Navbar = ({ title }) => {
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
      </div>
    </header>
  );
};

export default Navbar;