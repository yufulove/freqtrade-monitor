'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { controlAPI } from '@/lib/api/control';
import { UserPermissions, PermissionLevel } from '@/types/control';

// 用户信息接口
interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  avatar?: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

// 认证状态接口
interface AuthState {
  user: User | null;
  permissions: UserPermissions | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

// 认证上下文接口
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updatePermissions: () => Promise<void>;
  hasPermission: (requiredLevel: PermissionLevel) => boolean;
  checkActionPermission: (action: string, resourceId?: string) => Promise<boolean>;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    permissions: null,
    isAuthenticated: false,
    isLoading: true,
    token: null
  });

  // 权限级别映射
  const permissionLevels: PermissionLevel[] = [PermissionLevel.NONE, PermissionLevel.READ_ONLY, PermissionLevel.LIMITED_CONTROL, PermissionLevel.FULL_CONTROL, PermissionLevel.ADMIN];

  // 从本地存储获取token
  const getStoredToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  };

  // 保存token到本地存储
  const setStoredToken = (token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  };

  // 获取用户信息
  const fetchUserInfo = async (token: string): Promise<User | null> => {
    try {
      // 这里应该调用实际的用户信息API
      // const response = await userAPI.getCurrentUser();
      // return response.data;
      
      // 模拟用户信息
      return {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        is_active: true
      };
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return null;
    }
  };

  // 获取用户权限
  const fetchUserPermissions = async (): Promise<UserPermissions | null> => {
    try {
      const response = await controlAPI.getUserPermissions();
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user permissions:', error);
      return null;
    }
  };

  // 登录
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // 这里应该调用实际的登录API
      // const response = await authAPI.login({ username, password });
      // const { token, user } = response.data;
      
      // 模拟登录
      const token = 'mock_token_' + Date.now();
      const user = await fetchUserInfo(token);
      const permissions = await fetchUserPermissions();
      
      if (user) {
        setStoredToken(token);
        setAuthState({
          user,
          permissions,
          isAuthenticated: true,
          isLoading: false,
          token
        });
        
        message.success('登录成功');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Login failed:', error);
      message.error(error.response?.data?.detail || '登录失败');
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  // 登出
  const logout = () => {
    setStoredToken(null);
    setAuthState({
      user: null,
      permissions: null,
      isAuthenticated: false,
      isLoading: false,
      token: null
    });
    message.info('已退出登录');
  };

  // 刷新token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentToken = getStoredToken();
      if (!currentToken) {
        return false;
      }
      
      // 这里应该调用实际的token刷新API
      // const response = await authAPI.refreshToken(currentToken);
      // const { token } = response.data;
      
      // 模拟token刷新
      const newToken = 'refreshed_token_' + Date.now();
      setStoredToken(newToken);
      
      setAuthState(prev => ({ ...prev, token: newToken }));
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  };

  // 更新权限
  const updatePermissions = async (): Promise<void> => {
    try {
      const permissions = await fetchUserPermissions();
      setAuthState(prev => ({ ...prev, permissions }));
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  // 检查权限级别
  const hasPermission = (requiredLevel: PermissionLevel): boolean => {
    if (!authState.permissions) return false;
    
    const userLevelIndex = permissionLevels.indexOf(authState.permissions.permission_level);
    const requiredLevelIndex = permissionLevels.indexOf(requiredLevel);
    
    return userLevelIndex >= requiredLevelIndex;
  };

  // 检查具体操作权限
  const checkActionPermission = async (action: string, resourceId?: string): Promise<boolean> => {
    try {
      const response = await controlAPI.checkPermission({ action, resource_id: resourceId });
      return response.data.allowed;
    } catch (error) {
      console.error('Failed to check action permission:', error);
      return false;
    }
  };

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        const user = await fetchUserInfo(token);
        const permissions = await fetchUserPermissions();
        
        if (user) {
          setAuthState({
            user,
            permissions,
            isAuthenticated: true,
            isLoading: false,
            token
          });
        } else {
          // Token无效，清除存储
          setStoredToken(null);
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    updatePermissions,
    hasPermission,
    checkActionPermission
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;