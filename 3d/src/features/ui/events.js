export function setupUIEvents(appState) {
  // Accordion functionality
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const accordion = header.parentElement;
      const isActive = accordion.classList.contains('active');
      
      // Close all other accordions
      document.querySelectorAll('.accordion.active').forEach(acc => {
        if (acc !== accordion) acc.classList.remove('active');
      });
      
      // Toggle current accordion
      accordion.classList.toggle('active');
    });
  });

  // Custom object type selector - show/hide parameter divs
  const objTypeSelect = document.getElementById('objType');
  if (objTypeSelect) {
    const updateParamVisibility = () => {
      const type = objTypeSelect.value;
      document.querySelectorAll('[data-param-type]').forEach(div => {
        div.style.display = div.getAttribute('data-param-type') === type ? 'block' : 'none';
      });
    };
    
    objTypeSelect.addEventListener('change', updateParamVisibility);
    updateParamVisibility(); // Initial state
  }

  // Create object button
  const createObjBtn = document.getElementById('createObj');
  if (createObjBtn) {
    createObjBtn.addEventListener('click', () => {
      appState.createCustomObject();
    });
  }
}
