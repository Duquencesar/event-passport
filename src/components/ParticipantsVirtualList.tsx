import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCheck, Loader2 } from "lucide-react";

export type VirtualListParticipant = {
  id: string;
  name: string;
  tag: string | null;
  ticket_type: string;
  access_type: string;
};

type Props = {
  participants: VirtualListParticipant[];
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  checkedInPersonIds: Set<string>;
  selectedParticipantIds: Set<string>;
  bulkCheckingIn: boolean;
  checkingInFromListId: string | null;
  onToggleSelect: (id: string, checked: boolean) => void;
  onCheckin: (participant: VirtualListParticipant) => void;
  onLoadMore: () => void;
};

const ROW_HEIGHT = 84; // approx px per row including margin
const VISIBLE_HEIGHT = 520;

export function ParticipantsVirtualList({
  participants,
  total,
  hasMore,
  loadingMore,
  checkedInPersonIds,
  selectedParticipantIds,
  bulkCheckingIn,
  checkingInFromListId,
  onToggleSelect,
  onCheckin,
  onLoadMore,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: participants.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  // Trigger load more when the user scrolls near the end
  const items = virtualizer.getVirtualItems();
  const lastIndex = items.length > 0 ? items[items.length - 1].index : -1;
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    if (lastIndex >= participants.length - 5 && participants.length > 0) {
      onLoadMore();
    }
  }, [lastIndex, hasMore, loadingMore, participants.length, onLoadMore]);

  if (participants.length === 0 && !loadingMore) {
    return (
      <div className="glass-subtle rounded-2xl py-8 text-center">
        <p className="text-muted-foreground text-sm">Nenhum inscrito encontrado para este evento</p>
      </div>
    );
  }

  const loadedCount = participants.length;
  const progressPct = total > 0 ? Math.min(100, Math.round((loadedCount / total) * 100)) : 100;

  return (
    <div className="space-y-2">
      {/* Sticky progress indicator */}
      <div
        className="glass-subtle rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-10"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 min-w-0">
          {loadingMore ? (
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
          ) : (
            <span className={`w-2 h-2 rounded-full shrink-0 ${hasMore ? "bg-amber-400" : "bg-emerald-400"}`} />
          )}
          <span className="text-xs font-medium text-foreground tabular-nums">
            {loadingMore ? "Carregando" : hasMore ? "Carregados" : "Tudo carregado"}{" "}
            <span className="text-primary font-semibold">{loadedCount}</span>{" "}
            de <span className="font-semibold">{total}</span>
          </span>
        </div>
        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden max-w-[180px]">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div
        ref={parentRef}
        className="overflow-auto rounded-2xl"
        style={{ height: Math.min(VISIBLE_HEIGHT, Math.max(ROW_HEIGHT, participants.length * ROW_HEIGHT) + 8) }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {items.map((virtualRow) => {
            const participant = participants[virtualRow.index];
            if (!participant) return null;
            const alreadyCheckedIn = checkedInPersonIds.has(participant.id);
            return (
              <div
                key={participant.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  paddingBottom: 8,
                }}
              >
                <div className="glass-subtle rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={selectedParticipantIds.has(participant.id)}
                      disabled={alreadyCheckedIn || bulkCheckingIn}
                      onCheckedChange={(checked) => onToggleSelect(participant.id, !!checked)}
                      aria-label={`Selecionar ${participant.name}`}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate">{participant.name}</span>
                        {participant.tag && (
                          <Badge variant="secondary" className="text-xs rounded-lg">
                            {participant.tag}
                          </Badge>
                        )}
                        {alreadyCheckedIn && (
                          <Badge className="bg-primary/12 text-primary border-0 rounded-lg text-xs">
                            Check-in feito
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground truncate max-w-full">
                          {participant.ticket_type}
                        </span>
                        <Badge
                          variant="outline"
                          className="rounded-lg border-primary/35 bg-primary/10 text-primary text-xs font-semibold"
                        >
                          Tipo de acesso: {participant.access_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyCheckedIn ? "outline" : "default"}
                    disabled={alreadyCheckedIn || checkingInFromListId === participant.id}
                    onClick={() => onCheckin(participant)}
                    className="rounded-xl gap-2 shrink-0"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {checkingInFromListId === participant.id
                      ? "Registrando..."
                      : alreadyCheckedIn
                        ? "Feito"
                        : "Check-in"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasMore && (
        <div className="text-center py-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-lg text-xs"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Carregando mais...
              </>
            ) : (
              `Carregar mais (${total - loadedCount} restantes)`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}