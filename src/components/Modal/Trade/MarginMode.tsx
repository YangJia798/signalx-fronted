import { useState } from 'react'
import { Modal, Checkbox } from 'antd'
import { IClose } from '@/components/icon'

interface MarginModeModalProps {
  open: boolean
  onClose: () => void
  currentMode: string
  onConfirm: (mode: string) => void
}

const MarginModeModal = ({ open, onClose, currentMode, onConfirm }: MarginModeModalProps) => {
  const [selectedMode, setSelectedMode] = useState(currentMode)

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      closeIcon={<IClose style={{ color: 'rgba(255,255,255,0.45)', fontSize: '18px' }} />}
      width={480}
      styles={{
        content: {
          background: 'rgba(23, 23, 23, 0.98)',
          borderRadius: '28px',
          padding: '32px',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        },
        body: {
          padding: 0,
        },
        mask: {
          backdropFilter: 'blur(8px)',
          background: 'rgba(0,0,0,0.7)'
        }
      }}
    >
      <div className="d-flex flex-column gap-4">
        <div className="font-size-22 fw-600" style={{ color: '#fff' }}>
          保证金模式
        </div>

        <div className="d-flex flex-column gap-3">
          {/* Cross (全仓) */}
          <div
            className="p-3 cursor-pointer transition-2 d-flex flex-column gap-2"
            style={{
              background: selectedMode === 'cross' ? 'rgba(255,255,255,0.04)' : 'transparent',
              borderRadius: '16px',
              border: selectedMode === 'cross' ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              padding: '16px !important'
            }}
            onClick={() => setSelectedMode('cross')}
          >
            <div className="d-flex align-items-center gap-2 font-size-16 fw-600" style={{ color: '#fff' }}>
              <Checkbox checked={selectedMode === 'cross'} className="custom-modal-checkbox" />
              全仓
            </div>
            <div className="font-size-14" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
              所有全仓仓位共享相同的全仓保证金作为抵押品。如果发生强平，您的全仓保证金余额以及此模式下资产下的任何剩余未平仓仓位都可能被没收。
            </div>
          </div>

          {/* Isolated (逐仓) */}
          <div
            className="p-3 cursor-pointer transition-2 d-flex flex-column gap-2"
            style={{
              background: selectedMode === 'isolated' ? 'rgba(255,255,255,0.04)' : 'transparent',
              borderRadius: '16px',
              border: selectedMode === 'isolated' ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              padding: '16px !important'
            }}
            onClick={() => setSelectedMode('isolated')}
          >
            <div className="d-flex align-items-center gap-2 font-size-16 fw-600" style={{ color: '#fff' }}>
              <Checkbox checked={selectedMode === 'isolated'} className="custom-modal-checkbox" />
              逐仓
            </div>
            <div className="font-size-14" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
              通过限制分配给每个仓位的保证金金额来管理单个仓位的风险。如果逐仓仓位的保证金率达到 100%，该仓位将被强平。在此模式下，您可以为单个仓位添加或移除保证金。
            </div>
          </div>
        </div>

        <button
          className="w-100 py-2 fw-600 font-size-16 border-0 cursor-pointer transition-2 mt-2"
          style={{
            background: 'linear-gradient(90deg, #E0F7FA 0%, #FCE4EC 40%, #00E5FF 100%)',
            color: '#111',
            borderRadius: '30px',
            height: '52px',
            boxShadow: '0 4px 15px rgba(0, 229, 255, 0.2)'
          }}
          onClick={() => {
            onConfirm(selectedMode)
            onClose()
          }}
        >
          确认
        </button>
      </div>

      <style>{`
        .ant-modal-mask {
            backdrop-filter: blur(4px);
        }
        .custom-modal-checkbox .ant-checkbox-inner {
            background-color: transparent !important;
            border-color: rgba(255,255,255,0.3) !important;
            border-radius: 4px !important;
            width: 18px !important;
            height: 18px !important;
        }
        .custom-modal-checkbox.ant-checkbox-wrapper-checked .ant-checkbox-inner {
            background-color: #00e5ff !important;
            border-color: #00e5ff !important;
        }
        .custom-modal-checkbox .ant-checkbox-inner::after {
            border-color: #111 !important;
        }
      `}</style>
    </Modal>
  )
}

export default MarginModeModal
