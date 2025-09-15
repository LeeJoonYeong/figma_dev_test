// 태그의 텍스트를 바꾸는 함수

function changeText(tag, text, color) {
  tag.textContent = text;
  if (color) {
    tag.style.color = color;
  }
}

changeText(document.getElementById('title'), 'Hello World', 'red');



