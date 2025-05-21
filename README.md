# 🛸 AvianDroneSense-Hybrid-Detection-for-Sky-Surveillance

## 🔍 Overview

The **Drone vs Bird Detection System** is an intelligent real-time object detection tool that uses a YOLOv8 deep learning model to accurately distinguish between drones and birds from images, videos, and live camera feeds.

Built using the **Ultralytics YOLOv8** framework and integrated with a **Flask** web interface, the system can detect drones with high precision and perform automated actions like:
- Sounding an alarm if a drone is detected for more than 4 seconds.
- 
- 
-

This system is especially useful in **surveillance**, **aviation**, and **defense** sectors where distinguishing drones from birds is crucial.

---

## 📸 Project Preview

### 🖼️ Image Upload Interface
![Image Upload](images/interface.png)

### 🎥 Real-Time Detection Interface
![Real-time Detection](images/real_time_detection.png)

### 📦 Drone Detection Example
![Detection Example](images/detection_example.png)

> 📁 Replace the above image paths with actual screenshots of your project.

---

## 🚀 Features

- Real-time detection using webcam
- Upload image or video for detection
- 5-second drone presence timer with alarm
- 10-second video capture and save if drone is detected
- Automatic timestamp logging
- Clean, responsive Flask-based UI
- Model trained using custom YOLOv8 with annotated drone and bird dataset

---

## 🧠 Model

- **Framework**: [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)
- **Dataset**: Custom dataset (Birds and Drones), YOLO format
- **Classes**: `0: Bird`, `1: Drone`
- **Image size**: 640x640
- **Format**: `.pt` model weights

---

## 📂 Directory Structure

