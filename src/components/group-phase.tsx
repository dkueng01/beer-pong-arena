"use client"
import { Trophy, Users, ArrowRight, CheckCircle2, Circle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Tournament, Group } from "@/lib/tournament"
import { getPlayerById, getGroupStandings } from "@/lib/tournament"

interface GroupPhaseProps {
  tournament: Tournament
  onSelectGroupWinner: (groupId: string, matchId: string, winnerId: string) => void
}

export function GroupPhase({ tournament, onSelectGroupWinner }: GroupPhaseProps) {
  const totalMatches = tournament.groups.reduce((acc, g) => acc + g.matches.length, 0)
  const completedMatches = tournament.groups.reduce((acc, g) => acc + g.matches.filter((m) => m.isComplete).length, 0)
  const completedGroups = tournament.groups.filter((g) => g.matches.every((m) => m.isComplete)).length

  return (
    <div className="space-y-6">
      {/* Header with overall progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Gruppenphase</h2>
            <p className="text-sm text-muted-foreground">Top {tournament.advancingPerGroup} pro Gruppe kommen weiter</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground">
              {completedMatches}/{totalMatches}
            </span>
            <span className="text-muted-foreground">Spiele</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-foreground">
              {completedGroups}/{tournament.groups.length}
            </span>
            <span className="text-muted-foreground">Gruppen fertig</span>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tournament.groups.map((group) => (
          <GroupCard key={group.id} group={group} tournament={tournament} onSelectWinner={onSelectGroupWinner} />
        ))}
      </div>
    </div>
  )
}

interface GroupCardProps {
  group: Group
  tournament: Tournament
  onSelectWinner: (groupId: string, matchId: string, winnerId: string) => void
}

function GroupCard({ group, tournament, onSelectWinner }: GroupCardProps) {
  const standings = getGroupStandings(group)
  const isComplete = group.matches.every((m) => m.isComplete)
  const completedMatches = group.matches.filter((m) => m.isComplete).length
  const totalMatches = group.matches.length
  const pendingMatches = group.matches.filter((m) => !m.isComplete)

  return (
    <Card className={`bg-card border-border overflow-hidden ${isComplete ? "ring-2 ring-primary/50" : ""}`}>
      {/* Group Header */}
      <div className="flex items-center justify-between p-4 bg-secondary/30 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${
              isComplete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {group.name.replace("Gruppe ", "")}
          </div>
          <span className="font-semibold text-foreground">{group.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
              <CheckCircle2 className="h-3 w-3" />
              Fertig
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <Clock className="h-3 w-3" />
              {completedMatches}/{totalMatches}
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Standings Table */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tabelle</h4>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 text-muted-foreground font-medium w-8">#</th>
                    <th className="text-left p-2 text-muted-foreground font-medium">Spieler</th>
                    <th className="text-center p-2 text-muted-foreground font-medium w-10">S</th>
                    <th className="text-center p-2 text-muted-foreground font-medium w-10">N</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing, index) => {
                    const player = getPlayerById(tournament, standing.playerId)
                    const isAdvancing = index < tournament.advancingPerGroup
                    return (
                      <tr
                        key={standing.playerId}
                        className={`border-t border-border ${isAdvancing ? "bg-primary/5" : ""}`}
                      >
                        <td className="p-2">
                          <span
                            className={`flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${
                              isAdvancing ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground truncate">{player?.name}</span>
                            {isAdvancing && isComplete && <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />}
                          </div>
                        </td>
                        <td className="p-2 text-center text-green-500 font-bold">{standing.wins}</td>
                        <td className="p-2 text-center text-red-400 font-bold">{standing.losses}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matches */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {pendingMatches.length > 0 ? "Offene Spiele" : "Alle Spiele"}
            </h4>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
              {(pendingMatches.length > 0 ? pendingMatches : group.matches).map((match) => {
                const player1 = getPlayerById(tournament, match.player1Id)
                const player2 = getPlayerById(tournament, match.player2Id)
                const canPlay = !match.isComplete

                return (
                  <div
                    key={match.id}
                    className={`flex items-center rounded-lg border ${
                      match.isComplete ? "border-border bg-muted/30" : "border-primary/30 bg-primary/5"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!canPlay}
                      onClick={() => player1 && onSelectWinner(group.id, match.id, player1.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 p-2 text-sm transition-all rounded-l-lg ${
                        match.winnerId === player1?.id
                          ? "bg-primary/20 text-foreground font-medium"
                          : canPlay
                            ? "hover:bg-primary/10 text-foreground cursor-pointer"
                            : "text-muted-foreground"
                      }`}
                    >
                      {match.winnerId === player1?.id && <Trophy className="h-3 w-3 text-primary flex-shrink-0" />}
                      <span className="truncate">{player1?.name}</span>
                    </button>

                    <div className="flex items-center justify-center w-8 text-[10px] text-muted-foreground font-bold">
                      {match.isComplete ? (
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      ) : (
                        <Circle className="h-2 w-2 fill-primary/50 text-primary/50" />
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!canPlay}
                      onClick={() => player2 && onSelectWinner(group.id, match.id, player2.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 p-2 text-sm transition-all rounded-r-lg ${
                        match.winnerId === player2?.id
                          ? "bg-primary/20 text-foreground font-medium"
                          : canPlay
                            ? "hover:bg-primary/10 text-foreground cursor-pointer"
                            : "text-muted-foreground"
                      }`}
                    >
                      <span className="truncate">{player2?.name}</span>
                      {match.winnerId === player2?.id && <Trophy className="h-3 w-3 text-primary flex-shrink-0" />}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Show completed count when filtering */}
            {pendingMatches.length > 0 && pendingMatches.length < group.matches.length && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {completedMatches} Spiel{completedMatches !== 1 ? "e" : ""} abgeschlossen
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
