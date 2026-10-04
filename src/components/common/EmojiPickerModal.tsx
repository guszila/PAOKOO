import React, { useState, useMemo } from 'react';
import { BottomSheet } from './BottomSheet';
import { EXPENSE_EMOJI_GROUPS, POPULAR_EXPENSE_EMOJIS } from '../../config/emojis';
import { Search, X, Sparkles } from 'lucide-react';

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  currentEmoji?: string | null;
}

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  currentEmoji,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      if (activeTab === 'all') return EXPENSE_EMOJI_GROUPS;
      return EXPENSE_EMOJI_GROUPS.filter((g) => g.name === activeTab);
    }

    return EXPENSE_EMOJI_GROUPS.map((group) => {
      // If group name matches query, keep all
      if (group.name.toLowerCase().includes(q)) return group;
      // Filter individual emojis (some platforms support emoji search)
      return {
        ...group,
        emojis: group.emojis.filter((e) => e.includes(q)),
      };
    }).filter((g) => g.emojis.length > 0);
  }, [searchQuery, activeTab]);

  const handlePick = (emoji: string) => {
    onSelectEmoji(emoji);
    if (localStorage.getItem('paokoo_haptic_enabled') !== 'false' && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="เลือก Emoji รายจ่าย">
      <div className="space-y-4 max-h-[75vh] flex flex-col pb-2">
        {/* Search & Hint */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาหมวด เช่น อาหาร, เดินทาง, ช้อป..."
              className="w-full pl-8 pr-8 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          {!searchQuery && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap border transition-all ${
                  activeTab === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium shadow-sm'
                    : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-border-light dark:border-border-dark'
                }`}
              >
                ทั้งหมด
              </button>
              {EXPENSE_EMOJI_GROUPS.map((g) => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => setActiveTab(g.name)}
                  className={`text-xs px-2.5 py-1 rounded-xl whitespace-nowrap border transition-all flex items-center gap-1 ${
                    activeTab === g.name
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-medium shadow-sm'
                      : 'bg-surface-light dark:bg-surface-dark text-neutral-600 dark:text-neutral-400 border-border-light dark:border-border-dark'
                  }`}
                >
                  <span>{g.icon}</span>
                  <span>{g.name.split('&')[0].trim()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular Quick Row */}
        {!searchQuery && activeTab === 'all' && (
          <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">
              <Sparkles size={12} />
              <span>ใช้บ่อยยอดนิยม</span>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 pt-0.5">
              {POPULAR_EXPENSE_EMOJIS.slice(0, 16).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handlePick(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl hover:scale-110 active:scale-95 transition-all select-none ${
                    currentEmoji === emoji
                      ? 'bg-amber-200 dark:bg-amber-900 ring-2 ring-amber-500'
                      : 'hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Emoji Groups List */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {filteredGroups.map((group) => (
            <div key={group.name} className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <span>{group.icon}</span>
                <span>{group.name}</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  ({group.emojis.length})
                </span>
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handlePick(emoji)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-2xl hover:scale-110 active:scale-95 transition-all select-none bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-neutral-400 ${
                      currentEmoji === emoji
                        ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                        : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="py-8 text-center text-xs text-neutral-400">
              ไม่พบ Emoji ที่ตรงกับการค้นหา
            </div>
          )}
        </div>

        {/* Keyboard Tip Footer */}
        <div className="pt-2 border-t border-border-light dark:border-border-dark text-center">
          <p className="text-[11px] text-neutral-400">
            💡 หรือพิมพ์/เลือก Emoji อิสระผ่านปุ่ม 😊 บนคีย์บอร์ดมือถือ หรือกด <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono">Win + .</kbd> บน PC
          </p>
        </div>
      </div>
    </BottomSheet>
  );
};
