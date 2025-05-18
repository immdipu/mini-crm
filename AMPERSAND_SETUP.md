# Ampersand Integration Setup

This document explains how to set up and configure the Ampersand integration for your Mini CRM application to import leads from Salesforce, HubSpot, and Marketo using proxy API calls.

## Prerequisites

1. An Ampersand account (sign up at [withampersand.com](https://withampersand.com))
2. Access to the Ampersand Dashboard
3. API keys for the CRM platforms you want to integrate with (Salesforce, HubSpot, and/or Marketo)

## Configuration Steps

### 1. Ampersand Project Setup

1. Log in to the [Ampersand Dashboard](https://dashboard.withampersand.com)
2. Create a new project (if you don't have one already)
3. Go to the API Keys section and create a new API key
4. Copy the Project ID and API Key for use in your application

### 2. Deploy the amp.yaml Configuration

The provided `amp.yaml` file contains the proxy configuration for all three CRM integrations. To deploy it:

1. Install the Ampersand CLI:
   ```
   npm install -g @amp-labs/cli
   ```

2. Log in to Ampersand:
   ```
   amp login
   ```

3. Deploy the configuration:
   ```
   amp deploy . --project=your-project-id
   ```

### 3. Configure Environment Variables

Create a `.env.local` file in your project root with the following variables:

```
# Ampersand Integration Configuration
NEXT_PUBLIC_AMPERSAND_PROJECT_ID=your-project-id
NEXT_PUBLIC_AMPERSAND_API_KEY=your-api-key
```

Replace the placeholder values with your actual Ampersand project ID and API key.

## Integration Usage

The Mini CRM application is already configured to use the Ampersand SDK through the `AmpersandContext.tsx` provider. The integration flow works as follows:

1. Users visit the Integration page in the Mini CRM app
2. They click "Connect" on one of the CRM providers
3. The Ampersand SDK opens an authentication flow for the selected provider
4. After successful authentication, you can make proxy API calls to the respective CRM

## Making Proxy API Calls

To make proxy API calls to the connected CRM systems, you'll need to use the Ampersand proxy API. Here's an example of how to make a call:

```javascript
// Example of making a proxy API call to Salesforce
const makeProxyApiCall = async (provider, endpoint, method = 'GET', data = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'x-amp-proxy-version': '1',
    'x-amp-project-id': process.env.NEXT_PUBLIC_AMPERSAND_PROJECT_ID,
    'x-api-key': process.env.NEXT_PUBLIC_AMPERSAND_API_KEY,
    'x-amp-integration-name': `${provider}-leads-integration`,
    'x-amp-group-ref': 'organization-id-123' // Your organization/group ID
  };

  // If you have an installation ID, you can use it instead of integration name and group ref
  // 'x-amp-installation-id': 'installation-id-from-callback',

  const baseUrl = 'https://proxy.withampersand.com';
  const url = `${baseUrl}${endpoint}`;

  const options = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  };

  const response = await fetch(url, options);
  return await response.json();
};

// Example: Fetch leads from Salesforce
const fetchSalesforceLeads = async () => {
  return makeProxyApiCall(
    'salesforce',
    '/services/data/v56.0/query?q=SELECT+Id,Name,Email,Company,Phone+FROM+Lead+LIMIT+100'
  );
};
```

## Troubleshooting

- **Connection Issues**: Ensure your API keys are correctly set in the environment variables
- **Authentication Errors**: Make sure the user has completed the OAuth flow for the specific CRM
- **API Errors**: Check that you're using the correct API endpoints and parameters for each CRM
- **Header Issues**: Verify all required headers are included in your proxy API requests

For more detailed information, refer to the [Ampersand Documentation](https://docs.withampersand.com). 