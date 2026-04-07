import apiClient from './apiClient';

const unwrap = (response) => response?.data?.data ?? response?.data;

/**
 * Submit a verification document (WORKER only).
 * Sends a multipart/form-data POST to /api/verification.
 */
export const submitVerification = async (documentFile) => {
	const formData = new FormData();
	formData.append('document', documentFile);

	const response = await apiClient.post('/verification', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	});

	return unwrap(response);
};

/**
 * Get the current worker's own verification status.
 * Returns a VerificationStatusResponse (or status: 'NONE' if never submitted).
 */
export const getMyVerification = async () => {
	const response = await apiClient.get('/verification/my');
	return unwrap(response);
};

/**
 * Get all PENDING verification submissions (ADMIN only).
 */
export const getPendingSubmissions = async () => {
	const response = await apiClient.get('/verification/pending');
	return unwrap(response);
};

/**
 * Download/open a verification document for a specific submission (ADMIN only).
 * Returns a Blob payload that can be opened in a new tab.
 */
export const getSubmissionDocumentBlob = async (submissionId) => {
	const response = await apiClient.get(`/verification/${submissionId}/document`, {
		responseType: 'blob',
	});
	return response.data;
};

/**
 * Approve or reject a verification submission (ADMIN only).
 *
 * @param {number} submissionId  - The ID of the VerificationSubmission to review
 * @param {boolean} approve      - true = APPROVED, false = REJECTED
 * @param {string|null} adminNotes - Optional notes explaining the decision
 */
export const reviewSubmission = async (submissionId, approve, adminNotes = null) => {
	const response = await apiClient.put(
		`/verification/${submissionId}/status`,
		{ adminNotes },
		{ params: { approve } }
	);
	return unwrap(response);
};
