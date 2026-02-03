'use client';

/**
 * @fileoverview 사용 가이드 섹션 컴포넌트
 *
 * 설정 페이지에서 간단한 사용법을 안내하는 아코디언 형태의 섹션입니다.
 * 접기/펼치기 기능으로 필요할 때만 내용을 표시합니다.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * QuickGuideSection - 설정 페이지 사용 가이드 섹션
 *
 * @description 주요 기능 사용법을 간단히 안내하는 아코디언 섹션입니다.
 * 기본적으로 접힌 상태이며, 클릭하면 펼쳐집니다.
 *
 * 포함 내용:
 * - 메시지 작성 방법
 * - 디스플레이 사용법
 * - 음성 알림 설정
 * - 반복 메시지 설정
 * - 전체 메뉴얼 다운로드 링크
 */
export function QuickGuideSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            사용 가이드
          </span>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 space-y-4">
          {/* 메시지 작성 */}
          <GuideItem
            title="메시지 작성"
            description='홈 화면에서 "+ 메시지 추가" 버튼을 눌러 새 메시지를 작성하세요.'
          />

          {/* 디스플레이 사용 */}
          <GuideItem
            title="디스플레이 화면"
            description="홈 화면 상단의 화면 아이콘을 눌러 태블릿용 큰 화면으로 전환하세요. 처음에는 화면을 터치해서 오디오를 활성화해야 합니다."
          />

          {/* 음성 알림 */}
          <GuideItem
            title="음성으로 듣기"
            description='메시지 작성 시 "음성 읽기"를 체크하고 알림 시간을 설정하면, 해당 시간에 자동으로 읽어줍니다.'
          />

          {/* 반복 메시지 */}
          <GuideItem
            title="반복 메시지"
            description='메시지 작성 시 "반복 설정"을 켜고 요일을 선택하면, 매주 해당 요일에 자동으로 표시됩니다.'
          />

          {/* 알림 받기 */}
          <GuideItem
            title="푸시 알림"
            description="설정 > 알림에서 푸시 알림을 켜면, 가족이 메시지를 작성할 때 알림을 받을 수 있습니다."
          />

          {/* 구분선 */}
          <hr className="my-4" />

          {/* 전체 메뉴얼 링크 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">
              더 자세한 사용법은 전체 메뉴얼을 참고하세요.
            </p>
            <div className="flex gap-2">
              <a
                href="/docs/USER-MANUAL.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  전체 메뉴얼
                </Button>
              </a>
              <a
                href="/docs/QUICK-GUIDE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  간단 가이드
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * GuideItem - 가이드 항목 컴포넌트
 */
function GuideItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h4 className="font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
