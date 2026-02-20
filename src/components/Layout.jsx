import BottomNav from './BottomNav'
import './Layout.css'

function Layout({ children }) {
  return (
    <div className="layout">
      <main className="layout-main">{children}</main>
      <BottomNav />
    </div>
  )
}

export default Layout
