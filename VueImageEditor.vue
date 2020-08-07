<template>
  <div>
    <div>
      <canvas
        :width="canvasWidth"
        :height="canvasHeight"
        :class="[grabState]"
        @mousedown.stop="onGrabStart"
        @mousemove.stop="onGrabMove"
        @mouseup.stop="onGrabStop"
        @mouseleave.stop="onGrabStop"
        ref="canvas">
      </canvas>
      <input
        type="file"
        v-show="false"
        accept=".bmp, .png, .jpg, .jpeg"
        @change="addImage"
        ref="fileInput"
      >
    </div>
  </div>

</template>
<script>
export default {
  name: 'vue-image-editor',
  props: {
    canvasWidth: {
      type: Number,
      default: 300
    },
    canvasHeight: {
      type: Number,
      default: 300
    },
    rotation: {
      type: Number,
      default: 0
    },
    clipThickNess: {
      type: Number,
      default: 5
    },
    imageQuality: {
      type: Number,
      default: 1,
      validator (quality) {
        return quality >= 0 && quality <= 1
      }
    },
    imageExtension: {
      type: String,
      default: 'png',
      validator (extension) {
        return ['bmp', 'png', 'jpg', 'jpeg'].includes(extension)
      }
    }
  },
  data () {
    return {
      isGrabbing: false,
      isImageLoaded: false,
      canvas: null,
      context: null,
      fileInput: null,
      image: null,
      blobURL: null,
      naturalImageWidth: 0,
      naturalImageHeight: 0,
      scale: 1,
      scaleStep: 0.05,
      movementX: 0,
      movementY: 0,
      nextX: 0,
      nextY: 0
    }
  },
  computed: {
    grabState () {
      return {
        '--cursor-grab': this.isImageLoaded && !this.isGrabbing,
        '--cursor-grabbing': this.isImageLoaded && this.isGrabbing
      }
    },
    toRadian () {
      return this.rotation * (Math.PI / 180)
    }
  },
  watch: {
    rotation (newVal, oldVal) {
      if (newVal !== oldVal) this.repaint()
    }
  },
  mounted () {
    this.canvas = this.$refs.canvas
    this.context = this.$refs.canvas.getContext('2d')
    this.fileInput = this.$refs.fileInput

    this.canvas.addEventListener('wheel', this.onResizeByWheel)
  },
  methods: {
    onGrabStart () {
      this.isGrabbing = true
    },
    onGrabMove (event) {
      if (!this.isGrabbing || !this.isImageLoaded) return
      this.movementX = event.movementX
      this.movementY = event.movementY
      this.repaint()
    },
    onGrabStop () {
      this.isGrabbing = false
    },
    onResizeByWheel (event) {
      if (this.isGrabbing || !this.isImageLoaded) return
      event.stopPropagation()
      event.preventDefault()
      this.scale += (
        event.deltaY < 0
          ? this.scaleStep
          : this.scaleStep * -1
      )
      this.repaint()
    },
    loadImage () {
      this.$emit('editor-refreshed')
      this.clearControlValue()
      this.clearCanvas()
      this.clearFile()
      this.fileInput.click()
    },
    addImage (event) {
      const imageFile = event.target.files[0]
      if (!imageFile.type.startsWith('image')) return
      this.image = new Image()
      this.image.addEventListener('load', () => {
        this.$emit('image-loaded')
        this.isImageLoaded = true
        this.naturalImageWidth = this.image.width
        this.naturalImageHeight = this.image.height
        this.repaint()
      })
      this.blobURL = URL.createObjectURL(imageFile)
      this.image.src = this.blobURL
    },
    saveImage () {
      return new Promise((resolve, reject) => {
        if (!this.isImageLoaded) reject(new Error('이미지를 먼저 로드해야 합니다.'))
        this.canvas.toBlob(
          (blob) => { resolve(blob) },
          `image/${this.imageExtension}`,
          this.imageQuality
        )
      })
    },
    calculateInitialPosition () {
      const imageRatio = this.image.width / this.image.height
      let newWidth = this.canvasWidth
      let newHeight = newWidth / imageRatio

      if (newHeight > this.canvasHeight) {
        newHeight = this.canvasHeight
        newWidth = newHeight * imageRatio
      }

      const offsetX = newWidth < this.canvasWidth ? ((this.canvasWidth - newWidth) / 2) : 0
      const offsetY = newHeight < this.canvasHeight ? ((this.canvasHeight - newHeight) / 2) : 0

      return {
        offsetX,
        offsetY,
        newWidth,
        newHeight
      }
    },
    calculateNextPosition () {
      const { offsetX, offsetY, newWidth, newHeight } = this.calculateInitialPosition()

      if (this.nextX === 0 && this.nextY === 0) {
        this.nextX = offsetX
        this.nextY = offsetY
      } else {
        this.nextX += this.movementX
        this.nextY += this.movementY
      }

      this.movementX = 0
      this.movementY = 0

      const scaledWidth = newWidth * this.scale
      const scaledHeight = newHeight * this.scale
      const widthDiff = (scaledWidth - newWidth) / 2
      const heightDiff = (scaledHeight - newHeight) / 2
      const x = this.nextX / this.scale
      const y = this.nextY / this.scale
      let { rx, ry } = this.reflectAngleToPosition(x, y)
      rx += -widthDiff
      ry += -heightDiff

      return {
        nextX: rx,
        nextY: ry,
        nextWidth: scaledWidth,
        nextHeight: scaledHeight
      }
    },
    reflectAngleToPosition (x, y) {
      const radian = -this.toRadian
      const rx = x * Math.cos(radian) - y * Math.sin(radian)
      const ry = x * Math.sin(radian) + y * Math.cos(radian)
      return { rx, ry }
    },
    repaint () {
      if (!this.isImageLoaded) return
      this.clearCanvas()
      this.context.save()
      const { nextX, nextY, nextWidth, nextHeight } = this.calculateNextPosition()
      this.drawClippingArea()
      this.context.translate((this.canvasWidth / 2), (this.canvasHeight / 2))
      this.context.rotate(this.toRadian)
      this.context.scale(this.scale, this.scale)
      this.context.translate((this.canvasWidth / -2), (this.canvasHeight / -2))
      this.context.drawImage(
        this.image,
        nextX,
        nextY,
        nextWidth,
        nextHeight
      )
      this.context.restore()
    },
    drawClippingArea () {
      this.context.globalCompositeOperation = 'source-over'
      this.context.beginPath()
      this.context.moveTo(this.clipThickNess, this.clipThickNess)
      this.context.lineTo(this.canvasWidth - this.clipThickNess, this.clipThickNess)
      this.context.lineTo(this.clipThickNess, this.canvasHeight - this.clipThickNess)
      this.context.moveTo(this.canvasWidth - this.clipThickNess, this.canvasHeight - this.clipThickNess)
      this.context.lineTo(this.clipThickNess, this.canvasHeight - this.clipThickNess)
      this.context.lineTo(this.canvasWidth - this.clipThickNess, this.clipThickNess)
      this.context.clip()
    },
    clearControlValue () {
      this.scale = 1
      this.nextX = 0
      this.nextY = 0
    },
    clearCanvas () {
      this.context.setTransform(1, 0, 0, 1, 0, 0)
      this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
    },
    clearFile () {
      if (this.blobURL) URL.revokeObjectURL(this.blobURL)
      if (this.image) this.image.remove()
      this.image = null
      this.fileInput.value = null
      this.isImageLoaded = false
    }
  }
}
</script>
<style lang="scss" scoped>
  canvas{
    border: 1px solid black;
  }
  .--cursor-grab{
      cursor: grab;
      cursor: -webkit-grab;
      cursor: -moz-grab;
  }
  .--cursor-grabbing{
      cursor: grabbing;
      cursor: -webkit-grabbing;
      cursor: -moz-grabbing;
  }
</style>
