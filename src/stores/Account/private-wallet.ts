import { createStore } from '@/stores/helpers'

import { merge } from '@/utils'

export type TPrivateWalletStore = {
  MIN_PW_LENGTH: number
  MIN_DEPOSIT_USDC_AMOUNT: number

  openCreatePrivateWallet: boolean
  openImportPrivateWallet: boolean
  openExportPrivateKey: boolean
  openSetFundPassword: boolean
  openBindEmail: boolean
  openDeposit: boolean
  openWithdraw: boolean
  openRemove: boolean
  operaWalletIdx: number

  fundPasswordSet: boolean

  addresses: Array<string>

  list: Array<{
    idx: number
    walletId: string // 钱包id
    platform: string // 平台（hyperliquid | aster）
    balance: string // 余额
    hasPrivateKey: boolean // 是否有私钥
    nickname: string // 昵称
    pwPrompt: string // 密码提示
    createTs: number // 注册时间
    totalMarginUsed: string // 保证金
    uPnl: string // uPnl
    uPnlStatus: number // uPnl 状态 -1 为亏 1 为赚 0 为 不亏不赚
    address: string // 钱包地址
    withdrawable: string // 可提现余额
    importWallet: number // 0=创建的钱包 1=导入的钱包
    hasFundPassword: boolean // 是否已设置资金密码
  }>

  // create
  createPlatform: string   // 'hyperliquid' | 'aster'
  createPW: string
  createPWPrompt: string
  createNickname: string
  resetCreate: () => void

  // import
  importWalletProvider: string  // 'aster' | 'hyperliquid'
  importAddress: string
  importApiWalletAddress: string
  importApiSecretKey: string
  importNickname: string
  resetImport: () => void

  // ExportPrivateKey
  exportPrivateKeyPW: string
  exportPrivateKeyContent: string
  exportFundPw: string
  exportEmailCode: string
  exportBundleInput: string
  exportKeypairPrivateKey: string
  exportOrganizationId: string
  resetExportPrivateKey(): void

  // SetFundPassword
  fundPw: string
  fundPwRepeat: string
  fundPwPrompt: string
  resetFundPassword(): void

  // BindEmail
  bindEmailAddress: string
  resetBindEmail(): void

  // deposit
  depositNumber: string
  resetDeposit: () => void

  // remove
  resetRemove: () => void

  reset: () => void
}

const DEFAULT_CREATE = {
  createPlatform: 'hyperliquid',
  createPW: '',
  createPWPrompt: '',
  createNickname: ''
}

const DEFAULT_IMPORT = {
  importWalletProvider: 'aster',
  importAddress: '',
  importApiWalletAddress: '',
  importApiSecretKey: '',
  importNickname: ''
}

const DEFAULT_EXPORT_PRIVATE_KEY = {
  exportPrivateKeyPW: '',
  exportPrivateKeyContent: '',
  exportFundPw: '',
  exportEmailCode: '',
  exportBundleInput: '',
  exportKeypairPrivateKey: '',
  exportOrganizationId: ''
}

const DEFAULT_FUND_PASSWORD = {
  fundPw: '',
  fundPwRepeat: '',
  fundPwPrompt: ''
}

const DEFAULT_BIND_EMAIL = {
  bindEmailAddress: ''
}

const DEFAULT_DEPOSIT = {
  depositNumber: ''
}

const DEFAULT_REMOVE = {}

const DEFAULT = {
  operaWalletIdx: -1,

  addresses: [],

  list: [],
  ...DEFAULT_CREATE,
  ...DEFAULT_IMPORT,
  ...DEFAULT_EXPORT_PRIVATE_KEY,
  ...DEFAULT_FUND_PASSWORD,
  ...DEFAULT_BIND_EMAIL,
  ...DEFAULT_DEPOSIT,
  ...DEFAULT_REMOVE
}

const privateWalletStore: TPrivateWalletStore = {
  MIN_PW_LENGTH: 6,
  MIN_DEPOSIT_USDC_AMOUNT: 15,

  openCreatePrivateWallet: false,
  openImportPrivateWallet: false,
  openExportPrivateKey: false,
  openSetFundPassword: false,
  openBindEmail: false,
  openDeposit: false,
  openWithdraw: false,
  openRemove: false,

  fundPasswordSet: false,

  ...DEFAULT,

  resetCreate() {
    merge(this, DEFAULT_CREATE)
  },

  resetImport() {
    merge(this, DEFAULT_IMPORT)
  },

  resetExportPrivateKey() {
    merge(this, DEFAULT_EXPORT_PRIVATE_KEY)
  },

  resetFundPassword() {
    merge(this, DEFAULT_FUND_PASSWORD)
  },

  resetBindEmail() {
    merge(this, DEFAULT_BIND_EMAIL)
  },

  resetDeposit() {
    merge(this, DEFAULT_DEPOSIT)
  },

  resetRemove() {
    merge(this, DEFAULT_REMOVE)
  },

  reset() {
    merge(this, DEFAULT)
  }
}

export const usePrivateWalletStore = createStore<TPrivateWalletStore>(privateWalletStore)
