
import { RouterProvider } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, RainbowKitAuthenticationProvider, Theme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider, message } from 'antd'
import { ThemeProvider } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { useMemo, useEffect } from 'react'
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

const queryClient = new QueryClient()

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

  // 语言切换时同步 dayjs locale（side effect 不应放在渲染函数体内）
  useEffect(() => {
    if (lang === 'zh-Hans') dayjs.locale('zh-cn')
    else if (lang === 'zh-Hant') dayjs.locale('zh-tw')
    else dayjs.locale('en')
  }, [lang])

  const { authenticationAdapter } = useAuthentication()

  // RainbowKit theme 不依赖任何状态，只需构建一次
  const theme = useMemo(() => merge(darkTheme(), {
    colors: {}
  }) as Theme, [])

  return (
    <WagmiProvider config={config}>
       <QueryClientProvider client={queryClient}>
        <RainbowKitAuthenticationProvider adapter={authenticationAdapter} status={accountStore.evmAuthStatus}>
           <RainbowKitProvider theme={theme} appInfo={appInfo} avatar={customAvatar}>
            <ThemeProvider theme={muiTheme}>
              <ConfigProvider theme={luminous.theme} locale={antdLocale}>
                <StyleProvider hashPriority="high">
                  <NotificationProvider>
                    <RouterProvider router={router} />
                  </NotificationProvider>
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
