const cv = require('opencv4nodejs');
const wCap = new cv.VideoCapture(0);
wCap.set(cv.CAP_PROP_FRAME_WIDTH, 1280)
wCap.set(cv.CAP_PROP_FRAME_HEIGHT, 720)

module.exports = (cb) => {
    let prevFrame = null;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    (async () => {
        while (true) {
            console.timeEnd('frame')
            console.time('frame')
            let originalFrame = wCap.read()
            let frame = originalFrame.rescale(0.5)
            // frame
            let grayFrame = frame.bgrToGray();

            grayFrame = grayFrame.gaussianBlur(new cv.Size(21, 21), 0)

            if (!prevFrame) {
                prevFrame = grayFrame;
                continue;
            }

            let diffFrame = prevFrame.absdiff(grayFrame);
            let thresh = diffFrame.threshold(10, 255, cv.THRESH_BINARY);

            thresh = thresh.dilate(new cv.Mat(), {
                iterations: 2
            })

            let cnts = thresh.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
            cnts.forEach(c => {
                if (c.area < 100) return;
                let rect = c.boundingRect()
                originalFrame.drawRectangle( 
                    new cv.Point2(rect.x * 2, rect.y * 2),
                    new cv.Point2( (rect.x + rect.width) * 2 , (rect.y + rect.height) * 2 ),
                    new cv.Vec(0, 255, 0), 
                    2
                )
                // originalFrame.drawRectangle(c.boundingRect(), new cv.Vec(0, 255, 0), 2)
            })

            cb(cv.imencode('.jpg', originalFrame))
            await delay(0);
            prevFrame = grayFrame;
        }
    })();
}


