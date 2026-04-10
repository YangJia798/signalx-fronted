import { ProgressProps, theme as antdTheme } from 'antd'

export const theme = {
  algorithm: antdTheme.darkAlgorithm,
  "token": {
    "colorPrimary": "#13c2c2",
    "colorInfo": "#13c2c2",
    "borderRadius": 4,
    "wireframe": false,
    "fontSize": 16,
    // "sizeStep": 4,
    "sizeUnit": 6,
    colorSuccess: '#14c362',
    "fontFamily": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    "controlHeight": 48,
    colorError: '#d01515'
  },
}

export const progressStrokeColor: ProgressProps['strokeColor'] = {
  '0%': '#DEFFE4',
  '100%': '#13c2c2',
}

export const tooltipColor: string = 'rgba(23,23,23, 0.95)'