var meses = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL",
    "MAYO", "JUNIO", "JULIO", "AGOSTO",
    "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];

let mesIndex = new Date().getMonth();
let anioActual = new Date().getFullYear();

var mesBox = document.getElementById("mesControl");
var anioBox = document.getElementById("anioControl");


function activarSwipe(elemento, onUp, onDown) {
    let startY = 0;
    let isMouseDown = false;

    // ===== MOBILE =====
    elemento.addEventListener("touchstart", e => {
        startY = e.touches[0].clientY;
    });

    elemento.addEventListener("touchend", e => {
        let endY = e.changedTouches[0].clientY;
        let diff = startY - endY;

        if (Math.abs(diff) < 30) return;

        diff > 0 ? onUp() : onDown();
    });

    // ===== DESKTOP (MOUSE DRAG) =====
    elemento.addEventListener("mousedown", e => {
        isMouseDown = true;
        startY = e.clientY;
    });

    document.addEventListener("mouseup", () => {
        isMouseDown = false;
    });

    elemento.addEventListener("mousemove", e => {
        if (!isMouseDown) return;

        let diff = startY - e.clientY;

        if (Math.abs(diff) < 30) return;

        diff > 0 ? onUp() : onDown();
        isMouseDown = false; // evita múltiples disparos
    });

    // ===== DESKTOP (WHEEL) =====
    elemento.addEventListener("wheel", e => {
        e.preventDefault(); // evita scroll de página
        e.deltaY < 0 ? onUp() : onDown();
    });
}
$(function () {
    if (mesBox) {
        mesBox.textContent = meses[mesIndex];
    }
    
    anioBox.textContent = anioActual;
});