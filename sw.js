// 캐시 이름을 설정합니다 (버전 관리용)
const CACHE_NAME = 'joya-es-v1';
// 캐싱할 파일 목록 (기본적으로 루트와 인덱스 파일)
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 서비스 워커 설치 시 파일을 캐시에 저장
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('파일을 캐시에 저장 중...');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// 네트워크 요청 시 캐시된 파일이 있으면 반환, 없으면 네트워크에서 가져옴
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
