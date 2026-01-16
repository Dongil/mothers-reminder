/**
 * TTS (Text-to-Speech) 서비스
 * Web Speech API를 사용하여 한국어 음성 합성 제공
 */

export interface TTSOptions {
  voice?: string;      // 음성 이름
  rate?: number;       // 속도 (0.1 ~ 10, 기본 0.8)
  pitch?: number;      // 음높이 (0 ~ 2, 기본 1)
  volume?: number;     // 볼륨 (0 ~ 1, 기본 1)
  lang?: string;       // 언어 (기본 'ko-KR')
}

export interface TTSState {
  speaking: boolean;
  paused: boolean;
  supported: boolean;
}

type TTSEventCallback = (state: TTSState) => void;

class TTSService {
  private synthesis: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private options: TTSOptions = {
    rate: 0.8,
    pitch: 1,
    volume: 1,
    lang: 'ko-KR',
  };
  private eventListeners: Map<string, TTSEventCallback[]> = new Map();
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
    }
  }

  /**
   * 사용 가능한 음성 로드
   */
  private loadVoices(): void {
    if (!this.synthesis) return;

    const loadVoiceList = () => {
      this.voices = this.synthesis!.getVoices();
      this.initialized = true;
    };

    // Chrome은 비동기로 음성 로드
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoiceList;
    }

    // 즉시 로드 시도
    loadVoiceList();
  }

  /**
   * TTS 지원 여부 확인
   */
  isSupported(): boolean {
    return this.synthesis !== null;
  }

  /**
   * 초기화 완료 여부
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 사용 가능한 한국어 음성 목록
   */
  getKoreanVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(
      (voice) => voice.lang.startsWith('ko') || voice.lang.includes('KR')
    );
  }

  /**
   * 모든 음성 목록
   */
  getAllVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * 기본 옵션 설정
   */
  setOptions(options: Partial<TTSOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * 텍스트 읽기
   */
  speak(text: string, options?: Partial<TTSOptions>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('TTS가 지원되지 않습니다'));
        return;
      }

      // 현재 재생 중이면 중지
      this.synthesis.cancel();

      // 음성 목록 새로고침 (Chrome 버그 대응)
      this.voices = this.synthesis.getVoices();

      // 새 utterance 생성
      this.utterance = new SpeechSynthesisUtterance(text);

      const mergedOptions = { ...this.options, ...options };

      // 옵션 적용
      this.utterance.rate = mergedOptions.rate || 0.8;
      this.utterance.pitch = mergedOptions.pitch || 1;
      this.utterance.volume = mergedOptions.volume || 1;
      this.utterance.lang = mergedOptions.lang || 'ko-KR';

      // 한국어 음성 선택 (Google 한국의 우선)
      const googleKorean = this.voices.find(v => v.name === 'Google 한국의');
      const anyKorean = this.voices.find(v => v.lang === 'ko-KR');
      if (googleKorean) {
        this.utterance.voice = googleKorean;
      } else if (anyKorean) {
        this.utterance.voice = anyKorean;
      }

      // 이벤트 핸들러
      this.utterance.onend = () => {
        this.emitEvent('stateChange', this.getState());
        resolve();
      };

      this.utterance.onerror = (event) => {
        this.emitEvent('stateChange', this.getState());
        if (event.error !== 'interrupted' && event.error !== 'canceled') {
          reject(new Error(`TTS 오류: ${event.error}`));
        } else {
          resolve();
        }
      };

      // 재생 시작
      this.synthesis.speak(this.utterance);
    });
  }

  /**
   * 재생 중지
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.utterance = null;
    }
  }

  /**
   * 일시 정지
   */
  pause(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * 재개
   */
  resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * 현재 상태
   */
  getState(): TTSState {
    return {
      speaking: this.synthesis?.speaking || false,
      paused: this.synthesis?.paused || false,
      supported: this.isSupported(),
    };
  }

  /**
   * 재생 중인지 확인
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking || false;
  }

  /**
   * 일시 정지 상태인지 확인
   */
  isPaused(): boolean {
    return this.synthesis?.paused || false;
  }

  /**
   * 이벤트 리스너 등록
   */
  on(event: string, callback: TTSEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * 이벤트 리스너 제거
   */
  off(event: string, callback: TTSEventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 이벤트 발생
   */
  private emitEvent(event: string, data: TTSState): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }
}

// 싱글톤 인스턴스
let ttsInstance: TTSService | null = null;

export function getTTSService(): TTSService {
  if (!ttsInstance) {
    ttsInstance = new TTSService();
  }
  return ttsInstance;
}

export { TTSService };
