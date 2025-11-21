import { useEffect, useState } from 'react';

import JsonViewer from './components/json-viewer';
import DiffViewer from './components/json-viewer/diff-viewer';
import { ThemeProvider } from './components/json-viewer/features/theme';

const dataUrls = {
  githubRepos: 'https://api.github.com/users/umstek/repos',
};

// Comprehensive sample data demonstrating all library capabilities
const sampleData = {
  company: {
    name: 'TechCorp International',
    founded: '2015-03-22',
    website: 'https://techcorp.example.com',
    logo: 'https://picsum.photos/200/200',
    headquarters: {
      address: '123 Innovation Drive',
      city: 'San Francisco',
      country: 'USA',
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194,
      },
    },
    contact: {
      email: 'info@techcorp.example.com',
      phone: '+1-415-555-0100',
      support: 'support@techcorp.example.com',
    },
  },
  employees: [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Alice Chen',
      role: 'Engineering Lead',
      email: 'alice.chen@techcorp.example.com',
      phone: '+1-415-555-0101',
      hiredAt: '2016-08-15T09:00:00Z',
      avatar: 'https://i.pravatar.cc/150?u=alice',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      active: true,
      workstation: {
        ip: '192.168.1.101',
        hostname: 'dev-ws-101',
      },
    },
    {
      id: 'b1ffc00a-ad1c-5fg9-cc7e-7cc0ce491b22',
      name: 'Bob Martinez',
      role: 'Product Designer',
      email: 'bob.martinez@techcorp.example.com',
      phone: '+44-20-7946-0958',
      hiredAt: '2018-03-01T10:30:00Z',
      avatar: 'https://i.pravatar.cc/150?u=bob',
      skills: ['Figma', 'UI/UX', 'Prototyping'],
      active: true,
      workstation: {
        ip: '192.168.1.102',
        hostname: 'design-ws-102',
      },
    },
    {
      id: 'c2ggd11b-be2d-6gh0-dd8f-8dd1df502c33',
      name: 'Carol Nakamura',
      role: 'DevOps Engineer',
      email: 'carol.nakamura@techcorp.example.com',
      phone: '+81-3-1234-5678',
      hiredAt: '2019-11-20T08:00:00Z',
      avatar: 'https://i.pravatar.cc/150?u=carol',
      skills: ['Kubernetes', 'AWS', 'Terraform', 'Docker'],
      active: true,
      workstation: {
        ip: '192.168.1.103',
        hostname: 'ops-ws-103',
      },
    },
  ],
  projects: [
    {
      id: 'd3hhe22c-cf3e-7hi1-ee9g-9ee2eg613d44',
      name: 'Customer Portal',
      status: 'active',
      startDate: '2024-01-15',
      deadline: '2024-06-30T23:59:59Z',
      repository: 'https://github.com/techcorp/customer-portal',
      budget: 250000,
      team: ['alice.chen@techcorp.example.com', 'bob.martinez@techcorp.example.com'],
      milestones: [
        { name: 'MVP Launch', date: '2024-03-01', completed: true },
        { name: 'Beta Release', date: '2024-04-15', completed: true },
        { name: 'Public Launch', date: '2024-06-30', completed: false },
      ],
    },
    {
      id: 'e4iif33d-dg4f-8ij2-ff0h-0ff3fh724e55',
      name: 'Infrastructure Migration',
      status: 'planning',
      startDate: '2024-07-01',
      deadline: '2024-12-31T23:59:59Z',
      repository: 'https://github.com/techcorp/infra-migration',
      budget: 500000,
      team: ['carol.nakamura@techcorp.example.com'],
      milestones: [],
    },
  ],
  infrastructure: {
    servers: [
      {
        name: 'prod-api-1',
        ip: '10.0.1.10',
        status: 'running',
        cpu: 45.2,
        memory: 68.7,
        uptime: '45 days',
      },
      {
        name: 'prod-api-2',
        ip: '10.0.1.11',
        status: 'running',
        cpu: 38.9,
        memory: 55.3,
        uptime: '45 days',
      },
      {
        name: 'prod-db-1',
        ip: '10.0.2.10',
        status: 'running',
        cpu: 22.1,
        memory: 82.4,
        uptime: '90 days',
      },
    ],
    loadBalancer: {
      ip: '203.0.113.50',
      requestsPerSecond: 1250,
      healthyBackends: 2,
      totalBackends: 2,
    },
  },
  analytics: {
    lastUpdated: '2024-11-21T14:30:00Z',
    visitors: {
      today: 12543,
      thisWeek: 87234,
      thisMonth: 342567,
    },
    topPages: [
      { path: '/products', views: 45230 },
      { path: '/pricing', views: 23456 },
      { path: '/about', views: 12345 },
    ],
    conversionRate: 3.24,
    revenue: {
      currency: 'USD',
      today: 15420.5,
      thisMonth: 487320.75,
    },
  },
  settings: {
    features: {
      darkMode: true,
      notifications: true,
      twoFactorAuth: true,
      apiAccess: false,
    },
    integrations: [
      {
        name: 'Slack',
        enabled: true,
        webhook: 'https://hooks.slack.com/services/T00/B00/XXX',
      },
      {
        name: 'GitHub',
        enabled: true,
        webhook: 'https://api.github.com/webhooks/12345',
      },
    ],
    limits: {
      maxUsers: 100,
      maxStorage: null,
      apiRateLimit: 1000,
    },
  },
};

// Sample data for diff viewer demo - API response before/after
const beforeData = {
  version: '1.2.0',
  deployedAt: '2024-10-15T09:00:00Z',
  config: {
    server: {
      host: '0.0.0.0',
      port: 8080,
      timeout: 30000,
    },
    database: {
      host: 'db.internal.example.com',
      port: 5432,
      maxConnections: 50,
      ssl: false,
    },
    cache: {
      enabled: true,
      ttl: 3600,
      provider: 'redis',
    },
    logging: {
      level: 'info',
      format: 'json',
    },
  },
  features: {
    newDashboard: false,
    darkMode: true,
    apiV2: false,
  },
  endpoints: [
    { path: '/api/users', methods: ['GET', 'POST'] },
    { path: '/api/products', methods: ['GET'] },
  ],
};

const afterData = {
  version: '2.0.0',
  deployedAt: '2024-11-21T14:30:00Z',
  config: {
    server: {
      host: '0.0.0.0',
      port: 8080,
      timeout: 60000,
      keepAlive: true,
    },
    database: {
      host: 'db.internal.example.com',
      port: 5432,
      maxConnections: 100,
      ssl: true,
      pooling: { min: 5, max: 100 },
    },
    cache: {
      enabled: true,
      ttl: 7200,
      provider: 'redis',
      cluster: true,
    },
    logging: {
      level: 'debug',
      format: 'json',
      destination: 'stdout',
    },
  },
  features: {
    newDashboard: true,
    darkMode: true,
    apiV2: true,
    realTimeUpdates: true,
  },
  endpoints: [
    { path: '/api/users', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    { path: '/api/products', methods: ['GET', 'POST'] },
    { path: '/api/analytics', methods: ['GET'] },
  ],
};

function App() {
  const [json, setJson] = useState(JSON.stringify(sampleData, null, 2));
  const [useRealData, setUseRealData] = useState(false);
  const [activeView, setActiveView] = useState<'viewer' | 'diff'>('viewer');

  useEffect(() => {
    if (useRealData) {
      fetch(dataUrls.githubRepos)
        .then((res) => res.json())
        .then((data) => setJson(JSON.stringify(data, null, 2)));
    }
  }, [useRealData]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background p-8 text-foreground">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 font-bold text-3xl">JSON Viewer Demo</h1>

          <div className="mb-4 flex gap-4">
            <button
              type="button"
              onClick={() => setActiveView('viewer')}
              className={`rounded px-4 py-2 ${
                activeView === 'viewer'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              JSON Viewer
            </button>
            <button
              type="button"
              onClick={() => setActiveView('diff')}
              className={`rounded px-4 py-2 ${
                activeView === 'diff'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Diff Viewer
            </button>
          </div>

          {activeView === 'viewer' && (
            <>
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setUseRealData(!useRealData)}
                  className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  {useRealData ? 'Show Sample Data' : 'Load GitHub Repos'}
                </button>
              </div>
              <JsonViewer
                json={json}
                showThemeToggle={true}
                codeOptions={{ enabled: true }}
                enableValidation={true}
              />
            </>
          )}

          {activeView === 'diff' && (
            <>
              <div className="mb-4">
                <p className="text-muted-foreground text-sm">
                  Compare two JSON structures to see what changed
                </p>
              </div>
              <DiffViewer
                left={beforeData}
                right={afterData}
                leftLabel="Before (v1.0)"
                rightLabel="After (v2.0)"
                viewMode="side-by-side"
                showUnchanged={false}
                expandDepth={2}
              />
            </>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
