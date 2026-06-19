// 数据导入导出工具 - 使用后端 API
import { photoAPI, studentAPI } from '../services/api.js';
import { CATEGORIES } from './sharedData.js';

// 导出作品数据
export async function exportPhotosData() {
  const result = await photoAPI.getPhotos({ limit: 500 });
  const photos = result.data || [];
  return photos.map(p => ({
    '作品名称': p.title,
    '分类': p.category,
    '作者': p.author,
    '年级': p.grade,
    '描述': p.description,
    '图片URL': p.imageUrl,
    '创建时间': p.createdAt,
    '精选': p.isFeatured ? '是' : '否'
  }));
}

// 导出学生数据
export async function exportStudentsData() {
  const result = await studentAPI.getStudents();
  const students = result.data || [];
  return students.map(s => ({
    '姓名': s.name,
    '年级': s.grade,
    '班级': s.className,
    '联系电话': s.phone,
    '入学时间': s.joinDate || s.createdAt
  }));
}

// 下载 CSV 文件
function downloadCSV(data, filename) {
  if (!data || data.length === 0) {
    return false;
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  const dataRows = data.map(row =>
    headers.map(header => {
      const value = row[header] || '';
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

// 导出数据
export async function exportData(type) {
  try {
    let data;
    let filename;

    if (type === 'photos') {
      data = await exportPhotosData();
      filename = `作品数据_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'students') {
      data = await exportStudentsData();
      filename = `学生数据_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      return { success: false, message: '无效的导出类型' };
    }

    const success = downloadCSV(data, filename);
    return {
      success,
      count: data.length,
      message: success ? `成功导出 ${data.length} 条数据` : '无数据可导出'
    };
  } catch (error) {
    console.error('导出数据失败:', error);
    return { success: false, message: '导出数据失败: ' + error.message };
  }
}

// 解析 CSV 行
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (char === '"' && inQuotes) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

// 导入数据
export async function importData(type, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          reject(new Error('文件内容为空或格式不正确'));
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }

        if (type === 'photos') {
          await importPhotos(data);
        } else if (type === 'students') {
          await importStudents(data);
        } else {
          reject(new Error('无效的导入类型'));
          return;
        }

        resolve({ success: true, count: data.length });
      } catch (error) {
        reject(new Error('文件解析失败: ' + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsText(file);
  });
}

// 导入作品
async function importPhotos(data) {
  const categories = CATEGORIES;
  const photosToImport = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    photosToImport.push({
      title: row['作品名称'] || `作品 ${Date.now() + i}`,
      category: categories.includes(row['分类']) ? row['分类'] : '创意绘画',
      author: row['作者'] || '未知作者',
      grade: row['年级'] || '',
      description: row['描述'] || '',
      imageUrl: row['图片URL'] || `https://picsum.photos/seed/import${Date.now() + i}/800/600`,
      isFeatured: row['精选'] === '是'
    });
  }

  // 使用批量导入 API
  await photoAPI.batchImport(photosToImport);
}

// 导入学生
async function importStudents(data) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      await studentAPI.createStudent({
        name: row['姓名'] || `学生 ${Date.now() + i}`,
        grade: row['年级'] || '',
        className: row['班级'] || '',
        phone: row['联系电话'] || '',
        joinDate: row['入学时间'] || new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('导入学生失败:', error);
    }
  }
}

// 导出模板
export function exportTemplate(type) {
  let data = [];
  let headers;
  let filename;

  if (type === 'photos') {
    headers = ['作品名称', '分类', '作者', '年级', '描述', '图片URL', '精选'];
    data = [{
      '作品名称': '示例作品',
      '分类': '机器人编程',
      '作者': '张小明',
      '年级': '三年级',
      '描述': '这是一个示例作品描述',
      '图片URL': 'https://picsum.photos/800/600',
      '精选': '是'
    }];
    filename = '作品导入模板.csv';
  } else if (type === 'students') {
    headers = ['姓名', '年级', '班级', '联系电话', '入学时间'];
    data = [{
      '姓名': '张小明',
      '年级': '三年级',
      '班级': '编程一班',
      '联系电话': '138****1234',
      '入学时间': new Date().toISOString().split('T')[0]
    }];
    filename = '学生导入模板.csv';
  } else {
    return;
  }

  downloadCSV(data, filename);
}
