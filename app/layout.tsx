import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '과제 5 — 대화가 끊겨도 이어지는 환율 프로젝트',
  description: '과제 4 환율 기록 정보판을 두 AI의 공통 검사와 인계 문서로 개선한 과제 5 결과물입니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
