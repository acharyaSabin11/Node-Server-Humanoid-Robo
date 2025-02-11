import sys
from ultralytics import YOLO

if len(sys.argv) == 2:
    print(f"Converting {sys.argv[1]}")
    model = YOLO(sys.argv[1])
    model.export(format='onnx')
else:
    print("Error: Provide one argument")