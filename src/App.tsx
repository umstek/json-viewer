import { useEffect, useState } from 'react';

import JsonViewer from './components/json-viewer';
import DiffViewer from './components/json-viewer/diff-viewer';
import { ThemeProvider } from './components/json-viewer/features/theme';

const dataUrls = {
  githubRepos: 'https://api.github.com/users/umstek/repos',
};

const sampleData = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    invalidEmail: 'not-an-email',
    website: 'https://example.com',
    created: '2024-01-15T10:30:00Z',
    birthdate: '1990-05-15',
    phone: '+1-555-123-4567',
    invalidPhone: '123',
  },
  identifiers: {
    uuid: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    ipv4: '192.168.1.1',
    invalidIpv4: '999.999.999.999',
    ipv6: '2001:0db8:0000:0000:0000:8a2e:0370:7334',
    creditCard: '4532-1488-0343-6467',
    invalidCreditCard: '1234-5678-9012-3456',
  },
  codeExamples: {
    javascript:
      'const greeting = "Hello World";\nfunction sayHello() {\n  console.log(greeting);\n  return true;\n}',
    typescript:
      'interface User {\n  name: string;\n  age: number;\n}\nconst user: User = { name: "Alice", age: 30 };',
    html: '<div class="container">\n  <h1>Hello World</h1>\n  <p>This is a paragraph</p>\n</div>',
    css: '.container {\n  display: flex;\n  padding: 20px;\n  background-color: #f0f0f0;\n}',
    sql: 'SELECT users.name, orders.total\nFROM users\nINNER JOIN orders ON users.id = orders.user_id\nWHERE orders.total > 100;',
    json: '{\n  "name": "Example",\n  "version": "1.0.0",\n  "active": true\n}',
  },
  numbers: [1, 2, 3, 4, 5],
  active: true,
};

// Sample data for diff viewer demo
const beforeData = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
  settings: {
    theme: 'dark',
    notifications: true,
    language: 'en',
  },
  tags: ['developer', 'react'],
  status: 'active',
};

const afterData = {
  user: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    age: 30,
    role: 'admin',
  },
  settings: {
    theme: 'light',
    notifications: true,
    timezone: 'UTC',
  },
  tags: ['developer', 'react', 'typescript'],
  status: 'active',
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
