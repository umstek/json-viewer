import { useEffect, useState } from 'react';

import JsonViewer from './components/json-viewer';

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

  return <JsonViewer json={json} />;
}

export default App;
