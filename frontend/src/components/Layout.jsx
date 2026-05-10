import Sidebar from "./Sidebar";
import Navbar  from "./Navbar";
import "./Layout.css";

const Layout = ({ children, title }) => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Navbar title={title} />
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;