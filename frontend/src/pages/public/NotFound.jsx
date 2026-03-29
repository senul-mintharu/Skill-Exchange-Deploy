import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
	return (
		<div className="page-wrapper" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
			<div style={{
				width: '100%',
				maxWidth: '560px',
				background: 'var(--white)',
				borderRadius: '16px',
				padding: '2rem',
				textAlign: 'center',
				boxShadow: 'var(--shadow-lg)'
			}}>
				<h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>404</h1>
				<h2 style={{ marginBottom: '0.75rem' }}>Page Not Found</h2>
				<p style={{ marginBottom: '1.5rem' }}>The page you're looking for doesn't exist.</p>
				<Link to="/" className="btn btn-primary">
					Go Back Home
				</Link>
			</div>
		</div>
	);
};

export default NotFound;
