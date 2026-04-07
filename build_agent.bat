@echo off
echo Installing requirements...
pip install -r agent\requirements.txt
pip install pyinstaller

echo Building MedServ Diagnostic Agent Executable...
pyinstaller --noconfirm --onefile --windowed --noconsole --name "medserv_agent" "agent\main.py"

echo Build complete! Executable is located in dist\medserv_agent.exe
echo To build the final installer, open installer\MedServAgent.iss in Inno Setup.
pause
