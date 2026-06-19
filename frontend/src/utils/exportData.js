// 数据导出工具

/**
 * 将数据导出为 CSV 文件
 * @param {Array} data - 要导出的数据数组
 * @param {Array} columns - 列配置 [{key: '字段名', title: '显示标题'}]
 * @param {string} filename - 文件名（不含扩展名）
 */
export function exportToCSV(data, columns, filename = 'export') {
  if (!data || data.length === 0) {
    alert('没有数据可导出');
    return;
  }

  // 构建 CSV 表头
  const headers = columns.map(col => `"${col.title}"`).join(',');

  // 构建 CSV 数据行
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key] ?? '';
      // 处理日期格式化
      if (col.format === 'date') {
        value = value ? new Date(value).toLocaleDateString('zh-CN') : '';
      }
      // 转义双引号
      value = String(value).replace(/"/g, '""');
      return `"${value}"`;
    }).join(',');
  });

  // 合并表头和数据
  const csvContent = [headers, ...rows].join('\n');

  // 添加 BOM 以支持 Excel 正确显示中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${formatDate(new Date())}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 导出作品数据
 */
export function exportPhotos(photos, filename = '作品数据') {
  const columns = [
    { key: 'title', title: '作品名称' },
    { key: 'author', title: '作者' },
    { key: 'grade', title: '年级' },
    { key: 'category', title: '分类' },
    { key: 'isFeatured', title: '精选', format: 'boolean' },
    { key: 'status', title: '状态', format: 'status' },
    { key: 'viewCount', title: '浏览量' },
    { key: 'createdAt', title: '创建时间', format: 'date' },
    { key: 'updatedAt', title: '更新时间', format: 'date' },
    { key: 'description', title: '描述' }
  ];

  // 预处理数据
  const processedData = photos.map(photo => ({
    ...photo,
    isFeatured: photo.isFeatured ? '是' : '否',
    status: formatStatus(photo.status),
    viewCount: photo.viewCount || 0
  }));

  exportToCSV(processedData, columns, filename);
}

/**
 * 导出学生数据
 */
export function exportStudents(students, filename = '学生数据') {
  const columns = [
    { key: 'name', title: '姓名' },
    { key: 'grade', title: '年级' },
    { key: 'className', title: '班级' },
    { key: 'phone', title: '联系电话' },
    { key: 'joinDate', title: '入学时间', format: 'date' },
    { key: 'createdAt', title: '创建时间', format: 'date' }
  ];

  exportToCSV(students, columns, filename);
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 格式化状态
 */
function formatStatus(status) {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return statusMap[status] || status;
}
