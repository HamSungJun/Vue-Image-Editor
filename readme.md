# Vue-Image-Editor
로컬 이미지를 HTML 캔버스에 로드하여 다음의 작업을 할 수 있습니다.
- 마우스 드래그를 통한 이미지 이동
- 마우스 휠을 통한 이미지 스케일 조정
- 임의의 Input이 전달하는 값을 통한 이미지 회전
- 편집된 이미지 데이터(Blob) 반환

## Installation
`@vue/cli`와 `node-sass`를 사용하는 Vue 개발 환경에서 이용가능합니다.
```
$ npm install vue-image-editor --save
```

## Usage

```vue
<template>
  <div>
    <vue-image-editor
      :canvasWidth="300"
      :canvasHeight="300"
      :rotation="Number(rotation)"
      :clipThickNess="5"
      :imageQuailty="1"
      :imageExtension="'png'"
      @editor-refreshed="onRefresh"
      @image-loaded="onLoad"
      ref="imageEditor"
    />
    <button @click="load">불러오기</button>
    <button @click="save">저장</button>
    <div>
      <input type="range" min="0" max="360" step="1" v-model="rotation">
    </div>
  </div>
</template>

<script>

export default {
  name: 'user-view',
  data () {
    return {
      rotation: 0
    }
  },
  methods: {
    load () {
      this.$refs.imageEditor.loadImage()
    },
    save () {
      this.$refs.imageEditor.saveImage()
        .then(blob => {
          /* process modified image blob */
        })
        .catch(err => {
          /* handle error */
        })
    },
    onRefresh () {
      this.rotation = 0
    },
    onLoad(){
      /* activate control input, button */
    }
  }
}
</script>
```
## Props
| Prop                   | Type     | Default | Description
| ---------------------- | -------- |-------- |---------------
| canvasWidth                | Number | 300 | 캔버스의 절대 너비를 지정합니다. (px)
| canvasHeight                | Number | 300 | 캔버스의 절대 높이를 지정합니다. (px)
| clipThickNess                 | Number | 5 | 캔버스 가장자리 잘라내기 영역의 두께를 지정합니다. (px)
| imageQuality                  | Number | 1 | 이미지 편집후 반환받을 이미지의 품질을 지정합니다. (0 ~ 1)
| imageExtension                  | String | png | 반환받은 Blob 데이터의 확장자를 지정합니다.
| rotation               | Number   | 0 |임의의 Input 엘리먼트를 통해 rotation값을 주입해주면 이미지를 회전 시킬 수 있습니다.

## Event & Methods

`@editor-refreshed`
> 모듈 내부 Hidden File Input을 통해 파일을 로드하게 되면 발생하는 이벤트입니다. 이 이벤트 상황에서 이전 편집내용을 초기화하기 적당합니다. 예를 들면 회전값을 다시 0으로 설정하는 경우가 될 수 있습니다.

`@image-loaded`
> 캔버스에 이미지가 온전히 로드되었을때 발생하는 이벤트 입니다. 이때 이미지 저장 버튼이나 컨트롤 요소들을 활성화 하기 적당합니다.

`imageEditor.loadImage()`
> 에디터에 이미지를 로드하기 위해 파일 인풋에 클릭 이벤트를 가하는 메소드 입니다.

`imageEditor.saveImage()`
> Promise로 구현되었으며 편집한 이미지 내용을 저장하기 위해 존재하는 메소드입니다. 메소드를 실행하게 되면 캔버스에 나타나는 이미지의 모습 그대로 Blob 데이터로 반환받습니다. 이때 Blob 데이터의 확장자는 입력한 imageExtension 속성을 통해 지정할 수 있습니다.

## Patch Notes

`v1.0.2`
- 이전 수정값을 초기화 하지 않았던 문제로 인한 첫 이미지 로드위치 조정
- 낮은 스케일에서는 높은 민감도로 이미지 이동, 높은 스케일에서는 낮은 민감도로 이미지 이동
