
from picamera import PiCamera
from picamera.array import PiRGBArray
import time
import cv2
import random
import numpy as np
import sys

camera = PiCamera()
camera.resolution = (320, 240)
camera.framerate = 10
rawCapture = PiRGBArray(camera, size=(320,240))
mog2 = cv2.createBackgroundSubtractorMOG2(history=1000,varThreshold=100,detectShadows=False)
# allow the camera to warmup
time.sleep(1)

img = cv2.imread("./public/workout5.png")
img2 = cv2.imread("./public/workout6.png")
back10 = cv2.imread("./public/back.jpg")
#temp123123 = cv2.resize(back10, (320,240),interpolation=cv2.INTER_CUBIC)
ret, img = cv2.threshold(img,10,255,cv2.THRESH_BINARY)
ret, img2 = cv2.threshold(img2,10,255,cv2.THRESH_BINARY)
img_ = img[:img.shape[0],:img.shape[1],0]
img2_ = img2[:img2.shape[0],:img2.shape[1],0]
#cv2.resize(img,(10,10),cv2.INTER_CUBIC)
#cv2.imwrite("aa.jpg",img)
count = 0
count_check = 0
maxFrame = 10
kernel = np.ones((1,1), np.uint8)
global similar
similar = 0
global check1
check1 = 0
global check2
check2 = 0

def pixelCompare(m1,m2):
	#matchCount : m1 == m2
	matchCount = 0
	#255(white) pixel total
	totalCount = 0
	for i in range(0,m1.shape[0]-1):
		for j in range(0,m1.shape[1]-1):
			#b1 = m1[i,j,0]
			#g1 = m1[i,j,1]
			#r1 = m1[i,j,2]
			#color = (int(b1)+int(g1)+int(r1))/3.0			
			color = m1[i,j]
			b2 = m2[i,j,0]
			g2 = m2[i,j,1]
			r2 = m2[i,j,2]
			color2 = (int(b2)+int(g2)+int(r2))/3.0			
			
			if color  == 255:
				totalCount+= 1
				if color == color2:
					matchCount+=1
	similar = (float(matchCount) / float(totalCount)) * 100.0			
	#print("match"+str(matchCount))
	#print("total"+str(totalCount))
	#print("similar"+str(similar))
	return similar
try :
	frmask = mog2.apply(back10)
	global back
	back = mog2.getBackgroundImage()
	#cv2.imshow("back",back10)		#count = count + 1
    #capture frames from the camera
	for cap in camera.capture_continuous(rawCapture,format="bgr", use_video_port=True):
		similar = 0
		frame = cap.array
		#if count<maxFrame :
		#	count = count + 1
		#elif count == maxFrame:
		#else :	
		#frame = cv2.cvtColor(frame,cv2.COLOR_RGB2GRAY)
		#frame3 = cv2.absdiff(frame2,img)
		#ret, frame3 = cv2.threshold(frame3,120,255,cv2.THRESH_BINARY)
		#ret, frmask = cv2.threshold(frame2,140,255,cv2.THRESH_BINARY)
		#frame2 = frame - img
		#frame2  = skinDetect(frame);
		#frmask = mog2.apply(frame,learningRate =0.01) 
			#frame3 = cv2.absdiff(frame,back)
			
		frame3 = cv2.absdiff(back,frame)
		frame3 = cv2.dilate(frame3,kernel,iterations=1)
		frame3 = cv2.cvtColor(frame3,cv2.COLOR_RGB2GRAY)
		ret, frame4 = cv2.threshold(frame3,40,255,cv2.THRESH_BINARY)
		#	frame4 = cv2.dilate(frame4,kernel,iterations=3)
			#cv2.imshow("frame4",frame4)
		frame5 = frame4.copy()
		close = np.ones((4,4),np.uint8,3)
		frame5 = cv2.morphologyEx(frame5,cv2.MORPH_CLOSE,close)			
		frame6 =frame5.copy()
		h,w = frame6.shape[:2]
		mask = np.zeros((h+2,w+2),np.uint8)
		frame6[0,:w] = 0
		frame6[h-1,:w] = 0
		frame6[:h,0] = 0
		frame6[:h,w-1] = 0
		cv2.floodFill(frame6,mask,(0,0),255)
		frame6_inv = cv2.bitwise_not(frame6)
		frame6 = frame5 | frame6_inv
		numOfLables, img_label, stats, centroids = cv2.connectedComponentsWithStats(frame4)
		for idx, centroid in enumerate(centroids):  
			if stats[idx][0] == 0 and stats[idx][1] == 0:  
				continue  
			if np.any(np.isnan(centroid)):  
				continue  
			x, y, width, height, area = stats[idx]  
			centerX, centerY = int(centroid[0]), int(centroid[1])  
			
			if area > 5000 and width>50 and height>150 :
				cv2.rectangle(frame, (x, y), (x+width, y+height), (0, 0, 255))  
				global crop
				crop = frame6[y:y+height,x:x+width]
				#crop = cv2.resize(crop,(129,129),cv2.INTER_CUBIC)
				#print("asdf"+str(crop.shape))
				#print("zzz"+str(img.shape))
				if check1==0:
					img__= cv2.resize(img_, (crop.shape[1],crop.shape[0]), interpolation=cv2.INTER_CUBIC)
					#similar = pixelCompare(crop,img)
					similar = cv2.matchTemplate(crop,img__,cv2.TM_CCOEFF_NORMED)
					#cv2.imshow("img",img__)
					similar = np.mean(similar)
					if similar > 0.5:
						#print("similar1 : "+str(similar))
						check1 = 1
				else: 
					if check2 ==0:
						img2__= cv2.resize(img2_, (crop.shape[1],crop.shape[0]), interpolation=cv2.INTER_CUBIC)
						#similar = pixelCompare(crop,img2)
						similar = cv2.matchTemplate(img2__,crop,cv2.TM_CCOEFF_NORMED)
						similar = np.mean(similar)
						#cv2.imshow("img",img2__)
						if similar > 0.5:
							#print("similar2 : "+str(similar))
							check2 = 1
									
				if check1 == 1 and check2 == 1:
					count_check += 1
					print(count_check)
					sys.stdout.flush()
					check1 = 0
					check2 =0
				
				#cv2.imshow("crop",crop)
					


			#cv2.putText(frame, 'similar :'+str(similar), (10,100), cv2.FONT_HERSHEY_SIMPLEX, 1, (255,0,0))
			if count_check == 2:
				break;
			cv2.imshow("frame",frame)
			#cv2.imshow("frame6",frame6)
		
		rawCapture.truncate(0)

		key = cv2.waitKey(30) & 0xff
		if key == ord("q"):
			break
finally :
	camera.close()


