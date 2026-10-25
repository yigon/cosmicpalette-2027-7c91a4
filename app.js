const config = window.PALETTE,
  photos = config.photos;
if (config.cover) document.querySelector('#cover-image').src = config.cover;
const $ = s => document.querySelector(s),
  escape = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [c]));
const placeholder = (label, n, cls = '') =>
  `<div class="placeholder ${cls}">${n?`<span class="num">${n}</span>`:''}<span>${label}</span></div>`;
const media = (url, alt, cls) => url ?
  `<img class="${cls}" src="${escape(url)}" alt="${escape(alt)}">` : placeholder(alt, '', cls +
    '-placeholder');
let leaving = false,
  savedScroll = 0;
photos.forEach((p, i) => {
  const a = document.createElement('a');
  a.className = 'tile';
  a.href = '#' + p.id;
  a.setAttribute('aria-label', p.name + 'を開く'.replace('を開く', ' 열기'));
  a.innerHTML = p.thumbnail ?
    `<img src="${escape(p.thumbnail)}" alt="${escape(p.name)}" loading="lazy">` : placeholder(
      'PHOTO · 준비 중', String(i + 1).padStart(2, '0'));
  a.innerHTML += `<span class="overlay">${escape(p.title)}</span>`;
  a.addEventListener('click', e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    if (leaving) return;
    leaving = true;
    savedScroll = scrollY;
    a.classList.add('opening');
    setTimeout(() => {
      location.hash = p.id;
      leaving = false;
      a.classList.remove('opening')
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700)
  });
  $('#grid').append(a)
});

function download(a, url) {
  if (url) {
    a.href = url;
    a.download = '';
    a.removeAttribute('aria-disabled')
  } else {
    a.setAttribute('aria-disabled', 'true');
    a.href = '#';
    a.onclick = e => {
      e.preventDefault();
      $('.notice').textContent = '원본 사진을 준비하고 있습니다.';
      $('.notice').classList.add('show');
      setTimeout(() => $('.notice').classList.remove('show'), 2200)
    }
  }
}
download($('#download-all'), config.zip);
if (config.zip) $('#zip-status').hidden = true;

function route() {
  const p = photos.find(p => '#' + p.id === location.hash);
  document.documentElement.classList.toggle('detail-open', !!p);
  $('#collection').hidden = !!p;
  $('#detail').hidden = !p;
  if (!p) {
    document.title = '우주가 그린 색 · 2027';
    if (location.hash === '#gallery') requestAnimationFrame(() => $('#gallery').scrollIntoView());
    else if (savedScroll) requestAnimationFrame(() => scrollTo(0, savedScroll));
    return
  }
  document.title = p.title + ' · The Cosmic Palette';
  $('#detail').innerHTML =
    `<a class="back" href="#gallery">← 목록</a><header class="object-heading"><h2>${escape(p.title)}</h2><p>${escape(p.name)}</p></header><div class="download-row"><a id="single-download" class="text-link">사진 다운로드 ↓</a></div>${media(p.image,'천체 사진 · 준비 중','photo')}${media(p.chart,'성도 · 준비 중','chart')}<section class="info">${p.description?`<p>${escape(p.description)}</p>`:''}${p.date||p.location?`<dl class="meta">${p.date?`<dt>촬영 날짜</dt><dd>${escape(p.date)}</dd>`:''}${p.location?`<dt>촬영 장소</dt><dd>${escape(p.location)}</dd>`:''}</dl>`:''}</section><p class="detail-footer">© 2027 Yigon Kim</p>`;
  download($('#single-download'), p.download || p.image);
  scrollTo(0, 0);
  $('#detail').setAttribute('tabindex', '-1');
  $('#detail').focus({
    preventScroll: true
  })
}
addEventListener('hashchange', route);
route();


// 커버에서 화면 높이의 15%만큼 내리면 그리드로 이동합니다.
const COVER_SCROLL_THRESHOLD = 0.15;
let coverScrollArmed = window.scrollY <= 2;
let previousCoverScrollY = window.scrollY;
let coverScrollFrame = 0;

window.addEventListener('scroll', () => {
  if (coverScrollFrame) return;
  coverScrollFrame = requestAnimationFrame(() => {
    coverScrollFrame = 0;
    const currentY = window.scrollY;
    const movingDown = currentY > previousCoverScrollY;
    previousCoverScrollY = currentY;

    // 개별 사진 페이지에서는 일반 스크롤을 유지합니다.
    if (document.querySelector('#collection').hidden) return;

    const cover = document.querySelector('#cover');
    const gallery = document.querySelector('#gallery');
    const coverTop = cover.getBoundingClientRect().top + currentY;
    const galleryTop = gallery.getBoundingClientRect().top + currentY;
    const threshold = window.innerHeight * COVER_SCROLL_THRESHOLD;

    // 커버 맨 위로 돌아왔을 때만 다음 자동 전환을 준비합니다.
    if (currentY <= coverTop + 2) coverScrollArmed = true;

    if (coverScrollArmed && movingDown &&
        currentY >= coverTop + threshold && currentY < galleryTop) {
      coverScrollArmed = false;
      gallery.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant' : 'smooth',
        block: 'start'
      });
    }
  });
}, { passive: true });
