// Headless HTTP client for the Ubiquilife Support external API.
// Used by the Slack handlers to fetch lookups and submit tickets.

export class SupportClient {
  constructor(cfg) {
    this.cfg = cfg;
  }

  async categories() {
    return this._lookup('categories');
  }
  async priorities() {
    return this._lookup('priorities');
  }

  async createTicket(draft, slackContext = {}) {
    const url = `${this.cfg.apiBaseUrl}/tickets`;
    const ctx = {
      client_app: this.cfg.appName,
      client_platform: 'slack',
      slack_team: slackContext.team,
      slack_channel: slackContext.channel,
      slack_user_id: slackContext.userId,
      slack_user: slackContext.username,
      timestamp: new Date().toISOString(),
    };
    const body = {
      title: draft.title,
      description: draft.description,
      source_app: this.cfg.appName,
      category_id: draft.categoryId,
      priority_id: draft.priorityId,
      reporter_name: draft.reporterName ?? slackContext.username,
      identime_user_id: this.cfg.identimeUserId,
      context_data: JSON.stringify(ctx),
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: this._headers(true),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Support API ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.data ?? null;
  }

  async _lookup(path) {
    const res = await fetch(`${this.cfg.apiBaseUrl}/lookup/${path}`, { headers: this._headers(false) });
    if (!res.ok) throw new Error(`Support lookup ${path} failed: ${res.status}`);
    const json = await res.json();
    const rows = json.data ?? json;
    return rows.map((r) => ({
      id: String(r.id ?? ''),
      name: typeof r.name === 'string' ? r.name : (r.name?.en ?? ''),
    }));
  }

  _headers(json) {
    const h = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.cfg.apiKey}`,
    };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }
}
