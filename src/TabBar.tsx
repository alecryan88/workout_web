import { NavLink, Outlet } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Workouts', icon: '▦' },
  { to: '/templates', label: 'Templates', icon: '☰' },
  { to: '/exercises', label: 'Exercises', icon: '◉' },
]

/** Layout for the top-level screens: the screen plus the bottom tab bar. */
export default function TabLayout() {
  return (
    <>
      <Outlet />
      <nav className="tab-bar" aria-label="Tabs">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end className="tab">
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
