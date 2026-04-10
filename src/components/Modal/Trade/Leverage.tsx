import { useState } from 'react'
import { Modal, Slider } from 'antd'
import { IClose } from '@/components/icon'

interface LeverageModalProps {
  open: boolean
  onClose: () => void
  currentLeverage: number
  maxLeverage?: number
  coin?: string
  onConfirm: (leverage: number) => void
}

const LeverageModal = ({ open, onClose, currentLeverage, maxLeverage = 40, coin = 'BTC', onConfirm }: LeverageModalProps) => {
  const [leverage, setLeverage] = useState(currentLeverage)

  const marks = {
    1: '1x',
    5: '5x',
    10: '10x',
    25: '25x',
    40: maxLeverage + 'x',
  }

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
          调整杠杆
        </div>

        <div className="d-flex flex-column gap-2">
          <div className="font-size-15" style={{ color: 'rgba(255,255,255,0.9)' }}>
            控制 <span className="fw-600">{coin}</span> 仓位的杠杆。最大杠杆为 <span className="fw-600">{maxLeverage}x</span>。
          </div>
          <div className="font-size-14" style={{ color: 'rgba(255,255,255,0.45)' }}>
            杠杆越高，最大仓位规模越小。
          </div>
        </div>

        <div className="d-flex align-items-center gap-4 mt-4 mb-4 pt-2">
          <div className="flex-grow-1">
            <Slider
              min={1}
              max={maxLeverage}
              marks={marks}
              value={leverage}
              onChange={setLeverage}
              tooltip={{ open: false }}
              className="custom-leverage-slider"
            />
          </div>
          <div 
            className="d-flex align-items-center justify-content-center px-3"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              color: '#fff',
              minWidth: '70px',
              height: '44px'
            }}
          >
            <span className="font-size-16 fw-600 me-1">{leverage}</span>
            <span className="font-size-14" style={{ color: 'rgba(255,255,255,0.35)' }}>x</span>
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
            onConfirm(leverage)
            onClose()
          }}
        >
          确认
        </button>
      </div>

      <style>{`
        .custom-leverage-slider .ant-slider-rail {
            background: rgba(255,255,255,0.1) !important;
            height: 4px !important;
        }
        .custom-leverage-slider .ant-slider-track {
            background: #00e5ff !important;
            height: 4px !important;
        }
        .custom-leverage-slider .ant-slider-handle {
            width: 24px !important;
            height: 24px !important;
            border: 4px solid #00e5ff !important;
            background: #1a1a1a !important;
            margin-top: -10px !important;
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.4) !important;
        }
        .custom-leverage-slider .ant-slider-handle::after {
            display: none !important;
        }
        .custom-leverage-slider .ant-slider-mark-text {
            color: rgba(255,255,255,0.4) !important;
            font-size: 13px !important;
            margin-top: 10px !important;
        }
        .custom-leverage-slider .ant-slider-dot {
            background: rgba(255,255,255,0.2) !important;
            border: none !important;
            width: 5px !important;
            height: 5px !important;
            top: 0px !important;
        }
        .custom-leverage-slider .ant-slider-dot-active {
            background: #00e5ff !important;
        }
      `}</style>
    </Modal>
  )
}

export default LeverageModal
