/**
 * DataLoader — fetches and caches project JSON data
 */
const DataLoader = (() => {
  const cache = {};

  async function fetchJSON(url) {
    if (cache[url]) return cache[url];
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const data = await res.json();
    cache[url] = data;
    return data;
  }

  async function loadProjects() {
    return fetchJSON('projects.json');
  }

  async function loadProjectData(projectId) {
    const [meta, issues, activity] = await Promise.all([
      fetchJSON(`data/${projectId}/meta.json`),
      fetchJSON(`data/${projectId}/issues.json`),
      fetchJSON(`data/${projectId}/activity.json`),
    ]);
    return { meta, issues, activity };
  }

  function clearCache() {
    Object.keys(cache).forEach(k => delete cache[k]);
  }

  return { loadProjects, loadProjectData, clearCache };
})();
