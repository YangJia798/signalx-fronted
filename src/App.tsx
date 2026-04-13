
import { RouterProvider } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, DisclaimerComponent, RainbowKitAuthenticationProvider, Theme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StyleProvider } from '@ant-design/cssinjs'
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from 'react-router-dom'
import { ConfigProvider, message, notification } from 'antd'
import { createTheme, useTheme, ThemeProvider } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import zhTW from 'antd/locale/zh_TW'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-tw'
import dayjs from 'dayjs'

import { NotificationProvider } from '@/components/Notification/index'
import router from '@/router'
import { useAccountStore } from '@/stores'
import { config } from '@/utils/wagmiConfig'
import { merge } from '@/utils'
import { appInfo, customAvatar, useAuthentication } from '@/utils/RainbowKitConfig'
import { luminous } from '@/themes'
import { muiTheme } from '@/themes/mui'
import { HyperWSProvider } from '@/components/Hyper/WSContext'

message.config({
  duration: 5,
  maxCount: 3,
  rtl: true,
  prefixCls: '__antd__message',
  top: 64
})

const antdLocales: Record<string, any> = {
  'en': enUS,
  'zh-Hans': zhCN,
  'zh-Hant': zhTW
}

const App = () => {
  const accountStore = useAccountStore()
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'en'
  const antdLocale = antdLocales[lang] || enUS

  if (lang === 'zh-Hans') {
    dayjs.locale('zh-cn')
  } else if (lang === 'zh-Hant') {
    dayjs.locale('zh-tw')
  } else {
    dayjs.locale('en')
  }

  const { authenticationAdapter } = useAuthentication()
  const theme = merge(darkTheme(), {
    colors: {
      // accentColor: '#101828',
      // accentColorForeground: '#ffffff'
    }
  }) as Theme

  return (
    <WagmiProvider config={config}>
       <QueryClientProvider client={new QueryClient()}>
        <RainbowKitAuthenticationProvider adapter={authenticationAdapter} status={accountStore.evmAuthStatus}>
           <RainbowKitProvider theme={theme} appInfo={appInfo} avatar={customAvatar}>
            <ThemeProvider theme={muiTheme}>
              <ConfigProvider theme={luminous.theme} locale={antdLocale}>
                <StyleProvider hashPriority="high">
                  <HyperWSProvider>
                    <NotificationProvider>
                    <RouterProvider router={router} />
                    </NotificationProvider>
                  </HyperWSProvider>
                </StyleProvider>
              </ConfigProvider>
            </ThemeProvider>
           </RainbowKitProvider>
        </RainbowKitAuthenticationProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
