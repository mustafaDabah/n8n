import type { ICredentialType, INodeProperties } from 'n8n-workflow';

const scopes = [
	'https://www.googleapis.com/auth/drive.file',
	'https://www.googleapis.com/auth/spreadsheets',
	'https://www.googleapis.com/auth/drive.metadata',
];

export class GoogleSheetsOAuth2Api implements ICredentialType {
	name = 'googleSheetsOAuth2Api';

	extends = ['googleOAuth2Api'];

	displayName = 'Google Sheets OAuth2 API';

	documentationUrl = 'google/oauth-single-service';

	properties: INodeProperties[] = [
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: scopes.join(' '),
		},
		{
			displayName:
				'Make sure you enabled the following APIs & Services in the Google Cloud Console: Google Drive API, Google Sheets API. ',
			name: 'notice',
			type: 'notice',
			default: '',
			displayOptions: {
				hideOnCloud: true,
			},
		},
	];
}
