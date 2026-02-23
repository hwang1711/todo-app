import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import './Layout.css'

function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">{children}</main>
      <BottomNav />
    </div>
  )
}

export default Layout
