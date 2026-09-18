import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// type 키워드를 빼고 순수 JS 객체로 변경!
export const metadata = {
  title: "나만의 가상 타로",
  description: "언제 어디서나 즐기는 타로 카드 뽑기",
};

// 불필요한 타입 지정(Readonly, React.ReactNode 등) 제거
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}