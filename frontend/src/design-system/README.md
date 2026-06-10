# Novala design system

Source of truth for visual decisions. See `/03-design-system.md` for the spec.

## Use

```jsx
import { Button, Card, StatusPill, colors, spacing } from "../design-system";

function MyScreen() {
  return (
    <div style={{ background: colors.bgPage, padding: spacing[8] }}>
      <Card>
        <Button variant="primary">Save</Button>
        <StatusPill status="finalized" />
      </Card>
    </div>
  );
}
```

## Components

- Button (variants: primary, secondary, ghost, danger; sizes: sm, md, lg)
- Input (text, number, with label/helper/error)
- Select (dropdown with options)
- Checkbox (with label)
- Card, CardHeader
- Drawer (right-side panel with overlay)
- Modal (centered overlay)
- StatusPill (draft, calculated, finalized, voided)
- EmptyState (icon + title + description + action)
- Spinner (small inline loader)
- ProgressDots (wizard step indicator)
- ToastProvider + useToast (notifications)

## Tokens

- colors (50+ named colors)
- typography (font scale)
- spacing (4-64px scale)
- radius (sm/md/lg/card/cardLg/pill)
- shadow (focus, drawer, modal, toast)
- motion (fast, slow, modal durations)
- breakpoints (mobile, tablet)
