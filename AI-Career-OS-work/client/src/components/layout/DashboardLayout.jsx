
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./DashboardLayout.css";

const DashboardLayout = ({ isAdmin = false }) => {
    return (
        <div className="dashboard-layout">
            {/* SIDEBAR */}
            <Sidebar isAdmin={isAdmin} />

            {/* MAIN APPLICATION AREA */}
            <div className="dashboard-layout-main">
                <main className="dashboard-layout-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
