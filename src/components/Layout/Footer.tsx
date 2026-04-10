
import { useTranslation } from 'react-i18next'
import { Link } from "react-router-dom"

import {
  IX,
  ITelegram,
  IOutlineExport2
} from '@/components/icon'
import { constants, useCommonStore } from '@/stores'
import Logo from '@/components/Logo'

import './Footer.scss'

const LayoutFooter = () => {
  const commonStore = useCommonStore()
  const { t } = useTranslation()

  return (
    <div className="container-fluid px-0 d-flex flex-column footer mt-auto bg-black border-top-dark">
      <div className="container-xl py-5 px-4 px-md-5">
        <div className="row g-5">
          {/* Logo & Intro */}
          <div className="col-12 col-lg-4 d-flex flex-column gap-4 pe-lg-5">
            <div>
              <Logo size="large" />
            </div>
            <p className="color-secondary" style={{ lineHeight: '1.8' }}>
              Signalxbot 是一款 AI 驱动的全自动链上量化交易平台，为您捕捉全网最有价值的交易信号与赚钱机会。
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="col-6 col-lg-3 d-flex flex-column gap-4">
            <span className="h6 fw-bold color-white">{t('footer.websiteService') || '网站服务'}</span>
            <ul className="d-flex flex-column fw-500 color-secondary gap-3 m-0 p-0" style={{ listStyle: 'none' }}>
              {commonStore.nav.map((item, idx) => (
                <li key={idx} className="footer-link-item">
                  {item.disabled ? (
                    <span>{t(item.i18n || '')}</span>
                  ) : item.to ? (
                    <Link to={item.to} className="linker color-secondary hover-color-primary transition-all">
                      {t(item.i18n || '')}
                    </Link>
                  ) : (
                    <a href={item.href} target="_blank" rel="noreferrer" className="linker color-secondary hover-color-primary transition-all">
                      {t(item.i18n || '')}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="col-6 col-lg-3 d-flex flex-column gap-4">
            <span className="h6 fw-bold color-white">资源与支持</span>
            <ul className="d-flex flex-column fw-500 color-secondary gap-3 m-0 p-0" style={{ listStyle: 'none' }}>
              <li className="footer-link-item"><a className="linker color-secondary hover-color-primary transition-all">API 文档</a></li>
              <li className="footer-link-item"><a className="linker color-secondary hover-color-primary transition-all">帮助中心</a></li>
              <li className="footer-link-item"><a className="linker color-secondary hover-color-primary transition-all">使用教程</a></li>
              <li className="footer-link-item"><a className="linker color-secondary hover-color-primary transition-all">提交反馈</a></li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="col-12 col-lg-2 d-flex flex-column gap-4">
            <span className="h6 fw-bold color-white">{t('footer.socialMedia') || '社交媒体'}</span>
            <div className="d-flex flex-column gap-3">
              {[
                { text: 'Telegram', icon: <ITelegram />, href: constants.app.TELEGRAM },
                { text: 'Twitter / X', icon: <IX />, href: constants.app.TWITTER },
              ].map((item, idx) => (
                <a key={idx} href={item.href} target="_blank" rel="noreferrer" className="d-flex align-items-center gap-2 px-3 py-2 br-4 linker color-white bg-white-alpha-5 hover-bg-white-alpha-10 transition-all border-gray">
                  {item.icon}
                  <span className="font-size-14 fw-500">{item.text}</span>
                  <IOutlineExport2 className="ms-auto zoom-80 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-top-dark py-4 text-center d-flex flex-column gap-2 align-items-center">
        <span className="color-secondary font-size-14">
          © {new Date().getFullYear()} {constants.app.NAME}. All rights reserved.
        </span>
      </div>
    </div>
  )
}

export default LayoutFooter