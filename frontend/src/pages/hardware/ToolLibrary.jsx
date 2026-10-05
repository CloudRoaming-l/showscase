import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toolAPI, toolCategoryAPI } from '../../services/api.js';
import { Search, ChevronRight, Wrench, Image as ImageIcon } from 'lucide-react';

export default function ToolLibrary() {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId') || '';

  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTools();
  }, [categoryId, page]);

  const loadCategories = async () => {
    try {
      const res = await toolCategoryAPI.getList();
      if (res.status === 'success') {
        setCategories(res.data);
        if (categoryId) {
          const cat = res.data.find(c => c._id === categoryId);
          setCurrentCategory(cat);
        }
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadTools = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (categoryId) params.categoryId = categoryId;
      const res = await toolAPI.getList(params);
      if (res.status === 'success') {
        setTools(res.data.list);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error('加载器材列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: 搜索功能
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
          <Link to="/hardware" className="hover:text-gray-600">总览</Link>
          <ChevronRight size={14} />
          <span className="text-gray-600">
            {currentCategory ? currentCategory.name : '器材档案库'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            器材档案库
            <span className="text-sm font-normal text-gray-400 ml-2">共 {total} 件</span>
          </h1>
          <form onSubmit={handleSearch} className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索器材..."
              className="w-56 pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 bg-white"
            />
          </form>
        </div>
      </div>

      {/* 分类切换 */}
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-2">
        <Link
          to="/hardware/tools"
          className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
            !categoryId
              ? 'bg-gray-800 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          全部
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat._id}
            to={`/hardware/tools?categoryId=${cat._id}`}
            className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
              categoryId === cat._id
                ? 'bg-gray-800 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* 器材列表 */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : tools.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-md">
          <Wrench size={32} className="mx-auto text-gray-300 mb-3" />
          <div className="text-gray-400 text-sm">暂无器材</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool._id}
              to={`/hardware/tools/${tool._id}`}
              className="bg-white border border-gray-200 rounded-md overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all group"
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center p-4">
                {tool.image ? (
                  <img
                    src={tool.image}
                    alt={tool.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <ImageIcon size={32} className="text-gray-300" />
                )}
              </div>
              <div className="p-3 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700 truncate">
                  {tool.name}
                </div>
                {tool.model && (
                  <div className="text-xs text-gray-400 mt-0.5 truncate">{tool.model}</div>
                )}
                {tool.summary && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {tool.summary}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
