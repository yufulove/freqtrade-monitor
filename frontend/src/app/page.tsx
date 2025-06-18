'use client';

import { Typography, Space, Button, Card, Row, Col } from 'antd';
import { 
  DashboardOutlined, 
  LoginOutlined, 
  ControlOutlined,
  MonitorOutlined,
  SecurityScanOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  return (
    <MainLayout>
      <div style={{ padding: '50px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Space direction="vertical" size="large">
            <Title level={1}>Welcome to Freqtrade Multi-Account Monitor</Title>
            <Paragraph style={{ fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
              Your central hub for monitoring Freqtrade bots and Binance account performance.
              A modern trading system interface built with Next.js and Ant Design.
            </Paragraph>
          </Space>
        </div>

        <Row gutter={[24, 24]} justify="center">
          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: '100%' }}
              styles={{ body: { padding: '32px 24px' } }}
            >
              <DashboardOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              <Title level={4}>Dashboard</Title>
              <Paragraph type="secondary">
                View trading overview, account status and real-time data
              </Paragraph>
              <Link href="/dashboard">
                <Button type="primary" size="large" block>
                  Go to Dashboard
                </Button>
              </Link>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: '100%' }}
              styles={{ body: { padding: '32px 24px' } }}
            >
              <ControlOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>Control Panel</Title>
              <Paragraph type="secondary">
                Trading control, system monitoring and permission management
              </Paragraph>
              <Link href="/control">
                <Button type="primary" size="large" block>
                  Enter Control Panel
                </Button>
              </Link>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: '100%' }}
              styles={{ body: { padding: '32px 24px' } }}
            >
              <LoginOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
              <Title level={4}>User Login</Title>
              <Paragraph type="secondary">
                Login to access full system functionality
              </Paragraph>
              <Link href="/login">
                <Button size="large" block>
                  Login
                </Button>
              </Link>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 64 }}>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
            System Features
          </Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <MonitorOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
                <div style={{ fontWeight: 'bold' }}>Real-time Monitoring</div>
                <div style={{ fontSize: 12, color: '#666' }}>System status and performance monitoring</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <SecurityScanOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                <div style={{ fontWeight: 'bold' }}>Security Control</div>
                <div style={{ fontSize: 12, color: '#666' }}>Two-factor authentication and permission management</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <BarChartOutlined style={{ fontSize: 24, color: '#faad14', marginBottom: 8 }} />
                <div style={{ fontWeight: 'bold' }}>Performance Analytics</div>
                <div style={{ fontSize: 12, color: '#666' }}>Trading performance and profit analysis</div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <ControlOutlined style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }} />
                <div style={{ fontWeight: 'bold' }}>Active Control</div>
                <div style={{ fontSize: 12, color: '#666' }}>Real-time trading control and automation</div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </MainLayout>
  );
}