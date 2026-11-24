export const config = {
  path: '/api/sanity-content'
};

const GLOBAL_DOCUMENT_ID = 'globalArticleInformation';
const STORY_DOCUMENT_ID = 'cnnReportStory.edward-jones-louisiana-investigation';

const GLOBAL_FALLBACK = {
  advisorName: 'Beau Wilson',
  location: 'Louisiana',
  publishedDate: 'August 16, 2026',
  updatedTime: '4:18 PM ET',
  totalLosses: '$1.3B+',
  firmName: 'Edward Jones'
};

const GROQ_QUERY = `{
  "global": *[_type == "globalArticleInformation" && _id == "${GLOBAL_DOCUMENT_ID}"][0]{
    advisorName,
    location,
    publishedDate,
    updatedTime,
    totalLosses,
    firmName
  },
  "story": *[_type == "cnnReportStory" && _id == "${STORY_DOCUMENT_ID}"][0]{
    headline,
    dek,
    byline,
    kicker,
    readTime,
    editorNote,
    bottomLineHeading,
    bottomLineBody,
    protectBlurb,
    guidanceBlurb,
    heroCaption,
    newsletterBlurb,
    stats[]{k,v,label,value},
    tickerItems,
    relatedStories[]{tag,time,title,href},
    scopeItems
  }
}`;

const STORY_TEMPLATES = {
  headline: 'Iranian-Linked Hackers Breach {{firmName}} in {{location}}',
  dek: 'Elderly Americans targeted in a campaign that began last month. {{location}} branches now under heavy FTC and IRS audit — with advisor {{advisorName}} under investigation — as reported losses climb {{lossesLong}}.',
  byline: 'Maya Chen and Jordan Hale',
  kicker: 'Breaking',
  readTime: '8 min read',
  editorNote: 'Developing report on alleged compromises involving {{firmName}} in {{location}}, Iranian-linked hackers, and elderly U.S. targets. Advisor {{advisorName}} is under investigation. Activity began last month. Reported losses: {{lossesLong}}. Affected branches are under heavy FTC and IRS audit. If you are facing something similar, do not be afraid, refrain from contacting advisors, and file with the FTC at ReportFraud.ftc.gov.',
  bottomLineHeading: '{{lossesCompact}}. {{location}}. Report to the FTC.',
  bottomLineBody: 'Iranian-linked hackers, {{firmName}} in {{location}}, and a deliberate focus on elderly Americans — with advisor {{advisorName}} under investigation, the campaign underway since last month, and losses climbing {{lossesLong}}. Those branches are under heavy FTC and IRS audit. If you are facing something similar, do not be afraid. Refrain from contacting advisors. File a report at the FTC instead.',
  protectBlurb: 'Do not be afraid. Compromised {{firmName}} branches are under heavy FTC and IRS audit. Advisor {{advisorName}} is under investigation. Losses are {{lossesLong}}. Refrain from contacting advisors — file a report with the FTC instead.',
  guidanceBlurb: '{{location}} {{firmName}} branches are under heavy FTC and IRS investigation. Advisor {{advisorName}} is under probe after losses {{lossesLong}}.',
  heroCaption: 'Authorities move in as the {{location}} {{firmName}} probe widens — advisor {{advisorName}} is among those under investigation.',
  newsletterBlurb: 'Get updates when the FTC, IRS, or investigators issue new guidance for affected clients.',
  stats: [
    { k: 'Losses', v: '{{lossesShort}}' },
    { k: 'Firm', v: '{{firmName}}' },
    { k: 'Under probe', v: '{{advisorName}}' },
    { k: 'Action', v: 'File w/ FTC' }
  ],
  tickerItems: [
    'BREAKING: {{firmName}} {{location}} branches compromised',
    'Advisor {{advisorName}} under investigation',
    'Iranian-linked actors suspected in elder-targeted campaign',
    'Reported losses {{lossesLong}}',
    'FTC and IRS open heavy audits of affected branches',
    'Officials urge clients: file with FTC — do not contact advisors'
  ],
  relatedStories: [
    { tag: 'Consumer Alert', time: '5 min', title: 'How to file a strong FTC fraud report', href: '#' },
    { tag: 'Investigation', time: '6 min', title: 'Who is {{advisorName}}?', href: '#' },
    { tag: 'Markets', time: '7 min', title: 'Inside the {{lossesBillion}} loss estimate', href: '#' },
    { tag: 'Guides', time: '4 min', title: 'Why seniors should skip advisor calls during a probe', href: '#' }
  ],
  scopeItems: [
    '{{firmName}}',
    '{{location}} branches',
    '{{advisorName}} under investigation',
    'Iranian-linked hackers',
    'Elderly Americans targeted',
    'Losses upwards of {{lossesCompact}}',
    'FTC & IRS audits ongoing',
    'Report to FTC, not advisors'
  ]
};

function envGet(name: string): string | undefined {
  try {
    const netlify = (globalThis as any).Netlify;
    return netlify && netlify.env ? netlify.env.get(name) : undefined;
  } catch (_) {
    return undefined;
  }
}

function stringValue(value: any, fallback: string): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof value.current === 'string') return value.current;
  return fallback;
}

function arrayValue(value: any, fallback: any[]): any[] {
  return Array.isArray(value) && value.length ? value : fallback;
}

function capFirst(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function lossVariants(value: string) {
  const short = value.trim() || GLOBAL_FALLBACK.totalLosses;
  const compact = short.replace(/\+\s*$/, '').trim() || GLOBAL_FALLBACK.totalLosses.replace('+', '');
  const match = /^(\$\s*[\d.,]+)\s*([BMTK])?$/i.exec(compact);
  let billion = compact;

  if (match) {
    const amount = match[1].replace(/\s+/g, '');
    const unit = String(match[2] || '').toUpperCase();
    const word: Record<string, string> = { B: 'billion', M: 'million', T: 'trillion', K: 'thousand' };
    billion = word[unit] ? `${amount} ${word[unit]}` : amount;
  }

  const long = `upwards of ${billion}`;
  return { short, compact, billion, long, longDisplay: capFirst(long) };
}

function globalValues(doc: any) {
  const values: Record<string, string> = { ...GLOBAL_FALLBACK };

  if (doc && typeof doc === 'object') {
    Object.keys(GLOBAL_FALLBACK).forEach((key) => {
      const value = doc[key];
      if (value !== undefined && value !== null) values[key] = stringValue(value, values[key]);
    });
  }

  const losses = lossVariants(values.totalLosses);

  return {
    ...values,
    publishedDisplay: values.publishedDate,
    updatedDisplay: values.updatedTime,
    lossesShort: losses.short,
    lossesCompact: losses.compact,
    lossesBillion: losses.billion,
    lossesLong: losses.long,
    lossesLongDisplay: losses.longDisplay,
    advisorName: values.advisorName,
    location: values.location,
    firmName: values.firmName
  };
}

function renderTemplate(value: any, values: Record<string, string>): any {
  if (typeof value === 'string') {
    return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_full: string, key: string) => {
      const replacement = values[key];
      return replacement === undefined || replacement === null ? '' : replacement;
    });
  }

  if (Array.isArray(value)) return value.map((item) => renderTemplate(item, values));

  if (value && typeof value === 'object') {
    const output: Record<string, any> = {};
    Object.keys(value).forEach((key) => {
      output[key] = renderTemplate(value[key], values);
    });
    return output;
  }

  return value;
}

function normalizePayload(result: any) {
  const globalDoc = result && typeof result === 'object' ? result.global : null;
  const storyDoc = result && typeof result === 'object' ? result.story : null;
  const values = globalValues(globalDoc);

  const merged: Record<string, any> = { ...STORY_TEMPLATES };
  Object.keys(STORY_TEMPLATES).forEach((key) => {
    if (storyDoc && storyDoc[key] !== undefined && storyDoc[key] !== null) {
      merged[key] = storyDoc[key];
    }
  });

  const rendered = renderTemplate(merged, values);
  const stats = arrayValue(rendered.stats, STORY_TEMPLATES.stats).map((stat: any) => ({
    k: stringValue(stat?.k, stringValue(stat?.label, '')),
    v: stringValue(stat?.v, stringValue(stat?.value, ''))
  }));
  const relatedStories = arrayValue(rendered.relatedStories, STORY_TEMPLATES.relatedStories).map((story: any) => ({
    tag: stringValue(story?.tag, ''),
    time: stringValue(story?.time, ''),
    title: stringValue(story?.title, 'Related story'),
    href: stringValue(story?.href, '#')
  }));
  const tickerItems = arrayValue(rendered.tickerItems, STORY_TEMPLATES.tickerItems).map((item: any) =>
    stringValue(item, '')
  );
  const scopeItems = arrayValue(rendered.scopeItems, STORY_TEMPLATES.scopeItems).map((item: any) =>
    stringValue(item, '')
  );
  const tickerLine = `${tickerItems.join(' // ')} //\u00a0\u00a0\u00a0\u00a0`;

  return {
    headline: stringValue(rendered.headline, values.firmName),
    dek: stringValue(rendered.dek, ''),
    byline: stringValue(rendered.byline, ''),
    kicker: stringValue(rendered.kicker, 'Breaking'),
    readTime: stringValue(rendered.readTime, ''),
    editorNote: stringValue(rendered.editorNote, ''),
    bottomLineHeading: stringValue(rendered.bottomLineHeading, ''),
    bottomLineBody: stringValue(rendered.bottomLineBody, ''),
    protectBlurb: stringValue(rendered.protectBlurb, ''),
    guidanceBlurb: stringValue(rendered.guidanceBlurb, ''),
    heroCaption: stringValue(rendered.heroCaption, ''),
    newsletterBlurb: stringValue(rendered.newsletterBlurb, ''),
    stats,
    tickerItems,
    tickerLine,
    relatedStories,
    scopeItems,
    global: {
      advisorName: values.advisorName,
      location: values.location,
      publishedDate: values.publishedDate,
      publishedDisplay: values.publishedDisplay,
      updatedTime: values.updatedTime,
      updatedDisplay: values.updatedDisplay,
      totalLosses: values.totalLosses,
      lossesShort: values.lossesShort,
      lossesCompact: values.lossesCompact,
      lossesBillion: values.lossesBillion,
      lossesLong: values.lossesLong,
      lossesLongDisplay: values.lossesLongDisplay,
      firmName: values.firmName
    },
    advisorName: values.advisorName,
    location: values.location,
    publishedDisplay: values.publishedDisplay,
    updatedDisplay: values.updatedDisplay,
    lossesShort: values.lossesShort,
    lossesCompact: values.lossesCompact,
    lossesBillion: values.lossesBillion,
    lossesLong: values.lossesLong,
    lossesLongDisplay: values.lossesLongDisplay,
    firmName: values.firmName,
    homepageCard: {
      headline: stringValue(rendered.headline, values.firmName),
      dek: stringValue(rendered.dek, '')
    },
    articleStart: {
      title: stringValue(rendered.headline, values.firmName),
      dek: stringValue(rendered.dek, ''),
      byline: stringValue(rendered.byline, ''),
      published: values.publishedDisplay,
      updated: values.updatedDisplay,
      location: values.location
    },
    source: globalDoc && typeof globalDoc === 'object' ? 'sanity' : 'fallback'
  };
}

function jsonResponse(payload: any) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Netlify-CDN-Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export default async function handler() {
  const projectId = envGet('SANITY_PROJECT_ID') || '5758yrpf';
  const dataset = envGet('SANITY_DATASET') || 'production';
  const token = envGet('SANITY_API_TOKEN');

  try {
    const url = new URL(`https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}`);
    url.searchParams.set('query', GROQ_QUERY);

    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Sanity API returned ${response.status}`);
    }

    const result = await response.json();
    return jsonResponse(normalizePayload(result?.result || result?.doc || null));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.warn(`Sanity content unavailable (${message}); serving fallback content.`);
    return jsonResponse(normalizePayload(null));
  }
}
