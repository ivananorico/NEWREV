import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/sidebar/Sidebar'
import Header from './components/header/Header'
import sidebarItems from './components/sidebar/sidebarItems'

// Pages
import Dashboard from './pages/Dashboard'
import GeneralSettings from './pages/settings/General'
import SecuritySettings from './pages/settings/Security'

import RPT1 from './pages/RPT/RPT1/RPT1'
import RPT2 from './pages/RPT/RPT2/RPT2'
import RPT3 from './pages/RPT/RPT3/RPT3'

import BUSINESS1 from './pages/BUSINESS/BUSINESS1/BUSINESS1'
import BUSINESS2 from './pages/BUSINESS/BUSINESS2/BUSINESS2'

import DIGIPAY1 from './pages/DIGIPAY/DIGIPAY1/DIGIPAY1'
import DIGIPAY2 from './pages/DIGIPAY/DIGIPAY2/DIGIPAY2'

import TREASURY1 from './pages/TREASURY/TREASURY1/TREASURY1'
import TREASURY2 from './pages/TREASURY/TREASURY2/TREASURY2'

import MARKET1 from './pages/MARKET/MARKET1/MARKET1'
import MARKET2 from './pages/MARKET/MARKET2/MARKET2'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()

  // Breadcrumb helper
  function getBreadcrumb() {
    for (const item of sidebarItems) {
      if (item.path === location.pathname) return [item.label]
      if (item.subItems) {
        const sub = item.subItems.find(sub => sub.path === location.pathname)
        if (sub) return [item.label, sub.label]
      }
    }
    return ['Dashboard']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 transition-colors duration-200">
      <div className='flex h-screen overflow-hidden'>
        <Sidebar collapsed={sidebarCollapsed} />
        <div className='flex-1 flex flex-col'>
          <Header
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            breadcrumb={getBreadcrumb()}
          />
          <main className="flex-1 overflow-auto p-8 dark:bg-slate-800">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              
              <Route path="/RPT/RPT1" element={<RPT1 />} />
              <Route path="/RPT/RPT2" element={<RPT2 />} />
              <Route path="/RPT/RPT3" element={<RPT3 />} />

              <Route path="/BUSINESS/BUSINESS1" element={<BUSINESS1 />} />
              <Route path="/BUSINESS/BUSINESS2" element={<BUSINESS2 />} />

              <Route path="/TREASURY/TREASURY1" element={<TREASURY1 />} />
              <Route path="/TREASURY/TREASURY2" element={<TREASURY2 />} />

              <Route path="/DIGIPAY/DIGIPAY1" element={<DIGIPAY1 />} />
              <Route path="/DIGIPAY/DIGIPAY2" element={<DIGIPAY2 />} />

              <Route path="/MARKET/MARKET1" element={<MARKET1 />} />
              <Route path="/MARKET/MARKET2" element={<MARKET2 />} />

              <Route path="/settings/general" element={<GeneralSettings />} />
              <Route path="/settings/security" element={<SecuritySettings />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App
