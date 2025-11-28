"use client"

import { PlayerSetup } from "@/components/player-setup"
import { TournamentBracket } from "@/components/tournament-bracket"
import { useTournament } from "@/hooks/use-tournament"
import { createTournament, createTournamentWithGroups, selectWinner, selectGroupWinner } from "@/lib/tournament"

export default function Home() {
  const { tournament, isLoading, saveTournament, clearTournament } = useTournament()

  const handleStartTournament = (name: string, players: string[], useGroupPhase: boolean, bracketSize: number) => {
    const newTournament = useGroupPhase
      ? createTournamentWithGroups(name, players, bracketSize)
      : createTournament(name, players)
    saveTournament(newTournament)
  }

  const handleSelectWinner = (matchId: string, winnerId: string) => {
    if (!tournament) return
    const updated = selectWinner(tournament, matchId, winnerId)
    saveTournament(updated)
  }

  const handleSelectGroupWinner = (groupId: string, matchId: string, winnerId: string) => {
    if (!tournament) return
    const updated = selectGroupWinner(tournament, groupId, matchId, winnerId)
    saveTournament(updated)
  }

  const handleReset = () => {
    if (confirm("Bist du sicher? Das aktuelle Turnier wird geloescht.")) {
      clearTournament()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Turnier wird geladen...</div>
      </div>
    )
  }

  if (!tournament) {
    return <PlayerSetup onStartTournament={handleStartTournament} />
  }

  return (
    <TournamentBracket
      tournament={tournament}
      onSelectWinner={handleSelectWinner}
      onSelectGroupWinner={handleSelectGroupWinner}
      onReset={handleReset}
    />
  )
}
