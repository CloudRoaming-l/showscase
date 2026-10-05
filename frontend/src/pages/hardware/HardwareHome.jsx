import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { stageAPI, lessonAPI, toolCategoryAPI, toolAPI } from '../../services/api.js';
import { BookOpen, Wrench, Library, ChevronRight } from 'lucide-react';

export default function HardwareHome() {
  const [stages, setStages] = useState([]);
  const [toolCategories, setToolCategories] = useState([]);
  const [lessonCount, setLessonCount] = useState(0);
  const [toolCount, setToolCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stagesRes, categoriesRes, lessonsRes, toolsRes] = await Promise.all([
        stageAPI.getList(),
        toolCategoryAPI.getList(),
        lessonAPI.getList({ limit: 1 }),
        toolAPI.getList({ limit: 1 })
      ]);

      if (stagesRes.status === 'success') setStages(stagesRes.data);
      if (categoriesRes.status === 'success') setToolCategories(categoriesRes.data);
      if (lessonsRes.status === 'success') setLessonCount(lessonsRes.data.total || 0);
      if (toolsRes.status === 'success') setToolCount(toolsRes.data.total || 0);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">造物课堂 · 硬件教学知识库</h1>
        <p className="text-gray-500 text-sm">课程体系、器材档案、教学资料，一站式管理</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="text-2xl font-semibold text-gray-900">{stages.length}</div>
          <div className="text-sm text-gray-500 mt-1">学习阶段</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="text-2xl font-semibold text-gray-900">{lessonCount}</div>
          <div className="text-sm text-gray-500 mt-1">课件总数</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="text-2xl font-semibold text-gray-900">{toolCategories.length}</div>
          <div className="text-sm text-gray-500 mt-1">器材分类</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="text-2xl font-semibold text-gray-900">{toolCount}</div>
          <div className="text-sm text-gray-500 mt-1">器材档案</div>
        </div>
      </div>

      {/* 课程体系 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen size={18} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">课程体系</h2>
          </div>
          <Link
            to="/hardware/lessons"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            查看全部 <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((stage) => (
            <Link
              key={stage._id}
              to={`/hardware/lessons?stageId=${stage._id}`}
              className="bg-white border border-gray-200 rounded-md p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-base font-medium text-gray-900 group-hover:text-gray-700">
                    {stage.name}
                  </div>
                  {stage.shortName && (
                    <div className="text-xs text-gray-400 mt-0.5">{stage.shortName}</div>
                  )}
                </div>
                {stage.ageRange && (
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                    {stage.ageRange}
                  </span>
                )}
              </div>
              {stage.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{stage.description}</p>
              )}
            </Link>
          ))}
          {stages.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-md">
              暂无课程阶段，请在后台添加
            </div>
          )}
        </div>
      </section>

      {/* 器材档案库 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Wrench size={18} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">器材档案库</h2>
          </div>
          <Link
            to="/hardware/tools"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            查看全部 <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {toolCategories.map((cat) => (
            <Link
              key={cat._id}
              to={`/hardware/tools?categoryId=${cat._id}`}
              className="bg-white border border-gray-200 rounded-md p-4 text-center hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 bg-gray-50 rounded-md mx-auto mb-2 flex items-center justify-center">
                <Wrench size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {cat.name}
              </div>
            </Link>
          ))}
          {toolCategories.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-md">
              暂无器材分类，请在后台添加
            </div>
          )}
        </div>
      </section>

      {/* 资源库入口 */}
      <section className="mt-8">
        <div className="flex items-center space-x-2 mb-4">
          <Library size={18} className="text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">资源库</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['代码片段', '接线图库', '赛事考级', '网站导航'].map((item) => (
            <div
              key={item}
              className="bg-gray-50 border border-gray-100 rounded-md p-4 text-center text-sm text-gray-400"
            >
              {item}
              <span className="block text-xs mt-1">建设中</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
