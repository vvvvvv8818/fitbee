from picamera import PiCamera
from time import sleep
import sys 
import requests

camera = PiCamera()

camera.stop_preview()
sleep(1)
print("3")
sys.stdout.flush()
sleep(1)
print("2")
sys.stdout.flush()
sleep(1)
print("1")
sys.stdout.flush()
sleep(1)
camera.capture('/home/pi/piserver_me/public/body.jpg')

url = 'http://13.124.65.48:3000/user/bodypic/'+sys.argv[1]
files = {'image':open('/home/pi/piserver_me/public/body.jpg','rb')}
r = requests.post(url,files=files)
print(r.text)

