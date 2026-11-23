import {
  Bell,
  LayoutDashboard,
  Package,
  Receipt,
  FolderKanban,
  FileBarChart,
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Inventaris",
      path: "/inventory",
      icon: Package,
    },
    {
      name: "Transaksi",
      path: "/transactions",
      icon: Receipt,
    },
  ];

  const upcomingMenus = [
    { name: "Proyek", icon: FolderKanban },
    { name: "Laporan", icon: FileBarChart },
  ];

  return (
   <nav className="mb-7 grid min-h-[64px] grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-[#D5E7F7] bg-white px-5 py-3 shadow-[0_4px_18px_rgba(20,45,80,0.035)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center">
        <img
          src="/logomitra.jpg"
          alt="Logo CV Sintesa Mandiri Karya"
          className="h-full w-full object-contain"
        />
      </div>

      {/* NAVIGATION */}
   <div className="flex items-center justify-center gap-1 md:gap-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
             `rounded-full px-3 py-2 text-[10px] font-medium leading-none font-sans transition-all duration-200 ease-out ${
                isActive
                  ? "bg-[#142D50] text-white"
                  : "text-[#52647D] hover:bg-[#F0F6FC]"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}

        {upcomingMenus.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() =>
              window.alert(
                `Modul ${item.name} akan dikembangkan selanjutnya.`
              )
            }
           className="rounded-full px-3 py-2 text-[#52647D] transition-all duration-200 ease-out hover:bg-[#F0F6FC]"
            style={{
              fontSize: "10px",
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* USER ACTIONS */}
   <div className="flex items-center justify-self-end gap-3">
        <button
          onClick={() => window.alert("Belum ada notifikasi baru.")}
          className="relative rounded-full p-2 text-[#52647D] hover:bg-[#F0F6FC]"
        >
          <Bell size={17} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2 border-l border-[#E8EEF5] pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#CDE4FA] bg-[#F1F8FE] text-[10px] font-bold text-[#2463A6]">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="hidden sm:block">
            <p className="text-[10px] font-bold text-[#142D50]">
              {user?.name || "Pengguna"}
            </p>

            <p className="text-[9px] text-[#94A0AF]">
              {user?.role || "Staff"}
            </p>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="ml-1 rounded-lg p-2 text-[#94A0AF] hover:bg-red-50 hover:text-red-500"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;