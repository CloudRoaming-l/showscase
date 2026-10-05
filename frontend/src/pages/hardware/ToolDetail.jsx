import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toolAPI } from '../../services/api.js';
import { ChevronRight, Image as ImageIcon, BookOpen, Lightbulb } from 'lucide-react';

export default function ToolDetail() {
  const { id } = useParams();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('principle');

  useEffect(() => {
    loadTool();
  }, [id]);

  const loadTool = async () => {
    setLoading(true);
    try {
      const res = await toolAPI.getDetail(id);
      if (res.status === 'success') {
        setTool(res.data);
      }
    } catch (error) {
      console.error('加载器材详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  if (!tool) {
    return <div className="text-gray-500">器材不存在</div>;
  }

  const allImages = tool.image ? [tool.image, ...(tool.images || [])] : (tool.images || []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 面包屑 */}
      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
        <Link to="/hardware" className="hover:text-gray-600">总览</Link>
        <ChevronRight size={14} />
        <Link to="/hardware/tools" className="hover:text-gray-600">器材档案库</Link>
        <ChevronRight size={14} />
        {tool.categoryId && (
          <>
            <Link
              to={`/hardware/tools?categoryId=${tool.categoryId._id}`}
              className="hover:text-gray-600"
            >
              {tool.categoryId.name}
            </Link>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-gray-600">{tool.name}</span>
      </div>

      {/* 头部 */}
      <div className="bg-white border border-gray-200 rounded-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 图片区 */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="aspect-square bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center p-4 mb-3">
              {allImages.length > 0 ? (
                <img
                  src={allImages[activeImageIndex]}
                  alt={tool.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <ImageIcon size={48} className="text-gray-300" />
              )}
            </div>
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`aspect-square bg-gray-50 border rounded p-1 flex items-center justify-center ${
                      activeImageIndex === idx
                        ? 'border-gray-800'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="" className="max-w-full max-h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 信息区 */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">{tool.name}</h1>
            {tool.model && (
              <div className="text-gray-500 mb-4">型号：{tool.model}</div>
            )}
            {tool.summary && (
              <p className="text-gray-600 leading-relaxed mb-4">{tool.summary}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {tool.categoryId && (
                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded">
                  {tool.categoryId.name}
                </span>
              )}
              {tool.applicableStages?.map((stage) => (
                <span key={stage._id} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded">
                  {stage.shortName || stage.name}
                </span>
              ))}
              {tool.price && (
                <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-600 rounded">
                  参考价：{tool.price}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-6">
          {tool.principle && (
            <button
              onClick={() => setActiveTab('principle')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'principle'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              工作原理
            </button>
          )}
          {tool.specifications && (
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'specs'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              技术参数
            </button>
          )}
          {tool.usage && (
            <button
              onClick={() => setActiveTab('usage')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'usage'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              使用方法
            </button>
          )}
          {tool.exampleCode && (
            <button
              onClick={() => setActiveTab('code')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'code'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              示例代码
            </button>
          )}
          {tool.wiringImages?.length > 0 && (
            <button
              onClick={() => setActiveTab('wiring')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'wiring'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              接线图
            </button>
          )}
          {tool.pinout && (
            <button
              onClick={() => setActiveTab('pinout')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pinout'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              引脚说明
            </button>
          )}
          {tool.teacherNotes && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              教学心得
            </button>
          )}
        </div>
      </div>

      {/* 标签内容 */}
      <div className="min-h-[300px]">
        {activeTab === 'principle' && tool.principle && (
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: tool.principle }}
            />
          </div>
        )}

        {activeTab === 'specs' && tool.specifications && (
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: tool.specifications }}
            />
          </div>
        )}

        {activeTab === 'usage' && tool.usage && (
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: tool.usage }}
            />
          </div>
        )}

        {activeTab === 'code' && tool.exampleCode && (
          <div className="bg-gray-900 rounded-md overflow-hidden">
            <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
              <code>{tool.exampleCode}</code>
            </pre>
          </div>
        )}

        {activeTab === 'wiring' && tool.wiringImages?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <div className="space-y-4">
              {tool.wiringImages.map((img, idx) => (
                <div key={idx} className="flex justify-center bg-gray-50 rounded p-4">
                  <img
                    src={img}
                    alt={`接线图 ${idx + 1}`}
                    className="max-w-full h-auto border border-gray-200 rounded"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pinout' && tool.pinout && (
          <div className="bg-white border border-gray-200 rounded-md p-6">
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: tool.pinout }}
            />
          </div>
        )}

        {activeTab === 'notes' && tool.teacherNotes && (
          <div className="bg-amber-50 border border-amber-100 rounded-md p-6">
            <h4 className="text-sm font-medium text-amber-800 mb-3 flex items-center">
              <Lightbulb size={14} className="mr-2" />
              教学心得与注意事项（仅自己可见）
            </h4>
            <div
              className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: tool.teacherNotes }}
            />
          </div>
        )}
      </div>

      {/* 采购备注 */}
      {tool.purchaseNote && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">采购备注</h4>
          <p className="text-sm text-gray-600">{tool.purchaseNote}</p>
        </div>
      )}
    </div>
  );
}
