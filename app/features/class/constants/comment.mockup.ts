export const COMMENT_MOCKUP = [
  {
    id: 1,
    content:
      "오늘 글 진짜 도움 많이 됐어요. 특히 제목/본문 위계 잡는 기준이 명확해져서 바로 적용해봤습니다!",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 1,
    userName: "성장하는기록자",
    userProfileImage: "https://picsum.photos/100/101",
    likes: 7,
  },
  {
    id: 2,
    content:
      "폰트 크기만 키우면 되는 줄 알았는데… 위계라는 개념이 핵심이었네요. 다음 편도 기대됩니다.",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 2,
    userName: "디자인뉴비",
    userProfileImage: "https://picsum.photos/100/102",
    likes: 3,
  },
  {
    id: 3,
    content:
      "사수님 질문 있어요! 모바일에서는 데스크탑이랑 같은 위계 규칙을 그대로 적용해도 괜찮나요? 아니면 모바일은 기준이 좀 달라져야 하나요?",
    createdAt: "2026-02-09",
    updatedAt: "2026-02-09",
    userId: 3,
    userName: "궁금한사수",
    userProfileImage: "https://picsum.photos/100/103",
    likes: 1,
  },

  // ✅ 3번 댓글에 대한 대댓글을 "많이" 달아둔 목업
  {
    id: 101,
    parentId: 3,
    content:
      "좋은 질문이에요. 모바일은 화면이 좁아서 위계 차이를 ‘조금 더 촘촘하게’ 가져가는 편입니다. (예: 2배 → 1.5배)",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 10,
    userName: "GOYO",
    userProfileImage: "https://picsum.photos/100/110",
    likes: 12,
  },
  {
    id: 102,
    parentId: 3,
    content:
      "저도 모바일에서는 제목이 너무 크면 답답해 보여서, 본문 대비 1.4~1.6배 정도로 맞추면 안정적이더라구요.",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 11,
    userName: "모바일최적화",
    userProfileImage: "https://picsum.photos/100/111",
    likes: 4,
  },
  {
    id: 103,
    parentId: 3,
    content:
      "모바일은 줄바꿈이 자주 생기니까, 제목 길이도 같이 관리해야 하는 것 같아요. 너무 길면 위계가 아니라 ‘덩어리’가 됩니다.",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 12,
    userName: "줄바꿈장인",
    userProfileImage: "https://picsum.photos/100/112",
    likes: 2,
  },
  {
    id: 104,
    parentId: 3,
    content:
      "혹시 모바일에서는 line-height를 더 키우는 것도 위계에 도움 되나요? 저는 1.8까지 올리면 읽기 편하긴 했어요.",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 13,
    userName: "행간러버",
    userProfileImage: "https://picsum.photos/100/113",
    likes: 1,
  },
  {
    id: 105,
    parentId: 3,
    content:
      "저는 모바일에서 색 대비(명도)로 위계 주는 게 더 중요하다고 느꼈어요. 크기만으로는 한계가 있더라구요.",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 14,
    userName: "명도조절",
    userProfileImage: "https://picsum.photos/100/114",
    likes: 3,
  },
  {
    id: 106,
    parentId: 3,
    content:
      "본문 16px 고정해도 되나요? 어떤 분들은 모바일은 15px이 낫다고도 하던데 저는 16px이 편했어요.",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 15,
    userName: "폰트사이즈논쟁",
    userProfileImage: "https://picsum.photos/100/115",
    likes: 0,
  },
  {
    id: 107,
    parentId: 3,
    content:
      "결론: 모바일은 ‘덜 과장’이 맞는 듯… 제목 너무 크면 스크롤 시작점에서 피로감이 생겨요.",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 16,
    userName: "스크롤피로",
    userProfileImage: "https://picsum.photos/100/116",
    likes: 2,
  },
  {
    id: 108,
    parentId: 3,
    content:
      "사수님 답변 기다립니다! 이 주제는 따로 클래스 하나 파도 될 듯해요. 모바일 타이포그래피 꼭 해주세요.",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-10",
    userId: 17,
    userName: "요청합니다",
    userProfileImage: "https://picsum.photos/100/117",
    likes: 5,
  },

  // 다른 최상위 댓글 하나 더
  {
    id: 4,
    content:
      "팁 박스에 있는 2:1:0.6 비율 진짜 바로 써먹었습니다. 디자인이 갑자기 ‘그럴싸’해졌어요.",
    createdAt: "2026-02-08",
    updatedAt: "2026-02-08",
    userId: 4,
    userName: "비율수집가",
    userProfileImage: "https://picsum.photos/100/104",
    likes: 6,
  },
];
