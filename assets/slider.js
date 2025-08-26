// assets/slider.js
function setupWorkflowCarousel(root) {
  const viewport = root.querySelector('.wf-viewport');
  const track = root.querySelector('.wf-track');
  const prevBtn = root.querySelector('.wf-prev');
  const nextBtn = root.querySelector('.wf-next');
  if (!viewport || !track || !prevBtn || !nextBtn) return;

  const SCROLL_GAP = 16;
  const pageSize = () => Math.max(viewport.clientWidth * 0.9, 320);

  function updateButtons() {
    const maxScroll = track.scrollWidth - viewport.clientWidth;
    const x = viewport.scrollLeft;
    prevBtn.disabled = x <= 4;
    nextBtn.disabled = x >= maxScroll - 4;
  }

  function scrollByPage(dir = 1) {
    viewport.scrollBy({ left: pageSize() * dir + SCROLL_GAP * dir, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => scrollByPage(-1));
  nextBtn.addEventListener('click', () => scrollByPage(1));
  viewport.addEventListener('scroll', updateButtons);
  window.addEventListener('resize', updateButtons);

  // 휠로 가로 스크롤 (데스크탑 트랙패드/마우스 휠)
  viewport.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      viewport.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  // ===== 드래그 스크롤: 터치/펜에서만 활성 =====
  let isDown = false, startX = 0, startLeft = 0;
  let draggedInThisGesture = false;   // 이번 제스처에서만 클릭 취소
  const DRAG_THRESHOLD = 12;          // 임계값 살짝 키움

  viewport.addEventListener('pointerdown', (e) => {
    // 데스크탑 마우스는 드래그 스크롤 비활성
    if (e.pointerType === 'mouse') return;
    isDown = true;
    draggedInThisGesture = false;
    startX = e.clientX;
    startLeft = viewport.scrollLeft;
    viewport.setPointerCapture(e.pointerId);
    viewport.style.cursor = 'grabbing';
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (!draggedInThisGesture && Math.abs(dx) >= DRAG_THRESHOLD) {
      draggedInThisGesture = true;
    }
    viewport.scrollLeft = startLeft - dx;
  });

  function endDrag(e){
    if (!isDown) return;
    isDown = false;
    try { viewport.releasePointerCapture(e.pointerId); } catch {}
    viewport.style.cursor = '';
    // 드래그 제스처 종료: 클릭 이벤트 한 번만 막고 곧바로 초기화
    if (draggedInThisGesture) {
      const once = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        track.removeEventListener('click', once, true);
      };
      track.addEventListener('click', once, true);
    }
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', () => { isDown = false; viewport.style.cursor = ''; });

  // 키보드 ←/→
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') scrollByPage(1);
    if (e.key === 'ArrowLeft')  scrollByPage(-1);
  });

  updateButtons();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.wf-carousel').forEach(setupWorkflowCarousel);
});
