import React from 'react';
import { X } from 'lucide-react';

const AppSidebar = ({
  side = 'left',
  isOpen = true,
  onClose,
  onOpenCollapsed,
  icon: Icon,
  title,
  subtitle,
  children,
  collapsedRail = true,
  widthClass = 'w-80', // Allow standardizing or overriding the width if needed
}) => {
  const sideClasses = side === 'left'
    ? {
        sidebar: `left-0 border-r border-border h-full flex flex-col bg-card flex-shrink-0 z-40 transition-all duration-300 ease-out fixed md:relative top-[var(--navbar-height)] md:top-0 md:h-full`,
        open: `${widthClass} translate-x-0`,
        collapsed: collapsedRail
          ? `w-0 -translate-x-full md:w-16 md:translate-x-0`
          : `w-0 -translate-x-full md:w-0 md:-translate-x-full`,
      }
    : {
        sidebar: `right-0 border-l border-border h-full flex flex-col bg-card flex-shrink-0 z-40 transition-all duration-300 ease-out fixed md:relative top-[var(--navbar-height)] md:top-0 md:h-full`,
        open: `${widthClass} translate-x-0`,
        collapsed: collapsedRail
          ? `w-0 translate-x-full md:w-16 md:translate-x-0`
          : `w-0 translate-x-full md:w-0 md:translate-x-full`,
      };

  return (
    <>
      {/* Mobile Backdrop when open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`${sideClasses.sidebar} ${isOpen ? sideClasses.open : sideClasses.collapsed}`}
      >
        {isOpen ? (
          // Open Content
          <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0 h-16 bg-card">
              <div className="flex items-center gap-2.5 min-w-0">
                {Icon && (
                  <div className="p-2 bg-primary/10 text-primary rounded-lg flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider truncate">{title}</h3>
                  {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground flex-shrink-0"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-grow overflow-hidden flex flex-col">
              {children}
            </div>
          </div>
        ) : (
          // Collapsed Content (shows icon rail on desktop if collapsedRail is true)
          collapsedRail && (
            <div className="hidden md:flex flex-col items-center py-4 h-full w-full bg-card">
              <button
                onClick={onOpenCollapsed}
                className="p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
                title={`Open ${title}`}
              >
                {Icon && <Icon className="w-5 h-5" />}
              </button>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default AppSidebar;
