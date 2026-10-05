import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { lessonAPI } from '../../services/api.js';
import {
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  FileText,
  Image as ImageIcon,
  Code,
  Lightbulb,
  Download,
  ExternalLink
} from 'lucide-react';

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ppt');
  const [fullscreen, setFullscreen] = useState(false);
  const [codeImageIndex, setCodeImageIndex] = useState(0);
  const [wiringIndex, setWiringIndex] = useState(0);

  useEffect(() => {
    loadLesson();
  }, [id]);

  const loadLesson = async () => {
    setLoading(true);
    try {
      const res = await lessonAPI.getDetail(id);
      if (res.status === 'success') {
        setLesson(res.data);
      }
    } catch (error) {
      console.error('加载课件详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  if (!lesson) {
    return <div className="text-gray-500">课件不存在</div>;
  }

  const pptAttachments = lesson.attachments?.filter(a => a.fileType === 'ppt') || [];
  const pdfAttachments = lesson.attachments?.filter(a => a.fileType === 'pdf') || [];
  const docAttachments = lesson.attachments?.filter(a => a.fileType === 'doc') || [];
  const otherAttachments = lesson.attachments?.filter(a => !['ppt', 'pdf', 'doc'].includes(a.fileType)) || [];

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`max-w-4xl mx-auto ${fullscreen ? 'max-w-none' : ''}`}>
      {/* 面包屑 */}
      <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
        <Link to="/hardware" className="hover:text-gray-600">总览</Link>
        <ChevronRight size={14} />
        <Link
          to={`/hardware/lessons?stageId=${lesson.stageId?._id}`}
          className="hover:text-gray-600"
        >
          {lesson.stageId?.name || '课程体系'}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-600">{lesson.title}</span>
      </div>

      {/* 标题区 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-semibold text-gray-900">{lesson.title}</h1>
            {lesson.tag && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                {lesson.tag}
              </span>
            )}
          </div>
          {lesson.subtitle && (
            <p className="text-gray-500 mt-1">{lesson.subtitle}</p>
          )}
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
            {lesson.duration && <span>课时：{lesson.duration}</span>}
            {lesson.ageRange && <span>适用：{lesson.ageRange}</span>}
            {lesson.lessonNumber && <span>第 {lesson.lessonNumber} 节</span>}
          </div>
        </div>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="p-2 border border-gray-200 rounded-md text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
          title={fullscreen ? '退出全屏' : '全屏模式'}
        >
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* 课程简介 */}
      {lesson.summary && (
        <div className="bg-gray-50 border border-gray-100 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">课程简介</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {lesson.summary}
          </p>
        </div>
      )}

      {/* 附件列表 */}
      {lesson.attachments?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <FileText size={14} className="mr-2" />
            课程附件（{lesson.attachments.length} 个）
          </h3>
          <div className="space-y-2">
            {lesson.attachments.map((att) => (
              <div
                key={att._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded flex items-center justify-center">
                    <FileText size={14} className="text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-700">{att.originalName}</div>
                    <div className="text-xs text-gray-400">
                      {att.fileType?.toUpperCase()} · {formatFileSize(att.fileSize)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {att.fileType === 'pdf' && (
                    <a
                      href={att.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-colors"
                    >
                      在线预览
                    </a>
                  )}
                  <a
                    href={att.filePath}
                    download={att.originalName}
                    className="px-3 py-1.5 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors flex items-center space-x-1"
                  >
                    <Download size={12} />
                    <span>下载</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 标签切换 */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-6">
          {pptAttachments.length > 0 && (
            <button
              onClick={() => setActiveTab('ppt')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'ppt'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              PPT 课件
            </button>
          )}
          {pdfAttachments.length > 0 && (
            <button
              onClick={() => setActiveTab('pdf')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pdf'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              教案 PDF
            </button>
          )}
          {lesson.codeImages?.length > 0 && (
            <button
              onClick={() => setActiveTab('code')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'code'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              图形化程序
            </button>
          )}
          {lesson.wiringImages?.length > 0 && (
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
          {lesson.teacherNotes && (
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              教学备注
            </button>
          )}
        </div>
      </div>

      {/* 标签内容 */}
      <div className="min-h-[400px]">
        {activeTab === 'ppt' && pptAttachments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <p className="text-sm text-gray-500 mb-4">
              PPT 文件请下载后使用 PowerPoint 或 WPS 打开播放，获得最佳演示效果。
            </p>
            <div className="flex items-center justify-center py-8 bg-gray-50 rounded">
              <div className="text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400 mb-4">{pptAttachments[0].originalName}</p>
                <a
                  href={pptAttachments[0].filePath}
                  download={pptAttachments[0].originalName}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  <Download size={14} />
                  <span>下载 PPT</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pdf' && pdfAttachments.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <iframe
              src={pdfAttachments[0].filePath}
              className="w-full"
              style={{ height: '70vh', minHeight: '500px' }}
              title={pdfAttachments[0].originalName}
            />
          </div>
        )}

        {activeTab === 'code' && lesson.codeImages?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                第 {codeImageIndex + 1} / {lesson.codeImages.length} 张
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCodeImageIndex(i => Math.max(0, i - 1))}
                  disabled={codeImageIndex === 0}
                  className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCodeImageIndex(i => Math.min(lesson.codeImages.length - 1, i + 1))}
                  disabled={codeImageIndex === lesson.codeImages.length - 1}
                  className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="flex justify-center bg-gray-50 rounded p-4">
              <img
                src={lesson.codeImages[codeImageIndex]}
                alt={`图形化程序 ${codeImageIndex + 1}`}
                className="max-w-full h-auto rounded border border-gray-200"
              />
            </div>
          </div>
        )}

        {activeTab === 'wiring' && lesson.wiringImages?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                第 {wiringIndex + 1} / {lesson.wiringImages.length} 张
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setWiringIndex(i => Math.max(0, i - 1))}
                  disabled={wiringIndex === 0}
                  className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setWiringIndex(i => Math.min(lesson.wiringImages.length - 1, i + 1))}
                  disabled={wiringIndex === lesson.wiringImages.length - 1}
                  className="p-1.5 border border-gray-200 rounded text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div className="flex justify-center bg-gray-50 rounded p-4">
              <img
                src={lesson.wiringImages[wiringIndex]}
                alt={`接线图 ${wiringIndex + 1}`}
                className="max-w-full h-auto rounded border border-gray-200"
              />
            </div>
          </div>
        )}

        {activeTab === 'notes' && lesson.teacherNotes && (
          <div className="bg-amber-50 border border-amber-100 rounded-md p-4">
            <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center">
              <Lightbulb size={14} className="mr-2" />
              教学备注（仅自己可见）
            </h4>
            <div className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
              {lesson.teacherNotes}
            </div>
          </div>
        )}
      </div>

      {/* 课程正文 */}
      {lesson.content && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-base font-medium text-gray-900 mb-4">课程内容</h3>
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </div>
      )}

      {/* 相关器材 */}
      {lesson.relatedTools?.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-base font-medium text-gray-900 mb-4">相关器材</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {lesson.relatedTools.map((tool) => (
              <Link
                key={tool._id}
                to={`/hardware/tools/${tool._id}`}
                className="bg-white border border-gray-200 rounded-md p-3 text-center hover:border-gray-300 hover:shadow-sm transition-all"
              >
                {tool.image ? (
                  <img
                    src={tool.image}
                    alt={tool.name}
                    className="w-full h-16 object-contain mb-2"
                  />
                ) : (
                  <div className="w-full h-16 bg-gray-50 flex items-center justify-center mb-2">
                    <ImageIcon size={20} className="text-gray-300" />
                  </div>
                )}
                <div className="text-sm text-gray-700 truncate">{tool.name}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
