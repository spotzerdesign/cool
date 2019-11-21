const icon = document.querySelector('.icon');
const filtertext = document.querySelector('.filtertext')
const inputs = document.querySelectorAll('input');

inputs.forEach (input => {
  input.addEventListener('change', handleUpdate);
  input.addEventListener('mousemove', handleUpdate);
});

function handleUpdate(e) {
  var filter = window.getComputedStyle(icon).getPropertyValue("filter")
  filtertext.textContent = "filter: " + filter + ";";
  if (this.id === 'invert') {
    icon.style.setProperty("--invert", this.value)
  } else if (this.id === 'sepia') {
    icon.style.setProperty("--sepia", this.value)
  } else if (this.id === 'saturate') {
    icon.style.setProperty("--saturate", this.value)
  } else if (this.id === 'hueRotate'){
    icon.style.setProperty("--hueRotate", this.value + "turn")
  } else if (this.id === 'brightness'){
    icon.style.setProperty("--brightness", this.value)
  }
}