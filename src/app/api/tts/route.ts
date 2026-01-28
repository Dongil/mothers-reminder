import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Cloud Text-to-Speech API를 사용한 TTS 엔드포인트
 * POST /api/tts
 * Body: { text: string, voice?: string, speed?: number }
 * Response: { audioContent: string (base64) }
 */
export async function POST(request: NextRequest) {
  try {
    const { text, voice, speed } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '텍스트가 필요합니다' },
        { status: 400 }
      );
    }

    // 텍스트 길이 제한 (5000자)
    if (text.length > 5000) {
      return NextResponse.json(
        { error: '텍스트가 너무 깁니다 (최대 5000자)' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;

    if (!apiKey) {
      console.error('GOOGLE_CLOUD_TTS_API_KEY not configured');
      return NextResponse.json(
        { error: 'TTS 서비스가 설정되지 않았습니다' },
        { status: 500 }
      );
    }

    // 음성 설정 (기본값: ko-KR-Wavenet-A)
    const voiceName = voice || 'ko-KR-Wavenet-A';
    // 속도 설정 (기본값: 0.9)
    const speakingRate = typeof speed === 'number' ? speed : 0.9;

    // Google Cloud TTS API 호출
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'ko-KR',
            name: voiceName,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: speakingRate,
            pitch: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google TTS API error:', error);
      return NextResponse.json(
        { error: `TTS 변환 실패: ${error.error?.message || JSON.stringify(error)}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      audioContent: data.audioContent,
    });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: 'TTS 처리 중 오류 발생' },
      { status: 500 }
    );
  }
}
