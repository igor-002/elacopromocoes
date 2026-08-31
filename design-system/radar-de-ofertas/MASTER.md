# Radar de Ofertas — Design System

## Direction
Painel operacional claro e compacto. A estética vem de etiquetas de preço, comprovantes e marcações de expedição, não de gráficos financeiros.

## Tokens
- Canvas: `#F2F5F3`
- Surface: `#FFFFFF`
- Ink: `#17201D`
- Muted: `#66736E`
- Border: `#D7DEDA`
- Operational blue: `#2457F5`
- Offer orange: `#F2663A`
- Success: `#16835B`
- Warning: `#A55D00`
- Danger: `#C53B3B`

Typography:
- Display: Space Grotesk Variable, 600–700.
- Interface: Instrument Sans Variable, 400–650.
- Data: IBM Plex Mono, 500–600.

Spacing follows 4px base. Dense controls use 12–16px gaps; page sections use 24–32px. Radius stays 10–18px. Shadows remain short and neutral.

## Layout
Desktop uses 248px navigation rail plus fluid workspace. Mobile converts navigation to compact header and horizontal section switcher.

```text
┌──────────────┬──────────────────────────────────────┐
│ Radar        │ Context + primary action             │
│ navigation   ├──────────────────────────────────────┤
│              │ state strip / operational summary    │
│              ├───────────────────────┬──────────────┤
│              │ work queue            │ channel health│
└──────────────┴───────────────────────┴──────────────┘
```

## Signature
Every offer shows a perforated state rail: Rascunho, Aprovada, Agendada, Enviada. Shape communicates progress; color supplements it.

## Interaction
- Minimum target 44px.
- Visible `:focus-visible` ring.
- Labels never depend on placeholders.
- Loading preserves layout; buttons state the action result.
- Motion limited to 160–220ms opacity/transform and disabled by `prefers-reduced-motion`.
- Empty and error states state next action.

## Anti-patterns
- No glassmorphism, neon, gradient blobs, emoji icons or excessive metric cards.
- No color-only statuses.
- No hidden destructive actions or hover-only controls.
