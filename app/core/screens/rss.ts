/**
 * RSS Feed Generator
 *
 * 네이버 웹마스터(서치어드바이저) 등에 등록할 수 있는 RSS 2.0 피드를 제공합니다.
 * 현재는 공개 뉴스 콘텐츠를 기준으로 최신 글 목록을 노출합니다.
 */

import { getNewsList } from "~/features/news/queries";
import makeServerClient from "~/core/lib/supa-client.server";

/**
 * RSS 피드 로더
 *
 * - SITE_URL 환경 변수를 기반으로 절대 URL 생성
 * - 최신 뉴스 글 상위 N개를 가져와 RSS item으로 변환
 */
export async function loader({ request }: { request: Request }) {
  const DOMAIN = process.env.SITE_URL;

  if (!DOMAIN) {
    throw new Error("SITE_URL 환경 변수가 설정되어 있지 않습니다.");
  }

  const [client] = makeServerClient(request);

  // 최신 뉴스 20개 정도만 RSS에 포함 (너무 많을 필요는 없음)
  const { items } = await getNewsList(client, {
    page: 1,
    pageSize: 20,
  });

  const channelTitle = "고요 GOYO 뉴스 피드";
  const channelLink = DOMAIN;
  const channelDescription =
    "고요(GOYO)의 업데이트와 소식을 제공하는 RSS 피드입니다.";

  const now = new Date().toUTCString();

  const itemXml = items
    .map((item) => {
      const itemUrl = `${DOMAIN}/news/${encodeURIComponent(item.slug)}`;
      const pubDate = item.published_at
        ? new Date(item.published_at).toUTCString()
        : now;

      return `<item>
  <title><![CDATA[${item.title}]]></title>
  <link>${itemUrl}</link>
  <guid>${itemUrl}</guid>
  <category><![CDATA[${item.category}]]></category>
  <pubDate>${pubDate}</pubDate>
</item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[${channelTitle}]]></title>
    <link>${channelLink}</link>
    <description><![CDATA[${channelDescription}]]></description>
    <lastBuildDate>${now}</lastBuildDate>
${itemXml}
  </channel>
</rss>
`;

  return new Response(rssXml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

