import { CHROME_SKINS } from '@/lib/chromeSkins';
import { useChromeSkin } from '@/hooks/useChromeSkin';
import { cn } from '@/lib/utils';

export function ChromeSkinPicker() {
  const { skin, setSkin } = useChromeSkin();

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold">site skin</h2>
      <p className="text-sm text-muted-foreground">
        restyles the whole site frame. your page keeps its own theme.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CHROME_SKINS.map((s) => (
          <button
            key={s.id}
            aria-pressed={skin === s.id}
            onClick={() => setSkin(s.id)}
            className={cn(
              'border p-3 text-left',
              skin === s.id ? 'border-primary border-2' : 'border-border hover:border-primary'
            )}
          >
            <div className="font-bold text-sm">{s.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.description}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ChromeSkinPicker;
