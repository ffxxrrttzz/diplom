// src/components/profile/ProfileTabs.tsx
type Tab = 'posts' | 'reviews' | 'ratings' | 'threads'

const tabs: { key: Tab; label: string }[] = [
  { key: 'posts', label: 'Посты' },
  { key: 'reviews', label: 'Рецензии' },
  { key: 'ratings', label: 'Оценки' },
  { key: 'threads', label: 'Треды' },
]

export function ProfileTabs({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (tab: Tab) => void }) {
  return (
    <div className="flex flex-wrap gap-4 mt-8 mb-6">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onTabChange(key)}
          className={`px-6 py-2.5 rounded-[20px] text-[24px] font-medium transition-all border-2 ${
            activeTab === key
              ? 'bg-[#121216] border-[#d9d9d9] text-white'
              : 'bg-[#121216] border-transparent text-white hover:border-zinc-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}