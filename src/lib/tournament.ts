export interface Player {
  id: string
  name: string
}

export interface Match {
  id: string
  round: number
  position: number
  player1Id: string | null
  player2Id: string | null
  player1Score: number | null
  player2Score: number | null
  winnerId: string | null
  isComplete: boolean
  groupId?: string
}

export interface Group {
  id: string
  name: string
  playerIds: string[]
  matches: Match[]
}

export interface GroupStanding {
  playerId: string
  wins: number
  losses: number
  gamesPlayed: number
}

export interface Tournament {
  id: string
  name: string
  players: Player[]
  matches: Match[]
  currentRound: number
  totalRounds: number
  isComplete: boolean
  winnerId: string | null
  createdAt: string
  hasGroupPhase: boolean
  groups: Group[]
  groupPhaseComplete: boolean
  bracketSize: number
  advancingPerGroup: number
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function createGroupMatches(groupId: string, playerIds: string[]): Match[] {
  const matches: Match[] = []
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      matches.push({
        id: generateId(),
        round: 0, // Group phase is round 0
        position: matches.length,
        player1Id: playerIds[i],
        player2Id: playerIds[j],
        player1Score: null,
        player2Score: null,
        winnerId: null,
        isComplete: false,
        groupId,
      })
    }
  }
  return matches
}

export function calculateGroupDistribution(
  playerCount: number,
  bracketSize: number,
): { groupCount: number; advancingPerGroup: number; groupSizes: number[] } | null {
  if (bracketSize >= playerCount) return null
  if (playerCount < 4) return null

  const minGroupSize = 3
  const maxGroupSize = 5

  let bestConfig: { groupCount: number; advancingPerGroup: number; groupSizes: number[] } | null = null

  for (
    let groupCount = Math.ceil(playerCount / maxGroupSize);
    groupCount <= Math.floor(playerCount / minGroupSize);
    groupCount++
  ) {
    if (bracketSize % groupCount === 0) {
      const advancingPerGroup = bracketSize / groupCount
      const baseSize = Math.floor(playerCount / groupCount)
      const remainder = playerCount % groupCount

      const groupSizes = Array(groupCount)
        .fill(baseSize)
        .map((size, i) => (i < remainder ? size + 1 : size))

      const minSize = Math.min(...groupSizes)
      const maxSize = Math.max(...groupSizes)

      if (minSize >= advancingPerGroup && minSize >= 3 && maxSize <= 5) {
        bestConfig = { groupCount, advancingPerGroup, groupSizes }
        break
      }
    }
  }

  if (!bestConfig) {
    for (let groupCount = 2; groupCount <= playerCount / 2; groupCount++) {
      if (bracketSize % groupCount === 0) {
        const advancingPerGroup = bracketSize / groupCount
        const baseSize = Math.floor(playerCount / groupCount)
        const remainder = playerCount % groupCount

        const groupSizes = Array(groupCount)
          .fill(baseSize)
          .map((size, i) => (i < remainder ? size + 1 : size))

        const minSize = Math.min(...groupSizes)
        const maxSize = Math.max(...groupSizes)

        if (minSize >= advancingPerGroup && minSize >= 2 && maxSize <= 5) {
          bestConfig = { groupCount, advancingPerGroup, groupSizes }
          break
        }
      }
    }
  }

  return bestConfig
}

export function createTournamentWithGroups(name: string, playerNames: string[], bracketSize: number): Tournament {
  const players: Player[] = playerNames.map((name) => ({
    id: generateId(),
    name,
  }))

  const shuffledPlayers = shuffleArray(players)
  const groupDistribution = calculateGroupDistribution(players.length, bracketSize)

  if (!groupDistribution) {
    throw new Error("Invalid group distribution configuration")
  }

  const { groupCount, advancingPerGroup, groupSizes } = groupDistribution

  // Create groups
  const groups: Group[] = []
  let playerIndex = 0

  for (let g = 0; g < groupCount; g++) {
    const groupPlayerIds = shuffledPlayers.slice(playerIndex, playerIndex + groupSizes[g]).map((p) => p.id)

    const group: Group = {
      id: generateId(),
      name: `Gruppe ${String.fromCharCode(65 + g)}`, // A, B, C, ...
      playerIds: groupPlayerIds,
      matches: createGroupMatches(generateId(), groupPlayerIds),
    }

    groups.push(group)
    playerIndex += groupSizes[g]
  }

  // Calculate K.O. rounds
  const totalRounds = Math.ceil(Math.log2(bracketSize))

  // Create empty K.O. bracket matches
  const matches: Match[] = []
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: generateId(),
        round,
        position: i,
        player1Id: null,
        player2Id: null,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        isComplete: false,
      })
    }
  }

  return {
    id: generateId(),
    name,
    players,
    matches,
    currentRound: 0, // 0 = group phase
    totalRounds,
    isComplete: false,
    winnerId: null,
    createdAt: new Date().toISOString(),
    hasGroupPhase: true,
    groups,
    groupPhaseComplete: false,
    bracketSize,
    advancingPerGroup,
  }
}

export function getGroupStandings(group: Group): GroupStanding[] {
  const standings: Map<string, GroupStanding> = new Map()

  for (const playerId of group.playerIds) {
    standings.set(playerId, {
      playerId,
      wins: 0,
      losses: 0,
      gamesPlayed: 0,
    })
  }

  for (const match of group.matches) {
    if (match.isComplete && match.winnerId) {
      const loser = match.player1Id === match.winnerId ? match.player2Id : match.player1Id

      const winnerStanding = standings.get(match.winnerId)!
      winnerStanding.wins++
      winnerStanding.gamesPlayed++

      if (loser) {
        const loserStanding = standings.get(loser)!
        loserStanding.losses++
        loserStanding.gamesPlayed++
      }
    }
  }

  return Array.from(standings.values()).sort((a, b) => {
    // Sort by wins descending, then by fewer losses
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.losses - b.losses
  })
}

export function checkAndAdvanceGroupPhase(tournament: Tournament): Tournament {
  if (!tournament.hasGroupPhase || tournament.groupPhaseComplete) {
    return tournament
  }

  // Check if all group matches are complete
  const allGroupsComplete = tournament.groups.every((group) => group.matches.every((match) => match.isComplete))

  if (!allGroupsComplete) {
    return tournament
  }

  // Get advancing players from each group
  const advancingPlayers: string[] = []

  for (const group of tournament.groups) {
    const standings = getGroupStandings(group)
    const advancing = standings.slice(0, tournament.advancingPerGroup)
    advancingPlayers.push(...advancing.map((s) => s.playerId))
  }

  // Seed players into K.O. bracket
  // Alternate group winners for fair seeding
  const seededPlayers: string[] = []
  for (let rank = 0; rank < tournament.advancingPerGroup; rank++) {
    for (let g = 0; g < tournament.groups.length; g++) {
      const standings = getGroupStandings(tournament.groups[g])
      if (standings[rank]) {
        seededPlayers.push(standings[rank].playerId)
      }
    }
  }

  // Fill first round matches
  const firstRoundMatches = tournament.matches.filter((m) => m.round === 1)
  for (let i = 0; i < firstRoundMatches.length; i++) {
    const matchIndex = tournament.matches.findIndex((m) => m.id === firstRoundMatches[i].id)
    tournament.matches[matchIndex].player1Id = seededPlayers[i * 2] || null
    tournament.matches[matchIndex].player2Id = seededPlayers[i * 2 + 1] || null
  }

  tournament.groupPhaseComplete = true
  tournament.currentRound = 1

  return { ...tournament }
}

export function selectGroupWinner(
  tournament: Tournament,
  groupId: string,
  matchId: string,
  winnerId: string,
): Tournament {
  const groupIndex = tournament.groups.findIndex((g) => g.id === groupId)
  if (groupIndex === -1) return tournament

  const matchIndex = tournament.groups[groupIndex].matches.findIndex((m) => m.id === matchId)
  if (matchIndex === -1) return tournament

  tournament.groups[groupIndex].matches[matchIndex] = {
    ...tournament.groups[groupIndex].matches[matchIndex],
    winnerId,
    isComplete: true,
  }

  return checkAndAdvanceGroupPhase({ ...tournament })
}

// Original createTournament for direct K.O. (no groups)
export function createTournament(name: string, playerNames: string[]): Tournament {
  const players: Player[] = playerNames.map((name) => ({
    id: generateId(),
    name,
  }))

  const shuffledPlayers = shuffleArray(players)

  const totalRounds = Math.ceil(Math.log2(players.length))
  const bracketSize = Math.pow(2, totalRounds)

  const matches: Match[] = []
  const firstRoundMatches = bracketSize / 2

  for (let i = 0; i < firstRoundMatches; i++) {
    const player1 = shuffledPlayers[i * 2] || null
    const player2 = shuffledPlayers[i * 2 + 1] || null

    const match: Match = {
      id: generateId(),
      round: 1,
      position: i,
      player1Id: player1?.id || null,
      player2Id: player2?.id || null,
      player1Score: null,
      player2Score: null,
      winnerId: null,
      isComplete: false,
    }

    if (player1 && !player2) {
      match.winnerId = player1.id
      match.isComplete = true
    } else if (!player1 && player2) {
      match.winnerId = player2.id
      match.isComplete = true
    } else if (!player1 && !player2) {
      match.isComplete = true
    }

    matches.push(match)
  }

  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round)
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: generateId(),
        round,
        position: i,
        player1Id: null,
        player2Id: null,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        isComplete: false,
      })
    }
  }

  const tournament: Tournament = {
    id: generateId(),
    name,
    players,
    matches,
    currentRound: 1,
    totalRounds,
    isComplete: false,
    winnerId: null,
    createdAt: new Date().toISOString(),
    hasGroupPhase: false,
    groups: [],
    groupPhaseComplete: true,
    bracketSize,
    advancingPerGroup: 0,
  }

  return propagateByes(tournament)
}

function propagateByes(tournament: Tournament): Tournament {
  let updated = true

  while (updated) {
    updated = false
    const { matches, totalRounds } = tournament

    for (let round = 1; round < totalRounds; round++) {
      const currentRoundMatches = matches.filter((m) => m.round === round)
      const nextRoundMatches = matches.filter((m) => m.round === round + 1)

      for (let i = 0; i < currentRoundMatches.length; i += 2) {
        const match1 = currentRoundMatches[i]
        const match2 = currentRoundMatches[i + 1]
        const nextMatch = nextRoundMatches[Math.floor(i / 2)]

        if (match1?.isComplete && match1.winnerId && !nextMatch.player1Id) {
          nextMatch.player1Id = match1.winnerId
          updated = true
        }
        if (match2?.isComplete && match2.winnerId && !nextMatch.player2Id) {
          nextMatch.player2Id = match2.winnerId
          updated = true
        }

        if (nextMatch.player1Id && !nextMatch.player2Id && !nextMatch.isComplete) {
          const otherMatchComplete = match2?.isComplete
          if (otherMatchComplete && !match2?.winnerId) {
            nextMatch.winnerId = nextMatch.player1Id
            nextMatch.isComplete = true
            updated = true
          }
        }
        if (!nextMatch.player1Id && nextMatch.player2Id && !nextMatch.isComplete) {
          const otherMatchComplete = match1?.isComplete
          if (otherMatchComplete && !match1?.winnerId) {
            nextMatch.winnerId = nextMatch.player2Id
            nextMatch.isComplete = true
            updated = true
          }
        }
      }
    }
  }

  const finalMatch = tournament.matches.find((m) => m.round === tournament.totalRounds)
  if (finalMatch?.isComplete && finalMatch.winnerId) {
    tournament.isComplete = true
    tournament.winnerId = finalMatch.winnerId
  }

  return tournament
}

export function selectWinner(tournament: Tournament, matchId: string, winnerId: string): Tournament {
  const matchIndex = tournament.matches.findIndex((m) => m.id === matchId)
  if (matchIndex === -1) return tournament

  const match = tournament.matches[matchIndex]
  if (!match.player1Id || !match.player2Id) return tournament

  tournament.matches[matchIndex] = {
    ...match,
    winnerId,
    isComplete: true,
  }

  const nextRoundMatches = tournament.matches.filter((m) => m.round === match.round + 1)
  const nextMatchIndex = Math.floor(match.position / 2)
  const nextMatch = nextRoundMatches[nextMatchIndex]

  if (nextMatch) {
    const isFirstOfPair = match.position % 2 === 0
    const nextMatchArrayIndex = tournament.matches.findIndex((m) => m.id === nextMatch.id)

    if (isFirstOfPair) {
      tournament.matches[nextMatchArrayIndex].player1Id = winnerId
    } else {
      tournament.matches[nextMatchArrayIndex].player2Id = winnerId
    }
  }

  const finalMatch = tournament.matches.find((m) => m.round === tournament.totalRounds)
  if (finalMatch?.isComplete && finalMatch.winnerId) {
    tournament.isComplete = true
    tournament.winnerId = finalMatch.winnerId
  }

  return { ...tournament }
}

export function getPlayerById(tournament: Tournament, playerId: string | null): Player | null {
  if (!playerId) return null
  return tournament.players.find((p) => p.id === playerId) || null
}

export function getRoundName(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round
  if (roundsFromEnd === 0) return "Final"
  if (roundsFromEnd === 1) return "Semi-Finals"
  if (roundsFromEnd === 2) return "Quarter-Finals"
  return `Round ${round}`
}
