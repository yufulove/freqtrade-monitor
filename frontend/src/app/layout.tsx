import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Global styles
import AntdRegistry from '@/components/AntdRegistry'; // 导入我们的新组件
import { ConfigProvider, theme as antdTheme } from 'antd';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Freqtrade Multi-Account Monitor',
  description: 'Monitor your Freqtrade bots and Binance accounts in one place.',
};


const customTheme = {
  token: {
    colorPrimary: '#007AFF', // 主色调
    colorSuccess: '#34C759', // 盈利/成功
    colorError: '#FF3B30',   // 亏损/危险
    colorWarning: '#FF9500', // 警告
    // Ant Design 5.x 使用 'colorBgLayout' 作为 Layout 组件的背景色，
    // 而不是直接的 --background。需求文档中的 --background: #F2F2F7 更像是整体页面背景。
    // Card 等组件的背景色通过 componentToken 控制。
    colorBgContainer: '#FFFFFF', // 卡片背景等容器背景色
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    // 更多 token 可以在 Ant Design 文档中查找并按需配置
  },
  components: {
    Layout: {
      bodyBg: '#F2F2F7', // 对应 --background，用于 Layout 组件内容区域背景
      headerBg: '#FFFFFF', // 假设页眉背景也是白色
      siderBg: '#FFFFFF', // 假设侧边栏背景也是白色
    },
    Card: {
      colorBgContainer: '#FFFFFF', // 对应 --card-bg
    },
    // 可以为其他组件如 Button, Table 等添加特定的 componentToken
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntdRegistry>
          <ConfigProvider theme={customTheme}>
            {children}
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}