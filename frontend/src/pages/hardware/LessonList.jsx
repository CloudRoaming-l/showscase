import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { lessonAPI, stageAPI } from '../../services/api.js';
import { Search, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export default function LessonList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const stageId = searchParams.get('stageId') || '';
  const keywordParam = searchParams.get('keyword') || '';

  const [lessons, setLessons] = useState([]);
  const [stages, setStages] = useState([]);
  const [currentStage, setCurrentStage] = useState(null);
  const [keyword, setKeyword] = useState(keywordParam);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStages();
  }, []);

  useEffect(() => {
    loadLessons();
  }, [stageId, page]);

  const loadStages = async () => {
    try {
      const res = await stageAPI.getList();
      if (res.status === 'success') {
        setStages(res.data);
        if (stageId) {
          const stage = res.data.find(s => s._id === stageId);
          setCurrentStage(stage);
        }
      }
    } catch (error) {
      console.error('加载阶段失败:', error);
    }
  };

  const loadLessons = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (stageId) params.stageId = stageId;
      if (keywordParam) params.keyword = keywordParam;

      const res = await lessonAPI.getList(params);
      if (res.status === 'success') {
        setLessons(res.data.list);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (error) {
      console.error('加载课件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (stageId) params.stageId = stageId;
    if (keyword.trim()) params.keyword = keyword;
    setPage(1);
    navigate({
      pathname: '/hardware/lessons',
      search: new URLSearchParams(params).toString()
    });
  };

  const handleStageClick = (stage) => {
    setPage(1);
    navigate({
      pathname: '/hardware/lessons',
      search: stage ? `stageId=${stage._id}` : ''
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          <Link to="/hardware" className="hover:text-gray-600">总览</Link>
          <ChevronRight size={14} />
          <span className="text-gray-600">
            {currentStage ? currentStage.name : '全部课件'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {currentStage ? currentStage.name : '全部课件'}
            <span className="text-sm font-normal text-gray-400 ml-2">共 {total} 节</span>
          </h1>
          <form onSubmit={handleSearch} className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索课件..."
              className="w-56 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white"
            />
          </form>
        </div>
      </div>

      {/* 阶段切换 */}
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => handleStageClick(null)}
          className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
            !stageId
              ? 'bg-gray-800 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          全部
        </button>
        {stages.map((stage) => (
          <button
            key={stage._id}
            onClick={() => handleStageClick(stage)}
            className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
              stageId === stage._id
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {stage.shortName || stage.name}
          </button>
        ))}
      </div>

      {/* 课件列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-md">
          <BookOpen size={32} className="mx-auto text-gray-300 mb-3" />
          <div className="text-gray-400 text-sm">暂无课件</div>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <Link
              key={lesson._id}
              to={`/hardware/lessons/${lesson._id}`}
              className="block bg-white border border-gray-200 rounded-md p-4 hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-400 w-8 text-right">
                    {String(index + 1 + (page - 1) * 20).padStart(2, '0')}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-medium text-gray-900 group-hover:text-gray-700">
                        {lesson.title}
                      </span>
                      {lesson.tag && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                          {lesson.tag}
                        </span>
                      )}
                    </div>
                    {lesson.summary && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                        {lesson.summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs text-gray-400">
                  {lesson.duration && <span>{lesson.duration}</span>}
                  {lesson.attachments?.length > 0 && (
                    <span>{lesson.attachments.length} 个附件</span>
                  )}
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-gray-200 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border border-gray-200 rounded-md text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
