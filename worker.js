// IMPORTANT NOTICE:
// Web workers does not have access to the DOM!!!
import { calculateDisplacement, getPixel } from "./utils.js"

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// TODO: pass isSquircle from main.js
// TODO: input based radius_zf
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

const canvasWidth = 513
const canvasHeight = 513
// radius of the trasversal section of the glass(it's like a circle)
const radius = 256
// for now it's a fixed number but after we will change it dinamically
// it's the radius of the flat zone
// Note that there is also the radius of the curved zone of the glass
// which is radius_zc = radius - radius_zf
// const radius_zf = 50
// const radius_zc = radius - radius_zf
// coordinates of the pixel of the center of thes circle
// [128-1][128-1] in js array index
const [x_center, y_center] = [257, 257]

self.onmessage = async function(event) {
    const {isSquircle, bezelWidth: radius_zc} = event.data
    const radius_zf = radius - radius_zc
    // a temporary offscreen canvas for pixel calculation
    // after it will be transformed in a png blob
    const tempCanvas = new OffscreenCanvas(canvasWidth, canvasHeight)
    const ctx = tempCanvas.getContext('2d')
    // imageData is the data structure that refers to the pixels of the canvas
    // it contains the array of bytes that represents the pixels(imageData.data)
    // and the width and the height of the canvas
    // imageData.data(which I called pixelArray) is an array of bytes of the canvas
    // representing the pixels of canvas.
    // Each byte refers to a pixel color(between red, green, blue, alpha) value 
    // every 4 bytes refer to the visual color of a pixel
    // The array looks like this
    // [R, G, B, A, R2, G2, B2, A2, R3, G3, B3, A3 etc....]
    // 1Byte(1 "object" of the array) is 8bit unsigned integer(0-255)
    // perfect in representing rgba values
    // all pixels are preset to transparent!!!
    const imageData = ctx.createImageData(canvasWidth, canvasHeight)
    const pixelArray = imageData.data
    // the center pixel is fixed to neutral as the surface in the center will
    // for sure be flat(no light refraction => no displacement)
    const [centerRedIndex, centerGreenIndex, centerAlphaIndex] = getPixel(x_center, y_center, canvasWidth)
    pixelArray[centerRedIndex] = 128
    pixelArray[centerGreenIndex] = 128
    pixelArray[centerAlphaIndex] = 255
    // calculation on colors on the 2 main diameters(horizontal and vertical)
    // we know that these pixels need to be colored because in the circle's radius
    // where displacement happen
    // (remember the circle is the trasversal section of the glass lens)
    const j = radius // center row(radius+1-1 in js index)
    for(let i=0; i<=radius-1; i++){
        // since we start from pixel (1,1) and not (0,0) we have to add 1 to both i and j
        const distanceFromCenter = (x_center + 1) - (i + 1)
        if(distanceFromCenter >= radius_zf){
            // calculating displacement magnitude
            const distanceFromSide = radius - distanceFromCenter
            // if it's the first pixel on the diameter right on the border
            // we give to this pixel a distanceFromSide 0.3 since the bending 
            // effect starts as soon as we are inside the glass and in most cases it's strong
            // so for more consistency we give to this border pixel a little distance from side
            // to compute a value different than the neutral color.
            // distanceFromSide here is normalized compared to the curved zone(radius_zc)
            const displacementMagnitude = distanceFromSide === 0 ? 
                calculateDisplacement((0.3/radius_zc), isSquircle) :
                calculateDisplacement((distanceFromSide/radius_zc), isSquircle)
            // calculating pixel color components(red and green)
            // follows the pixel on the first half of horizontal diameter
            // Note that I had the polar coordinates (displacementMagnitude, rho)
            // and I have to  convert into cartesian coordinates(because colors are vectors of displacement)
            // red = horizontal displacement
            // green = vertical displacement
            // assign pixel color
            // Elements stay on the horizontal diameter. rho is 0
            // (compared to the x axis, !!!measuring clockwise)
            // just displacementX counts because:
            // Math.cos(rho) = 1
            // Math.sin(rho) = 0
            const [redIndexLeft, greenIndexLeft, alphaIndexLeft] = getPixel(i, j, canvasWidth)
            pixelArray[redIndexLeft] = 128 + 127 * displacementMagnitude
            pixelArray[greenIndexLeft] = 128
            // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
            pixelArray[alphaIndexLeft] = 255

            // follows the pixel on the second half of horizontal diameter
            // rho is 180
            // just displacementX counts because:
            // Math.cos(rho) = -1
            // Math.sin(rho) = 0
            // assign pixel color
            const [redIndexRight, greenIndexRight, alphaIndexRight] = getPixel((canvasWidth-1)-i, j, canvasWidth)
            // Math.cos(rho=180) = -1 
            pixelArray[redIndexRight] = 128 - 127 * displacementMagnitude
            pixelArray[greenIndexRight] = 128
            // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
            pixelArray[alphaIndexRight] = 255

            // follows the pixel on the first half of vertical diameter
            // rho is 90
            // just displacementY counts because:
            // Math.cos(rho) = 0
            // Math.sin(rho) = 1
            // assign pixel color
            const [redIndexTop, greenIndexTop, alphaIndexTop] = getPixel(j, i, canvasWidth)
            pixelArray[redIndexTop] = 128
            pixelArray[greenIndexTop] = 128 + 127 * displacementMagnitude
            // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
            pixelArray[alphaIndexTop] = 255

            // follows the pixel on the first half of vertical diameter
            // rho is 270
            // just displacementY counts because:
            // Math.cos(rho) = 0
            // Math.sin(rho) = -1
            // assign pixel color
            const [redIndexBottom, greenIndexBottom, alphaIndexBottom] = getPixel(j, (canvasWidth-1)-i, canvasWidth)
            pixelArray[redIndexBottom] = 128
            pixelArray[greenIndexBottom] = 128 - 127 * displacementMagnitude
            // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
            pixelArray[alphaIndexBottom] = 255
        }
        else if(distanceFromCenter < radius_zf){
            // assign grey(neutral) color which means no displacement(we are in the flat zone)
            const [redIndexLeft, greenIndexLeft, alphaIndexLeft] = getPixel(i, j, canvasWidth)
            pixelArray[redIndexLeft] = 128
            pixelArray[greenIndexLeft] = 128
            // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
            pixelArray[alphaIndexLeft] = 255

            const [redIndexRight, greenIndexRight, alphaIndexRight] = getPixel((canvasWidth-1)-i, j, canvasWidth)
            pixelArray[redIndexRight] = 128
            pixelArray[greenIndexRight] = 128
            // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
            pixelArray[alphaIndexRight] = 255

            const [redIndexTop, greenIndexTop, alphaIndexTop] = getPixel(j, i, canvasWidth)
            pixelArray[redIndexTop] = 128
            pixelArray[greenIndexTop] = 128
            // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
            pixelArray[alphaIndexTop] = 255

            const [redIndexBottom, greenIndexBottom, alphaIndexBottom] = getPixel(j, (canvasWidth-1)-i, canvasWidth)
            pixelArray[redIndexBottom] = 128
            pixelArray[greenIndexBottom] = 128
            // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
            pixelArray[alphaIndexBottom] = 255
        }
    }
    // calculate the values of pixels inside the 
    // first section of the plane where sits the circle
    // (trasveral section of a glass lens)
    // iterating through positions 1 to 127(in js arrays 0-126)
    // we both calculate the pixel on the first section of the plane
    // and the symmetric pixel on the other 3 sections
    for(let i=0; i<=radius-1; i++){
        for(let j=0; j<=radius-1; j++){
            // since we start from pixel (1,1) and not (0,0) we have to add 1 to both i and j
            const distanceFromCenter = Number(Math.sqrt(((x_center + 1) - (i+1))**2 + ((y_center+1) - (j+1))**2).toFixed(6))
            if(distanceFromCenter <= radius && distanceFromCenter >= radius_zf){
                // calculate displacement magnitude
                const distanceFromSide = radius - distanceFromCenter
                // distanceFromSide here is normalized compared to the curved zone(radius_zc)
                const displacementMagnitude = calculateDisplacement(distanceFromSide/radius_zc, isSquircle)
                // calculate pixel color components(red and green)
                // first I need to know on which radius with which angle is stays
                // the angle(in radiants) is considered compared to x axis and measured clockwise
                const rho = Math.atan2(i+1, j+1)
                // now I can calculate pixel color components
                // Note that I had the polar coordinates (displacementMagnitude, rho)
                // and I converted into cartesian coordinates(because colors are vectors of displacement)
                // red = horizontal displacement
                // green = vertical displacement
                const displacementX = displacementMagnitude * Math.cos(rho)
                const displacementY = displacementMagnitude * Math.sin(rho)
                // assign pixel color(top left section of the plane)
                const [redIndexTopLeft, greenIndexTopLeft, alphaIndexTopLeft] = getPixel(i, j, canvasWidth)
                pixelArray[redIndexTopLeft] = 128 + 127 * displacementX
                pixelArray[greenIndexTopLeft] = 128 + 127 * displacementY
                // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
                pixelArray[alphaIndexTopLeft] = 255

                // assign pixel color(top right section of the plane)
                // displacementX = Math.cos(rho+math.pi/2) * magnitude = 
                // = -Math.cos(rho) * magnitude = -displacementX
                const [redIndexTopRight, greenIndexTopRight, alphaIndexTopRight] = getPixel((canvasWidth-1)-i, j, canvasWidth)
                pixelArray[redIndexTopRight] = 128 - 127 * displacementX
                pixelArray[greenIndexTopRight] = 128 + 127 * displacementY
                // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
                pixelArray[alphaIndexTopRight] = 255

                // assign pixel color(bottom left section of the plane)
                // displacementY = Math.sin(rho+3/4math.pi) * magnitude = 
                // -Math.sin(rho) * magnitude = -displacementY
                const [redIndexBottomLeft, greenIndexBottomLeft, alphaIndexBottomLeft] = getPixel(i, (canvasHeight-1)-j, canvasWidth)
                pixelArray[redIndexBottomLeft] = 128 + 127 * displacementX
                pixelArray[greenIndexBottomLeft] = 128 - 127 * displacementY
                // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
                pixelArray[alphaIndexBottomLeft] = 255

                // assign pixel color(bottom right section of the plane)
                // displacementX = Math.cos(rho+math.pi/2) * magnitude = 
                // = -Math.cos(rho) * magnitude = -displacementX
                // displacementY = Math.sin(rho+3/4math.pi) * magnitude = 
                // -Math.sin(rho) * magnitude = -displacementY
                const [redIndexBottomRight, greenIndexBottomRight, alphaIndexBottomRight] = getPixel((canvasWidth-1)-i, (canvasHeight-1)-j, canvasWidth)
                pixelArray[redIndexBottomRight] = 128 - 127 * displacementX
                pixelArray[greenIndexBottomRight] = 128 - 127 * displacementY
                // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
                pixelArray[alphaIndexBottomRight] = 255
            }
            else if(distanceFromCenter < radius_zf || distanceFromCenter > radius){
                // assign grey(neutral) color which means no displacement
                const [redIndexTopLeft, greenIndexTopLeft, alphaIndexTopLeft] = getPixel(i, j, canvasWidth)
                pixelArray[redIndexTopLeft] = 128
                pixelArray[greenIndexTopLeft] = 128
                // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
                pixelArray[alphaIndexTopLeft] = 255

                // the same for the symmetric pixels to this one(on top left section of the plane)
                const [redIndexTopRight, greenIndexTopRight, alphaIndexTopRight] = getPixel((canvasWidth-1)-i, j, canvasWidth)
                pixelArray[redIndexTopRight] = 128
                pixelArray[greenIndexTopRight] = 128
                // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
                pixelArray[alphaIndexTopRight] = 255

                const [redIndexBottomLeft, greenIndexBottomLeft, alphaIndexBottomLeft] = getPixel(i, (canvasHeight-1)-j, canvasWidth)
                pixelArray[redIndexBottomLeft] = 128
                pixelArray[greenIndexBottomLeft] = 128
                // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
                pixelArray[alphaIndexBottomLeft] = 255

                const [redIndexBottomRight, greenIndexBottomRight, alphaIndexBottomRight] = getPixel((canvasWidth-1)-i, (canvasHeight-1)-j, canvasWidth)
                pixelArray[redIndexBottomRight] = 128
                pixelArray[greenIndexBottomRight] = 128
                // fully opaque is 255. Note that alpha values also range from 0(transparent) to 255
                pixelArray[alphaIndexBottomRight] = 255
            }
        }
    }

    // for(let i=0; i<=(imageData.width) - 1; i++){
    //     const j = 127
    //     const [red, green, alpha] = getPixel(i, j, canvasWidth)
    //     console.log("Pixel:", red)
    //     console.log("central red: ", pixelArray[red])ss
    //     console.log("central green", pixelArray[green])
    //     console.log("central alpha", pixelArray[alpha])
    // }

    ctx.putImageData(imageData, 0, 0)
    const blob = await tempCanvas.convertToBlob()
    self.postMessage({blob, isSquircle})
}