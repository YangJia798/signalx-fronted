import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    primary: {
      main: '#13c2c2', // 使用与antd相同的主色调
    },
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", // 与luminous主题保持一致
  },
  components: {
    // 自定义组件样式
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4, // 与luminous主题保持一致
        },
      },
    },
  },
});