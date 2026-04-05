import { Trash2 } from 'lucide-react';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { Widget } from '@/types/widgets';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface PageStudioInspectorProps {
  widget: Widget;
  onClose: () => void;
  onRemoveWidget: (widgetId: string) => void;
  onUpdateWidget: (widgetId: string, nextWidget: Partial<Widget>) => void;
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(event) => {
          const nextValue = event.currentTarget.valueAsNumber;
          if (Number.isNaN(nextValue)) {
            return;
          }

          onChange(nextValue);
        }}
      />
    </div>
  );
}

function InspectorBody({
  widget,
  onClose,
  onRemoveWidget,
  onUpdateWidget,
}: PageStudioInspectorProps) {
  const definition = widgetRegistry[widget.type];

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Selected widget
          </div>
          <h2 className="text-xl font-semibold">{definition.name} widget</h2>
          <p className="text-sm text-muted-foreground">{definition.description}</p>
        </div>

        <Button type="button" variant="ghost" onClick={onClose}>
          Close inspector
        </Button>
      </div>

      <Separator />

      <section className="space-y-3">
        <div className="text-sm font-medium">Identity</div>
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Widget type</div>
            <div>{definition.name}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Widget id</div>
            <div className="font-mono text-xs">{widget.id}</div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="text-sm font-medium">Layout</div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="X"
            value={widget.x}
            onChange={(x) => onUpdateWidget(widget.id, { x })}
          />
          <NumberField
            label="Y"
            value={widget.y}
            onChange={(y) => onUpdateWidget(widget.id, { y })}
          />
          <NumberField
            label="Width"
            value={widget.w}
            onChange={(w) => onUpdateWidget(widget.id, { w })}
          />
          <NumberField
            label="Height"
            value={widget.h}
            onChange={(h) => onUpdateWidget(widget.id, { h })}
          />
        </div>
      </section>

      <div className="mt-auto">
        <Separator className="mb-4" />
        <Button
          type="button"
          variant="destructive"
          className="w-full gap-2"
          onClick={() => {
            onRemoveWidget(widget.id);
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4" />
          Remove widget
        </Button>
      </div>
    </div>
  );
}

export function PageStudioInspector(props: PageStudioInspectorProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer
        open
        onOpenChange={(open) => {
          if (!open) {
            props.onClose();
          }
        }}
      >
        <DrawerContent data-testid="page-studio-inspector" className="h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{widgetRegistry[props.widget.type].name}</DrawerTitle>
            <DrawerDescription>
              Temporary widget inspector for the studio shell.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <InspectorBody {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) {
          props.onClose();
        }
      }}
    >
      <SheetContent
        side="right"
        data-testid="page-studio-inspector"
        className="w-full overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader className="mb-4 px-0 text-left">
          <SheetTitle>{widgetRegistry[props.widget.type].name}</SheetTitle>
          <SheetDescription>
            Temporary widget inspector for the studio shell.
          </SheetDescription>
        </SheetHeader>
        <InspectorBody {...props} />
      </SheetContent>
    </Sheet>
  );
}

export default PageStudioInspector;
