import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export default function MagicLink() {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-white font-sans">
          <Preview>Goyo Magic Link</Preview>
          <Container className="mx-auto max-w-[560px] py-5 pb-12">
            <Heading className="pt-4 text-center text-2xl leading-tight font-normal tracking-[-0.5px] text-black">
              Goyo Magic Link
            </Heading>
            <Section>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Magic Link를 요청하셨다면 아래 버튼을 클릭하여 로그인하세요:
              </Text>
              <Button
                className="block rounded-xl bg-black px-6 py-3 text-center text-[15px] font-semibold text-white no-underline"
                href={`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/`}
              >
                여기를 클릭하여 로그인
              </Button>
            </Section>
            <Section>
              <Text className="mt-10 mb-4 text-[15px] leading-relaxed text-black">
                또는 일회용 비밀번호를 요청하셨다면 아래 코드를 복사하여
                웹사이트에 붙여넣으세요.
              </Text>
              <div className="flex justify-center">
                <code className="mx-auto inline-block rounded bg-[#dfe1e4] px-1 py-2 text-center font-mono text-[21px] font-bold tracking-[-0.3px] text-black uppercase">
                  {`{{ .Token }}`}
                </code>
              </div>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                이 코드를 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                감사합니다,
              </Text>
              <Text className="mb-4 text-[15px] leading-relaxed text-black">
                Goyo 팀
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}
