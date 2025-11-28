"use client"

import type React from "react"

import { useState, useMemo, useRef } from "react"
import { Plus, X, Trophy, Users, Swords, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { calculateGroupDistribution } from "@/lib/tournament"

interface PlayerSetupProps {
  onStartTournament: (name: string, players: string[], useGroupPhase: boolean, bracketSize: number) => void
}

const PERFECT_BRACKET_SIZES = [2, 4, 8, 16]

function calculateTournamentStats(
  playerCount: number,
  isPerfect: boolean,
  groupPreview: { groupCount: number; groupSizes: number[]; advancingPerGroup: number } | null,
  bracketSize: number,
) {
  let groupMatches = 0
  let koRounds = 0
  let koMatches = 0

  if (isPerfect) {
    koRounds = Math.log2(playerCount)
    koMatches = playerCount - 1
  } else if (groupPreview) {
    for (const size of groupPreview.groupSizes) {
      groupMatches += (size * (size - 1)) / 2
    }
    koRounds = Math.log2(bracketSize)
    koMatches = bracketSize - 1
  }

  return {
    groupMatches,
    koRounds,
    koMatches,
    totalMatches: groupMatches + koMatches,
  }
}

export function PlayerSetup({ onStartTournament }: PlayerSetupProps) {
  const [tournamentName, setTournamentName] = useState("")
  const [players, setPlayers] = useState<string[]>([])
  const [newPlayerName, setNewPlayerName] = useState("")
  const [selectedBracketSize, setSelectedBracketSize] = useState<number>(4)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const validPlayerCount = players.length
  const isPerfectBracket = PERFECT_BRACKET_SIZES.includes(validPlayerCount)
  const requiresGroupPhase = validPlayerCount >= 3 && !isPerfectBracket

  const bracketOptions = useMemo(() => {
    if (!requiresGroupPhase) return []
    const options: number[] = []
    for (const size of [2, 4, 8, 16]) {
      if (size < validPlayerCount) {
        options.push(size)
      }
    }
    return options
  }, [validPlayerCount, requiresGroupPhase])

  const effectiveBracketSize = useMemo(() => {
    if (!requiresGroupPhase) return 0
    if (bracketOptions.includes(selectedBracketSize)) return selectedBracketSize
    return bracketOptions[bracketOptions.length - 1] || 4
  }, [bracketOptions, selectedBracketSize, requiresGroupPhase])

  const groupPreview = useMemo(() => {
    if (!requiresGroupPhase || validPlayerCount < 3 || bracketOptions.length === 0) {
      return null
    }
    return calculateGroupDistribution(validPlayerCount, effectiveBracketSize)
  }, [requiresGroupPhase, validPlayerCount, effectiveBracketSize, bracketOptions])

  const addPlayer = () => {
    const name = newPlayerName.trim()
    if (!name) return

    if (players.includes(name)) {
      setError("Spieler existiert bereits")
      return
    }

    setPlayers([...players, name])
    setNewPlayerName("")
    setError("")
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addPlayer()
    }
  }

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index))
  }

  const canStart = useMemo(() => {
    if (!tournamentName.trim()) return false
    if (validPlayerCount < 2) return false
    if (isPerfectBracket) return true
    if (requiresGroupPhase) {
      return bracketOptions.length > 0 && groupPreview !== null
    }
    return false
  }, [tournamentName, validPlayerCount, isPerfectBracket, requiresGroupPhase, bracketOptions, groupPreview])

  const validationMessage = useMemo(() => {
    if (!tournamentName.trim()) return "Turniername fehlt"
    if (validPlayerCount < 2) return "Mindestens 2 Spieler benoetigt"
    if (validPlayerCount === 3) return "3 Spieler nicht moeglich - brauche 2, 4 oder mehr"
    if (requiresGroupPhase && bracketOptions.length === 0) return "Mehr Spieler fuer gueltige Gruppenphase benoetigt"
    return null
  }, [tournamentName, validPlayerCount, requiresGroupPhase, bracketOptions])

  const handleStart = () => {
    if (!canStart) return
    onStartTournament(tournamentName.trim(), players, requiresGroupPhase, effectiveBracketSize)
  }

  const nextValidCount = useMemo(() => {
    if (isPerfectBracket) return null
    if (validPlayerCount < 2) return 2
    if (validPlayerCount === 3) return 4
    return null
  }, [validPlayerCount, isPerfectBracket])

  const tournamentStats = useMemo(() => {
    if (validPlayerCount < 2) return null
    if (validPlayerCount === 3) return null

    if (isPerfectBracket) {
      return calculateTournamentStats(validPlayerCount, true, null, validPlayerCount)
    }

    if (requiresGroupPhase && groupPreview) {
      return calculateTournamentStats(validPlayerCount, false, groupPreview, effectiveBracketSize)
    }

    return null
  }, [validPlayerCount, isPerfectBracket, requiresGroupPhase, groupPreview, effectiveBracketSize])

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Beer Pong Arena</h1>
          <p className="text-muted-foreground">Erstelle dein Turnier in wenigen Schritten</p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Step 1: Tournament Name */}
            <div className="p-5 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <Label className="text-lg font-semibold text-foreground">Turniername</Label>
              </div>
              <Input
                placeholder="z.B. Freitag Nacht Showdown"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground h-12 text-base"
              />
            </div>

            {/* Step 2: Players */}
            <div className="p-5 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Spieler
                </Label>
                <span className="ml-auto text-sm text-muted-foreground">
                  {validPlayerCount} Spieler
                  {nextValidCount && <span className="text-primary"> (min. {nextValidCount})</span>}
                </span>
              </div>

              <div className="flex gap-2 mb-4">
                <Input
                  ref={inputRef}
                  placeholder="Name eingeben + Enter"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground h-12"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={addPlayer}
                  disabled={!newPlayerName.trim()}
                  className="h-12 w-12 shrink-0"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              <div className="min-h-[140px] max-h-[200px] p-3 rounded-xl bg-secondary/30 border border-border overflow-y-auto">
                {players.length > 0 ? (
                  <div className="flex flex-wrap gap-2 content-start">
                    {players.map((player, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-foreground text-sm"
                      >
                        <span className="font-medium">{player}</span>
                        <button
                          type="button"
                          onClick={() => removePlayer(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Noch keine Spieler hinzugefuegt
                  </div>
                )}
              </div>

              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            </div>

            {/* Step 3: Bracket Size (only for group phase) */}
            {requiresGroupPhase && bracketOptions.length > 0 && (
              <div className="p-5 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    3
                  </div>
                  <Label className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Finale Größe
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Wie viele Spieler sollen in die K.O.-Phase kommen?</p>
                <div className="grid grid-cols-4 gap-2">
                  {bracketOptions.map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant={effectiveBracketSize === size ? "default" : "outline"}
                      onClick={() => setSelectedBracketSize(size)}
                      className={`h-14 text-lg font-bold ${effectiveBracketSize === size ? "" : "border-border bg-transparent"}`}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            {/* Tournament Mode */}
            <div
              className={`p-5 rounded-2xl border-2 ${validPlayerCount < 2
                ? "bg-muted/30 border-border"
                : isPerfectBracket
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-primary/10 border-primary/30"
                }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <Swords
                  className={`h-6 w-6 ${validPlayerCount < 2 ? "text-muted-foreground" : isPerfectBracket ? "text-green-500" : "text-primary"}`}
                />
                <span className="text-lg font-semibold text-foreground">
                  {validPlayerCount < 2 ? "Turniermodus" : isPerfectBracket ? "Direktes K.O." : "Gruppenphase + K.O."}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {validPlayerCount < 2
                  ? "Fuege Spieler hinzu um den Modus zu sehen"
                  : isPerfectBracket
                    ? `Perfektes Bracket: ${validPlayerCount} Spieler spielen direkt gegeneinander.`
                    : "Spieler werden in Gruppen aufgeteilt. Die Besten kommen ins K.O."}
              </p>
            </div>

            {/* Group Preview */}
            {requiresGroupPhase && groupPreview && (
              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-4">Gruppenaufteilung</h3>
                <div className="grid grid-cols-2 gap-3">
                  {groupPreview.groupSizes.map((size, i) => (
                    <div key={i} className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                      <div className="text-xs text-muted-foreground mb-1">Gruppe {String.fromCharCode(65 + i)}</div>
                      <div className="text-2xl font-bold text-foreground">{size}</div>
                      <div className="text-xs text-muted-foreground">Spieler</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-xl bg-primary/10 text-center">
                  <span className="text-sm text-foreground">
                    Top <span className="font-bold text-primary">{groupPreview.advancingPerGroup}</span> pro Gruppe
                    kommen weiter
                  </span>
                </div>
              </div>
            )}

            {/* Tournament Stats */}
            {tournamentStats && (
              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Turnier-Uebersicht
                </h3>
                <div className="space-y-3">
                  {tournamentStats.groupMatches > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-muted-foreground">Gruppenspiele</span>
                      <span className="font-semibold text-foreground">{tournamentStats.groupMatches}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">K.O.-Runden</span>
                    <span className="font-semibold text-foreground">{tournamentStats.koRounds}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-muted-foreground">K.O.-Spiele</span>
                    <span className="font-semibold text-foreground">{tournamentStats.koMatches}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold text-foreground">Gesamt</span>
                    <span className="text-2xl font-bold text-primary">{tournamentStats.totalMatches} Spiele</span>
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="sticky bottom-4">
              <Button
                onClick={handleStart}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
                disabled={!canStart}
              >
                <Trophy className="h-5 w-5 mr-2" />
                Turnier starten
              </Button>

              {!canStart && validationMessage && (
                <p className="mt-3 text-sm text-muted-foreground text-center">{validationMessage}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
