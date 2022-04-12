# 노래왕 단젤
node.js를 이용한 개인용 디스코드 봇.  
- - -
prefix 변수 변경을 통해 명령어 접두사 변경 가능
자신만의 노래 봇을 만들어보세요
- - -

## 설치 & 실행
```terminal
npm i //패키지 다운로드
config.json //파일 생성  
node app.js //봇 실행
```
**config.json**

```json
{
    "token": "디스코드 봇 토큰",
}
```

## 사용법


#### 단젤아설명해 / 단젤아 설명해
봇 명령어 표시

#### 단젤아불러줘 <노래 제목> / 단젤아 불러줘 <노래 제목>
유튜브에서 노래 제목 검색 후 재생

#### 단젤아스킵 / 단젤아 스킵
재생중인 노래 스킵, 다음 노래로 넘어감

#### 단젤아목록 / 단젤아 목록
재생중인 노래 목록 표시

#### 단젤아잠깐 / 단젤아 잠깐
재생중인 노래 일시 중지

#### 단젤아다시 / 단젤아 다시
일시중지 된 노래 다시 재생

#### 단젤아그만 / 단젤아 그만
예약, 재생중인 노래 제거

~~~#### \` <메세지>
TTS로 메세지 출력~~~
TTS 기능 삭제
