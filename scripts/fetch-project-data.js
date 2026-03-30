#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.PROJECT_TOKEN;
if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN or PROJECT_TOKEN environment variable required');
  process.exit(1);
}

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const PROJECTS_CONFIG = path.join(DOCS_DIR, 'projects.json');

function graphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: 'api.github.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': `bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'project-dashboard',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.errors && !parsed.data) {
            reject(new Error(JSON.stringify(parsed.errors, null, 2)));
          } else if (!parsed.data) {
            reject(new Error(`Unexpected response: ${data.slice(0, 500)}`));
          } else {
            if (parsed.errors) {
              console.warn('GraphQL warnings:', JSON.stringify(parsed.errors, null, 2));
            }
            resolve(parsed.data);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 500)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function restApi(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'project-dashboard',
        'Accept': 'application/vnd.github+json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 500)}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function restApiPaginated(endpoint, maxPages = 5) {
  let allResults = [];
  let url = endpoint.includes('?') ? `${endpoint}&per_page=100` : `${endpoint}?per_page=100`;
  let page = 1;

  while (page <= maxPages) {
    const pageUrl = `${url}&page=${page}`;
    const data = await restApi(pageUrl);
    if (!Array.isArray(data) || data.length === 0) break;
    allResults = allResults.concat(data);
    if (data.length < 100) break;
    page++;
  }
  return allResults;
}

function buildProjectQuery(ownerType) {
  return `
    query($owner: String!, $number: Int!, $cursor: String) {
      ${ownerType}(login: $owner) {
        projectV2(number: $number) {
          id
          title
          shortDescription
          fields(first: 30) {
            nodes {
              ... on ProjectV2Field {
                id
                name
                dataType
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                dataType
                options {
                  id
                  name
                }
              }
              ... on ProjectV2IterationField {
                id
                name
                dataType
              }
            }
          }
          items(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              content {
                ... on Issue {
                  title
                  number
                  state
                  url
                  createdAt
                  closedAt
                  labels(first: 10) {
                    nodes {
                      name
                      color
                    }
                  }
                  assignees(first: 5) {
                    nodes {
                      login
                      avatarUrl
                    }
                  }
                }
                ... on PullRequest {
                  title
                  number
                  state
                  url
                  createdAt
                  closedAt
                  merged
                  mergedAt
                }
              }
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldTextValue {
                    text
                    field { ... on ProjectV2Field { name } }
                  }
                  ... on ProjectV2ItemFieldNumberValue {
                    number
                    field { ... on ProjectV2Field { name } }
                  }
                  ... on ProjectV2ItemFieldDateValue {
                    date
                    field { ... on ProjectV2Field { name } }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field { ... on ProjectV2SingleSelectField { name } }
                  }
                  ... on ProjectV2ItemFieldIterationValue {
                    title
                    startDate
                    duration
                    field { ... on ProjectV2IterationField { name } }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
}

async function _fetchProjectItems(owner, projectNumber, ownerType) {
  const query = buildProjectQuery(ownerType);

  let allItems = [];
  let cursor = null;
  let projectMeta = null;
  let fields = null;

  do {
    const data = await graphql(query, { owner, number: projectNumber, cursor });
    const project = data[ownerType].projectV2;

    if (!projectMeta) {
      projectMeta = {
        id: project.id,
        title: project.title,
        shortDescription: project.shortDescription,
      };
      fields = project.fields.nodes;
    }

    const items = project.items;
    allItems = allItems.concat(items.nodes);
    cursor = items.pageInfo.hasNextPage ? items.pageInfo.endCursor : null;
  } while (cursor);

  return { projectMeta, fields, items: allItems };
}

async function fetchProjectItems(owner, projectNumber) {
  try {
    return await _fetchProjectItems(owner, projectNumber, 'user');
  } catch (err) {
    console.log(`  user query failed, trying organization...`);
    return await _fetchProjectItems(owner, projectNumber, 'organization');
  }
}

function parseFieldValues(item) {
  const parsed = {};
  if (!item.fieldValues || !item.fieldValues.nodes) return parsed;

  for (const fv of item.fieldValues.nodes) {
    const fieldName = fv.field?.name;
    if (!fieldName) continue;

    if (fv.text !== undefined) parsed[fieldName] = fv.text;
    else if (fv.number !== undefined) parsed[fieldName] = fv.number;
    else if (fv.date !== undefined) parsed[fieldName] = fv.date;
    else if (fv.name !== undefined) parsed[fieldName] = fv.name;
    else if (fv.title !== undefined) {
      parsed[fieldName] = {
        title: fv.title,
        startDate: fv.startDate,
        duration: fv.duration,
      };
    }
  }
  return parsed;
}

function transformItems(rawItems) {
  return rawItems
    .filter(item => item.content && item.content.title)
    .map(item => {
      const fields = parseFieldValues(item);
      const content = item.content;
      return {
        id: item.id,
        title: content.title,
        number: content.number,
        type: content.merged !== undefined ? 'pr' : 'issue',
        state: content.state,
        url: content.url,
        createdAt: content.createdAt,
        closedAt: content.closedAt,
        merged: content.merged || false,
        mergedAt: content.mergedAt || null,
        labels: (content.labels?.nodes || []).map(l => ({ name: l.name, color: l.color })),
        assignees: (content.assignees?.nodes || []).map(a => ({ login: a.login, avatarUrl: a.avatarUrl })),
        // Project fields
        status: fields['Status'] || null,
        priority: fields['Priority'] || null,
        phase: fields['Phase'] || null,
        estimatedStart: fields['Estimated Start'] || null,
        estimatedEnd: fields['Estimated End'] || null,
        actualStart: fields['Actual Start'] || null,
        actualEnd: fields['Actual End'] || null,
        effort: fields['Effort'] || null,
        // Keep all fields for flexibility
        fields,
      };
    });
}

async function fetchActivity(owner, repo) {
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const sinceStr = since.toISOString();

  const [events, commits] = await Promise.all([
    restApiPaginated(`/repos/${owner}/${repo}/issues/events`, 3).catch(() => []),
    restApiPaginated(`/repos/${owner}/${repo}/commits?since=${sinceStr}`, 3).catch(() => []),
  ]);

  const recentEvents = (Array.isArray(events) ? events : [])
    .filter(e => new Date(e.created_at) >= since)
    .map(e => ({
      type: 'issue_event',
      event: e.event,
      issue: e.issue ? { number: e.issue.number, title: e.issue.title } : null,
      actor: e.actor?.login || null,
      createdAt: e.created_at,
    }));

  const recentCommits = (Array.isArray(commits) ? commits : [])
    .map(c => ({
      type: 'commit',
      sha: c.sha?.slice(0, 7),
      message: c.commit?.message?.split('\n')[0] || '',
      author: c.commit?.author?.name || c.author?.login || null,
      createdAt: c.commit?.author?.date || null,
      url: c.html_url,
    }));

  return [...recentEvents, ...recentCommits]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);
}

async function fetchRepoMeta(owner, repo) {
  const data = await restApi(`/repos/${owner}/${repo}`);
  return {
    fullName: data.full_name,
    description: data.description,
    openIssues: data.open_issues_count,
    stars: data.stargazers_count,
    updatedAt: data.updated_at,
  };
}

async function processProject(projectConfig) {
  const { id, owner, repo, projectNumber, displayName } = projectConfig;
  console.log(`\nProcessing: ${displayName} (${owner}/${repo} project #${projectNumber})`);

  const dataDir = path.join(DOCS_DIR, 'data', id);
  fs.mkdirSync(dataDir, { recursive: true });

  // Fetch all data in parallel
  const [projectData, activity, repoMeta] = await Promise.all([
    fetchProjectItems(owner, projectNumber),
    fetchActivity(owner, repo),
    fetchRepoMeta(owner, repo),
  ]);

  const issues = transformItems(projectData.items);

  // Compute summary stats
  const total = issues.length;
  const done = issues.filter(i => i.status === 'Done' || i.state === 'CLOSED').length;
  const inProgress = issues.filter(i => i.status === 'In Progress').length;
  const blocked = issues.filter(i => i.status === 'Blocked').length;
  const todo = issues.filter(i => i.status === 'Todo' || i.status === 'Backlog').length;

  // Phase breakdown
  const phases = {};
  for (const issue of issues) {
    const phase = issue.phase || 'Unassigned';
    if (!phases[phase]) phases[phase] = { total: 0, done: 0 };
    phases[phase].total++;
    if (issue.status === 'Done' || issue.state === 'CLOSED') phases[phase].done++;
  }

  // Priority breakdown
  const priorities = {};
  for (const issue of issues) {
    const p = issue.priority || 'None';
    priorities[p] = (priorities[p] || 0) + 1;
  }

  const meta = {
    projectId: id,
    displayName,
    owner,
    repo,
    projectNumber,
    projectTitle: projectData.projectMeta.title,
    projectDescription: projectData.projectMeta.shortDescription,
    repoMeta,
    fields: projectData.fields.map(f => ({ name: f.name, type: f.dataType, options: f.options })),
    stats: { total, done, inProgress, blocked, todo },
    phases,
    priorities,
    fetchedAt: new Date().toISOString(),
  };

  // Write files
  fs.writeFileSync(path.join(dataDir, 'issues.json'), JSON.stringify(issues, null, 2));
  fs.writeFileSync(path.join(dataDir, 'activity.json'), JSON.stringify(activity, null, 2));
  fs.writeFileSync(path.join(dataDir, 'meta.json'), JSON.stringify(meta, null, 2));

  console.log(`  ✓ ${issues.length} items, ${activity.length} activity events`);
  console.log(`  ✓ Stats: ${done}/${total} done, ${inProgress} in progress, ${blocked} blocked`);
  console.log(`  ✓ Data written to ${dataDir}`);
}

async function main() {
  console.log('Project Dashboard — Data Fetch');
  console.log('==============================');

  const projects = JSON.parse(fs.readFileSync(PROJECTS_CONFIG, 'utf-8'));
  console.log(`Found ${projects.length} project(s) to fetch`);

  for (const project of projects) {
    try {
      await processProject(project);
    } catch (err) {
      console.error(`\n✗ Error processing ${project.displayName}:`, err.message);
    }
  }

  console.log('\nDone!');
}

main();
