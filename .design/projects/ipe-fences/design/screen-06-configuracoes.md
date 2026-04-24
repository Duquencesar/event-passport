# Screen 06 — Configurações
> Phase: design | Project: Ipê Fences | Generated: 2026-04-20

---

## Purpose

Admin settings screen. Carlos configures the Telegram bot (token + chat ID) that sends automated check-in notifications. Also hosts the access-type reference table so he can remind himself what each type means. Low-frequency use — maybe once a month. Form should be reassuring, not minimal.

## User Flow Position

Accessible from nav item 5 (`/configuracoes`). Admin-only area, not used during events.

---

## Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│  [nav header — Layout.tsx]                                      │
├─────────────────────────────────────────────────────────────────┤
│  max-w-6xl mx-auto px-8 py-8                                    │
│                                                                 │
│  [SectionBadge: ADMINISTRAÇÃO pulse=false]                      │
│  Configurações  [gradient-text "Configurações"]                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [SectionBadge: TELEGRAM pulse=false]                        ││
│  │ Integração Telegram                                         ││
│  │                                                             ││
│  │  Bot Token                                                  ││
│  │  [──────────────────────────────────────────────────]       ││
│  │  text-xs text-muted: "Token do bot @IpeVillageBot"          ││
│  │                                                             ││
│  │  Chat ID                                                    ││
│  │  [──────────────────────────────────────────────────]       ││
│  │  text-xs text-muted: "ID do grupo ou canal"                 ││
│  │                                                             ││
│  │  [Testar conexão]  [Salvar configurações →]                 ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [SectionBadge: TIPOS DE ACESSO pulse=false]                 ││
│  │ Referência de Tipos de Acesso                               ││
│  │                                                             ││
│  │  Table: Tipo | Descrição | Permissões | Cor no sistema      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Form max-width:** `max-w-xl` — settings forms don't benefit from full width.

---

## Telegram Config Form

Card: `rounded-xl border border-[--border] bg-[--card] p-6`

### Section header
`SectionBadge label="TELEGRAM" pulse={false}` + `h2` heading "Integração Telegram" in Calistoga `text-xl md:text-2xl`.

### Fields

**Bot Token:**
- Label: `text-sm font-medium text-foreground`
- Input: `h-12 rounded-xl`, `type="text"`, `placeholder="1234567890:AAEFGH..."`, Electric Blue focus ring
- Helper text: `text-xs text-muted-foreground mt-1` — "Token do bot @IpeVillageBot"
- Input shows masked value if already saved: `"••••••••••••••••••••" + last 4 chars` — show/hide toggle icon button

**Chat ID:**
- Label: `text-sm font-medium text-foreground`
- Input: `h-12 rounded-xl`, `type="text"`, `placeholder="-1001234567890"`
- Helper text: `text-xs text-muted-foreground mt-1` — "ID do grupo ou canal do Telegram"

### Action buttons
```
[Testar conexão]  [Salvar configurações →]
ghost/outline      primary gradient
h-11 px-5         h-11 px-5
rounded-xl         rounded-xl
```

Both buttons in `flex gap-3` row. On mobile: stack full-width.

**"Testar conexão":** Secondary button (outline), `SendHorizontal` icon left. On click: sends test message via `createServerFn`. Loading state: spinner + "Testando...". Success: Toast "✓ Mensagem de teste enviada com sucesso!" (Sonner green). Error: Toast "Falha ao conectar. Verifique o token e o Chat ID." (Sonner destructive).

**"Salvar configurações":** Primary gradient, `ArrowRight` icon right (icon-nudge on hover). On click: saves credentials. Loading: spinner + "Salvando...". Success: Toast "Configurações salvas." (Sonner green) + success state indicator below button.

### Success state (post-save)
Below action row: `flex items-center gap-2 text-sm text-emerald-400`
`CheckCircle h-4 w-4` + "Configurações salvas em {HH:MM DD/MM/YYYY}"

---

## Access Type Reference Table

Card: `rounded-xl border border-[--border] bg-[--card] overflow-hidden`

### Section header (inside card)
`p-6 pb-4` + `SectionBadge label="TIPOS DE ACESSO" pulse={false}` + `h2` "Referência de Tipos de Acesso"

### Table

shadcn `Table`:

```
| Tipo       | Descrição              | Acesso Check-in | Cor no Sistema  |
|------------|------------------------|-----------------|-----------------|
| Membro     | Associado ativo        | ✓ Permitido     | Emerald         |
| Visitante  | Convidado pontual      | ✓ Permitido     | Blue            |
| Pendente   | Aguardando aprovação   | ⚠ Condicional   | Amber           |
| Bloqueado  | Acesso suspenso        | ✗ Negado        | Red             |
```

- Header row: `bg-[#0F172A]` (inverted-section tint), `text-xs font-mono uppercase tracking-[0.15em] text-muted-foreground`
- "Cor no Sistema" column: colored dot `h-2.5 w-2.5 rounded-full` + color name `text-xs`
  - Emerald: `bg-emerald-400`
  - Blue: `bg-[#0052FF]`
  - Amber: `bg-amber-400`
  - Red: `bg-red-400`
- Access column: semantic icons — `CheckCircle text-emerald-400`, `AlertCircle text-amber-400`, `XCircle text-red-400`
- Row hover: `bg-[#0052FF]/3` tint
- Table is read-only — no editing on this screen

**Mobile:** `overflow-x-auto` wrapper for table horizontal scroll.

---

## States

### Default (settings loaded)
Form pre-filled with saved values (token masked). Save confirmation stamp visible if saved recently.

### Default (first-time, no credentials saved)
Form inputs empty. No masked values. Helper text more prominent — instructional.

### Loading (mount)
`Skeleton` blocks for form fields `h-12 rounded-xl` × 2 + action buttons skeleton.

### Test in progress
"Testar conexão" button: spinner, disabled. "Salvar" button also disabled during test.

### Save in progress
"Salvar" button: spinner + "Salvando...", disabled. "Testar" button disabled.

### Error (invalid credentials)
After failed save/test: `"Token inválido ou Chat ID incorreto."` — `text-sm text-destructive flex items-center gap-1.5` with `AlertCircle` icon below the form. Inputs border shifts to `--destructive`.

---

## Interactions

| Trigger | Element | Animation | Spec |
|---------|---------|-----------|------|
| Hover | Salvar button | gradient-lift | -translate-y-0.5, accent shadow, 200ms |
| Press | Any button | scale-press | scale-[0.98], 100ms |
| Hover | Testar button | gentle border tint → #0052FF/30 | 200ms |
| Hover | Table row | bg-[#0052FF]/3 | 150ms |
| Page load | Form card | fade-up | opacity+translateY, 700ms |
| Page load | Table card | fade-up | 700ms, 0.1s delay after form |
| Success | Toast | Sonner slide-in | 300ms |

---

## Accessibility

**VoiceOver order:**
1. Section badge "ADMINISTRAÇÃO" (aria-hidden)
2. Heading "Configurações" (h1)
3. Telegram section heading "Integração Telegram" (h2)
4. Bot Token input (label: "Bot Token do Telegram", autocomplete="off")
5. Token show/hide toggle (aria-label: "Mostrar ou ocultar token")
6. Chat ID input (label: "Chat ID do Telegram", autocomplete="off")
7. "Testar conexão" button
8. "Salvar configurações" button
9. Success/error message (aria-live="polite")
10. Reference table section heading "Referência de Tipos de Acesso" (h2)
11. Table with caption

**Security note:** Token input uses `autocomplete="off"` and no browser save prompts. Show/hide toggle prevents shoulder-surfing.

**Keyboard:** Tab through form top-to-bottom. Enter on either button triggers its action.

**Reduced motion:** fade-up: instant appearance. Button hover: no transform (color change only).

---

## Implementation Notes

- Route: `src/routes/configuracoes.tsx`
- Form state: React `useState` (no react-hook-form needed — simple 2-field form)
- Token masking: stored in DB, returned as `token.slice(-4)` with mask prefix from server
- Telegram test: `createServerFn` — sends test message via Telegram Bot API
- Save: `createServerFn` — upserts config in DB
- `TelegramConfigForm`: inline component in `configuracoes.tsx`
- Table is static markup — no data fetching for reference table
