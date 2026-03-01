const focusTitle = document.querySelector('#campaign-focus');
const chips = document.querySelectorAll('.chip');

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((item) => item.classList.remove('is-active'));
    chip.classList.add('is-active');
    focusTitle.textContent = chip.dataset.focus;
  });
});
