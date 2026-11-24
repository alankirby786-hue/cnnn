export const config = {
  path: '/api/sanity-content'
};

const DOCUMENT_ID = 'cnnReportStory.edward-jones-louisiana-investigation';

const DEFAULT_STORY = {
  headline: 'Iranian-Linked Hackers Breach Edward Jones in Louisiana',
  dek: 'Elderly Americans targeted in a campaign that began last month. Louisiana branches now under heavy FTC and IRS audit — with advisor Beau Wilson under investigation — as reported losses climb upwards of $1.3 billion.',
  advisorName: 'Beau Wilson',
  location: '',
  byline: 'Maya Chen and Jordan Hale',
  publishedDisplay: 'August 16, 2026',
  updatedDisplay: '4:18 p.m. ET',
  lossesShort: '$1.3B+',
  lossesLong: 'upwards of $1.3 billion',
  firmName: 'Edward Jones',
  kicker: 'Breaking',
  readTime: '8 min read',
  editorNote: 'Developing report on alleged compromises involving Edward Jones in Louisiana, Iranian-linked hackers, and elderly U.S. targets. Advisor Beau Wilson is under investigation. Activity began last month. Reported losses: upwards of $1.3 billion. Affected branches are under heavy FTC and IRS audit. If you are facing something similar, do not be afraid, refrain from contacting advisors, and file with the FTC at ReportFraud.ftc.gov.',
  bottomLineHeading: '$1.3B. Report to the FTC.',
  bottomLineBody: 'Iranian-linked hackers, Edward Jones in Louisiana, and a deliberate focus on elderly Americans — with advisor Beau Wilson under investigation, the campaign underway since last month, and losses climbing upwards of $1.3 billion. Those branches are under heavy FTC and IRS audit. If you are facing something similar, do not be afraid. Refrain from contacting advisors. File a report at the FTC instead.',
  protectBlurb: 'Do not be afraid. Compromised Edward Jones branches are under heavy FTC and IRS audit. Advisor Beau Wilson is under investigation. Losses are upwards of $1.3 billion. Refrain from contacting advisors — file a report with the FTC instead.',
  guidanceBlurb: 'Louisiana Edward Jones branches are under heavy FTC and IRS investigation. Advisor Beau Wilson is under probe after losses upwards of $1.3 billion.',
  heroCaption: 'Authorities move in as the Louisiana Edward Jones probe widens — advisor Beau Wilson is among those under investigation.',
  newsletterBlurb: 'Get updates when the FTC, IRS, or investigators issue new guidance for affected clients.',
  stats: [
    { k: 'Losses', v: '$1.3B+' },
    { k: 'Firm', v: 'Edward Jones' },
    { k: 'Under probe', v: 'Beau Wilson' },
    { k: 'Action', v: 'File w/ FTC' }
  ],
  tickerItems: [
    'BREAKING: Edward Jones Louisiana branches compromised',
    'Advisor Beau Wilson under investigation',
    'Iranian-linked actors suspected in elder-targeted campaign',
    'Reported losses upwards of $1.3 billion',
    'FTC and IRS open heavy audits of affected branches',
    'Officials urge clients: file with FTC — do not contact advisors'
  ],
  relatedStories: [
    { tag: 'Consumer Alert', time: '5 min', title: 'How to file a strong FTC fraud report', href: '#' },
    { tag: 'Investigation', time: '6 min', title: 'Who is Beau Wilson?', href: '#' },
    { tag: 'Markets', time: '7 min', title: 'Inside the $1.3 billion loss estimate', href: '#' },
    { tag: 'Guides', time: '4 min', title: 'Why seniors should skip advisor calls during a probe', href: '#' }
  ],
  scopeItems: [
    'Edward Jones',
    'Louisiana branches',
    'Beau Wilson under investigation',
    'Iranian-linked hackers',
    'Elderly Americans targeted',
    'Losses upwards of $1.3B',
    'FTC & IRS audits ongoing',
    'Report to FTC, not advisors'
  ]
};

const GROQ_QUERY = `*[_type == "cnnReportStory" && _id == "${DOCUMENT_ID}"][0]{
  headline,
  dek,
  advisorName,
  location,
  byline,
  publishedDisplay,
  updatedDisplay,
  lossesShort,
  lossesLong,
  firmName,
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
}`;

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

function normalizeStory(doc: any) {
  const source = doc && typeof doc === 'object' ? doc : {};
  const stats = arrayValue(source.stats, DEFAULT_STORY.stats).map((stat: any) => ({
    k: stringValue(stat?.k, stringValue(stat?.label, '')),
    v: stringValue(stat?.v, stringValue(stat?.value, ''))
  }));

  const relatedStories = arrayValue(source.relatedStories, DEFAULT_STORY.relatedStories).map((story: any) => ({
    tag: stringValue(story?.tag, ''),
    time: stringValue(story?.time, ''),
    title: stringValue(story?.title, 'Related story'),
    href: stringValue(story?.href, '#')
  }));

  const story = {
    headline: stringValue(source.headline, DEFAULT_STORY.headline),
    dek: stringValue(source.dek, DEFAULT_STORY.dek),
    advisorName: stringValue(source.advisorName, DEFAULT_STORY.advisorName),
    location: stringValue(source.location, DEFAULT_STORY.location),
    byline: stringValue(source.byline, DEFAULT_STORY.byline),
    publishedDisplay: stringValue(source.publishedDisplay, DEFAULT_STORY.publishedDisplay),
    updatedDisplay: stringValue(source.updatedDisplay, DEFAULT_STORY.updatedDisplay),
    lossesShort: stringValue(source.lossesShort, DEFAULT_STORY.lossesShort),
    lossesLong: stringValue(source.lossesLong, DEFAULT_STORY.lossesLong),
    firmName: stringValue(source.firmName, DEFAULT_STORY.firmName),
    kicker: stringValue(source.kicker, DEFAULT_STORY.kicker),
    readTime: stringValue(source.readTime, DEFAULT_STORY.readTime),
    editorNote: stringValue(source.editorNote, DEFAULT_STORY.editorNote),
    bottomLineHeading: stringValue(source.bottomLineHeading, DEFAULT_STORY.bottomLineHeading),
    bottomLineBody: stringValue(source.bottomLineBody, DEFAULT_STORY.bottomLineBody),
    protectBlurb: stringValue(source.protectBlurb, DEFAULT_STORY.protectBlurb),
    guidanceBlurb: stringValue(source.guidanceBlurb, DEFAULT_STORY.guidanceBlurb),
    heroCaption: stringValue(source.heroCaption, DEFAULT_STORY.heroCaption),
    newsletterBlurb: stringValue(source.newsletterBlurb, DEFAULT_STORY.newsletterBlurb),
    stats,
    tickerItems: arrayValue(source.tickerItems, DEFAULT_STORY.tickerItems).map((item: any) => stringValue(item, '')),
    relatedStories,
    scopeItems: arrayValue(source.scopeItems, DEFAULT_STORY.scopeItems).map((item: any) => stringValue(item, ''))
  };

  return {
    ...story,
    lossesLongDisplay: capFirst(story.lossesLong),
    homepageCard: {
      headline: story.headline,
      dek: story.dek
    },
    articleStart: {
      title: story.headline,
      dek: story.dek,
      byline: story.byline,
      published: story.publishedDisplay,
      updated: story.updatedDisplay,
      location: story.location
    }
  };
}

function jsonResponse(payload: any) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Netlify-CDN-Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export default async function handler() {
  const projectId = envGet('SANITY_PROJECT_ID') || '5758yrpf';
  const dataset = envGet('SANITY_DATASET') || 'production';
  const token = envGet('SANITY_API_TOKEN');

  if (!token) {
    return jsonResponse({ ...normalizeStory(null), source: 'fallback' });
  }

  try {
    const url = new URL(`https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}`);
    url.searchParams.set('query', GROQ_QUERY);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Sanity API returned ${response.status}`);
    }

    const result = await response.json();
    const doc = result?.result || result?.doc || null;
    if (!doc || typeof doc !== 'object') {
      return jsonResponse({ ...normalizeStory(null), source: 'fallback' });
    }

    return jsonResponse({ ...normalizeStory(doc), source: 'sanity' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    console.warn(`Sanity content unavailable (${message}); serving fallback content.`);
    return jsonResponse({ ...normalizeStory(null), source: 'fallback' });
  }
}
