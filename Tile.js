export default class Tile {
  #tileElement;
  #x;
  #y;
  #value;

  constructor(tileContainer, diff) {
    let num1 = 0;
    let num2 = 0;
    if (diff === 0) {
      num1 = 8;
      num2 = 16;
    }
    if (diff === 1) {
      num1 = 4;
      num2 = 8;
    }
    if (diff === 2) {
      num1 = 2;
      num2 = 4;
    }

    console.log(num1);
    console.log(num2);

    let val = Math.random() > 0.1 ? num1 : num2;
    this.#tileElement = document.createElement("div");
    this.#tileElement.classList.add("tile");
    tileContainer.append(this.#tileElement);
    this.value = val;

    // console.log(this.#tileElement)
  }

  get value() {
    return this.#value;
  }

  set value(val) {
    this.#value = val;
    this.#tileElement.textContent = val;
    const power = Math.log2(val);
    const bgLightness = 100 - power * 9;
    this.#tileElement.style.setProperty(
      "--background-lightness",
      `${bgLightness}%`
    );
    this.#tileElement.style.setProperty(
      "--text-lightness",
      `${bgLightness <= 50 ? 90 : 10}%`
    );
  }

  set x(value) {
    this.#x = value;
    this.#tileElement.style.setProperty("--x", value);
  }

  set y(value) {
    this.#y = value;
    this.#tileElement.style.setProperty("--y", value);
  }

  remove() {
    this.#tileElement.remove();
  }

  waitForTransition() {
    return new Promise((resolve) => {
      this.#tileElement.addEventListener("transitionend", resolve, {
        once: true,
      });
    });
  }
}
