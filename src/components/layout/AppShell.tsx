import { NavLink, Outlet } from "react-router-dom";
import {
  Home,
  BookOpen,
  BarChart3,
  Settings,
  GraduationCap,
} from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/dashboard", icon: BarChart3, label: "Dashboard" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppShell() {
  return (
    <div className="flex w-full h-screen">
      {/* Sidebar */}
      <aside className="w-[72px] h-full glass flex flex-col items-center py-6 gap-2 border-r border-surface-800/50">
        {/* Logo */}
        <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center mb-6 animate-pulse-glow">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
                  isActive
                    ? "bg-primary-500/20 text-primary-400"
                    : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="w-5 h-5" />
                  {isActive && (
                    <div className="absolute left-0 w-0.5 h-6 bg-primary-400 rounded-r" />
                  )}
                  <div className="absolute left-14 px-2 py-1 bg-surface-800 text-surface-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-surface-700">
                    {item.label}
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom icon */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
          <BookOpen className="w-4 h-4" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
