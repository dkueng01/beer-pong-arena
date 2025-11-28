"use client"

import { Trophy, ArrowRight, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Match, Player } from "@/lib/tournament"

interface MatchCardProps {
  match: Match
  player1: Player | null
  player2: Player | null
  onSelectWinner: (matchId: string, winnerId: string) => void
  isFinal?: boolean
}

export function MatchCard({ match, player1, player2, onSelectWinner, isFinal }: MatchCardProps) {
  const canPlay = player1 && player2 && !match.isComplete
  const isWaiting = (!player1 || !player2) && !match.isComplete

  const isByeMatch = match.isComplete && match.winnerId && (!player1 || !player2)
  const byeWinner = isByeMatch ? player1 || player2 : null

  const handleSelectWinner = (playerId: string) => {
    if (canPlay) {
      onSelectWinner(match.id, playerId)
    }
  }

  if (isByeMatch && byeWinner) {
    return (
      <Card className="bg-secondary/30 border-border/50">
        <CardContent className="p-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{byeWinner.name}</span>
            </div>
            <span className="text-xs text-muted-foreground/70">Freilos</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`transition-all ${
        isFinal
          ? "bg-accent/5 border-accent/50 ring-1 ring-accent/20"
          : canPlay
            ? "bg-card border-primary/30 ring-1 ring-primary/10"
            : "bg-card border-border"
      } ${match.isComplete ? "opacity-80" : ""}`}
    >
      <CardContent className="p-3">
        {canPlay && (
          <div className="flex items-center gap-1.5 mb-2 text-xs text-primary">
            <Zap className="h-3 w-3" />
            <span className="uppercase tracking-wider font-medium">Live - Waehle Gewinner</span>
          </div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => player1 && handleSelectWinner(player1.id)}
            disabled={!canPlay}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
              match.winnerId === player1?.id
                ? "bg-green-500/20 border border-green-500/50"
                : "bg-secondary/50 border border-transparent"
            } ${canPlay ? "hover:bg-primary/10 hover:border-primary/40 cursor-pointer" : ""}`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {match.winnerId === player1?.id && <Trophy className="h-4 w-4 text-green-500 shrink-0" />}
              <span
                className={`truncate text-sm font-medium ${
                  player1
                    ? match.winnerId === player1?.id
                      ? "text-green-500"
                      : "text-foreground"
                    : "text-muted-foreground italic"
                }`}
              >
                {player1?.name || "Wartend..."}
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2 px-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">VS</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={() => player2 && handleSelectWinner(player2.id)}
            disabled={!canPlay}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
              match.winnerId === player2?.id
                ? "bg-green-500/20 border border-green-500/50"
                : "bg-secondary/50 border border-transparent"
            } ${canPlay ? "hover:bg-primary/10 hover:border-primary/40 cursor-pointer" : ""}`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {match.winnerId === player2?.id && <Trophy className="h-4 w-4 text-green-500 shrink-0" />}
              <span
                className={`truncate text-sm font-medium ${
                  player2
                    ? match.winnerId === player2?.id
                      ? "text-green-500"
                      : "text-foreground"
                    : "text-muted-foreground italic"
                }`}
              >
                {player2?.name || "Wartend..."}
              </span>
            </div>
          </button>

          {isWaiting && (
            <div className="text-center text-xs text-muted-foreground mt-1 py-1.5 rounded bg-muted/30">
              Warte auf Spieler...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
