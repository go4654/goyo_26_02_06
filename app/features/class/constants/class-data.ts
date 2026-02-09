export interface ClassLecture {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  tags: string[];
  slug: string;
}

// 임시 강의 데이터 (구동 확인용)
const MOCK_LECTURES: ClassLecture[] = [
  {
    id: "1",
    title: "비전공자도 칭찬받는 폰트 위계 잡기",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "photoshop",
    tags: ["디자인", "포토샵"],
    slug: "font-hierarchy",
  },
  {
    id: "2",
    title: "일러스트레이터 펜툴 마스터",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "illustrator",
    tags: ["디자인", "일러스트"],
    slug: "illustrator-pen",
  },
  {
    id: "3",
    title: "Figma 컴포넌트 시스템",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "figma",
    tags: ["디자인", "Figma"],
    slug: "figma-components",
  },
  {
    id: "4",
    title: "UX/UI 디자인 원칙",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "uxui",
    tags: ["디자인", "UXUI"],
    slug: "uxui-principles",
  },
  {
    id: "5",
    title: "HTML5 시맨틱 마크업",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "html",
    tags: ["퍼블리싱", "HTML"],
    slug: "html-semantic",
  },
  {
    id: "6",
    title: "CSS Grid와 Flexbox",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "css",
    tags: ["퍼블리싱", "CSS"],
    slug: "css-layout",
  },
  {
    id: "7",
    title: "jQuery 실전 활용",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "jquery",
    tags: ["퍼블리싱", "jQuery"],
    slug: "jquery-guide",
  },
  {
    id: "8",
    title: "JavaScript ES6+ 가이드",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "javascript",
    tags: ["개발", "JavaScript"],
    slug: "javascript-es6",
  },
  {
    id: "9",
    title: "React Hooks 활용법",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "react",
    tags: ["개발", "React"],
    slug: "react-hooks",
  },
  {
    id: "10",
    title: "Git 브랜치 전략",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "git",
    tags: ["개발", "Git"],
    slug: "git-branch",
  },
  {
    id: "11",
    title: "TypeScript 타입 시스템",
    imageUrl: "/img/gallery_portfolio_01.png",
    category: "typescript",
    tags: ["개발", "TypeScript"],
    slug: "typescript-types",
  },
];

export function getLecturesByCategory(category: string | null): ClassLecture[] {
  if (!category) return MOCK_LECTURES;
  return MOCK_LECTURES.filter((lecture) => lecture.category === category);
}
