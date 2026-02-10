export const DESIGN_MOCKUP_SOURCE = `


## 01. 디자인의 80%는 폰트에서 결정됩니다


수많은 비전공자 디자이너들이 화려한 그래픽 소스나 화려한 컬러를 찾는 데 시간을 허비하곤 합니다. 하지만 프로와 아마추어를 가르는 결정적인 차이는 **가장 기본 요소인 텍스트**를 얼마나 질서 있게 다루느냐에 달려 있습니다.

오늘 우리가 배울 내용은 단순한 폰트 선택법이 아닙니다. 사용자의 시선이 어디서 시작해서 어디로 끝날지, 그 흐름을 설계하는 '시각적 지도'를 그리는 법입니다. 복잡한 이론은 다 걷어내고, 지금 당장 실무에 적용 가능한  **3단계 핵심 공식**만 전달해 드릴게요.




<br/>

## 02.폰트 위계의 3가지 핵심 축

<ThreeColumns>
  <ThreeColumns.Item title="크기(Size)">
    제목은 '생각보다 훨씬 더' 커야 하고, 본문은 읽기 편할 만큼 작아야 합니다. 어중간한 크기 차이는 유저에게 혼란만 줍니다.
  </ThreeColumns.Item>

  <ThreeColumns.Item title="굵기(Weight)의 강조">
    모든 글자가 굵으면 아무것도 강조되지 않습니다. 중요한 키워드와 제목에만 볼드체(Semi-Bold 이상)를 적용하세요.
  </ThreeColumns.Item>

  <ThreeColumns.Item title="명도(Color/Opacity)의 조절">
    흰색 배경에 검정 글자만 쓰지 마세요. 보조 설명은 명도를 낮춰서 시각적 우선순위를 뒤로 밀어주는 것이 기술입니다.
  </ThreeColumns.Item>
</ThreeColumns>



<br/>
## 03.제목은 웅장하게, 본문은 편안하게

가장 흔한 실수는 제목과 본문의 크기 차이를 너무 적게 두는 것입니다. 예를 들어 제목이 24px인데 본문이 16px라면, 유저는 이 두 정보의 중요도 차이를 직관적으로 느끼지 못합니다.

시각적 대비(Contrast)가 확실해야 유저의 시선이 길을 잃지 않습니다. 제목을 압도적으로 크게 잡는 것만으로도 디자인의 전체적인 중심이 잡히는 것을 경험하실 수 있을 거예요. 특히 모바일 환경에서는 화면이 작기 때문에 이러한 대비가 더욱 드라마틱하게 적용되어야 합니다.


![sample](https://picsum.photos/1000/500)
![sample](https://picsum.photos/1000/500)



<br/>
## GOYO.’s <span className="text-primary">Tip</span>

실무에서 실패 없는 '황금 비율'을 알려드릴게요. **메인 제목이 48px라면, 소제목은 24px, 본문은 16px**로 설정해 보세요. (딱 2:1:0.6 비율이죠!) 

또한, **한국어 폰트(Pretendard 등)**는 영문에 비해 글자가 꽉 차 보이기 때문에, **행간(Line-height)을 1.7에서 1.8** 사이로 아주 넉넉히 주어야 긴 글을 읽을 때 눈이 피로하지 않습니다. 

자간(Letter Spacing)도 -2% 정도로 살짝 좁혀주면 훨씬 세련된 느낌이 납니다.



<br/>
## 04.지금 바로 피그마에서 적용해 보세요

이론을 아는 것과 실제로 구현하는 것은 별개의 문제입니다. 지금 작업 중인 시안을 열어보세요. 그리고 가장 중요한 정보 딱 하나만 남기고 나머지는 모두 크기를 줄이거나 색상을 연하게 바꿔보세요. 그 과정이 바로 '위계 잡기'의 시작입니다.

여러분의 디자인이 어떻게 변했나요? 훨씬 정돈되고 말하고자 하는 바가 뚜렷해졌다면, 여러분은 이미 한 단계 성장한 디자이너입니다.
`;

// 개발기록 목업
export const DEV_MOCKUP_SOURCE = `

## 01. React Router에서 데이터 흐름을 이해하는 순간

처음 React Router를 사용할 때 많은 사람들이 헷갈리는 지점이 있습니다.  
"이 데이터는 왜 여기서 가져오고, 저건 왜 컴포넌트에서 처리하지?" 라는 의문이죠.

하지만 구조를 한 번만 제대로 이해하면, 프론트엔드 개발의 난이도가 절반으로 내려갑니다.  
핵심은 **UI 렌더링과 데이터 패칭의 책임을 분리하는 것**입니다.

우리가 배울 내용은 단순히 loader 함수 사용법이 아닙니다.  
**서버와 화면 사이의 역할 분담을 설계하는 방법**을 이해하는 과정입니다.  
이걸 알면 프로젝트 구조가 훨씬 깔끔해집니다.

<br/>

## 02. React Router 데이터 구조의 3가지 핵심 축

<ThreeColumns>
  <ThreeColumns.Item title="Loader는 서버의 영역">
    데이터는 가능한 한 loader에서 가져와야 합니다. 컴포넌트 내부에서 fetch를 하면 서버 렌더링의 장점을 잃게 됩니다.
  </ThreeColumns.Item>

  <ThreeColumns.Item title="컴포넌트는 UI에 집중">
    컴포넌트는 데이터를 '가져오는 곳'이 아니라 '보여주는 곳'입니다. 역할이 분리될수록 유지보수가 쉬워집니다.
  </ThreeColumns.Item>

  <ThreeColumns.Item title="Action은 상태 변경 전용">
    좋아요, 북마크, 댓글 작성처럼 데이터가 바뀌는 로직은 action에서 처리하는 것이 가장 안정적인 구조입니다.
  </ThreeColumns.Item>
</ThreeColumns>

<br/>

## 03. Loader에서 데이터를 가져오는 기본 구조

아래는 클래스 상세 페이지에서 데이터를 가져오는 가장 기본적인 형태입니다.

\`\`\`ts
export async function loader({ params }: Route.LoaderArgs) {
  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, params.slug),
  });

  if (!post) throw new Response("Not Found", { status: 404 });

  return { post };
}
\`\`\`

이렇게 하면 컴포넌트에서는 이미 준비된 데이터를 받기만 하면 됩니다.

\`\`\`tsx
export default function ClassDetail({ loaderData }: Route.ComponentProps) {
  const { post } = loaderData;

  return <h1>{post.title}</h1>;
}
\`\`\`

이 구조가 익숙해지는 순간,  
데이터 흐름이 훨씬 직관적으로 느껴지기 시작합니다.

<br/>

## GOYO.’s <span className="text-primary">Dev Tip</span>

**"데이터는 loader에서, UI는 컴포넌트에서"**  
이 원칙 하나만 지켜도 프로젝트의 복잡도가 크게 줄어듭니다.

특히 협업을 할 때, 누군가는 데이터 로직을, 누군가는 UI를 맡아도  
충돌 없이 개발을 이어갈 수 있는 구조가 만들어집니다.

<br/>

## 04. Action으로 상태를 변경하는 구조

좋아요 버튼을 예로 들어보겠습니다.

\`\`\`ts
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const postId = formData.get("postId");

  await db.insert(likes).values({ postId });

  return { success: true };
}
\`\`\`

그리고 버튼은 이렇게 작성됩니다.

\`\`\`tsx
<Form method="post">
  <input type="hidden" name="postId" value={post.id} />
  <button type="submit">좋아요</button>
</Form>
\`\`\`

UI는 단순하지만, 데이터 변경은 서버에서 안전하게 처리되는 구조죠.

<br/>

## 05. 이제 여러분의 프로젝트에 적용해 보세요

지금 만들고 있는 페이지를 하나 떠올려 보세요.  
그 페이지의 데이터는 어디에서 가져오고 있나요?

만약 컴포넌트 안에서 fetch를 하고 있다면,  
오늘 배운 구조로 loader로 옮겨보세요.

**코드는 줄어들고, 구조는 더 단단해질 겁니다.**  
이게 바로 실무에서 사용하는 React Router의 진짜 힘입니다.

`;
