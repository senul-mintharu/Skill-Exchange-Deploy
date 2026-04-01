import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/ui/PortalPrimitives';

const NotFound = () => (
  <div className="page-wrapper flex items-center justify-center px-4 py-10">
    <EmptyState
      icon="search_off"
      title="Page Not Found"
      text="The page you're looking for doesn't exist or may have been moved."
      action={<Link to="/" className="ui-button-primary">Go Back Home</Link>}
      className="w-full"
    />
  </div>
);

export default NotFound;
