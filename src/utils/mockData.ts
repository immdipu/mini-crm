import { v4 as uuidv4 } from 'uuid';

// Mock Salesforce data
export const salesforceData = [
  {
    Id: 'SF-' + uuidv4().substring(0, 8),
    FirstName: 'John',
    LastName: 'Smith',
    Company: 'Acme Inc',
    Email: 'john.smith@acme.com',
    Phone: '555-123-4567',
    Title: 'CEO',
    LeadSource: 'website',
    Status: 'new',
    Rating: 'hot',
    Description: 'Met at the SaaS conference',
  },
  {
    Id: 'SF-' + uuidv4().substring(0, 8),
    FirstName: 'Emma',
    LastName: 'Johnson',
    Company: 'Globex Corp',
    Email: 'emma.johnson@globex.com',
    Phone: '555-987-6543',
    Title: 'Marketing Director',
    LeadSource: 'referral',
    Status: 'contacted',
    Rating: 'warm',
    Description: 'Interested in premium plan',
  },
  {
    Id: 'SF-' + uuidv4().substring(0, 8),
    FirstName: 'Carlos',
    LastName: 'Rodriguez',
    Company: 'Massive Dynamics',
    Email: 'carlos@massive.com',
    Phone: '555-567-8901',
    Title: 'CTO',
    LeadSource: 'email_campaign',
    Status: 'qualified',
    Rating: 'hot',
    Description: 'Technical decision maker, looking for enterprise solution',
  },
  {
    Id: 'SF-' + uuidv4().substring(0, 8),
    FirstName: 'Sarah',
    LastName: 'Williams',
    Company: 'Initech',
    Email: 'sarah.williams@initech.com',
    Phone: '555-345-6789',
    Title: 'VP Sales',
    LeadSource: 'event',
    Status: 'new',
    Rating: 'medium',
    Description: 'Looking for sales automation tools',
  },
  {
    Id: 'SF-' + uuidv4().substring(0, 8),
    FirstName: 'David',
    LastName: 'Chen',
    Company: 'Oceanic Airlines',
    Email: 'david.chen@oceanic.com',
    Phone: '555-234-5678',
    Title: 'Procurement Manager',
    LeadSource: 'website',
    Status: 'won',
    Rating: 'hot',
    Description: 'Ready to sign contract next week',
  }
];

// Mock HubSpot data
export const hubspotData = [
  {
    id: 'HS-' + uuidv4().substring(0, 8),
    properties: {
      firstname: 'Lisa',
      lastname: 'Taylor',
      company: 'XYZ Solutions',
      email: 'lisa.taylor@xyz.com',
      phone: '555-111-2222',
      notes: 'Discussed product features and pricing',
      hs_lead_status: 'NEW',
      priority: 'high',
    }
  },
  {
    id: 'HS-' + uuidv4().substring(0, 8),
    properties: {
      firstname: 'Michael',
      lastname: 'Brown',
      company: 'InnovateTech',
      email: 'michael.brown@innovatetech.com',
      phone: '555-333-4444',
      notes: 'Needs a custom solution',
      hs_lead_status: 'OPEN',
      priority: 'medium',
    }
  },
  {
    id: 'HS-' + uuidv4().substring(0, 8),
    properties: {
      firstname: 'Jennifer',
      lastname: 'Garcia',
      company: 'DataSync Inc',
      email: 'jennifer@datasync.com',
      phone: '555-555-6666',
      notes: 'Multiple location deployment',
      hs_lead_status: 'CLOSED_WON',
      priority: 'high',
    }
  },
  {
    id: 'HS-' + uuidv4().substring(0, 8),
    properties: {
      firstname: 'Robert',
      lastname: 'Miller',
      company: 'Modern Solutions',
      email: 'robert.miller@modern.com',
      phone: '555-777-8888',
      notes: 'Follow up next quarter',
      hs_lead_status: 'CLOSED_LOST',
      priority: 'low',
    }
  },
  {
    id: 'HS-' + uuidv4().substring(0, 8),
    properties: {
      firstname: 'Sophia',
      lastname: 'Lee',
      company: 'Bright Ideas',
      email: 'sophia.lee@brightideas.com',
      phone: '555-999-0000',
      notes: 'Looking for enterprise plan',
      hs_lead_status: 'IN_PROGRESS',
      priority: 'medium',
    }
  }
];

// Mock Marketo data
export const marketoData = [
  {
    id: 'MK-' + uuidv4().substring(0, 8),
    firstName: 'Thomas',
    lastName: 'Wilson',
    company: 'Future Tech',
    email: 'thomas.wilson@futuretech.com',
    phone: '555-121-3434',
    leadScore: 85,
    leadStatus: 'Qualified',
    source: 'Webinar',
    notes: 'Attended our recent product webinar'
  },
  {
    id: 'MK-' + uuidv4().substring(0, 8),
    firstName: 'Jessica',
    lastName: 'Adams',
    company: 'Skynet Systems',
    email: 'jessica@skynet.com',
    phone: '555-454-6767',
    leadScore: 65,
    leadStatus: 'New',
    source: 'Download',
    notes: 'Downloaded whitepaper on AI'
  },
  {
    id: 'MK-' + uuidv4().substring(0, 8),
    firstName: 'Daniel',
    lastName: 'Martinez',
    company: 'Global Ventures',
    email: 'daniel.martinez@global.com',
    phone: '555-787-9090',
    leadScore: 92,
    leadStatus: 'Sales Ready',
    source: 'Contact Form',
    notes: 'Requested pricing information'
  },
  {
    id: 'MK-' + uuidv4().substring(0, 8),
    firstName: 'Michelle',
    lastName: 'Wang',
    company: 'Eastern Imports',
    email: 'michelle.wang@eastern.com',
    phone: '555-232-4545',
    leadScore: 45,
    leadStatus: 'Disqualified',
    source: 'Tradeshow',
    notes: 'Not in target market'
  },
  {
    id: 'MK-' + uuidv4().substring(0, 8),
    firstName: 'Christopher',
    lastName: 'Davis',
    company: 'Momentum Group',
    email: 'chris.davis@momentum.com',
    phone: '555-898-1212',
    leadScore: 78,
    leadStatus: 'Working',
    source: 'Partner Referral',
    notes: 'Interested in co-marketing opportunities'
  }
];

// Mock Airtable data
export const airtableData = [
  {
    id: 'AT-' + uuidv4().substring(0, 8),
    fields: {
      Name: 'Olivia Parker',
      Company: 'Green Solutions',
      Email: 'olivia@greensolutions.com',
      Phone: '555-111-3333',
      Status: 'new',
      Notes: 'Interested in eco-friendly options',
      Source: 'Blog',
      Priority: 'medium'
    }
  },
  {
    id: 'AT-' + uuidv4().substring(0, 8),
    fields: {
      Name: 'William Turner',
      Company: 'Pioneer Investments',
      Email: 'william.turner@pioneer.com',
      Phone: '555-444-5555',
      Status: 'qualified',
      Notes: 'Large enterprise opportunity',
      Source: 'LinkedIn',
      Priority: 'high'
    }
  },
  {
    id: 'AT-' + uuidv4().substring(0, 8),
    fields: {
      Name: 'Natalie Kim',
      Company: 'Swift Technologies',
      Email: 'natalie@swift-tech.com',
      Phone: '555-666-7777',
      Status: 'contacted',
      Notes: 'Follow up with technical specs',
      Source: 'Website',
      Priority: 'low'
    }
  },
  {
    id: 'AT-' + uuidv4().substring(0, 8),
    fields: {
      Name: 'James Thompson',
      Company: 'Urban Designs',
      Email: 'james@urbandesigns.com',
      Phone: '555-888-9999',
      Status: 'lost',
      Notes: 'Went with competitor',
      Source: 'Email Campaign',
      Priority: 'medium'
    }
  },
  {
    id: 'AT-' + uuidv4().substring(0, 8),
    fields: {
      Name: 'Elizabeth Scott',
      Company: 'Sunrise Media',
      Email: 'elizabeth@sunrise.com',
      Phone: '555-000-1111',
      Status: 'won',
      Notes: 'Annual contract signed',
      Source: 'Referral',
      Priority: 'high'
    }
  }
];

// Helper function to get all available source fields for each provider
export const getSourceFields = (provider: string): string[] => {
  switch (provider.toLowerCase()) {
    case 'salesforce':
      return Object.keys(salesforceData[0]);
    case 'hubspot':
      return Object.keys(hubspotData[0].properties);
    case 'marketo':
      return Object.keys(marketoData[0]);
    case 'airtable':
      return Object.keys(airtableData[0].fields);
    default:
      return [];
  }
};

// Helper function to get sample data for each provider
export const getSampleData = (provider: string): Record<string, unknown>[] => {
  switch (provider.toLowerCase()) {
    case 'salesforce':
      return salesforceData.map(record => ({ ...record }));
    case 'hubspot':
      return hubspotData.map(record => ({ ...record.properties, id: record.id }));
    case 'marketo':
      return marketoData.map(record => ({ ...record }));
    case 'airtable':
      return airtableData.map(record => ({ ...record.fields, id: record.id }));
    default:
      return [];
  }
}; 