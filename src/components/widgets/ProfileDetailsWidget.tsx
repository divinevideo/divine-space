import type { Widget } from '@/types/widgets';

interface ProfileDetailsWidgetProps {
  widget: Widget;
  pubkey: string;
  isEditing: boolean;
}

export function ProfileDetailsWidget({ widget }: ProfileDetailsWidgetProps) {
  const rows: [string, string | undefined][] = [
    ['status:', widget.config?.status as string | undefined],
    ['here for:', widget.config?.hereFor as string | undefined],
    ['zodiac:', widget.config?.zodiac as string | undefined],
    ['smoke / drink:', widget.config?.smokeDrink as string | undefined],
    ['occupation:', widget.config?.occupation as string | undefined],
  ];

  return (
    <div className="h-full w-full overflow-auto border border-border bg-card p-3 text-sm">
      <dl className="space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <dt className="text-muted-foreground shrink-0">{label}</dt>
            <dd>{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default ProfileDetailsWidget;
