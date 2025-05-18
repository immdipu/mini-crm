# Mini CRM Board

A simple CRM board application built with Next.js.

## Features

- Drag-and-drop CRM board with columns: New, Contacted, Qualified, Won, Lost
- Add, edit, and delete leads
- Reorder leads within columns
- Integration with mock data providers (Salesforce, HubSpot, Marketo, Airtable)
- Field mapping for data import
- CSV import
- Data persistence in localStorage

## Hackathon Mode

This application is designed to be used in hackathons where only frontend functionality matters. The integrations with CRM providers are **mocked** for demonstration purposes:

- Each provider has predefined sample data
- When you "connect" to a provider, it simulates the connection process
- No actual API calls are made to external services
- The mapping functionality works with the mock data
- All state is stored in localStorage

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

## Integration Process

1. Go to the Integration page
2. Click "Connect" on any provider card
3. The app will simulate connecting to the service
4. Once connected, click "Sync" to load the mock data
5. Map the fields from the provider to the CRM fields
6. Import the data to your board

## Data Storage

All data is stored in your browser's localStorage, so no backend is required. The app includes:

- Board state (columns and leads)
- Connection status for each provider
- Team members
- Mapping templates

## Implementation Details

The mock integrations are implemented in:
- `src/utils/mockData.ts` - Contains sample data for each provider
- `src/hooks/providers/` - Provider-specific hooks that use mock data
- `src/context/IntegrationContext.tsx` - Context for managing integration state

## Adding More Mock Data

To add more mock data for a provider, edit the corresponding array in `src/utils/mockData.ts`.

## License

MIT
