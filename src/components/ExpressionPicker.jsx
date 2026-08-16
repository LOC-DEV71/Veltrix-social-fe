import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Search, Clock, Image as ImageIcon, Crown, Lock } from 'lucide-react';

const PREDEFINED_STICKERS = [
  { url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif', name: 'Cat Love', pack: 'Meow' },
  { url: 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif', name: 'Cat Cool', pack: 'Meow' },
  { url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', name: 'Cat Type', pack: 'Meow' },
  { url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif', name: 'Cat Computer', pack: 'Meow' },
  { url: 'https://media.giphy.com/media/q1MeAPDDMb43K/giphy.gif', name: 'Cat Lightsaber', pack: 'Meow' },
  { url: 'https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif', name: 'Cat Roll', pack: 'Meow' },
  { url: 'https://media.giphy.com/media/BzyTuYCmvSORqs1QKs/giphy.gif', name: 'Cat Oops', pack: 'Meow' },
];

export default function ExpressionPicker({ onEmojiClick, onStickerClick, initialTab = 'sticker', user = null, community = null, communities = [] }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeCategory, setActiveCategory] = useState('recent');
  const [hoveredSticker, setHoveredSticker] = useState(null);

  const STICKER_CATEGORIES = [
    {
      id: 'recent',
      icon: <Clock className="w-[22px] h-[22px]" />,
      name: 'Thường được sử dụng'
    },
    {
      id: 'custom',
      icon: <ImageIcon className="w-[22px] h-[22px]" />,
      name: 'Nhãn dán của bạn'
    }
  ];

  const allComms = [];
  if (community) allComms.push(community);
  if (communities && communities.length > 0) {
    communities.forEach(c => {
      if (!allComms.find(existing => existing._id === c._id)) {
        allComms.push(c);
      }
    });
  }

  allComms.forEach(c => {
    STICKER_CATEGORIES.push({
      id: `community_${c._id}`,
      communityRef: c,
      icon: c.icon ? (
        <img src={c.icon} alt={c.name} className="w-[22px] h-[22px] rounded-full object-cover" />
      ) : (
        <div className="w-[22px] h-[22px] rounded-full bg-[#5865F2] flex items-center justify-center text-[10px] font-bold text-white">
          {c.name.charAt(0)}
        </div>
      ),
      name: c.name
    });
  });

  return (
    <div className="absolute bottom-full right-0 mb-2 z-50 flex flex-col bg-[#2b2d31] rounded-lg shadow-2xl w-[420px] h-[480px] border border-[#1f2023] overflow-hidden select-none">
      
      {/* Header Tabs */}
      <div className="flex items-center px-4 pt-3 pb-2 gap-4 border-b border-[#1f2023]/50">
        {['Ảnh động', 'Sticker', 'Emoji'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab === 'Emoji' ? 'emoji' : 'sticker')}
            className={`font-semibold text-sm transition-colors ${
              (activeTab === 'emoji' && tab === 'Emoji') || (activeTab === 'sticker' && tab === 'Sticker')
                ? 'text-[#dbdee1] bg-[#404249] px-3 py-1 rounded-md'
                : 'text-[#b5bac1] hover:text-[#dbdee1] px-3 py-1'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'emoji' ? (
        <div className="flex-1 w-full bg-[#2b2d31] custom-emoji-picker-container">
          <EmojiPicker 
            onEmojiClick={(emojiData, event) => {
              if (emojiData.isCustom) {
                if (!user?.isPremium) {
                  alert('Yêu cầu Vetrix Premium để sử dụng Custom Emoji!');
                  return;
                }
                onEmojiClick({ ...emojiData, imageUrl: emojiData.imgUrl }, event);
              } else {
                onEmojiClick(emojiData, event);
              }
            }}
            customEmojis={
              allComms.flatMap(c => 
                (c.emojis || []).map(e => ({
                  id: e._id || e.name,
                  names: [e.name],
                  imgUrl: e.url
                }))
              )
            }
            theme="dark"
            searchDisabled={false}
            skinTonesDisabled={true}
            width="100%"
            height="100%"
          />
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Search Bar */}
          <div className="px-4 py-3">
            <div className="bg-[#1e1f22] rounded flex items-center px-2 py-1.5 focus-within:ring-1 focus-within:ring-[#00a8fc]">
              <input 
                type="text"
                placeholder="Tìm kiếm nhãn dán"
                className="bg-transparent text-sm text-[#dbdee1] placeholder-[#949ba4] focus:outline-none w-full px-1"
              />
              <Search className="w-4 h-4 text-[#949ba4]" />
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 min-h-0">
            {/* Sidebar */}
            <div className="w-[48px] bg-[#2b2d31] flex flex-col items-center py-2 gap-2 overflow-y-auto no-scrollbar border-r border-[#1f2023]/30">
              {STICKER_CATEGORIES.map(cat => (
                <div 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-8 h-8 flex items-center justify-center rounded-[16px] cursor-pointer transition-all duration-200 ${
                    activeCategory === cat.id ? 'bg-[#5865F2] text-white rounded-[10px]' : 'bg-[#313338] text-[#b5bac1] hover:bg-[#404249] hover:text-white hover:rounded-[10px]'
                  }`}
                  title={cat.name}
                >
                  {cat.icon}
                </div>
              ))}
            </div>

            {/* Sticker Grid / Premium Gate */}
            <div className="flex-1 bg-[#2b2d31] flex flex-col min-h-0 relative">
              <div className="flex-1 overflow-y-auto p-3 no-scrollbar pb-[60px]">
                
                {/* RECENT CATEGORY */}
                {activeCategory === 'recent' && (
                  <>
                    <div className="text-[#b5bac1] font-semibold text-xs mb-3 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Thường được sử dụng
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {PREDEFINED_STICKERS.map((sticker, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => onStickerClick(sticker.url)}
                          onMouseEnter={() => setHoveredSticker(sticker)}
                          onMouseLeave={() => setHoveredSticker(null)}
                          className="aspect-square bg-transparent rounded hover:bg-[#383a40] cursor-pointer transition-colors p-1 flex items-center justify-center group"
                        >
                          <img src={sticker.url} alt="sticker" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-200" />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* CUSTOM CATEGORY */}
                {activeCategory === 'custom' && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-[#2b2d31] border-2 border-[#1f2023] flex items-center justify-center mb-4 relative">
                      <ImageIcon className="w-8 h-8 text-[#b5bac1]" />
                      {!user?.isPremium && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#f47f1a] rounded-full flex items-center justify-center shadow-lg">
                          <Lock className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-white font-semibold mb-2">Nhãn dán của bạn</h3>
                    <p className="text-[#b5bac1] text-xs mb-4">
                      Tải lên nhãn dán riêng của bạn. {user?.isPremium ? 'Chỉ bạn mới có thể thấy và sử dụng.' : 'Yêu cầu Vetrix Premium.'}
                    </p>
                    <button 
                      className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                        user?.isPremium 
                          ? 'bg-[#5865F2] hover:bg-[#4752c4] text-white' 
                          : 'bg-[#f47f1a] hover:bg-[#d67017] text-white flex items-center gap-2'
                      }`}
                    >
                      {!user?.isPremium && <Crown className="w-4 h-4" />}
                      Tải lên nhãn dán
                    </button>
                  </div>
                )}

                {/* COMMUNITY CATEGORY */}
                {activeCategory.startsWith('community_') && (() => {
                  const activeComm = allComms.find(c => `community_${c._id}` === activeCategory);
                  if (!activeComm) return null;
                  
                  // MỌI Custom Sticker/Emoji đều yêu cầu Premium (Theo yêu cầu của bạn)
                  const requiresPremium = !user?.isPremium;
                  const hasStickers = activeComm.stickers && activeComm.stickers.length > 0;
                  
                  if (!requiresPremium && hasStickers) {
                    return (
                      <>
                        <div className="text-[#b5bac1] font-semibold text-xs mb-3 flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" /> Nhãn dán {activeComm.name}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {activeComm.stickers.map((sticker, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => onStickerClick(sticker.url)}
                              onMouseEnter={() => setHoveredSticker({ ...sticker, pack: activeComm.name })}
                              onMouseLeave={() => setHoveredSticker(null)}
                              className="aspect-square bg-transparent rounded hover:bg-[#383a40] cursor-pointer transition-colors p-1 flex items-center justify-center group"
                            >
                              <img src={sticker.url} alt="sticker" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-200" />
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  }

                  return (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-[#2b2d31] border-2 border-[#1f2023] flex items-center justify-center mb-4 overflow-hidden relative">
                        {activeComm.icon ? (
                          <img src={activeComm.icon} alt={activeComm.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#5865F2] flex items-center justify-center text-xl font-bold text-white">
                            {activeComm.name.charAt(0)}
                          </div>
                        )}
                        {requiresPremium && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#f47f1a] rounded-full flex items-center justify-center shadow-lg">
                            <Lock className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-white font-semibold mb-2">Nhãn dán {activeComm.name}</h3>
                      <p className="text-[#b5bac1] text-xs mb-4">
                        {requiresPremium
                          ? 'Sử dụng nhãn dán tùy chỉnh yêu cầu Vetrix Premium.'
                          : 'Chưa có nhãn dán nào được thêm vào cộng đồng này.'}
                      </p>
                      {requiresPremium && (
                        <button className="bg-[#f47f1a] hover:bg-[#d67017] text-white px-4 py-2 rounded font-semibold text-sm transition-colors flex items-center gap-2">
                          <Crown className="w-4 h-4" /> Nâng cấp Premium
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Hover Info Footer */}
              <div className="absolute bottom-0 left-0 right-0 h-[56px] bg-[#2b2d31] border-t border-[#1f2023]/50 flex items-center px-4 gap-3">
                {hoveredSticker ? (
                  <>
                    <img src={hoveredSticker.url} alt="preview" className="w-10 h-10 object-contain rounded" />
                    <div className="flex flex-col">
                      <span className="text-white text-sm font-semibold">{hoveredSticker.name}</span>
                      <span className="text-[#b5bac1] text-xs">từ {hoveredSticker.pack}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <img src={PREDEFINED_STICKERS[0].url} alt="preview" className="w-10 h-10 object-contain rounded opacity-50" />
                    <div className="flex flex-col">
                      <span className="text-white/50 text-sm font-semibold">Chọn một nhãn dán</span>
                      <span className="text-[#b5bac1]/50 text-xs">để gửi đi</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
