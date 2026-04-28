import type { ReactNode } from "react";

export interface SidebarRailItem<Id extends string = string> {
  id: Id;
  icon: ReactNode;
  label: string;
  badge?: number;
  pulse?: boolean;
}

export interface SidebarRailProps<Id extends string = string> {
  items: ReadonlyArray<SidebarRailItem<Id>>;
  activeId: Id | null;
  /** Called with the clicked id, or null when the active item is clicked again (toggle-collapse). */
  onItemClick: (id: Id | null) => void;
  /** Render-prop for the expanded panel content. Return null to keep the rail collapsed. */
  children?: (activeId: Id) => ReactNode;
  /** Width of the icon column in pixels. Defaults to 48. */
  iconColumnWidth?: number;
  className?: string;
  iconColumnClassName?: string;
  expandedPanelClassName?: string;
  renderIcon?: (args: {
    item: SidebarRailItem<Id>;
    isActive: boolean;
    onClick: () => void;
  }) => ReactNode;
}

export function SidebarRail<Id extends string = string>({
  items,
  activeId,
  onItemClick,
  children,
  iconColumnWidth = 48,
  className,
  iconColumnClassName,
  expandedPanelClassName,
  renderIcon,
}: SidebarRailProps<Id>) {
  const isExpanded = activeId !== null && children !== undefined;

  return (
    <div className={`flex h-full min-h-0 ${className ?? ""}`.trim()}>
      <div
        className={`flex flex-col items-center pt-4 gap-1 flex-shrink-0 ${iconColumnClassName ?? ""}`.trim()}
        style={{ width: iconColumnWidth }}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          const handleClick = () =>
            onItemClick(isActive ? null : item.id);

          if (renderIcon) {
            return (
              <div key={item.id}>
                {renderIcon({ item, isActive, onClick: handleClick })}
              </div>
            );
          }

          return (
            <DefaultIconButton
              key={item.id}
              item={item}
              isActive={isActive}
              onClick={handleClick}
            />
          );
        })}
      </div>

      {isExpanded && (
        <div
          className={`flex-1 min-w-0 overflow-hidden ${expandedPanelClassName ?? ""}`.trim()}
        >
          {children(activeId)}
        </div>
      )}
    </div>
  );
}

interface DefaultIconButtonProps<Id extends string> {
  item: SidebarRailItem<Id>;
  isActive: boolean;
  onClick: () => void;
}

function DefaultIconButton<Id extends string>({
  item,
  isActive,
  onClick,
}: DefaultIconButtonProps<Id>) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={item.label}
      aria-label={item.label}
      aria-pressed={isActive}
      className={`relative flex items-center justify-center w-[48px] h-[48px] transition-opacity ${
        isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
      }`}
    >
      {item.icon}
      {item.badge !== undefined && item.badge > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[8px] font-bold px-0.5 bg-current/20">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
      {item.pulse && item.badge === undefined && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-current animate-pulse" />
      )}
    </button>
  );
}
