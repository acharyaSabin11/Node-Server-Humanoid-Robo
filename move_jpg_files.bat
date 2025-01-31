@echo off

REM Set source and target paths
set src_path=./frames
set base_target_path=./saved

REM Initialize folder count
set /a folder_count=1

REM Create new target folder if it doesn't exist
:CreateFolder
set "target_folder=%base_target_path%\folder%folder_count%"
if exist "%target_folder%" (
    set /a folder_count+=1
    goto CreateFolder
)
mkdir "%target_folder%"

REM Move only .jpg files
for %%f in ("%src_path%\*.jpg") do (
    move "%%f" "%target_folder%"
)

echo All .jpg files moved to %target_folder%.
pause
