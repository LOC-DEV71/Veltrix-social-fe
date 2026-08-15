import React from 'react';

const LinkPreview = ({ linkMetadata }) => {
  if (!linkMetadata || !linkMetadata.url) return null;

  const { title, description, image, url, siteName } = linkMetadata;
  
  // Get hostname for display
  let hostname = '';
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    hostname = siteName || url;
  }

  return (
    <div className="mt-2 flex">
      <div className="flex flex-col bg-[#2b2d31] rounded-xl overflow-hidden border border-[#1e1f22] max-w-[400px] hover:bg-[#313338] transition-colors shadow-sm">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col h-full cursor-pointer"
        >
          {/* Main Image */}
          {image && (
            <div className="w-full max-h-[220px] bg-[#1e1f22] overflow-hidden shrink-0 border-b border-[#1e1f22]">
              <img
                src={image}
                alt={title || siteName || 'Link preview'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Content Area */}
          <div className="flex flex-col p-3 flex-1">
            {title && (
              <span className="text-[15px] font-semibold text-[#dbdee1] line-clamp-2 mb-1 leading-snug">
                {title}
              </span>
            )}
            
            {description && (
              <span className="text-[13px] text-[#949ba4] line-clamp-2 leading-relaxed mb-2">
                {description}
              </span>
            )}

            {hostname && (
              <span className="text-[12px] text-[#00a8fc] hover:underline mt-auto truncate">
                {hostname}
              </span>
            )}
          </div>
        </a>
      </div>
    </div>
  );
};

export default LinkPreview;
