import apiClient from './apiClient';

const unwrap = (response) => response?.data?.data ?? response?.data;

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

export const getMyVerification = async () => {
	const response = await apiClient.get('/verification/my');
	return unwrap(response);
};

export const getPendingSubmissions = async () => {
	const response = await apiClient.get('/verification/pending');
	return unwrap(response);
};

export const reviewSubmission = async (decisionData) => {
	const response = await apiClient.post('/verification/review', decisionData);
	return unwrap(response);
};
