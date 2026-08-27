import { useState } from 'react';
import { X, ShoppingBag, Check, Lock, Zap, Atom, Coins, Star, Wand, Crown, Sparkle, Moon } from 'lucide-react';
import { SHOP_ITEMS } from '@/lib/gamification';
import type { ShopItem, ShopCategory, ShopState } from '@/lib/gamification';
import { getShopState, purchaseItem, activateItem, getNuts } from '@/lib/gamification';

interface NutShopProps {
  open: boolean;
  onClose: () => void;
  onPurchase: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Crown: <Crown className="h-5 w-5" />,
  Sparkle: <Sparkle className="h-5 w-5" />,
  Moon: <Moon className="h-5 w-5" />,
  Zap: <Zap className="h-5 w-5" />,
  Atom: <Atom className="h-5 w-5" />,
  Coins: <Coins className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  Wand: <Wand className="h-5 w-5" />,
};

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  theme: 'UI-Themes',
  badge: 'Profil-Titel & Badges',
  fx: 'Animation-FX Upgrades',
};

export default function NutShop({ open, onClose, onPurchase }: NutShopProps) {
  const [shopState, setShopState] = useState<ShopState>(() => getShopState());
  const [nuts, setNuts] = useState(() => getNuts());
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const refresh = () => {
    setShopState(getShopState());
    setNuts(getNuts());
    onPurchase();
  };

  const handleBuy = (item: ShopItem) => {
    setError(null);
    const result = purchaseItem(item.id);
    if (!result.success) {
      setError(result.error || 'Kauf fehlgeschlagen.');
    } else {
      refresh();
    }
  };

  const handleActivate = (item: ShopItem) => {
    activateItem(item.id);
    refresh();
  };

  const categories: ShopCategory[] = ['theme', 'badge', 'fx'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-slate-800 p-6 ring-1 ring-slate-700/50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            Nuss-Shop
          </h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-lg bg-slate-900/50 px-3 py-1.5 text-sm font-bold text-amber-400 ring-1 ring-amber-700/30">
              🥜 {nuts}
            </span>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <p className="mb-4 text-xs text-slate-500 leading-relaxed">
          Sammle Nüsse durch das Erreichen täglicher Ziele — 1 Nuss pro Makro- oder Mikronährstoff, der 100% erreicht.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-950/40 p-3 text-sm text-rose-300 ring-1 ring-rose-900/50">
            {error}
          </div>
        )}

        {categories.map((cat) => {
          const items = SHOP_ITEMS.filter((i) => i.category === cat);
          return (
            <div key={cat} className="mb-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="space-y-2">
                {items.map((item) => {
                  const purchased = shopState.purchased.includes(item.id);
                  const isActive =
                    (cat === 'theme' && shopState.activeTheme === item.id) ||
                    (cat === 'badge' && shopState.activeBadge === item.id) ||
                    (cat === 'fx' && shopState.activeFx === item.id);
                  const canAfford = nuts >= item.price;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 rounded-xl p-3 ring-1 transition-all ${
                        isActive
                          ? 'bg-emerald-950/30 ring-emerald-800/40'
                          : purchased
                            ? 'bg-slate-900/40 ring-slate-700/40'
                            : 'bg-slate-900/40 ring-slate-800/50'
                      }`}
                    >
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
                        purchased ? 'bg-slate-700/50 text-slate-300' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {ICON_MAP[item.icon] || <Star className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.description}</div>
                      </div>
                      <div className="flex-shrink-0">
                        {purchased ? (
                          isActive ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                              <Check className="h-4 w-4" />
                              Aktiv
                            </span>
                          ) : (
                            <button
                              onClick={() => handleActivate(item)}
                              className="rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 active:scale-95"
                            >
                              Aktivieren
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={!canAfford}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                              canAfford
                                ? 'bg-amber-600/20 text-amber-400 ring-1 ring-amber-700/30 hover:bg-amber-600/30'
                                : 'bg-slate-700/30 text-slate-600'
                            }`}
                          >
                            {canAfford ? null : <Lock className="h-3 w-3" />}
                            🥜 {item.price}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
