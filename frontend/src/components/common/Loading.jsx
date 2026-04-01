import React from 'react';
import { cn } from '../../utils/cn';

const Loading = ({ message = 'Loading...', fullPage = false, className }) => {
  const content = (
    <div className={cn('ui-loading-state', className)}>
      <div className="ui-spinner" aria-hidden="true" />
      <p className="text-sm font-medium text-ink-muted">{message}</p>
    </div>
  );

  if (!fullPage) {
    return content;
  }

  return (
    <div className="page-wrapper flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">{content}</div>
    </div>
  );
};

export default Loading;
