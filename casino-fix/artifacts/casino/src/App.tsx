import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Dice5,
  Gamepad2,
  Grid2X2,
  Heart,
  History,
  Home as HomeIcon,
  Info,
  LayoutDashboard,
  Menu,
  Play,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Spade,
  Sparkles,
  Trophy,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import bonusCenterBanner from '../../../assets/casino_ui/bonus_center_banner.jpeg';
import cryptoBonusBanner from '../../../assets/casino_ui/crypto_bonus_banner.png';
import depositCurrencyBanner from '../../../assets/casino_ui/deposit_currency_banner.jpeg';
import profileAccountBanner from '../../../assets/casino_ui/profile_account_banner.jpeg';
import rollersMenuBanner from '../../../assets/casino_ui/rollers_menu_banner.jpeg';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type NavKey = 'discover' | 'games' | 'wallet' | 'activity' | 'profile';
type FilterKey = 'all' | 'instant' | 'table' | 'featured';
type Game = {
  id: string;
  title: string;
  description: string;
  category: Exclude<FilterKey, 'all' | 'featured'>;
  players: string;
  accent: string;
  accentSoft: string;
  icon: LucideIcon;
  stat: string;
};
type ActivityItem = {
  id: number;
  title: string;
  detail: string;
  amount: number;
  time: string;
  positive?: boolean;
};

const games: Game[] = [
  {
    id: 'neon-roulette',
    title: 'Neon Roulette',
    description: 'Fast rounds. Clean lines. Pick your color.',
    category: 'table',
    players: '1.2k playing',
    accent: '#ee5461',
    accentSoft: '#ee54611a',
    icon: CircleDollarSign,
    stat: 'Popular now',
  },
  {
    id: 'rocket-run',
    title: 'Rocket Run',
    description: 'Read the rise. Lock your score before lift-off.',
    category: 'instant',
    players: '846 playing',
    accent: '#efb950',
    accentSoft: '#efb9501a',
    icon: ArrowUpRight,
    stat: 'New pulse',
  },
  {
    id: 'blackjack-21',
    title: 'Blackjack 21',
    description: 'A crisp, quick table for one decisive hand.',
    category: 'table',
    players: '538 playing',
    accent: '#63c7a1',
    accentSoft: '#63c7a11a',
    icon: Spade,
    stat: 'Low latency',
  },
  {
    id: 'lucky-lanes',
    title: 'Lucky Lanes',
    description: 'Three lanes. One tap. Keep the streak alive.',
    category: 'instant',
    players: '422 playing',
    accent: '#a88df1',
    accentSoft: '#a88df11a',
    icon: Dice5,
    stat: 'Quick play',
  },
  {
    id: 'high-card',
    title: 'High Card',
    description: 'A tiny classic for a tiny break between chats.',
    category: 'table',
    players: '201 playing',
    accent: '#ee8b63',
    accentSoft: '#ee8b631a',
    icon: Trophy,
    stat: 'Classic',
  },
  {
    id: 'coin-flip',
    title: 'Coin Flip',
    description: 'One clean choice. Heads or tails.',
    category: 'instant',
    players: '174 playing',
    accent: '#6d9ef4',
    accentSoft: '#6d9ef41a',
    icon: Sparkles,
    stat: '30 sec round',
  },
];

const initialActivity: ActivityItem[] = [
  { id: 1, title: 'Rocket Run', detail: 'Round complete', amount: 760, time: '8 min ago', positive: true },
  { id: 2, title: 'Neon Roulette', detail: 'Round played', amount: -250, time: '23 min ago' },
  { id: 3, title: 'Daily drop', detail: 'Virtual credits added', amount: 500, time: 'Today, 09:42', positive: true },
  { id: 4, title: 'Blackjack 21', detail: 'Round played', amount: -250, time: 'Yesterday, 21:16' },
];

function Home() {
  const [active, setActive] = useState<NavKey>('discover');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['rocket-run']);
  const [balance, setBalance] = useState(12480);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [modal, setModal] = useState<'wallet' | 'limits' | 'game' | 'activity' | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [notice, setNotice] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [limit, setLimit] = useState(3000);
  const [dailyPlayed, setDailyPlayed] = useState(1250);
  const [topUpAmount, setTopUpAmount] = useState(500);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 360);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredGames = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return games.filter((game) => {
      const matchesFilter = filter === 'all' || filter === 'featured'
        ? filter === 'all' || game.id === 'rocket-run' || game.id === 'neon-roulette'
        : game.category === filter;
      const matchesSearch = !needle || `${game.title} ${game.description}`.toLowerCase().includes(needle);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const formatCredits = (value: number) => `${value.toLocaleString('en-US')} cr`;

  const showNotice = (message: string) => setNotice(message);

  const openGame = (game: Game) => {
    setSelectedGame(game);
    setModal('game');
  };

  const playRound = () => {
    if (!selectedGame) return;
    if (balance < 250) {
      showNotice('You need 250 virtual credits to start a round.');
      return;
    }
    setBalance((current) => current - 250);
    setDailyPlayed((current) => current + 250);
    setActivity((current) => [
      { id: Date.now(), title: selectedGame.title, detail: 'Round played', amount: -250, time: 'Just now' },
      ...current,
    ]);
    setModal(null);
    showNotice(`${selectedGame.title} is ready. 250 virtual credits used.`);
  };

  const addCredits = () => {
    setBalance((current) => current + topUpAmount);
    setActivity((current) => [
      { id: Date.now(), title: 'Credit stash', detail: 'Virtual credits added', amount: topUpAmount, time: 'Just now', positive: true },
      ...current,
    ]);
    setModal(null);
    showNotice(`${formatCredits(topUpAmount)} added to your demo wallet.`);
  };

  const toggleFavorite = (gameId: string) => {
    setFavorites((current) => current.includes(gameId)
      ? current.filter((id) => id !== gameId)
      : [...current, gameId]);
    showNotice(favorites.includes(gameId) ? 'Removed from your saved games.' : 'Saved to your games.');
  };

  const goTo = (key: NavKey) => {
    setActive(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="casino-shell noise-layer min-h-[100dvh] text-[hsl(var(--foreground))]">
      <div className="flex min-h-[100dvh]">
        <Sidebar active={active} onNavigate={goTo} balance={balance} />
        <main className="min-w-0 flex-1 pb-24 md:pb-0">
          <Topbar
            active={active}
            search={search}
            setSearch={setSearch}
            onWallet={() => setModal('wallet')}
            onActivity={() => setModal('activity')}
          />
          {!isReady ? (
            <LoadingDashboard />
          ) : (
            <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-5 sm:px-6 lg:px-10 lg:pt-8">
              {active === 'discover' && (
                <DiscoverView
                  balance={balance}
                  onNavigate={goTo}
                  onGame={openGame}
                  onWallet={() => setModal('wallet')}
                  onLimits={() => setModal('limits')}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  activity={activity}
                />
              )}
              {active === 'games' && (
                <GamesView
                  games={filteredGames}
                  filter={filter}
                  setFilter={setFilter}
                  onGame={openGame}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              )}
              {active === 'wallet' && (
                <WalletView
                  balance={balance}
                  activity={activity}
                  onAdd={() => setModal('wallet')}
                  onActivity={() => setModal('activity')}
                />
              )}
              {active === 'activity' && <ActivityView activity={activity} onBack={() => goTo('discover')} />}
              {active === 'profile' && (
                <ProfileView
                  limit={limit}
                  dailyPlayed={dailyPlayed}
                  onLimit={() => setModal('limits')}
                  onNotice={showNotice}
                />
              )}
            </div>
          )}
        </main>
      </div>

      <MobileNav active={active} onNavigate={goTo} />

      {modal === 'game' && selectedGame && (
        <GameDialog game={selectedGame} onClose={() => setModal(null)} onPlay={playRound} />
      )}
      {modal === 'wallet' && (
        <WalletDialog
          amount={topUpAmount}
          setAmount={setTopUpAmount}
          balance={balance}
          onClose={() => setModal(null)}
          onAdd={addCredits}
        />
      )}
      {modal === 'limits' && (
        <LimitsDialog
          limit={limit}
          setLimit={setLimit}
          dailyPlayed={dailyPlayed}
          onClose={() => setModal(null)}
          onSave={() => {
            setModal(null);
            showNotice('Responsible-play limit saved.');
          }}
        />
      )}
      {modal === 'activity' && (
        <ActivityDialog activity={activity} onClose={() => setModal(null)} />
      )}

      {notice && (
        <div
          className="fixed bottom-20 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[hsl(var(--border))] bg-[hsl(230_29%_12%)] px-4 py-3 text-sm font-medium text-[hsl(var(--foreground))] shadow-2xl shadow-black/40 md:bottom-7"
          role="status"
          data-testid="status-toast"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
            <ShieldCheck size={14} />
          </span>
          {notice}
        </div>
      )}
    </div>
  );
}

function Sidebar({ active, onNavigate, balance }: { active: NavKey; onNavigate: (key: NavKey) => void; balance: number }) {
  const nav: { key: NavKey; label: string; icon: LucideIcon }[] = [
    { key: 'discover', label: 'Discover', icon: LayoutDashboard },
    { key: 'games', label: 'All games', icon: Grid2X2 },
    { key: 'wallet', label: 'Wallet', icon: WalletCards },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];
  return (
    <aside className="hidden w-[252px] shrink-0 border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] px-4 py-5 md:flex md:flex-col">
      <button
        className="mb-12 flex items-center gap-3 px-2 text-left"
        onClick={() => onNavigate('discover')}
        data-testid="button-brand"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary)/.22)]">
          <Dice5 size={22} strokeWidth={2.4} />
        </span>
        <span>
          <span className="display-font block text-[17px] font-bold tracking-[-0.08em]">ROLLERS</span>
          <span className="mono-font block text-[8px] font-bold uppercase tracking-[0.26em] text-[hsl(var(--primary))]">virtual club</span>
        </span>
      </button>

      <p className="mono-font mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">Your space</p>
      <nav className="space-y-1" aria-label="Primary navigation">
        {nav.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-semibold transition-all duration-200 ${
              active === key
                ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--sidebar-accent)/.6)] hover:text-[hsl(var(--foreground))]'
            }`}
            data-testid={`button-nav-${key}`}
          >
            <Icon size={17} className={active === key ? 'text-[hsl(var(--primary))]' : 'transition-colors group-hover:text-[hsl(var(--accent))]'} />
            {label}
            {key === 'activity' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <button
          onClick={() => onNavigate('profile')}
          className={`mb-4 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
            active === 'profile' ? 'border-[hsl(var(--primary)/.45)] bg-[hsl(var(--primary)/.08)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] hover:border-[hsl(var(--primary)/.35)]'
          }`}
          data-testid="button-nav-profile"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(41_94%_61%/.15)] text-[hsl(var(--accent))]">
            <UserRound size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold">Mikael S.</span>
            <span className="mono-font mt-0.5 block text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Level 04</span>
          </span>
          <ChevronDown size={14} className="text-[hsl(var(--muted-foreground))]" />
        </button>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="mono-font text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Demo balance</span>
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-[hsl(var(--accent))]" />
          </div>
          <p className="display-font text-xl font-bold">{balance.toLocaleString('en-US')} <span className="text-xs font-normal tracking-normal text-[hsl(var(--muted-foreground))]">CR</span></p>
          <p className="mt-2 text-[10px] leading-relaxed text-[hsl(var(--muted-foreground))]">Virtual credits only. No deposits or cash-out.</p>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ active, search, setSearch, onWallet, onActivity }: { active: NavKey; search: string; setSearch: (value: string) => void; onWallet: () => void; onActivity: () => void }) {
  const labels: Record<NavKey, string> = { discover: 'Discover', games: 'Games library', wallet: 'Your wallet', activity: 'Recent activity', profile: 'Player settings' };
  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-[hsl(var(--border)/.75)] bg-[hsl(228_27%_9%/.82)] px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] md:hidden" data-testid="button-mobile-menu" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div>
          <p className="mono-font hidden text-[9px] font-bold uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))] sm:block">Rollers / {labels[active]}</p>
          <h1 className="display-font text-xl font-bold tracking-[-0.08em] sm:text-[22px]">{labels[active]}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {(active === 'discover' || active === 'games') && (
          <label className="hidden h-10 w-[190px] items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.62)] px-3 text-[hsl(var(--muted-foreground))] focus-within:border-[hsl(var(--primary)/.7)] sm:flex sm:w-[220px]">
            <Search size={16} />
            <input
              className="min-w-0 flex-1 bg-transparent text-xs text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]"
              placeholder="Search games"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              data-testid="input-search-games"
            />
          </label>
        )}
        <button onClick={onActivity} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.62)] text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--primary)/.45)] hover:text-[hsl(var(--foreground))]" data-testid="button-open-activity" aria-label="Open activity">
          <Bell size={17} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />
        </button>
        <button onClick={onWallet} className="flex h-10 items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-3 text-xs font-bold text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary)/.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-[hsl(357_80%_66%)] sm:px-4" data-testid="button-open-wallet">
          <Plus size={16} strokeWidth={2.5} />
          <span className="hidden sm:inline">Add credits</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
}

function DiscoverView({ balance, onNavigate, onGame, onWallet, onLimits, favorites, onToggleFavorite, activity }: { balance: number; onNavigate: (key: NavKey) => void; onGame: (game: Game) => void; onWallet: () => void; onLimits: () => void; favorites: string[]; onToggleFavorite: (id: string) => void; activity: ActivityItem[] }) {
  const featured = games.slice(0, 4);
  return (
    <div className="animate-rise space-y-8">
      <section className="relative overflow-hidden rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(230_29%_12%)] p-5 sm:p-7 lg:p-9">
        <div className="subtle-grid absolute inset-0 opacity-70" />
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[hsl(var(--primary)/.17)] blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" /> Virtual credits playground
          </div>
          <h2 className="display-font max-w-[600px] text-[clamp(2.2rem,5vw,4.3rem)] font-bold leading-[.96] tracking-[-0.09em]">
            Good games.<br /><span className="text-[hsl(var(--primary))]">Clear limits.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">A quick-play corner for Telegram. Browse a few rounds, keep an eye on your stash, and leave the table when it stops feeling fun.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => onNavigate('games')} className="group flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-[hsl(var(--primary-foreground))] transition hover:-translate-y-0.5 hover:bg-[hsl(357_80%_66%)]" data-testid="button-browse-games">
              Browse games <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button onClick={onLimits} className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)] px-4 py-3 text-xs font-semibold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--accent)/.55)] hover:text-[hsl(var(--accent))]" data-testid="button-hero-limits">
              <ShieldCheck size={15} /> Set a limit
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 hidden w-[43%] max-w-[480px] lg:block">
          <img src={rollersMenuBanner} alt="" className="h-auto w-full mix-blend-screen opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(230_29%_12%)] via-transparent to-transparent" />
        </div>
        <div className="absolute bottom-4 right-5 z-10 hidden text-right lg:block">
          <p className="mono-font text-[9px] uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">Your current stash</p>
          <p className="display-font mt-1 text-2xl font-bold">{balance.toLocaleString('en-US')} <span className="text-xs tracking-normal text-[hsl(var(--accent))]">CR</span></p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div className="relative min-h-[155px] overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <img src={bonusCenterBanner} alt="Bonus center preview" className="absolute inset-0 h-full w-full object-cover opacity-45" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(229_24%_13%)] via-[hsl(229_24%_13%/.82)] to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between p-5">
            <div><p className="mono-font text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--accent))]">Drop zone</p><h3 className="display-font mt-2 text-2xl font-bold tracking-[-0.08em]">Daily drop is live.</h3></div>
            <button onClick={onWallet} className="flex w-fit items-center gap-1.5 text-xs font-bold text-[hsl(var(--foreground))] hover:text-[hsl(var(--accent))]" data-testid="button-claim-drop">Claim 500 credits <ArrowRight size={14} /></button>
          </div>
        </div>
        <button onClick={onWallet} className="group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-[hsl(var(--primary)/.45)]" data-testid="button-wallet-card">
          <div className="absolute -right-4 -top-6 h-28 w-28 rounded-full bg-[hsl(var(--primary)/.1)] blur-2xl transition-transform duration-500 group-hover:scale-150" />
          <WalletCards size={20} className="relative text-[hsl(var(--primary))]" />
          <p className="mono-font relative mt-6 text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Demo wallet</p>
          <p className="display-font relative mt-1 text-xl font-bold">{balance.toLocaleString('en-US')} <span className="text-[11px] tracking-normal text-[hsl(var(--muted-foreground))]">CR</span></p>
          <span className="relative mt-2 flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--primary))]">Manage stash <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></span>
        </button>
        <button onClick={onLimits} className="group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-[hsl(var(--accent)/.45)]" data-testid="button-limits-card">
          <div className="absolute -right-3 -top-3 h-24 w-24 rounded-full bg-[hsl(var(--accent)/.1)] blur-2xl transition-transform duration-500 group-hover:scale-150" />
          <ShieldCheck size={20} className="relative text-[hsl(var(--accent))]" />
          <p className="mono-font relative mt-6 text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Play guard</p>
          <p className="relative mt-1 text-sm font-bold">Your limits are on</p>
          <span className="relative mt-2 flex items-center gap-1 text-[11px] font-semibold text-[hsl(var(--accent))]">Review settings <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" /></span>
        </button>
      </section>

      <section>
        <SectionHeading eyebrow="Pick your pace" title="Popular right now" action="See all games" onAction={() => onNavigate('games')} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {featured.map((game, index) => (
            <GameCard key={game.id} game={game} index={index} onPlay={onGame} isFavorite={favorites.includes(game.id)} onToggleFavorite={onToggleFavorite} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="relative min-h-[190px] overflow-hidden rounded-2xl border border-[hsl(var(--border))]">
          <img src={cryptoBonusBanner} alt="Virtual rewards preview" className="absolute inset-0 h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(229_24%_13%)] via-[hsl(229_24%_13%/.72)] to-transparent" />
          <div className="relative z-10 max-w-sm p-6">
            <p className="mono-font text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--primary))]">The fine print, made visible</p>
            <h3 className="display-font mt-2 text-2xl font-bold tracking-[-0.08em]">No deposits.<br />No cash-out. No surprises.</h3>
            <p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Everything here is a simulated balance designed for a lighter way to play inside Telegram.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <div className="flex items-center justify-between">
            <div><p className="mono-font text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Last moves</p><h3 className="display-font mt-1 text-xl font-bold tracking-[-0.08em]">Activity</h3></div>
            <button onClick={() => onNavigate('activity')} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]" data-testid="button-see-activity" aria-label="See all activity"><ArrowRight size={16} /></button>
          </div>
          <div className="mt-4 space-y-1">
            {activity.slice(0, 3).map((item) => <ActivityRow key={item.id} item={item} compact />)}
          </div>
        </div>
      </section>
    </div>
  );
}

function GamesView({ games: visibleGames, filter, setFilter, onGame, favorites, onToggleFavorite }: { games: Game[]; filter: FilterKey; setFilter: (value: FilterKey) => void; onGame: (game: Game) => void; favorites: string[]; onToggleFavorite: (id: string) => void }) {
  const filters: { key: FilterKey; label: string }[] = [{ key: 'all', label: 'All games' }, { key: 'featured', label: 'Featured' }, { key: 'instant', label: 'Instant play' }, { key: 'table', label: 'Table games' }];
  return (
    <div className="animate-rise">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mono-font text-[9px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--primary))]">The library</p><h2 className="display-font mt-2 text-4xl font-bold tracking-[-0.09em]">Find your next round.</h2><p className="mt-2 max-w-lg text-sm text-[hsl(var(--muted-foreground))]">Small games, clear costs, no pressure to keep going.</p></div>
        <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted-foreground))]"><SlidersHorizontal size={14} /> {visibleGames.length} games available</div>
      </div>
      <div className="scrollbar-thin mt-8 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => <button key={item.key} onClick={() => setFilter(item.key)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition ${filter === item.key ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/.5)] hover:text-[hsl(var(--foreground))]'}`} data-testid={`button-filter-${item.key}`}>{item.label}</button>)}
      </div>
      {visibleGames.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleGames.map((game, index) => <GameCard key={game.id} game={game} index={index} onPlay={onGame} isFavorite={favorites.includes(game.id)} onToggleFavorite={onToggleFavorite} />)}
        </div>
      ) : (
        <div className="mt-8 flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--card)/.35)] text-center">
          <Search size={24} className="text-[hsl(var(--muted-foreground))]" />
          <h3 className="mt-4 text-sm font-bold">No games match that search.</h3>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Try a different name or switch the filter.</p>
          <button onClick={() => { setFilter('all'); }} className="mt-5 rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs font-bold hover:border-[hsl(var(--primary)/.55)]" data-testid="button-clear-filter">Clear filters</button>
        </div>
      )}
    </div>
  );
}

function GameCard({ game, index, onPlay, isFavorite, onToggleFavorite }: { game: Game; index: number; onPlay: (game: Game) => void; isFavorite: boolean; onToggleFavorite: (id: string) => void }) {
  const Icon = game.icon;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 transition duration-300 hover:-translate-y-1 hover:border-[hsl(var(--primary)/.42)] hover:shadow-xl hover:shadow-black/15" style={{ animationDelay: `${index * 60}ms` }} data-testid={`card-game-${game.id}`}>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-150" style={{ background: game.accentSoft }} />
      <div className="relative flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border" style={{ color: game.accent, borderColor: `${game.accent}38`, background: game.accentSoft }}>
          <Icon size={21} strokeWidth={1.8} />
        </div>
        <button onClick={() => onToggleFavorite(game.id)} className={`rounded-lg p-2 transition ${isFavorite ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'}`} data-testid={`button-favorite-${game.id}`} aria-label={`${isFavorite ? 'Remove' : 'Save'} ${game.title}`}>
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="relative mt-5">
        <div className="flex items-center gap-2"><h3 className="text-[15px] font-bold">{game.title}</h3><span className="rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider" style={{ color: game.accent, background: game.accentSoft }}>{game.stat}</span></div>
        <p className="mt-2 min-h-[36px] text-xs leading-5 text-[hsl(var(--muted-foreground))]">{game.description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-[hsl(var(--border)/.75)] pt-3">
          <span className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--muted-foreground))]"><Activity size={12} /> {game.players}</span>
          <button onClick={() => onPlay(game)} className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--foreground))] px-3 py-2 text-[11px] font-bold text-[hsl(var(--background))] transition hover:bg-[hsl(var(--accent))]" data-testid={`button-play-${game.id}`}><Play size={12} fill="currentColor" /> Play</button>
        </div>
      </div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action: string; onAction: () => void }) {
  return <div className="flex items-end justify-between gap-3"><div><p className="mono-font text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">{eyebrow}</p><h2 className="display-font mt-1 text-2xl font-bold tracking-[-0.08em]">{title}</h2></div><button onClick={onAction} className="flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))]" data-testid="button-see-all-games">{action} <ArrowRight size={14} /></button></div>;
}

function WalletView({ balance, activity, onAdd, onActivity }: { balance: number; activity: ActivityItem[]; onAdd: () => void; onActivity: () => void }) {
  return (
    <div className="animate-rise space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mono-font text-[9px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--primary))]">Your stash</p><h2 className="display-font mt-2 text-4xl font-bold tracking-[-0.09em]">Wallet, without the worry.</h2></div><button onClick={onAdd} className="flex w-fit items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-wallet-add-credits"><Plus size={15} /> Add virtual credits</button></div>
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-[hsl(var(--primary)/.35)] bg-[hsl(230_29%_12%)] p-6 sm:p-8"><img src={depositCurrencyBanner} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" /><div className="absolute inset-0 bg-gradient-to-r from-[hsl(230_29%_12%)] via-[hsl(230_29%_12%/.82)] to-transparent" /><div className="relative z-10 flex h-full flex-col justify-between"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><WalletCards size={17} /></span> Demo wallet</span><span className="rounded-full border border-[hsl(var(--accent)/.4)] bg-[hsl(var(--accent)/.1)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--accent))]">Virtual only</span></div><div><p className="mono-font text-[10px] uppercase tracking-[0.22em] text-[hsl(var(--muted-foreground))]">Available balance</p><p className="display-font mt-2 text-5xl font-bold tracking-[-0.1em]">{balance.toLocaleString('en-US')} <span className="text-sm tracking-normal text-[hsl(var(--accent))]">CR</span></p><p className="mt-3 flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]"><ShieldCheck size={14} className="text-[hsl(var(--accent))]" /> No payment details connected</p></div></div></div>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><p className="mono-font text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">How it works</p><div className="mt-6 space-y-5">{[['01', 'Add a demo stash', 'Top up with virtual credits in one tap.'], ['02', 'Pick a small round', 'Every game makes the cost visible.'], ['03', 'Stop when you want', 'Your play guard keeps the ceiling clear.']].map(([number, title, copy]) => <div key={number} className="flex gap-3"><span className="mono-font mt-0.5 text-[10px] font-bold text-[hsl(var(--primary))]">{number}</span><div><p className="text-xs font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{copy}</p></div></div>)}</div><button onClick={onActivity} className="mt-8 flex items-center gap-1 text-xs font-bold text-[hsl(var(--primary))]" data-testid="button-wallet-activity">View all activity <ArrowRight size={14} /></button></div>
      </div>
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="mono-font text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Ledger</p><h3 className="display-font mt-1 text-2xl font-bold tracking-[-0.08em]">Wallet activity</h3></div><Clock3 size={18} className="text-[hsl(var(--muted-foreground))]" /></div><div className="mt-4 divide-y divide-[hsl(var(--border))]">{activity.slice(0, 5).map((item) => <ActivityRow key={item.id} item={item} />)}</div></div>
    </div>
  );
}

function ActivityView({ activity, onBack }: { activity: ActivityItem[]; onBack: () => void }) {
  return <div className="animate-rise"><button onClick={onBack} className="mb-7 flex items-center gap-2 text-xs font-bold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" data-testid="button-activity-back"><ArrowDownLeft size={14} className="rotate-45" /> Back to discover</button><p className="mono-font text-[9px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--primary))]">A clear paper trail</p><h2 className="display-font mt-2 text-4xl font-bold tracking-[-0.09em]">Recent activity.</h2><p className="mt-2 max-w-md text-sm text-[hsl(var(--muted-foreground))]">A simple view of your simulated rounds and credit moves.</p><div className="mt-8 max-w-3xl rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-7"><div className="divide-y divide-[hsl(var(--border))]">{activity.map((item) => <ActivityRow key={item.id} item={item} />)}</div></div></div>;
}

function ProfileView({ limit, dailyPlayed, onLimit, onNotice }: { limit: number; dailyPlayed: number; onLimit: () => void; onNotice: (message: string) => void }) {
  return <div className="animate-rise space-y-6"><div><p className="mono-font text-[9px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--primary))]">Your corner</p><h2 className="display-font mt-2 text-4xl font-bold tracking-[-0.09em]">Player settings.</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Keep your session comfortable, your limits visible.</p></div><div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]"><div className="relative min-h-[240px] overflow-hidden rounded-2xl border border-[hsl(var(--border))]"><img src={profileAccountBanner} alt="Account overview" className="absolute inset-0 h-full w-full object-cover opacity-50" /><div className="absolute inset-0 bg-gradient-to-t from-[hsl(230_29%_11%)] via-transparent to-transparent" /><div className="relative flex h-full flex-col justify-end p-6"><p className="mono-font text-[9px] uppercase tracking-[0.2em] text-[hsl(var(--primary))]">Signed in via Telegram</p><p className="mt-2 text-xl font-bold">Mikael S.</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">@mikael_play · Member since April 2025</p></div></div><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"><div className="flex items-start justify-between"><div><p className="mono-font text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">Responsible play</p><h3 className="display-font mt-1 text-2xl font-bold tracking-[-0.08em]">Your daily guard</h3></div><ShieldCheck className="text-[hsl(var(--accent))]" size={22} /></div><div className="mt-7"><div className="flex items-end justify-between"><span className="text-xs text-[hsl(var(--muted-foreground))]">Played today</span><span className="mono-font text-xs font-bold">{dailyPlayed.toLocaleString('en-US')} / {limit.toLocaleString('en-US')} CR</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-[hsl(var(--accent))]" style={{ width: `${Math.min(100, dailyPlayed / limit * 100)}%` }} /></div><p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">A gentle ceiling, not a challenge. You can lower it at any time.</p></div><div className="mt-6 flex flex-wrap gap-2"><button onClick={onLimit} className="rounded-lg bg-[hsl(var(--accent))] px-3 py-2 text-xs font-bold text-[hsl(var(--accent-foreground))]" data-testid="button-edit-limit">Edit daily limit</button><button onClick={() => onNotice('Notifications are already tuned for quiet hours.')} className="rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs font-bold hover:border-[hsl(var(--primary)/.5)]" data-testid="button-notification-settings"><Bell size={13} className="mr-1 inline" /> Notifications</button></div></div></div></div>;
}

function ActivityRow({ item, compact = false }: { item: ActivityItem; compact?: boolean }) {
  return <div className={`flex items-center gap-3 ${compact ? 'py-2.5' : 'py-4'}`} data-testid={`row-activity-${item.id}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.positive ? 'bg-[hsl(var(--accent)/.1)] text-[hsl(var(--accent))]' : 'bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]'}`}>{item.positive ? <ArrowDownLeft size={15} /> : <Gamepad2 size={15} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{item.title}</span><span className="mt-0.5 block text-[10px] text-[hsl(var(--muted-foreground))]">{item.detail} · {item.time}</span></span><span className={`mono-font text-[11px] font-bold ${item.positive ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--foreground))]'}`}>{item.positive ? '+' : ''}{item.amount.toLocaleString('en-US')} CR</span></div>;
}

function LoadingDashboard() {
  return <div className="mx-auto max-w-[1440px] space-y-5 px-4 pb-10 pt-8 sm:px-6 lg:px-10"><div className="h-[330px] animate-pulse rounded-[24px] bg-[hsl(var(--card))]" /><div className="grid gap-4 lg:grid-cols-3"><div className="h-[155px] animate-pulse rounded-2xl bg-[hsl(var(--card))]" /><div className="h-[155px] animate-pulse rounded-2xl bg-[hsl(var(--card))]" /><div className="h-[155px] animate-pulse rounded-2xl bg-[hsl(var(--card))]" /></div><div className="h-8 w-48 animate-pulse rounded bg-[hsl(var(--card))]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="h-[220px] animate-pulse rounded-2xl bg-[hsl(var(--card))]" key={item} />)}</div></div>;
}

function MobileNav({ active, onNavigate }: { active: NavKey; onNavigate: (key: NavKey) => void }) {
  const nav: { key: NavKey; label: string; icon: LucideIcon }[] = [{ key: 'discover', label: 'Home', icon: HomeIcon }, { key: 'games', label: 'Games', icon: Grid2X2 }, { key: 'wallet', label: 'Wallet', icon: WalletCards }, { key: 'activity', label: 'Activity', icon: History }, { key: 'profile', label: 'You', icon: UserRound }];
  return <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[hsl(var(--border))] bg-[hsl(230_29%_8%/.93)] px-2 py-2 backdrop-blur-xl md:hidden" aria-label="Mobile navigation">{nav.map(({ key, label, icon: Icon }) => <button key={key} onClick={() => onNavigate(key)} className={`flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[9px] font-bold transition ${active === key ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`button-mobile-nav-${key}`}><Icon size={18} /><span>{label}</span></button>)}</nav>;
}

function ModalFrame({ title, eyebrow, children, onClose }: { title: string; eyebrow: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true"><div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-[24px] border border-[hsl(var(--border))] bg-[hsl(230_29%_11%)] p-5 shadow-2xl shadow-black/50 sm:max-w-[440px] sm:rounded-[24px] sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="mono-font text-[9px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--primary))]">{eyebrow}</p><h2 className="display-font mt-2 text-2xl font-bold tracking-[-0.08em]">{title}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]" data-testid="button-close-dialog" aria-label="Close dialog"><X size={18} /></button></div><div className="mt-6">{children}</div></div></div>;
}

function GameDialog({ game, onClose, onPlay }: { game: Game; onClose: () => void; onPlay: () => void }) {
  const Icon = game.icon;
  return <ModalFrame title={game.title} eyebrow="Ready when you are" onClose={onClose}><div className="rounded-2xl border p-5" style={{ borderColor: `${game.accent}38`, background: game.accentSoft }}><div className="flex h-14 w-14 items-center justify-center rounded-2xl border" style={{ color: game.accent, borderColor: `${game.accent}55`, background: `${game.accent}16` }}><Icon size={27} /></div><p className="mt-5 text-sm font-bold">{game.description}</p><p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Each round uses 250 virtual credits. There is no cash value, deposit, or payout.</p></div><div className="mt-5 flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.6)] px-4 py-3"><span className="text-xs text-[hsl(var(--muted-foreground))]">Round cost</span><span className="mono-font text-sm font-bold">250 CR</span></div><button onClick={onPlay} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] py-3.5 text-xs font-bold text-[hsl(var(--primary-foreground))] transition hover:bg-[hsl(357_80%_66%)]" data-testid={`button-start-round-${game.id}`}><Play size={15} fill="currentColor" /> Start round</button></ModalFrame>;
}

function WalletDialog({ amount, setAmount, balance, onClose, onAdd }: { amount: number; setAmount: (amount: number) => void; balance: number; onClose: () => void; onAdd: () => void }) {
  const options = [250, 500, 1000, 2500];
  return <ModalFrame title="Add to your stash" eyebrow="Demo wallet" onClose={onClose}><div className="rounded-2xl border border-[hsl(var(--primary)/.3)] bg-[hsl(var(--primary)/.07)] p-5"><p className="text-xs text-[hsl(var(--muted-foreground))]">Current balance</p><p className="display-font mt-1 text-3xl font-bold">{balance.toLocaleString('en-US')} <span className="text-xs tracking-normal text-[hsl(var(--primary))]">CR</span></p></div><p className="mt-6 text-xs font-bold">Choose a virtual amount</p><div className="mt-3 grid grid-cols-2 gap-2">{options.map((option) => <button key={option} onClick={() => setAmount(option)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${amount === option ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.12)] text-[hsl(var(--primary))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] hover:border-[hsl(var(--primary)/.45)]'}`} data-testid={`button-wallet-amount-${option}`}>+{option.toLocaleString('en-US')} CR</button>)}</div><p className="mt-5 flex items-start gap-2 text-[11px] leading-5 text-[hsl(var(--muted-foreground))]"><Info size={14} className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" /> This is a local demo balance. No payment flow is connected.</p><button onClick={onAdd} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] py-3.5 text-xs font-bold text-[hsl(var(--primary-foreground))]" data-testid="button-confirm-add-credits"><Plus size={15} /> Add {amount.toLocaleString('en-US')} credits</button></ModalFrame>;
}

function LimitsDialog({ limit, setLimit, dailyPlayed, onClose, onSave }: { limit: number; setLimit: (limit: number) => void; dailyPlayed: number; onClose: () => void; onSave: () => void }) {
  const options = [1000, 2000, 3000, 5000];
  return <ModalFrame title="Set your play guard" eyebrow="Responsible play" onClose={onClose}><p className="text-sm leading-6 text-[hsl(var(--muted-foreground))]">A daily limit helps keep virtual play in its place. It is a ceiling, not a target.</p><div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/.6)] p-4"><div className="flex items-center justify-between"><span className="text-xs text-[hsl(var(--muted-foreground))]">Played today</span><span className="mono-font text-xs font-bold">{dailyPlayed.toLocaleString('en-US')} CR</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]"><div className="h-full rounded-full bg-[hsl(var(--accent))]" style={{ width: `${Math.min(100, dailyPlayed / limit * 100)}%` }} /></div></div><p className="mt-6 text-xs font-bold">Daily credit limit</p><div className="mt-3 grid grid-cols-2 gap-2">{options.map((option) => <button key={option} onClick={() => setLimit(option)} className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${limit === option ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/.1)] text-[hsl(var(--accent))]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.5)] hover:border-[hsl(var(--accent)/.45)]'}`} data-testid={`button-limit-${option}`}>{option.toLocaleString('en-US')} CR</button>)}</div><button onClick={onSave} className="mt-6 w-full rounded-xl bg-[hsl(var(--accent))] py-3.5 text-xs font-bold text-[hsl(var(--accent-foreground))]" data-testid="button-save-limit">Save limit</button></ModalFrame>;
}

function ActivityDialog({ activity, onClose }: { activity: ActivityItem[]; onClose: () => void }) {
  return <ModalFrame title="Recent activity" eyebrow="Your paper trail" onClose={onClose}><div className="divide-y divide-[hsl(var(--border))]">{activity.slice(0, 6).map((item) => <ActivityRow key={item.id} item={item} />)}</div></ModalFrame>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;