import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export default function Pagination({ page, limit = 10, totalPages, totalItems = 0, onPageChange, onLimitChange }) {
  if (totalItems === 0) return null;

  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 w-full">
      {/* Left side: Limit Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#949ba4]">Hiển thị</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange?.(Number(e.target.value))}
          className="bg-[#1e1f22] border border-[#1f2023] text-[#dbdee1] text-xs rounded p-1.5 focus:outline-none cursor-pointer"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span className="text-xs text-[#949ba4]">
          / {totalItems} dòng
        </span>
      </div>

      {/* Right side: Page Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-[#1f2023] bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="w-8 h-8 rounded-lg border border-[#1f2023] bg-[#2b2d31] text-xs font-semibold text-[#dbdee1] hover:bg-[#35373c] transition-colors"
              >
                1
              </button>
              {startPage > 2 && (
                <span className="w-8 h-8 flex items-center justify-center text-[#949ba4]">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              )}
            </>
          )}

          {pages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                page === p
                  ? 'bg-indigo-600 text-white border-transparent'
                  : 'border border-[#1f2023] bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c]'
              }`}
            >
              {p}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="w-8 h-8 flex items-center justify-center text-[#949ba4]">
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 rounded-lg border border-[#1f2023] bg-[#2b2d31] text-xs font-semibold text-[#dbdee1] hover:bg-[#35373c] transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-[#1f2023] bg-[#2b2d31] text-[#dbdee1] hover:bg-[#35373c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
