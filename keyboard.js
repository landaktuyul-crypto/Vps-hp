(() => {
  const keyboard = document.getElementById('keyboard');
  const defaultInput = document.getElementById('input');
  let activeElement = defaultInput;

  const layout = [
    ['`','1','2','3','4','5','6','7','8','9','0','-','=','Backspace'],
    ['Tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],
    ['CapsLock','a','s','d','f','g','h','j','k','l',';','\'', 'Enter'],
    ['Shift','z','x','c','v','b','n','m',',','.','/','Shift'],
    ['Space']
  ];

  let caps = false;
  let shift = false;

  function createKey(label){
    const key = document.createElement('div');
    key.className = 'key';
    if(label === 'Backspace' || label === 'Enter' || label === 'Shift' || label === 'CapsLock' || label === 'Tab') key.classList.add('wide');
    if(label === 'Space') key.classList.add('extra-wide');
    key.textContent = label;
    key.dataset.key = label;
    key.addEventListener('mousedown', e => e.preventDefault());
    key.addEventListener('click', onKey);
    return key;
  }

  function render(){
    keyboard.innerHTML = '';
    layout.forEach(row => {
      const r = document.createElement('div');
      r.className = 'row';
      row.forEach(k => r.appendChild(createKey(displayLabel(k))));
      keyboard.appendChild(r);
    });
    updateActiveStates();
  }

  function displayLabel(k){
    if(k.length === 1){
      if(shift) return k.toUpperCase();
      if(caps) return k.toUpperCase();
      return k.toLowerCase();
    }
    return k;
  }

  function onKey(e){
    const k = e.currentTarget.dataset.key;
    if(k === 'Backspace'){
      backspace();
    } else if(k === 'Enter'){
      insertText('\n');
    } else if(k === 'Tab'){
      insertText('\t');
    } else if(k === 'CapsLock'){
      caps = !caps; updateActiveStates(); render();
    } else if(k === 'Shift'){
      shift = !shift; updateActiveStates(); render();
      if(shift){
        // auto release shift after next keypress (common mobile behavior)
        setTimeout(()=>{ shift = false; updateActiveStates(); render(); }, 3000);
      }
    } else if(k === 'Space'){
      insertText(' ');
    } else {
      const ch = computeChar(k);
      insertText(ch);
      if(shift){ shift = false; updateActiveStates(); render(); }
    }
    // keep focus on the active input if possible
    if(activeElement && typeof activeElement.focus === 'function') activeElement.focus();
  }

  function computeChar(k){
    if(k.length === 1){
      if(shift) return k.toUpperCase();
      if(caps) return k.toUpperCase();
      return k.toLowerCase();
    }
    return '';
  }

  function updateActiveStates(){
    Array.from(document.querySelectorAll('.key')).forEach(el => {
      const k = el.dataset.key;
      el.classList.toggle('active', (k === 'CapsLock' && caps) || (k === 'Shift' && shift));
      // update single-character labels
      if(k.length === 1){
        el.textContent = displayLabel(k);
      }
    });
  }

  function insertText(text){
    const el = activeElement || defaultInput;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + text + after;
    const pos = start + text.length;
    el.selectionStart = el.selectionEnd = pos;
  }

  function backspace(){
    const el = input;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    if(start === end && start > 0){
      el.value = el.value.slice(0,start-1) + el.value.slice(end);
      el.selectionStart = el.selectionEnd = start-1;
    } else if(start !== end){
      el.value = el.value.slice(0,start) + el.value.slice(end);
      el.selectionStart = el.selectionEnd = start;
    }
  }

  // show keyboard when inputs/textarea/contenteditable receive focus
  function showKeyboard(target){
    activeElement = target || defaultInput;
    keyboard.classList.add('visible');
  }

  function hideKeyboard(){
    keyboard.classList.remove('visible');
  }

  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if(t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)){
      showKeyboard(t);
    }
  });

  // Prevent hiding when interacting with keyboard
  let pointerDownOnKeyboard = false;
  keyboard.addEventListener('pointerdown', () => { pointerDownOnKeyboard = true; });
  document.addEventListener('pointerup', () => { setTimeout(()=> pointerDownOnKeyboard = false, 0); });

  document.addEventListener('focusout', (e) => {
    setTimeout(()=>{
      const af = document.activeElement;
      if(pointerDownOnKeyboard) return; // interacting with keyboard
      if(af && (af.tagName === 'INPUT' || af.tagName === 'TEXTAREA' || af.isContentEditable)) return;
      hideKeyboard();
    }, 50);
  });

  // clicking on keyboard should not blur the active input
  keyboard.addEventListener('mousedown', e => e.preventDefault());

  render();

  // Toggle button support
  const toggleBtn = document.getElementById('kb-toggle');
  if(toggleBtn){
    toggleBtn.addEventListener('click', () => {
      const shown = keyboard.classList.toggle('visible');
      toggleBtn.classList.toggle('active', shown);
      toggleBtn.setAttribute('aria-pressed', String(shown));
      if(shown){
        const af = document.activeElement;
        if(af && (af.tagName === 'INPUT' || af.tagName === 'TEXTAREA' || af.isContentEditable)){
          showKeyboard(af);
          af.focus();
        } else {
          showKeyboard(defaultInput);
          defaultInput.focus();
        }
      } else {
        hideKeyboard();
      }
    });
  }

  // Expose programmatic controls
  window.showVirtualKeyboard = (target) => {
    showKeyboard(target || defaultInput);
    if(toggleBtn){ toggleBtn.classList.add('active'); toggleBtn.setAttribute('aria-pressed','true'); }
  };
  window.hideVirtualKeyboard = () => {
    hideKeyboard();
    if(toggleBtn){ toggleBtn.classList.remove('active'); toggleBtn.setAttribute('aria-pressed','false'); }
  };
  window.toggleVirtualKeyboard = () => {
    const shown = keyboard.classList.toggle('visible');
    if(shown){
      const af = document.activeElement;
      showKeyboard((af && (af.tagName === 'INPUT' || af.tagName === 'TEXTAREA' || af.isContentEditable)) ? af : defaultInput);
    } else {
      hideKeyboard();
    }
    if(toggleBtn){ toggleBtn.classList.toggle('active', shown); toggleBtn.setAttribute('aria-pressed', String(shown)); }
    return shown;
  };

  // Show keyboard immediately on load
  window.showVirtualKeyboard();

})();
