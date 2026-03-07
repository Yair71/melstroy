export function attachMurinoInput(target, handlers) {
  const state = {
    start: null
  };

  function onKeyDown(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') handlers.left?.();
    if (e.code === 'ArrowRight' || e.code === 'KeyD') handlers.right?.();
    if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') handlers.jump?.();
    if (e.code === 'Enter') handlers.enter?.();
  }

  function onPointerDown(e) {
    state.start = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e) {
    if (!state.start) return;

    const dx = e.clientX - state.start.x;
    const dy = e.clientY - state.start.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    state.start = null;

    if (Math.max(adx, ady) < 24) return;

    if (adx > ady) {
      if (dx < 0) handlers.left?.();
      else handlers.right?.();
      return;
    }

    if (dy < 0) {
      handlers.jump?.();
    }
  }

  window.addEventListener('keydown', onKeyDown);
  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointerup', onPointerUp);

  return {
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('pointerdown', onPointerDown);
      target.removeEventListener('pointerup', onPointerUp);
    }
  };
}
