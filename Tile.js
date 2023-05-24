export default class Tile {
    #tileElement 
    #x
    #y
    #value

    constructor(tileContainer, value = (Math.random() > .1 ? 2 : 4)) {
        this.#tileElement = document.createElement("div")
        this.#tileElement.classList.add("tile")
        tileContainer.append(this.#tileElement)
        this.value = value

        // console.log(this.#tileElement)
    }

    set value(val) {
        this.#value = val
        this.#tileElement.textContent = val
        const power = Math.log2(val)
        const bgLightness = 100 - power * 9
        this.#tileElement.style.setProperty("--background-lightness", `${bgLightness}%`)
        this.#tileElement.style.setProperty("--text-lightness", `${bgLightness <= 50 ? 90 : 10}%`)
    }

    set x(value) {
        this.#x = value
        this.#tileElement.style.setProperty("--x", value)
    }
    
    set y(value) {
        this.#y = value
        this.#tileElement.style.setProperty("--y", value)
    }
}