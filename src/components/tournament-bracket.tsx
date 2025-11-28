"use client"

import { Trophy, RotateCcw, Crown, Swords, Clock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MatchCard } from "@/components/match-card"
import { GroupPhase } from "@/components/group-phase"
import type { Tournament } from "@/lib/tournament"
import { getPlayerById, getRoundName } from "@/lib/tournament"

interface TournamentBracketProps {
  tournament: Tournament
  onSelectWinner: (matchId: string, winnerId: string) => void
  onSelectGroupWinner: (groupId: string, matchId: string, winnerId: string) => void
  onReset: () => void
}

export function TournamentBracket({
  tournament,
  onSelectWinner,
  onSelectGroupWinner,
  onReset,
}: TournamentBracketProps) {
  const winner = tournament.winnerId ? getPlayerById(tournament, tournament.winnerId) : null
  const rounds = Array.from({ length: tournament.totalRounds }, (_, i) => i + 1)
  const showGroupPhase = tournament.hasGroupPhase && !tournament.groupPhaseComplete

  const totalMatches = tournament.matches.filter((m) => m.player1Id && m.player2Id).length
  const completedMatches = tournament.matches.filter((m) => m.isComplete && m.winnerId).length
  const readyMatches = tournament.matches.filter((m) => !m.isComplete && m.player1Id && m.player2Id).length
  const waitingMatches = tournament.matches.filter((m) => !m.isComplete && (!m.player1Id || !m.player2Id)).length
  const progressPercent = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{tournament.name}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{tournament.players.length} Spieler</span>
                  {tournament.hasGroupPhase && (
                    <>
                      <span className="text-border">|</span>
                      <span>{tournament.groups.length} Gruppen</span>
                    </>
                  )}
                  <span className="text-border">|</span>
                  <span>{tournament.totalRounds} K.O.-Runden</span>
                </div>
              </div>
            </div>
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground hover:text-foreground bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Neues Turnier
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tournament.isComplete && winner && (
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 border border-primary/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,200,0,0.1),transparent_50%)]" />
            <div className="relative p-8 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-accent/20 border-2 border-accent mb-4">
                <Crown className="h-10 w-10 text-accent" />
              </div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Turniersieger</p>
              <h2 className="text-4xl font-bold text-foreground">{winner.name}</h2>
            </div>
          </div>
        )}

        {showGroupPhase ? (
          <GroupPhase tournament={tournament} onSelectGroupWinner={onSelectGroupWinner} />
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Swords className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">K.O.-Phase</h2>
                    <p className="text-sm text-muted-foreground">
                      {completedMatches} von {totalMatches} Spielen abgeschlossen
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-foreground">{progressPercent}%</span>
                </div>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{completedMatches}</p>
                    <p className="text-xs text-muted-foreground">Abgeschlossen</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Swords className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{readyMatches}</p>
                    <p className="text-xs text-muted-foreground">Spielbereit</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{waitingMatches}</p>
                    <p className="text-xs text-muted-foreground">Wartend</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-secondary/30">
                <h3 className="font-medium text-foreground">Turnierbaum</h3>
              </div>
              <CardContent className="p-4 overflow-x-auto">
                <div className="flex gap-6 min-w-max py-2">
                  {rounds.map((round) => {
                    const roundMatches = tournament.matches
                      .filter((m) => m.round === round)
                      .sort((a, b) => a.position - b.position)

                    const isFinal = round === tournament.totalRounds
                    const isSemiFinal = round === tournament.totalRounds - 1 && tournament.totalRounds > 1

                    return (
                      <div key={round} className="flex flex-col min-w-[220px]">
                        <div
                          className={`text-center mb-4 px-4 py-2.5 rounded-lg ${
                            isFinal
                              ? "bg-accent text-accent-foreground font-bold"
                              : isSemiFinal
                                ? "bg-primary/10 text-primary font-medium"
                                : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <span className="text-sm">{getRoundName(round, tournament.totalRounds)}</span>
                        </div>

                        <div
                          className="flex flex-col justify-around flex-1 gap-4"
                          style={{
                            minHeight: `${Math.max(roundMatches.length * 140, 140)}px`,
                          }}
                        >
                          {roundMatches.map((match) => (
                            <div key={match.id} className="relative">
                              <MatchCard
                                match={match}
                                player1={getPlayerById(tournament, match.player1Id)}
                                player2={getPlayerById(tournament, match.player2Id)}
                                onSelectWinner={onSelectWinner}
                                isFinal={isFinal}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
