import { useEffect, useState } from 'react';

import JsonViewer from './components/json-viewer';
import { ThemeProvider } from './components/json-viewer/features/theme';

const dataUrls = {
  githubRepos: 'https://api.github.com/users/umstek/repos',
};

function App() {
  const [json, setJson] = useState('');

  useEffect(() => {
    fetch(dataUrls.githubRepos)
      .then((res) => res.json())
      .then((data) => setJson(JSON.stringify(data, null, 2)));
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background p-8 text-foreground">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 font-bold text-3xl">JSON Viewer Demo</h1>
          <JsonViewer json={json} showThemeToggle={true} />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
