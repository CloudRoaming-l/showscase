import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100]
}) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-4">
      <div className="text-gray-400 text-sm">
        共 <span className="text-white font-medium">{totalItems}</span> 条，
        第 <span className="text-white font-medium">{currentPage}</span> / {totalPages} 页
      </div>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} 条/页
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-2 bg-gray-800/60 text-gray-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            title="第一页"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 bg-gray-800/60 text-gray-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            title="上一页"
          >
            <ChevronLeft size={16} />
          </button>

          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-800/60 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 bg-gray-800/60 text-gray-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            title="下一页"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-2 bg-gray-800/60 text-gray-400 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"
            title="最后一页"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
