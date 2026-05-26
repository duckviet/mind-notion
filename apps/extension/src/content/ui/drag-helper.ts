export class DragHelper {
  private isDragging = false;
  private currentX = 0;
  private currentY = 0;
  private initialX = 0;
  private initialY = 0;
  private xOffset = 0;
  private yOffset = 0;
  private el: HTMLElement;

  constructor(el: HTMLElement, initialXOffset: number, initialYOffset: number) {
    this.el = el;
    this.xOffset = initialXOffset;
    this.yOffset = initialYOffset;

    this.dragStart = this.dragStart.bind(this);
    this.drag = this.drag.bind(this);
    this.dragEnd = this.dragEnd.bind(this);

    this.setup();
  }

  private setup() {
    this.el.addEventListener("mousedown", this.dragStart);
    document.addEventListener("mousemove", this.drag);
    document.addEventListener("mouseup", this.dragEnd);
  }

  public destroy() {
    this.el.removeEventListener("mousedown", this.dragStart);
    document.removeEventListener("mousemove", this.drag);
    document.removeEventListener("mouseup", this.dragEnd);
  }

  private dragStart(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-mn-drag-handle]")) {
      return;
    }

    this.initialX = e.clientX - this.xOffset;
    this.initialY = e.clientY - this.yOffset;
    this.isDragging = true;
    this.el.style.cursor = "grabbing";
  }

  private drag(e: MouseEvent) {
    if (!this.isDragging) return;

    e.preventDefault();
    this.currentX = e.clientX - this.initialX;
    this.currentY = e.clientY - this.initialY;

    this.xOffset = this.currentX;
    this.yOffset = this.currentY;

    this.setTranslate(this.currentX, this.currentY, this.el);
  }

  private dragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.el.style.cursor = "default";
  }

  private setTranslate(xPos: number, yPos: number, el: HTMLElement) {
    el.style.left = `${xPos}px`;
    el.style.top = `${yPos}px`;
  }
}
