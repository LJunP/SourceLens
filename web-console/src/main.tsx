import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorInfo: '#2563eb',
          colorSuccess: '#059669',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          colorBgLayout: '#f5f7fb',
          colorText: '#162033',
          colorTextSecondary: '#637083',
          borderRadius: 8,
          borderRadiusLG: 8,
          fontSize: 14,
          wireframe: false,
        },
        components: {
          Layout: {
            siderBg: '#101827',
            headerBg: '#ffffff',
          },
          Menu: {
            darkItemBg: '#101827',
            darkSubMenuItemBg: '#101827',
            darkItemSelectedBg: '#2563eb',
            darkItemHoverBg: 'rgba(255,255,255,0.08)',
          },
          Card: {
            borderRadiusLG: 8,
            headerFontSize: 15,
          },
          Button: {
            borderRadius: 8,
            controlHeight: 34,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f8fbff',
          },
          Tabs: {
            itemSelectedColor: '#2563eb',
            inkBarColor: '#2563eb',
          },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>
)
