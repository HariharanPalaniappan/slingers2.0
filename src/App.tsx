import { useMemo, useState, type ReactNode } from 'react';
import {
  battingAverage,
  bowlingAverage,
  bowlingEconomy,
  fieldingDismissals,
  formatOvers,
  initials,
  matchTitle,
  matches,
  players,
  strikeRate,
  titleCase,
  type PlayerStats,
} from './stats';

type Page = 'overview' | 'leaderboards' | 'squad' | 'matches';
type Board = 'batting' | 'bowling' | 'fielding' | 'mvp';
type RecordMetric = 'runs' | 'average' | 'strikeRate' | 'wickets' | 'economy' | 'fielding' | 'mvp';
type IconName = 'home' | 'trophy' | 'users' | 'calendar' | 'search' | 'arrow' | 'chevron' | 'close' | 'star' | 'cricket' | 'menu';
const clubLogo = '/slingers-logo.jpg';
const matchesPlayed = 25;

const iconPaths: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5z M9 21v-7h6v7',
  trophy: 'M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0zm0 2H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4',
  users: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7-7.5a4 4 0 0 1 0 7.75M20 21v-2a4 4 0 0 0-3-3.87',
  calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z',
  search: 'm20 20-4.2-4.2M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0z',
  arrow: 'M7 17 17 7M7 7h10v10',
  chevron: 'm9 18 6-6-6-6',
  close: 'M18 6 6 18M6 6l12 12',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z',
  cricket: 'M15 5 5 15m8-12 8 8m-6-10 5 5M3 21l6-6m1-1 4 4m-6-2 2-2',
  menu: 'M4 6h16M4 12h16M4 18h16',
};

function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={iconPaths[name]} />
    </svg>
  );
}

function Avatar({ name, image, size = 'normal' }: { name: string; image?: string; size?: 'normal' | 'large' }) {
  return (
    <span className={`avatar avatar-${size}`}>
      {initials(name)}
      {image && <img className="avatar-photo" src={image} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
    </span>
  );
}

function StatCard({ label, value, note, icon }: { label: string; value: string; note: string; icon: IconName }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top"><span className="stat-icon"><Icon name={icon} size={17} /></span><span className="stat-note">{note}</span></div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </article>
  );
}

function PlayerCard({ player, onOpen, compact = false }: { player: PlayerStats; onOpen: () => void; compact?: boolean }) {
  const role = player.battingInnings && player.bowlingAppearances
    ? 'All-rounder'
    : player.bowlingAppearances ? 'Bowler' : 'Batter';
  return (
    <button className={`player-card ${compact ? 'player-card-compact' : ''}`} onClick={onOpen}>
      <Avatar name={player.name} image={player.image} />
      <span className="player-card-copy"><strong>{player.name}</strong><small>{role} · {player.appearances} {player.appearances === 1 ? 'match' : 'matches'}</small></span>
      <Icon name="chevron" size={16} className="muted-icon" />
    </button>
  );
}

const recordCards: Array<{ id: RecordMetric; board: Board; title: string; subtitle: string }> = [
  { id: 'runs', board: 'batting', title: 'Most runs', subtitle: 'Season run leaders' },
  { id: 'average', board: 'batting', title: 'Batting average', subtitle: 'Runs per dismissal' },
  { id: 'strikeRate', board: 'batting', title: 'Strike rate', subtitle: 'Runs per 100 balls' },
  { id: 'wickets', board: 'bowling', title: 'Most wickets', subtitle: 'Leading wicket-takers' },
  { id: 'economy', board: 'bowling', title: 'Bowling economy', subtitle: 'Runs conceded per over' },
  { id: 'fielding', board: 'fielding', title: 'Fielding', subtitle: 'Dismissals contributed' },
  { id: 'mvp', board: 'mvp', title: 'MVP points', subtitle: 'Match award points' },
];

function getRecordRows(metric: RecordMetric, search = '') {
  const query = search.trim().toLowerCase();
  const roster = players.filter((player) => player.name.toLowerCase().includes(query));
  if (metric === 'runs') return roster.filter((player) => player.battingInnings).sort((a, b) => b.runs - a.runs);
  if (metric === 'average') return roster.filter((player) => player.battingInnings).sort((a, b) => battingAverage(b) - battingAverage(a));
  if (metric === 'strikeRate') return roster.filter((player) => player.battingInnings).sort((a, b) => strikeRate(b) - strikeRate(a));
  if (metric === 'wickets') return roster.filter((player) => player.bowlingAppearances).sort((a, b) => b.wickets - a.wickets || bowlingEconomy(a) - bowlingEconomy(b));
  if (metric === 'economy') return roster.filter((player) => player.bowlingAppearances).sort((a, b) => bowlingEconomy(a) - bowlingEconomy(b));
  if (metric === 'fielding') return roster.sort((a, b) => fieldingDismissals(b) - fieldingDismissals(a) || b.catches - a.catches || a.name.localeCompare(b.name));
  return roster.filter((player) => player.mvpAwards).sort((a, b) => b.mvpPoints - a.mvpPoints);
}

function recordValue(metric: RecordMetric, player: PlayerStats) {
  if (metric === 'runs') return { value: String(player.runs), detail: `${player.battingInnings} ${player.battingInnings === 1 ? 'innings' : 'innings'}` };
  if (metric === 'average') return { value: battingAverage(player).toFixed(2), detail: `${player.runs} runs` };
  if (metric === 'strikeRate') return { value: strikeRate(player).toFixed(2), detail: `${player.runs} runs · ${player.ballsFaced} balls` };
  if (metric === 'wickets') return { value: String(player.wickets), detail: `${formatOvers(player.ballsBowled)} overs` };
  if (metric === 'economy') return { value: bowlingEconomy(player).toFixed(2), detail: `${player.wickets} wickets · ${formatOvers(player.ballsBowled)} overs` };
  if (metric === 'fielding') return { value: String(fieldingDismissals(player)), detail: `${player.catches} catches · ${player.stumpings} stumpings` };
  return { value: player.mvpPoints.toFixed(2), detail: `${player.mvpAwards} MVP ${player.mvpAwards === 1 ? 'award' : 'awards'}` };
}

function RecordsDashboard({ onFullTable, onOpen }: { onFullTable: (metric: RecordMetric, board: Board) => void; onOpen: (player: PlayerStats) => void }) {
  return (
    <div className="records-page">
      <header className="records-header">
        <div>
          <span className="records-kicker">SLINGERS CC 2.0 <i /> SEASON ARCHIVE</span>
          <h1>Records &amp; leaderboards</h1>
          <p>Top performers across batting, bowling, fielding and MVP. Rankings are calculated from the supplied scorecards.</p>
        </div>
        <div className="records-summary"><strong>{players.length}</strong><span>PLAYERS<br />RANKED</span><i /><strong>{matches.length}</strong><span>SCORECARDS<br />IN ARCHIVE</span></div>
      </header>
      <div className="records-section-title"><div><h2>Leaderboards</h2><span>Top five in every department</span></div><span className="records-season">ALL TIME <Icon name="chevron" size={14} /></span></div>
      <div className="records-grid">
        {recordCards.map((card) => {
          const leaders = getRecordRows(card.id).slice(0, 5);
          return (
            <section className="record-card" key={card.id}>
              <header className="record-card-header">
                <div><h3><i />{card.title}</h3><p>{card.subtitle}</p></div>
                <button onClick={() => onFullTable(card.id, card.board)}>Full table <Icon name="arrow" size={13} /></button>
              </header>
              <ol className="record-list">
                {leaders.map((player, index) => {
                  const stat = recordValue(card.id, player);
                  return (
                    <li key={player.name}>
                      <button className={`record-row ${index === 0 ? 'record-row-first' : ''}`} onClick={() => onOpen(player)}>
                        <span className="record-rank">{index + 1}</span>
                        <Avatar name={player.name} image={player.image} />
                        <span className="record-player"><strong>{player.name}</strong><small>{stat.detail}</small></span>
                        <strong className="record-value">{stat.value}</strong>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>
      <p className="records-footnote">Fielding counts include individual contributions in assisted run-outs. No minimum innings or overs cutoff is applied.</p>
    </div>
  );
}

function Leaderboard({ board, metric, onOpen }: { board: Board; metric: RecordMetric; onOpen: (player: PlayerStats) => void }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => getRecordRows(metric, query), [metric, query]);

  const headers = board === 'batting'
    ? ['Runs', 'Avg', 'SR', '4s', '6s']
    : board === 'bowling'
      ? ['Wickets', 'Overs', 'Economy', 'Runs', 'Maidens']
      : board === 'fielding'
        ? ['Catches', 'Stumped', 'Run outs', 'Assisted', 'C&B', 'Caught behind']
        : ['MVP points', 'Awards', 'Runs', 'Wickets', 'Matches'];

  const topThree = filtered.slice(0, 3);
  const podiumPlayers = [topThree[1], topThree[0], topThree[2]].filter(
    (player): player is PlayerStats => Boolean(player),
  );
  const boardLabel = board === 'mvp' ? 'MVP' : titleCase(board);
  const playerMetric = (player: PlayerStats) => {
    if (metric === 'runs') return { value: String(player.runs), label: 'RUNS', detail: `${battingAverage(player).toFixed(1)} average · ${strikeRate(player).toFixed(1)} SR` };
    if (metric === 'average') return { value: battingAverage(player).toFixed(2), label: 'AVERAGE', detail: `${player.runs} runs · ${player.battingInnings} innings` };
    if (metric === 'strikeRate') return { value: strikeRate(player).toFixed(2), label: 'STRIKE RATE', detail: `${player.runs} runs · ${player.ballsFaced} balls` };
    if (metric === 'wickets') return { value: String(player.wickets), label: 'WICKETS', detail: `${formatOvers(player.ballsBowled)} overs · ${bowlingEconomy(player).toFixed(2)} economy` };
    if (metric === 'economy') return { value: bowlingEconomy(player).toFixed(2), label: 'ECONOMY', detail: `${player.wickets} wickets · ${formatOvers(player.ballsBowled)} overs` };
    if (board === 'fielding') return { value: String(fieldingDismissals(player)), label: 'DISMISSALS', detail: `${player.catches} catches · ${player.stumpings} stumpings · ${player.runOuts + player.assistedRunOuts} run-outs` };
    return { value: player.mvpPoints.toFixed(2), label: 'MVP POINTS', detail: `${player.mvpAwards} ${player.mvpAwards === 1 ? 'award' : 'awards'} · ${player.appearances} matches` };
  };

  return (
    <div className="leaderboard-table-wrap">
      {topThree.length > 0 && (
        <section className={`leaderboard-podium podium-${board}`} aria-label={`Top three ${boardLabel} players`}>
          <div className="podium-heading">
            <span className="eyebrow">THE FRONT RUNNERS</span>
            <h2>Top {boardLabel.toLowerCase()} players</h2>
          </div>
          <div className="podium-grid">
            {podiumPlayers.map((player) => {
              const rank = filtered.indexOf(player) + 1;
              const metric = playerMetric(player);
              return (
                <button className={`podium-card podium-rank-${rank}`} key={player.name} onClick={() => onOpen(player)} aria-label={`${rank === 1 ? 'First' : rank === 2 ? 'Second' : 'Third'} place, ${player.name}, ${metric.value} ${metric.label.toLowerCase()}`}>
                  <span className="podium-rank-badge"><span>{rank === 1 ? '★' : rank}</span></span>
                  <Avatar name={player.name} image={player.image} size="large" />
                  <strong className="podium-player-name">{player.name}</strong>
                  <span className="podium-detail">{metric.detail}</span>
                  <span className="podium-stat"><b>{metric.value}</b><small>{metric.label}</small></span>
                </button>
              );
            })}
          </div>
        </section>
      )}
      <div className="table-toolbar">
        <span className="table-count">{filtered.length} PLAYERS</span>
        <label className="table-search"><Icon name="search" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a player" /></label>
      </div>
      <div className="table-scroll">
        <table className="leaderboard-table">
          <thead><tr><th className="rank-col">#</th><th>Player</th>{headers.map((header) => <th key={header} className="numeric">{header}</th>)}</tr></thead>
          <tbody>
            {filtered.map((player, index) => (
              <tr key={player.name} onClick={() => onOpen(player)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') onOpen(player); }}>
                <td className="rank-col"><span className={`rank-number ${index === 0 ? 'rank-first' : ''}`}>{String(index + 1).padStart(2, '0')}</span></td>
                <td><span className="table-player"><Avatar name={player.name} image={player.image} /><span><strong>{player.name}</strong><small>{player.battingInnings && player.bowlingAppearances ? 'All-rounder' : player.bowlingAppearances ? 'Bowler' : 'Batter'}</small></span></span></td>
                {board === 'batting' && <><td className="numeric emph">{player.runs}</td><td className="numeric">{battingAverage(player).toFixed(1)}</td><td className="numeric">{strikeRate(player).toFixed(1)}</td><td className="numeric">{player.fours}</td><td className="numeric">{player.sixes}</td></>}
                {board === 'bowling' && <><td className="numeric emph">{player.wickets}</td><td className="numeric">{formatOvers(player.ballsBowled)}</td><td className="numeric">{bowlingEconomy(player).toFixed(2)}</td><td className="numeric">{player.runsConceded}</td><td className="numeric">{player.maidens}</td></>}
                {board === 'fielding' && <><td className="numeric emph">{player.catches}</td><td className="numeric">{player.stumpings}</td><td className="numeric">{player.runOuts}</td><td className="numeric">{player.assistedRunOuts}</td><td className="numeric">{player.caughtAndBowled}</td><td className="numeric">{player.caughtBehind}</td></>}
                {board === 'mvp' && <><td className="numeric emph">{player.mvpPoints.toFixed(2)}</td><td className="numeric">{player.mvpAwards}</td><td className="numeric">{player.runs}</td><td className="numeric">{player.wickets}</td><td className="numeric">{player.appearances}</td></>}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="no-results">No players match that search.</p>}
      </div>
      <p className="table-footnote">{board === 'fielding' ? '* Fielding totals are shown for players included in the supplied player totals.' : '* Aggregated from the supplied scorecards. MVP points include team awards only.'}</p>
    </div>
  );
}

function PlayerProfile({ player, onClose }: { player: PlayerStats; onClose: () => void }) {
  const role = player.battingInnings && player.bowlingAppearances
    ? 'All-rounder'
    : player.bowlingAppearances ? 'Bowler' : 'Batter';
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-name">
        <button className="modal-close" aria-label="Close profile" onClick={onClose}><Icon name="close" /></button>
        <div className="profile-cover"><img className="cover-logo" src={clubLogo} alt="" /><span className="cover-label">SLINGERS CC · PLAYER PROFILE</span></div>
        <div className="profile-heading"><Avatar name={player.name} image={player.image} size="large" /><div><span className="eyebrow">{role}</span><h2 id="profile-name">{player.name}</h2><p>{player.appearances} appearances in the scorecard archive</p></div></div>
        <div className="profile-highlights">
          <div><small>RUNS</small><strong>{player.runs}</strong></div>
          <div><small>WICKETS</small><strong>{player.wickets}</strong></div>
          <div><small>BEST SCORE</small><strong>{player.highestScore}</strong></div>
          <div><small>MVP POINTS</small><strong>{player.mvpPoints.toFixed(2)}</strong></div>
        </div>
        <div className="profile-section">
          <h3>Batting</h3>
          <div className="profile-stat-grid">
            <ProfileStat label="Average" value={battingAverage(player).toFixed(2)} />
            <ProfileStat label="Strike rate" value={strikeRate(player).toFixed(2)} />
            <ProfileStat label="Fours / sixes" value={`${player.fours} / ${player.sixes}`} />
            <ProfileStat label="50s / 100s" value={`${player.fifties} / ${player.centuries}`} />
          </div>
        </div>
        <div className="profile-section">
          <h3>Bowling</h3>
          <div className="profile-stat-grid">
            <ProfileStat label="Economy" value={bowlingEconomy(player).toFixed(2)} />
            <ProfileStat label="Average" value={player.wickets ? bowlingAverage(player).toFixed(2) : '—'} />
            <ProfileStat label="Overs" value={formatOvers(player.ballsBowled)} />
            <ProfileStat label="Maidens" value={String(player.maidens)} />
          </div>
        </div>
        <div className="profile-section">
          <h3>Fielding</h3>
          <div className="profile-stat-grid">
            <ProfileStat label="Catches" value={String(player.catches)} />
            <ProfileStat label="Stumpings" value={String(player.stumpings)} />
            <ProfileStat label="Run outs" value={String(player.runOuts)} />
            <ProfileStat label="Assisted run outs" value={String(player.assistedRunOuts)} />
            <ProfileStat label="Caught & bowled" value={String(player.caughtAndBowled)} />
            <ProfileStat label="Caught behind" value={String(player.caughtBehind)} />
          </div>
        </div>
        <p className="profile-note">Fielding figures reflect the player totals supplied with the dataset.</p>
      </section>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return <div className="profile-stat"><small>{label}</small><strong>{value}</strong></div>;
}

function Overview({ openPlayer, setPage, setBoard }: { openPlayer: (player: PlayerStats) => void; setPage: (page: Page) => void; setBoard: (board: Board) => void }) {
  const topRunScorer = [...players].sort((a, b) => b.runs - a.runs)[0];
  const topWicketTaker = [...players].sort((a, b) => b.wickets - a.wickets)[0];
  const mvpLeader = [...players].sort((a, b) => b.mvpPoints - a.mvpPoints)[0];
  const mvpWinners = players.filter((player) => player.mvpAwards).length;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-kicker"><span className="live-dot" /> THE YELLOW ARMY · STATS HUB</span>
          <h1>Every run.<br />Every <em>moment.</em></h1>
          <p>Your home for Slingers CC numbers, standout performances and the stories behind the scorecards.</p>
          <button className="hero-cta" onClick={() => { setPage('leaderboards'); setBoard('batting'); }}>Explore leaderboards <Icon name="arrow" size={16} /></button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-ring ring-one" /><div className="art-ring ring-two" />
          <img className="hero-crest" src={clubLogo} alt="" />
          <span className="art-star star-a">✳</span><span className="art-star star-b">✳</span>
          <span className="art-side-label">CHENNAI · CRICKET CLUB</span>
        </div>
        <div className="hero-bottom"><span>SEASON ARCHIVE</span><span>{matchesPlayed} MATCHES PLAYED</span><span>ONE CLUB. ONE FAMILY.</span></div>
      </section>

      <section className="stats-grid">
        <StatCard label="Matches played" value={String(matchesPlayed)} note={`${matches.length} scorecards available`} icon="calendar" />
        <StatCard label="Squad players" value={String(players.length)} note="Across all games" icon="users" />
        <StatCard label="Most runs" value={String(topRunScorer?.runs ?? 0)} note={topRunScorer?.name ?? '—'} icon="cricket" />
        <StatCard label="Most wickets" value={String(topWicketTaker?.wickets ?? 0)} note={topWicketTaker?.name ?? '—'} icon="trophy" />
      </section>

      <section className="feature-grid">
        <article className="spotlight-card">
          <div className="section-heading"><div><span className="eyebrow">PLAYER SPOTLIGHT</span><h2>The numbers speak</h2></div><button className="text-link" onClick={() => setPage('squad')}>Full squad <Icon name="arrow" size={15} /></button></div>
          <button className="spotlight-player" onClick={() => topRunScorer && openPlayer(topRunScorer)}>
            <div className="spotlight-avatar"><Avatar name={topRunScorer?.name ?? 'Slingers'} image={topRunScorer?.image} size="large" /><span className="spotlight-badge"><Icon name="star" size={12} /></span></div>
            <div className="spotlight-name"><span className="eyebrow">RUN MACHINE</span><h3>{topRunScorer?.name ?? '—'}</h3><span>Leading the run charts</span></div>
            <div className="spotlight-stat"><strong>{topRunScorer?.runs ?? 0}</strong><small>RUNS</small></div>
          </button>
          <div className="spotlight-divider" />
          <button className="mini-leader" onClick={() => topWicketTaker && openPlayer(topWicketTaker)}>
            <span className="mini-leader-icon"><Icon name="trophy" size={17} /></span>
            <span><small>LEADING WICKET-TAKER</small><strong>{topWicketTaker?.name ?? '—'}</strong></span>
            <b>{topWicketTaker?.wickets ?? 0} wkts</b>
          </button>
        </article>
        <article className="mvp-card">
          <span className="mvp-orbit orbit-a" /><span className="mvp-orbit orbit-b" />
          <div className="mvp-content"><span className="eyebrow">MOST VALUABLE PLAYER</span><div className="mvp-medal"><Icon name="star" size={24} /></div><h2>{mvpLeader?.name ?? '—'}</h2><p>Setting the standard, one performance at a time.</p><div className="mvp-score"><strong>{mvpLeader?.mvpPoints.toFixed(2) ?? '0.00'}</strong><span>POINTS</span></div><div className="mvp-footer"><span>{mvpWinners} players have earned MVP points</span><button aria-label="View MVP leaderboard" onClick={() => { setPage('leaderboards'); setBoard('mvp'); }}><Icon name="arrow" size={16} /></button></div></div>
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel-card">
          <div className="section-heading"><div><span className="eyebrow">TOP OF THE ORDER</span><h2>Batting leaders</h2></div><button className="text-link" onClick={() => { setPage('leaderboards'); setBoard('batting'); }}>Full table <Icon name="arrow" size={15} /></button></div>
          <div className="compact-leader-list">
            {[...players].sort((a, b) => b.runs - a.runs).slice(0, 4).map((player, index) => (
              <button className="compact-row" key={player.name} onClick={() => openPlayer(player)}>
                <span className={`compact-rank ${index === 0 ? 'compact-rank-first' : ''}`}>{String(index + 1).padStart(2, '0')}</span><Avatar name={player.name} image={player.image} /><span className="compact-player"><strong>{player.name}</strong><small>{player.battingInnings} innings</small></span><span className="compact-value"><strong>{player.runs}</strong><small>RUNS</small></span>
              </button>
            ))}
          </div>
        </article>
        <article className="panel-card squad-panel">
          <div className="section-heading"><div><span className="eyebrow">THE SQUAD</span><h2>Meet the team</h2></div><button className="text-link" onClick={() => setPage('squad')}>View all <Icon name="arrow" size={15} /></button></div>
          <p className="squad-intro">The players bringing the energy to every innings.</p>
          <div className="squad-preview">{[...players].sort((a, b) => b.appearances - a.appearances).slice(0, 5).map((player) => <button key={player.name} onClick={() => openPlayer(player)} aria-label={`View ${player.name}`}><Avatar name={player.name} image={player.image} /></button>)}<button className="more-players" onClick={() => setPage('squad')}>+{Math.max(players.length - 5, 0)}</button></div>
          <div className="squad-foot"><span><strong>{players.length}</strong> players in the archive</span><Icon name="users" size={18} /></div>
        </article>
      </section>
    </>
  );
}

function PageHeader({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{children}</div>;
}

function App() {
  const [page, setPage] = useState<Page>('overview');
  const [board, setBoard] = useState<Board>('batting');
  const [recordMetric, setRecordMetric] = useState<RecordMetric>('runs');
  const [showRecordsTable, setShowRecordsTable] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);
  const [squadQuery, setSquadQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems: Array<{ id: Page; label: string; icon: IconName }> = [
    { id: 'overview', label: 'Overview', icon: 'home' },
    { id: 'leaderboards', label: 'Leaderboards', icon: 'trophy' },
    { id: 'squad', label: 'The squad', icon: 'users' },
    { id: 'matches', label: 'Scorecards', icon: 'calendar' },
  ];

  const visiblePlayers = useMemo(
    () => [...players].filter((player) => player.name.toLowerCase().includes(squadQuery.toLowerCase().trim())).sort((a, b) => a.name.localeCompare(b.name)),
    [squadQuery],
  );

  const openPage = (nextPage: Page) => {
    setPage(nextPage);
    setMobileNavOpen(false);
    if (nextPage === 'leaderboards') setShowRecordsTable(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <button className="brand-lockup" onClick={() => openPage('overview')} aria-label="Slingers CC home">
          <img className="brand-mark" src={clubLogo} alt="" /><span className="brand-text"><strong>SLINGERS</strong><small>CRICKET CLUB</small></span>
        </button>
        <div className="season-chip"><span className="season-dot" /> CLUB DASHBOARD <span className="season-year">ALL TIME</span></div>
        <p className="nav-caption">MENU</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => <button key={item.id} className={`nav-item ${page === item.id ? 'nav-item-active' : ''}`} onClick={() => openPage(item.id)}><Icon name={item.icon} size={18} /><span>{item.label}</span>{page === item.id && <i />}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="club-card"><span className="club-card-icon"><Icon name="cricket" /></span><strong>One club.<br />One family.</strong><p>United by the game.</p><span className="club-card-watermark">S</span></div>
          <div className="team-profile"><img className="team-avatar team-avatar-logo" src={clubLogo} alt="Slingers Cricket Club logo" /><span><strong>Slingers CC 2.0</strong><small>Chennai, India</small></span><span className="team-menu">•••</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen((open) => !open)} aria-label="Toggle navigation"><Icon name="menu" /></button>
          <div className="breadcrumbs"><span>Slingers CC</span><Icon name="chevron" size={14} /><strong>{navItems.find((item) => item.id === page)?.label}</strong></div>
          <div className="topbar-right"><span className="season-label">ARCHIVE <b>ALL TIME</b></span><span className="topbar-divider" /><span className="topbar-team">Slingers CC 2.0</span><img className="team-avatar team-avatar-logo topbar-avatar" src={clubLogo} alt="Slingers Cricket Club logo" /></div>
        </header>

        <div className="content-wrap">
          {page === 'overview' && <Overview openPlayer={setSelectedPlayer} setPage={openPage} setBoard={setBoard} />}
          {page === 'leaderboards' && (
            !showRecordsTable
              ? <RecordsDashboard
                  onOpen={setSelectedPlayer}
                  onFullTable={(metric, selectedBoard) => {
                    setRecordMetric(metric);
                    setBoard(selectedBoard);
                    setShowRecordsTable(true);
                  }}
                />
              : <>
                  <PageHeader
                    eyebrow="THE NUMBERS GAME"
                    title={`${recordCards.find((card) => card.id === recordMetric)?.title ?? 'Leaderboard'} · Full table`}
                    description="Ranked from player performances across the supplied scorecards."
                  >
                    <button className="records-back" onClick={() => setShowRecordsTable(false)}><Icon name="chevron" size={15} /> All leaderboards</button>
                  </PageHeader>
                  <div className="board-panel">
                    <div className="board-tabs" role="tablist" aria-label="Leaderboard category">
                      {(['batting', 'bowling', 'fielding', 'mvp'] as Board[]).map((item) => (
                        <button
                          role="tab"
                          aria-selected={board === item}
                          key={item}
                          className={board === item ? 'board-tab board-tab-active' : 'board-tab'}
                          onClick={() => {
                            setBoard(item);
                            setRecordMetric(item === 'batting' ? 'runs' : item === 'bowling' ? 'wickets' : item);
                          }}
                        >
                          {item === 'mvp' ? 'MVP' : titleCase(item)}
                        </button>
                      ))}
                    </div>
                    <Leaderboard board={board} metric={recordMetric} onOpen={setSelectedPlayer} />
                  </div>
                </>
          )}
          {page === 'squad' && <><PageHeader eyebrow="MEET THE TEAM" title="The squad" description={`${players.length} players featured in the scorecard archive. Select a player to explore their numbers.`}><label className="page-search"><Icon name="search" size={16} /><input value={squadQuery} onChange={(event) => setSquadQuery(event.target.value)} placeholder="Search players" /></label></PageHeader><div className="squad-grid">{visiblePlayers.map((player) => <PlayerCard key={player.name} player={player} onOpen={() => setSelectedPlayer(player)} />)}{visiblePlayers.length === 0 && <p className="no-results">No players match that search.</p>}</div></>}
          {page === 'matches' && <><PageHeader eyebrow="THE ARCHIVE" title="Scorecards" description="Every match included in the supplied Slingers CC dataset." /><div className="matches-list">{matches.map((match, index) => <a className="match-card" key={`${match.scorecard_url}-${index}`} href={match.scorecard_url} target="_blank" rel="noreferrer"><span className="match-index">{String(index + 1).padStart(2, '0')}</span><span className="match-info"><small>{match.bowling[0]?.opposition ? `VS ${match.bowling[0].opposition.toUpperCase()}` : 'SLINGERS CC 2.0'}</small><strong>{titleCase(matchTitle(match))}</strong></span><span className="match-mvp">{match.awards?.mvp?.team?.toLowerCase() === 'slingers cc 2.0' ? <><small>MVP</small><b>{match.awards.mvp.player}</b></> : <small>Scorecard</small>}</span><Icon name="arrow" size={17} className="muted-icon" /></a>)}</div><p className="archive-note">Match dates and results weren’t included in the supplied data. Open a scorecard for full match details.</p></>}
        </div>
        <footer className="page-footer"><span>SLINGERS CC 2.0 <i>·</i> MADE FOR THE LOVE OF THE GAME</span><span>STATS FROM {matches.length} SUPPLIED SCORECARDS</span></footer>
      </main>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      {selectedPlayer && <PlayerProfile player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  );
}

export default App;
