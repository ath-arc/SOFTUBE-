import { useState, useEffect, FormEvent } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Globe, 
  ToggleLeft, 
  ToggleRight,
  Database,
  Search,
  CheckCircle,
  Play,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { AdBlockerStats, AdRule } from '../types';

interface AdBlockerViewProps {
  stats: AdBlockerStats;
  onToggleStatus: () => void;
  onAddRule: (domain: string, category: AdRule['category']) => void;
  onRemoveRule: (id: string) => void;
  rules: AdRule[];
}

export default function AdBlockerView({
  stats,
  onToggleStatus,
  onAddRule,
  onRemoveRule,
  rules
}: AdBlockerViewProps) {
  const [newDomain, setNewDomain] = useState('');
  const [newCategory, setNewCategory] = useState<AdRule['category']>('Ad Server');
  const [searchRuleQuery, setSearchRuleQuery] = useState('');
  const [tickerHistory, setTickerHistory] = useState<typeof stats.history>(stats.history);
  const [logsAutoUpdate, setLogsAutoUpdate] = useState(true);

  // Filter rules based on search
  const filteredRules = rules.filter(r => 
    r.domain.toLowerCase().includes(searchRuleQuery.toLowerCase())
  );

  // Running active live simulation of blocking events!
  useEffect(() => {
    if (!stats.isEnabled || !logsAutoUpdate) return;

    const possiblePaths = [
      '/v1/telemetry/event',
      '/ads/banner_300x250.png',
      '/js/analytics-core.js',
      '/pixel/track/conversion',
      '/ajax/libs/ad-script.min.js',
      '/collect?v=2&en=page_view',
      '/sdk/malicious_redirect.js',
      '/sync?cookie_id=102837'
    ];

    const interval = setInterval(() => {
      // Pick a random domain that is ACTIVE in the rules!
      const activeRules = rules.filter(r => r.isActive);
      if (activeRules.length === 0) return;

      const randomRule = activeRules[Math.floor(Math.random() * activeRules.length)];
      const randomPath = possiblePaths[Math.floor(Math.random() * possiblePaths.length)];
      
      const newLog = {
        id: 'log-' + Date.now() + Math.random().toString(36).substr(2, 4),
        time: new Date().toLocaleTimeString(),
        domain: randomRule.domain,
        category: randomRule.category,
        action: 'BLOCK - Intercepted & Isolated'
      };

      setTickerHistory(prev => [newLog, ...prev.slice(0, 24)]);
      
      // Update historical counters in Parent storage by adding to blocked count
      // We will perform atomic updates to simulate interactive increments!
      stats.blockedCount += 1;
      const foundDomain = stats.blockedDomains.find(d => d.domain === randomRule.domain);
      if (foundDomain) {
        foundDomain.count += 1;
      } else {
        stats.blockedDomains.push({ domain: randomRule.domain, category: randomRule.category, count: 1 });
      }

    }, 3800); // Trigger every 3.8 seconds for an immersive active screen

    return () => clearInterval(interval);
  }, [stats.isEnabled, rules, logsAutoUpdate]);

  const handleCreateRule = (e: FormEvent) => {
    e.preventDefault();
    if (newDomain.trim()) {
      // Clean domain name a bit
      let cleanedDomain = newDomain.trim().toLowerCase();
      cleanedDomain = cleanedDomain.replace(/https?:\/\//, '').replace(/\/.*$/, '');
      if (rules.some(r => r.domain === cleanedDomain)) {
        alert("This rule already exists in SOFTShield rules!");
        return;
      }
      onAddRule(cleanedDomain, newCategory);
      setNewDomain('');
    }
  };

  const handleClearStats = () => {
    stats.blockedCount = 0;
    stats.blockedDomains.forEach(d => d.count = 0);
    setTickerHistory([]);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 text-slate-100 font-sans p-6" id="blocker-root">
      
      {/* Title shield heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4" id="blocker-header">
        <div className="flex items-center gap-3.5" id="blocker-logo-section">
          <div className={`p-3 rounded-2xl ${stats.isEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`} id="shield-badge">
            {stats.isEnabled ? <ShieldCheck className="h-8 w-8 stroke-[2px]" /> : <ShieldAlert className="h-8 w-8 stroke-[2px]" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              SOFTShield Ad-Blocker
              <span className="text-xs py-0.5 px-2 bg-indigo-505/20 text-indigo-300 border border-indigo-400/30 rounded-full font-mono">CORE V4</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Active DNS firewall & web proxy shielding your SOFTDRIVE container from telemetry and advertisements.
            </p>
          </div>
        </div>

        {/* Big On/Off Toggle Button */}
        <button
          id="toggle-blocker-btn"
          onClick={onToggleStatus}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl border font-bold text-sm tracking-tight transition-all duration-150 shadow-md ${
            stats.isEnabled 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/60' 
              : 'bg-rose-950/40 border-rose-500/30 text-rose-400 hover:bg-rose-950/60'
          }`}
        >
          <span>{stats.isEnabled ? 'PROTECTION: ENABLED' : 'PROTECTION: DISABLED'}</span>
          {stats.isEnabled ? <ToggleRight className="h-6 w-6 text-emerald-400" /> : <ToggleLeft className="h-6 w-6 text-rose-400" />}
        </button>
      </div>

      {/* Main Stats / Layout Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 lg:items-stretch" id="blocker-grid">
        
        {/* Left pane: Operational Indicators */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between" id="status-card-pane">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-indigo-400" />
              Protection Diagnostics
            </h3>

            <div className="space-y-4" id="diag-fields">
              <div className="flex justify-between items-center py-2.5 border-b border-indigo-900/10" id="diag-status">
                <span className="text-xs text-slate-400">Shield Status</span>
                <span className={`text-xs px-2 py-0.5 rounded font-bold font-mono ${stats.isEnabled ? 'bg-emerald-950/70 text-emerald-400' : 'bg-rose-950/70 text-rose-400'}`}>
                  {stats.isEnabled ? 'SECURE' : 'VULNERABLE'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-indigo-900/10" id="diag-total-blocks">
                <span className="text-xs text-slate-400">Total Intercepts</span>
                <span className="text-sm font-bold text-indigo-300 font-mono">{stats.blockedCount} requests</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-indigo-900/10" id="diag-rules">
                <span className="text-xs text-slate-400">Database Rules</span>
                <span className="text-sm font-bold text-indigo-300 font-mono">{rules.length} patterns</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-indigo-900/10" id="diag-auto-simulation">
                <span className="text-xs text-slate-400">Live Traffic Simulation</span>
                <button 
                  id="toggle-traffic-simulation"
                  onClick={() => setLogsAutoUpdate(!logsAutoUpdate)}
                  className={`text-xs px-2 py-0.5 rounded transition-colors font-semibold ${logsAutoUpdate ? 'bg-indigo-950 text-indigo-300 hover:bg-slate-800' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                  {logsAutoUpdate ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800/60" id="card-diag-actions">
            <button
              id="clear-logs-btn"
              onClick={handleClearStats}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-850 rounded-lg text-slate-300 border border-slate-800 text-xs font-semibold hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Counters & Logs</span>
            </button>
          </div>
        </div>

        {/* Center pane: Visual domains blocked list counts */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between" id="domain-stats-pane">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#4285F4]" />
              Threat Source Analysis
            </h3>

            {/* List domains with visual bars */}
            <div className="space-y-4 max-h-56 overflow-y-auto pr-1" id="domain-progress-bars">
              {stats.blockedDomains.filter(d => d.count > 0).length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs" id="no-blocked-threats">
                  <CheckCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <span>No ad block statistics captured yet. Enable shield and let logs flow.</span>
                </div>
              ) : (
                stats.blockedDomains.filter(d => d.count > 0).map((dItem, index) => {
                  const maxCount = Math.max(...stats.blockedDomains.map(d => d.count), 1);
                  const percentage = (dItem.count / maxCount) * 100;
                  return (
                    <div key={index} className="text-xs" id={`domain-stat-row-${index}`}>
                      <div className="flex justify-between text-slate-400 mb-1" id={`domain-stat-info-${index}`}>
                        <span className="font-mono text-slate-200 truncate pr-2" title={dItem.domain}>{dItem.domain}</span>
                        <span className="font-mono text-indigo-300 shrink-0">{dItem.count} hits</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden" id="bar-outer">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                          id="bar-inner"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-900/40 p-3 rounded-lg border border-slate-800/50 leading-normal mt-4" id="stats-banner-notice">
            <span className="font-bold text-slate-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-indigo-400" />
              Ad Blocker Mechanism
            </span>
            SOFTShield hooks into standard fetch events, client components, and frame requests, blocking ad trackers to increase download bandwidth inside SOFTDRIVE!
          </div>
        </div>

        {/* Right pane: Action parameters rule creator */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between" id="add-rules-pane">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" />
              Database Filter Rules
            </h3>

            {/* Inlining form rule */}
            <form onSubmit={handleCreateRule} className="space-y-3" id="add-rule-form">
              <div id="rule-domain-field">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Target Host / Pattern</label>
                <input
                  id="rule-domain-input"
                  type="text"
                  placeholder="e.g. adserver.com, doubleclick.net"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                  required
                />
              </div>

              <div id="rule-category-field">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Category Classification</label>
                <select
                  id="rule-category-select"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AdRule['category'])}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-indigo-400 focus:outline-none"
                >
                  <option value="Ad Server">Ad Server (Interstitials/Videos)</option>
                  <option value="Tracker">Cookie Tracker (Audience Pixels)</option>
                  <option value="Telemetry">Telemetry Logs (Privacy audits)</option>
                  <option value="Malware">Malware Sandbox (Isolated scripts)</option>
                </select>
              </div>

              <button
                id="add-rule-btn"
                type="submit"
                className="w-full py-2 px-3 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <Plus className="h-3 w-3 stroke-[3px]" />
                <span>Inject Guard Filter Pattern</span>
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-800/40 text-xs" id="quick-patterns">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-2">Popular Injected Blocks:</span>
            <div className="flex flex-wrap gap-1.5" id="presets-container">
              {['yandex.ru', 'facebook.net', 'google-analytics.com'].map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setNewDomain(preset)}
                  className="px-2 py-0.5 bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-850 hover:text-slate-200 transition-colors rounded text-[10px] font-mono cursor-pointer"
                  id={`preset-${preset}`}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rules list & Live Fire Logs section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6" id="blocker-secondary-section">
        
        {/* Rules Table / Filter Rule Explorer */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6" id="rules-explorer">
          <div className="flex justify-between items-center mb-4 gap-2" id="rules-ex-header">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Active Firewall Filters
            </h3>
            <div className="relative" id="rules-search">
              <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-slate-500" />
              <input
                id="rules-search-input"
                type="text"
                placeholder="Search filter db..."
                value={searchRuleQuery}
                onChange={(e) => setSearchRuleQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-white max-w-44 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-60 space-y-2 pr-1" id="rules-list-container">
            {filteredRules.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs" id="no-filtered-rules">
                No matching security rules found.
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div 
                  key={rule.id} 
                  className="bg-slate-900/60 p-3 rounded-lg border border-slate-850 flex justify-between items-center text-xs group"
                  id={`rule-item-${rule.id}`}
                >
                  <div className="min-w-0" id={`rule-info-${rule.id}`}>
                    <span id={`rule-domain-${rule.id}`} className="font-mono text-slate-200 font-bold block truncate">{rule.domain}</span>
                    <span id={`rule-category-${rule.id}`} className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded font-bold bg-slate-850 text-indigo-400 uppercase tracking-wider">
                      {rule.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0" id={`rule-actions-${rule.id}`}>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Shield Armed
                    </span>
                    <button
                      id={`delete-rule-btn-${rule.id}`}
                      onClick={() => onRemoveRule(rule.id)}
                      className="p-1 px-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded transition-colors"
                      title="Destroy Filter Rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Block Logs Console (Terminal Vibe!) */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between" id="active-firewall-logs">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center justify-between" id="logs-header">
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-400 animate-pulse" />
                Live Firewall Intercept Console
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                FEEDING...
              </span>
            </h3>

            {/* Console list log */}
            <div className="font-mono bg-black text-slate-300 p-4 rounded-xl text-[10.5px] border border-slate-850 h-52 overflow-y-auto leading-relaxed space-y-2.5" id="console-logs">
              {tickerHistory.length === 0 ? (
                <div className="text-slate-500 text-center py-16" id="empty-console">
                  &gt;_ SYSTEM SHIELD ONLINE. LAUNCH LIVE SIMULATOR FOR EVENT FEEDS.
                </div>
              ) : (
                tickerHistory.map((h, i) => (
                  <div key={h.id || i} className="flex gap-2.5 items-start border-l-2 border-rose-500/30 pl-2 text-slate-400" id={`log-line-${i}`}>
                    <span className="text-indigo-400 shrink-0 font-bold">[{h.time}]</span>
                    <div className="min-w-0" id={`log-detail-${i}`}>
                      <span className="text-slate-100 font-bold block sm:inline mr-1 sm:mr-2 truncate max-w-full sm:max-w-[140px]">{h.domain}</span>
                      <span className="text-xs text-rose-400 font-bold shrink-0">Blocked</span>
                      <span className="text-[10px] px-1 py-0.2 bg-slate-900 border border-slate-800 text-slate-500 rounded ml-1 scale-90 inline-block font-sans">{h.category}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 text-[10px] font-mono text-slate-500 flex items-center gap-1.5" id="console-footer">
            <Clock className="h-3.5 w-3.5" />
            <span>SOFTShield system logs are stored strictly locally in ephemeral session pools.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
