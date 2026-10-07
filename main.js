const worker = new Worker("worker.js", {type: "module"})

// rangeInput - width of the curvature/bezel
const bezelWidthRange = document.getElementById("bezel-width")

// radioInput - curvature option[circle, squircle]
const lensOptions = document.querySelectorAll("[name=\"lens-curvature\"]")
console.log("Lens options: ", lensOptions)

// images where will be visualized the displacement maps
// first image will host the displacement map based on circle curvature
// the second image will host the displacement map based on squircle curvature
const images = document.getElementsByTagName("img")

const displacementMapsURLs = {
    circleDispMapURL: null,
    squircleDispMapURL: null
}

// function makeDisplacementMap(){
//     worker.postMessage({isSquircle: false, bezelWidth: bezelWidthRange.defaultValue}, [offscreenCircle])
//     worker.postMessage({canvas: offscreenSquircle, isSquircle: true, bezelWidth: bezelWidthRange.defaultValue}, [offscreenSquircle])
// }
function makeDisplacementMaps(bezelWidth){
    worker.postMessage({isSquircle: false, bezelWidth: bezelWidth})
    worker.postMessage({isSquircle: true, bezelWidth: bezelWidth})
}   

worker.onmessage = function (event) {
    console.log("Message received back")
    const { blob, isSquircle } = event.data
    // revoke earlier png url blobs so png blobs are deallocated from memory
    if(isSquircle){
        URL.revokeObjectURL(displacementMapsURLs.squircleDispMapURL)
        displacementMapsURLs.squircleDispMapURL = URL.createObjectURL(blob)
        // second image is the displacement base on squircle curvature
        images[1].src = displacementMapsURLs.squircleDispMapURL
    }
    else{
        URL.revokeObjectURL(displacementMapsURLs.circleDispMapURL)
        displacementMapsURLs.circleDispMapURL = URL.createObjectURL(blob) 
        // first image is the displacement base on circular curvature
        images[0].src = displacementMapsURLs.circleDispMapURL
    }
    const feImage = document.getElementById("disp")
    // if options are selected load the correspondent selected option
    if(lensOptions[0].checked){
        feImage.setAttribute("href", displacementMapsURLs.circleDispMapURL)
    }
    else if(lensOptions[1].checked){
        feImage.setAttribute("href", displacementMapsURLs.squircleDispMapURL)
    }
    // if no input has checked load the displacement based on circle curvature
    else{
        lensOptions[0].checked = true
        feImage.setAttribute("href", displacementMapsURLs.circleDispMapURL)
    }
}


bezelWidthRange.addEventListener("input", (event) => {
    console.log("Actual bezel value:", event.target.value)
    makeDisplacementMaps(event.target.value)
})

const feImage = document.getElementById("disp")
lensOptions.forEach(radioOption => {
    radioOption.addEventListener("change", event => {
        if(event.target.value === "circle"){
            feImage.setAttribute("href", displacementMapsURLs.circleDispMapURL)
        }
        else if(event.target.value === "squircle"){
            feImage.setAttribute("href", displacementMapsURLs.squircleDispMapURL)
        }
    })
})

makeDisplacementMaps(bezelWidthRange.defaultValue)