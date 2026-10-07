const delta = 0.001

// equations of the "forms" of the glass
const height = (x) => Math.sqrt(1-(1-x)**2)
const heightWithSquircle = (x) => (1-(1-x)**4)**(1/4)


const calculateHeights = (distanceFromSide) => ({
    y: height(distanceFromSide),
    y1: height(distanceFromSide - delta),
    y2: height(distanceFromSide + delta)
})

const calculateHeightsOnSquircle = (distanceFromSide) => ({
    y: heightWithSquircle(distanceFromSide),
    y1: heightWithSquircle(distanceFromSide - delta),
    y2: heightWithSquircle(distanceFromSide + delta)
})

function calculateDisplacement(distanceFromSide, isSquircle){
    const {y, y1, y2} = isSquircle ? calculateHeightsOnSquircle(distanceFromSide) 
        : calculateHeights(distanceFromSide)
    const derivative = (y2-y1)/(2*delta)
    const normalInclination = Math.atan(1/(-derivative))
    // normal is leaning left, the result is a negative angle meaning is
    // calculated clockwise from x axis
    const angleOfIncidence = (Math.PI)/2 - (-normalInclination)
    // applying Snell's law
    const angleOfRefraction = Math.asin(Math.sin(angleOfIncidence)/1.5)
    // applying the third trigonometry theorem of rectangular triangle a = b * tan(alpha)
    const displacement = y * Math.tan(angleOfIncidence-angleOfRefraction)
    return displacement
}

// in canvas a pixel is represented as 4 bytes(red, green, blue, alpha)
// imageData is an array of all these bytes, one after another like this:
// [R, G, B, A, R2, G2, B2, A2, R3, G3, B3, A3 etc....]
// getPixel gets the all pixel indexes(R_index, G_index, B_index, A_index)
// inside the imageData array
const getPixel = (x, y, canvasWidth) => {
    const pixelStartIndex = y * (canvasWidth * 4) + x * 4
    // the blue channel is ignored so it won't be returned
    return [pixelStartIndex, pixelStartIndex + 1, pixelStartIndex + 3]
}

export {calculateDisplacement, getPixel}