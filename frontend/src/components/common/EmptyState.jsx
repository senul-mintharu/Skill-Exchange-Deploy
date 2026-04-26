import React from 'react';
import { cn } from '../../utils/cn';

/**
 * EmptyState — Reusable empty / zero-data placeholder.
 *
 * @param {ReactNode}  illustration  - Custom illustration (image, SVG, or component).
 *                                     Falls back to a Material Icon when omitted.
 * @param {string}     icon          - Material icon name used when `illustration` is not provided.
 * @param {string}     title         - Short heading describing the empty state.
 * @param {string}     description   - Explanatory body text. Renders below the title.
 * @param {ReactNode}  action        - Optional CTA button or link rendered at the bottom.
 * @param {string}     size          - 'sm' | 'md' (default) | 'lg' — controls spacing & icon scale.
 * @param {boolean}    compact       - If true, strips card styling so the component nests
 *                                     inside existing containers without double-boxing.
 * @param {string}     className     - Extra className applied to the outer wrapper.
 *
 * Usage examples:
 *   <EmptyState icon="inbox" title="No messages" description="You're all caught up!" />
 *
 *   <EmptyState
 *     illustration={<img src="/empty.svg" alt="" />}
 *     title="Nothing here yet"
 *     description="Create your first item to get started."
 *     action={<Link to="/create" className="ui-button-primary">Create</Link>}
 *   />
 */

const sizeMap = {
  sm: {
    wrapper: 'px-4 py-6',
    iconWrap: 'h-14 w-14',
    iconSize: 'text-2xl',
    illustrationMax: 'max-w-[120px]',
    title: 'text-lg',
    description: 'text-xs leading-5',
    gap: 'mt-4',
  },
  md: {
    wrapper: 'px-6 py-10',
    iconWrap: 'h-20 w-20',
    iconSize: 'text-4xl',
    illustrationMax: 'max-w-[180px]',
    title: 'text-2xl',
    description: 'text-sm leading-7',
    gap: 'mt-6',
  },
  lg: {
    wrapper: 'px-8 py-14',
    iconWrap: 'h-28 w-28',
    iconSize: 'text-5xl',
    illustrationMax: 'max-w-[240px]',
    title: 'text-3xl',
    description: 'text-base leading-8',
    gap: 'mt-8',
  },
};

const EmptyState = ({
  illustration,
  icon = 'inbox',
  title,
  description,
  action,
  size = 'md',
  compact = false,
  className,
}) => {
  const s = sizeMap[size] || sizeMap.md;

  return (
    <div
      id="empty-state"
      className={cn(
        'empty-state-root',
        compact ? 'empty-state-compact' : 'empty-state-card',
        s.wrapper,
        className,
      )}
      role="status"
      aria-label={title || 'Empty state'}
    >
      {/* ── Visual: illustration or icon ─────────────────────────── */}
      {illustration ? (
        <div className={cn('empty-state-illustration', s.illustrationMax)}>
          {illustration}
        </div>
      ) : (
        <div className={cn('empty-state-icon-wrap', s.iconWrap)}>
          <span
            className={cn('material-icons', s.iconSize)}
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>
      )}

      {/* ── Copy ─────────────────────────────────────────────────── */}
      {title ? (
        <h2 className={cn('empty-state-title', s.title)}>{title}</h2>
      ) : null}

      {description ? (
        <p className={cn('empty-state-description', s.description)}>
          {description}
        </p>
      ) : null}

      {/* ── CTA ──────────────────────────────────────────────────── */}
      {action ? (
        <div className={cn('empty-state-action', s.gap)}>{action}</div>
      ) : null}
    </div>
  );
};

export default EmptyState;
