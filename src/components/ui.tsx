import type { ReactElement, ReactNode } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@base-ui/react/button";
import { Checkbox } from "@base-ui/react/checkbox";
import { Dialog } from "@base-ui/react/dialog";
import { ScrollArea } from "@base-ui/react/scroll-area";
import { Select } from "@base-ui/react/select";
import { Switch } from "@base-ui/react/switch";
import { Tooltip } from "@base-ui/react/tooltip";
import { IconCheck } from "../icons";

export type SelectOption = { value: string; label: string };

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  hideTitle,
  className = "dialog-card",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  hideTitle?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="overlay" />
        <Dialog.Popup className={className}>
          <Dialog.Title className={hideTitle ? "live" : undefined}>{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="group-label">{description}</Dialog.Description>
          ) : null}
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="overlay" />
        <AlertDialog.Popup className="dialog-card">
          <AlertDialog.Title>{title}</AlertDialog.Title>
          <AlertDialog.Description>{description}</AlertDialog.Description>
          <div className="toolbar">
            <AlertDialog.Close className="ghost-btn">取消</AlertDialog.Close>
            <Button
              className="primary-btn"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export function AppSelect({
  value,
  onValueChange,
  items,
  name,
  "aria-label": ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  items: readonly SelectOption[];
  name?: string;
  "aria-label"?: string;
}) {
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => {
        if (next != null) onValueChange(String(next));
      }}
      items={[...items]}
      name={name}
    >
      <Select.Trigger className="select-trigger" aria-label={ariaLabel}>
        <Select.Value />
        <Select.Icon className="select-icon">▾</Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="select-positioner" alignItemWithTrigger={false} sideOffset={4}>
          <Select.Popup className="select-popup">
            <Select.List>
              {items.map((item) => (
                <Select.Item key={item.value} value={item.value} className="select-item">
                  <Select.ItemIndicator className="select-check">✓</Select.ItemIndicator>
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

export function AppSwitch({
  checked,
  onCheckedChange,
  name,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  name?: string;
}) {
  return (
    <Switch.Root
      className="switch"
      checked={checked}
      onCheckedChange={onCheckedChange}
      name={name}
    >
      <Switch.Thumb className="switch-thumb" />
    </Switch.Root>
  );
}

export function CheckControl({
  checked,
  onCheckedChange,
  label,
  className = "check",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <Checkbox.Root
      className={className}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      nativeButton
      render={<button type="button" />}
    >
      <Checkbox.Indicator className="check-mark" keepMounted>
        <IconCheck />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

export function AppScrollArea({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <ScrollArea.Root className={className}>
      <ScrollArea.Viewport className="scroll-viewport">
        <ScrollArea.Content>{children}</ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar className="scroll-bar" orientation="vertical">
        <ScrollArea.Thumb className="scroll-thumb" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

export function Hint({
  label,
  side = "right",
  children,
}: {
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  children: ReactElement;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={children} />
      <Tooltip.Portal>
        <Tooltip.Positioner side={side} sideOffset={8}>
          <Tooltip.Popup className="tip">{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export { Button };
