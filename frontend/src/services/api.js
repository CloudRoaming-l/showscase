import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：注入 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理响应 & 401 自动跳转登录
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const url = error.config?.url || '';
    const isLoginRequest = url.includes('/auth/login');

    // 登录接口本身收到 401 时不做跳转，让调用方处理错误提示
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      // token 失效，清除并跳转登录
      localStorage.removeItem('admin_token');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    // 让调用方可以拿到完整的错误信息
    return Promise.reject(error);
  }
);

// 统一 ID 字段处理函数
function normalizeItem(item) {
  if (!item) return item;
  return {
    ...item,
    id: item._id || item.id
  };
}

function normalizeList(list) {
  if (!Array.isArray(list)) return list;
  return list.map(normalizeItem);
}

// 作品相关 API
export const photoAPI = {
  getConfig: async () => api.get('/photos/config'),

  getPhotos: async (params = {}) => {
    const result = await api.get('/photos', { params });
    return {
      ...result,
      data: normalizeList(result.data)
    };
  },

  // 管理员获取所有作品（包含待审核）
  getAdminPhotos: async (params = {}) => {
    const result = await api.get('/photos/admin/all', { params });
    return {
      ...result,
      data: normalizeList(result.data),
      statusCounts: result.statusCounts
    };
  },

  // 审核通过
  approvePhoto: async (id) => api.post(`/photos/${id}/approve`),

  // 审核拒绝
  rejectPhoto: async (id, reason) => api.post(`/photos/${id}/reject`, { reason }),

  // 批量审核通过
  batchApprove: async (ids) => api.post('/photos/batch/approve', { ids }),

  // 批量删除
  batchDelete: async (ids) => api.post('/photos/batch/delete', { ids }),

  getFeatured: async () => {
    const result = await api.get('/photos/featured');
    return {
      ...result,
      data: normalizeList(result.data)
    };
  },

  getPhoto: async (id) => {
    const result = await api.get(`/photos/${id}`);
    return {
      ...result,
      data: normalizeItem(result.data)
    };
  },

  createPhoto: async (data) => {
    const result = await api.post('/photos', data);
    return {
      ...result,
      data: normalizeItem(result.data)
    };
  },

  updatePhoto: async (id, data) => {
    const result = await api.put(`/photos/${id}`, data);
    return {
      ...result,
      data: normalizeItem(result.data)
    };
  },

  deletePhoto: async (id) => api.delete(`/photos/${id}`),

  batchImport: async (photos) => api.post('/photos/batch', { photos }),

  getStats: async () => api.get('/photos/stats/summary')
};

// 学生相关 API
export const studentAPI = {
  getStudents: async (params = {}) => {
    const result = await api.get('/students', { params });
    return {
      ...result,
      data: normalizeList(result.data)
    };
  },

  getStudent: async (id) => {
    const result = await api.get(`/students/${id}`);
    return {
      ...result,
      data: normalizeItem(result.data)
    };
  },

  createStudent: async (data) => {
    const result = await api.post('/students', data);
    return {
      ...result,
      data: normalizeItem(result.data)
    };
  },

  updateStudent: async (id, data) => {
    const result = await api.put(`/students/${id}`, data);
    return {
      ...result,
      data: normalizeItem(result.data)
    };
  },

  deleteStudent: async (id) => api.delete(`/students/${id}`)
};

// 操作日志 API
export const activityLogAPI = {
  getLogs: async (params = {}) => {
    const result = await api.get('/activity-logs', { params });
    return {
      ...result,
      data: normalizeList(result.data)
    };
  },

  getStats: async () => api.get('/activity-logs/stats')
};

// 从响应错误中提取后端返回的错误消息
function extractErrorMessage(error, fallback = '请求失败') {
  if (error.response && error.response.data) {
    return error.response.data.message || fallback;
  }
  if (error.message) return error.message;
  return fallback;
}

// 检查是否存在有效 token（简单 JWT 格式检查：三段以点分隔）
export function hasValidToken() {
  const token = localStorage.getItem('admin_token');
  if (!token) return false;
  // JWT: header.payload.signature - 典型格式为 "eyJ..."
  const parts = token.split('.');
  return parts.length === 3 && token.startsWith('eyJ');
}

// 清除登录状态
export function clearAuth() {
  localStorage.removeItem('admin_token');
}

// 判断错误是否为鉴权失败（401），此类错误由拦截器处理跳转到登录
export function isAuthError(error) {
  return error && error.response && error.response.status === 401;
}

// 认证相关 API
export const authAPI = {
  login: async (credentials) => {
    try {
      const result = await api.post('/auth/login', credentials);
      if (result.status === 'success' && result.data && result.data.token) {
        localStorage.setItem('admin_token', result.data.token);
      }
      return result;
    } catch (error) {
      // 提供带可读错误信息的抛错，让前端可以显示
      const message = extractErrorMessage(error, '登录失败，请检查账号密码');
      throw new Error(message);
    }
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('登出接口调用失败:', err.message);
    }
    localStorage.removeItem('admin_token');
    return { status: 'success' };
  },
  getCurrentUser: async () => api.get('/auth/me')
};

export default api;
