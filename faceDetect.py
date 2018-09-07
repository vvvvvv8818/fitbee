from picamera import PiCamera
from picamera.array import PiRGBArray
import cv2


def detect(img, cascade) :
    rects = cascade.detectMultiScale(img, scaleFactor=1.3, minNeighbors=4, minSize=(30, 30),
                                     flags=cv2.CASCADE_SCALE_IMAGE)
    if len(rects) == 0 :
        return []

    rects[:,2:] += rects[:,:2]
    maxArea = 0
    maxX1 = 0 
    maxX2 = 0
    maxY1 = 0
    maxY2 = 0
    for x1, y1, x2, y2 in rects :
        w = abs(x1-x2)
        h = abs(y1-y2)
        area = w * h
        if maxArea < area : 
            maxArea = area
            maxX1 = x1 
            maxX2 = x2 
            maxY1 = y1 
            maxY2 = y2
    
    #print([maxX1, maxY1, maxX2, maxY2])
    return [[maxX1, maxY1, maxX2, maxY2]]



def draw_rects(img, rects, color, frameCnt) :
    #print(frameCnt)
    for x1, y1, x2, y2 in rects :    
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        cropped = img[y1+2:y2-2, x1+2:x2-2]
        cv2.imwrite("./faces/face"+str(frameCnt)+".png", cropped)



def main() :  
    try :
        camera = PiCamera()
        camera.resolution = (600, 480)
        camera.framerate = 32
        rawCapture = PiRGBArray(camera, size=(600, 480))
        cascade = cv2.CascadeClassifier("./haarcascade_frontalface_alt.xml")
        frameCnt = 0

        for frame in camera.capture_continuous(rawCapture, format="bgr", use_video_port=True):
            img = frame.array
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.equalizeHist(gray)
            rects = detect(gray, cascade)
            vis = img.copy()

            if len(rects) == 1 :
                frameCnt = frameCnt + 1
                draw_rects(vis, rects, (0, 255, 0), frameCnt)
            
            cv2.imshow("Login", vis)
            key = cv2.waitKey(1) & 0xFF
            rawCapture.truncate(0)

            if frameCnt >= 5 :
                return 1
            if key == ord('q') : 
                return 0
    except :
        return -1
        


print(main())
