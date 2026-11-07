import source from './data/matches.json';
import playerProfilesSource from './data/player-profiles.json';

export interface BattingLine {
  player_name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  dismissal: string;
}

export interface BowlingLine {
  player_name: string;
  overs: string;
  runs: number;
  wickets: number;
  economy: number;
  maidens: number;
  wides: number;
  no_balls: number;
  dot_balls: number;
}

export type FieldingContribution =
  | 'catch'
  | 'caught_behind'
  | 'caught_and_bowled'
  | 'stumping'
  | 'run_out'
  | 'assisted_run_out';

export interface FieldingLine {
  innings: number;
  opposition?: string;
  dismissed_batter: string;
  dismissal: string;
  type: FieldingContribution;
  fielders: Array<{
    player_name: string;
    contribution: FieldingContribution;
  }>;
}

export interface MatchRecord {
  scorecard_url: string;
  match: string;
  team: string;
  batting: Array<{ innings: number; players: BattingLine[] }>;
  bowling: Array<{ innings: number; opposition?: string; players: BowlingLine[] }>;
  fielding?: FieldingLine[];
  awards: {
    mvp?: { player: string; team: string; points: number } | null;
    player_of_match?: { player: string; team: string } | null;
    best_fielder?: { player: string; team: string } | null;
  };
}

export interface PlayerStats {
  name: string;
  image?: string;
  battingInnings: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  notOuts: number;
  highestScore: number;
  fifties: number;
  centuries: number;
  wickets: number;
  runsConceded: number;
  ballsBowled: number;
  maidens: number;
  bowlingAppearances: number;
  mvpPoints: number;
  mvpAwards: number;
  catches: number;
  caughtBehind: number;
  caughtAndBowled: number;
  stumpings: number;
  runOuts: number;
  assistedRunOuts: number;
  appearances: number;
}

export const matches = source.matches as MatchRecord[];
const playerProfiles = playerProfilesSource as Record<string, { image: string }>;
const normalizePlayer = (name: string) =>
  name.replace(/\s*\((?:c|wk)\)\s*$/i, '').trim().replace(/\s+/g, ' ');

const playerKey = (name: string) => normalizePlayer(name).toLocaleLowerCase();
const playerImages = new Map(
  Object.entries(playerProfiles).map(([name, profile]) => [playerKey(name), profile.image]),
);

const oversToBalls = (overs: string) => {
  const [whole, partial = '0'] = overs.split('.');
  return Number(whole) * 6 + Number(partial);
};

export const players: PlayerStats[] = (() => {
  const roster = new Map<string, PlayerStats>();

  const getPlayer = (name: string) => {
    const key = playerKey(name);
    let player = roster.get(key);
    if (!player) {
      player = {
        name: normalizePlayer(name),
        image: playerImages.get(key) ? `/player-profiles/${playerImages.get(key)}` : undefined,
        battingInnings: 0,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        notOuts: 0,
        highestScore: 0,
        fifties: 0,
        centuries: 0,
        wickets: 0,
        runsConceded: 0,
        ballsBowled: 0,
        maidens: 0,
        bowlingAppearances: 0,
        mvpPoints: 0,
        mvpAwards: 0,
        catches: 0,
        caughtBehind: 0,
        caughtAndBowled: 0,
        stumpings: 0,
        runOuts: 0,
        assistedRunOuts: 0,
        appearances: 0,
      };
      roster.set(key, player);
    }
    return player;
  };

  for (const match of matches) {
    for (const innings of match.batting ?? []) {
      for (const line of innings.players ?? []) {
        const player = getPlayer(line.player_name);
        player.battingInnings += 1;
        player.runs += line.runs;
        player.ballsFaced += line.balls;
        player.fours += line.fours;
        player.sixes += line.sixes;
        player.notOuts += /^not out$/i.test(line.dismissal.trim()) ? 1 : 0;
        player.highestScore = Math.max(player.highestScore, line.runs);
        player.fifties += line.runs >= 50 && line.runs < 100 ? 1 : 0;
        player.centuries += line.runs >= 100 ? 1 : 0;
      }
    }

    for (const innings of match.bowling ?? []) {
      for (const line of innings.players ?? []) {
        const player = getPlayer(line.player_name);
        player.wickets += line.wickets;
        player.runsConceded += line.runs;
        player.ballsBowled += oversToBalls(line.overs);
        player.maidens += line.maidens;
        player.bowlingAppearances += 1;
      }
    }

    for (const event of match.fielding ?? []) {
      for (const fielder of event.fielders ?? []) {
        const player = getPlayer(fielder.player_name);
        switch (fielder.contribution) {
          case 'catch':
            player.catches += 1;
            break;
          case 'caught_behind':
            player.caughtBehind += 1;
            break;
          case 'caught_and_bowled':
            player.caughtAndBowled += 1;
            break;
          case 'stumping':
            player.stumpings += 1;
            break;
          case 'run_out':
            player.runOuts += 1;
            break;
          case 'assisted_run_out':
            player.assistedRunOuts += 1;
            break;
        }
      }
    }

    const mvp = match.awards?.mvp;
    if (mvp && mvp.team.toLocaleLowerCase() === match.team.toLocaleLowerCase()) {
      const player = getPlayer(mvp.player);
      player.mvpPoints += mvp.points;
      player.mvpAwards += 1;
    }
  }

  for (const player of roster.values()) {
    player.appearances = Math.max(player.battingInnings, player.bowlingAppearances);
  }

  return [...roster.values()];
})();

export const battingAverage = (player: PlayerStats) => {
  const dismissals = player.battingInnings - player.notOuts;
  return dismissals > 0 ? player.runs / dismissals : player.runs;
};

export const strikeRate = (player: PlayerStats) =>
  player.ballsFaced ? (player.runs / player.ballsFaced) * 100 : 0;

export const bowlingAverage = (player: PlayerStats) =>
  player.wickets ? player.runsConceded / player.wickets : 0;

export const bowlingEconomy = (player: PlayerStats) =>
  player.ballsBowled ? (player.runsConceded * 6) / player.ballsBowled : 0;

export const fieldingDismissals = (player: PlayerStats) =>
  player.catches + player.caughtBehind + player.caughtAndBowled + player.stumpings + player.runOuts + player.assistedRunOuts;

export const formatOvers = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export const titleCase = (value: string) =>
  value.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

export const matchTitle = (match: MatchRecord) =>
  match.match.replace(/\s+Scorecard\s*\|\s*CricHeroes\s*$/i, '');
